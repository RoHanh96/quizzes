# Kế hoạch refactor — quizzes repo

Tài liệu này bám rule `.cursor/rules/quiz-code-structure.mdc` và `quiz-product-architecture.mdc`.

> **Vị trí:** `tasks/task-001-quiz-refactor/` — mỗi task một folder; cập nhật file này khi tiến độ refactor đổi.

---

## Mục tiêu

- **Quiz-centric**: một bài, một `type`, một `shareLink` cho user.
- **Một nơi** cho logic crossword / multiple choice (không hai cây `quizzes/` vs `games/` song song).
- **API** hướng về một mặt tiền `/api/quizzes` (+ public play theo `shareLink`).
- **Dễ thêm type**: validator + editor + player + registry.

---

## Phase 0 — Chuẩn bị (rủi ro thấp)

- [x] Ghi lại route hiện tại: admin (`/`, `/quizzes`, `/quizzes/create`, `/quizzes/[id]`, `/quizzes/[id]/edit`); play đăng nhập `/quizzes/[id]`; play public **`/play/[shareLink]`**.
- [x] URL play mục tiêu: **`/play/[shareLink]`** (không cần auth).
- [x] `QuizType` / union: **`src/modules/quiz/types.ts`** + re-export trong `src/types/index.ts`.

---

## Phase 1 — Khung `modules/quiz` (chưa xóa legacy)

- [x] Tạo `src/modules/quiz/` với `types.ts`, `validation/`, `server/queries.ts`, `components/editor|player`, `registry.ts`.
- [x] Logic đọc quiz theo id / shareLink trong `server/queries.ts` (thay `lib/quiz.ts` — file đã xóa).
- [x] Tách validation: `validation/quiz-create-body.ts`, `validation/crossword-questions.ts` dùng trong **`POST /api/quizzes`**.

---

## Phase 2 — Gộp UI trùng (crossword)

- [x] Một bộ **`CrosswordEditor`** + **`CrosswordPreview`** (`modules/quiz/components/editor/`).
- [x] Một bộ **`CrosswordPlayer`** (`modules/quiz/components/player/`) — gộp hành vi basic (từ dọc + đoán) + advanced (ảnh + secret word), `backHref` tùy chọn.
- [x] Xóa `components/games/*`, `components/quizzes/CrosswordForm.tsx`, `CrosswordGame.tsx`.

---

## Phase 3 — API quiz-centric

- [x] Xóa toàn bộ **`/api/games/**`**; client chỉ gọi **`/api/quizzes`** và **`/api/quizzes/[quizId]`**.
- [x] `POST` dùng `parseQuizCreateBody` + `nanoid` cho `shareLink`; crossword map `order` / `position` / `letterIndex`.
- [x] `PUT` (collection + `[quizId]`) chuẩn hóa câu hỏi crossword qua `normalizeCrosswordQuestions`.

---

## Phase 4 — Route `Game` & DB

- [x] Xóa model **`Game`**, cột **`gameId`** trên `Quiz` (migration `20260415022820_remove_game_model`).
- [x] Xóa **`app/(dashboard)/games/**`**, **`app/games/**`**.

---

## Phase 5 — Play công khai

- [x] Trang **`/play/[shareLink]`**: load quiz theo `shareLink`, render **`CrosswordPlayer`** cho `crossword_*`.
- [ ] Payload **`getForPlay`** tách riêng (ẩn đáp án MC) — **chưa làm**; hiện crossword vẫn gửi đáp án tới client (như trước refactor).

---

## Phase 6 — Dọn dẹp

- [x] Xóa `lib/db.ts` (trùng Prisma, không được import).
- [x] Xóa `lib/quiz.ts`.
- [x] Cập nhật **README.md** (chạy app, route, env).
- [ ] Alias `@/modules` riêng (hiện dùng `@/modules/quiz/...` đủ dùng).
- [ ] `registry.tsx` map động type → component (hiện chỉ helper + play path).

---

## Rủi ro & lưu ý

- **Dữ liệu local**: migration xóa bảng `Game`; backup `prisma/dev.db` trước khi migrate trên máy khác.
- Quiz **cũ** không có `shareLink`: cần tạo lại hoặc migration SQL bổ sung (chưa tự chạy trong repo).

---

## Trạng thái

| Phase | Trạng thái |
|-------|------------|
| 0     | Hoàn thành |
| 1     | Hoàn thành |
| 2     | Hoàn thành |
| 3     | Hoàn thành |
| 4     | Hoàn thành |
| 5     | Hoàn thành (còn nợ `getForPlay` / MC public) |
| 6     | Một phần (README xong; registry đầy đủ & alias tùy chọn sau) |

_Cập nhật lần cuối: sau đợt refactor merge vào `master` / nhánh hiện tại._
