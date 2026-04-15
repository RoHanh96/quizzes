# Task 003 — Kế hoạch triển khai Crossword advanced

> **Mục đích:** lệch code hiện tại so với [spec.md](./spec.md) đã chốt. **Đã triển khai** (2026-04-15) — bảng phase §10 dùng để đối chiếu.  
> **Tham chiếu code:** task 002 basic (`CrosswordPlayer`, API `/api/play/.../keyword`, `normalizeKeyword` / `answersMatch`, E2E + `global-setup`).  
> **Ngày lập:** 2026-04-15.

---

## 1. Gap giữa code hiện tại và spec

| Hạng mục | Hiện trạng (đọc repo) | Spec task 003 |
|----------|------------------------|---------------|
| Gợi ý ảnh | `clip-path` mở ảnh **theo chiều ngang** theo số câu đúng (`getRevealedWidth`) | Lưới **R×C**, **N** ô có nhãn **1…N** ngẫu nhiên; đúng câu **k** → mở **đúng một tile** tại ô gắn **k** |
| `letterIndex` | Editor advanced vẫn nhập tay; API normalize giữ `letterIndex` | **Không** dùng cho advanced; chỉ Q/A + `order` |
| Từ khóa `secretWord` | So khớp `toLowerCase().trim()`; form inline; **không** modal / `sessionStorage` / poll | Giống basic: `normalizeKeyword` + `answersMatch`, **modal + checkbox**, sai một lần → hết quyền phiên; **poll** spectator khi có `playShareLink` |
| API keyword | `POST/GET` chỉ `crossword_basic` + `verticalWord` | Mở rộng cho `crossword_advanced` + `secretWord` (cùng bảng `CrosswordPublicKeywordSolve` hoặc tách — xem §3) |
| Ảnh | Chỉ URL text | **Upload bắt buộc**; **≥ 500 KB**; crop tự động theo lưới (spec §2.2–2.4) |
| Dữ liệu cũ | Có bản ghi `crossword_advanced` trong dev | Spec cho phép **xóa** advanced cũ (chưa production) |

---

## 2. Nguyên tắc triển khai

1. **Tách nhánh logic:** advanced không “chồng” lên nhánh basic trong `CrosswordPlayer` — nên tách component con (ví dụ `CrosswordAdvancedBoard`, `CrosswordAdvancedKeyword`) hoặc file riêng để giảm rủi ro regression basic (task 002 / E2E hiện có).
2. **Một nguồn sự thật layout:** vị trí số **1…N** trên lưới phải **ổn định** sau khi lưu quiz (không shuffle lại mỗi lần load). Cần **lưu DB** (hoặc derive deterministic từ `quizId` + seed cố định lưu DB).
3. **E2E ổn định:** spec §8 — dùng **seed cố định** trong data quiz hoặc query debug chỉ dev/test; Playwright assert theo layout đã seed.
4. **Sau mỗi phase:** `npm run verify` (theo rule repo).

---

## 3. Hạng mục dữ liệu & Prisma

### 3.1 Xóa dữ liệu advanced cũ

- Migration hoặc script một lần: `deleteMany` `Quiz` với `type = 'crossword_advanced'` (và cascade `CrosswordQuestion`).
- Ghi trong changelog task / spec §6.

### 3.2 Trường mới (đề xuất — cần chốt khi code)

| Trường | Kiểu | Mục đích |
|--------|------|----------|
| `advancedLayoutSeed` | `Int` (hoặc `String` cuid) | Seed shuffle Fisher–Yates cho gán **N** nhãn vào **N** ô trong tổng `R*C` |
| `advancedCellLabels` | `String` (JSON) **tùy chọn** | Snapshot ô `flatIndex → label 1..N | null` để debug/E2E không phụ thuộc thuật toán version; nếu không lưu thì **bắt buộc** thuật toán từ seed là deterministic trên mọi môi trường |

**Quyết định khi implement:** nếu chỉ dùng seed + công thức cố định (N, R, C, thứ tự ô), có thể **không** thêm cột JSON — giảm migration; bắt buộc unit test “same seed → same layout”.

### 3.3 `letterIndex` cho advanced

- Khi normalize server: gán `letterIndex = 0` (hoặc giá trị dummy không dùng UI) cho mọi câu advanced; bỏ validate “letterIndex ≤ độ dài đáp án” cho advanced trong `crossword-questions.ts`.
- Hoặc migration set default 0 và bỏ hẳn input editor.

---

## 4. Thuật toán lưới (shared module)

Tạo `src/modules/quiz/lib/crossword-advanced-grid.ts` (tên gợi ý):

