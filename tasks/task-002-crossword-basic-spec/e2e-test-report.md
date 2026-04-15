# Task 002 — E2E test report (crossword basic)

> **Phạm vi:** chỉ nội dung **task 002** — crossword basic (chuẩn hóa text, admin tạo/sửa, màn chơi `/play/...` + admin play, API từ khóa public, spectator).  
> **Tham chiếu:** [spec.md](./spec.md) · Bug log: [fix-bug.md](./fix-bug.md) · Code E2E: `e2e/crossword-basic.spec.ts`, `e2e/task-002-*.spec.ts`, `e2e/constants.ts`, `e2e/global-setup.ts` (nhiều `shareLink` seed).

## Mục tiêu kiểm thử (đã chốt)

**Toàn bộ** các case trong báo cáo E2E này được thiết kế để **chạy tự động bằng Playwright** (E2E trong `npm run e2e` / `npm run verify`).  
**Không** coi “kiểm thử tay” là nhánh chính: nếu cần chỉ còn **tùy chọn** cho bước **thẩm mỹ layout** (căn cột pixel-perfect) — có thể bổ sung screenshot baseline sau; mọi assert logic/UI có text/role vẫn dùng Playwright.

**Cập nhật lần cuối:** 2026-04-15

---

## 1. Tiền đề & công cụ

| Hạng mục | Giá trị / ghi chú |
|----------|-------------------|
| **Runner** | Playwright (`@playwright/test`), cấu hình `playwright.config.ts`. |
| **Chạy** | `npm run e2e` hoặc `npm run verify` (CI đặt `CI=1` nếu cần server sạch). |
| **Public play** | Seed nhiều quiz (`e2e-share-basic`, `e2e-share-accent`, …) trong `e2e/global-setup.ts` + hằng số `e2e/constants.ts` (reset mỗi lần chạy). |
| **Admin flows** | Login `admin@example.com` + mật khẩu bất kỳ (dev) — nên tách **`auth.setup.ts`** + `storageState` để test admin không lặp form login. |
| **Dữ liệu mở rộng** | Thêm quiz seed theo từng case (§1 dấu/space, §2 invalid, `BANANA`, …) hoặc **tạo qua UI** trong test rồi teardown — ưu tiên seed cố định cho ổn định CI. |
| **Locator** | Ưu tiên `getByRole` / `getByLabel`; bổ sung `data-testid` trên `QuizForm` / editor nếu flake. |

### 1.1 Hai lớp trong tài liệu này

| Lớp | Mục đích | Ở đâu trong file |
|-----|----------|------------------|
| **Nghiệp vụ / kỳ vọng** | Gắn mã E- với spec (cái gì phải đúng sau cùng). | Các bảng mục **§2** bên dưới (cột *Scenario*, *Kỳ vọng*). |
| **Thao tác UI** | Tái hiện gần với tay người: mở trang, gõ ô input, bấm nút, tick checkbox, chọn `<select>`, v.v. | **§1.2** (chuỗi bước tương ứng code Playwright hiện có). |

**Ghi chú:** Các spec **không** chỉ assert “trạng thái cuối” trừu tượng — trong repo đã dùng `page.goto`, `click`, `fill`, `getByRole('button', …).click()`, v.v. Phần nghiệp vụ ở §2 được viết ngắn để đọc cùng spec.md; nếu cần review tay hoặc viết thêm case, hãy dùng **§1.2** làm checklist hành vi.

### 1.2 Chuỗi thao tác UI (theo mã E / A)

Các bước dưới đây khớp thứ tự thao tác trong file spec (có thể lược bỏ `expect` trung gian). `shareLink` cụ thể nằm trong `e2e/constants.ts`.

#### Người chơi — link public (`/play/...`)

