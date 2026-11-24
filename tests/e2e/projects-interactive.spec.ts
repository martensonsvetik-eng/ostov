import { test, expect } from '@playwright/test';

// Раунд 3 (заказчик, 2026-11-24): точки-материалы на фото «Дом у сосен» и наклон карточек проектов.
const lead = '#projects [data-project="main"]';
const tf = (el: Element) => getComputedStyle(el).transform;
const REST = /^(none|matrix(1, 0, 0, 1, 0, 0))$/;

test.describe('«Дом у сосен»: точки с материалами', () => {
  test('три точки-кнопки ≥ 44×44 с aria-expanded и подсказкой', async ({ page }) => {
    await page.goto('/ostov/');
    const btns = page.locator(`${lead} [data-hotspot-toggle]`);
    await expect(btns).toHaveCount(3);
    await expect(page.locator(`${lead} [data-hotspots]`)).toHaveAttribute('role', 'group');
    for (const name of ['Лестница — массив дуба', 'Остров — светлый камень', 'Фасады — шпон ореха']) {
      await expect(page.getByRole('button', { name })).toHaveCount(1);
    }
    for (let i = 0; i < 3; i++) {
      const btn = btns.nth(i);
      await expect(btn).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator(`#${await btn.getAttribute('aria-controls')}`)).toBeHidden();
      const box = (await btn.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('английская версия: подписи точек', async ({ page }) => {
    await page.goto('/ostov/en/');
    for (const name of ['Staircase — solid oak', 'Island — pale stone', 'Fronts — walnut veneer']) {
      await expect(page.getByRole('button', { name })).toHaveCount(1);
    }
  });

  test('клавиатура: Enter открывает, Esc закрывает, Tab открывает следующую', async ({ page }) => {
    await page.goto('/ostov/');
    const btns = page.locator(`${lead} [data-hotspot-toggle]`);
    const first = btns.nth(0);
    const tip = page.locator(`#${await first.getAttribute('aria-controls')}`);
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('Ступени сделали в той же мастерской');
    await page.keyboard.press('Escape');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(tip).toBeHidden();
    await expect(first).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(btns.nth(1)).toBeFocused();
    await expect(btns.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`${lead} [data-hotspot-toggle][aria-expanded="true"]`)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(btns.nth(1)).toHaveAttribute('aria-expanded', 'false');
    await expect(btns.nth(1)).toBeFocused();
  });

  test('одна открытая за раз; повторный клик и клик мимо закрывают', async ({ page }) => {
    await page.goto('/ostov/');
    const btns = page.locator(`${lead} [data-hotspot-toggle]`);
    await btns.nth(0).click();
    await expect(btns.nth(0)).toHaveAttribute('aria-expanded', 'true');
    // На узком экране открытая карточка может закрывать соседнюю точку, поэтому клик — событием.
    await btns.nth(2).dispatchEvent('click');
    await expect(btns.nth(2)).toHaveAttribute('aria-expanded', 'true');
    await expect(btns.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(`${lead} [data-hotspot-tip]:visible`)).toHaveCount(1);
    await btns.nth(2).click();
    await expect(btns.nth(2)).toHaveAttribute('aria-expanded', 'false');
    // Касание самой карточки тоже закрывает её (она ничего не содержит, кроме текста).
    await btns.nth(0).click();
    await page.locator(`#${await btns.nth(0).getAttribute('aria-controls')}`).click();
    await expect(btns.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await btns.nth(1).click();
    await expect(btns.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#projects h2').click();
    await expect(btns.nth(1)).toHaveAttribute('aria-expanded', 'false');
  });

  for (const width of [360, 390, 1440, 1920]) {
    test(`${width}px: подсказки не выходят за край фото, без горизонтальной прокрутки`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto('/ostov/');
      const media = page.locator(`${lead} .lead__media`);
      await media.scrollIntoViewIfNeeded();
      await expect.poll(() => media.evaluate(tf)).toMatch(REST);
      const btns = page.locator(`${lead} [data-hotspot-toggle]`);
      for (let i = 0; i < 3; i++) {
        await btns.nth(i).click();
        const tip = page.locator(`#${await btns.nth(i).getAttribute('aria-controls')}`);
        await expect(tip).toBeVisible();
        // Ждём конца появления (opacity → 1, translateY → 0), чтобы мерить итоговое положение.
        await expect.poll(() => tip.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
        await expect.poll(() => tip.evaluate(tf)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
        const [m, t] = await Promise.all([media.boundingBox(), tip.boundingBox()]);
        expect(t!.x).toBeGreaterThanOrEqual(m!.x - 0.5);
        expect(t!.y).toBeGreaterThanOrEqual(m!.y - 0.5);
        expect(t!.x + t!.width).toBeLessThanOrEqual(m!.x + m!.width + 0.5);
        expect(t!.y + t!.height).toBeLessThanOrEqual(m!.y + m!.height + 0.5);
        // Подложка непрозрачная: графит на тёплом белом, контраст не зависит от фото.
        expect(await tip.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(251, 250, 246)');
        await page.keyboard.press('Escape');
        await expect(tip).toBeHidden();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test('компьютер: наведение открывает, уход курсора закрывает, фото приближается до 1.03', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'наведение проверяем на компьютере');
    await page.goto('/ostov/');
    const btn = page.locator(`${lead} [data-hotspot-toggle]`).nth(1);
    const pic = page.locator(`${lead} .lead__media picture`);
    await btn.scrollIntoViewIfNeeded();
    await btn.hover();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => pic.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).a)).toBeCloseTo(1.03, 2);
    await page.mouse.move(5, 5);
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => pic.evaluate(tf)).toBe('none');
  });

  test('пульсация точек заканчивается быстрее 5 секунд', async ({ page }) => {
    await page.goto('/ostov/');
    await page.locator(`${lead} .lead__media`).scrollIntoViewIfNeeded();
    await expect(page.locator(`${lead} [data-hotspots]`)).toHaveClass(/is-pulsing/);
    const total = await page.locator(`${lead} .hotspot__dot`).evaluateAll((els) =>
      Math.max(
        ...els.map((el) => {
          const s = getComputedStyle(el, '::after');
          return (parseFloat(s.animationDuration) * Number(s.animationIterationCount) + parseFloat(s.animationDelay)) * 1000;
        }),
      ),
    );
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(5000);
  });

  test.describe('уменьшение движения', () => {
    test.use({ reducedMotion: 'reduce' });
    test('точки не пульсируют, подсказка появляется сразу', async ({ page }) => {
      await page.goto('/ostov/');
      await page.locator(`${lead} .lead__media`).scrollIntoViewIfNeeded();
      const btn = page.locator(`${lead} [data-hotspot-toggle]`).first();
      await btn.click();
      const tip = page.locator(`#${await btn.getAttribute('aria-controls')}`);
      await expect(tip).toBeVisible();
      expect(await tip.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
      expect(await tip.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
      const pulsing = await page
        .locator(`${lead} .hotspot__dot`)
        .evaluateAll((els) => els.filter((el) => getComputedStyle(el, '::after').animationName !== 'none').length);
      expect(pulsing).toBe(0);
    });
  });

  test.describe('без JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('точек нет (без скрипта они ничего бы не делали)', async ({ page }) => {
      await page.goto('/ostov/');
      await expect(page.locator(`${lead} [data-hotspots]`)).toBeHidden();
    });
  });
});

test.describe('карточки проектов: наклон', () => {
  test('компьютер: карточка наклоняется к курсору, фото смещается, блик и линия; уход — возврат', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'наклон только для мыши, проверяем на компьютере');
    await page.goto('/ostov/');
    const item = page.locator('#projects [data-tilt]').first();
    const card = item.locator('.card');
    const pic = card.locator('.card__media picture');
    await item.scrollIntoViewIfNeeded();
    await expect.poll(() => item.evaluate(tf)).toMatch(REST);
    expect(await card.evaluate(tf)).toBe('none');
    const layout = () => item.evaluate((e: HTMLElement) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]);
    const before = await layout();
    const box = (await item.boundingBox())!;
    // Правый верхний угол: 0.4 и −0.35 от центра → rotateY 2.8°, rotateX 2.45°.
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.15, { steps: 5 });
    await expect.poll(() => card.evaluate(tf)).not.toBe('none');
    // Approximate angles from the matrix (small angles): |rotateY| ≈ asin(m13), |rotateX| ≈ asin(m23).
    const angles = () =>
      card.evaluate((e) => {
        const m = new DOMMatrix(getComputedStyle(e).transform);
        return [m.m13, m.m23].map((v) => Math.round(Math.abs((Math.asin(v) * 180) / Math.PI) * 10) / 10);
      });
    await expect
      .poll(async () => {
        const [y, x] = await angles();
        return Math.abs(y! - 2.8) <= 0.15 && Math.abs(x! - 2.45) <= 0.15;
      })
      .toBe(true);
    const [ry, rx] = await angles();
    expect(ry!).toBeLessThanOrEqual(4);
    expect(rx!).toBeLessThanOrEqual(4);
    // Фото уходит в противоположную сторону (влево и вниз).
    const m = await pic.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform));
    expect(m.m41).toBeLessThan(-3);
    expect(m.m42).toBeGreaterThan(3);
    await expect.poll(() => card.locator('.card__media').evaluate((e) => getComputedStyle(e, '::after').opacity)).toBe('1');
    // Строка «город · бюджет · срок»: линия прорисовывается от центра, точки вытягиваются (scaleX).
    await expect
      .poll(() => card.locator('.meta').evaluate((e) => new DOMMatrix(getComputedStyle(e, '::after').transform).a))
      .toBe(1);
    await expect
      .poll(() =>
        card.locator('.meta > div + div').first().evaluate((e) => new DOMMatrix(getComputedStyle(e, '::before').transform).a),
      )
      .toBeCloseTo(2.4, 2);
    expect(await layout()).toEqual(before);
    await page.mouse.move(5, 5, { steps: 3 });
    await expect.poll(() => card.evaluate(tf)).toBe('none');
    await expect.poll(() => pic.evaluate(tf)).toBe('none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test.describe('уменьшение движения', () => {
    test.use({ reducedMotion: 'reduce' });
    test('наклона нет', async ({ page }) => {
      await page.goto('/ostov/');
      const item = page.locator('#projects [data-tilt]').first();
      await item.scrollIntoViewIfNeeded();
      const box = (await item.boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2, { steps: 5 });
      await page.waitForTimeout(300);
      expect(await item.locator('.card').evaluate(tf)).toBe('none');
      expect(await item.locator('.card__media picture').evaluate(tf)).toBe('none');
    });
  });

  test.describe('сенсорный экран', () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
    test('наклона и блика нет', async ({ page }) => {
      await page.goto('/ostov/');
      const item = page.locator('#projects [data-tilt]').first();
      await item.scrollIntoViewIfNeeded();
      const box = (await item.boundingBox())!;
      await page.touchscreen.tap(box.x + box.width * 0.8, box.y + 40);
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2, { steps: 5 });
      await page.waitForTimeout(300);
      expect(await item.locator('.card').evaluate(tf)).toBe('none');
      expect(await item.locator('.card__media').evaluate((e) => getComputedStyle(e, '::after').opacity)).toBe('0');
    });
  });
});
