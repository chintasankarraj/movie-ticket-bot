from playwright.sync_api import sync_playwright

url = "https://www.district.in/movies/avengers-doomsday-movie-tickets-in-hyderabad-MV176735"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.goto(url, timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(4000)
    
    print("Page Title:", page.title())
    content = page.content()
    
    # Check for dates, theatres, showtimes
    texts = page.eval_on_selector_all("button, div, span, p", "els => els.map(e => e.innerText.trim()).filter(t => t.length > 0 && t.length < 100)")
    # Get unique texts preserving order
    seen = set()
    unique_texts = []
    for t in texts:
        if t not in seen:
            seen.add(t)
            unique_texts.append(t)
            
    print("\nRelevant elements found:")
    for t in unique_texts[:40]:
        print("  *", t)
        
    browser.close()
