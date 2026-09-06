import requests, re, json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
}

def search_google_shopee(query):
    url = f"https://www.google.com/search?q={requests.utils.quote(query)}&hl=pt-BR"
    try:
        r = requests.get(url, headers=headers, timeout=10)
        # Find urls like https://shopee.com.br/product-name-i.123456.7890123
        matches = re.findall(r'https://shopee\.com\.br/[^&?\"\'\s<>]+-i\.\d+\.\d+', r.text)
        return list(set(matches))
    except Exception as e:
        return []

terms = [
    'teclado mecanico gamer site:shopee.com.br',
    'smartwatch d20 relogio site:shopee.com.br',
    'camera lampada 360 wifi site:shopee.com.br',
    'fritadeira eletrica air fryer site:shopee.com.br',
    'maquina cortar cabelo dragao site:shopee.com.br',
    'fita led rgb 5m site:shopee.com.br',
    'fone bluetooth sem fio site:shopee.com.br'
]

results = {}
for t in terms:
    res = search_google_shopee(t)
    print(t, '->', len(res), 'found')
    if res:
        results[t] = res[0]
        print('  Sample:', res[0])

print('\nTotal results:', len(results))
with open('google_shopee_links.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
