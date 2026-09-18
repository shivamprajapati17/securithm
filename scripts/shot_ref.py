"""Capture the reference site (axiom-ten-xi.vercel.app) at several scroll points."""
import asyncio
import os

from playwright.async_api import async_playwright

OUT = "scripts/out/ref"
os.makedirs(OUT, exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(
            "https://axiom-ten-xi.vercel.app/", wait_until="load", timeout=60000
        )
        await page.wait_for_timeout(4000)
        await page.screenshot(path=f"{OUT}/ref-0.png")

        # scroll through the page in steps
        height = await page.evaluate("document.body.scrollHeight")
        print("page height:", height)
        step = 900
        idx = 1
        y = 0
        while y < min(height, 9000) and idx <= 9:
            y += step
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(1200)
            await page.screenshot(path=f"{OUT}/ref-{idx}.png")
            idx += 1

        await browser.close()
        print("ref shots saved")


asyncio.run(main())