| Mã | Route (ví dụ) | Chuỗi thao tác chính (user-like) |
|----|---------------|----------------------------------|
| **E-§1-01** | `/play/e2e-share-accent` | Mở link → bấm **Câu 1:** → nhập ô *Nhập câu trả lời…* `NAM` → **Trả lời** → bấm **Câu 2:** → nhập `LOC` → **Trả lời** → **Trả lời từ khóa** → tick checkbox xác nhận → ô *Nhập từ khóa đầy đủ…* nhập `  n ở  ` (có dấu, khoảng trắng) → **Gửi đoán**. |
| **E-§1-02** | `/play/e2e-share-space` | Mở link → **Câu 1:** → kiểm tra hiện **(2 chữ)** → nhập sai `XX` → **Trả lời** → thấy báo sai → sửa ô thành `AH` → **Trả lời** → **Câu 2:** → nhập `A I R` (có space) → **Trả lời** → còn nút **Trả lời từ khóa**. |
| **E-§1-03** | `/play/e2e-share-en` | Mở link → lần lượt trả lời đúng hai hàng (`OKAY`, `TOKEN`) qua **Câu …** + **Trả lời** → **Trả lời từ khóa** → checkbox → nhập `ok` (thường) → **Gửi đoán**; test còn bắt `console` / `pageerror`. |
| **E-§3.1-01** | `/play/e2e-share-space` | **Câu 1:** → thấy **(2 chữ)** → **Câu 2:** → thấy **(3 chữ)**. |
| **E-§3.1-02** | `/play/e2e-share-space` | **Câu 1:** → nhập `bad` → **Trả lời** → thông báo sai → nhập lại `A H` → **Trả lời** → form đóng (không còn placeholder trả lời). |
| **E-§3.1-03** | `/play/e2e-share-space` | Chỉ khi `E2E_LAYOUT=1`: mở link → assert có phần tử hàng chữ căn `margin-left` (layout). |
| **E-§3.3-03** | `/play/e2e-share-wrong` | (Test xóa `sessionStorage` khóa eliminated trước khi vào trang.) → **Trả lời từ khóa** → checkbox → nhập `XX` → **Gửi đoán** → thông báo hết quyền → không còn nút từ khóa → bấm **Câu 1:** nhưng **không** mở được ô nhập câu. |
| **E-§3.3.6-01** | `/play/e2e-share-spectator` | **Hai trình duyệt (hai context):** ngữ cảnh A — mở link → sai từ khóa (`ZZ` + **Gửi đoán**) → vào trạng thái khóa; ngữ cảnh B — mở link → đoán đúng `HI` + **Gửi đoán**; A chờ poll → thấy từ khóa đã giải + strip `HI` (không cần gõ lại trên A). |
| **A-01** (E-§3.2-01 + mở play) | `/play/e2e-share-basic` | Mở link → đọc tiêu đề + dải từ khóa + nút **Trả lời từ khóa** (không nhập câu trong test này). |
| **A-02** (E-§3.3-01) | `/play/e2e-share-basic` | **Câu 1:** → nhập `HAND` → **Trả lời** → **Câu 2:** → `AIR` → **Trả lời** → vẫn thấy **Trả lời từ khóa**. |
| **A-03** (E-§3.3-02) | `/play/e2e-share-basic` | **Trả lời từ khóa** → dialog → heading + checkbox + placeholder từ khóa. |
| **A-04** (E-§3.3-04 + strip) | `/play/e2e-share-basic` | **Trả lời từ khóa** → checkbox → nhập `HI` → **Gửi đoán** → strip hiện `HI` + trạng thái đã giải. |

#### Admin — đăng nhập + form / danh sách

| Mã | Route | Chuỗi thao tác chính (user-like) |
|----|-------|-----------------------------------|
| **E-§2-01** | `/login` → `/quizzes/create` | Đăng nhập `admin@example.com` + mật khẩu bất kỳ → **Tạo Quiz Mới** (hoặc goto create) → `#type` chọn **Crossword … Basic** → `#title`, `#verticalWord` = `HI` → chỉ điền **một** khối câu hỏi (đủ ô câu hỏi + đáp án) → **Tạo Quiz** → vẫn ở trang create + thông báo lỗi số câu. |
| **E-§2-02** | idem | Giống trên nhưng **+ Thêm câu hỏi** → câu 2 đáp án `XYZ` (thiếu slot `I`) → thấy `role=alert` dưới ô → **Tạo Quiz** → hộp đỏ tổng + vẫn ở create. |
| **E-§2-03** | `/play/e2e-share-banana` | Mở link public → đếm 6 ô strip → **Câu 1:** → mở được ô *Nhập câu trả lời…*. *(File `task-002-quiz-form.spec.ts` dùng `beforeEach` login admin cho cả `describe`, kể cả test này — có thể tách `describe` sau nếu muốn test “khách” thuần không session admin.)* |
| **E-§2-04** | `/` sau login → `/quizzes` → `/quizzes/.../edit` | Đăng nhập admin → danh sách quiz → trên thẻ **E2E Crossword Basic** bấm **Chỉnh sửa** → không thấy nhãn chỉnh **letterIndex** số, không có `input[type=number]`. |
| **E-§3.4-01** | `/quizzes` → `/quizzes/[id]` | Đăng nhập admin → **Chơi (admin)** trên thẻ **E2E Crossword Basic** → đếm đúng **một** link **Quay lại danh sách**. |