- `computeRC(N): { R, C }` với **R×C = N**: trong các ước số của N, chọn cặp **|R−C|** nhỏ nhất; hòa thì **R** nhỏ hơn (gần vuông, ưu ảnh ngang).
- `buildAdvancedCellLabels(N, seed)` (hoặc tương đương): **R×C = N** — shuffle toàn bộ **N** ô, gán nhãn **1…N** (mỗi ô một nhãn). Kiểu `label: null` chỉ còn nếu tương thích dữ liệu cũ.
- Export dùng cho: **server** (lúc tạo/sửa quiz), **client** (render — hoặc chỉ đọc snapshot từ API nếu lưu JSON).

**Sort câu hỏi:** thống nhất với `order` (đã dùng advanced trong `CrosswordPlayer`).

---

## 5. Validation & API tạo/sửa quiz

### 5.1 `normalizeCrosswordQuestions` + `parseQuizCreateBody`

- Nhánh `crossword_advanced`:
  - Không đọc `letterIndex` từ client; không ràng buộc độ dài `secretWord` vs N.
  - (Tuỳ chọn) validate `secretWord` không rỗng sau trim — đã có.
- File mới `validation/crossword-advanced.ts`: message lỗi thân thiện cho ảnh / số câu.

### 5.2 Ảnh ≥ 500 KB & upload

- **Editor:** `input type=file` + kiểm tra `file.size >= 500 * 1024`; helper text tỉ lệ 16:9.
- **Lưu ảnh:**  
  - **Hướng A (MVP nhanh):** API route upload (FormData) → lưu `public/uploads/...` hoặc tương đương → trả URL nội bộ; `imageUrl` lưu path/URL.  
  - **Hướng B:** crop client (canvas) rồi POST blob — giảm tải server; cần thống nhất định dạng output (WebP/JPEG).
- **Crop “tự động theo lưới”:**  
  - MVP: crop về **khung cố định** (ví dụ 16:9 center crop) trước khi chia `R×C` trên client hoặc server.  
  - Spec chi tiết pixel-perfect để **tinh chỉnh sau** (spec §1 out of scope UI).

### 5.3 `PUT`/`POST` quiz

- Khi tạo advanced: tính `R,C`, sinh seed (random an toàn hoặc từ nanoid số), gán layout, lưu cùng quiz.
- Đảm bảo `app/api/quizzes/*` truyền đủ field mới qua Prisma `create`/`update`.

---

## 6. `CrosswordPlayer` — advanced

### 6.1 Bố cục

- Vùng ảnh cố định (tương tự hiện `h-[400px]` có thể giữ hoặc responsive).
- **Lớp dưới:** ảnh đã crop, chia CSS grid `R×C` — mỗi ô là một “tile” (background-position hoặc `img` + `object-fit` + clip từng ô).
- **Lớp che:** toàn vùng che kín cho đến khi tile được reveal (opacity / overlay từng ô).
- **Số 1…N:** mỗi ô lưới một nhãn sau shuffle; ô che cho đến khi đúng câu tương ứng (hoặc `forceRevealAll` khi thắng từ khóa / đủ N câu). Nhánh `label == null` trong grid chỉ phục vụ dữ liệu lạ / tương thích.

### 6.2 Luồng đúng câu k

- Khi `answersMatch` đúng cho câu có `order === k`: chỉ mở ô có `label === k` (mapping từ layout đã lưu/sinh).
- Không dùng `revealedParts[index]` theo thứ tự mảng câu như code cũ.

### 6.3 Từ khóa — parity basic

- Tái sử dụng pattern: `showKeywordModal`, `keywordDraft`, `keywordRiskChecked`, `eliminated` + `sessionStorage`, `globalSolved` + poll `GET /api/play/.../keyword`, `wonByOwnKeyword`, `fillAllAnswered` khi thắng.
- Khác biệt: nguồn so khớp là `secretWord` + `answersMatch`; dải ô `?` hiển thị theo **chuỗi chuẩn hóa** (độ dài = `normalizeKeyword(secretWord).length`) thay vì `Array.from(quiz.secretWord)` raw.
- **Khóa hàng ngang** sau sai từ khóa: áp dụng tương tự basic (`hardLockedBasic` tương đương cho advanced).
- **Spectator:** khi `eliminated && !globalSolved` → poll; khi `globalSolved` → reveal toàn board + đáp án (giống basic).

### 6.4 Back / một nút

- Kiểm tra lại §3.4 spec basic — advanced không tạo thêm nút back trùng (giữ một nguồn từ page hoặc player).

---

## 7. API `/api/play/[shareLink]/keyword`

- `findFirst` quiz: cho phép `type === 'crossword_advanced'` và `secretWord` non-null.
- POST: `answersMatch(quiz.secretWord, guess)` thay cho `verticalWord`.
- GET poll: không đổi hợp đồng `{ solved }` — dùng chung `CrosswordPublicKeywordSolve` (một quiz một dòng `quizId` unique đã có).

