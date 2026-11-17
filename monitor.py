import time
import datetime
import re
import json
import os
import sys
import html
import random
import winsound
import requests
from playwright.sync_api import sync_playwright
from showtime_parser import parse_showtimes, is_midnight_time, ParsedShow

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

def load_seen(filepath=None):
    if filepath is None:
        filepath = SEEN_FILE
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()

def save_seen(seen, filepath=None):
    if filepath is None:
        filepath = SEEN_FILE
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(sorted(list(seen)), f, indent=2)

def mark_shows_seen(seen, bms_shows, district_shows, filepath=None):
    """Add confirmed alerted shows to the seen set and persist to disk."""
    for v, t in bms_shows:
        seen.add(f"BMS_{v}_{t}")
    for v, t in district_shows:
        seen.add(f"DISTRICT_{v}_{t}")
    save_seen(seen, filepath=filepath)

def send_telegram_alert(message, max_retries=3, base_delay=1.0):
    validate_credentials()
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(url, json=payload, timeout=10)

            # Safely determine status code (handling mocks where status_code may be a MagicMock)
            if type(getattr(resp, "status_code", None)) is int:
                status_code = resp.status_code
            else:
                try:
                    data = resp.json()
                    status_code = 200 if (isinstance(data, dict) and data.get("ok")) else 400
                except Exception:
                    status_code = 200

            # 1. Success case
            if status_code == 200:
                try:
                    data = resp.json()
                    if data.get("ok"):
                        return True
                    err_desc = mask_token(str(data.get("description", "Unknown API error")), TELEGRAM_BOT_TOKEN)
                    print(f"[!] Telegram API error (attempt {attempt}/{max_retries}): {err_desc}")
                except Exception as e:
                    print(f"[!] Telegram JSON parse error (attempt {attempt}/{max_retries}): {e}")

            # 2. Rate limit hit (HTTP 429)
            elif status_code == 429:
                retry_after = 5.0
                err_desc = "Too Many Requests"
                try:
                    data = resp.json()
                    err_desc = mask_token(str(data.get("description", err_desc)), TELEGRAM_BOT_TOKEN)
                    if "parameters" in data and "retry_after" in data["parameters"]:
                        retry_after = float(data["parameters"]["retry_after"])
                except Exception:
                    pass

                headers = getattr(resp, "headers", {}) or {}
                if "Retry-After" in headers:
                    try:
                        retry_after = float(headers["Retry-After"])
                    except ValueError:
                        pass

                # Cap retry_after between 0.5s and 30s to avoid excessive blocking
                retry_after = min(max(retry_after, 0.5), 30.0)
                print(f"[!] Telegram rate limit hit (HTTP 429, attempt {attempt}/{max_retries}): {err_desc}. Sleeping {retry_after}s...")
                if attempt < max_retries:
                    time.sleep(retry_after)
                    continue
                else:
                    print(f"[!] Telegram rate limit: max retries ({max_retries}) exhausted.")
                    return False

            # 3. Permanent client errors (HTTP 4xx except 429: 400, 401, 403, 404, etc.)
            elif 400 <= status_code < 500:
                try:
                    data = resp.json()
                    err_desc = mask_token(str(data.get("description", getattr(resp, "text", ""))), TELEGRAM_BOT_TOKEN)
                except Exception:
                    err_desc = mask_token(str(getattr(resp, "text", ""))[:200], TELEGRAM_BOT_TOKEN)
                print(f"[!] Telegram client error HTTP {status_code} (non-retryable): {err_desc}")
                return False

            # 4. Server errors (HTTP 5xx)
            elif status_code >= 500:
                err_text = mask_token(str(getattr(resp, "text", ""))[:200], TELEGRAM_BOT_TOKEN)
                print(f"[!] Telegram server error HTTP {status_code} (attempt {attempt}/{max_retries}): {err_text}")

            # 5. Unexpected status
            else:
                err_text = mask_token(str(getattr(resp, "text", ""))[:200], TELEGRAM_BOT_TOKEN)
                print(f"[!] Telegram unexpected HTTP {status_code} (attempt {attempt}/{max_retries}): {err_text}")

        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as net_err:
            safe_err = mask_token(str(net_err), TELEGRAM_BOT_TOKEN)
            print(f"[!] Telegram network error (attempt {attempt}/{max_retries}): {safe_err}")

        except Exception as e:
            safe_err = mask_token(str(e), TELEGRAM_BOT_TOKEN)
            print(f"[!] Telegram request exception (attempt {attempt}/{max_retries}): {safe_err}")

        # Sleep with exponential backoff and jitter if retries remain
        if attempt < max_retries:
            jitter = random.uniform(0.1, 0.5)
            delay = (base_delay * (2 ** (attempt - 1))) + jitter
            print(f"    Retrying Telegram alert in {delay:.2f}s...")
            time.sleep(delay)
        else:
            print(f"[!] Telegram alert delivery failed after {max_retries} attempts.")
            return False

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

def check_bookmyshow(page, seen):
    found_shows = []
    cycle_seen = set()
    try:
        page.goto(BMS_BUY_URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        
        all_text = page.inner_text("body")
        parsed_shows = parse_showtimes(all_text, provider="BookMyShow")
        
        for show in parsed_shows:
            if show.is_midnight:
                show_key = f"BMS_{show.venue}_{show.time}"
                if show_key not in seen and show_key not in cycle_seen:
                    found_shows.append((show.venue, show.time))
                    cycle_seen.add(show_key)
                        
    except Exception as e:
        print(f"  [BookMyShow Error]: {e}")
        
    return found_shows

def check_district(page, seen):
    found_shows = []
    cycle_seen = set()
    try:
        page.goto(DISTRICT_URL, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        
        all_text = page.inner_text("body")
        parsed_shows = parse_showtimes(all_text, provider="District")
        
        for show in parsed_shows:
            if show.is_midnight:
                show_key = f"DISTRICT_{show.venue}_{show.time}"
                if show_key not in seen and show_key not in cycle_seen:
                    found_shows.append((show.venue, show.time))
                    cycle_seen.add(show_key)
                        
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
                sound_alarm()
                
                full_msg = format_telegram_alert(bms_new, district_new)
                print("\n" + "!" * 50)
                print("💥 12 AM SHOWS DETECTED! SENDING ALERT...")
                print("!" * 50)
                sent = send_telegram_alert(full_msg)
                if sent:
                    mark_shows_seen(seen, bms_new, district_new)
                    print("✅ Telegram notification sent successfully and seen_shows.json updated!")
                else:
                    print("❌ Failed to send Telegram alert. Shows will remain un-seen and retried on next cycle.")
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
