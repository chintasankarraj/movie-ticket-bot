import os
import sys
import time
import datetime
import re
import html
import requests
from playwright.sync_api import sync_playwright

# ==================== ENVIRONMENT CONFIGURATION ====================
def load_env_file(filepath=None):
    """Lightweight .env loader without external dependencies."""
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("\"'").strip()
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"[!] Warning: Could not read .env: {e}")

load_env_file()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

BMS_BUY_URL = "https://in.bookmyshow.com/buytickets/avengers-doomsday-hyderabad/movie-hyd-ET00439706-MT/20261217"
DISTRICT_URL = "https://www.district.in/movies/avengers-doomsday-movie-tickets-in-hyderabad-MV176735"

# Run duration in seconds for each GitHub Actions workflow execution
# Runs checks every 30 seconds for ~4 minutes per job
RUN_DURATION_SECONDS = 240
CHECK_INTERVAL_SECONDS = 30
# ===================================================================

def mask_token(text: str, token: str) -> str:
    """Mask token from any string before logging to prevent accidental credential leakage."""
    if token and token in text:
        return text.replace(token, "[REDACTED_BOT_TOKEN]")
    return text

def validate_credentials():
    """Verify that required credentials are set; fail safely if missing."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        sys.exit(
            "[!] CONFIGURATION ERROR: Missing required credentials.\n"
            "    Please configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID\n"
            "    as environment variables (or GitHub Actions Secrets).\n"
            "    See .env.example for template."
        )

def send_telegram_alert(message):
    validate_credentials()
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
            err_desc = mask_token(str(data.get("description")), TELEGRAM_BOT_TOKEN)
            print(f"[!] Telegram send error: {err_desc}")
            return False
        return True
    except Exception as e:
        safe_err = mask_token(str(e), TELEGRAM_BOT_TOKEN)
        print(f"[!] Telegram request failed: {safe_err}")
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

def format_telegram_alert(bms_shows, district_shows):
    """Format and HTML-escape telegram alert message."""
    msg_lines = [
        "🚨 <b>TICKETS ALERT: 12 AM SHOWS FOUND!</b> 🚨\n",
        "<b>Movie:</b> Avengers: Doomsday",
        "<b>Date:</b> December 17, 2026",
        "<b>City:</b> Hyderabad\n"
    ]
    
    if bms_shows:
        msg_lines.append("🎟️ <b>BookMyShow Shows:</b>")
        for v, t in bms_shows:
            clean_v = html.escape(str(v))
            clean_t = html.escape(str(t))
            msg_lines.append(f"• <b>{clean_t}</b> at {clean_v}")
        msg_lines.append(f'<a href="{BMS_BUY_URL}">👉 Click Here to Book on BookMyShow</a>\n')
        
    if district_shows:
        msg_lines.append("🎟️ <b>District Shows:</b>")
        for v, t in district_shows:
            clean_v = html.escape(str(v))
            clean_t = html.escape(str(t))
            msg_lines.append(f"• <b>{clean_t}</b> at {clean_v}")
        msg_lines.append(f'<a href="{DISTRICT_URL}">👉 Click Here to Book on District</a>\n')
        
    return "\n".join(msg_lines)

def main():
    validate_credentials()
    
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
                full_msg = format_telegram_alert(bms_shows, district_shows)
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
