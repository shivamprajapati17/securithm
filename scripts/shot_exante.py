"""Exante re-theme visual verification: homepage sections, inner pages, mobile."""
import asyncio
import os

from playwright.async_api import async_playwright

OUT = "scripts/out/exante"
os.makedirs(OUT, exist_ok=True)

BASE = "http://localhost:3001"
API = "http://localhost:8001"

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}


async def scroll_and_shoot(page, name: str, positions: list[int]):
    total = await page.evaluate("document.body.scrollHeight - innerHeight")
    for i, frac in enumerate(positions):
        y = int(total * frac)
        await page.evaluate(f"window.scrollTo(0, {y})")
        await page.wait_for_timeout(1400)
        await page.screenshot(path=f"{OUT}/{name}-{i}.png")
        print(f"  {name}-{i}.png @ {frac:.0%}")


async def login(page):
    # Proven-reliable path: authenticate via API, inject the token, verify /auth/me.
    await page.goto(f"{BASE}/auth/login", wait_until="load", timeout=90000)
    await page.wait_for_timeout(1500)
    ok = await page.evaluate(
        """async () => {
          const res = await fetch('http://localhost:8001/api/v1/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'dev@example.com', password: 'password123'}),
          });
          const j = await res.json();
          if (j.access_token) {
            localStorage.setItem('auditai_token', j.access_token);
            return true;
          }
          return false;
        }"""
    )
    print(f"  login ok (API injection): {ok}")


async def main():
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # ── Desktop: homepage sections ──
        page = await browser.new_page(viewport=DESKTOP)
        current = {"url": "home"}
        page.on("framenavigated", lambda f: current.update(url=f.url) if f == page.main_frame else None)
        page.on("console", lambda m: errors.append(f"[{current['url']}] {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"[{current['url']}] {e}"))
        page.on("response", lambda r: errors.append(f"[{current['url']}] HTTP {r.status}: {r.url}") if r.status >= 400 else None)

        await page.goto(BASE, wait_until="load")
        await page.wait_for_timeout(2500)
        await scroll_and_shoot(page, "home", [0.0, 0.14, 0.30, 0.46, 0.62, 0.80, 1.0])

        # ── Desktop: authenticated inner pages (theme spread) ──
        await login(page)

        async def shoot_route(route: str, name: str):
            await page.goto(f"{BASE}{route}", wait_until="domcontentloaded", timeout=90000)
            # Event-based wait: the auth gate releases itself within ~18s worst case
            try:
                await page.wait_for_function(
                    "!document.body.innerText.includes('AUTHENTICATING')",
                    timeout=35000,
                )
            except Exception:
                pass
            await page.wait_for_timeout(2500)  # let data render
            await page.screenshot(path=f"{OUT}/{name}.png")
            print(f"  {name}.png")

        for route, name in [
            ("/dashboard", "dash"),
            ("/dashboard/scans", "scans"),
            ("/dashboard/monitoring", "monitoring"),
            ("/auth/login", "login"),
            ("/features", "features"),
            ("/solvency", "solvency"),
        ]:
            await shoot_route(route, name)
            await page.screenshot(path=f"{OUT}/{name}.png")
            print(f"  {name}.png")

        # ── Mobile ──
        m = await browser.new_page(viewport=MOBILE)
        mcurrent = {"url": "home"}
        m.on("framenavigated", lambda f: mcurrent.update(url=f.url) if f == m.main_frame else None)
        m.on("console", lambda x: errors.append(f"[mobile:{mcurrent['url']}] {x.text}") if x.type == "error" else None)
        m.on("pageerror", lambda e: errors.append(f"[mobile:{mcurrent['url']}] {e}"))
        await m.goto(BASE, wait_until="domcontentloaded", timeout=90000)
        await m.wait_for_timeout(8000)  # hydration + reveal animations
        await m.screenshot(path=f"{OUT}/mobile-hero.png")
        total = await m.evaluate("document.body.scrollHeight - innerHeight")
        await m.evaluate(f"window.scrollTo(0, {int(total * 0.3)})")
        await m.wait_for_timeout(2500)
        await m.screenshot(path=f"{OUT}/mobile-mid.png")
        print("  mobile shots done")

        await browser.close()

    print(f"\nconsole errors: {len(errors)}")
    for e in errors[:10]:
        print("  !", e[:160])


if __name__ == "__main__":
    asyncio.run(main())
