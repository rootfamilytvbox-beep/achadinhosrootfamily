import re, json, sys

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

for name, path in files.items():
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    print(f"\n--- {name.upper()} ---")
    
    # Check meta description
    m_desc = re.findall(r'<meta [^>]*name="description"[^>]*content="([^"]*)"', text)
    if m_desc:
        print("Meta description:", m_desc[0])
    
    # Check schema json
    for s in re.findall(r'<script type="application/ld\+json">([^<]+)</script>', text):
        try:
            d = json.loads(s)
            print("JSON-LD:", d.get("name"), "| offers:", d.get("offers"))
        except Exception:
            pass
    
    # Search for price patterns like R$ XX,XX
    prices = re.findall(r'R\$\s*[\d\.,]+', text)
    if prices:
        print("Found prices in text:", set(prices[:10]))
