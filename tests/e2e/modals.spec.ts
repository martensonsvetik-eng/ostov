import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const isMobile = (name: string) => name === 'mobile';

const samplesLink = (page: Page) => page.locator('#materials [data-open-modal="samples"]');
const catalogLink = (page: Page) => page.locator('#collections [data-open-modal="catalog"]');
const samples = (page: Page) => page.getByRole('dialog', { name: 'Заказать образцы' });
const catalog = (page: Page) => page.getByRole('dialog', { name: 'Запросить каталог' });

async function load(page: Page, url = '/ostov/') {
  await page.goto(url);
  // Every lazy image loads up front, so later request counts see only what the forms do.
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map(async (img) => {
        img.loading = 'eager';
        await img.decode().catch(() => undefined);
      }),
    ),
  );
  await page.waitForLoadState('networkidle');
}

/** Waits for the opening animation (opacity/transform) to finish. */
const settled = (page: Page) =>
  page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));

async function openSamples(page: Page) {
  await load(page);
  await samplesLink(page).click();
  await expect(samples(page)).toBeVisible();
  await settled(page);
}

async function openCatalog(page: Page) {
  await load(page);
  await catalogLink(page).click();
  await expect(catalog(page)).toBeVisible();
  await settled(page);
}

function track(page: Page): string[] {
  const reqs: string[] = [];
  page.on('request', (r) => reqs.push(r.url()));
  return reqs;
}

const focusInside = (page: Page, sel: string) =>
  page.evaluate((s) => !!document.querySelector(s)?.contains(document.activeElement), sel);

test('«Заказать образцы» открывает окно samples; Esc закрывает, фокус возвращается на ссылку', async ({ page }) => {
  await load(page);
  const link = samplesLink(page);
  await expect(link).toHaveAttribute('aria-haspopup', 'dialog');
  await link.click();
  const d = samples(page);
  await expect(d).toBeVisible();
  await expect(d).toHaveAttribute('data-modal', 'samples');
  expect(await d.evaluate((el) => el.tagName === 'DIALOG' && (el as HTMLDialogElement).open && el.matches(':modal'))).toBe(true);
  expect(await focusInside(page, 'dialog[data-modal="samples"]')).toBe(true);
  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
  await expect(link).toBeFocused();
});

test('Tab и Shift+Tab не выходят за пределы окна', async ({ page }) => {
  await openSamples(page);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    expect(await focusInside(page, 'dialog[data-modal="samples"]')).toBe(true);
  }
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await focusInside(page, 'dialog[data-modal="samples"]')).toBe(true);
  }
});

test('кнопка «×»: имя «Закрыть», зона 44×44, закрывает и возвращает фокус', async ({ page }) => {
  await openSamples(page);
  const close = samples(page).getByRole('button', { name: 'Закрыть' });
  const box = (await close.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(samples(page)).toBeHidden();
  await expect(samplesLink(page)).toBeFocused();
});

test('фон не прокручивается, пока окно открыто', async ({ page }) => {
  await openSamples(page);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  const before = await page.evaluate(() => window.scrollY);
  // колесо и над окном, и над фоном (на компьютере) не прокручивает страницу
  const vp = page.viewportSize()!;
  for (const [x, y] of [[vp.width / 2, vp.height / 2], [5, vp.height - 5]] as const) {
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 800);
  }
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await page.keyboard.press('Escape');
  // The dialog's 'close' event (which releases the lock) is queued after Esc, so poll.
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
});

test('на телефоне окно на весь экран, на компьютере — нет', async ({ page }, info) => {
  await openSamples(page);
  const vp = page.viewportSize()!;
  const b = (await samples(page).boundingBox())!;
  if (isMobile(info.project.name)) {
    expect(Math.round(b.x)).toBe(0);
    expect(Math.round(b.y)).toBe(0);
    expect(Math.round(b.width)).toBe(vp.width);
    expect(Math.round(b.height)).toBe(vp.height);
  } else {
    expect(b.width).toBeLessThan(vp.width - 100);
    expect(b.height).toBeLessThanOrEqual(vp.height);
  }
});

test.describe('ширина 767 px — ещё телефон, 768 — уже нет', () => {
  for (const [w, full] of [[767, true], [768, false]] as const) {
    test(`${w}px`, async ({ page }, info) => {
      test.skip(isMobile(info.project.name));
      await page.setViewportSize({ width: w, height: 900 });
      await openSamples(page);
      const b = (await samples(page).boundingBox())!;
      expect(Math.round(b.width) === w).toBe(full);
    });
  }
});

