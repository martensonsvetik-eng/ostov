import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SUBMIT = 'Записаться на обсуждение';

const form = (page: Page) => page.locator('#contact form[data-demo-form]');

async function open(page: Page, query = '') {
  await page.goto(`/ostov/${query}`);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  // Lazy images in and around the section finish loading before we start counting requests.
  await page.waitForLoadState('networkidle');
}

async function fill(page: Page) {
  const f = form(page);
  await f.getByLabel('Как к вам обращаться').fill('Анна');
  await f.getByLabel('Телефон').fill('+7 (916) 123-45-67');
  await f.getByLabel('Согласен на обработку данных').check();
}

function track(page: Page): string[] {
  const reqs: string[] = [];
  page.on('request', (r) => reqs.push(r.url()));
  return reqs;
}

test('блок 7: заголовок, вилка цен и карточка архитектора над формой, адрес шоурума без карты', async ({ page }) => {
  await open(page);
  const s = page.locator('#contact');
  await expect(s.locator('h2')).toHaveText('Обсудим ваш проект');
  const price = s.locator('[data-price]');
  await expect(price).toBeVisible();
  await expect(price).toContainText('Проекты от 2,5 млн ₽, обычно 4–6 млн ₽');
  await expect(price).toContainText('кухня-гостиная с кладовой — от 7 млн');
  const person = s.locator('[data-person]');
  await expect(person).toBeVisible();
  await expect(person).toContainText('Вера Ланская');
  await expect(person).toContainText('ведущий архитектор');
  await expect(person).toContainText('15 лет в интерьерах. Ведёт ваш проект от эскиза до монтажа.');
  await expect(person.locator('img')).toHaveAttribute('alt', 'Портрет Веры Ланской, ведущего архитектора');
  // «над формой»: вилка цен и карточка выше верхнего края формы на любой ширине
  const formTop = (await form(page).boundingBox())!.y;
  for (const el of [price, person]) {
    const b = (await el.boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(formTop + 1);
  }
  await expect(s).toContainText('Москва, ул. Вымышленная, 1');
  await expect(s).toContainText('Пн–Сб 11:00–20:00, по записи');
  await expect(s.locator('iframe, [data-map]')).toHaveCount(0);
});

test('₽ рисуется шрифтом Manrope, а не системным', async ({ page }) => {
  await open(page);
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(async () => {
    await document.fonts.load('400 16px Manrope', '₽');
    return document.fonts.check('400 16px Manrope', '₽');
  });
  expect(ok).toBe(true);
  const faces = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Manrope' && f.unicodeRange.includes('20BD')).length,
  );
  expect(faces).toBeGreaterThan(0);
});

test('разметка формы: без action, novalidate, кнопка становится submit, поля и согласия', async ({ page }) => {
  await open(page);
  const f = form(page);
  expect(await f.getAttribute('action')).toBeNull();
  await expect(f).toHaveAttribute('novalidate', '');
  await expect(f).toHaveAttribute('data-state', 'idle');
  await expect(f.locator('[data-noscript]')).toBeHidden();
  await expect(f.getByRole('button', { name: SUBMIT })).toHaveAttribute('type', 'submit');
  await expect(f.getByRole('button', { name: SUBMIT })).toHaveAttribute('data-variant', 'primary');
  const phone = f.getByLabel('Телефон');
  await expect(phone).toHaveAttribute('type', 'tel');
  await expect(phone).toHaveAttribute('autocomplete', 'tel');
  await expect(phone).toHaveAttribute('inputmode', 'tel');
  await expect(f.getByRole('radio', { name: 'Звонок', exact: true })).toBeChecked();
  await expect(f.getByRole('radio', { name: 'Шоурум в Москве' })).toBeChecked();
  await expect(f.getByRole('radio', { name: 'Владелец дома' })).toBeChecked();
  // два отдельных согласия, ни одно не отмечено заранее
  const consent = f.getByRole('checkbox', { name: 'Согласен на обработку данных' });
  const news = f.getByRole('checkbox', { name: 'Согласен на рассылку' });
  await expect(consent).not.toBeChecked();
  await expect(news).not.toBeChecked();
  expect(await consent.getAttribute('name')).not.toBe(await news.getAttribute('name'));
  // вторичная кнопка анкеты
  await expect(page.locator('#contact [data-open-modal="questionnaire"]')).toHaveText('Подготовить проект заранее');
  await expect(page.locator('#contact [data-open-modal="questionnaire"]')).toHaveAttribute('data-variant', 'secondary');
});