#### Khoảng trống (để mở rộng sau, nếu muốn “tay admin” đậm hơn)

- **Lưu quiz thành công** sau khi sửa (bấm **Cập nhật Quiz** rồi assert `/quizzes`) — hiện chưa có test riêng; E-§2-04 chỉ kiểm tra UI sửa.
- **Để trống bắt buộc** (title / từ khóa / câu hỏi) và assert validation trình duyệt (`required`) hoặc message server — có thể bổ sung spec + một dòng trong bảng §1.2.

---

## 2. E2E scenarios vs spec (Playwright — full coverage target)

Cột **Trạng thái:** `Pass` = đã có trong repo và green · `Chưa có` = chưa viết spec Playwright · `Tay tùy chọn` = chỉ dùng khi bật so sánh ảnh thủ công / baseline (không bắt buộc trong `verify`).

**Liên kết chuỗi thao tác UI:** mỗi mã E-/A- có phần mô tả bước bấm/nhập tương ứng ở **§1.2** (cột *Chuỗi thao tác chính*).

### §1 Chuẩn hóa văn bản (play + tạo bài qua UI hoặc seed)

| Mã | Scenario | Kỳ vọng (assert) | Trạng thái |
|----|----------|-------------------|------------|
| **E-§1-01** | Từ khóa có dấu / hoa thường / khoảng trắng | `N` ô dải từ khóa + đoán đúng theo `answersMatch` (bỏ dấu/space) | **Pass** (`task-002-normalize-play.spec.ts`) |
| **E-§1-02** | Đáp án hàng ngang có space | Số ô = số ký tự không space; hiện **(N chữ)** đúng; nhập đáp án có/không space vẫn đúng | **Pass** (idem) |
| **E-§1-03** | EN + ASCII | Chơi ổn, không lỗi console | **Pass** (idem) |

### §2 Admin (tạo / sửa) — UI hoặc API + UI

| Mã | Scenario | Kỳ vọng | Trạng thái |
|----|----------|---------|------------|
| **E-§2-01** | Số câu ≠ `N` | Toast/inline lỗi; không submit thành công | **Pass** (`task-002-quiz-form.spec.ts`) |
| **E-§2-02** | Đáp án thiếu ký tự slot `i` | Thông báo đúng vị trí / câu | **Pass** (idem) |
| **E-§2-03** | Từ khóa ký tự lặp (`BANANA`) | Đủ N câu + validate + preview/player | **Pass** (idem — màn public `e2e-share-banana`) |
| **E-§2-04** | Basic: không nhập `letterIndex` tay | Lưu thành công; preview/player căn cột khớp `letterIndex` server | **Pass** (idem — UI sửa không có ô `letterIndex`) |

### §3.1 Hàng ngang

| Mã | Scenario | Kỳ vọng | Trạng thái |
|----|----------|---------|------------|
| **E-§3.1-01** | Click hàng → câu hỏi + **(N chữ)** + input | `N` khớp số ô (không space) | **Pass** (`task-002-player-rows.spec.ts`) |
| **E-§3.1-02** | Đúng / sai một câu | Sai: message lỗi; đúng: ô điền chữ | **Pass** (idem) |
| **E-§3.1-03** | Cột từ khóa thẳng | **Tay tùy chọn** screenshot; hoặc assert `marginLeft` / số ô + vị trí ô tím nếu có `data-testid` | **Tùy chọn** — `E2E_LAYOUT=1` trong `task-002-player-rows.spec.ts` |

### §3.2 Dải từ khóa

| Mã | Scenario | Kỳ vọng | Trạng thái |
|----|----------|---------|------------|
| **E-§3.2-01** | Trước thắng: đúng `N` ô, không mirror từ hàng ngang | Đếm ô + không lộ chữ từ câu đã đúng | **Pass** (gộp trong **A-01**) |
| **E-§3.2-02** | Sau đoán đúng / global solved | Strip lộ chữ + tiêu đề “đã giải”; dòng gốc nếu khác | **Pass** (gộp trong **A-04**); global SSR cần seed/API riêng nếu tách case |

### §3.3 Đoán từ khóa

| Mã | Scenario | Kỳ vọng | Trạng thái |
|----|----------|---------|------------|
| **E-§3.3-01** | Nút từ khóa trước / sau khi làm hết hàng ngang | Nút visible khi chưa eliminated / chưa thắng từ khóa / chưa global | **Pass** (**A-02**) |
| **E-§3.3-02** | Modal checkbox + placeholder | Dialog + checkbox + input | **Pass** (**A-03**) |
| **E-§3.3-03** | Sai từ khóa | `sessionStorage` + khóa UI; không mở câu | **Pass** (`task-002-keyword-spectator.spec.ts`, `e2e-share-wrong`) |
| **E-§3.3-04** | Đúng từ khóa | Thắng + autofill + strip | **Pass** (**A-04**) |

