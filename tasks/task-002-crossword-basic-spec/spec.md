# Crossword basic — spec thống nhất & kế hoạch xử lý

> Trạng thái: **spec + code §3.2–§3.4, §3.3.6 (2026-04)** — màn chơi basic đã có dải ô từ khóa, đoán từ khóa + modal, khóa/spectator + API poll; **e2e Playwright tối thiểu** (`npm run e2e`, gồm trong `npm run verify`); checklist tay A4–A6 vẫn mở.

**Bug / fix (task 002):** ghi tập trung trong **[fix-bug.md](./fix-bug.md)** (không rải rác nhiều file).

---

## 1. Chuẩn hóa văn bản

| Quy tắc | Chi tiết |
|----------|----------|
| Từ khóa | **Không bắt buộc dấu**; chuẩn hóa: bỏ dấu (NFD + bỏ ký tự kết hợp), **bỏ mọi khoảng trắng**, so khớp **không phân biệt hoa thường** (thống nhất in hoa khi so). |
| Đếm `N` | `N` = độ dài chuỗi từ khóa **sau** chuẩn hóa (ví dụ `"Viet nam"` → 7 ký tự). |
| Đáp án (admin / chơi) | Cùng quy tắc bỏ dấu + bỏ space khi **validate** và khi **so đúng/sai** cả câu. |
| Ô hàng ngang + gợi ý độ dài | Số ô và gợi ý **“N chữ”** = chỉ ký tự **không** tính khoảng trắng trong chuỗi đáp án lưu DB — đồng bộ với cách so khớp (space không tạo thêm ô). |
| Ngôn ngữ | Phù hợp **tiếng Anh** và text không dấu. |

---

## 2. Quy tắc admin (tạo / sửa bài)

1. **Số câu hỏi** = `N` (bắt buộc đúng `N`, không ít hơn / nhiều hơn).
2. **Thứ tự câu**: câu 1 → ký tự thứ 1 của từ khóa (đã chuẩn hóa), câu 2 → ký tự thứ 2, …, câu `N` → ký tự thứ `N`.
3. **Đáp án câu `i`**: phải **chứa** ký tự tương ứng (sau khi chuẩn hóa từng ký tự khi tìm trong đáp án). **Bỏ qua khoảng trắng** trong đáp án khi tìm ký tự đó.
4. **Ký tự lặp trong từ khóa** (ví dụ `BANANA`): mỗi vị trí `i` vẫn là một ràng buộc riêng — coi như **hai slot khác nhau** (câu tương ứng phải thỏa từng slot).
5. **`letterIndex`**: **hệ thống tự gán** — ví dụ lấy **lần xuất hiện đầu tiên** trong đáp án (sau khi duyệt theo quy tắc trên); không bắt admin nhập tay (có thể ẩn field trên form).

---

## 3. Quy tắc màn chơi (user)

### 3.1 Hàng ngang (từng câu)

1. Mỗi câu: hiển thị **một hàng ô** — số ô = **số ký tự không phải khoảng trắng** trong chuỗi đáp án lưu DB (khoảng trắng **không** tạo ô riêng). Hiển thị chữ trong ô có thể in hoa.
2. Ban đầu: ô **trống / trong suốt** (chưa lộ chữ).
3. **Click** câu → hiện **nội dung câu hỏi**, bên cạnh (cùng khối) hiển thị gợi ý **(N chữ)** với `N` = cùng định nghĩa mục 1 (không tính space), **và** ô nhập đáp án.
4. **Đúng** → điền **toàn bộ** ký tự đáp án vào các ô (**chỉ** các ký tự không space; thứ tự giữ nguyên như trong chuỗi gốc sau khi bỏ space).
5. **Cột dọc từ khóa** (trong các hàng ngang): các ô chứa ký tự “thuộc từ khóa” (theo `letterIndex` đã gán — vị trí trên chuỗi đáp án gốc, không trỏ vào space) phải **thẳng một cột** trên màn hình — dùng **margin / prefix** trên lưới ô **chỉ gồm ký tự không space**; căn lề để cột thẳng hàng.

### 3.2 Dải từ khóa **trên đầu** màn hình

1. Hiển thị **đúng `N` ô** (`N` = độ dài từ khóa **đã chuẩn hóa**, cùng định nghĩa mục §1) — ô **trống / trong suốt** (gợi **số ký tự** cần đoán, không lộ chữ).
2. **Không** đồng bộ / lộ chữ từ khóa lên dải này khi user đã trả lời đúng một phần hàng ngang — vì các ký tự từ khóa đã nằm trong đáp án từng câu; dải trên chỉ phục vụ **độ dài + luồng đoán từ khóa**, tránh spoil trùng.
3. **Sau khi từ khóa được giải đúng** (user đoán đúng trong phiên, hoặc đồng bộ server §3.3.6 / `keywordGloballySolved`): trên **cùng dải `N` ô**, hiển thị **đầy đủ từng ký tự** của từ khóa **theo chuỗi đã chuẩn hóa** (cùng quy tắc so khớp §1) — ô có chữ rõ ràng (không còn “ô trống gợi ý”). Có thể kèm một dòng phụ ghi **chuỗi gốc** `verticalWord` từ DB (nếu khác về hiển thị so với chuỗi chuẩn hóa, ví dụ còn dấu / khoảng trắng) để admin/người chơi đối chiếu.

