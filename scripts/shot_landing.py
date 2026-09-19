"""Visual smoke test: capture the new landing page in multiple states."""
import asyncio
import os

from playwright.async_api import async_playwright

BASE = "http://localhost:3001"
OUT = "scripts/out/landing"
os.makedirs(OUT, exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Desktop
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        errors: list[str] = []
        page.on(
            "console",
            lambda m: errors.append(m.text) if m.type == "error" else None,
        )
        page.on(
            "pageerror", lambda e: errors.append(f"pageerror: {e}")
        )

        await page.goto(BASE, wait_until="load", timeout=60000)
        await page.wait_for_timeout(1500)

        # 1. Preloader mid-flight
        await page.screenshot(path=f"{OUT}/01-preloader.png")

        # 2. Hero after preloader
        await page.wait_for_timeout(2600)
        await page.screenshot(path=f"{OUT}/02-hero.png")

        # 3. Solutions bento
        await page.evaluate(
            "document.querySelector('#solutions')?.scrollIntoView({behavior:'instant', block:'start'})"
        )
        await page.wait_for_timeout(1400)
        await page.screenshot(path=f"{OUT}/03-solutions.png")

        # 4. Features toolkit
        await page.evaluate("window.scrollBy(0, 1100)")
        await page.wait_for_timeout(1400)
        await page.screenshot(path=f"{OUT}/04-features.png")

        # 5. FAQ open state
        await page.evaluate(
            "document.querySelectorAll('.fw-faq-content')[0]?.scrollIntoView({behavior:'instant', block:'center'})"
        )
        await page.click("text=What exactly does AuditAI scan?")
        await page.wait_for_timeout(900)
        await page.screenshot(path=f"{OUT}/05-faq.png")

        # 6. Footer (un-hidden links)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(900)
        await page.screenshot(path=f"{OUT}/06-footer.png")

        # 7. Mobile hero
        mob = await browser.new_page(viewport={"width": 390, "height": 844})
        await mob.goto(BASE, wait_until="load", timeout=60000)
        await mob.wait_for_timeout(2600)
        await mob.screenshot(path=f"{OUT}/07-mobile-hero.png")
        await mob.close()

        await page.close()
        await browser.close()

        print("shots saved")
        real = [e for e in errors if "favicon" not in e.lower()]
        print("console errors:", len(real))
        for e in real[:8]:
            print("  -", e[:160])


asyncio.run(main())
