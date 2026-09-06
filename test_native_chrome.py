import subprocess, time, json, requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# 1. Launch Chrome directly via subprocess with remote debugging
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
temp_dir = r"C:\Users\clodo\AppData\Local\Temp\shopee_bot_chrome"

cmd = [
    chrome_path,
    "--remote-debugging-port=9222",
    f"--user-data-dir={temp_dir}",
    "--window-position=-2000,-2000", # off screen
    "--no-first-run",
    "--no-default-browser-check"
]

print("Launching native Chrome...")
proc = subprocess.Popen(cmd)
time.sleep(3)

# 2. Connect Selenium to the running Chrome via debugger address
opt = Options()
opt.add_experimental_option("debuggerAddress", "127.0.0.1:9222")

try:
    driver = webdriver.Chrome(options=opt)
    print("Navigating to Shopee product...")
    driver.get("https://shopee.com.br/Teclado-Mec%C3%A2nico-i.473616631.23793643404")
    time.sleep(8)
    print("URL:", driver.current_url)
    print("Title:", driver.title)
    
    if "verify" not in driver.current_url:
        print("🎉 SUCCESS! NATIVE CHROME BYPASSED AKAMAI!")
        # Try to find price and image
        imgs = driver.find_elements("css selector", "img[src*='susercontent']")
        print(f"Found {len(imgs)} Shopee images on page!")
        for img in imgs[:3]:
            print("  Image src:", img.get_attribute("src"))
    else:
        print("Redirected to verify")
        
    driver.quit()
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
