from playwright.sync_api import sync_playwright

buy_url = "https://in.bookmyshow.com/buytickets/avengers-doomsday-hyderabad/movie-hyd-ET00439706-MT/20261217"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=False)
    page = browser.new_page()
    page.goto(buy_url, timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(5000)
    
    print("Buy Tickets Page Title:", page.title())
    all_text = page.inner_text("body")
    lines = [l.strip() for l in all_text.split("\n") if l.strip()]
    
    print("\n--- SAMPLE CONTENT ON BMS BUY PAGE ---")
    for l in lines[:35]:
        print("  -", l)
        
    browser.close()
