# Task 004 — Kế hoạch triển khai Multiple choice (MCQ)

> **Mục đích:** triển khai [spec.md](./spec.md) v1 — model, admin, API public (không lộ đáp án trước reveal), màn chơi + E2E.  
> **Phạm vi:** plan + **code đã triển khai** (2026-04-17).  
> **Tham chiếu code:** `prisma/schema.prisma` (`Quiz`, `MultipleChoiceQuestion`), `parseQuizCreateBody`, `src/app/play/[shareLink]/page.tsx` (hiện MC chưa có player), E2E Playwright hiện có (`e2e/task-002-*.spec.ts`, …).  
> **Ngày lập:** 2026-04-17.

---

## 0. Nguyên tắc chung

1. **Cuối mỗi phase** (bắt buộc): chạy **`npm run e2e`** — toàn bộ suite Playwright **xanh** trước khi merge phase đó. Ghi rõ trong PR/commit phase. (Tuỳ chọn thêm: `npm run test:unit` nếu phase có Vitest.)
2. **Phiên bản E2E mới** đặt tên theo quy ước repo, ví dụ: `e2e/task-004-mc-admin.spec.ts`, `e2e/task-004-mc-play.spec.ts` — cập nhật [e2e-test-report.md](./e2e-test-report.md) (tạo khi phase có case mới) theo [.cursor/rules/quiz-e2e-and-test-docs.mdc](../../.cursor/rules/quiz-e2e-and-test-docs.mdc).
3. **Public không lộ đáp án đúng** trước khi user đã khóa lựa chọn và server trả “reveal” (đáp ứng backlog `getForPlay` / task 001): payload JSON cho client **không** chứa index/slot đúng; shuffle **có thể làm trên server** rồi trả mảng `options[]` đã xáo (client không cần biết đáp án để render ô).

---

## Phase 1 — Schema & migration

| | Nội dung |
|---|----------|
| **Input** | [spec.md](./spec.md) §1 (ngân hàng, `playLength`, 4 option, slot đúng, độ khó); `schema.prisma` hiện tại (`MultipleChoiceQuestion`: `question`, `options` JSON, `answer` Int). |
| **Output** | Migration Prisma đã apply: ví dụ **`Quiz.playLength`** (`Int`, nullable — bắt buộc có giá trị hợp lệ khi `type === 'multiple_choice'`), **`MultipleChoiceQuestion.difficulty`** (`String` hoặc enum Prisma: `easy` \| `medium` \| `hard` \| `extreme` — map UI tiếng Việt ở tầng app), tuỳ chọn **`order`** (`Int`) cho thứ tự hiển thị trong admin (không quyết định thứ tự chơi public). Seed/migration dữ liệu dev (nếu có) không phá E2E cũ. `prisma generate` OK. |
| **E2E** | `npm run e2e` — **không** thêm case mới; regression toàn repo. |

**Ghi chú kỹ thuật:** `answer` Int **0–3** = slot A–D đúng trong mảng `options` **trước** shuffle; logic shuffle chỉ áp dụng cho payload public và map ngược khi chấm.

---

## Phase 2 — Domain logic thuần (bucket + pick câu)

| | Nội dung |
|---|----------|
| **Input** | Spec §2 (`L`, tỉ lệ 4:4:4:1, Hamilton, `L ≥ 13` / `L < 13`), §2.3 (ưu tiên không trùng `questionId`, cho phép trùng khi buộc). |
| **Output** | Module ví dụ `src/modules/quiz/lib/multiple-choice-session.ts` (tên file có thể chốt lúc code) export: `computeBucketCounts(L)`, `bucketForPosition(i, counts)`, `pickQuestionsForSession(bank, L, rng)` (hoặc tách nhỏ). **Vitest** (tuỳ chọn nhưng khuyến nghị): bảng kỳ vọng `L = 1…12`, `L = 13`, `L = 20`; case pool 1 câu/bucket → có trùng. |
| **E2E** | `npm run e2e` — regression; phase này **chưa** bắt buộc file E2E mới nếu chưa đụng UI (chỉ lib + unit). |

---

## Phase 3 — Admin: validate + API + form MC

| | Nội dung |
|---|----------|
| **Input** | Schema phase 1; `parseQuizCreateBody` / handler `POST`/`PUT` quiz; `QuizForm.tsx`; pattern crossword validation. |
| **Output** | Nhánh `multiple_choice` trong parse/normalize: **đúng 4** option text; **`playLength`** nguyên dương, **`playLength` ≤ số câu**; mỗi câu có **`difficulty`** hợp lệ; **`answer` ∈ [0,3]**; lưu DB đúng. Form admin: thêm/sửa câu (prompt, 4 ô A–D, chọn đúng một, chọn độ khó), field **`playLength`**. API create/update quiz type MC không 500. |
| **E2E** | `npm run e2e` — trong đó **file mới** `e2e/task-004-mc-admin.spec.ts`: luồng tối thiểu (đăng nhập admin nếu playbook yêu cầu → tạo quiz MC với N câu + `playLength` → submit thành công / hoặc assert DB qua UI list). |

---

## Phase 4 — API public: session chơi + không lộ đáp án

