import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const out = fileURLToPath(new URL("../.work/previews/", import.meta.url));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = [];
try {
  for (const width of [1440, 1024, 768, 505, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      deviceScaleFactor: 1,
    });
    // La revisión visual conserva un backend desconectado, sin tocar producción.
    await page.route("**/config.json", async (route) => {
      const response = await route.fetch();
      const config = await response.json();
      await route.fulfill({
        response,
        json: { ...config, supabaseUrl: "", supabaseAnonKey: "" },
      });
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4321/ecovecinos/", {
      waitUntil: "networkidle",
    });
    await page.locator("#preview-banner").waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);
    const typography = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      title: getComputedStyle(document.querySelector("h1")).fontFamily,
      loaded:
        document.fonts.check('16px "Source Sans Pro"') &&
        document.fonts.check('600 20px "Montserrat"'),
    }));
    assert.match(typography.body, /Source Sans Pro/);
    assert.match(typography.title, /Montserrat/);
    assert.equal(typography.loaded, true);
    assert.equal(await page.locator(".lesson-card").count(), 4);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("body *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.right > document.documentElement.clientWidth + 2 &&
            r.width > 0 &&
            getComputedStyle(el).position !== "fixed"
          );
        })
        .slice(0, 12)
        .map((el) => ({
          tag: el.tagName,
          cls: el.className,
          text: el.textContent.slice(0, 50),
        })),
    }));
    assert.ok(
      dimensions.content <= dimensions.viewport + 1,
      JSON.stringify({ width, ...dimensions }),
    );
    await page
      .getByRole("tab", { name: "Talleres prácticos 12 h", exact: true })
      .click();
    assert.equal(await page.locator(".lesson-card").count(), 4);
    await page
      .getByRole("button", { name: "Ver La Verdad en la Bolsa", exact: true })
      .click();
    assert.equal(
      await page.locator("#lesson-dialog").evaluate((el) => el.open),
      true,
    );
    await page
      .getByRole("button", { name: "Cerrar detalles", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Quiero ser Eco-Vecino", exact: true })
      .click();
    assert.equal(await page.locator("#auth-submit").isDisabled(), true);
    assert.match(
      await page.locator("#auth-notice").textContent(),
      /no guarda ni envía/,
    );
    await page
      .getByRole("button", { name: "Cerrar acceso", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Revisar el diseño del aula (sin descargas)",
        exact: true,
      })
      .click();
    assert.equal(await page.locator(".resource-row").count(), 22);
    assert.equal(await page.locator("[data-download]:enabled").count(), 0);
    await page.locator("#resource-search").fill("Encuesta");
    assert.equal(await page.locator(".resource-row").count(), 2);
    await page
      .getByRole("button", { name: "Cerrar aula", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Administración", exact: true })
      .click();
    assert.equal(
      await page.locator("#admin-dialog").evaluate((el) => el.open),
      true,
    );
    assert.equal(
      await page.locator('#video-form input[name="url"]').isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Cerrar administración", exact: true })
      .click();
    await page.locator("#privacy-button").click();
    assert.match(
      await page.locator("#privacy-content").textContent(),
      /6044405100 ext 5807/,
    );
    assert.match(
      await page.locator("#privacy-content").textContent(),
      /Calle 73/,
    );
    assert.match(
      await page.locator("#privacy-content").textContent(),
      /Política aprobada/,
    );
    await page.locator("#privacy-dialog [data-close]").click();
    await page
      .getByRole("tab", { name: "Lecciones teóricas 8 h", exact: true })
      .click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    if (width === 1440 || width === 390) {
      await page.screenshot({
        path: out + `home-${width}.png`,
        fullPage: true,
      });
      await page.screenshot({ path: out + `cover-${width}.png` });
    }
    assert.deepEqual(errors, []);
    report.push({ width, status: "correcto", dimensions });
    await page.close();
  }
  await writeFile(out + "ui-validation.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
