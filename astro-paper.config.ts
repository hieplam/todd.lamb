import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    // Canonical public URL. GitHub Pages serves this project under the repo
    // sub-path; astro.config.ts derives `site` (origin) and `base` (path) from it.
    url: "https://hieplam.github.io/todd.lamb/",
    title: "Hiệp Lâm Rides",
    description:
      "Nhật ký những chuyến đi xe máy đường dài: đèo dốc Tây Bắc, cao nguyên đá Hà Giang, duyên hải miền Trung và những cung đường ngoài biên giới.",
    author: "Hiệp Lâm",
    profile: "https://github.com/hieplam",
    ogImage: "default-og.jpg",
    lang: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 5,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/hieplam" },
    { name: "mail", url: "mailto:lamhiep16@gmail.com" },
  ],
  shareLinks: [
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "mail", url: "mailto:?subject=Xem%20b%C3%A0i%20n%C3%A0y&body=" },
  ],
});
