# Kịch bản E2E — tất cả màn (review trước khi code test)

> **Trạng thái:** bản nháp để review — **chưa** map 1:1 sang file spec trong repo `e2e/` (triển khai sau khi chốt).  
> **Cập nhật lần cuối:** 2026-04-15

---

## 1. Mục tiêu & phạm vi

| Hạng mục | Nội dung |
|----------|-----------|
| **Mục tiêu** | Mô tả kịch bản có thể kiểm thử tự động cho **mọi màn có `page.tsx`** trong `src/app/`, kèm actor (guest / user / admin), dữ liệu seed, và assertion chính. |
| **Phạm vi** | UI qua trình duyệt (Playwright), **không** thay thế test đơn vị cho logic thuần (normalize, API body) trừ khi sau này bổ sung. |
| **Ngoài phạm vi (hiện tại)** | Upload file ảnh thật (multipart), email magic link, OAuth; gửi email; tải lớn performance. |

---

## 2. Tiền đề kỹ thuật (dùng chung mọi suite)

1. **Base URL:** `http://127.0.0.1:3000` (hoặc `localhost` — thống nhất với `playwright.config.ts`).
2. **Web server:** `npm run dev` (hoặc `dev:fresh` khi cần cache sạch); CI đặt `CI=1` để không `reuseExistingServer` lạ.
3. **DB:** SQLite `prisma/dev.db` — **global setup** nên: `prisma migrate deploy` (nếu CI) + seed user/quiz cố định cho từng nhóm test (tránh phụ thuộc tay).
4. **Auth (dev):** `admin@example.com` — mật khẩu **bất kỳ** (Credentials `authorize` chấp nhận mọi password cho user này — xem `src/lib/auth.ts`). E2E có thể dùng `storageState` sau một lần login form.
5. **User không admin:** cần seed thêm `user@example.com` (hoặc tương đưong) nếu muốn test redirect `/` → `/quizzes` và ẩn nút tạo quiz; **hiện seed e2e chỉ có `e2e-seed@example.com`** — playbook ghi rõ việc **bổ sung seed** trước khi code test non-admin.
6. **Chống flake:** `expect(...).toBeVisible({ timeout: … })` sau navigation; chờ network nếu submit form tạo quiz.

---

## 3. Danh sách màn hình (route → file)

| ID | Route | File nguồn | Ghi chú nhanh |
|----|--------|------------|----------------|
| **S01** | `/login` | `(auth)/login/page.tsx` | Guest; đã session → redirect `/` |
| **S02** | `/` | `app/page.tsx` | Chỉ **admin**; non-admin → redirect `/quizzes` |
| **S03** | `/quizzes` | `(dashboard)/quizzes/page.tsx` | User đăng nhập; dùng chung `QuizListView` với S02 (admin) |
| **S04** | `/quizzes/create` | `(dashboard)/quizzes/create/page.tsx` | Chỉ admin; non-admin → redirect `/quizzes` |
| **S05** | `/quizzes/[quizId]` | `(dashboard)/quizzes/[quizId]/page.tsx` | Chơi admin (crossword / placeholder MC) |
| **S06** | `/quizzes/[quizId]/edit` | `(dashboard)/quizzes/[quizId]/edit/page.tsx` | Chỉnh sửa (admin) |
| **S07** | `/play/[shareLink]` | `play/[shareLink]/page.tsx` | Public, không cần session; đã có e2e một phần |

**Không có `page.tsx` riêng trong repo:** `/_not-found` (Next mặc định) — có thể thêm suite nhỏ `navigate /path-khong-ton-tai` → kiểm tra 404 nếu cần.

---

## 4. Ma trận ưu tiên (gợi ý triển khai theo đợt)

| Đợt | Suite | Route liên quan | Lý do ưu tiên |
|-----|--------|-----------------|---------------|
| **Đ0** | Smoke auth + redirect | S01, S02, S03 | Nền cho mọi màn sau; nhanh |
| **Đ1** | Public crossword (đã có) | S07 | Đang green — chỉ mở rộng theo playbook khi chốt |
| **Đ2** | Admin list + create + play | S02, S03, S04, S05 | Luồng CRUD “mỏng” |
| **Đ3** | Edit + regression | S06 | Form dài, dễ flake — sau Đ2 |
| **Đ4** | Non-admin + MC placeholder | S03, S05 | Cần seed user không admin + quiz MC |

---

## 5. Kịch bản chi tiết (Given–When–Then)

### PB-AUTH-01 — Login thành công (admin)

