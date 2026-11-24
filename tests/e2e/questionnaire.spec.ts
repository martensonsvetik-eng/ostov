import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Анкета «Подготовить проект заранее» (brief.md §8.2, task 11). */

const KEY = 'ostov:questionnaire';
const isMobile = (name: string) => name === 'mobile';

const contactTrigger = (page: Page) => page.locator('#contact [data-open-modal="questionnaire"]');
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Подготовить проект заранее' });
const next = (d: Locator) => d.getByRole('button', { name: 'Далее' });
const back = (d: Locator) => d.getByRole('button', { name: 'Назад' });
const progress = (d: Locator) => d.locator('[data-q-progress]');
const step = (d: Locator, n: number) => d.locator(`[data-q-step="${n}"]`);

async function load(page: Page, url = '/ostov/') {
  await page.goto(url);
  // Every lazy image loads up front, so later request counts see only what the form does.
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

const settled = (page: Page) =>
  page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));

async function openQ(page: Page, url?: string) {
  if (url !== undefined || page.url() === 'about:blank') await load(page, url);
  await contactTrigger(page).click();
  await expect(dialog(page)).toBeVisible();
  await settled(page);
  return dialog(page);
}

function track(page: Page): string[] {
  const reqs: string[] = [];
  page.on('request', (r) => reqs.push(r.url()));
  return reqs;
}

const draft = (page: Page) => page.evaluate((k) => sessionStorage.getItem(k), KEY);

/** Steps 1–4 with typical answers; ends on step 5. */
async function walkTo5(d: Locator) {
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  await d.getByRole('radio', { name: /Тёплый модерн/ }).check();
  await next(d).click();
  await d.getByRole('checkbox', { name: 'Дуб' }).check();
  await d.getByRole('checkbox', { name: 'Латунь' }).check();
  await next(d).click();
  await d.getByRole('radio', { name: '3–6 млн' }).check();
  await d.getByRole('radio', { name: '6–12 месяцев' }).check();
  await next(d).click();
  await expect(progress(d)).toHaveText('Шаг 5 из 5');
}

async function fillContacts(d: Locator, name = 'Анна') {
  await d.getByLabel('Как к вам обращаться').fill(name);
  await d.getByLabel('Телефон').fill('+7 916 123-45-67');
  await d.getByRole('checkbox', { name: 'Согласен на обработку данных' }).check();
}

