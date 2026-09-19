"""Capture authenticated dashboard screenshots for the pitch deck.

Logs in via the backend API, injects the JWT into localStorage
(key: securithm_token), then screenshots dashboard pages.
"""
import asyncio
import json
import os
import urllib.request

from playwright.async_api import async_playwright

API = 'http://localhost:8001'
BASE = 'http://localhost:3001'
OUT = 'scripts/out/shots'
EMAIL = 'dev@example.com'
PASSWORD = 'password123'
SHOTS = [
    ('dashboard', '/dashboard'),
    ('scans', '/dashboard/scans'),
    ('monitoring', '/dashboard/monitoring'),
]

os.makedirs(OUT, exist_ok=True)


def api_login() -> str:
    body = json.dumps({'email': EMAIL, 'password': PASSWORD}).encode()
    req = urllib.request.Request(
        API + '/api/v1/auth/login',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
    return data['access_token']


async def main():
    token = api_login()
    print('login OK, token len:', len(token))
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 1440, 'height': 810})
        page = await ctx.new_page()
        # land once to set origin, then inject token before app reads it
        await page.goto(BASE + '/auth/login', wait_until='domcontentloaded')
        await page.evaluate(f"localStorage.setItem('securithm_token', '{token}')")
        for name, path in SHOTS:
            try:
                await page.goto(BASE + path, wait_until='networkidle', timeout=45000)
            except Exception as e:
                print(f'WARN {name}: {type(e).__name__} - continuing')
            await page.wait_for_timeout(3000)
            # if redirected to login, re-inject and retry once
            if '/auth/login' in page.url:
                await page.evaluate(f"localStorage.setItem('securithm_token', '{token}')")
                await page.goto(BASE + path, wait_until='networkidle', timeout=45000)
                await page.wait_for_timeout(3000)
            dest = f'{OUT}/{name}.png'
            await page.screenshot(path=dest)
            print(f'{name}: {dest} ({os.path.getsize(dest)} bytes) url={page.url}')
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
