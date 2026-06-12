# Hiệp Lâm Rides

![Hiệp Lâm Rides](public/default-og.jpg)

Nhật ký những chuyến đi xe máy đường dài của Hiệp Lâm: 45 bài viết về các cung đường Việt Nam, Lào, Thái Lan và Campuchia. Site tĩnh dựng bằng [Astro 6](https://astro.build) (theme gốc [AstroPaper](https://github.com/satnaing/astro-paper)), Tailwind CSS 4, tìm kiếm Pagefind, OG image sinh tự động.

Blog deploy bằng Docker (nginx), **mặc định public**. Khi cần giới hạn người đọc, set env `AUTH_PASSWORD` là toàn site khóa sau HTTP Basic Auth — không cần sửa code.

## Phát triển

```bash
bun install
bun run dev        # http://localhost:4321
bun run build      # astro check + build + pagefind index
bun run lint       # eslint
bun run format     # prettier
```

## Nội dung & hình ảnh

- Bài viết: `src/content/posts/*.md` (frontmatter validate bằng Zod trong `src/content.config.ts`).
- Spec các chuyến đi: `scripts/trips.json` (slug, tiêu đề, lộ trình, scene minh họa).
- Minh họa SVG sinh deterministic theo seed slug:

```bash
bun scripts/generate-post-images.ts
# -> public/images/posts/<slug>/{hero,scene-1,scene-2}.svg
# -> public/images/site/hero.svg + public/default-og.jpg
```

Quy ước: bài có file `public/images/posts/<slug>/hero.svg` sẽ tự hiện hero image ở đầu bài và thumbnail trên card (xem `src/utils/getPostHeroImage.ts`).

## Docker & đăng nhập

Image build 2 stage: Bun build site tĩnh, nginx alpine serve `dist/`. Mặc định public; set `AUTH_PASSWORD` để bật basic auth toàn site (trừ `/healthz` cho healthcheck).

```bash
docker build -t hieplam-rides .

# public (mặc định)
docker run -p 8080:80 hieplam-rides
# curl -I localhost:8080 -> 200

# khóa bằng basic auth
docker run -p 8080:80 -e AUTH_PASSWORD=secret hieplam-rides
# curl -I localhost:8080              -> 401
# curl -u rider:secret -I localhost:8080 -> 200
```

| Env             | Mặc định             | Ý nghĩa                                        |
| --------------- | -------------------- | ---------------------------------------------- |
| `AUTH_PASSWORD` | (không set = public) | Set để bật basic auth toàn site                |
| `AUTH_USER`     | `rider`              | Tên đăng nhập, chỉ dùng khi có `AUTH_PASSWORD` |

## Deploy lên Dokploy

1. Tạo **Application** mới từ git repo này, build type **Dockerfile**.
2. (Tùy chọn) Đặt env `AUTH_PASSWORD` (và `AUTH_USER`) trong tab Environment nếu muốn khóa blog.
3. Gắn domain, bật HTTPS, deploy. Healthcheck dùng đường dẫn `/healthz`.
4. Cập nhật `site.url` trong `astro-paper.config.ts` theo domain thật rồi redeploy (canonical URL/sitemap/RSS).

## Deploy lên GitHub Pages

Blog cũng deploy được lên GitHub Pages (miễn phí, không cần hạ tầng) tại `https://hieplam.github.io/todd.lamb`.

1. Vào **Settings → Pages → Source** và chọn **GitHub Actions**.
2. Mỗi lần push lên `main`, workflow `.github/workflows/deploy.yml` sẽ chạy `bun run build` và xuất bản `dist/`.
3. URL công khai lấy từ `site.url` trong `astro-paper.config.ts`; `astro.config.ts` tự tách thành `site` (origin) và `base` (`/todd.lamb`) nên mọi liên kết, ảnh, RSS và ô tìm kiếm Pagefind đều chạy đúng dưới sub-path.

> Đổi tên repo → nhớ cập nhật `site.url` cho khớp `base` mới.

## Kiến trúc

Tài liệu kiến trúc C3 nằm trong `.c3/` — thao tác qua CLI `c3x` (xem `CLAUDE.md`). Giấy phép: [MIT](LICENSE) — theme gốc của [Sat Naing](https://github.com/satnaing).