test('клик по фону закрывает окно на компьютере', async ({ page }, info) => {
  test.skip(isMobile(info.project.name));
  await openCatalog(page);
  await page.mouse.click(10, 10);
  await expect(catalog(page)).toBeHidden();
  await expect(catalogLink(page)).toBeFocused();
});

test('форма образцов 8.4: поля, подписи и строки над кнопкой', async ({ page }) => {
  await openSamples(page);
  const d = samples(page);
  const f = d.locator('form[data-demo-form]');
  expect(await f.getAttribute('action')).toBeNull();
  await expect(f).toHaveAttribute('novalidate', '');
  const group = d.getByRole('group', { name: 'Материалы' });
  for (const m of ['Дуб', 'Орех', 'Травертин', 'Мрамор', 'Латунь']) {
    await expect(group.getByRole('checkbox', { name: m })).not.toBeChecked();
  }
  await expect(d.getByLabel('Как к вам обращаться')).toHaveAttribute('type', 'text');
  const phone = d.getByLabel('Телефон');
  await expect(phone).toHaveAttribute('type', 'tel');
  await expect(phone).toHaveAttribute('autocomplete', 'tel');
  await expect(d.getByRole('radio', { name: 'Владелец дома' })).toBeChecked();
  await expect(d.getByRole('radio', { name: 'Архитектор / дизайнер' })).not.toBeChecked();
  await expect(d.getByLabel('Город доставки')).toBeVisible();
  await expect(d.getByRole('checkbox', { name: 'Согласен на обработку данных' })).not.toBeChecked();
  const btn = d.getByRole('button', { name: 'Заказать образцы' });
  await expect(btn).toHaveAttribute('type', 'submit');
  const b = (await btn.boundingBox())!;
  await expect(d.locator('form')).not.toContainText(/демо|не отправля/i);
  for (const text of ['Образцы привозим за 5 рабочих дней']) {
    const n = d.getByText(text, { exact: true });
    await expect(n).toBeVisible();
    const nb = (await n.boundingBox())!;
    expect(nb.y + nb.height).toBeLessThanOrEqual(b.y + 1);
  }
  // поля ≥16 px
  const sizes = await d.locator('input.field__input').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  for (const s of sizes) expect(s).toBeGreaterThanOrEqual(16);
});

test('«Название студии» появляется только при выборе «Архитектор / дизайнер»', async ({ page }) => {
  await openSamples(page);
  const d = samples(page);
  const studio = d.getByLabel('Название студии');
  await expect(studio).toBeHidden();
  await d.getByRole('radio', { name: 'Архитектор / дизайнер' }).check();
  await expect(studio).toBeVisible();
  await studio.fill('Студия Север');
  await d.getByRole('radio', { name: 'Владелец дома' }).check();
  await expect(studio).toBeHidden();
  await expect(d.locator('[name="studio"]')).toHaveCount(1);
});

test('без отмеченного материала — ошибка «Выберите вариант», фокус на первом материале', async ({ page }) => {
  await openSamples(page);
  const d = samples(page);
  await d.getByLabel('Как к вам обращаться').fill('Анна');
  await d.getByLabel('Телефон').fill('+7 916 123-45-67');
  await d.getByLabel('Город доставки').fill('Москва');
  await d.getByRole('checkbox', { name: 'Согласен на обработку данных' }).check();
  await d.getByRole('button', { name: 'Заказать образцы' }).click();
  const err = d.locator('[data-error-for="materials"]');
  await expect(err).toBeVisible();
  await expect(err).toHaveText('Выберите вариант');
  await expect(d.locator('[data-error-summary]')).toContainText('Материалы');
  await expect(d.getByRole('checkbox', { name: 'Дуб' })).toBeFocused();
  await expect(d.locator('form')).toHaveAttribute('data-state', 'idle');
  // отметили материал — ошибка уходит сразу
  await d.getByRole('checkbox', { name: 'Мрамор' }).check();
  await expect(err).toBeHidden();
});

