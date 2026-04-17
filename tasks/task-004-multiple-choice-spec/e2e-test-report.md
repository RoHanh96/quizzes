# Task 004 — E2E test report (multiple choice)

> **Phạm vi:** chỉ **task 004** — multiple choice (ngân hàng câu, `playLength`, bucket + session deterministic, admin form, public play: khóa → chờ reveal → đúng/sai, game over / thắng).  
> **Tham chiếu:** [spec.md](./spec.md) · [implementation-plan.md](./implementation-plan.md) · **Bug log:** [fix-bug.md](./fix-bug.md) · Code E2E: `e2e/task-004-mc-*.spec.ts` · Seed: `e2e/constants.ts` (`E2E_SHARE_MC`) + `e2e/global-setup.ts`.  
> **Share link seed:** `e2e-share-mc` — client + API test dùng query `?sessionSeed=playwright-session` khi `shareLink` bắt đầu bằng `e2e-` (đồng bộ với `MultipleChoicePlayer`).

**Quy ước:** hai lớp mô tả — **nghiệp vụ / logic** (gắn § spec) và **chuỗi thao tác UI hoặc API** — cùng cấu trúc báo cáo E2E task 003 ([e2e-test-report.md](../task-003-crossword-advanced-spec/e2e-test-report.md)). Mọi bug đã sửa ghi [fix-bug.md](./fix-bug.md) và ánh xạ vào **§1.3** + bảng **§4** (rule: `quiz-delivery-and-docs.mdc` mục 10, `quiz-e2e-and-test-docs.mdc`).

**Cập nhật lần cuối:** 2026-04-17 — `npm run verify` pass; animation `mc-blink-green` / `mc-blink-green-amber`, thắng có `mc-play-again`, đồng bộ [fix-bug.md](./fix-bug.md) **BUG-004-04**.

---

## 1. Tiền đề & công cụ

| Hạng mục | Giá trị / ghi chú |
|----------|-------------------|
| **Runner** | Playwright (`@playwright/test`), `playwright.config.ts`. |
| **Chạy** | `npm run e2e` hoặc `npm run verify` (script có `build` trước `next start` trên port **3005**). |
| **Admin** | `loginAsAdmin` — `e2e/helpers/auth.ts` (`admin@example.com`). |
| **Session deterministic** | `GET .../multiple-choice-session?sessionSeed=playwright-session` chỉ khi quiz có `shareLink` prefix `e2e-`; `POST` dùng `sessionSeed` trả từ GET. |

### 1.1 Hai lớp trong tài liệu

| Lớp | Mục đích |
|-----|----------|
| **Nghiệp vụ / logic** | Gắn mã với [spec.md](./spec.md) — **§2** bên dưới. |
| **Thao tác UI / API** | Chuỗi bước cụ thể — **§1.2** (play) + **§1.2b** (admin). |

### 1.2 Chuỗi thao tác UI / API — play public (`/play/e2e-share-mc`)

| Mã | Route / API | Chuỗi thao tác & assert chính |
|----|-------------|------------------------------|
| **T004-play-01** | `GET /api/play/e2e-share-mc/multiple-choice-session?sessionSeed=playwright-session` | `APIRequestContext.get` → JSON **không** có key `answer` / `correctIndex` / `correctOption`; `questions[0]` không có `answer`; `questions.length === playLength` (1). |
| **T004-play-02** | `GET` + `POST` (brute `selectedIndex` 0…3) + `/play/e2e-share-mc` | Tìm index thắng qua API → `page.goto` → click `data-testid=mc-option-{i}` → **không** có banner copy chờ; trong ~12s thấy `mc-win` (**spec §3.3** thắng câu cuối) → click **`mc-play-again`** → `mc-question-text` hiện lại ([fix-bug BUG-004-04](./fix-bug.md)). |
| **T004-play-03** | idem + UI | Click **sai** `mc-option-{wrong}` → chờ ~5s im lặng (ô đã chọn **cam**) → xuất hiện **một** nút `[data-mc-correct-reveal="true"]` (đáp án đúng) + class **`mc-blink-green`** (**spec §3.2** + [fix-bug BUG-004-01](./fix-bug.md) / [BUG-004-04](./fix-bug.md)) → `mc-game-over` + `mc-play-again` → click → `mc-question-text` hiện lại (phiên mới). |

### 1.3 Hồi quy bug ([fix-bug.md](./fix-bug.md))

