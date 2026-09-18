"""Capture the editorial homepage at several scroll points."""
import asyncio
import os

from playwright.async_api import async_playwright

OUT = "scripts/out/editorial"
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

        await page.goto("http://localhost:3001", wait_until="load", timeout=60000)
        await page.wait_for_timeout(2500)
        await page.screenshot(path=f"{OUT}/ed-0.png")

        height = await page.evaluate("document.body.scrollHeight")
        print("height:", height)
        y = 0
        idx = 1
        while y < min(height, 11000) and idx <= 10:
            y += 900
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(1100)
            await page.screenshot(path=f"{OUT}/ed-{idx}.png")
            idx += 1

        await browser.close()
        print("shots saved")
        real = [e for e in errors if "favicon" not in e.lower()]
        print("console errors:", len(real))
        for e in real[:8]:
            print("  -", e[:150])


asyncio.run(main())
