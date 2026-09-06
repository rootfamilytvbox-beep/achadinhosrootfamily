#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
🛍️ ROBÔ SHOPEE AFILIADOS - CADASTRO AUTOMÁTICO DE PRODUTOS NO SITE
==============================================================================
Como usar:
  1. Execute: python bot_shopee.py
  2. Cole o link de qualquer produto da Shopee (completo ou encurtado)
  3. O robô extrai nome, fotos, preços, calcula o desconto e salva no site!
==============================================================================
"""

import os
import sys
import re
import json
import time
import urllib.parse
from datetime import datetime

# Garantir suporte a UTF-8 e emojis no Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    import sys
    print("Instalando dependências necessárias (requests, beautifulsoup4)...")
    os.system(f"{sys.executable} -m pip install requests beautifulsoup4")
    import requests
    from bs4 import BeautifulSoup

# Caminho dos arquivos do site
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "products.json")
IMAGES_DIR = os.path.join(BASE_DIR, "assets", "images")

# Configuração do seu link de afiliado Shopee
AFFILIATE_ID = "1836460594"
DEFAULT_AFFILIATE_BASE = f"https://shopee.com.br?aff_id={AFFILIATE_ID}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://shopee.com.br/",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
}


def detectar_categoria(titulo):
    """Detecta automaticamente a categoria com base no título do produto"""
    t = titulo.lower()
    if any(w in t for w in ['fone', 'bluetooth', 'smartwatch', 'relogio', 'carregador', 'cabo', 'celular', 'xiaomi', 'gamer', 'mouse', 'teclado', 'usb', 'led', 'caixa de som', 'eletronico']):
        return "eletronicos"
    elif any(w in t for w in ['sofa', 'almofada', 'cortina', 'decoracao', 'casa', 'cozinha', 'air fryer', 'panela', 'mesa', 'luminaria', 'organizad']):
        return "casa"
    elif any(w in t for w in ['camisa', 'moletom', 'camiseta', 'calca', 'vestido', 'tenis', 'meia', 'jaqueta', 'moda', 'roupa', 'bermuda']):
        return "moda"
    elif any(w in t for w in ['skincare', 'creme', 'serum', 'perfume', 'maquiagem', 'batom', 'cabelo', 'shampoo', 'beleza', 'hidratante']):
        return "beleza"
    elif any(w in t for w in ['halter', 'academia', 'musculacao', 'whey', 'garrafa', 'treino', 'esporte', 'fitness', 'luva']):
        return "esportes"
    elif any(w in t for w in ['carro', 'moto', 'pneu', 'roda', 'automotivo', 'suporte veicular', 'palheta', 'farol', 'som automotivo']):
        return "automotivo"
    elif any(w in t for w in ['brinquedo', 'bebe', 'infantil', 'pelucia', 'boneca', 'carrinho', 'lego', 'jogo']):
        return "infantil"
    return "eletronicos"


def extrair_dados_shopee(url):
    """
    Acessa a URL da Shopee, resolve redirecionamentos e extrai os dados do produto.
    """
    print(f"\n🔍 Conectando à Shopee e buscando dados do produto...")
    
    session = requests.Session()
    session.headers.update(HEADERS)

    # Seguir redirecionamento caso seja link encurtado (ex: s.shopee.com.br ou shope.ee)
    try:
        response = session.get(url, allow_redirects=True, timeout=12)
        final_url = response.url
    except Exception as e:
        print(f"⚠️ Erro de conexão com o link ({e}). Usando URL original.")
        final_url = url
        response = None

    titulo = None
    imagem_url = None
    preco_atual = None
    preco_antigo = None
    desconto = None
    avaliacao = "4,9"
    vendas = "5,4k"

    html = response.text if response and response.status_code == 200 else ""

    # 1. Tentar extrair do HTML OpenGraph e Meta Tags
    if html:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Título
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            titulo = og_title["content"].replace(" | Shopee Brasil", "").strip()

        # Imagem
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            imagem_url = og_image["content"].strip()

        # Preço via Schema.org JSON-LD
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if data.get("@type") == "Product":
                        if not titulo and data.get("name"):
                            titulo = data.get("name")
                        if not imagem_url and data.get("image"):
                            img = data.get("image")
                            imagem_url = img[0] if isinstance(img, list) else img
                        offers = data.get("offers", {})
                        if isinstance(offers, dict) and offers.get("price"):
                            preco_val = float(offers["price"])
                            preco_atual = f"R$ {preco_val:.2f}".replace(".", ",")
            except Exception:
                pass

        # Preço via meta description (ex: "Compre Fone... por R$ 29,90...")
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            desc = og_desc["content"]
            precos_encontrados = re.findall(r'R\$\s*([\d\.,]+)', desc)
            if precos_encontrados and not preco_atual:
                preco_atual = f"R$ {precos_encontrados[0]}"

    # Se não capturou título da página, tenta pelo próprio texto da URL
    if not titulo:
        match_slug = re.search(r'shopee\.com\.br/([^/?]+)', final_url)
        if match_slug and match_slug.group(1) not in ['product', 'cart', 'search']:
            titulo_limpo = urllib.parse.unquote(match_slug.group(1)).replace("-", " ")
            titulo = re.sub(r'-i\.\d+\.\d+.*', '', titulo_limpo).title()
    
    # Validações / Fallbacks inteligentes se a Shopee bloquear o bot
    if not titulo:
        print("\n⚠️ A Shopee solicitou verificação ou não exibiu o título público.")
        titulo = input("👉 Digite o Nome/Título do Produto: ").strip()
        if not titulo:
            titulo = "Super Oferta Shopee"

    if not preco_atual:
        preco_input = input(f"👉 Digite o Preço com Desconto (ex: 39,90) [ou Enter para R$ 49,90]: ").strip()
        if preco_input:
            preco_input = preco_input.replace("R$", "").strip()
            preco_atual = f"R$ {preco_input}"
        else:
            preco_atual = "R$ 49,90"

    # Preço antigo e cálculo do % de desconto
    if not preco_antigo:
        try:
            val_atual = float(re.search(r'[\d\.,]+', preco_atual).group(0).replace(",", "."))
            # Simula desconto padrão atrativo de 50% a 70% se não especificado
            preco_antigo_calc = val_atual / 0.30  # ~70% OFF
            preco_antigo = f"R$ {preco_antigo_calc:.2f}".replace(".", ",")
            desconto = "70% OFF"
        except Exception:
            preco_antigo = "R$ 99,90"
            desconto = "70% OFF"

    if not desconto:
        desconto = "70% OFF"

    # Imagem padrão de alta qualidade se não capturada
    if not imagem_url:
        imagem_url = "assets/images/prod-fone.jpg"

    categoria = detectar_categoria(titulo)

    # Imagem padrão/validação de alta qualidade se não capturada
    if imagem_url and (imagem_url.startswith("http://") or imagem_url.startswith("//")):
        if imagem_url.startswith("http://"):
            imagem_url = "https://" + imagem_url[7:]
        elif imagem_url.startswith("//"):
            imagem_url = "https:" + imagem_url

    if not imagem_url or not (imagem_url.startswith("http://") or imagem_url.startswith("https://") or imagem_url.startswith("assets/")):
        t = (titulo or "").lower()
        if "fone" in t:
            imagem_url = "assets/images/prod-fone.jpg"
        elif "smartwatch" in t or "relogio" in t:
            imagem_url = "assets/images/prod-smartwatch.jpg"
        elif "fita led" in t or "led" in t:
            imagem_url = "assets/images/prod-fita-led.jpg"
        elif "carregador" in t or "power bank" in t:
            imagem_url = "assets/images/prod-carregador.jpg"
        elif "air fryer" in t or "fritadeira" in t:
            imagem_url = "assets/images/prod-airfryer.jpg"
        elif "mochila" in t:
            imagem_url = "assets/images/prod-mochila.jpg"
        elif "teclado" in t:
            imagem_url = "assets/images/prod-teclado.jpg"
        else:
            cat_map = {
                "eletronicos": "assets/images/cat-eletronicos.jpg",
                "casa": "assets/images/cat-sofa.jpg",
                "moda": "assets/images/cat-moda.jpg",
                "beleza": "assets/images/cat-beleza.jpg",
                "esportes": "assets/images/cat-esportes.jpg",
                "automotivo": "assets/images/cat-automotivo.jpg",
                "infantil": "assets/images/cat-infantil.jpg",
            }
            imagem_url = cat_map.get(categoria, "assets/images/prod-fone.jpg")

    return {
        "title": titulo,
        "category": categoria,
        "price": preco_atual,
        "oldPrice": preco_antigo,
        "discount": desconto,
        "rating": avaliacao,
        "reviews": vendas,
        "image": imagem_url,
        "affiliateUrl": final_url
    }


def salvar_produto_no_site(novo_produto):
    """
    Adiciona o novo produto aos arquivos data/products.json e data/products.js do site.
    """
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

    produtos = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                produtos = json.load(f)
        except Exception as e:
            print(f"Aviso ao ler products.json: {e}")
            produtos = []

    # Gerar novo ID
    novo_id = int(time.time())
    novo_produto["id"] = novo_id

    # Inserir no topo (1º lugar em Mais Vendidos)
    produtos.insert(0, novo_produto)

    # Reajustar os rankings numerados 1, 2, 3, 4, 5...
    for index, p in enumerate(produtos):
        p["rank"] = index + 1

    # Salvar no JSON
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(produtos, f, ensure_ascii=False, indent=2)

    # Salvar também no JS
    JS_FILE = os.path.join(BASE_DIR, "data", "products.js")
    agora = datetime.now().strftime("%d/%m/%Y as %H:%M")
    try:
        with open(JS_FILE, "w", encoding="utf-8") as f:
            f.write(f"window.SHOPEE_LAST_UPDATE = '{agora}';\n")
            f.write("window.SHOPEE_PRODUCTS = " + json.dumps(produtos, ensure_ascii=False, indent=2) + ";\n")
    except Exception as e:
        print(f"Aviso ao salvar products.js: {e}")

    return len(produtos)


def main():
    print("""
