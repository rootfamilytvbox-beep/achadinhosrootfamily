import requests, re, json
from bs4 import BeautifulSoup

url = "https://shopee.com.br/Teclado-Mec%C3%A2nico-i.473616631.23793643404"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9"
}

r = requests.get(url, headers=headers, timeout=12)
soup = BeautifulSoup(r.text, "html.parser")

found_images = []

for m in soup.find_all("meta"):
    p = m.get("property", "") or m.get("name", "")
    c = m.get("content", "")
    if "image" in p.lower() or "image" in c.lower() or "susercontent" in c:
        print(f"Meta [{p}]: {c}")
        found_images.append(c)

for s in soup.find_all("script", type="application/ld+json"):
    try:
        data = json.loads(s.string)
        print("JSON-LD found:", data.get("@type"))
        if "image" in data:
            img = data["image"]
            print("JSON-LD image:", img)
            if isinstance(img, list):
                found_images.extend(img)
            else:
                found_images.append(img)
    except Exception:
        pass

# Also look for any Shopee image hash pattern in the raw HTML
# Shopee image hashes are 32-character hex or alphanumeric strings: e.g. /file/br-11134207-7r98o-xxxxxxx or /file/abcdef0123456789...
hashes = re.findall(r'file/([a-zA-Z0-9_\-]{20,40})', r.text)
if hashes:
    print(f"Found {len(hashes)} image hashes:")
    for h in set(hashes[:10]):
        img_url = f"https://down-br.img.susercontent.com/file/{h}"
        print("  ->", img_url)
        found_images.append(img_url)

print("Total found:", len(found_images))
