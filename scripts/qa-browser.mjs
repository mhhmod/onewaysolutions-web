import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve(process.cwd(), ".ms-playwright");

const { chromium } = await import("playwright");

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const shouldStartServer = process.env.QA_START_SERVER === "1";
const qaDir = resolve(process.cwd(), ".qa");
mkdirSync(qaDir, { recursive: true });

let serverProcess;

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 60000) {
    try {
      const response = await fetch(baseUrl);

      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
    }
  }

  throw new Error(`Server did not become ready at ${baseUrl}`);
}

if (shouldStartServer) {
  const standaloneDir = resolve(process.cwd(), ".next", "standalone");
  const standaloneServer = resolve(standaloneDir, "server.js");

  if (!existsSync(standaloneServer)) {
    throw new Error("Standalone server was not found. Run `cmd /c npm run build` before browser QA.");
  }

  cpSync(resolve(process.cwd(), "public"), resolve(standaloneDir, "public"), { recursive: true });
  cpSync(resolve(process.cwd(), ".next", "static"), resolve(standaloneDir, ".next", "static"), {
    recursive: true
  });

  serverProcess = spawn(process.execPath, [standaloneServer], {
    cwd: standaloneDir,
    env: { ...process.env, HOSTNAME: "127.0.0.1", PORT: "3000" },
    stdio: "inherit"
  });

  await waitForServer();
}

const browser = await chromium.launch({ headless: true });
const results = [];

async function auditPage(name, route, viewport) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    function hasScrollableAncestor(element) {
      let parent = element.parentElement;

      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const scrollableX =
          (style.overflowX === "auto" || style.overflowX === "scroll") &&
          parent.scrollWidth > parent.clientWidth;

        if (scrollableX) {
          return true;
        }

        parent = parent.parentElement;
      }

      return false;
    }

    const overflow = Array.from(document.querySelectorAll("body *"))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(
        ({ element, rect }) =>
          rect.width > 0 &&
          !hasScrollableAncestor(element) &&
          (rect.right > doc.clientWidth + 1 || rect.left < -1)
      )
      .slice(0, 10)
      .map(({ element, rect }) => ({
        tag: element.tagName,
        className: String(element.getAttribute("class") || "").slice(0, 120),
        text: String(element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      }));

    const tinyTargets = Array.from(document.querySelectorAll("a,button,summary,input,textarea"))
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32))
      .slice(0, 10)
      .map(({ element, rect }) => ({
        tag: element.tagName,
        text: String(element.textContent || element.getAttribute("aria-label") || "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 80),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }));

    return {
      title: document.title,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflow,
      tinyTargets
    };
  });

  const screenshot = resolve(qaDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.close();

  results.push({ name, route, viewport, screenshot, consoleErrors, pageErrors, metrics });
}

try {
  await auditPage("home-desktop", "/", { width: 1440, height: 1000 });
  await auditPage("home-mobile", "/", { width: 390, height: 844 });
  await auditPage("products-desktop", "/products", { width: 1440, height: 1000 });
  await auditPage("products-mobile", "/products", { width: 390, height: 844 });
  await auditPage("quote-mobile", "/quote", { width: 390, height: 844 });
  await auditPage("admin-login-mobile", "/admin/login", { width: 390, height: 844 });

  const interactionPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await interactionPage.goto(`${baseUrl}/products`, { waitUntil: "networkidle", timeout: 60000 });
  await interactionPage.getByRole("button", { name: /add to quote/i }).first().click();
  await interactionPage.goto(`${baseUrl}/quote`, { waitUntil: "networkidle", timeout: 60000 });
  const quoteEmptyCount = await interactionPage.getByText("No items selected yet").count();
  const quoteItemHeading = await interactionPage.locator("section article h2").first().textContent().catch(() => null);
  await interactionPage.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 60000 });
  await interactionPage.locator('summary[aria-label="Open navigation"]').click();
  const mobileNavVisible = await interactionPage.getByRole("navigation", { name: "Mobile navigation" }).isVisible();
  await interactionPage.close();

  const report = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    results,
    interaction: {
      quoteEmptyCount,
      quoteItemHeading,
      mobileNavVisible
    }
  };

  writeFileSync(resolve(qaDir, "browser-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();

  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}
