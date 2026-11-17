from playwright.sync_api import sync_playwright

buy_url = "https://in.bookmyshow.com/buytickets/avengers-doomsday-hyderabad/movie-hyd-ET00439706-MT/20261217"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=False)
    page = browser.new_page()
    page.goto(buy_url, timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(5000)
    
    all_text = page.inner_text("body")
    lines = [l.strip() for l in all_text.split("\n") if l.strip()]
    
    # Let's filter lines that look like times: e.g. "12:00 AM", "01:00 AM", "09:30 AM", etc.
    import re
    time_pattern = re.compile(r"^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$", re.IGNORECASE)
    
    shows = [l for l in lines if time_pattern.match(l)]
    print(f"Total showtime chips found: {len(shows)}")
    print("Shows sample:", shows[:20])
    
    # Also check if any line mentions 12:00 AM or 12:xx AM or 01:xx AM
    midnight_shows = [l for l in shows if l.upper().endswith("AM") and (l.startswith("12:") or l.startswith("01:") or l.startswith("02:") or l.startswith("03:") or l.startswith("04:"))]
    print(f"Midnight / early shows found: {len(midnight_shows)}")
    print("Midnight shows:", midnight_shows)
    
    browser.close()
