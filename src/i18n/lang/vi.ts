import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Trang chủ",
    posts: "Bài viết",
    tags: "Thẻ",
    about: "Giới thiệu",
    archives: "Lưu trữ",
    search: "Tìm kiếm",
  },
  post: {
    publishedAt: "Đăng ngày",
    updatedAt: "Cập nhật",
    sharePostIntro: "Chia sẻ bài viết:",
    sharePostOn: "Chia sẻ bài viết trên {{platform}}",
    sharePostViaEmail: "Chia sẻ bài viết qua email",
    tagLabel: "Thẻ",
    backToTop: "Lên đầu trang",
    goBack: "Quay lại",
    editPage: "Sửa trang",
    previousPost: "Bài trước",
    nextPost: "Bài sau",
  },
  pagination: {
    prev: "Trước",
    next: "Sau",
    page: "Trang",
  },
  home: {
    socialLinks: "Liên kết",
    featured: "Chuyến đi nổi bật",
    recentPosts: "Bài mới",
    allPosts: "Tất cả bài viết",
  },
  footer: {
    copyright: "Bản quyền",
    allRightsReserved: "Mọi quyền được bảo lưu.",
  },
  pages: {
    tagTitle: "Thẻ",
    tagDesc: "Tất cả bài viết gắn thẻ",

    tagsTitle: "Thẻ",
    tagsDesc: "Tất cả thẻ đã dùng trong các bài viết.",

    postsTitle: "Bài viết",
    postsDesc: "Toàn bộ nhật ký những chuyến đi.",

    archivesTitle: "Lưu trữ",
    archivesDesc: "Toàn bộ bài viết xếp theo dòng thời gian.",

    searchTitle: "Tìm kiếm",
    searchDesc: "Tìm một chuyến đi, một con đèo, một vùng đất ...",
  },
  a11y: {
    skipToContent: "Bỏ qua, đến nội dung chính",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
    toggleTheme: "Đổi giao diện sáng/tối",
    searchPlaceholder: "Tìm bài viết...",
    noResults: "Không tìm thấy kết quả",
    goToPreviousPage: "Về trang trước",
    goToNextPage: "Đến trang sau",
  },
  notFound: {
    title: "404 Không tìm thấy",
    message: "Trang này không tồn tại",
    goHome: "Về trang chủ",
  },
} satisfies UIStrings;
