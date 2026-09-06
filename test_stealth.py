from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium_stealth import stealth
import time, re

options = Options()
options.add_argument('--headless=new')
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)
options.add_argument('--window-size=1920,1080')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)

stealth(driver,
    languages=["pt-BR", "pt"],
    vendor="Google Inc.",
    platform="Win32",
    webgl_vendor="Intel Inc.",
    renderer="Intel Iris OpenGL Engine",
    fix_hairline=True,
)

print("Navigating to Shopee best sellers / deals...")
driver.get("https://shopee.com.br")
time.sleep(6)
print("Page title:", driver.title)
print("URL:", driver.current_url)

if "verify" not in driver.current_url:
    print("SUCCESS! Not redirected to verify!")
    # Look for products
    driver.get("https://shopee.com.br/flash_sale")
    time.sleep(6)
    print("Flash sale title:", driver.title)
    print("Flash sale URL:", driver.current_url)
    
    # Extract product cards
    cards = driver.find_elements("css selector", "a[href*='-i.']")
    print(f"Found {len(cards)} product links!")
    for c in cards[:5]:
        href = c.get_attribute("href")
        print("Product link:", href)
else:
    print("Redirected to verify")

driver.quit()