### §3.3.6 Spectator

| Mã | Scenario | Kỳ vọng | Trạng thái |
|----|----------|---------|------------|
| **E-§3.3.6-01** | Hai context: A sai, B POST đúng, A poll reveal | A: full reveal, không click/nhập | **Pass** (`task-002-keyword-spectator.spec.ts`, `e2e-share-spectator`) |

### §3.4 Back

| Mã | Scenario | Kỳ vọng | Trạng thái |
|----|----------|---------|------------|
| **E-§3.4-01** | `/quizzes/[id]` một nút back | Đếm `getByRole('link', …)` / `back` không trùng | **Pass** (`task-002-admin-back.spec.ts`) |

### Bộ test hiện có (tên cũ A-* — giữ để tham chiếu PR/commit)

| Mã | Gộp mã § | File | Trạng thái |
|----|-----------|------|------------|
| **A-01** | E-§3.2-01 + mở play | `e2e/crossword-basic.spec.ts` | Pass |
| **A-02** | E-§3.3-01 | idem | Pass |
| **A-03** | E-§3.3-02 | idem | Pass |
| **A-04** | E-§3.3-04 + E-§3.2-02 (strip) | idem | Pass |

---

## 3. Lộ trình triển khai Playwright (gợi ý)

| Đợt | Việc làm |
|-----|----------|
| **1** | `auth.setup.ts` + `storageState` admin; file `e2e/task-002-admin.spec.ts` smoke: vào create/edit. |
| **2** | Seed thêm 1–2 quiz (§1 dấu/space) hoặc `test.describe` data-driven; case **E-§1-01** … **E-§1-03**. |
| **3** | Form validation **E-§2-01** … **E-§2-04** (có thể gọi API trực tiếp + assert UI song song). |
| **4** | Player **E-§3.1-01** … **E-§3.1-02**; **E-§3.3-03** (context mới + clear storage). |
| **5** | **E-§3.3.6-01** hai `browser.newContext()`. |
| **6** | **E-§3.4-01**; **E-§3.1-03** nếu bật screenshot — tách job không chặn `verify` nếu cần. |

---

## 4. Bảng tổng hợp trạng thái (theo dõi)

Cập nhật cột **Trạng thái** + **Ghi chú** (ngày / commit) mỗi khi merge test mới.

| Mã | Trạng thái | Ghi chú |
|----|------------|---------|
| A-01 | Pass | `crossword-basic.spec.ts` |
| A-02 | Pass | idem |
| A-03 | Pass | idem |
| A-04 | Pass | idem |
| E-§1-01 | Pass | `task-002-normalize-play.spec.ts` |
| E-§1-02 | Pass | idem |
| E-§1-03 | Pass | idem |
| E-§2-01 | Pass | `task-002-quiz-form.spec.ts` |
| E-§2-02 | Pass | idem |
| E-§2-03 | Pass | idem |
| E-§2-04 | Pass | idem |
| E-§3.1-01 | Pass | `task-002-player-rows.spec.ts` |
| E-§3.1-02 | Pass | idem |
| E-§3.1-03 | Tùy chọn | `E2E_LAYOUT=1` — assert nhẹ margin; screenshot baseline sau nếu cần |
| E-§3.2-01 | Pass | qua A-01 |
| E-§3.2-02 | Pass | qua A-04 (phần strip); global solved = mở rộng sau |
| E-§3.3-01 | Pass | qua A-02 |
| E-§3.3-02 | Pass | qua A-03 |
| E-§3.3-03 | Pass | `task-002-keyword-spectator.spec.ts` |
| E-§3.3-04 | Pass | qua A-04 |
| E-§3.3.6-01 | Pass | idem |
| E-§3.4-01 | Pass | `task-002-admin-back.spec.ts` |

---

## 5. Sau khi chạy / merge test

- Cập nhật **§4** và bảng trong **§2** cho đúng `Pass` / `Chưa có`.  
- Khi thêm/sửa spec: cập nhật **§1.2** (chuỗi thao tác UI) cho khớp code Playwright, để QA và reviewer không chỉ đọc phần nghiệp vụ ở **§2**.  
- Bug: [fix-bug.md](./fix-bug.md).  
- Đổi spec: [spec.md](./spec.md) rồi chỉnh **§2** trong file này cho khớp.
