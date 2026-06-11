# Design

## Visual Theme

Hai mood gắn với hai thời điểm chạy xe. Light = ban ngày trên quốc lộ: nền off-white gần như không chroma, mực nâu-đen ấm, accent rỉ sét (rust). Dark = đêm trên đèo: nền nhựa đường ấm gần đen, chữ trắng ấm, accent hổ phách đèn pha. Theme bám `data-theme` trên `<html>`, token tại `src/styles/theme.css`.

## Color Palette (OKLCH)

| Token | Light | Dark |
| --- | --- | --- |
| background | oklch(97.5% 0.003 95) | oklch(21% 0.012 55) |
| foreground | oklch(26% 0.02 50) | oklch(92.5% 0.01 85) |
| accent | oklch(50% 0.145 42) rust | oklch(78% 0.16 70) amber |
| accent-foreground | oklch(98% 0.005 90) | oklch(23% 0.04 60) |
| muted | oklch(92.5% 0.008 80) | oklch(29% 0.015 55) |
| muted-foreground | oklch(45% 0.015 55) | oklch(73% 0.02 75) |
| border | oklch(88% 0.01 75) | oklch(35% 0.018 60) |

Chiến lược màu: restrained, một accent duy nhất; màu sắc "đậm" nằm trong hình minh họa SVG chứ không trong chrome.

## Typography

- **Archivo** (Google Fonts, subset vietnamese): display + body. Weight contrast là trục chính: 900 cho display/H1, 700 heading, 400 body.
- **Google Sans Code**: code blocks, kbd/samp/pre, và pipeline OG image (satori).
- Headings dùng `text-wrap: balance`; cột đọc tối đa `max-w-3xl`.

## Imagery

Toàn bộ minh họa là SVG phong cảnh phẳng nhiều lớp (núi, đèo, nước, trời) sinh deterministic theo seed slug bài viết bằng `bun scripts/generate-post-images.ts`, lưu tại `public/images/posts/<slug>/{hero,scene-1,scene-2}.svg`. Mỗi bài có hero 21:9 ở đầu bài + thumbnail 16:10 trên card + 2 ảnh inline. Không stock photo, không feTurbulence/sketchy filter.

## Components

- **Card**: media-object, thumbnail trái 220px trên sm+, stack trên mobile; ảnh bo `rounded-lg`, viền `border-border`, hover scale 1.02 (tắt khi reduced-motion).
- **Hero trang chủ**: panorama `images/site/hero.svg` đóng khung `rounded-xl`, H1 font-black, mô tả ngắn, socials.
- **Post hero**: ảnh 21:9 `rounded-xl` giữa metadata và article.
- Bo góc tối đa 12px (`rounded-xl`); không glassmorphism, không gradient text, không side-stripe border.

## Layout & Motion

Cột đơn `max-w-3xl` của AstroPaper giữ nguyên. Motion duy nhất: Astro view transitions sẵn có + hover scale nhẹ trên thumbnail; mọi thứ có biến thể `motion-reduce`.