| Mã bug | Kỳ vọng (nghiệp vụ) | Test Playwright / assert |
|--------|---------------------|----------------------------|
| **BUG-004-01** | Sai vẫn thấy ô đúng xanh + nhấp nháy trước banner thua | **T004-play-03:** `data-mc-correct-reveal` + **`mc-blink-green`** trước `mc-game-over`. |
| **BUG-004-02** | Thêm câu MC không phải scroll lên đầu trang | Thủ công / UI — nút `mc-add-question-after-card` cuối mỗi card. |
| **BUG-004-03** | Không hiện copy 「Đáp án sẽ được công bố sau…」 | **T004-play-02/03:** không assert `mc-suspense` (đã gỡ). |
| **BUG-004-04** | Đúng: xanh/cam nhấp nháy; sai: xanh nhấp nháy mạnh; thắng: có **Chơi lại** + delay trước khi ẩn lưới | **T004-play-02:** `mc-win` → `mc-play-again` → câu hỏi. **T004-play-03:** class `mc-blink-green` trên ô đúng. |

### 1.2b Chuỗi thao tác UI — admin (`/quizzes/create`)

| Mã | Route | Chuỗi thao tác chính |
|----|--------|----------------------|
| **T004-admin-01** | `/quizzes/create` | `loginAsAdmin` → `#type` = multiple choice (mặc định) → `#title` = `E2E T004 MC create` → `#playLength` = 1 → điền **một** câu: nội dung + 4 ô A–D + chọn đáp án đúng (radio) → **Tạo Quiz** → URL `/quizzes` → `getByRole('heading', { name: '...' }).first()` visible (tránh strict mode khi trùng tiêu đề nhiều thẻ). |

---

## 2. E2E scenarios vs spec

Cột **Trạng thái:** **Pass** = đã có trong `e2e/task-004-*.spec.ts`.

### §1 Admin — ngân hàng & `playLength`

| Mã | Scenario (tóm tắt) | Trạng thái |
|----|-------------------|------------|
| **T004-§1** | ≥1 câu, 4 option, độ khó, `playLength` ≤ số câu; lưu DB | **Pass** — **T004-admin-01** (happy path tối thiểu) |

### §2 Bucket & session (logic server)

| Mã | Scenario | Trạng thái |
|----|----------|------------|
| **T004-§2** | `buildMultipleChoiceSession` deterministic theo `seedKey`; GET không lộ đáp án | **Pass** — **T004-play-01** + Vitest `multiple-choice-session.test.ts` |

### §3 Màn chơi — reveal, màu, game over / thắng

| Mã | Scenario | Trạng thái |
|----|----------|------------|
| **§3.2** | Chọn → khóa → ~5s → công bố đúng (xanh/cam nhấp nháy nếu đúng; xanh nhấp nháy ô đúng nếu sai) | **Pass** — **T004-play-02** / **T004-play-03** ([BUG-004-04](./fix-bug.md)) |
| **§3.3** | Sai → game over + Chơi lại reset phiên; thắng → **Chơi lại** | **Pass** — **T004-play-02** / **T004-play-03** |

---

## 3. Bảng tổng hợp file test

| File | Nội dung | Trạng thái |
|------|----------|------------|
| `e2e/task-004-mc-play.spec.ts` | **T004-play-01**–**03** (API + UI thắng/thua + reveal đúng) | Pass |
| `e2e/task-004-mc-admin.spec.ts` | **T004-admin-01** | Pass |

---

## 4. Bảng tổng hợp trạng thái (theo dõi)

| Mã | Trạng thái | Ghi chú |
|----|------------|---------|
| **T004-play-01** | Pass | Không lộ đáp án GET |
| **T004-play-02** | Pass | Thắng + `mc-win` + **Chơi lại** → phiên mới (**BUG-004-04**) |
| **T004-play-03** | Pass | Sai → `data-mc-correct-reveal` + **`mc-blink-green`** → `mc-game-over` → Chơi lại (**BUG-004-01**, **BUG-004-04**) |
| **T004-admin-01** | Pass | Tạo MC tối thiểu |
| **BUG-004-02** | Pass | UI admin — `fix-bug.md` |
| **BUG-004-03** | Pass | Gỡ `mc-suspense` — `fix-bug.md` |
| **BUG-004-04** | Pass | Nhấp nháy CSS + Chơi lại khi thắng — `fix-bug.md` |

---

## 5. Lộ trình mở rộng Playwright

| Đợt | Việc làm |
|-----|----------|
| **1** | `playLength > 1`: assert tiến câu sau khi đúng (round 2…) + thắng ở câu cuối. |
| **2** | Admin: sửa quiz MC có sẵn (`/quizzes/[id]/edit`) — assert field `playLength` + reorder. |
| **3** | Visual / a11y: assert nhãn `sr-only` hoặc `aria-live` sau chỉnh copy. |

---

## 6. Sau khi sửa code MC / bug

- **Bắt buộc:** thêm mục vào [fix-bug.md](./fix-bug.md) (rule `quiz-delivery-and-docs.mdc` mục 10).  
- Cập nhật `e2e/task-004-*.spec.ts`, bảng **§1.2 / §1.2b / §1.3**, **§2**, **§4** (rule: `quiz-e2e-and-test-docs.mdc`).  
- Cập nhật [spec.md](./spec.md) nếu đổi hành vi nghiệp vụ.
