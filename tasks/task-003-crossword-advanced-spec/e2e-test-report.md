# Task 003 — E2E test report (crossword advanced)

> **Phạm vi:** chỉ **task 003** — crossword advanced (một ảnh, lưới mảnh, số 1…N, mở tile theo câu đúng, parity từ khóa với basic, admin tạo quiz).  
> **Tham chiếu:** [spec.md](./spec.md) · Bug log: [fix-bug.md](./fix-bug.md) · Code E2E: `e2e/task-003-*.spec.ts` · Seed: `e2e/constants.ts` + `e2e/global-setup.ts` (`advancedLayoutSeed: 123456789`, ảnh stub ≥ 500 KB).  
> **Share link:** `e2e-share-advanced`, `e2e-share-advanced-keyword`, `e2e-share-advanced-wrong`, `e2e-share-advanced-spectator`.

**Quy ước:** mọi mục trong [fix-bug.md](./fix-bug.md) có hành vi UI phải có hàng tương ứng trong báo cáo này (§1.2 / §1.3 / §4) **và** test Playwright — xem `.cursor/rules/quiz-e2e-and-test-docs.mdc`.

**Cập nhật lần cuối:** 2026-04-15 — `npx playwright test e2e/task-003-*.spec.ts` → **10 passed** (3 file: play, keyword, admin form).

---

## 1. Tiền đề & công cụ

| Hạng mục | Giá trị / ghi chú |
|----------|-------------------|
| **Runner** | Playwright (`@playwright/test`), `playwright.config.ts`. |
| **Chạy** | `npm run e2e` hoặc `npm run verify`. |
| **Cổng** | E2E dùng `next start` trên port **3005**. |
| **Deterministic grid** | `advancedLayoutSeed: 123456789`; **R×C = N** (vd seed **N = 3** → lưới **1×3**). |
| **Admin** | `loginAsAdmin` — `e2e/helpers/auth.ts` (`admin@example.com`). |

### 1.1 Hai lớp trong tài liệu

| Lớp | Mục đích |
|-----|----------|
| **Nghiệp vụ / kỳ vọng** | Gắn mã với spec — **§2** bên dưới. |
| **Thao tác UI** | Chuỗi bước — **§1.2** (play) + **§1.2b** (admin). |

### 1.2 Chuỗi thao tác UI — play public (`/play/...`)

| Mã | `shareLink` | Chuỗi thao tác chính |
|----|-------------|----------------------|
| **E3-01** | `e2e-share-advanced` | Mở link → heading **E2E Crossword Advanced** → `advanced-image-grid` → `advanced-cell-1` `data-state=covered` → assert ô 1 & 2 không có `[style*='background-image']` (**E3-FIX-01** / [fix-bug](./fix-bug.md)). |
| **E3-02** | idem | `crossword-question-1` → **Đáp án câu 1** `ONE` → **Trả lời** → cell 1 `revealed`, cell 2 `covered` → ô 1 đúng 1 `background-image`, ô 2 vẫn 0 (**E3-FIX-02**). |
| **E3-§3.3** | idem | **Câu 1** → nhập sai → thông báo đỏ → sửa `ONE` → **Trả lời** → form đóng + cell 1 `revealed`. |
| **E3-04** | idem | Trước trả lời: **không** có `advanced-pad-*` (lưới **1×3**, **R×C = N**). Sau **ONE** / **TWO** / **THREE**: đúng **3** `background-image` (**E3-FIX-03** / [fix-bug](./fix-bug.md)). |
| **E3-03** | idem | `keyword-strip-advanced` → **Trả lời từ khóa** → dialog + checkbox + placeholder từ khóa. |
| **E3-§4.1** | `e2e-share-advanced-keyword` | Modal từ khóa → checkbox → nhập `  a b c  ` → **Gửi đoán** → strip chứa `ABC` + thông báo thắng + “đã giải”. |
| **E3-§4.2** | `e2e-share-advanced-wrong` | (Xóa `sessionStorage` key eliminated.) → modal → `XX` → **Gửi đoán** → khóa + không còn nút từ khóa → **Câu 1:** không mở ô nhập. |
| **E3-§4.3** | `e2e-share-advanced-spectator` | Hai context: A sai `ZZ`; B đúng `ABC`; A chờ poll → “Từ khóa đã được giải” + strip có `ABC`. |