test('открывается кнопкой «Подготовить проект заранее» в блоке 7; Esc закрывает, фокус на кнопке', async ({ page }) => {
  await load(page);
  const t = contactTrigger(page);
  await expect(t).toHaveText('Подготовить проект заранее');
  await expect(t).toHaveAttribute('aria-haspopup', 'dialog');
  await t.click();
  const d = dialog(page);
  await expect(d).toBeVisible();
  expect(await d.evaluate((el) => el.tagName === 'DIALOG' && el.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
  await expect(t).toBeFocused();
});

test('открывается ссылкой из подвала (любой триггер data-open-modal="questionnaire")', async ({ page }) => {
  await load(page);
  const link = page.locator('footer [data-open-modal="questionnaire"]').first();
  await link.click();
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Закрыть' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(link).toBeFocused();
});

test('шаг 1: «Шаг 1 из 5», «Далее» неактивна без выбора; «Назад» возвращает с сохранённым выбором', async ({ page }) => {
  const d = await openQ(page);
  await expect(progress(d)).toHaveText('Шаг 1 из 5');
  await expect(d.getByRole('heading', { name: 'Тип объекта' })).toBeVisible();
  for (const o of ['Квартира', 'Дом', 'Другое']) await expect(d.getByRole('radio', { name: o })).not.toBeChecked();
  await expect(next(d)).toBeDisabled();
  await expect(back(d)).toBeHidden();
  await expect(d.getByRole('button', { name: 'Отправить анкету' })).toBeHidden();

  await d.getByRole('radio', { name: 'Квартира' }).check();
  await expect(next(d)).toBeEnabled();
  await next(d).click();
  await expect(progress(d)).toHaveText('Шаг 2 из 5');
  await expect(step(d, 1)).toBeHidden();
  await expect(next(d)).toBeDisabled();

  await back(d).click();
  await expect(progress(d)).toHaveText('Шаг 1 из 5');
  await expect(d.getByRole('radio', { name: 'Квартира' })).toBeChecked();
  await expect(next(d)).toBeEnabled();
});

test('при смене шага фокус на заголовке шага, смена объявляется через aria-live', async ({ page }) => {
  const d = await openQ(page);
  const live = d.locator('[aria-live="polite"][data-q-live]');
  await expect(live).toHaveCount(1);
  await d.getByRole('radio', { name: 'Другое' }).check();
  await next(d).click();
  await expect(d.getByRole('heading', { name: 'Стиль' })).toBeFocused();
  await expect(live).toHaveText('Шаг 2 из 5. Стиль');
  await back(d).click();
  await expect(d.getByRole('heading', { name: 'Тип объекта' })).toBeFocused();
  await expect(live).toHaveText('Шаг 1 из 5. Тип объекта');
});

test('шаг 2: одна из трёх коллекций по фото', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  const group = d.getByRole('group', { name: 'Выберите одну из трёх коллекций' });
  const radios = group.getByRole('radio');
  await expect(radios).toHaveCount(3);
  for (const n of ['Тихая геометрия', 'Тёплый модерн', 'Неоклассика']) {
    const r = group.getByRole('radio', { name: new RegExp(n) });
    await expect(r).toBeVisible();
    // у каждой коллекции видно фото внутри её варианта
    const img = group.locator('label').filter({ hasText: n }).locator('img');
    await expect(img).toBeVisible();
    expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  }
  await group.getByRole('radio', { name: /Неоклассика/ }).check();
  await group.getByRole('radio', { name: /Тихая геометрия/ }).check();
  await expect(group.getByRole('radio', { name: /Неоклассика/ })).not.toBeChecked();
  await expect(next(d)).toBeEnabled();
});

test('шаг 3: множественный выбор материалов', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  await d.getByRole('radio', { name: /Неоклассика/ }).check();
  await next(d).click();
  await expect(progress(d)).toHaveText('Шаг 3 из 5');
  const group = d.getByRole('group', { name: 'Материалы' });
  for (const m of ['Дуб', 'Орех', 'Травертин', 'Мрамор', 'Латунь']) await group.getByRole('checkbox', { name: m }).check();
  for (const m of ['Дуб', 'Орех', 'Травертин', 'Мрамор', 'Латунь']) await expect(group.getByRole('checkbox', { name: m })).toBeChecked();
  await expect(d.getByText('Можно выбрать несколько')).toBeVisible();
});

test('шаг 4: над вариантами бюджета видна вилка цен, есть «Пока не знаю»; «Далее» ждёт бюджет и срок', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Квартира' }).check();
  await next(d).click();
  await d.getByRole('radio', { name: /Тёплый модерн/ }).check();
  await next(d).click();
  await next(d).click();
  await expect(progress(d)).toHaveText('Шаг 4 из 5');
  const fork = d.getByText('Проекты от 2,5 млн ₽, обычно 4–6 млн ₽.', { exact: true });
  await expect(fork).toBeVisible();
  const budget = d.getByRole('group', { name: 'Бюджет' });
  for (const o of ['До 3 млн', '3–6 млн', 'Больше 6 млн', 'Пока не знаю']) await expect(budget.getByRole('radio', { name: o })).toBeVisible();
  const fb = (await fork.boundingBox())!;
  const first = (await budget.getByRole('radio', { name: 'До 3 млн' }).boundingBox())!;
  expect(fb.y + fb.height).toBeLessThanOrEqual(first.y);
  const term = d.getByRole('group', { name: 'Срок' });
  for (const o of ['До 6 месяцев', '6–12 месяцев', 'Больше года']) await expect(term.getByRole('radio', { name: o })).toBeVisible();

  await expect(next(d)).toBeDisabled();
  await budget.getByRole('radio', { name: 'Пока не знаю' }).check();
  await expect(next(d)).toBeDisabled();
  await term.getByRole('radio', { name: 'Больше года' }).check();
  await expect(next(d)).toBeEnabled();
});

