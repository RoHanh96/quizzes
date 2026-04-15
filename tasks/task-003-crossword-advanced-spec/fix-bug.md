# Bug log — crossword advanced (task 003)

## 2026-04-15 — Thiếu mảnh ảnh khi số câu (N) tạo lưới có ô đệm (vd N = 3)

### Triệu chứng

- Khi **N** (số câu hàng ngang) khiến lưới **R×C** lớn hơn **N** (theo [spec.md](./spec.md) §2.3), người chơi thấy **một ô** (thường nền xám / “ô đệm”) **không có số**, không bấm mở được.
- Ảnh gợi ý đã được chia **đủ R×C** tile hình học trên ảnh, nhưng **tile tại vị trí ô đệm** không bao giờ hiện như phần ảnh — cảm giác “mất một góc ảnh”.
- Người dùng hay gặp với **N nhỏ và lẻ** (ví dụ **N = 3**: đúng 3 câu hàng ngang vẫn không thấy **toàn bộ** ảnh trên lưới). *Lưu ý:* không phải mọi số lẻ đều có ô đệm (vd **N = 9** → 3×3, không đệm).

### Nguyên nhân gốc (đã xử lý — giữ lại để tra cứu)

1. **Công thức lưới cũ (đã thay):** trước đây `R = ⌈√N⌉`, `C = ⌈N/R⌉` → **R×C ≥ N** và có **ô đệm** khi **R×C > N**. **Hiện tại** [spec.md](./spec.md) §2.3 dùng **R×C = N** (ước số, gần vuông) — **không còn ô đệm** trong layout chuẩn.
2. **Implementation cũ (khi còn đệm):** `CrosswordAdvancedImageGrid` với `label == null` **bỏ qua** `forceRevealAll`; `CrosswordPlayer` không gộp `allSubQuestionsAnswered` → ô đệm không lộ slice sau N câu. Code vẫn hỗ trợ nhánh `label == null` nếu dữ liệu cũ / edge case.

### Chốt product (2026-04-15) — spec hướng chia ảnh

- **Bắt buộc:** Sau khi chia, tập các mảnh (tile) trên lưới phải **phủ kín** vùng ảnh gợi ý chính — người chơi, sau khi hoàn thành **điều kiện kết thúc đã thống nhất** (vd đủ **N** câu đúng và/hoặc thắng từ khóa, tùy bản chốt cuối), **không** được cảm giác còn **góc ảnh “mất”** so với file gốc. Không cần ràng buộc N chẵn/lẻ chỉ để phục vụ chia đều.
- **Ưu tiên phụ:** Các mảnh **bằng nhau** (lưới hình học đều **R×C**) **càng tốt** khi chọn thuật toán; nếu phải đánh đổi, **ưu tiên phủ kín + đúng luồng mở ô** hơn là ép bằng nhau mọi N.

### Cách sửa (đã áp dụng trong code)

- **`CrosswordPlayer`:** truyền `forceRevealAll={globalSolved || wonByOwnKeyword || allSubQuestionsAnswered}` — khi đã trả lời đúng **cả N** câu (hoặc thắng / global từ khóa), coi như **lộ toàn lưới gồm ô đệm**.
- **`CrosswordAdvancedImageGrid`:** với ô đệm (`label == null`), khi `revealed` (tức `forceRevealAll` vì không có nhãn) thì render **cùng** slice `backgroundImage` + `backgroundPosition` như ô có nhãn; khi chưa revealed giữ nền che; thêm `data-state` trên ô đệm để E2E / a11y.
- **[spec.md](./spec.md) §2.4:** văn bản chính thức đã khớp hành vi “sau đủ N câu hoặc sau giải từ khóa → tile ô đệm lộ”.

### Kiểm thử hồi quy

- Playwright `e2e/task-003-advanced-play.spec.ts`: **E3-04** (+ **E3-FIX-03**) — seed `e2e-share-advanced` (**N = 3**, lưới **1×3**): **không** có `advanced-pad-*`; sau **ONE** / **TWO** / **THREE** có đúng **3** node `[style*='background-image']` trong `advanced-image-grid`.
- [e2e-test-report.md](./e2e-test-report.md) đồng bộ §1.2 / §1.3 / §2.

---

## 2026-04-15 — Ảnh gợi ý từ khóa lộ ngay khi bắt đầu chơi

### Triệu chứng

- Trên link public `/play/{shareLink}` và khi **Chơi (admin)** (`/quizzes/[id]`), lưới advanced hiển thị **pixel ảnh gợi ý** ngay từ đầu, thay vì **che kín** cho đến khi người chơi trả lời đúng từng câu hàng ngang (mỗi câu đúng mở đúng một ô).
- Không khớp [spec.md](./spec.md) §3.1: *“Toàn vùng ảnh gợi ý che kín (chưa lộ pixel ảnh từ khóa).”*

### Nguyên nhân gốc

- Component `CrosswordAdvancedImageGrid` **luôn** render lớp `backgroundImage` cho mọi ô có nhãn, kể cả khi `data-state="covered"`.
- Lớp phủ dùng `bg-zinc-900/88` (độ mờ ~88%) nên **vẫn lộ một phần ảnh**; với ảnh sáng / tương phản cao, người dùng cảm giác như ảnh “đã mở” hoặc đủ để đoán — không đạt yêu cầu “chưa lộ pixel”.

### Cách sửa (đã áp dụng trong code)

- Với ô có nhãn và **chưa** `revealed` (và không `forceRevealAll`): **không** render `div` có `backgroundImage`; chỉ hiển thị nền che **opaque** + số nhãn trên ô.
- Khi ô chuyển `revealed` (hoặc toàn bộ lưới mở sau thắng từ khóa / global solved): render lớp ảnh cắt tile như hiện tại.

### Kiểm thử hồi quy

- Playwright `e2e/task-003-advanced-play.spec.ts`:
  - **E3-01** (+ mã báo cáo **E3-FIX-01**): `data-state=covered` + trong ô **không** có phần tử `[style*='background-image']` (ô 1 và ô 2) — đảm bảo không render slice ảnh khi covered.
  - **E3-02** (+ **E3-FIX-02**): sau trả lời đúng câu 1, ô 1 có đúng **một** node `background-image`, ô 2 vẫn covered và vẫn **không** có `background-image`.
- Toàn bộ mục này phải được phản chiếu trong [e2e-test-report.md](./e2e-test-report.md) (§1.2, §1.3, §4) — quy ước repo: `.cursor/rules/quiz-e2e-and-test-docs.mdc`.

### Auto test — admin §2 (không phải bug pixel; bổ sung cùng task)

| Mã báo cáo | File | `test(...)` |
|------------|------|-------------|
| **E3-§2.1** | `e2e/task-003-admin-form.spec.ts` | `E3-§2.1: advanced thiếu ảnh…` |
| **E3-§2.2** | idem | `E3-§2.2: advanced upload ảnh dưới 500 KB…` |

- Chạy toàn bộ task 003: `npx playwright test e2e/task-003-*.spec.ts` hoặc `npm run verify`.