### 1.2b Chuỗi thao tác UI — admin (`/quizzes/create`)

| Mã | Route | Chuỗi thao tác chính |
|----|--------|----------------------|
| **E3-§2.1** | `/quizzes/create` | Login admin → **Tạo Quiz** flow → `#type` = **Crossword … Advanced** → `#title`, `#secretWord`, câu 1 đủ Q/A → **không** URL ảnh, **không** file → **Tạo Quiz** → `.bg-red-50` chứa `Crossword advanced cần URL hình ảnh` → vẫn `/quizzes/create`. |
| **E3-§2.2** | idem | Giống trên → `input[type=file][accept="image/*"]` gắn file JPEG **1024 B** → **Tạo Quiz** → `.bg-red-50` chứa `Ảnh gợi ý phải từ 500 KB trở lên` → vẫn `/quizzes/create`. |

### 1.3 Hồi quy bug ([fix-bug.md](./fix-bug.md))

| Mã | Nguồn bug | Kỳ vọng (nghiệp vụ) | Test Playwright / assert |
|----|-----------|----------------------|---------------------------|
| **E3-FIX-01** | [fix-bug.md](./fix-bug.md) (2026-04-15) | §3.1 [spec.md](./spec.md): trước câu đúng, **không lộ pixel** ảnh gợi ý (public + admin play). | **E3-01:** `data-state=covered` + ô 1 & 2 không có descendant `[style*='background-image']`. |
| **E3-FIX-02** | idem | Đúng câu 1 → chỉ một tile ảnh; ô khác vẫn che. | **E3-02:** ô 1 đúng 1 `background-image`, ô 2 `covered` và 0 ảnh. |
| **E3-FIX-03** | [fix-bug.md](./fix-bug.md) (phủ kín ảnh / lưới) | **R×C = N** + sau đúng **cả N** câu (hoặc thắng từ khóa): đủ **N** tile ảnh, không ô đệm trong layout chuẩn. | **E3-04:** 0 pad, **3×** `background-image` (seed **N = 3**, **1×3**). |

---

## 2. E2E scenarios vs spec

Cột **Trạng thái:** **Pass** = đã có trong `e2e/task-003-*.spec.ts` · **Chưa có** = chưa viết Playwright.

### §2 Ảnh & lưới (admin + validation)

| Mã | Scenario (tóm tắt) | Trạng thái |
|----|------------------|------------|
| **E3-§2.1** | Upload/URL một ảnh bắt buộc khi tạo advanced | **Pass** — `task-003-admin-form.spec.ts` |
| **E3-§2.2** | Reject ảnh dưới 500 KB (message rõ) | **Pass** — idem (client `advancedImageTooSmallMessage`) |
| **E3-§2.3–2.4** | Lưới **R×C = N**, tile che kín + đủ N tile sau đủ câu / từ khóa | **Pass** — **E3-01** / **E3-FIX-01** + **E3-04** / **E3-FIX-03** |

### §3 Hiển thị & random

| Mã | Scenario | Trạng thái |
|----|----------|------------|
| **E3-§3.1** | N ô số 1…N; **che kín pixel** trước câu đúng | **Một phần** — **E3-01** / **E3-FIX-01** |
| **E3-§3.2** | Đúng câu k → chỉ tile k mở; sau đủ N → đủ **N** tile (§2.4) | **Pass** — **E3-02** + **E3-FIX-02**; **E3-04** |
| **E3-§3.3** | Sai đáp án — nhập lại không giới hạn | **Pass** |

### §4 Từ khóa & public play

