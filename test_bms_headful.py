import os
from playwright.sync_api import sync_playwright

url = "https://in.bookmyshow.com/hyderabad/movies/avengers-doomsday/ET00439706"

with sync_playwright() as p:
    # Use real installed Edge
    browser = p.chromium.launch(channel="msedge", headless=False)
    page = browser.new_page()
    try:
        page.goto(url, timeout=25000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        print("Page Title:", page.title())
        content = page.content()
        print("Has Avengers:", "avengers" in content.lower())
        print("Has Book Tickets:", "book tickets" in content.lower())
    except Exception as e:
        print("Error:", e)
    browser.close()
