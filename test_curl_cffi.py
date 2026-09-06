from curl_cffi import requests
import json

# Test Shopee API with real Chrome TLS fingerprint
url = "https://shopee.com.br/api/v4/search/search_items?by=sales&keyword=teclado%20mecanico&limit=5&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2"

headers = {
    "Accept": "application/json",
    "x-shopee-language": "pt-BR",
    "x-api-source": "pc",
    "Referer": "https://shopee.com.br/"
}

try:
    print("Sending request with Chrome impersonation...")
    r = requests.get(url, headers=headers, impersonate="chrome124", timeout=12)
    print("Status code:", r.status_code)
    print("Response text sample:", r.text[:300])
    if r.status_code == 200:
        data = r.json()
        items = data.get("items", [])
        print(f"SUCCESS! Found {len(items)} items directly from Shopee!")
        for item in items[:3]:
            basic = item.get("item_basic", {})
            title = basic.get("name")
            price = basic.get("price", 0) / 100000.0  # Shopee prices are in micro-units (multiply by 100000)
            raw_discount = basic.get("raw_discount", 0)
            image_id = basic.get("image")
            item_id = basic.get("itemid")
            shop_id = basic.get("shopid")
            img_url = f"https://down-br.img.susercontent.com/file/{image_id}"
            prod_url = f"https://shopee.com.br/product/{shop_id}/{item_id}"
            print(f"- {title} | R$ {price:.2f} | {raw_discount}% OFF | Img: {img_url}")
except Exception as e:
    print("Error:", e)
