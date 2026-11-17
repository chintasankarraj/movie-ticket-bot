from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.goto("https://www.district.in/movies/", timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    
    links = page.eval_on_selector_all("a", "els => els.map(e => ({href: e.href, text: e.innerText}))")
    avengers_links = [l for l in links if "avengers" in l["href"].lower() or "avengers" in l["text"].lower() or "doomsday" in l["href"].lower() or "doomsday" in l["text"].lower()]
    print("Found Avengers Links:")
    for l in avengers_links:
        print(" -", l)
        
    browser.close()
