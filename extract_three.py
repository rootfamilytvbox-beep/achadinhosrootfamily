import re, os, sys, requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

files = {
    "faca": r"C:\Users\clodo\.gemini\antigravity-ide\brain\33e05a2b-45b5-43f4-80e5-555977e79ce7\.system_generated\steps\572\content.md",
    "oculos": r"C:\Users\clodo\.gemini\antigravity-ide\brain\33e05a2b-45b5-43f4-80e5-555977e79ce7\.system_generated\steps\592\content.md",
    "pulseira": r"C:\Users\clodo\.gemini\antigravity-ide\brain\33e05a2b-45b5-43f4-80e5-555977e79ce7\.system_generated\steps\594\content.md"
}

dest_dir = r"c:\Users\clodo\OneDrive\Documentos\Site afiliado shopee\assets\images"
headers = {"User-Agent": "Mozilla/5.0"}

results = {}

for name, path in files.items():
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    
    # Extract unique susercontent images
    imgs = list(set(re.findall(r'https?://(?:down-br\.img\.susercontent\.com|cf\.shopee\.com\.br)/file/([a-zA-Z0-9_\-]+)', text)))
    print(f"[{name}] found {len(imgs)} Shopee CDN image IDs")
    if imgs:
        img_id = imgs[0]
        shopee_cdn_url = f"https://down-br.img.susercontent.com/file/{img_id}"
        local_filename = f"prod-{name}.jpg"
        local_path = os.path.join(dest_dir, local_filename)
        
        try:
            r = requests.get(shopee_cdn_url, headers=headers, timeout=10)
            if r.status_code == 200 and len(r.content) > 1000:
                with open(local_path, "wb") as img_file:
                    img_file.write(r.content)
                print(f"DOWNLOADED EXACT SHOPEE IMAGE for {name}: {local_filename} ({len(r.content)} bytes)")
                results[name] = {
                    "shopee_cdn_url": shopee_cdn_url,
                    "local_image": f"assets/images/{local_filename}"
                }
            else:
                print(f"Failed to download {shopee_cdn_url}: {r.status_code}")
        except Exception as e:
            print(f"Error downloading {name}: {e}")

print("All done:", results)
