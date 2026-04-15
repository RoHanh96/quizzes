# Task 002 — Nhật ký bug (crossword basic & màn admin danh sách)

**Quy ước:** Mọi bug liên quan chức năng trong phạm vi task 002 (crossword basic, `/play/...`, từ khóa public, màn danh sách quiz admin) ghi **một mục mới** dưới đây theo mẫu. Khi code xong: cập nhật **Trạng thái** = đã fix + ghi rõ **đã test** (lệnh / kết quả).

---

## Mẫu cho bug sau (copy block)

```markdown
### [BUG-XXX] Tiêu đề ngắn

- **Mô tả:** …
- **Cách tái hiện:** …
- **Kỳ vọng:** …
- **Kế hoạch sửa:** …
- **Trạng thái:** Chưa fix | Đang làm | **Đã fix** — **Đã test:** …
```

---

### [BUG-001] `/` (admin home) và `/quizzes` khác giao diện / layout

- **Mô tả:** Trang `http://localhost:3000/` dùng `main` kiểu `min-h-screen` + `p-24` + `max-w-5xl`, tiêu đề `text-4xl` "Quiz Creator"; trang `http://localhost:3000/quizzes` dùng `container mx-auto px-4 py-8`, tiêu đề `text-3xl` "Quizzes", thẻ bài có ảnh (advanced) + dòng loại quiz — hai trang không đồng nhất trải nghiệm.
- **Cách tái hiện:** Đăng nhập admin; mở `/` rồi `/quizzes`, so sánh khung trang, cỡ chữ tiêu đề, lưới thẻ.
- **Kỳ vọng:** Cùng layout shell (container, padding, max-width), cùng kiểu thẻ và hành động (tạo quiz, chơi, link public, chỉnh sửa, xóa khi admin).
- **Kế hoạch sửa:** Tách **một** component server `QuizListView` (hoặc tên tương đương) trong `src/components/quizzes/`, nhận `quizzes` + `session.user`; cả `app/page.tsx` (admin) và `app/(dashboard)/quizzes/page.tsx` chỉ fetch dữ liệu và render component đó. Đồng bộ include Prisma (crossword + ảnh advanced). Cập nhật `scripts/check-admin-ui-css.cjs` nếu bộ utility đại diện đổi (vẫn phải bắt hồi quy Tailwind).
- **Trạng thái:** **Đã fix** — **Đã test:** `npm run verify` **pass** (lint, build, `check:admin-ui-css`, Playwright e2e).
