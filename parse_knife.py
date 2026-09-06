import re

with open(r'C:\Users\clodo\.gemini\antigravity-ide\brain\33e05a2b-45b5-43f4-80e5-555977e79ce7\.system_generated\steps\572\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

for m in re.finditer(r'"(price|price_min|price_max|price_before_discount|raw_discount|historical_sold|name)":\s*([0-9"a-zA-Z_\.\, \-]+)', text):
    print(m.group(0))
