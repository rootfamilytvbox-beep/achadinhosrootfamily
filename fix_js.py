import json

with open('data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

js_content = 'window.SHOPEE_LAST_UPDATE = "03/09/2026 às 21:40";\n'
js_content += 'window.SHOPEE_PRODUCTS = ' + json.dumps(products, ensure_ascii=False, indent=2) + ';\n'

with open('data/products.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print('data/products.js updated successfully!')