=====================================================================
🛍️  ROBÔ SHOPEE AFILIADOS - CADASTRO AUTOMÁTICO NO SITE
=====================================================================
Cole o link da Shopee e o produto será publicado no seu site!
Digite 'sair' para encerrar.
=====================================================================
""")

    while True:
        try:
            url = input("\n👉 Cole o link do produto da Shopee: ").strip()
            
            if not url:
                continue
            if url.lower() in ['sair', 'exit', 'q']:
                print("\nAté logo! O seu site está atualizado.")
                break

            if "shopee" not in url:
                print("⚠️ Por favor, insira um link válido da Shopee (ex: https://shopee.com.br/... ou https://s.shopee.com.br/...)")
                continue

            # Extração
            dados = extrair_dados_shopee(url)

            # Salvar no site
            total = salvar_produto_no_site(dados)

            print("\n" + "="*60)
            print("✅ PRODUTO PUBLICADO COM SUCESSO NO SEU SITE!")
            print("="*60)
            print(f"📦 Nome:       {dados['title']}")
            print(f"🏷️  Categoria:  {dados['category'].capitalize()}")
            print(f"💰 Preço De:   {dados['oldPrice']}")
            print(f"🔥 Preço Por:  {dados['price']} ({dados['discount']})")
            print(f"⭐ Avaliação:  {dados['rating']} ({dados['reviews']})")
            print(f"🔗 Link:       {dados['affiliateUrl']}")
            print(f"📊 Posição:    #1 no topo de Mais Vendidos")
            print(f"🌐 Total no site: {total} produtos")
            print("="*60)
            print("👉 Atualize seu site no navegador (http://localhost:8080) para ver a nova oferta!")

        except KeyboardInterrupt:
            print("\nOperação cancelada.")
            break
        except Exception as e:
            print(f"\n❌ Ocorreu um erro: {e}")


if __name__ == "__main__":
    main()
