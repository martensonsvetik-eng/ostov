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