test('пустую форму не ругать до отправки; телефон «123» после ухода с поля — ошибка', async ({ page }) => {
  await open(page);
  const f = form(page);
  const name = f.getByLabel('Как к вам обращаться');
  const phone = f.getByLabel('Телефон');
  // проход по пустым полям без ввода не показывает ошибок
  await name.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(f.locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(f.locator('[data-error-for]:visible')).toHaveCount(0);

  await phone.fill('123');
  await expect(f.locator('[data-error-for="phone"]')).toBeHidden(); // ещё не ушли с поля
  await phone.blur();
  await expect(phone).toHaveAttribute('aria-invalid', 'true');
  const err = f.locator('[data-error-for="phone"]');
  await expect(err).toBeVisible();
  await expect(err).toHaveText('Укажите телефон: не меньше 10 цифр');
  await expect(err.locator('svg')).toHaveCount(1);
  const errId = await err.getAttribute('id');
  expect((await phone.getAttribute('aria-describedby'))!.split(/\s+/)).toContain(errId);

  // после первой ошибки — проверка при каждом вводе
  await phone.focus();
  await phone.pressSequentially('4567890');
  await expect(phone).not.toHaveAttribute('aria-invalid', 'true');
  await expect(err).toBeHidden();
  await phone.press('Backspace');
  await expect(phone).toHaveAttribute('aria-invalid', 'true');
});

test('отправка с ошибками: сводка сверху и фокус на первом ошибочном поле', async ({ page }) => {
  await open(page);
  const f = form(page);
  await f.getByLabel('Телефон').fill('8 916 123 45 67');
  await f.getByRole('button', { name: SUBMIT }).click();
  const summary = f.locator('[data-error-summary]');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Проверьте форму: есть поля с ошибками');
  await expect(summary).toContainText('Как к вам обращаться');
  await expect(summary).toContainText('Согласен на обработку данных');
  await expect(summary).not.toContainText('Телефон');
  // сводка над полями
  const sb = (await summary.boundingBox())!;
  expect(sb.y).toBeLessThan((await f.getByLabel('Как к вам обращаться').boundingBox())!.y);
  await expect(f.getByLabel('Как к вам обращаться')).toBeFocused();
  await expect(f.locator('[data-error-for="name"]')).toHaveText('Заполните это поле');
  await expect(f.locator('[data-error-for="consent"]')).toHaveText('Нужно согласие на обработку данных');
  await expect(f).toHaveAttribute('data-state', 'idle');
  await expect(f).not.toHaveAttribute('data-submit-count', /[1-9]/);
  // каждая ссылка сводки — зона нажатия не меньше 44×44
  const links = summary.getByRole('link');
  await expect(links).toHaveCount(2);
  for (const link of await links.all()) {
    const box = (await link.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  // ссылка в сводке ведёт к полю, адрес не меняется
  const url = page.url();
  await summary.getByRole('link', { name: /Согласен на обработку данных/ }).click();
  await expect(f.getByRole('checkbox', { name: 'Согласен на обработку данных' })).toBeFocused();
  expect(page.url()).toBe(url);
});

test('корректная отправка: «Отправляем…», успех с именем, фокус на заголовке, ни одного запроса', async ({ page }) => {
  await open(page);
  await fill(page);
  const reqs = track(page);
  const btn = form(page).getByRole('button', { name: SUBMIT });
  await btn.click();
  const busy = form(page).locator('[data-submit]');
  await expect(busy).toHaveText('Отправляем…');
  await expect(busy).toBeDisabled();
  await expect(busy).toHaveAttribute('aria-busy', 'true');
  await expect(form(page)).toHaveAttribute('data-state', 'loading');

  await expect(page.locator('[data-state="success"]')).toBeVisible();
  const success = form(page).locator('[data-success]');
  await expect(success).toBeVisible();
  await expect(success).toContainText(
    'Спасибо, Анна. Это демонстрация: данные не отправлены. В реальном проекте Вера Ланская связалась бы с вами в течение рабочего дня.',
    { useInnerText: true },
  );
  await expect(success.locator('[data-success-title]')).toBeFocused();
  // форма заменена сообщением
  await expect(form(page).getByLabel('Телефон')).toBeHidden();
  await expect(form(page).locator('[data-submit]')).toBeHidden();
  expect(reqs).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, document.cookie])).toEqual([0, '']);

  // «Заполнить ещё раз» возвращает пустую форму
  await success.getByRole('button', { name: 'Заполнить ещё раз' }).click();
  await expect(form(page)).toHaveAttribute('data-state', 'idle');
  await expect(form(page).getByLabel('Как к вам обращаться')).toHaveValue('');
  await expect(form(page).getByLabel('Как к вам обращаться')).toBeFocused();
  await expect(form(page).getByRole('checkbox', { name: 'Согласен на обработку данных' })).not.toBeChecked();
  await expect(form(page).getByRole('button', { name: SUBMIT })).toBeEnabled();
  expect(reqs).toEqual([]);
});

test('ни одного запроса: эталонная проверка из плана', async ({ page }) => {
  await open(page);
  const reqs: string[] = [];
  page.on('request', (r) => reqs.push(r.url()));
  await fill(page);
  await page.getByRole('button', { name: 'Записаться на обсуждение' }).click();
  await expect(page.locator('[data-state="success"]')).toBeVisible();
  expect(reqs).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, document.cookie])).toEqual([0, '']);
});

