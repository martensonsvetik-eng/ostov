import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Whole-page quality gates (brief.md §9 accessibility, §10 checklists):
 * axe, no horizontal scroll at the five check widths, content width cap at 1920,
 * phone tap targets, phone form-field font size, clean console.
 */

const PAGES = [
  ['/ostov/', 'ru'],
  ['/ostov/en/', 'en'],
] as const;
const WIDTHS = [360, 390, 768, 1280, 1920];

/** Scroll the whole page so lazy images and the reveal layer settle before measuring. */
async function walk(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    scrollTo(0, 0);
    // Let the reveal fade-ins finish: half-transparent text would read as a contrast failure.
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
  });
}

for (const [path, lang] of PAGES) {
  test(`axe ${lang}: 0 нарушений critical/serious`, async ({ page }) => {
    await page.goto(path);
    await walk(page);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    expect(bad).toEqual([]);
  });

  test(`консоль ${lang}: без ошибок`, async ({ page }) => {
    const errors: string[] = [];
    // Errors, plus Chrome's warning for a <link rel=preload> nothing used (fonts, hero photo).
    page.on('console', (m) => (m.type() === 'error' || /preload/i.test(m.text())) && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await walk(page);
    await page.waitForLoadState('networkidle');
    // Chrome reports an unused preload ~3 s after load.
    await page.waitForTimeout(3500);
    expect(errors).toEqual([]);
  });
}

test.describe('ширины 360 / 390 / 768 / 1280 / 1920', () => {
  // Widths are set explicitly, so one project is enough.
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop'));

  for (const [path, lang] of PAGES) {
    for (const width of WIDTHS) {
      test(`${lang} ${width}px: нет горизонтальной прокрутки`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await walk(page);
        const { sw, cw } = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
        }));
        expect(sw).toBeLessThanOrEqual(cw);
      });
    }

    test(`${lang} 1920px: контент не шире 1320 px и по центру`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(path);
      const boxes = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth;
        return [...document.querySelectorAll<HTMLElement>('.container')].map((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return { inner: r.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight), gapL: r.left, gapR: cw - r.right };
        });
      });
      expect(boxes.length).toBeGreaterThan(5);
      for (const b of boxes) {
        expect(b.inner).toBeLessThanOrEqual(1320);
        expect(Math.abs(b.gapL - b.gapR)).toBeLessThanOrEqual(1);
      }
    });
  }
});

test.describe('телефон', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile'));

  for (const [path, lang] of PAGES) {
    test(`${lang}: все кнопки и ссылки в main не меньше 44×44`, async ({ page }) => {
      await page.goto(path);
      await walk(page);
      const boxes = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('main a, main button')]
          .filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { el: el.outerHTML.slice(0, 120), w: Math.round(r.width), h: Math.round(r.height) };
          }),
      );
      expect(boxes.length).toBeGreaterThan(15);
      expect(boxes.filter((b) => b.w < 44 || b.h < 44)).toEqual([]);
    });

    test(`${lang}: шрифт полей формы не меньше 16 px`, async ({ page }) => {
      await page.goto(path);
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea')].map(
          (el) => ({ name: el.getAttribute('name'), fs: parseFloat(getComputedStyle(el).fontSize) }),
        ),
      );
      expect(sizes.length).toBeGreaterThan(5);
      expect(sizes.filter((s) => s.fs < 16)).toEqual([]);
    });
  }
});
