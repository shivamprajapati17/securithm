"""Visual smoke test: Axiom theme on landing + inner pages."""
import asyncio
import os

from playwright.async_api import async_playwright

BASE = "http://localhost:3001"
OUT = "scripts/out/axiom"
os.makedirs(OUT, exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        errors: list[str] = []
        page.on(
            "console",
            lambda m: errors.append(m.text) if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on(
            "response",
            lambda r: errors.append(f"HTTP {r.status}: {r.url}")
            if r.status >= 400
            else None,
        )

        # 1. Landing hero
        await page.goto(BASE, wait_until="load", timeout=60000)
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUT}/01-hero.png")

        # 2. Metrics bar + ecosystem
        await page.evaluate(
            "document.querySelector('#ecosystem')?.scrollIntoView({behavior:'instant'})"
        )
        await page.wait_for_timeout(1400)
        await page.screenshot(path=f"{OUT}/02-ecosystem.png")

        # 3. Dev quickstart terminal
        await page.evaluate("window.scrollBy(0, 900)")
        await page.wait_for_timeout(1400)
        await page.screenshot(path=f"{OUT}/03-quickstart.png")

        # 4. Login page (inner-page theme check)
        await page.goto(f"{BASE}/auth/login", wait_until="load", timeout=60000)
        await page.wait_for_timeout(1200)
        await page.screenshot(path=f"{OUT}/04-login.png")

        # 5. Docs page
        await page.goto(f"{BASE}/docs", wait_until="load", timeout=60000)
        await page.wait_for_timeout(1200)
        await page.screenshot(path=f"{OUT}/05-docs.png")

        # 6. Dashboard (authenticated via JWT injection)
        ok = await page.evaluate(
            """async () => {
              try {
                const r = await fetch('http://localhost:8001/api/v1/auth/login', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({email:'dev@example.com', password:'password123'}),
                });
                if (!r.ok) return false;
                const d = await r.json();
                localStorage.setItem('auditai_token', d.access_token);
                return true;
              } catch { return false; } }"""
        )
        print("login injected:", ok)
        await page.goto(f"{BASE}/dashboard", wait_until="load", timeout=60000)
        await page.wait_for_timeout(2500)
        await page.screenshot(path=f"{OUT}/06-dashboard.png")

        # 7. Scans page
        await page.goto(f"{BASE}/dashboard/scans", wait_until="load", timeout=60000)
        await page.wait_for_timeout(2200)
        await page.screenshot(path=f"{OUT}/07-scans.png")

        # 8. Mobile hero
        mob = await browser.new_page(viewport={"width": 390, "height": 844})
        await mob.goto(BASE, wait_until="load", timeout=60000)
        await mob.wait_for_timeout(3000)
        await mob.screenshot(path=f"{OUT}/08-mobile.png")
        await mob.close()

        await page.close()
        await browser.close()
        print("shots saved")
        real = [e for e in errors if "favicon" not in e.lower()]
        print("console errors:", len(real))
        for e in real[:8]:
            print("  -", e[:160])


asyncio.run(main())
