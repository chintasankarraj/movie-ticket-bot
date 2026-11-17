from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.goto("https://www.district.in", timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    
    links = page.eval_on_selector_all("a", "elements => elements.map(e => ({href: e.href, text: e.innerText}))")
    movie_links = [l for l in links if "movie" in l["href"].lower() or "movie" in l["text"].lower()]
    print("Found movie links:")
    for l in movie_links[:20]:
        print(" -", l)
        
    browser.close()