- **Màn:** S01  
- **Actor:** guest (chưa cookie session)  
- **Given:** Mở `/login`.  
- **When:** Điền `admin@example.com`, password bất kỳ (vd `x`), bấm đăng nhập.  
- **Then:** Redirect tới `/` (admin); thấy heading **Quizzes** (hoặc shell danh sách đồng nhất với `/quizzes`).  
- **Dữ liệu:** user `admin@example.com` có trong DB (seed prisma hoặc `prisma/seed.ts`).  
- **Ghi chú:** Có thể lưu `storageState` để suite sau bỏ qua bước login.

### PB-AUTH-02 — Đã đăng nhập mở `/login`

- **Màn:** S01  
- **Given:** Đã login (storageState admin).  
- **When:** Mở `/login`.  
- **Then:** Redirect `/` (theo `login/page.tsx`).

### PB-AUTH-03 — Non-admin không vào `/` “dashboard admin”

- **Màn:** S02  
- **Given:** Session user **không** `isAdmin` (cần seed + login user đó).  
- **When:** Mở `/`.  
- **Then:** Redirect `/quizzes`.  
- **Trạng thái triển khai:** cần **seed user non-admin** + test mới.

### PB-LIST-01 — `/quizzes` sau login admin

- **Màn:** S03  
- **Given:** Login admin.  
- **When:** Mở `/quizzes`.  
- **Then:** Heading **Quizzes**; có link **Tạo Quiz Mới**; lưới thẻ (có thể 0 hoặc nhiều quiz từ seed).

### PB-LIST-02 — `/` và `/quizzes` cùng shell (admin)

- **Màn:** S02, S03  
- **Given:** Login admin.  
- **When:** Lần lượt mở `/` và `/quizzes`.  
- **Then:** Cùng kiểu container + tiêu đề + nút tạo (hồi quy BUG-001 / `QuizListView`).

### PB-CREATE-01 — Mở form tạo quiz (admin)

- **Màn:** S04  
- **Given:** Login admin.  
- **When:** Mở `/quizzes/create`.  
- **Then:** Tiêu đề **Tạo Quiz Mới**; có `QuizForm`; link quay lại tới `/quizzes`.

### PB-CREATE-02 — Tạo crossword basic tối thiểu (happy path — tùy chọn độ khó)

- **Màn:** S04 → redirect S05 hoặc S03  
- **Given:** Admin ở `/quizzes/create`.  
- **When:** Chọn loại **crossword basic**, nhập từ khóa dọc + đủ N câu hợp lệ (theo validation), submit.  
- **Then:** Thành công (toast hoặc redirect — **cần xác nhận hành vi thực tế trong `QuizForm`** khi code test).  
- **Ghi chú:** Có thể giữ bài tạo tạm rồi xóa bằng API hoặc UI **Delete** trên list để không làm bẩn DB; hoặc dùng title prefix `e2e-` + teardown.

### PB-PLAY-ADMIN-01 — Mở chơi admin từ list

- **Màn:** S05  
- **Given:** Seed quiz basic có `shareLink` + câu hỏi (vd `e2e-share-basic` hoặc bản sao).  
- **When:** Login admin → `/quizzes` → bấm **Chơi (admin)** trên đúng thẻ.  
- **Then:** URL `/quizzes/[id]`; thấy `CrosswordPlayer` (tiêu đề quiz, hàng ngang / từ khóa tuỳ loại).

### PB-PLAY-ADMIN-02 — Multiple choice placeholder

- **Màn:** S05  
- **Given:** Seed quiz type `multiple_choice` (nếu có trong DB).  
- **When:** Mở `/quizzes/[id]`.  
- **Then:** Thông báo kiểu “đang phát triển” (theo code hiện tại) — chỉ assert không crash.

### PB-EDIT-01 — Mở màn chỉnh sửa (admin)

- **Màn:** S06  
- **Given:** Login admin + `quizId` hợp lệ.  
- **When:** `/quizzes/[quizId]/edit`.  
- **Then:** Có editor / form; không 404.

### PB-EDIT-02 — Lưu thay đổi (smoke)

- **Màn:** S06  
- **When:** Sửa một field nhỏ (vd title suffix), lưu.  
- **Then:** Phản hồi thành công (toast/redirect — **đối chiếu `QuizForm` / API khi implement**).

### PB-PUBLIC-01 — `/play/[shareLink]` not found

- **Màn:** S07  
- **When:** `/play/khong-ton-tai-xyz`.  
- **Then:** Trang 404 Next (hoặc UI not found — assert status/heading tùy app).

### PB-PUBLIC-02 — Crossword basic (đã có trong code)

- **Màn:** S07  
- **Kịch bản:** Giữ / mở rộng theo `e2e/crossword-basic.spec.ts`: dải từ khóa, nút trả lời từ khóa sau khi làm hết hàng ngang, modal, đoán đúng HI, strip lộ chữ.  
- **Bổ sung gợi ý playbook:** assert **(N chữ)** khi mở một hàng ngang (sau khi triển khai UI §3.1).

