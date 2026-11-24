import { test, expect } from '@playwright/test';

const PROJECTS = [
  { name: 'Дом у сосен', place: 'Подмосковье', budget: '5,8 млн ₽', duration: '16 недель' },
  { name: 'Квартира на Патриарших', place: 'Москва', budget: '3,2 млн ₽', duration: '13 недель' },
  { name: 'Кухня-гостиная в Юрмале', place: 'Латвия', budget: '€78 000', duration: '18 недель' },
  { name: 'Лофт на Васильевском', place: 'Санкт-Петербург', budget: '2,7 млн ₽', duration: '12 недель' },
];

const STEPS = [
  ['Встреча и бриф', '1 день'],
  ['Эскиз и смета', '3–4 недели'],
  ['Производство', '10–14 недель'],
  ['Монтаж и подключение', '5–7 дней'],
];

const FAQ_Q = [
  'Вы производитель или салон?',
  'Что входит в цену?',
  'Работаете за городом и в других странах?',
  'Можно работать с моим дизайнером и прорабом?',
  'Какая гарантия?',
];

test('проекты: заголовок и 4 проекта с городом, бюджетом и сроком', async ({ page }) => {
  await page.goto('/ostov/');
  const s = page.locator('#projects');
  await expect(s.locator('h2')).toHaveText('Проекты в разных бюджетах');
  const items = s.locator('[data-project]');
  await expect(items).toHaveCount(4);
  for (const [i, p] of PROJECTS.entries()) {
    const item = items.nth(i);
    await expect(item.locator('h3')).toHaveText(p.name);
    await expect(item.locator('[data-project-place]')).toHaveText(p.place);
    await expect(item.locator('[data-project-place]')).toBeVisible();
    await expect(item.locator('[data-project-budget]')).toHaveText(p.budget);
    await expect(item.locator('[data-project-budget]')).toBeVisible();
    await expect(item.locator('[data-project-duration]')).toHaveText(p.duration);
    await expect(item.locator('[data-project-duration]')).toBeVisible();
  }
  await expect(items.nth(2)).toContainText('проект по видеосвязи');
  await expect(items.nth(3)).toContainText('с приглашённым дизайнером');
});

test('«Дом у сосен»: текст, цитата клиента и SVG-план с title', async ({ page }) => {
  await page.goto('/ostov/');
  const lead = page.locator('#projects [data-project="main"]');
  await expect(lead).toContainText('Мы предложили сделать остров и столешницу как одно изделие');
  const quote = lead.locator('blockquote');
  await expect(quote).toBeVisible();
  await expect(quote).toContainText(
    'Самое ценное — что один человек отвечал за всё, от эскиза до подключения техники',
  );
  const plan = lead.locator('svg[data-project-plan]');
  await expect(plan).toBeVisible();
  await expect(plan).toHaveAttribute('role', 'img');
  await expect(plan.locator('title')).toHaveText('Схема плана кухни в проекте «Дом у сосен»');
  // Доступное имя схемы берётся из title.
  await expect(page.getByRole('img', { name: 'Схема плана кухни в проекте «Дом у сосен»' })).toHaveCount(1);
});

test('проекты: фото с alt, лениво, AVIF/WebP', async ({ page }) => {
  await page.goto('/ostov/');
  const imgs = page.locator('#projects img');
  await expect(imgs).toHaveCount(4);
  const bad = await imgs.evaluateAll((els) =>
    els
      .filter(
        (el) =>
          !(el.getAttribute('alt') ?? '').trim() ||
          el.getAttribute('loading') !== 'lazy' ||
          !el.getAttribute('width') ||
          !el.getAttribute('height'),
      )
      .map((el) => el.getAttribute('src')),
  );
  expect(bad).toEqual([]);
  const types = await page
    .locator('#projects picture source')
    .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('type')))]);
  expect(types).toEqual(expect.arrayContaining(['image/avif', 'image/webp']));
});

test('как мы работаем: 4 этапа со сроками', async ({ page }) => {
  await page.goto('/ostov/');
  const s = page.locator('#process');
  await expect(s.locator('h2')).toHaveText('От эскиза до первого ужина');
  const steps = s.locator('ol[data-steps] > li');
  await expect(steps).toHaveCount(4);
  for (const [i, [title, duration]] of STEPS.entries()) {
    await expect(steps.nth(i).locator('[data-step-title]')).toHaveText(title!);
    await expect(steps.nth(i).locator('[data-step-duration]')).toHaveText(duration!);
  }
});

test('FAQ: 5 вопросов, по умолчанию всё свёрнуто', async ({ page }) => {
  await page.goto('/ostov/');
  const toggles = page.locator('#process [data-faq-toggle]');
  await expect(toggles).toHaveCount(5);
  for (const [i, q] of FAQ_Q.entries()) {
    const btn = toggles.nth(i);
    await expect(btn).toHaveText(q);
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    const id = await btn.getAttribute('aria-controls');
    expect(id).toBeTruthy();
    await expect(page.locator(`#${id}`)).toBeHidden();
  }
});

