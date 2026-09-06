from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import time, json

options = Options()
options.add_argument('--headless=new')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=1920,1080')
options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

try:
    print("Starting Chrome driver...")
    driver = webdriver.Chrome(options=options)
    print("Navigating to Shopee flash sale...")
    driver.get("https://shopee.com.br/flash_sale")
    time.sleep(5)
    print("Page title:", driver.title)
    print("Current URL:", driver.current_url)
    driver.quit()
    print("Success!")
except Exception as e:
    print("Error:", e)
