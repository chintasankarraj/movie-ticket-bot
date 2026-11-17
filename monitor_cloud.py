import os
import sys
import time
import datetime
import re
import requests
from playwright.sync_api import sync_playwright

# ==================== CONFIGURATION ====================
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "9240366318:AAFxev3gxJYJEtF4A9rwAF4nRlaNmsw70P8")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "1836867995")

BMS_BUY_URL = "https://in.bookmyshow.com/buytickets/avengers-doomsday-hyderabad/movie-hyd-ET00439706-MT/20261217"
DISTRICT_URL = "https://www.district.in/movies/avengers-doomsday-movie-tickets-in-hyderabad-MV176735"

# Run duration in seconds for each GitHub Actions workflow execution
# Runs checks every 30 seconds for ~4 minutes per job
RUN_DURATION_SECONDS = 240
CHECK_INTERVAL_SECONDS = 30
# =======================================================

def send_telegram_alert(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }
    try:
        resp = requests.post(url, json=payload, timeout=10)
        data = resp.json()
        if not data.get("ok"):
            print(f"[!] Telegram send error: {data.get('description')}")
            return False
        return True
    except Exception as e:
        print(f"[!] Telegram request failed: {e}")
        return False

def is_midnight_time(time_str):
    """Checks if showtime is between 12:00 AM and 04:59 AM."""
    t = time_str.strip().upper()
    if not t.endswith("AM"):
        return False
    for prefix in ["12:", "01:", "02:", "03:", "04:", "1:", "2:", "3:", "4:"]:
        if t.startswith(prefix):
            return True
    return False

def check_bookmyshow(page):
    found_shows = []
    try:
        page.goto(BMS_BUY_URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        
        all_text = page.inner_text("body")
        lines = [l.strip() for l in all_text.split("\n") if l.strip()]
        
        time_pattern = re.compile(r"^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$", re.IGNORECASE)
        
        current_venue = "Unknown Venue"
        for line in lines:
            if any(k in line.lower() for k in ["pvr", "inox", "cinemas", "theatre", "multiplex", "70mm", "talkies", "prasads", "cinepolis"]):
                current_venue = line
            
            if time_pattern.match(line):
                if is_midnight_time(line):
                    found_shows.append((current_venue, line))
    except Exception as e:
        print(f"  [BookMyShow Error]: {e}")
        
    return found_shows

def check_district(page):
    found_shows = []
    try:
        page.goto(DISTRICT_URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        
        all_text = page.inner_text("body")
        lines = [l.strip() for l in all_text.split("\n") if l.strip()]
        
        time_pattern = re.compile(r"^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$", re.IGNORECASE)
        
        current_venue = "Unknown Venue"
        for line in lines:
            if any(k in line.lower() for k in ["pvr", "inox", "miraj", "cinemas", "theatre", "multiplex", "70mm", "talkies", "cinepolis", "prasads"]):
                current_venue = line
                
            if time_pattern.match(line):
                if is_midnight_time(line):
                    found_shows.append((current_venue, line))
    except Exception as e:
        print(f"  [District Error]: {e}")
        
    return found_shows

def main():
    print("=" * 60)
    print(" ☁️ CLOUD NOTIFIER: AVENGERS DOOMSDAY (HYDERABAD - DEC 17)")
    print(f" Run Window: ~{RUN_DURATION_SECONDS // 60} minutes | Poll every {CHECK_INTERVAL_SECONDS}s")
    print("=" * 60)
    
    start_time = time.time()
    cycle = 1
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        while time.time() - start_time < RUN_DURATION_SECONDS:
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"\n[{now_str}] Check #{cycle} starting...")
            
            print("  -> Checking BookMyShow...")
            bms_shows = check_bookmyshow(page)
            
            print("  -> Checking District...")
            district_shows = check_district(page)
            
            if bms_shows or district_shows:
                msg_lines = [
                    "🚨 <b>TICKETS ALERT: 12 AM SHOWS FOUND!</b> 🚨\n",
                    "<b>Movie:</b> Avengers: Doomsday",
                    "<b>Date:</b> December 17, 2026",
                    "<b>City:</b> Hyderabad\n"
                ]
                
                if bms_shows:
                    msg_lines.append("🎟️ <b>BookMyShow Shows:</b>")
                    for v, t in bms_shows:
                        msg_lines.append(f"• <b>{t}</b> at {v}")
                    msg_lines.append(f'<a href="{BMS_BUY_URL}">👉 Click Here to Book on BookMyShow</a>\n')
                    
                if district_shows:
                    msg_lines.append("🎟️ <b>District Shows:</b>")
                    for v, t in district_shows:
                        msg_lines.append(f"• <b>{t}</b> at {v}")
                    msg_lines.append(f'<a href="{DISTRICT_URL}">👉 Click Here to Book on District</a>\n')
                    
                full_msg = "\n".join(msg_lines)
                print("\n" + "!" * 50)
                print("💥 12 AM SHOWS FOUND! SENDING TELEGRAM ALERT...")
                print("!" * 50)
                send_telegram_alert(full_msg)
                # Break immediately once tickets are found
                break
            else:
                print("  -> No 12 AM shows found yet.")
                
            cycle += 1
            time.sleep(CHECK_INTERVAL_SECONDS)
            
        browser.close()
    print("\n✅ Check cycle finished for this run.")

if __name__ == "__main__":
    main()
