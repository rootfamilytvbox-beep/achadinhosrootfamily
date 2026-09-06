import requests, re, json
from bs4 import BeautifulSoup
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
}

queries = {
    'teclado': 'teclado mecanico gamer shopee brasil',
    'fone': 'fone bluetooth sem fio tws shopee brasil',
    'smartwatch': 'smartwatch d20 relogio inteligente shopee brasil',
    'camera': 'camera de seguranca lampada 360 wifi shopee brasil',
    'fita_led': 'fita led rgb 5 metros com controle shopee brasil',
    'carregador': 'carregador portatil power bank 10000mah shopee brasil',
    'airfryer': 'fritadeira air fryer mondial 4l shopee brasil',
    'garrafa': 'garrafa termica display digital inox 500ml shopee brasil',
    'maquininha': 'maquina cortar cabelo dragao vintage t9 shopee brasil',
    'serum': 'serum facial vitamina c clareador shopee brasil',
    'mochila': 'mochila masculina impermeavel antifurto shopee brasil',
    'luminaria': 'luminaria mesa articulada flexivel led shopee brasil',
    'caixa_som': 'caixa som bluetooth portatil potente shopee brasil',
    'pinceis': 'kit 13 pinceis maquiagem profissional shopee brasil',
    'camisetas': 'kit 3 camisetas masculinas basicas algodao shopee brasil'
}

found = {}

for name, q in queries.items():
    url = f"https://www.bing.com/search?q={requests.utils.quote(q)}"
    try:
        r = requests.get(url, headers=headers, timeout=10)
        # Search for Shopee product URL pattern
        matches = re.findall(r'https?://(?:www\.)?shopee\.com\.br/[^"\'\s<>\)]+-i\.\d+\.\d+', r.text)
        if matches:
            clean = matches[0].split('?')[0]
            found[name] = clean
            print(f"✅ {name}: {clean}")
        else:
            # Check for redirect links
            soup = BeautifulSoup(r.text, 'html.parser')
            for a in soup.find_all('a', href=True):
                href = a['href']
                if 'shopee.com.br' in href and '-i.' in href:
                    clean = href.split('?')[0]
                    found[name] = clean
                    print(f"✅ {name} (via a): {clean}")
                    break
        time.sleep(1)
    except Exception as e:
        print(f"❌ {name}: {e}")

with open('real_shopee_links.json', 'w', encoding='utf-8') as f:
    json.dump(found, f, indent=2, ensure_ascii=False)
print(f"Total links found: {len(found)}")