### 3.3 Đoán từ khóa (bất cứ lúc nào — **không** bắt buộc làm hết hàng ngang trước)

1. Luôn có hành động kiểu **「Trả lời từ khóa」** (hoặc copy tương đương) để user gửi một đáp án cho **cả từ khóa** (chuỗi đầy đủ), **không** yêu cầu đã trả lời hết các hàng ngang.
2. **Trước khi gửi** lần đoán từ khóa: bắt buộc **màn hình / modal xác nhận** (user chủ động xác nhận mới gửi).
3. **So khớp từ khóa**: cùng quy tắc chuẩn hóa như đáp án ngang — dùng một nguồn sự thật kỹ thuật (ví dụ `answersMatch` với chuỗi từ khóa lưu DB / `verticalWord`).
4. **Đoán đúng từ khóa** (trước hay sau khi làm hết hàng ngang đều được):
   - Coi là **thắng** (kết thúc có lợi cho user).
   - **Tự điền** toàn bộ các hàng ngang còn lại (đáp án đầy đủ hiện trong ô).
   - User **xem đủ nội dung** bài sau thắng (layout / chữ / trạng thái hoàn chỉnh theo thiết kế UI).
   - Dải từ khóa **lộ đầy đủ chữ** theo §3.2 mục 3 (chuỗi chuẩn hóa; gốc DB nếu cần).
5. **Đoán sai từ khóa** (sau khi đã xác nhận và gửi):
   - User chuyển sang trạng thái **hết quyền chơi**: **không** được đoán từ khóa lại, **không** được mở / trả lời thêm bất kỳ hàng ngang nào (khóa toàn bộ tương tác chơi).
   - Trạng thái hết quyền **giữ cho đến khi bắt đầu phiên chơi mới** (định nghĩa MVP: **tải lại trang (F5)**, mở lại link trong tab/session trình duyệt mới, hoặc sau này nếu có nút **「Chơi lại / phiên mới」** — *hiện tại product chọn **tạm bỏ** nút phiên mới, giả định hai người chơi hai máy khác nhau*).
   - **Phạm vi MVP (public ẩn danh, chỉ client):** “vĩnh viễn” = trong **một phiên trình duyệt** (state + tuỳ chọn `localStorage`); **không** biết máy khác đã thắng hay chưa nếu chưa có backend.

### 3.3.6 Chế độ spectator (A sai từ khóa, B thắng trên máy khác — product chốt)

1. Nếu **người A** đã **sai** từ khóa (đang **hết quyền thao tác**) và **người B** trên **máy khác** **đoán đúng** từ khóa: phía **A** chuyển sang **chế độ chỉ xem (spectator)** — **hiển thị đầy đủ** từ khóa và **toàn bộ đáp án các hàng ngang** (reveal / fill ô giống trạng thái “đã giải xong”), nhưng **vẫn không** được thao tác chơi (không click mở câu, không nhập, không gửi đoán từ khóa; các control ở trạng thái disabled hoặc ẩn).
2. Người **B** (đoán đúng) giữ đúng luật **thắng** tại §3.3 mục 4 (thắng + tương tác / UI thắng theo thiết kế).
3. **Kỹ thuật:** để máy A biết B đã thắng **bắt buộc** có **đồng bộ server** theo `shareLink` (hoặc tương đương): ví dụ trạng thái room `keywordSolvedGlobally`, client A poll / SSE / WebSocket nhận cập nhật rồi chuyển A sang spectator reveal. **Không thể** đạt bằng chỉ state cục bộ trên máy A.

### 3.4 Điều hướng (back) — màn public / admin

- Tránh **hai nút / hai link “Quay lại”** trên cùng một màn (ví dụ layout bọc ngoài + `CrosswordPlayer` cùng render `backHref`). Spec UI: **một nguồn** điều hướng lùi (page hoặc player; tuỳ route `/play/...` vs `/quizzes/...`).

---

## 4. Phạm vi kỹ thuật (khi triển khai)