test('шаг 5: те же поля, что в 8.1; загрузки файла нет — текст про план', async ({ page }) => {
  const d = await openQ(page);
  await expect(d.getByText('План помещения можно будет передать архитектору после первого звонка.', { exact: true })).toBeVisible();
  await expect(d.locator('input[type="file"]')).toHaveCount(0);
  await walkTo5(d);
  await expect(d.getByRole('heading', { name: 'Контакты' })).toBeFocused();
  await expect(d.getByLabel('Как к вам обращаться')).toHaveAttribute('autocomplete', 'name');
  await expect(d.getByLabel('Телефон')).toHaveAttribute('type', 'tel');
  await expect(d.getByRole('radio', { name: 'Звонок', exact: true })).toBeChecked();
  await expect(d.getByRole('radio', { name: 'Шоурум в Москве' })).toBeChecked();
  await expect(d.getByRole('radio', { name: 'Владелец дома' })).toBeChecked();
  await expect(d.getByRole('radio', { name: 'Архитектор / дизайнер' })).not.toBeChecked();
  await expect(d.getByRole('checkbox', { name: 'Согласен на обработку данных' })).not.toBeChecked();
  await expect(d.getByRole('checkbox', { name: 'Согласен на рассылку' })).not.toBeChecked();
  await expect(next(d)).toBeHidden();
  await expect(back(d)).toBeVisible();
  const submit = d.getByRole('button', { name: 'Отправить анкету' });
  await expect(submit).toHaveAttribute('type', 'submit');
  await expect(d.locator('form')).not.toContainText(/демо|не отправля/i);
  const sizes = await d.locator('input.field__input').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  for (const s of sizes) expect(s).toBeGreaterThanOrEqual(16);
});

test('шаг 5: пустая отправка — проверка как в 8.1, фокус на первом поле с ошибкой', async ({ page }) => {
  const d = await openQ(page);
  await walkTo5(d);
  await d.getByRole('button', { name: 'Отправить анкету' }).click();
  await expect(d.locator('[data-error-summary]')).toBeVisible();
  await expect(d.locator('[data-error-for="name"]')).toHaveText('Заполните это поле');
  await expect(d.locator('[data-error-for="consent"]')).toHaveText('Нужно согласие на обработку данных');
  await expect(d.getByLabel('Как к вам обращаться')).toBeFocused();
  await expect(d.locator('form')).toHaveAttribute('data-state', 'idle');
  await expect(progress(d)).toHaveText('Шаг 5 из 5');
});

test('ответы шагов 1–4 входят в данные формы (скрытые шаги не отключены)', async ({ page }) => {
  const d = await openQ(page);
  await walkTo5(d);
  const data = await d.locator('form').evaluate((f: HTMLFormElement) => {
    const fd = new FormData(f);
    return { object: fd.get('object'), style: fd.get('style'), materials: fd.getAll('materials'), budget: fd.get('budget'), term: fd.get('term') };
  });
  expect(data).toEqual({ object: 'house', style: 'modern', materials: ['oak', 'brass'], budget: 'from3to6', term: 'from6to12' });
});

test('Enter на варианте не пропускает шаг и ничего не отправляет', async ({ page }) => {
  const d = await openQ(page);
  const r = d.getByRole('radio', { name: 'Дом' });
  await r.focus();
  await page.keyboard.press('Enter');
  await expect(progress(d)).toHaveText('Шаг 1 из 5');
  await r.check();
  await r.press('Enter');
  await expect(d.locator('form')).toHaveAttribute('data-state', 'idle');
  await expect(d.locator('form')).not.toHaveAttribute('data-submit-count', /.+/);
});

test('черновик: закрыли на шаге 3 — при открытии анкета продолжается с шага 3', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  await d.getByRole('radio', { name: /Неоклассика/ }).check();
  await next(d).click();
  await d.getByRole('checkbox', { name: 'Мрамор' }).check();
  await expect(progress(d)).toHaveText('Шаг 3 из 5');
  const saved = JSON.parse((await draft(page))!);
  expect(saved).toMatchObject({ object: 'house', style: 'neoclassic', materials: ['marble'], step: '3' });
  expect(await page.evaluate(() => localStorage.length)).toBe(0);

  await page.keyboard.press('Escape');
  await expect(d).toBeHidden();
  await contactTrigger(page).click();
  await expect(progress(d)).toHaveText('Шаг 3 из 5');
  await expect(d.getByRole('checkbox', { name: 'Мрамор' })).toBeChecked();
});

test('черновик переживает перезагрузку вкладки: значения и шаг восстановлены', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Квартира' }).check();
  await next(d).click();
  await d.getByRole('radio', { name: /Тихая геометрия/ }).check();
  await next(d).click();
  await d.getByRole('checkbox', { name: 'Орех' }).check();
  await d.getByRole('checkbox', { name: 'Травертин' }).check();
  await page.reload();
  const d2 = await openQ(page);
  await expect(progress(d2)).toHaveText('Шаг 3 из 5');
  await expect(d2.getByRole('checkbox', { name: 'Орех' })).toBeChecked();
  await expect(d2.getByRole('checkbox', { name: 'Травертин' })).toBeChecked();
  await expect(d2.getByRole('checkbox', { name: 'Дуб' })).not.toBeChecked();
  await back(d2).click();
  await expect(d2.getByRole('radio', { name: /Тихая геометрия/ })).toBeChecked();
  await back(d2).click();
  await expect(d2.getByRole('radio', { name: 'Квартира' })).toBeChecked();
  // согласие в черновик не попадает
  expect(await draft(page)).not.toContain('consent');
});

