import os
from playwright.sync_api import sync_playwright

profile_dir = os.path.abspath("edge_profile")
url = "https://in.bookmyshow.com/hyderabad/movies/avengers-doomsday/ET00439706"

with sync_playwright() as p:
    context = p.chromium.launch_persistent_context(
        user_data_dir=profile_dir,
        channel="msedge",
        headless=True,
        args=[
            "--disable-blink-features=AutomationControlled",
        ]
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto(url, timeout=30000, wait_until="domcontentloaded")
    page.wait_for_timeout(4000)
    print("Page Title:", page.title())
    content = page.content()
    print("Has Avengers:", "avengers" in content.lower())
    print("Has Book Tickets:", "book tickets" in content.lower())
    print("Has Interested:", "interested" in content.lower())
    context.close()
