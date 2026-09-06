import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
import time, json

options = uc.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--window-size=1920,1080')

print("Starting undetected ChromeDriver...")
try:
    driver = uc.Chrome(options=options, version_main=124)
    print("Navigating to Shopee...")
    driver.get("https://shopee.com.br/flash_sale")
    time.sleep(8)
    print("Title:", driver.title)
    print("URL:", driver.current_url)

    # Check if verify error
    if "verify" in driver.current_url:
        print("Still got verify redirect")
    else:
        print("BYPASSED SUCCESSFULLY! Current page is live Shopee!")
        # Look for product items
        items = driver.find_elements(By.TAG_NAME, "a")
        print(f"Found {len(items)} links on page")

    driver.quit()
except Exception as e:
    print("Error:", e)