test('успех: «Спасибо, {name}.», sessionStorage[ostov:questionnaire] пуст, запросов ноль', async ({ page }) => {
  const d = await openQ(page);
  await walkTo5(d);
  await fillContacts(d, '$&Анна');
  expect(await draft(page)).not.toBeNull();
  const url = page.url();
  const reqs = track(page);
  await d.getByRole('button', { name: 'Отправить анкету' }).click();
  await expect(d.locator('[data-submit]')).toHaveText('Отправляем…');
  const success = d.locator('[data-success]');
  await expect(success).toBeVisible();
  await expect(success.locator('[data-success-title]')).toHaveText('Спасибо, $&Анна.');
  await expect(success).toContainText('Вера Ланская свяжется с вами в течение рабочего дня.');
  await expect(success.locator('[data-success-title]')).toBeFocused();
  await expect(progress(d)).toBeHidden();
  expect(await draft(page)).toBeNull();
  expect(reqs).toEqual([]);
  expect(page.url()).toBe(url);
  expect(await page.evaluate(() => [localStorage.length, document.cookie])).toEqual([0, '']);

  // «Заполнить ещё раз» — снова шаг 1, без старых ответов
  await d.getByRole('button', { name: 'Заполнить ещё раз' }).click();
  await expect(progress(d)).toHaveText('Шаг 1 из 5');
  await expect(d.getByRole('radio', { name: 'Дом' })).not.toBeChecked();
  await expect(next(d)).toBeDisabled();
  expect(await draft(page)).toBeNull();
});

test('?demo=error — сообщение о сбое, ответы и черновик на месте', async ({ page }) => {
  const d = await openQ(page, '/ostov/?demo=error');
  await walkTo5(d);
  await fillContacts(d);
  await d.getByRole('button', { name: 'Отправить анкету' }).click();
  await expect(d.locator('form')).toHaveAttribute('data-state', 'error');
  await expect(d.locator('[data-server-error]')).toBeVisible();
  await expect(d.getByLabel('Как к вам обращаться')).toHaveValue('Анна');
  await expect(progress(d)).toHaveText('Шаг 5 из 5');
  expect(JSON.parse((await draft(page))!)).toMatchObject({ object: 'house', name: 'Анна', step: '5' });
});

test('хранилище бросает исключения — анкета всё равно работает', async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    Storage.prototype.setItem = boom;
    Storage.prototype.getItem = boom;
    Storage.prototype.removeItem = boom;
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = await openQ(page, '/ostov/');
  await walkTo5(d);
  await fillContacts(d);
  await d.getByRole('button', { name: 'Отправить анкету' }).click();
  await expect(d.locator('[data-success]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Tab и Shift+Tab не выходят за пределы окна; на скрытые шаги фокус не попадает', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  for (const shift of [false, true]) {
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(shift ? 'Shift+Tab' : 'Tab');
      const where = await page.evaluate(() => {
        const a = document.activeElement!;
        return { inside: !!a.closest('dialog[data-modal="questionnaire"]'), hiddenStep: !!a.closest('[data-q-step][hidden]') };
      });
      expect(where).toEqual({ inside: true, hiddenStep: false });
    }
  }
});

test('на телефоне окно на весь экран', async ({ page }, info) => {
  const d = await openQ(page);
  const vp = page.viewportSize()!;
  const b = (await d.boundingBox())!;
  if (isMobile(info.project.name)) {
    expect(Math.round(b.width)).toBe(vp.width);
    expect(Math.round(b.height)).toBe(vp.height);
  } else {
    expect(b.width).toBeLessThan(vp.width - 100);
  }
});

