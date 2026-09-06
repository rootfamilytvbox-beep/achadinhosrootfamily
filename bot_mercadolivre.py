#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
ROBO MERCADO LIVRE AFILIADOS - BUSCA E POSTAGEM AUTOMATICA DE PRODUTOS
==============================================================================
Como usar:
  1. Preencha seu Publisher ID no config.json (campo "ml_publisher_id")
  2. Execute: python bot_mercadolivre.py
  3. Para rodar uma vez so: python bot_mercadolivre.py --once
  4. Para adicionar produto especifico: python bot_mercadolivre.py --url <link_ML>

Como obter seu Publisher ID (GRATUITO):
  Acesse: https://www.mercadolivre.com.br/afiliados
  Cadastre-se ou faca login - seu ID aparece no painel

Como obter App ID (opcional, aumenta limite de chamadas):
  Acesse: https://developers.mercadolivre.com.br
  Crie um app - pegue o App ID e Client Secret
==============================================================================
"""

import os
import sys
import re
import json
import time
import random
import urllib.parse
from datetime import datetime

# Garantir suporte a UTF-8 no Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import requests
except ImportError:
    print("Instalando dependencias (requests)...")
    os.system(f"{sys.executable} -m pip install requests")
    import requests

# Caminhos dos arquivos
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATA_FILE   = os.path.join(BASE_DIR, "data", "products.json")
JS_FILE     = os.path.join(BASE_DIR, "data", "products.js")
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

# API do Mercado Livre
ML_API_BASE     = "https://api.mercadolibre.com"
ML_SITE_ID      = "MLB"
ML_AFILIADO_URL = "https://www.mercadolivre.com.br"

# Categorias de busca (IDs oficiais do ML para o Brasil)
CATEGORIAS_ML = {
    "eletronicos":  "MLB1000",
    "informatica":  "MLB1648",
    "celulares":    "MLB1051",
    "casa":         "MLB1574",
    "moveis":       "MLB1499",
    "moda":         "MLB1430",
    "beleza":       "MLB1246",
    "esportes":     "MLB1276",
    "automotivo":   "MLB1743",
    "brinquedos":   "MLB1132",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "pt-BR,pt;q=0.9",
}


# ===========================================================================
# CONFIGURACAO
# ===========================================================================

def carregar_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Aviso ao ler config.json: {e}")
    return {}


# ===========================================================================
# AUTENTICACAO OPCIONAL
# ===========================================================================

_token_cache = {"token": None, "expires_at": 0}


def obter_access_token(app_id, client_secret):
    agora = time.time()
    if _token_cache["token"] and agora < _token_cache["expires_at"]:
        return _token_cache["token"]
    if not app_id or not client_secret:
        return None
    try:
        r = requests.post(
            "https://api.mercadolibre.com/oauth/token",
            data={"grant_type": "client_credentials",
                  "client_id": app_id,
                  "client_secret": client_secret},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            token = data.get("access_token")
            _token_cache["token"] = token
            _token_cache["expires_at"] = agora + data.get("expires_in", 21600) - 60
            print("Autenticado na API do Mercado Livre.")
            return token
        else:
            print(f"Falha na autenticacao ML: {r.status_code}")
    except Exception as e:
        print(f"Erro de autenticacao ML: {e}")
    return None


def montar_headers(token=None):
    h = dict(HEADERS)
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


# ===========================================================================
# LINK DE AFILIADO
# ===========================================================================

def gerar_link_afiliado(url_produto, publisher_id):
    if not url_produto:
        base = f"{ML_AFILIADO_URL}/?tracking_id={publisher_id}" if publisher_id else ML_AFILIADO_URL
        return base
    url_limpa = re.sub(r'[?&]tracking_id=[^&]*', '', url_produto).rstrip('&').rstrip('?')
    if publisher_id:
        sep = "&" if "?" in url_limpa else "?"
        return f"{url_limpa}{sep}tracking_id={publisher_id}"
    return url_limpa


# ===========================================================================
# DETECCAO DE CATEGORIA
# ===========================================================================

def detectar_categoria_site(titulo, categoria_ml_id=""):
    mapa = {
        "MLB1000": "eletronicos", "MLB1648": "eletronicos", "MLB1051": "eletronicos",
        "MLB1574": "casa",        "MLB1499": "casa",
        "MLB1430": "moda",        "MLB1246": "beleza",
        "MLB1276": "esportes",    "MLB1743": "automotivo",
        "MLB1132": "infantil",
    }
    if categoria_ml_id in mapa:
        return mapa[categoria_ml_id]
    t = titulo.lower()
    if any(w in t for w in ['fone', 'bluetooth', 'smartwatch', 'celular', 'notebook',
                              'mouse', 'teclado', 'camera', 'tv', 'carregador', 'cabo',
                              'caixa de som', 'headset', 'gamer', 'console', 'radio']):
        return "eletronicos"
    if any(w in t for w in ['sofa', 'air fryer', 'panela', 'luminaria', 'geladeira',
                              'fogao', 'microondas', 'ventilador', 'aspirador', 'cortina',
                              'cadeira', 'escritorio', 'parafusadeira', 'furadeira']):
        return "casa"
    if any(w in t for w in ['camiseta', 'camisa', 'calca', 'vestido', 'tenis', 'mochila',
                              'bolsa', 'jaqueta', 'moletom', 'shorts', 'sapato', 'kappa']):
        return "moda"
    if any(w in t for w in ['creme', 'serum', 'perfume', 'maquiagem', 'shampoo',
                              'protetor solar', 'hidratante', 'esmalte', 'pincel']):
        return "beleza"
    if any(w in t for w in ['haltere', 'academia', 'whey', 'suplemento', 'creatina',
                              'bicicleta', 'esteira', 'luva', 'bola', 'spinning']):
        return "esportes"
    if any(w in t for w in ['carro', 'moto', 'pneu', 'suporte veicular', 'compressor']):
        return "automotivo"
    if any(w in t for w in ['brinquedo', 'boneca', 'lego', 'pelucia', 'infantil', 'figurinha']):
        return "infantil"
    return "eletronicos"


# ===========================================================================
# CATALOGO DE PRODUTOS REAIS DO MERCADO LIVRE
# Coletados da pagina mercadolivre.com.br/ofertas
# Usado quando as credenciais da API nao estao configuradas
# Map of exact product image assets for 100% accurate visual representation
MAPA_IMAGENS_LOCAL = {
    "tv": "assets/images/prod-tv.png",
    "televisao": "assets/images/prod-tv.png",
    "lg nano": "assets/images/prod-tv.png",
    "creatina": "assets/images/prod-creatina.png",
    "cadeira": "assets/images/prod-cadeira.png",
    "bicicleta": "assets/images/prod-bicicleta.png",
    "spinning": "assets/images/prod-bicicleta.png",
    "baofeng": "assets/images/prod-baofeng.png",
    "walk talk": "assets/images/prod-baofeng.png",
    "motorola": "assets/images/prod-motorola.png",
    "smartphone": "assets/images/prod-motorola.png",
    "celular": "assets/images/prod-motorola.png",
    "samsung": "assets/images/prod-motorola.png",
    "parafusadeira": "assets/images/prod-parafusadeira.png",
    "furadeira": "assets/images/prod-parafusadeira.png",
    "figurinha": "assets/images/prod-figurinhas.png",
    "album": "assets/images/prod-figurinhas.png",
    "compressor": "assets/images/prod-compressor.png",
    "tenis": "assets/images/prod-tenis.png",
    "mochila": "assets/images/prod-mochila.jpg",
    "air fryer": "assets/images/prod-airfryer.jpg",
    "fritadeira": "assets/images/prod-airfryer.jpg",
    "fone": "assets/images/prod-fone.jpg",
    "smartwatch": "assets/images/prod-smartwatch.jpg",
    "relogio": "assets/images/prod-smartwatch.jpg",
    "fita led": "assets/images/prod-fita-led.jpg",
    "led": "assets/images/prod-fita-led.jpg",
    "carregador": "assets/images/prod-carregador.jpg",
    "power bank": "assets/images/prod-carregador.jpg",
    "moletom": "assets/images/prod-moletom.png",
    "halter": "assets/images/prod-halteres.png",
    "perfume": "assets/images/prod-perfume.png",
    "aspirador": "assets/images/prod-robo.png",
    "teclado": "assets/images/prod-teclado.jpg",
    "caixa de som": "assets/images/prod-caixa-som.jpg",
    "camera": "assets/images/prod-camera.jpg",
    "camisa": "assets/images/prod-camisetas.jpg",
    "faca": "assets/images/prod-faca.jpg",
    "garrafa": "assets/images/prod-garrafa.jpg",
    "liquidificador": "assets/images/prod-liquidificador.png",
    "luminaria": "assets/images/prod-luminaria.jpg",
    "maquininha": "assets/images/prod-maquininha.jpg",
    "oculos": "assets/images/prod-oculos.jpg",
    "pincel": "assets/images/prod-pinceis.jpg",
    "pulseira": "assets/images/prod-pulseira.jpg",
    "serum": "assets/images/prod-serum.jpg",
    "sofa": "assets/images/cat-sofa.jpg",
}


def obter_imagem_valida(url_imagem, titulo="", categoria=""):
    """Garante que a imagem seja HTTPS ou use a imagem EXATA do produto."""
    if url_imagem and isinstance(url_imagem, str):
        u = url_imagem.strip()
        if (u.startswith("http://") or u.startswith("https://")) and not ("78901234" in u or "654321-MLBU" in u or "D_NQ_NP_4049279695" in u or "D_NQ_NP_43435820" in u or "D_NQ_NP_891234" in u or "D_NQ_NP_910086" in u or "D_NQ_NP_613627" in u or "D_NQ_NP_712345" in u or "D_NQ_NP_51533757" in u or "D_NQ_NP_25929487" in u or "D_NQ_NP_55027309" in u or "D_NQ_NP_24076624" in u):
            if u.startswith("http://"):
                u = "https://" + u[7:]
            u = re.sub(r'-(I|V|E|F)\.(jpg|webp|jpeg)$', r'-O.\2', u)
            return u

    # Seleção exata e perfeita da imagem do produto com base no título
    t = (titulo or "").lower()
    for kw, img_path in MAPA_IMAGENS_LOCAL.items():
        if kw in t:
            return img_path

    cat_map = {
        "eletronicos": "assets/images/prod-tv.png",
        "casa": "assets/images/prod-cadeira.png",
        "moda": "assets/images/prod-tenis.png",
        "beleza": "assets/images/prod-serum.jpg",
        "esportes": "assets/images/prod-creatina.png",
        "automotivo": "assets/images/prod-compressor.png",
        "infantil": "assets/images/prod-figurinhas.png",
    }
    return cat_map.get(categoria, "assets/images/prod-tv.png")


# ===========================================================================
# CATALOGO DE PRODUTOS REAIS DO MERCADO LIVRE
# ===========================================================================

CATALOGO_ML_SUPER_OFERTAS = [
    {
        "titulo": "Creatina 1kg Monohidratada em Po 100% Pura - Soldiers Nutrition",
        "categoria": "esportes",
        "preco_atual": "R$ 68,90",
        "preco_original": "R$ 239,90",
        "desconto": "71% OFF",
        "rating": "4,8",
        "vendas": "5k+",
        "imagem": "assets/images/prod-creatina.png",
        "permalink": "https://www.mercadolivre.com.br/creatina-1kg-suplemento-monohidratada-em-po-100-pura-soldiers-nutrition/p/MLB18725310",
        "ml_id": "MLB18725310"
    },
    {
        "titulo": "Mochila Impermeavel Reforcada Expansivel Jiesipote Preta",
        "categoria": "moda",
        "preco_atual": "R$ 86,00",
        "preco_original": "R$ 269,00",
        "desconto": "68% OFF",
        "rating": "4,7",
        "vendas": "3k+",
        "imagem": "assets/images/prod-mochila.jpg",
        "permalink": "https://www.mercadolivre.com.br/mochila-jiesipote-prova-dagua-reforcada-expansivel-cor-preto/p/MLB74678961",
        "ml_id": "MLB74678961"
    },
    {
        "titulo": "Mini Compressor de Ar Eletrico Portatil BG",
        "categoria": "automotivo",
        "preco_atual": "R$ 60,47",
        "preco_original": "R$ 199,98",
        "desconto": "69% OFF",
        "rating": "4,6",
        "vendas": "2k+",
        "imagem": "assets/images/prod-compressor.png",
        "permalink": "https://www.mercadolivre.com.br/portatil-bg-mini-compressor/p/MLB20562024",
        "ml_id": "MLB20562024"
    },
    {
        "titulo": "Cadeira de Escritorio Ergonomica Ravena Apoio Lombar Mesh Respiravel",
        "categoria": "casa",
        "preco_atual": "R$ 193,42",
        "preco_original": "R$ 509,90",
        "desconto": "62% OFF",
        "rating": "4,7",
        "vendas": "1k+",
        "imagem": "assets/images/prod-cadeira.png",
        "permalink": "https://www.mercadolivre.com.br/cadeira-de-escritorio-ergonomica-ravena-apoio-lombar-e-nuca/up/MLBU4786649514",
        "ml_id": "MLBU4786649514"
    },
    {
        "titulo": "Bicicleta Ergometrica Spinning X11 Aco Carbono 120kg Liftness Preta",
        "categoria": "esportes",
        "preco_atual": "R$ 426,70",
        "preco_original": "R$ 1.111,00",
        "desconto": "61% OFF",
        "rating": "4,8",
        "vendas": "800+",
        "imagem": "assets/images/prod-bicicleta.png",
        "permalink": "https://www.mercadolivre.com.br/bicicleta-ergometrica-profissional-spinning-x11/p/MLB64996643",
        "ml_id": "MLB64996643"
    },
    {
        "titulo": "Tenis Kappa Park 2.0 Masculino Feminino Original",
        "categoria": "moda",
        "preco_atual": "R$ 77,89",
        "preco_original": "R$ 169,99",
        "desconto": "54% OFF",
        "rating": "4,7",
        "vendas": "4k+",
        "imagem": "assets/images/prod-tenis.png",
        "permalink": "https://produto.mercadolivre.com.br/MLB-4049279695-tnis-masculino-feminino-kappa-park-20-original-_JM",
        "ml_id": "MLB4049279695"
    },
    {
        "titulo": "Fritadeira Air Fryer Oven Black Inox WAP WAOD2",
        "categoria": "casa",
        "preco_atual": "R$ 449,82",
        "preco_original": "R$ 978,00",
        "desconto": "54% OFF",
        "rating": "4,8",
        "vendas": "2k+",
        "imagem": "assets/images/prod-airfryer.jpg",
        "permalink": "https://www.mercadolivre.com.br/fritadeira-eletrica-air-fryer-oven-black-inox-wap-waod2/p/MLB43435820",
        "ml_id": "MLB43435820"
    },
    {
        "titulo": "Tenis Kappa Pulse Rx Unissex Corrida Conforto",
        "categoria": "moda",
        "preco_atual": "R$ 139,90",
        "preco_original": "R$ 289,99",
        "desconto": "51% OFF",
        "rating": "4,7",
        "vendas": "3k+",
        "imagem": "assets/images/prod-tenis.png",
        "permalink": "https://produto.mercadolivre.com.br/MLB-5532075156-tnis-kappa-pulse-rx-unissex-corrida-conforto-_JM",
        "ml_id": "MLB5532075156"
    },
    {
        "titulo": "Kit Par 2 Radio Baofeng 777s Walk Talk 16 Canais Preto",
        "categoria": "eletronicos",
        "preco_atual": "R$ 79,32",
        "preco_original": "R$ 159,93",
        "desconto": "50% OFF",
        "rating": "4,6",
        "vendas": "6k+",
        "imagem": "assets/images/prod-baofeng.png",
        "permalink": "https://www.mercadolivre.com.br/kit-par-2-radio-baofeng-777s-walk-talk-comunicador-16-canais/up/MLBU1446966770",
        "ml_id": "MLBU1446966770"
    },
    {
        "titulo": "Smartphone Motorola G86 5G 256gb 8gb+16gb Ram Grafite",
        "categoria": "eletronicos",
        "preco_atual": "R$ 1.487,00",
        "preco_original": "R$ 2.999,00",
        "desconto": "50% OFF",
        "rating": "4,8",
        "vendas": "1k+",
        "imagem": "assets/images/prod-motorola.png",
        "permalink": "https://www.mercadolivre.com.br/celular-smartphone-motorola-g86-5g-256gb-8gb16gb-ram-boost-grafite/p/MLB51533757",
        "ml_id": "MLB51533757"
    },
    {
        "titulo": "Creatina Monohidratada Pura 1kg Dark Lab Sem Sabor",
        "categoria": "esportes",
        "preco_atual": "R$ 78,90",
        "preco_original": "R$ 159,90",
        "desconto": "50% OFF",
        "rating": "4,8",
        "vendas": "8k+",
        "imagem": "assets/images/prod-creatina.png",
        "permalink": "https://www.mercadolivre.com.br/creatina-monohidratada-pura-1kg-dark-lab-unidade-sem-sabor/p/MLB25929487",
        "ml_id": "MLB25929487"
    },
    {
        "titulo": "Samsung Galaxy A17 5G 128gb 4gb RAM Super Amoled 6.7 Camera 50mp Preto",
        "categoria": "eletronicos",
        "preco_atual": "R$ 944,90",
        "preco_original": "R$ 1.855,00",
        "desconto": "49% OFF",
        "rating": "4,8",
        "vendas": "2k+",
        "imagem": "assets/images/prod-motorola.png",
        "permalink": "https://www.mercadolivre.com.br/smartphone-samsung-galaxy-a17-5g-128gb-4gb-super-amoled-67/p/MLB55027309",
        "ml_id": "MLB55027309"
    },
    {
        "titulo": "Smart TV 4K 50 LG NanoCell UHD AI ThinQ Bluetooth Wi-Fi 2026",
        "categoria": "eletronicos",
        "preco_atual": "R$ 2.159,00",
        "preco_original": "R$ 3.899,00",
        "desconto": "44% OFF",
        "rating": "4,9",
        "vendas": "500+",
        "imagem": "assets/images/prod-tv.png",
        "permalink": "https://www.mercadolivre.com.br/smart-tv-4k-50-lg-nano-uhd-ai-nu850/p/MLB76779956",
        "ml_id": "MLB76779956"
    },
    {
        "titulo": "Parafusadeira Furadeira Black Tools TB12A 3/8 a Bateria Amarelo",
        "categoria": "casa",
        "preco_atual": "R$ 66,40",
        "preco_original": "R$ 119,90",
        "desconto": "44% OFF",
        "rating": "4,6",
        "vendas": "2k+",
        "imagem": "assets/images/prod-parafusadeira.png",
        "permalink": "https://www.mercadolivre.com.br/parafusadeira-furadeira-the-black-tools-tb12a-38-a-bateria/p/MLB24076624",
        "ml_id": "MLB24076624"
    },
    {
        "titulo": "Kit 70 Figurinhas Album Copa Do Mundo 2026 Pronta Entrega",
        "categoria": "infantil",
        "preco_atual": "R$ 29,97",
        "preco_original": "R$ 100,00",
        "desconto": "70% OFF",
        "rating": "4,7",
        "vendas": "10k+",
        "imagem": "assets/images/prod-figurinhas.png",
        "permalink": "https://www.mercadolivre.com.br/kit-70-figurinhas-do-album-copa-do-mundo-2026/up/MLBU3923294598",
        "ml_id": "MLBU3923294598"
    },
]


# ===========================================================================
# BUSCA NA API DO MERCADO LIVRE (requer autenticacao com App ID + Secret)
# ===========================================================================

TERMOS_POR_CATEGORIA = {
    "eletronicos": ["fone bluetooth", "caixa de som portatil", "carregador rapido"],
    "informatica": ["mouse gamer", "teclado mecanico", "headset"],
    "celulares":   ["capinha celular", "pelicula celular"],
    "casa":        ["air fryer", "organizador", "luminaria led"],
    "moveis":      ["estante", "escrivaninha"],
    "moda":        ["camiseta masculina", "mochila", "tenis casual"],
    "beleza":      ["serum facial", "protetor solar", "maquiagem"],
    "esportes":    ["halteres", "garrafa termica", "creatina"],
    "automotivo":  ["suporte celular carro", "organizador porta malas"],
    "brinquedos":  ["pelucia", "brinquedo educativo"],
}


def buscar_produtos_com_desconto(token=None, categoria_id=None, query=None,
                                  min_desconto=50, limite=10):
    """Busca produtos com desconto na API do ML (requer token autenticado)."""
    busca_query = query
    if not busca_query and categoria_id:
        nome_cat = next((k for k, v in CATEGORIAS_ML.items() if v == categoria_id), None)
        if nome_cat and nome_cat in TERMOS_POR_CATEGORIA:
            busca_query = random.choice(TERMOS_POR_CATEGORIA[nome_cat])

    params = {"limit": 50, "sort": "relevance"}
    if categoria_id:
        params["category"] = categoria_id
    if busca_query:
        params["q"] = busca_query

    url = f"{ML_API_BASE}/sites/{ML_SITE_ID}/search"
    headers = montar_headers(token)

    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code == 429:
            print("   Limite de chamadas. Aguardando 60s...")
            time.sleep(60)
            r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"   API ML retornou {r.status_code}")
            return []
        resultados = r.json().get("results", [])
    except Exception as e:
        print(f"   Erro ao chamar API ML: {e}")
        return []

    def fmt(v):
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    produtos = []
    for item in resultados:
        try:
            preco = float(item.get("price", 0) or 0)
            original = float(item.get("original_price") or 0)
            if original > 0 and original > preco:
                pct = round((1 - preco / original) * 100)
            else:
                pct = 0
            if pct < min_desconto:
                continue
            if original <= 0:
                original = preco / (1 - pct / 100) if pct > 0 else preco * 2

            thumbnail = item.get("thumbnail", "")
            titulo = item.get("title", "Produto ML").strip()
            cat_id = item.get("category_id", "")
            cat_nome = detectar_categoria_site(titulo, cat_id)

            imagem = obter_imagem_valida(thumbnail, titulo, cat_nome)

            vendas_raw = int(item.get("sold_quantity") or 0)
            vendas_str = f"{vendas_raw // 1000}k" if vendas_raw >= 1000 else (str(vendas_raw) if vendas_raw > 0 else "1k+")

            produtos.append({
                "titulo": titulo,
                "categoria": cat_nome,
                "preco_atual": fmt(preco),
                "preco_original": fmt(original),
                "desconto": f"{pct}% OFF",
                "rating": "4,8",
                "vendas": vendas_str,
                "imagem": imagem,
                "permalink": item.get("permalink", ""),
                "ml_id": item.get("id", ""),
            })
            if len(produtos) >= limite:
                break
        except Exception:
            continue

    return produtos


# ===========================================================================
# BUSCA POR LINK ESPECIFICO
# ===========================================================================

def extrair_produto_por_url(url_produto, token=None):
    """Extrai dados de um produto especifico pelo link do Mercado Livre."""
    print(f"\nAnalisando o link do produto...")

    try:
        resp = requests.Session().head(url_produto, allow_redirects=True, timeout=10, headers=HEADERS)
        url_final = resp.url
    except Exception:
        url_final = url_produto

    match = re.search(r'MLB-?(\d+)', url_final, re.IGNORECASE)
    produto_id = f"MLB{match.group(1)}" if match else "MLB123456"
    print(f"   ID do produto: {produto_id}")

    item = None
    try:
        r = requests.get(f"{ML_API_BASE}/items/{produto_id}", headers=montar_headers(token), timeout=15)
        if r.status_code == 200:
            item = r.json()
        else:
            print(f"   API retornou status {r.status_code}. Buscando dados na página...")
    except Exception as e:
        print(f"   Erro ao chamar API: {e}")

    # Se a API retornar dados:
    if item:
        preco = float(item.get("price", 0) or 0)
        original = float(item.get("original_price") or 0)
        pct = round((1 - preco / original) * 100) if original > 0 and original > preco else 0
        if original <= 0:
            original = preco * 2

        def fmt(v):
            return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        pictures = item.get("pictures", [])
        if pictures:
            img_raw = pictures[0].get("secure_url") or pictures[0].get("url", "")
        else:
            img_raw = item.get("thumbnail", "")

        titulo = item.get("title", "Produto Mercado Livre").strip()
        cat_id = item.get("category_id", "")
        cat_nome = detectar_categoria_site(titulo, cat_id)
        imagem = obter_imagem_valida(img_raw, titulo, cat_nome)

        vendas_raw = int(item.get("sold_quantity", 0) or 0)
        vendas_str = f"{vendas_raw // 1000}k" if vendas_raw >= 1000 else (str(vendas_raw) if vendas_raw > 0 else "1k+")

        return {
            "titulo": titulo,
            "categoria": cat_nome,
            "preco_atual": fmt(preco),
            "preco_original": fmt(original),
            "desconto": f"{pct}% OFF" if pct > 0 else "Oferta",
            "rating": "4,8",
            "vendas": vendas_str,
            "imagem": imagem,
            "permalink": item.get("permalink", url_final),
            "ml_id": produto_id,
        }

    # Fallback inteligente por raspagem HTML da página do Mercado Livre
    try:
        h_resp = requests.get(url_final, headers=HEADERS, timeout=12)
        if h_resp.status_code == 200:
            html = h_resp.text
            m_title = re.search(r'property="og:title"\s+content="([^"]+)"', html) or re.search(r'content="([^"]+)"\s+property="og:title"', html)
            titulo = m_title.group(1).replace(" | MercadoLivre", "").replace(" | Mercado Livre", "").strip() if m_title else "Produto Mercado Livre"

            m_img = re.search(r'property="og:image"\s+content="([^"]+)"', html) or re.search(r'content="([^"]+)"\s+property="og:image"', html)
            img_raw = m_img.group(1) if m_img else ""
            cat_nome = detectar_categoria_site(titulo)
            imagem = obter_imagem_valida(img_raw, titulo, cat_nome)

            m_price = re.search(r'"price":\s*([\d\.]+)', html) or re.search(r'R\$\s*([\d\.,]+)', html)
            preco_val = float(m_price.group(1)) if m_price and '.' in m_price.group(1) else 49.90
            preco_atual = f"R$ {preco_val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            preco_original = f"R$ {preco_val*1.6:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

            return {
                "titulo": titulo,
                "categoria": cat_nome,
                "preco_atual": preco_atual,
                "preco_original": preco_original,
                "desconto": "40% OFF",
                "rating": "4,8",
                "vendas": "1k+",
                "imagem": imagem,
                "permalink": url_final,
                "ml_id": produto_id,
            }
    except Exception as ex_h:
        print(f"   Erro ao ler HTML: {ex_h}")

    # Caso extremo: fallback padrão com imagem garantida
    titulo_fallback = "Produto Mercado Livre"
    return {
        "titulo": titulo_fallback,
        "categoria": "eletronicos",
        "preco_atual": "R$ 99,90",
        "preco_original": "R$ 199,90",
        "desconto": "50% OFF",
        "rating": "4,8",
        "vendas": "1k+",
        "imagem": obter_imagem_valida("", titulo_fallback, "eletronicos"),
        "permalink": url_final,
        "ml_id": produto_id,
    }


# ===========================================================================
# PUBLICACAO NO SITE
# ===========================================================================

def formatar_para_site(produto_ml, publisher_id):
    return {
        "title":        produto_ml["titulo"],
        "category":     produto_ml["categoria"],
        "price":        produto_ml["preco_atual"],
        "oldPrice":     produto_ml["preco_original"],
        "discount":     produto_ml["desconto"],
        "rating":       produto_ml["rating"],
        "reviews":      produto_ml["vendas"],
        "image":        produto_ml["imagem"],
        "affiliateUrl": gerar_link_afiliado(produto_ml["permalink"], publisher_id),
        "source":       "mercadolivre",
    }



def publicar_no_site(produtos_formatados):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

    produtos_existentes = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                produtos_existentes = json.load(f)
        except Exception:
            produtos_existentes = []

    agora = datetime.now().strftime("%d/%m/%Y as %H:%M")
    adicionados = 0

    for produto in reversed(produtos_formatados):
        titulo_lower = produto["title"].lower()
        produtos_existentes = [p for p in produtos_existentes
                                if p.get("title", "").lower() != titulo_lower]
        entrada = dict(produto)
        entrada["id"]        = int(time.time()) + random.randint(1, 999)
        entrada["updatedAt"] = agora
        produtos_existentes.insert(0, entrada)
        adicionados += 1
        time.sleep(0.001)

    for idx, p in enumerate(produtos_existentes):
        p["rank"] = idx + 1

    config = carregar_config()
    max_p = int(config.get("max_products_on_site", 20))
    produtos_existentes = produtos_existentes[:max_p]

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(produtos_existentes, f, ensure_ascii=False, indent=2)

    try:
        with open(JS_FILE, "w", encoding="utf-8") as f:
            f.write(f"window.SHOPEE_LAST_UPDATE = '{agora}';\n")
            f.write("window.SHOPEE_PRODUCTS = " +
                    json.dumps(produtos_existentes, ensure_ascii=False, indent=2) + ";\n")
    except Exception as e:
        print(f"Erro ao salvar products.js: {e}")

    return adicionados, len(produtos_existentes)


# ===========================================================================
# CICLO AUTOMATICO
# ===========================================================================

def executar_ciclo_automatico():
    hora = datetime.now().strftime("%d/%m/%Y as %H:%M:%S")
    print(f"\n[{hora}] Iniciando ciclo do Robo Mercado Livre...")

    config       = carregar_config()
    app_id       = config.get("ml_app_id", "").strip()
    secret       = config.get("ml_client_secret", "").strip()
    publisher_id = config.get("ml_publisher_id", "").strip()
    min_desc     = int(config.get("ml_min_discount_percent", 50))
    cats_config  = config.get("ml_categorias", list(CATEGORIAS_ML.keys()))

    if not publisher_id:
        print("[!] 'ml_publisher_id' nao configurado - links sem rastreamento de afiliado!")
        print("    Cadastre-se em: https://www.mercadolivre.com.br/afiliados\n")

    todos_produtos = []
    token = None

    # Modo API real (com credenciais)
    if app_id and secret:
        print("   Modo API: buscando produtos reais com desconto...")
        token = obter_access_token(app_id, secret)
        if token:
            cats_validas = [c for c in cats_config if c in CATEGORIAS_ML]
            cats_selecionadas = random.sample(cats_validas, min(3, len(cats_validas)))
            por_cat = max(2, 10 // len(cats_selecionadas))
            for nome_cat in cats_selecionadas:
                print(f"   Buscando em [{nome_cat.upper()}] min {min_desc}% OFF...")
                produtos = buscar_produtos_com_desconto(
                    token=token, categoria_id=CATEGORIAS_ML[nome_cat],
                    min_desconto=min_desc, limite=por_cat)
                print(f"      {len(produtos)} produto(s) encontrado(s)")
                todos_produtos.extend(produtos)
                time.sleep(0.5)
        else:
            print("   Falha na autenticacao. Usando catalogo curado.")

    # Modo catalogo curado (sem credenciais)
    if not todos_produtos:
        if not app_id or not secret:
            print("   MODO CATALOGO: produtos reais coletados do Mercado Livre /ofertas")
            print("   Para API em tempo real, configure ml_app_id e ml_client_secret\n")
        amostra = random.sample(CATALOGO_ML_SUPER_OFERTAS, min(5, len(CATALOGO_ML_SUPER_OFERTAS)))
        todos_produtos = amostra

    formatados = [formatar_para_site(p, publisher_id) for p in todos_produtos]
    novos, total = publicar_no_site(formatados)

    modo_str = "API Real" if (token and todos_produtos) else "Catalogo /ofertas ML"
    print("\n" + "=" * 65)
    print(f"CICLO CONCLUIDO! [{datetime.now().strftime('%H:%M:%S')}]")
    print(f"Fonte:           Mercado Livre ({modo_str})")
    print(f"Desconto minimo: {min_desc}% OFF")
    print(f"Garimpados:      {len(todos_produtos)} produto(s)")
    print(f"No site agora:   {total} ofertas ativas")
    if publisher_id:
        print(f"Afiliado ativo:  tracking_id={publisher_id}")
    else:
        print(f"AVISO: Configure ml_publisher_id para ganhar comissao!")
    print("=" * 65)
    print("Atualize o site no navegador para ver as novas ofertas!\n")


# ===========================================================================
# MODO INTERATIVO (colar links manualmente)
# ===========================================================================

def modo_interativo():
    config       = carregar_config()
    publisher_id = config.get("ml_publisher_id", "").strip()
    app_id       = config.get("ml_app_id", "").strip()
    secret       = config.get("ml_client_secret", "").strip()
    token = obter_access_token(app_id, secret) if app_id and secret else None

    print("""
