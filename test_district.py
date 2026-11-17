import os
from playwright.sync_api import sync_playwright

url = "https://www.district.in"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.goto(url, timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    print("District Title:", page.title())
    content = page.content()
    print("District len:", len(content))
    print("Has Movies in District:", "movie" in content.lower())
    browser.close()