test('?demo=error: сообщение о сбое, введённое сохранилось', async ({ page }) => {
  await open(page, '?demo=error');
  const f = form(page);
  await fill(page);
  await f.getByRole('radio', { name: 'Видеозвонок' }).check();
  await f.getByRole('checkbox', { name: 'Согласен на рассылку' }).check();
  const reqs = track(page);
  await f.getByRole('button', { name: SUBMIT }).click();
  await expect(f).toHaveAttribute('data-state', 'error');
  const msg = f.locator('[data-server-error]');
  await expect(msg).toBeVisible();
  await expect(msg).toHaveText('Не получилось отправить. Ваши данные сохранены в форме, попробуйте ещё раз');
  await expect(f.getByLabel('Как к вам обращаться')).toHaveValue('Анна');
  await expect(f.getByLabel('Телефон')).toHaveValue('+7 (916) 123-45-67');
  await expect(f.getByRole('radio', { name: 'Видеозвонок' })).toBeChecked();
  await expect(f.getByRole('checkbox', { name: 'Согласен на обработку данных' })).toBeChecked();
  await expect(f.getByRole('checkbox', { name: 'Согласен на рассылку' })).toBeChecked();
  const btn = f.getByRole('button', { name: SUBMIT });
  await expect(btn).toBeEnabled();
  await expect(btn).not.toHaveAttribute('aria-busy', 'true');
  expect(reqs).toEqual([]);
});

test('строка «Демо-форма: данные никуда не отправляются» видна над кнопкой', async ({ page }) => {
  await open(page);
  const note = form(page).getByText('Демо-форма: данные никуда не отправляются', { exact: true });
  await expect(note).toBeVisible();
  const n = (await note.boundingBox())!;
  const b = (await form(page).getByRole('button', { name: SUBMIT }).boundingBox())!;
  expect(n.y + n.height).toBeLessThanOrEqual(b.y + 1);
});

test('случай 1: Enter в поле «Имя» при пустом телефоне показывает ошибки, адрес не меняется, запросов нет', async ({ page }) => {
  await open(page);
  const f = form(page);
  const url = page.url();
  const reqs = track(page);
  await f.getByLabel('Как к вам обращаться').fill('Анна');
  await f.getByLabel('Как к вам обращаться').press('Enter');
  await expect(f.locator('[data-error-summary]')).toBeVisible();
  await expect(f.getByLabel('Телефон')).toHaveAttribute('aria-invalid', 'true');
  await expect(f.locator('[data-error-for="phone"]')).toHaveText('Заполните это поле');
  await expect(f.getByLabel('Телефон')).toBeFocused();
  expect(page.url()).toBe(url);
  expect(reqs).toEqual([]);
});

test('случай 2: двойной клик по кнопке — одна имитация отправки', async ({ page }) => {
  await open(page);
  await fill(page);
  await form(page).getByRole('button', { name: SUBMIT }).dblclick();
  await expect(form(page)).toHaveAttribute('data-state', 'loading');
  await expect(form(page)).toHaveAttribute('data-submit-count', '1');
  await expect(page.locator('[data-state="success"]')).toBeVisible();
  await expect(form(page)).toHaveAttribute('data-submit-count', '1');
});

test('доступность: axe без серьёзных нарушений в блоке и в состоянии ошибок', async ({ page }) => {
  await open(page);
  await form(page).getByRole('button', { name: SUBMIT }).click();
  await expect(form(page).locator('[data-error-summary]')).toBeVisible();
  const r = await new AxeBuilder({ page }).include('#contact').analyze();
  expect(r.violations.filter((v) => ['critical', 'serious'].includes(v.impact!))).toEqual([]);
});

test('EN: форма переведена, успех с именем', async ({ page }) => {
  await page.goto('/ostov/en/');
  const f = form(page);
  await expect(page.locator('#contact h2')).toHaveText('Let us discuss your project');
  await expect(f.getByText('Demo form: no data is sent', { exact: true })).toBeVisible();
  await f.getByLabel('How should we address you').fill('Anna');
  await f.getByLabel('Phone').fill('+44 20 7946 0958');
  await f.getByRole('checkbox', { name: 'I agree to the processing of my data' }).check();
  await f.getByRole('button', { name: 'Book a discussion' }).click();
  await expect(f.locator('[data-submit]')).toHaveText('Sending…');
  await expect(f.locator('[data-success]')).toContainText('Thank you, Anna. This is a demonstration', { useInnerText: true });
});

test.describe('случай 4: без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('клик по кнопке не меняет адрес, виден текст noscript', async ({ page }) => {
    await page.goto('/ostov/');
    const f = form(page);
    await expect(f).not.toHaveAttribute('action');
    await expect(f.getByText('Демо-форма работает только с включённым JavaScript и ничего не отправляет')).toBeVisible();
    const url = page.url();
    const btn = f.getByRole('button', { name: SUBMIT });
    await expect(btn).toHaveAttribute('type', 'button');
    await f.getByLabel('Как к вам обращаться').fill('Анна');
    await btn.click();
    await f.getByLabel('Как к вам обращаться').press('Enter');
    await page.waitForTimeout(300);
    expect(page.url()).toBe(url);
    await expect(f.getByLabel('Как к вам обращаться')).toHaveValue('Анна');
  });
});
