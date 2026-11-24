# Credits — изображения и шрифты

Для каждого фото: автор, ссылка, лицензия (brief.md §6, «Изображения»).

## Фотографии

| Файл | Где | Источник | Автор | Лицензия |
|---|---|---|---|---|
| `src/assets/img/hero.jpg` | Блок 1, первый экран | [Unsplash, VgyN_CWXQVM](https://unsplash.com/photos/modern-kitchen-with-island-and-large-window-VgyN_CWXQVM) | Cat Han ([@figmentprints](https://unsplash.com/@figmentprints)) | [Unsplash License](https://unsplash.com/license) |

**Обработка `hero.jpg`** (`scripts/prep-hero-photo.mjs`, оригинал 3840×2560):
- размыт овальный значок производителя на дверце духовки (около x 2628, y 2178 в оригинале), потому что ТЗ запрещает реальные логотипы брендов. Других знаков и надписей в кадре нет: проверены вытяжка, ручки плиты и посудомоечная машина;
- уменьшено до 3200×2133, JPEG q85 (исходник для `astro:assets`).

## Шрифты

- Cormorant Garamond, Manrope — SIL Open Font License 1.1, через `@fontsource`.

## Заглушки (TODO-asset)

Генерируются локально, без загрузок: `node scripts/gen-placeholder-images.mjs` (sharp, детерминированный шум). Это тональные абстракции в палитре, а не фотографии. Подписи `alt` в `src/i18n/*.ts` описывают будущий кадр: сверить с ним при замене.

| Файл | Где | Статус |
|---|---|---|
| `src/assets/img/collections/geometry-cover.jpg`, `geometry-detail-1.jpg`, `geometry-detail-2.jpg` | Блок 3, «Тихая геометрия» | TODO-asset: стоковое фото (Unsplash/Pexels) на утверждении |
| `src/assets/img/collections/modern-cover.jpg`, `modern-detail-1.jpg`, `modern-detail-2.jpg` | Блок 3, «Тёплый модерн» | TODO-asset: стоковое фото на утверждении |
| `src/assets/img/collections/neoclassic-cover.jpg`, `neoclassic-detail-1.jpg`, `neoclassic-detail-2.jpg` | Блок 3, «Неоклассика» | TODO-asset: стоковое фото на утверждении |
| `src/assets/img/materials/oak.jpg`, `travertine.jpg`, `brass.jpg`, `hardware.jpg` | Блок 4, материалы | TODO-asset: макрокадры генерирует заказчик (brief.md §11); при замене указать, что изображения сгенерированы, и проверить на артефакты |
| `src/assets/img/people/vera-lanskaya.jpg` | Блок 7, портрет архитектора (персонаж вымышлен) | TODO-asset: сгенерированный или стоковый портрет (brief.md §6), при замене отметить источник здесь |
| `src/assets/img/projects/pines.jpg` (3:2) | Блок 5, главный проект «Дом у сосен» | TODO-asset: стоковое фото на утверждении (кандидаты — в отчёте Task 12) |
| `src/assets/img/projects/patriarshy.jpg`, `jurmala.jpg`, `vasilievsky.jpg` (4:3) | Блок 5, карточки проектов | TODO-asset: стоковое фото на утверждении (кандидаты — в отчёте Task 12) |

## Сгенерированная графика (без сторонних изображений)

| Файл | Как получен | Лицензия исходников |
|---|---|---|
| `public/og-ru.jpg`, `public/og-en.jpg` (1200×630) | `node scripts/gen-og-images.mjs`: графитовый фон, знак ОСТОВ из `logo-paths.ts` и подзаголовок первого экрана, набранный Cormorant Garamond и переведённый в кривые | Cormorant Garamond — SIL OFL 1.1 |
| `public/favicon.svg` | `node scripts/gen-favicon.mjs`: буква «О» Cormorant Garamond 600 в кривых на графитовом квадрате | Cormorant Garamond — SIL OFL 1.1 |
| Знак ОСТОВ (шапка, подвал) | `node scripts/gen-logo-paths.mjs`: слово, набранное Cormorant Garamond и переведённое в кривые; не повторяет логотипы реальных брендов | Cormorant Garamond — SIL OFL 1.1 |

## Сверка (Task 15)

Все 19 файлов в `src/assets/img/` перечислены выше; в `public/` — только сгенерированная графика и `robots.txt`. Сторонних изображений, кроме `hero.jpg` (Unsplash License), на странице нет. Перед публикацией заменить заглушки TODO-asset и дописать источник каждого нового фото в эту таблицу.