test('образцы: успешная «отправка» без запросов, имя с «$&» выводится как есть', async ({ page }) => {
  await openSamples(page);
  const d = samples(page);
  const reqs = track(page);
  await d.getByRole('checkbox', { name: 'Дуб' }).check();
  await d.getByLabel('Как к вам обращаться').fill('$&Анна');
  await d.getByLabel('Телефон').fill('+7 916 123-45-67');
  await d.getByRole('radio', { name: 'Архитектор / дизайнер' }).check();
  await d.getByLabel('Город доставки').fill('Москва');
  await d.getByLabel('Название студии').fill('Север');
  await d.getByRole('checkbox', { name: 'Согласен на обработку данных' }).check();
  await d.getByRole('button', { name: 'Заказать образцы' }).click();
  await expect(d.locator('[data-submit]')).toHaveText('Отправляем…');
  const success = d.locator('[data-success]');
  await expect(success).toBeVisible();
  await expect(success.locator('[data-success-title]')).toHaveText('Спасибо, $&Анна.');
  await expect(success).toContainText('Мы позвоним в течение рабочего дня, чтобы согласовать доставку образцов.');
  await expect(success.locator('[data-success-title]')).toBeFocused();
  expect(reqs).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, document.cookie])).toEqual([0, '']);
});

test('образцы: ?demo=error — сообщение о сбое, данные на месте', async ({ page }) => {
  await load(page, '/ostov/?demo=error');
  await samplesLink(page).click();
  const d = samples(page);
  await d.getByRole('checkbox', { name: 'Орех' }).check();
  await d.getByLabel('Как к вам обращаться').fill('Анна');
  await d.getByLabel('Телефон').fill('+7 916 123-45-67');
  await d.getByLabel('Город доставки').fill('Казань');
  await d.getByRole('checkbox', { name: 'Согласен на обработку данных' }).check();
  await d.getByRole('button', { name: 'Заказать образцы' }).click();
  await expect(d.locator('form')).toHaveAttribute('data-state', 'error');
  await expect(d.locator('[data-server-error]')).toBeVisible();
  await expect(d.getByLabel('Город доставки')).toHaveValue('Казань');
  await expect(d.getByRole('checkbox', { name: 'Орех' })).toBeChecked();
});

test('каталог 8.3: открывается ссылкой из блока 3, одно поле e-mail и согласие', async ({ page }) => {
  await openCatalog(page);
  const d = catalog(page);
  const email = d.getByLabel('E-mail');
  await expect(email).toHaveAttribute('type', 'email');
  await expect(d.locator('input:not([type="checkbox"])')).toHaveCount(1);
  await expect(d.getByRole('checkbox', { name: 'Согласен на обработку данных' })).not.toBeChecked();
  await expect(d.locator('form')).not.toContainText(/демо|не отправля/i);
  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
  await expect(catalogLink(page)).toBeFocused();
});

test('каталог: «a@b» — ошибка формата; «a@b.ru» с согласием — успех, запросов ноль', async ({ page }) => {
  await openCatalog(page);
  const d = catalog(page);
  const url = page.url();
  const reqs = track(page);
  const email = d.getByLabel('E-mail');
  await email.fill('a@b');
  await d.getByRole('checkbox', { name: 'Согласен на обработку данных' }).check();
  await d.getByRole('button', { name: 'Запросить каталог' }).click();
  await expect(d.locator('[data-error-for="email"]')).toHaveText('Укажите e-mail в формате name@example.com');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  await email.fill('a@b.ru');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await email.press('Enter');
  const success = d.locator('[data-success]');
  await expect(success).toBeVisible();
  await expect(success.locator('[data-success-title]')).toHaveText('Спасибо за интерес к ОСТОВ');
  await expect(success).toContainText('Мы отправим каталог в течение рабочего дня.');
  await expect(d).toBeVisible();
  expect(page.url()).toBe(url);
  expect(reqs).toEqual([]);
});

test('id полей уникальны на странице (контактная форма и окна)', async ({ page }) => {
  await load(page);
  const dups = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  expect(dups).toEqual([]);
  // подписи в окнах указывают на свои поля
  await samplesLink(page).click();
  await expect(samples(page).getByLabel('Телефон')).toHaveCount(1);
});