| Khu vực | Việc làm |
|---------|----------|
| `modules/quiz/lib/text.ts` | (Đã có / bổ sung) `stripDiacritics`, `normalizeKeyword`, `answersMatch`. |
| `modules/quiz/validation/crossword-basic.ts` | `assignLetterIndexesForBasic`, `validateBasicDraftMessage`, `alignmentColumnZeroBased`. |
| `validation/crossword-questions.ts` + `quiz-create-body.ts` | Gọi gán `letterIndex` cho basic khi có `verticalWord`; validate đúng `N` câu. |
| `app/api/quizzes/*` | Đảm bảo `POST`/`PUT` dùng chung pipeline chuẩn hóa + gán index. |
| `CrosswordEditor` | Bỏ nhập `letterIndex` tay (basic); hint số câu = `N`; validate draft = spec. |
| `CrosswordPreview` | Preview căn cột + ký tự đúng slot. |
| `CrosswordPlayer` | Layout căn cột; `answersMatch` cho hàng ngang; **§3.2** dải `N` ô trên cùng; **§3.3** đoán từ khóa + thắng / hết quyền; **§3.3.6** spectator; **§3.4** một nút back. |
| API / realtime (khi làm §3.3.6) | Trạng thái “từ khóa đã được ai đó giải đúng” theo `shareLink` + client nhận cập nhật (poll tối thiểu, hoặc SSE/WS). |
| `QuizForm` (basic) | Gửi đủ `position`/`order`; để API/editor lo `letterIndex` hoặc validate client tương đương. |
| Rule / README | Cập nhật ngắn trong `quiz-product-architecture.mdc` hoặc README nếu cần. |

---

## 5. Checklist triển khai (đánh dấu khi làm)

- [x] Hoàn thiện module `text` + `crossword-basic` validation (một nguồn sự thật).
- [x] Nối `normalizeCrosswordQuestions` / `parseQuizCreateBody` với `verticalWord` cho basic.
- [x] API `PUT` collection + `[quizId]` đồng bộ.
- [x] `CrosswordEditor` + `CrosswordPreview`.
- [x] `CrosswordPlayer` layout + `answersMatch`.
- [x] `QuizForm` path basic (nếu vẫn dùng).
- [ ] Kiểm thử tay: từ khóa EN, từ khóa có/không space, ký tự lặp, đáp án có space.
- [x] **§3.2** Dải `N` ô trên đầu (trong suốt), không mirror chữ từ hàng ngang đã đúng.
- [x] **§3.3** Nút đoán từ khóa bất cứ lúc nào + **modal xác nhận**; đúng → thắng + auto-fill + xem đủ; sai → hết quyền đến phiên mới (F5 / spec §3.3.5).
- [x] **§3.4** Không còn hai nút back trên cùng màn (play admin / public tuỳ route).
- [x] **§3.3.6** API + poll: user đã sai từ khóa **chỉ xem** reveal đầy đủ khi người khác thắng từ khóa (không thao tác).

---

## 5.1 Checklist acceptance (manual + e2e)

**E2E (Playwright):** `npm run e2e` — lần đầu cần `npm run e2e:install` (Chromium). Bài seed cố định: `shareLink` = `e2e-share-basic` (tạo/ghi đè trong `e2e/global-setup.ts` trước mỗi lần chạy test). `npm run verify` đã gồm e2e.

| # | Tiêu chí (tham chiếu spec) | Tay | E2E |
|---|---------------------------|-----|-----|
| A1 | Mở `/play/e2e-share-basic`: có tiêu đề bài, dải “Từ khóa — 2 ký tự”, **nút** 「Trả lời từ khóa」 | ☐ | ✓ `e2e/crossword-basic.spec.ts` |
| A2 | §3.3: sau khi trả lời **đúng** cả hai hàng ngang, nút 「Trả lời từ khóa」 **vẫn hiện** (không ẩn vì đã hết câu) | ☐ | ✓ `e2e/crossword-basic.spec.ts` |
| A3 | Click 「Trả lời từ khóa」: modal có checkbox xác nhận + ô nhập + nút Gửi/Hủy | ☐ | ✓ `e2e/crossword-basic.spec.ts` |
| A3b | §3.2 mục 3: đoán **đúng** từ khóa → dải `N` ô **hiện đủ chữ** (chuỗi chuẩn hóa) | ☐ | ✓ `e2e/crossword-basic.spec.ts` |
| A4 | Từ khóa EN / có khoảng trắng / ký tự lặp / đáp án có space (§1 + §2) | ☐ | *(chưa — mở rộng sau)* |
| A5 | Sai từ khóa → khóa phiên; đúng → thắng + autofill (§3.3.4–5) | ☐ | *(chưa — cần flow + sessionStorage)* |
| A6 | Spectator + poll khi người khác thắng (§3.3.6) | ☐ | *(chưa — 2 context / mock API)* |

---

## 6. Ghi chú / rủi ro

- Dữ liệu quiz **đã lưu** trước khi đổi rule: có thể cần migration hoặc “chỉ validate khi sửa”.
- Unicode đặc biệt: giữ NFD + `\p{M}`; edge case surrogate pairs ít gặp với use case hiện tại.
- **Luật “hết quyền sau một sai”** trên link public: chỉ **ràng buộc UX trong phiên trình duyệt** trừ khi có server lưu session; user có thể F5 để “phiên mới” — product đã chấp nhận cho MVP (hai user = hai máy, chưa có nút “Chơi lại”).
- **§3.3.6 (spectator xuyên máy):** cần **backend + realtime hoặc poll**; cân nhắc spam / abuse (nhiều client poll), TTL room, và **không lộ đáp án** trong payload public trước khi thỏa điều kiện reveal (tránh gian lận đọc API).