| Mã | Scenario | Trạng thái |
|----|----------|------------|
| **E3-§4.0** | Dải + modal | **Pass** — **E3-03** |
| **E3-§4.1** | Chuẩn hóa + POST đúng | **Pass** |
| **E3-§4.2** | Sai từ khóa → khóa | **Pass** |
| **E3-§4.3** | Spectator / poll | **Pass** |

### §5 Admin — tạo / sửa

| Mã | Scenario | Trạng thái |
|----|----------|------------|
| **E3-§5** | Form advanced (đủ luồng tạo thành công + sửa) | **Một phần** — đã có **§2.1–2.2**; chưa E2E happy path tạo bài với ảnh ≥ 500 KB + assert `/quizzes` |

---

## 3. Bảng tổng hợp file test

| File | Nội dung | Trạng thái |
|------|----------|------------|
| `e2e/task-003-advanced-play.spec.ts` | **E3-01** (+ **E3-FIX-01**), **E3-02** (+ **E3-FIX-02**), **E3-§3.3**, **E3-04** (+ **E3-FIX-03**) | Pass |
| `e2e/task-003-keyword.spec.ts` | **E3-03**, **E3-§4.1**–**§4.3** | Pass |
| `e2e/task-003-admin-form.spec.ts` | **E3-§2.1**, **E3-§2.2** | Pass |

---

## 4. Bảng tổng hợp trạng thái (theo dõi)

Cập nhật cột **Trạng thái** + **Ghi chú** (ngày / commit) mỗi khi merge test mới hoặc đổi spec.

| Mã | Trạng thái | Ghi chú |
|----|------------|---------|
| **E3-§2.1** | Pass | `task-003-admin-form.spec.ts` |
| **E3-§2.2** | Pass | idem |
| **E3-01** | Pass | `task-003-advanced-play.spec.ts` — **E3-FIX-01** |
| **E3-02** | Pass | idem — **E3-FIX-02** |
| **E3-04** | Pass | idem — **E3-FIX-03** (lưới 1×3, 3 tile) |
| **E3-FIX-01** | Pass | [fix-bug](./fix-bug.md) 2026-04-15 — §3.1 che pixel |
| **E3-FIX-02** | Pass | idem |
| **E3-FIX-03** | Pass | [fix-bug](./fix-bug.md) — **R×C = N** + phủ kín ảnh |
| **E3-§3.3** | Pass | `task-003-advanced-play.spec.ts` |
| **E3-03** | Pass | `task-003-keyword.spec.ts` |
| **E3-§4.0** | Pass | qua **E3-03** |
| **E3-§4.1** | Pass | `task-003-keyword.spec.ts` |
| **E3-§4.2** | Pass | idem |
| **E3-§4.3** | Pass | idem |
| **E3-§2.3–2.4** | Pass | **E3-01** + **E3-04** (0 ô đệm, 3 tile sau 3 câu) |
| **E3-§3.1** | Một phần | ô 1–2; chưa đếm đủ N ô |
| **E3-§3.2** | Pass | **E3-02** |
| **E3-§5** | Một phần | xem §5 bảng trên |

---

## 5. Lộ trình mở rộng Playwright

| Đợt | Việc làm |
|-----|----------|
| **1** | Happy path: tạo advanced với file ≥ 500 KB (fixture) → assert chuyển `/quizzes` + có thể mở `/play/...`. |
| **2** | Mở rộng assert **R×C = N** cho N khác (5, 6, 7…) nếu cần. |
| **3** | Global solved SSR-only — seed `CrosswordPublicKeywordSolve` trước `goto`. |

---

## 6. Sau khi thêm / sửa code advanced

- Cập nhật **`e2e/task-003-*.spec.ts`**, bảng **§2**, **§1.2b**, và **§4** (rule: `quiz-e2e-and-test-docs.mdc`).  
- **Bug:** ghi [fix-bug.md](./fix-bug.md) và **đồng bộ** mã kịch bản + assert vào báo cáo này (§1.3 / §1.2) để auto test không lệch tài liệu.  
- Seed mới: `constants.ts` + `global-setup.ts` + **§1.2**.
