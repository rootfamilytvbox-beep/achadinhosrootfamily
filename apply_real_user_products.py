import json, re

# Top 3 products provided directly by the user with exact Shopee images and real links
real_products = [
    {
        "title": "Faca De Caça Pesca Churrasco Luxo Personalizada com seu Nome Gravado",
        "category": "esportes",
        "price": "R$ 68,90",
        "oldPrice": "R$ 139,90",
        "discount": "51% OFF",
        "rating": "4,9",
        "reviews": "8,4k",
        "image": "assets/images/prod-faca.jpg",
        "affiliateUrl": "https://shopee.com.br/Faca-De-Ca%C3%A7a-Pesca-Churrasco-Luxo-Personalizada-com-seu-Nome-Gravado-i.552841607.22993928341?extraParams=%7B%22display_model_id%22%3A209606531649%2C%22model_selection_logic%22%3A3%7D&aff_id=1836460594",
        "id": 1788500001,
        "updatedAt": "03/09/2026 às 22:15",
        "rank": 1
    },
    {
        "title": "Óculos Sol Esportivo Máscara Lente Azul Espelhado Ciclismo Bike MTB UV400",
        "category": "esportes",
        "price": "R$ 24,90",
        "oldPrice": "R$ 83,00",
        "discount": "70% OFF",
        "rating": "4,9",
        "reviews": "12,1k",
        "image": "assets/images/prod-oculos.jpg",
        "affiliateUrl": "https://shopee.com.br/%C3%93culos-Sol-Esportivo-Mascara-Branco-Lente-Azul-Espelhado-Ciclismo-Bike-MTB-UV400-Corrida-Pesca-Masculino-i.1138019028.58262941970?extraParams=%7B%22display_model_id%22%3A209190888517%2C%22model_selection_logic%22%3A3%7D&aff_id=1836460594",
        "id": 1788500002,
        "updatedAt": "03/09/2026 às 22:15",
        "rank": 2
    },
    {
        "title": "Pulseira Oceano Silicone Para Apple Watch e Iwo 38mm até 49mm Ultra",
        "category": "eletronicos",
        "price": "R$ 14,90",
        "oldPrice": "R$ 49,90",
        "discount": "70% OFF",
        "rating": "4,8",
        "reviews": "19,8k",
        "image": "assets/images/prod-pulseira.jpg",
        "affiliateUrl": "https://shopee.com.br/Pulseira-Oceano-Silicone-Para-Apple-Watch-e-Iwo-38mm-40mm-41mm-42mm-44mm-45mm-49mm-Ultra-serie-8-i.1242297287.22693870278?extraParams=%7B%22display_model_id%22%3A159783299485%2C%22model_selection_logic%22%3A3%7D&aff_id=1836460594",
        "id": 1788500003,
        "updatedAt": "03/09/2026 às 22:15",
        "rank": 3
    }
]

# Load existing products to keep other slots filled
with open('data/products.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)

# Keep other products below the top 3
seen = {p['title'].lower() for p in real_products}
rest = [p for p in existing if p['title'].lower() not in seen]

combined = real_products + rest[:17]
for idx, p in enumerate(combined):
    p['rank'] = idx + 1

# Save data/products.json
with open('data/products.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, ensure_ascii=False, indent=2)

# Save data/products.js
js_content = 'window.SHOPEE_LAST_UPDATE = "03/09/2026 às 22:15";\n'
js_content += 'window.SHOPEE_PRODUCTS = ' + json.dumps(combined, ensure_ascii=False, indent=2) + ';\n'

with open('data/products.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Saved data/products.json and data/products.js with real Shopee products!")