**Lưu ý:** `select` hiện chỉ lấy `verticalWord` — mở rộng `secretWord` + nhánh type.

---

## 8. Editor & preview

- **Bỏ** block nhập `letterIndex` cho advanced (`CrosswordEditor.tsx`).
- Copy/gỡ text cũ về “mở từng phần ảnh theo thứ tự câu” — thay bằng mô tả lưới + R/C (read-only) sau khi có N câu (preview optional: grid overlay lên ảnh demo).
- `QuizForm.tsx` (nếu vẫn đường tạo advanced): đồng bộ upload + validation với editor module.

---

## 9. E2E & tài liệu task

1. **`e2e/constants.ts`:** thêm `E2E_SHARE_ADVANCED` (hoặc tên team quy ước).
2. **`e2e/global-setup.ts`:** seed một quiz advanced cố định: `imageUrl` trỏ file **≥ 500 KB** trong `e2e/fixtures/` (thêm ảnh fixture) hoặc generate tạm trong setup; `advancedLayoutSeed` cố định; 2–4 câu để R,C nhỏ dễ assert.
3. **Spec Playwright** (`e2e/task-003-advanced-play.spec.ts`, `e2e/task-003-keyword.spec.ts`):  
   - Lưới + ô covered; trả lời đúng câu 1 → một tile revealed; sai hàng ngang → nhập lại đúng.  
   - Modal từ khóa; đoán đúng có chuẩn hóa; sai từ khóa + spectator (hai context) — đã có bản đầu; mở rộng khi thêm hành vi mới.
4. **`tasks/task-003-crossword-advanced-spec/e2e-test-report.md`:** bảng tiêu chí ↔ file spec sau khi có test (theo `quiz-e2e-and-test-docs.mdc`).
5. Cập nhật [spec.md](./spec.md) mục checklist code / link plan này nếu cần.

---

## 10. Thứ tự phase đề xuất (để giảm merge conflict)

**Trạng thái (cập nhật tay khi làm):** dùng một trong các giá trị sau trong cột **Status** — có thể thêm ngày hoặc link PR trong **Ghi chú**.

| Giá trị | Ý nghĩa |
|---------|---------|
| `todo` | Chưa bắt đầu |
| `doing` | Đang triển khai |
| `done` | Hoàn thành (đã merge / đã verify cục bộ) |
| `blocked` | Tạm dừng — ghi lý do trong Ghi chú |

| Phase | Nội dung | Phụ thuộc | Status | Ghi chú |
|-------|----------|-----------|--------|---------|
| **P0** | Migration xóa advanced cũ + Prisma field seed (và optional JSON) | — | `done` | `20260415120000_task003_advanced_layout` |
| **P1** | Module `crossword-advanced-grid` + unit test deterministic | P0 | `done` | `vitest` + `npm run test:unit` trong verify |
| **P2** | `crossword-questions` + `quiz-create-body` + API quiz create/update | P1 | `done` | Sinh `advancedLayoutSeed` ở POST/PUT |
| **P3** | Upload + validate 500KB + crop MVP + editor (bỏ letterIndex, file input) | P2 | `done` | `/api/upload` + `CrosswordEditor` / `QuizForm` |
| **P4** | `CrosswordPlayer` advanced UI + tile reveal + keyword parity + poll | P1, API keyword | `done` | `CrosswordAdvancedImageGrid` + modal từ khóa |
| **P5** | Mở rộng `keyword` route cho advanced | P0 schema ổn định | `done` | `secretWord` + `answersMatch` |
| **P6** | E2E + `e2e-test-report.md` + chạy `npm run verify` | P3–P5 | `done` | Playwright `next start` port **3005** (xem `playwright.config.ts`) |

**Gợi ý song song:** P5 có thể làm song P3 nếu hai người; P4 nên sau P5 để test POST keyword trên advanced.

---

## 11. Rủi ro & hạng mục chốt khi bắt đầu code

1. **Next/Image + remote/local URL:** domain `images` trong `next.config.js` nếu upload local path.
2. **SQLite / file storage:** deploy production sau này — upload local chỉ dev; ghi note trong spec hoặc README nội bộ.
3. **Kích thước fixture E2E:** file ≥ 500 KB có thể làm repo nặng — cân nhắc generate file binary trong `global-setup` (write buffer) thay vì commit ảnh lớn.
4. **i18n / copy:** giữ nhất quán với basic (Tiếng Việt UI hiện có).

---

_Kế hoạch này chỉ định hướng; chi tiết PR nên chia nhỏ theo phase trên._