test('кнопки и варианты — зона не меньше 44×44', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  for (const el of [next(d), back(d), d.getByRole('button', { name: 'Закрыть' })]) {
    const b = (await el.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  for (const label of await step(d, 2).locator('label').all()) {
    const b = (await label.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});

test('анимируются только transform и opacity (и при смене шага)', async ({ page }) => {
  const d = await openQ(page);
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  const bad = await page.evaluate(() =>
    [...document.querySelectorAll('dialog[data-modal="questionnaire"], dialog[data-modal="questionnaire"] *')].flatMap((el) => {
      const cs = getComputedStyle(el);
      const props = cs.transitionProperty.split(',').map((x) => x.trim());
      const durs = cs.transitionDuration.split(',').map((x) => parseFloat(x));
      const t = props.filter((p, i) => (durs[i] ?? durs[0]!) > 0 && !['transform', 'opacity'].includes(p));
      const a = el
        .getAnimations()
        .flatMap((an) => ((an.effect as KeyframeEffect | null)?.getKeyframes() ?? []).flatMap((k) => Object.keys(k)))
        .filter((k) => !['offset', 'easing', 'composite', 'computedOffset', 'transform', 'opacity'].includes(k));
      return [...t, ...a];
    }),
  );
  expect(bad).toEqual([]);
});

test.describe('анкета: уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });
  test('при смене шага ничто не движется', async ({ page }) => {
    const d = await openQ(page);
    await d.getByRole('radio', { name: 'Дом' }).check();
    await next(d).click();
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('dialog[data-modal="questionnaire"] *')].filter((el) => {
        const s = getComputedStyle(el);
        return s.transitionDuration.split(',').some((v) => parseFloat(v) > 0) || (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0);
      }).length,
    );
    expect(moving).toBe(0);
  });
});

test('доступность: axe без серьёзных нарушений на шагах 2, 4 и 5', async ({ page }) => {
  const d = await openQ(page);
  const scan = async () => {
    const r = await new AxeBuilder({ page }).include('dialog[data-modal="questionnaire"]').analyze();
    expect(r.violations.filter((v) => ['critical', 'serious'].includes(v.impact!))).toEqual([]);
  };
  await d.getByRole('radio', { name: 'Дом' }).check();
  await next(d).click();
  await scan();
  await d.getByRole('radio', { name: /Тёплый модерн/ }).check();
  await next(d).click();
  await next(d).click();
  await scan();
  await d.getByRole('radio', { name: 'Пока не знаю' }).check();
  await d.getByRole('radio', { name: 'Больше года' }).check();
  await next(d).click();
  await d.getByRole('button', { name: 'Отправить анкету' }).click();
  await expect(d.locator('[data-error-summary]')).toBeVisible();
  await scan();
});

test('id уникальны на странице с анкетой', async ({ page }) => {
  await load(page);
  const dups = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  expect(dups).toEqual([]);
});

test('EN: анкета переведена', async ({ page }) => {
  await load(page, '/ostov/en/');
  await page.locator('#contact [data-open-modal="questionnaire"]').click();
  const d = page.getByRole('dialog', { name: 'Prepare the project in advance' });
  await expect(d).toBeVisible();
  await expect(d.locator('[data-q-progress]')).toHaveText('Step 1 of 5');
  await expect(d.getByRole('button', { name: 'Next' })).toBeDisabled();
  await d.getByRole('radio', { name: 'House' }).check();
  await d.getByRole('button', { name: 'Next' }).click();
  await expect(d.locator('[data-q-progress]')).toHaveText('Step 2 of 5');
  await expect(d.getByRole('button', { name: 'Back' })).toBeVisible();
  // step 4: one currency — budget options in € like the price range above them
  await d.getByRole('radio', { name: /Warm modern/i }).check();
  await d.getByRole('button', { name: 'Next' }).click();
  await d.getByRole('button', { name: 'Next' }).click();
  await expect(d.locator('[data-q-progress]')).toHaveText('Step 4 of 5');
  const budget = (await d.locator('[data-q-step="4"] [name="budget"]').evaluateAll((els) =>
    els.map((e) => (e as HTMLInputElement).labels![0]!.textContent!.trim()),
  ));
  expect(budget).toEqual(['Up to €31 000', '€31 000–63 000', 'More than €63 000', 'Not sure yet']);
  for (const t of budget) expect(t).not.toContain('₽');
  await expect(d.locator('[data-q-step="4"]')).not.toContainText('₽');
  await expect(d.locator('[data-q-step="4"]')).toContainText('€');
});

test.describe('без JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('кнопка анкеты скрыта, окно закрыто', async ({ page }) => {
    await page.goto('/ostov/');
    await expect(page.locator('[data-open-modal="questionnaire"]:visible')).toHaveCount(0);
    await expect(page.locator('dialog[data-modal="questionnaire"]')).toBeHidden();
  });
});