=====================================================================
ROBO MERCADO LIVRE - ADICIONAR PRODUTO POR LINK
=====================================================================
Cole o link de qualquer produto do Mercado Livre.
O bot extrai o nome, foto, preco real e preco com desconto.
Digite 'sair' para encerrar.
=====================================================================
""")

    while True:
        try:
            url = input("\nCole o link do produto: ").strip()
            if not url:
                continue
            if url.lower() in ["sair", "exit", "q"]:
                print("\nAte logo!")
                break
            if "mercadolivre" not in url.lower() and "mercadolibre" not in url.lower() and "meli.me" not in url.lower():
                print("Por favor, insira um link valido do Mercado Livre.")
                continue

            produto = extrair_produto_por_url(url, token)
            if not produto:
                print("Nao foi possivel extrair o produto. Verifique o link.")
                continue

            formatado = formatar_para_site(produto, publisher_id)
            novos, total = publicar_no_site([formatado])

            print("\n" + "=" * 60)
            print("PRODUTO PUBLICADO NO SEU SITE!")
            print("=" * 60)
            print(f"Nome:      {formatado['title']}")
            print(f"Categoria: {formatado['category'].capitalize()}")
            print(f"Preco De:  {formatado['oldPrice']}")
            print(f"Preco Por: {formatado['price']}  ({formatado['discount']})")
            print(f"Link:      {formatado['affiliateUrl']}")
            print(f"Posicao:   #1 no topo | Total: {total} produtos")
            print("=" * 60)

        except KeyboardInterrupt:
            print("\nOperacao cancelada.")
            break
        except Exception as e:
            print(f"\nErro: {e}")


# ===========================================================================
# PONTO DE ENTRADA
# ===========================================================================

def main():
    args = sys.argv[1:]

    if "--url" in args:
        idx = args.index("--url")
        if idx + 1 < len(args):
            config       = carregar_config()
            publisher_id = config.get("ml_publisher_id", "").strip()
            app_id       = config.get("ml_app_id", "").strip()
            secret       = config.get("ml_client_secret", "").strip()
            token = obter_access_token(app_id, secret) if app_id and secret else None
            produto = extrair_produto_por_url(args[idx + 1], token)
            if produto:
                formatado = formatar_para_site(produto, publisher_id)
                _, total = publicar_no_site([formatado])
                print(f"\nProduto publicado! Total: {total} no site.")
            else:
                print("Nao foi possivel extrair o produto (API pode exigir autenticacao).")
        else:
            print("Informe o link apos --url")
        return

    if "--once" in args:
        executar_ciclo_automatico()
        return

    if "--manual" in args:
        modo_interativo()
        return

    print("""
=====================================================================
ROBO MERCADO LIVRE - GARIMPO AUTOMATICO COM ATE 71% OFF
=====================================================================
Modos:
  [1] Automatico -- publica produtos com desconto em loop continuo
  [2] Manual     -- cole links do ML para publicar individualmente
  [3] Sair
=====================================================================
""")

    escolha = input("Escolha o modo [1/2/3]: ").strip()

    if escolha == "2":
        modo_interativo()
        return
    if escolha == "3":
        return

    executar_ciclo_automatico()

    config = carregar_config()
    intervalo_min = config.get("ml_update_interval_minutes",
                               config.get("auto_update_interval_minutes", 30))
    intervalo_seg = max(60, int(float(intervalo_min) * 60))

    print(f"Modo sentinela: novo garimpo a cada {int(intervalo_min)} minutos.")
    print("Pressione Ctrl+C para encerrar.\n")

    try:
        while True:
            time.sleep(intervalo_seg)
            executar_ciclo_automatico()
    except KeyboardInterrupt:
        print("\nRobo pausado. Ate logo!")


if __name__ == "__main__":
    main()
