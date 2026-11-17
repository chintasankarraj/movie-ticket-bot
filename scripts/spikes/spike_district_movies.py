from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.goto("https://www.district.in/movies/", timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    
    print("Page Title:", page.title())
    content = page.content()
    print("Content len:", len(content))
    
    # Check if there's a search bar or search input
    inputs = page.eval_on_selector_all("input", "els => els.map(e => ({placeholder: e.placeholder, name: e.name, type: e.type}))")
    print("Inputs:", inputs)
    
    # Check all movie cards/titles on movies page
    titles = page.eval_on_selector_all("h3, h4, p", "els => els.map(e => e.innerText.trim()).filter(t => t.length > 2)")
    print("Sample text on page:", titles[:20])
    
    browser.close()
