#!/usr/bin/env python3
"""
ReactBits Proxy Key Auto-Refresher Script
Automatically logs in to dash.collectui.vip, fetches active/trial license keys,
and updates .env.local with the valid REACTBITS_LICENSE_KEY.
"""

import json
import os
import re
import sys
import urllib.request

ENV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.local")
DEFAULT_TRIAL_KEY = "try_reactbits_public_2026"

def get_env_credentials():
    username = os.environ.get("REACTBITS_PROXY_USER", "Jawline3144")
    password = os.environ.get("REACTBITS_PROXY_PASS", "gWNUCXU8nK54iNeQ")

    if os.path.exists(ENV_FILE_PATH):
        with open(ENV_FILE_PATH, "r") as f:
            content = f.read()
            u_match = re.search(r"REACTBITS_PROXY_USER=(.+)", content)
            p_match = re.search(r"REACTBITS_PROXY_PASS=(.+)", content)
            if u_match:
                username = u_match.group(1).strip()
            if p_match:
                password = p_match.group(1).strip()

    return username, password

def fetch_latest_key(username, password):
    print(f"[*] Authenticating with dash.collectui.vip as '{username}'...")
    login_url = "https://dash.collectui.vip/api/auth/login"
    payload = json.dumps({"username": username, "password": password}).encode("utf-8")

    req = urllib.request.Request(
        login_url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )

    try:
        res = urllib.request.urlopen(req)
        cookies = res.headers.get_all("Set-Cookie")
        if cookies:
            cookie_str = "; ".join([c.split(";")[0] for c in cookies])
            
            # Fetch dashboard page
            dash_url = "https://dash.collectui.vip/"
            req_dash = urllib.request.Request(
                dash_url,
                headers={
                    "Cookie": cookie_str,
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "RSC": "1"
                }
            )
            res_dash = urllib.request.urlopen(req_dash)
            content = res_dash.read().decode("utf-8", errors="ignore")

            # Search for paid reactbits key
            keys = re.findall(r"reactbits_[A-Za-z0-9_-]+", content)
            if keys:
                paid_key = list(set(keys))[0]
                print(f"[+] Found active paid key: {paid_key}")
                return paid_key

    except Exception as e:
        print(f"[!] Warning during dash authentication: {e}")

    print(f"[*] Using public trial key fallback: {DEFAULT_TRIAL_KEY}")
    return DEFAULT_TRIAL_KEY

def update_env_file(new_key):
    if not os.path.exists(ENV_FILE_PATH):
        print(f"[!] .env.local file not found at {ENV_FILE_PATH}")
        return

    with open(ENV_FILE_PATH, "r") as f:
        content = f.read()

    if "REACTBITS_LICENSE_KEY=" in content:
        updated_content = re.sub(
            r"REACTBITS_LICENSE_KEY=.*",
            f"REACTBITS_LICENSE_KEY={new_key}",
            content
        )
    else:
        updated_content = content.rstrip() + f"\nREACTBITS_LICENSE_KEY={new_key}\n"

    with open(ENV_FILE_PATH, "w") as f:
        f.write(updated_content)

    print(f"[✓] Updated .env.local with REACTBITS_LICENSE_KEY={new_key}")

def main():
    username, password = get_env_credentials()
    new_key = fetch_latest_key(username, password)
    if new_key:
        update_env_file(new_key)
        print("[✓] License key refresh completed successfully.")

if __name__ == "__main__":
    main()
