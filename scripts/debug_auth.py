"""Debug: why does /dashboard hang on AUTHENTICATING?"""
import asyncio

from playwright.async_api import async_playwright

BASE = "http://localhost:3001"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        reqs = []
        page.on("request", lambda r: reqs.append(f"-> {r.method} {r.url}") if "/api/" in r.url else None)
        resps = []
        page.on("response", lambda r: resps.append(f"<- {r.status} {r.url}") if "/api/" in r.url else None)
        errs = []
        page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)

        # Seed token directly, then hit the dashboard
        await page.goto(f"{BASE}/auth/login", wait_until="load")
        await page.wait_for_timeout(1500)
        ok = await page.evaluate(
            """async () => {
              const res = await fetch('http://localhost:8001/api/v1/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: 'dev@example.com', password: 'password123'}),
              });
              const j = await res.json();
              if (j.access_token) { localStorage.setItem('auditai_token', j.access_token); return true; }
              return false;
            }"""
        )
        print("token seeded:", ok)

        await page.goto(f"{BASE}/dashboard", wait_until="domcontentloaded")
        await page.wait_for_timeout(8000)
        print("url now:", page.url)
        state = await page.evaluate(
            """() => ({
              token: !!localStorage.getItem('auditai_token'),
              bodyText: document.body.innerText.slice(0, 200),
            })"""
        )
        print("state:", str(state).encode("ascii", "replace").decode())

        print("\nAPI requests:")
        for r in reqs[-12:]:
            print("  ", r)
        print("API responses:")
        for r in resps[-12:]:
            print("  ", r)
        print("console:")
        for e in errs[-8:]:
            print("  ", e[:180])

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