### PB-PUBLIC-03 — Non-admin (hoặc guest) chỉ xem public

- **Màn:** S07  
- **Given:** Không login.  
- **When:** Mở `/play/[shareLink]` hợp lệ.  
- **Then:** Chơi được (không redirect login).

---

## 6. Dữ liệu seed (đề xuất mở rộng)

| Key | Mục đích |
|-----|----------|
| Giữ `e2e-share-basic` | Regression crossword public (đã dùng). |
| Thêm `admin@example.com` | Login admin (thường có sẵn từ seed dự án). |
| Thêm `viewer@example.com` `isAdmin: false` | PB-AUTH-03, PB-LIST non-admin. |
| Thêm quiz `multiple_choice` | PB-PLAY-ADMIN-02. |
| (Tuỳ chọn) Quiz `crossword_advanced` có `imageUrl` | Kiểm thử thẻ list + preview ảnh (có thể URL tĩnh / fixture). |

---

## 7. Cấu trúc file Playwright (đề xuất sau khi chốt)

```
e2e/
  global-setup.ts          # mở rộng seed theo mục 6
  auth.setup.ts            # (tuỳ chọn) tạo storageState admin + viewer
  login.spec.ts
  quizzes-list.spec.ts
  quizzes-create.spec.ts
  quizzes-play-admin.spec.ts
  quizzes-edit.spec.ts
  crossword-basic.spec.ts  # hiện có — tách import share link chung
```

---

## 8. Rủi ro & việc cần chốt trước khi code

1. **Tạo quiz end-to-end** phụ thuộc flow `QuizForm` (client), có thể cần `data-testid` cho ô quan trọng để ổn định locator.  
2. **Xóa quiz / dọn DB** giữa test: nên có teardown hoặc DB riêng cho CI.  
3. **Song song workers:** hiện `workers: 1` — giữ nếu dùng chung SQLite; nếu tách DB per worker thì có thể tăng.  
4. **Ảnh upload:** nếu edit/create cần file thật — kịch bản tách suite **manual** hoặc mock API upload.

---

## 9. Bảng tổng hợp test case & trạng thái

**Quy ước cột *Trạng thái*:** cập nhật sau mỗi lần triển khai/ghi test hoặc sau khi chạy `npm run e2e` / CI.

| Mã | Tóm tắt | Màn | Trạng thái | Ghi chú |
|----|---------|-----|------------|---------|
| PB-AUTH-01 | Login admin thành công | S01 | Chưa có | |
| PB-AUTH-02 | Đã login → mở `/login` redirect | S01 | Chưa có | |
| PB-AUTH-03 | Non-admin: `/` → `/quizzes` | S02 | Chưa có | Cần seed user không admin |
| PB-LIST-01 | `/quizzes` sau login admin | S03 | Chưa có | |
| PB-LIST-02 | `/` và `/quizzes` cùng shell (admin) | S02, S03 | Chưa có | |
| PB-CREATE-01 | Mở form tạo quiz | S04 | Chưa có | |
| PB-CREATE-02 | Tạo crossword basic happy path | S04 | Chưa có | Phụ thuộc `QuizForm` |
| PB-PLAY-ADMIN-01 | Chơi admin từ list | S05 | Chưa có | |
| PB-PLAY-ADMIN-02 | MC placeholder | S05 | Chưa có | Cần seed quiz MC |
| PB-EDIT-01 | Mở màn edit | S06 | Chưa có | |
| PB-EDIT-02 | Lưu chỉnh sửa smoke | S06 | Chưa có | |
| PB-PUBLIC-01 | Play link không tồn tại → 404 | S07 | Chưa có | |
| PB-PUBLIC-02 | Crossword basic public (dải từ khóa, hàng ngang, modal, đoán đúng, strip) | S07 | **Một phần — Pass** | `e2e/crossword-basic.spec.ts` (4 test, gồm trong `npm run verify`) |
| PB-PUBLIC-03 | Guest mở `/play/...` không bị redirect login | S07 | Chưa có | PB-PUBLIC-02 đã dùng guest; có thể gộp assert vào cùng suite |

**Gợi ý:** khi một mã chuyển sang **Pass** hoặc **Fail**, thêm ngày ngắn trong *Ghi chú* (vd `Pass 2026-04-20`).

---

*Nếu bạn chốt nội dung playbook (thêm/bớt PB-*, đổi ưu tiên), báo lại để agent triển khai file `e2e/*.spec.ts` + cập nhật `global-setup` cho khớp — và cập nhật **§9** cùng lúc.*
