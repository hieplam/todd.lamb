# Product

## Register

brand

## Users

Người đọc tiếng Việt quan tâm du lịch xe máy đường dài: bạn bè của tác giả và cộng đồng rider tra cứu lộ trình, kinh nghiệm trước chuyến đi. Đọc chủ yếu trên điện thoại, thường vào buổi tối hoặc khi đang lên kế hoạch chuyến đi. Blog đặt sau lớp đăng nhập (basic auth) nên người đọc là khách được chủ blog mời.

## Product Purpose

Nhật ký 45 chuyến đi xe máy có thật của Hiệp Lâm: mỗi bài gồm lộ trình cụ thể, thông số chuyến đi, chuyện dọc đường và kinh nghiệm thực dụng. Thành công = người đọc tìm được đúng cung đường mình cần và đọc hết bài.

## Brand Personality

Bụi bặm, bền bỉ, phóng khoáng. Giọng văn thứ nhất ("mình"), cụ thể đến từng trạm xăng, có chỗ tự giễu, không tô hồng.

## Anti-references

- Blog du lịch thương mại kiểu listicle ("Top 10 điểm check-in...") với stock photo và sáo ngữ "vẻ đẹp hoang sơ".
- Landing page SaaS: hero-metric grid, gradient text, glassmorphism.
- Nền cream/parchment "AI default"; lane editorial-serif-tạp-chí không hợp chất bụi đường.

## Design Principles

1. Nội dung trước, trang trí sau: cột đọc hẹp, chữ lớn, tương phản đạt AA.
2. Hai thế giới sáng/tối đều là thật: ban ngày trên quốc lộ (off-white + rỉ sét), ban đêm trên đèo (nhựa đường + hổ phách đèn pha).
3. Hình ảnh là minh họa phong cảnh dựng bằng SVG sinh tự động theo từng cung đường, không stock photo, không ảnh giả-thực.
4. Mọi màu đi qua design token trong `src/styles/theme.css` (Tailwind 4 custom properties).
5. Tiếng Việt là ngôn ngữ thứ nhất của cả nội dung lẫn UI chrome.

## Accessibility & Inclusion

WCAG AA: body text ≥ 4.5:1 ở cả hai theme; focus ring rõ; semantic HTML của AstroPaper giữ nguyên; mọi transition tôn trọng `prefers-reduced-motion`; alt text tiếng Việt có nghĩa cho ảnh nội dung, ảnh trang trí dùng alt rỗng.
