import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    
    # Listen to network requests to see what APIs District calls
    apis = []
    page.on("response", lambda r: apis.append(r.url) if "api" in r.url or "graphql" in r.url else None)
    
    page.goto("https://www.district.in", timeout=30000, wait_until="networkidle")
    print("APIs called on District home:")
    for a in apis[:15]:
        print(" -", a)
        
    browser.close()
