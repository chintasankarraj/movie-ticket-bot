from playwright.sync_api import sync_playwright

url = "https://www.district.in/movies/avengers-doomsday-movie-tickets-in-hyderabad-MV176735"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.goto(url, timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(4000)
    
    # Click Dec 17 if needed, or see all showtime buttons
    # Let's inspect all buttons/links that look like showtimes (e.g. 12:00 AM, 11:30 PM, etc.)
    all_text = page.inner_text("body")
    lines = [line.strip() for line in all_text.split("\n") if line.strip()]
    
    # Look for cinema names and showtimes
    print("--- PAGE SNIPPET ---")
    for i, line in enumerate(lines):
        if "17" in line or "theatre" in line.lower() or "cinema" in line.lower() or "am" in line.lower() or "pm" in line.lower():
            start = max(0, i - 2)
            end = min(len(lines), i + 3)
            print(f"Around line {i}:")
            for j in range(start, end):
                print(f"  [{j}] {lines[j]}")
            print("-" * 20)
            
    browser.close()