| | Nội dung |
|---|----------|
| **Input** | Module phase 2; quiz `shareLink`; rule ẩn đáp án (§0 plan). |
| **Output** | Route handler ví dụ **`GET /api/play/[shareLink]/multiple-choice-session`** (tên cuối có thể rút gọn): load quiz + bank MC; sinh **thứ tự câu trong phiên** + pick theo bucket; với **mỗi câu** trả `{ questionText, options: string[] }` với **`options` đã shuffle** (server dùng RNG seeded hoặc `crypto.randomUUID` + Fisher–Yates — chốt khi code; E2E có thể **mock** hoặc dùng **seed cố định** chỉ `NODE_ENV=test` nếu cần). **Không** trả `answer` / `correctIndex`. **POST** (hoặc Server Action) ví dụ **`POST .../multiple-choice-answer`**: body `{ roundIndex, selectedIndex }` → response `{ correctDisplayIndex, isCorrect, gameOver, won }` để client làm reveal sau 5s (client có thể gọi POST ngay khi chọn rồi **trì hoãn hiển thị** kết quả tới hết timer — tránh hiển thị sớm; hoặc POST sau 5s — **chốt UX khi code**, miễn không gửi đáp án đúng trong GET ban đầu). |
| **E2E** | `npm run e2e` — thêm case trong `task-004-mc-play.spec.ts` (có thể bắt đầu file ở phase này): **`request.get`** session → assert JSON **không** có field kiểu `answer` / `correct` / `correctIndex`; assert length `questions === playLength` (hoặc tương đương). Có thể dùng quiz seed từ phase 3 hoặc `global-setup`. |

---

## Phase 5 — UI màn chơi `/play/[shareLink]`

| | Nội dung |
|---|----------|
| **Input** | API phase 4; [spec.md](./spec.md) §3 (shuffle đã ở payload, khóa sau chọn, cam / xanh nhạt / blink, ~5s có thể im lặng không bắt buộc copy chờ, game over + Chơi lại, thắng câu cuối). |
| **Output** | `quizTypeSupports*` / registry mở rộng; `page.tsx` render **`MultipleChoicePlayer`** (hoặc tên tương đương) khi `type === 'multiple_choice'`; component: fetch session → hiển thị từng câu → chọn → khóa → chờ ~5s (có thể không hiện chữ) → apply style reveal; sai → overlay **「Bạn đã thua」** + **「Chơi lại」** (fetch session mới); đúng hết → **「Bạn là người chiến thắng」**; a11y: không chỉ màu. |
| **E2E** | `npm run e2e` — mở rộng `e2e/task-004-mc-play.spec.ts`: **sai** ở câu 1 → thấy thua + Chơi lại → session mới (có thể assert đổi prompt nếu seed khác hoặc assert số câu reset về 1); **thắng** stub ngắn (`playLength = 1` + một câu dễ, luôn chọn đúng qua UI hoặc intercept) → thông báo chiến thắng. Dùng `data-testid` ổn định theo rule E2E repo. |

---

## Phase 6 — Đồng bộ tài liệu & verify tổng

| | Nội dung |
|---|----------|
| **Input** | Code đã xong phase 1–5. |
| **Output** | Cập nhật `.cursor/rules/quiz-product-architecture.mdc` và `quiz-data-and-api.mdc` (MCQ: bank + `playLength`, không còn mô tả “15 câu cố định” nếu đã lỗi thời). [e2e-test-report.md](./e2e-test-report.md): mã case + kỳ vọng + chuỗi thao tác UI. [../STATUS.md](../STATUS.md): task 004 → **Gần xong** / **Hoàn thành** tùy nợ. |
| **E2E** | `npm run verify` (hoặc tối thiểu `npm run e2e` + `npm run lint` + `npm run build` theo thói quen repo). |

---

## Rủi ro & phụ thuộc

| Rủi ro | Giảm thiểu |
|--------|-------------|
| RNG không deterministic làm E2E flake | Seed từ env test / query chỉ test / `page.route` mock API. |
| Leak đáp án qua RSC props | Không truyền `correct` vào client component; chỉ truyền sau POST hoặc dùng action trả từng bước. |
| Phase 4–5 tách GET/POST phức tạp | Có thể gộp MVP: Phase 4 ship GET + POST tối thiểu; Phase 5 chỉ UI. |

---

## 7. Trạng thái làm theo phase (theo dõi khi code)

**Quy ước cột *Trạng thái*:** `Chưa làm` → `Đang làm` → `Xong`.  
**Khi xong một phase:** đổi trạng thái, ghi **ngày** (hoặc hash commit / PR), và xác nhận đã chạy **`npm run e2e`** (hoặc `npm run verify` nếu phase 6).

| Phase | Trạng thái | Ngày / tham chiếu | `npm run e2e` (hoặc verify) |
|-------|------------|-------------------|------------------------------|
| 1 — Schema & migration | **Xong** | 2026-04-17 | `npm run verify` (pass) |
| 2 — Domain logic thuần | **Xong** | 2026-04-17 | `npm run verify` (pass) |
| 3 — Admin validate + form + API | **Xong** | 2026-04-17 | `npm run verify` (pass) |
| 4 — API public session + ẩn đáp án | **Xong** | 2026-04-17 | `npm run verify` (pass) |
| 5 — UI màn chơi | **Xong** | 2026-04-17 | `npm run verify` (pass) |
| 6 — Docs + verify tổng | **Xong** | 2026-04-17 | `npm run verify` (pass) |

**Ghi chú nhanh (tuỳ chọn, cập nhật khi làm):**

- Bucket trống: `pickQuestionForBucket` fallback toàn ngân hàng (không validate đủ pool theo spec).
- E2E MC: `shareLink` prefix `e2e-` + query `sessionSeed=playwright-session` (và client `MultipleChoicePlayer` gửi cùng seed) để phiên deterministic; seed quiz `e2e-share-mc` trong `global-setup.ts`.

---

_Cập nhật: 2026-04-17 — triển khai code + cập nhật §7; rule `quiz-delivery-and-docs.mdc` bổ sung hướng dẫn cập nhật §7 khi làm theo phase._