test('FAQ: клик раскрывает и сворачивает ответ', async ({ page }) => {
  await page.goto('/ostov/');
  const btn = page.locator('#process [data-faq-toggle]').nth(4);
  const panel = page.locator(`#${await btn.getAttribute('aria-controls')}`);
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveText('10 лет на корпус, 5 лет на фурнитуру, сервисный выезд в течение 5 рабочих дней.');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
});

test('FAQ: Enter и Space переключают ответ с клавиатуры', async ({ page }) => {
  await page.goto('/ostov/');
  const btn = page.locator('#process [data-faq-toggle]').first();
  const panel = page.locator(`#${await btn.getAttribute('aria-controls')}`);
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveText('Производитель. Мастерская под Калугой, шоурум в Москве.');
  await page.keyboard.press('Enter');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await page.keyboard.press('Space');
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Space');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  // Фокус остаётся на кнопке.
  await expect(btn).toBeFocused();
});

test('FAQ: кнопки не меньше 44×44', async ({ page }) => {
  await page.goto('/ostov/');
  const sizes = await page
    .locator('#process [data-faq-toggle]')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.width, r.height]));
  expect(sizes).toHaveLength(5);
  for (const [w, h] of sizes) {
    expect(w).toBeGreaterThanOrEqual(44);
    expect(h).toBeGreaterThanOrEqual(44);
  }
});

test('порядок секций: проекты и этапы между материалами и контактами', async ({ page }) => {
  await page.goto('/ostov/');
  const ids = await page.evaluate(() => [...document.querySelectorAll('main > section, body section')].map((s) => s.id));
  const order = ['materials', 'projects', 'process', 'contact'].map((id) => ids.indexOf(id));
  expect(order.every((v) => v >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  expect(await page.locator('h1').count()).toBe(1);
});

test('английская версия: бюджеты в евро, без ₽', async ({ page }) => {
  await page.goto('/ostov/en/');
  await expect(page.locator('#projects h2')).toHaveText('Projects at different budgets');
  const budgets = await page.locator('#projects [data-project-budget]').allTextContents();
  expect(budgets).toEqual(['€60 000', '€33 000', '€78 000', '€28 000']);
  for (const b of budgets) {
    expect(b).toContain('€');
    expect(b).not.toContain('₽');
  }
  await expect(page.locator('#projects')).not.toContainText('₽');
  await expect(page.locator('#process h2')).toHaveText('From sketch to the first dinner');
  await expect(page.locator('#process [data-faq-toggle]')).toHaveCount(5);
  await expect(page.getByRole('img', { name: 'Kitchen floor plan diagram for the House Among the Pines project' })).toHaveCount(1);
});

test('анимируются только transform и opacity (проекты, этапы, FAQ)', async ({ page }) => {
  await page.goto('/ostov/');
  await page.locator('#process [data-faq-toggle]').first().click();
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('#projects, #projects *, #process, #process *')) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        const props = cs.transitionProperty.split(',').map((x) => x.trim());
        const durs = cs.transitionDuration.split(',').map((x) => parseFloat(x));
        props.forEach((prop, i) => {
          if (durs[i % durs.length]! > 0 && !/^(transform|opacity)$/.test(prop))
            out.push(`${(el as HTMLElement).className}${pseudo ?? ''}: ${prop}`);
        });
      }
    }
    for (const sheet of document.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSKeyframesRule && /faq|project|process/i.test(rule.name)) {
          for (const kf of rule.cssRules) {
            const style = (kf as CSSKeyframeRule).style;
            for (let i = 0; i < style.length; i++) {
              if (!/^(transform|opacity|translate)$/.test(style[i]!)) out.push(`@keyframes ${rule.name}: ${style[i]}`);
            }
          }
        }
      }
    }
    return out;
  });
  expect(bad).toEqual([]);
});

test.describe('проекты и FAQ: уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });
  test('раскрытие ответа без анимации', async ({ page }) => {
    await page.goto('/ostov/');
    await page.locator('#process [data-faq-toggle]').first().click();
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('#projects, #projects *, #process, #process *')].filter((el) => {
        const s = getComputedStyle(el);
        const d = s.transitionDuration.split(',').some((v) => parseFloat(v) > 0);
        return d || (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0);
      }).length,
    );
    expect(moving).toBe(0);
  });
});

test('360px: без горизонтальной прокрутки с раскрытым FAQ', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/ostov/');
  await page.locator('#process [data-faq-toggle]').nth(2).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= 360)).toBe(true);
});

test.describe('без JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('ответы FAQ видны', async ({ page }) => {
    await page.goto('/ostov/');
    const answers = page.locator('#process [data-faq-answer]');
    await expect(answers).toHaveCount(5);
    for (let i = 0; i < 5; i++) await expect(answers.nth(i)).toBeVisible();
  });
});
