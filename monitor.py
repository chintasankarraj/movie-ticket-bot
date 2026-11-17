import time
import datetime
import re
import json
import os
import sys
import html
import winsound
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
CHECK_INTERVAL_SECONDS = 90  # Check every 90 seconds

BMS_BUY_URL = "https://in.bookmyshow.com/buytickets/avengers-doomsday-hyderabad/movie-hyd-ET00439706-MT/20261217"
DISTRICT_URL = "https://www.district.in/movies/avengers-doomsday-movie-tickets-in-hyderabad-MV176735"

SEEN_FILE = os.path.join(os.path.dirname(__file__), "seen_shows.json")
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
            "    either in your environment or in a .env file.\n"
            "    See .env.example for template."
        )

def load_seen():
    if os.path.exists(SEEN_FILE):
        try:
            with open(SEEN_FILE, "r") as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()

def save_seen(seen):
    with open(SEEN_FILE, "w") as f:
        json.dump(list(seen), f)

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

def sound_alarm():
    """Play high-pitched alert beeps on Windows to grab immediate attention."""
    try:
        for _ in range(5):
            winsound.Beep(1200, 300)
            time.sleep(0.1)
            winsound.Beep(1800, 400)
            time.sleep(0.1)
    except Exception:
        pass

def is_midnight_time(time_str):
    """Checks if showtime is between 12:00 AM and 04:59 AM."""
    t = time_str.strip().upper()
    if not t.endswith("AM"):
        return False
    # Check for 12:xx AM, 01:xx AM, 02:xx AM, 03:xx AM, 04:xx AM
    for prefix in ["12:", "01:", "02:", "03:", "04:", "1:", "2:", "3:", "4:"]:
        if t.startswith(prefix):
            return True
    return False

def check_bookmyshow(page, seen):
    found_shows = []
    try:
        page.goto(BMS_BUY_URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        
        all_text = page.inner_text("body")
        lines = [l.strip() for l in all_text.split("\n") if l.strip()]
        
        time_pattern = re.compile(r"^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$", re.IGNORECASE)
        
        # Scan through lines
        current_venue = "Unknown Venue"
        for i, line in enumerate(lines):
            # Venue headers often have "PVR", "INOX", "Cinemas", "Theatre", etc.
            if any(k in line.lower() for k in ["pvr", "inox", "cinemas", "theatre", "multiplex", "70mm", "talkies", "prasads", "cinepolis"]):
                current_venue = line
            
            if time_pattern.match(line):
                if is_midnight_time(line):
                    show_key = f"BMS_{current_venue}_{line}"
                    if show_key not in seen:
                        found_shows.append((current_venue, line))
                        seen.add(show_key)
                        
    except Exception as e:
        print(f"  [BookMyShow Error]: {e}")
        
    return found_shows

def check_district(page, seen):
    found_shows = []
    try:
        page.goto(DISTRICT_URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        
        all_text = page.inner_text("body")
        lines = [l.strip() for l in all_text.split("\n") if l.strip()]
        
        time_pattern = re.compile(r"^(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM)$", re.IGNORECASE)
        
        current_venue = "Unknown Venue"
        for i, line in enumerate(lines):
            if any(k in line.lower() for k in ["pvr", "inox", "miraj", "cinemas", "theatre", "multiplex", "70mm", "talkies", "cinepolis", "prasads"]):
                current_venue = line
                
            if time_pattern.match(line):
                if is_midnight_time(line):
                    show_key = f"DISTRICT_{current_venue}_{line}"
                    if show_key not in seen:
                        found_shows.append((current_venue, line))
                        seen.add(show_key)
                        
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
    print(" 🍿 AVENGERS: DOOMSDAY (Dec 17) - 12 AM SHOWS TICKET NOTIFIER")
    print(" City: Hyderabad")
    print(f" Check Interval: Every {CHECK_INTERVAL_SECONDS} seconds")
    print(" Monitoring: BookMyShow & District App")
    print("=" * 60)
    
    seen = load_seen()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
        )
        page = context.new_page()
        
        cycle = 1
        while True:
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"\n[{now_str}] Check #{cycle} starting...")
            
            # 1. Check BookMyShow
            print("  -> Checking BookMyShow...")
            bms_new = check_bookmyshow(page, seen)
            
            # 2. Check District
            print("  -> Checking District...")
            district_new = check_district(page, seen)
            
            # 3. Handle alerts
            if bms_new or district_new:
                save_seen(seen)
                sound_alarm()
                
                full_msg = format_telegram_alert(bms_new, district_new)
                print("\n" + "!" * 50)
                print("💥 12 AM SHOWS DETECTED! SENDING ALERT...")
                print("!" * 50)
                sent = send_telegram_alert(full_msg)
                if sent:
                    print("✅ Telegram notification sent successfully!")
                else:
                    print("❌ Failed to send Telegram alert.")
            else:
                print("  -> No 12 AM shows released yet.")
                
            cycle += 1
            print(f"  -> Waiting {CHECK_INTERVAL_SECONDS}s before next check... (Press Ctrl+C to stop)")
            time.sleep(CHECK_INTERVAL_SECONDS)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[!] Monitor stopped by user.")
        sys.exit(0)
