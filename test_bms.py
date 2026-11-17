from playwright.sync_api import sync_playwright

url = "https://in.bookmyshow.com/hyderabad/movies/avengers-doomsday/ET00439706"

with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="msedge",
        headless=True,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
        ]
    )
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
    )
    page = context.new_page()
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    print("Navigating...")
    page.goto(url, timeout=30000, wait_until="networkidle")
    print("Page Title:", page.title())
    content = page.content()
    print("Title in content:", "Avengers" in content)
    print("Contains 'Book tickets':", "book tickets" in content.lower())
    print("Contains 'Interested':", "interested" in content.lower())
    browser.close()