test('контактная форма: имя с «$&» в успехе выводится как есть', async ({ page }) => {
  await load(page);
  const f = page.locator('#contact form[data-demo-form]');
  await f.getByLabel('Как к вам обращаться').fill('$&Анна');
  await f.getByLabel('Телефон').fill('+7 916 123-45-67');
  await f.getByLabel('Согласен на обработку данных').check();
  await f.getByRole('button', { name: 'Записаться на обсуждение' }).click();
  await expect(f.locator('[data-success-title]')).toHaveText('Спасибо, $&Анна.');
});

test('доступность: axe без серьёзных нарушений в открытых окнах', async ({ page }) => {
  await openSamples(page);
  await samples(page).getByRole('button', { name: 'Заказать образцы' }).click();
  await expect(samples(page).locator('[data-error-summary]')).toBeVisible();
  let r = await new AxeBuilder({ page }).include('dialog[data-modal="samples"]').analyze();
  expect(r.violations.filter((v) => ['critical', 'serious'].includes(v.impact!))).toEqual([]);
  await page.keyboard.press('Escape');
  await catalogLink(page).click();
  await expect(catalog(page)).toBeVisible();
  // Mid fade-in the text is semi-transparent and axe would report a false contrast failure.
  await settled(page);
  r = await new AxeBuilder({ page }).include('dialog[data-modal="catalog"]').analyze();
  expect(r.violations.filter((v) => ['critical', 'serious'].includes(v.impact!))).toEqual([]);
});

test('в окне анимируются только transform и opacity', async ({ page }) => {
  await openSamples(page);
  const bad = await page.evaluate(() =>
    [...document.querySelectorAll('dialog[data-modal], dialog[data-modal] *')].flatMap((el) => {
      const cs = getComputedStyle(el);
      const props = cs.transitionProperty.split(',').map((x) => x.trim());
      const durs = cs.transitionDuration.split(',').map((x) => parseFloat(x));
      return props.filter((p, i) => (durs[i] ?? durs[0]!) > 0 && !['transform', 'opacity'].includes(p));
    }),
  );
  expect(bad).toEqual([]);
});

test.describe('окна: уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });
  test('ничто не анимируется', async ({ page }) => {
    await openSamples(page);
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('dialog[data-modal], dialog[data-modal] *')].filter((el) => {
        const s = getComputedStyle(el);
        const d = s.transitionDuration.split(',').some((v) => parseFloat(v) > 0);
        return d || (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0);
      }).length,
    );
    expect(bad).toBe(0);
    const backdrop = await page.evaluate(() => {
      const s = getComputedStyle(document.querySelector('dialog[open]')!, '::backdrop');
      return s.animationName === 'none' || parseFloat(s.animationDuration) === 0;
    });
    expect(backdrop).toBe(true);
  });
});

test('EN: окна переведены', async ({ page }) => {
  await load(page, '/ostov/en/');
  await page.locator('#collections [data-open-modal="catalog"]').click();
  const d = page.getByRole('dialog', { name: 'Request the catalogue' });
  await expect(d).toBeVisible();
  await expect(d.getByRole('button', { name: 'Close' })).toBeVisible();
  await expect(d.locator('form')).not.toContainText(/demo|not sent/i);
  await page.keyboard.press('Escape');
  await page.locator('#materials [data-open-modal="samples"]').click();
  const s = page.getByRole('dialog', { name: 'Order samples' });
  await expect(s.getByText('We deliver samples within 5 working days', { exact: true })).toBeVisible();
  await s.getByRole('radio', { name: 'Architect / designer' }).check();
  await expect(s.getByLabel('Studio name')).toBeVisible();
});

test.describe('без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('ссылки окон скрыты, окна закрыты; даже открытое вручную окно каталога не меняет адрес по Enter', async ({ page }) => {
    await page.goto('/ostov/');
    await expect(page.locator('[data-open-modal="catalog"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-open-modal="samples"]:visible')).toHaveCount(0);
    await expect(page.locator('dialog[data-modal="catalog"]')).toBeHidden();
    await expect(page.locator('dialog[data-modal="samples"]')).toBeHidden();
    const url = page.url();
    // Худший случай: окно показано без скрипта (атрибут open) — Enter в единственном поле.
    await page.locator('dialog[data-modal="catalog"]').evaluate((d) => d.setAttribute('open', ''));
    const email = page.locator('dialog[data-modal="catalog"] input[type="email"]');
    await email.fill('a@b.ru');
    await email.press('Enter');
    await page.waitForTimeout(300);
    expect(page.url()).toBe(url);
  });
});
