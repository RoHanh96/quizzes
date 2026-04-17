# Bug log — multiple choice (task 004)

**Quy ước:** Mọi bug / chỉnh hành vi đáng kể trong phạm vi task 004 (MC admin, session API, `MultipleChoicePlayer`, E2E) ghi **một mục mới** (theo thời gian hoặc `[BUG-xxx]`) dưới đây. Khi code xong: **Trạng thái** = đã fix + **Đã test** + đồng bộ [e2e-test-report.md](./e2e-test-report.md) (§1.2 / §4).

---

## 2026-04-17 — [BUG-004-01] Sai đáp án: không thấy ô đúng (xanh nhấp nháy)

### Triệu chứng

- Sau khi chọn **sai**, màn hình chuyển **game over** ngay mà **không** còn lưới 4 phương án, nên **không** thấy đáp án đúng với nền **xanh nhạt** và **nhấp nháy** như [spec.md](./spec.md) §3.2–§3.3.

### Nguyên nhân gốc

- `setGameOver(true)` được gọi **cùng lúc** với reveal nhưng điều kiện render lưới là `!gameOver` → toàn bộ khối câu hỏi + option **unmount** trước khi user kịp thấy highlight đúng.

### Cách sửa (đã áp dụng)

- Sau `setRevealed` + gán `correctDisplayIndex`, **chờ thêm ~2,8s** rồi mới `setGameOver(true)`.
- Điều kiện hiển thị lưới: vẫn hiện khi `gameOver && revealed` (xem `MultipleChoicePlayer` — `showOptionsBlock`).
- Ô đúng: `data-mc-correct-reveal="true"` + nhấp nháy (sau này **BUG-004-04** dùng `mc-blink-green` thay `animate-pulse`); banner **「Bạn đã thua」** đặt **dưới** lưới.

### Kiểm thử hồi quy

- **Đã test:** `npm run verify` — Playwright **T004-play-03** assert `data-mc-correct-reveal` + class **`mc-blink-green`** trước `mc-game-over` (đồng bộ **BUG-004-04**).

**Trạng thái:** **Đã fix**.

---

## 2026-04-17 — [BUG-004-04] MC play: làm nổi bật đáp án đúng + thiếu 「Chơi lại」khi thắng

### Triệu chứng

1. **Trả lời đúng:** cần **xanh + cam** xen kẽ rõ rệt (nhấp nháy liên tục) để nổi bật ô đúng — `animate-pulse` một màu chưa đủ.
2. **Trả lời sai:** ô đáp án đúng (xanh) cần **nhấp nháy liên tục** thay vì pulse nhẹ.
3. **Thắng:** chỉ có banner **「Bạn là người chiến thắng」**, **không** có nút **Chơi lại** — user không biết cách chơi lại.

### Nguyên nhân gốc

- Chỉ dùng utility Tailwind `animate-pulse` (opacity) trên một nền cố định → tương phản yếu.
- `showOptionsBlock` phụ thuộc `!won`: gọi `setWon(true)` **ngay** sau `setRevealed(true)` → lưới option **biến mất tức thì**, không thời gian xem highlight thắng; UI thắng không có CTA reset phiên.

### Cách sửa (đã áp dụng)

- Thêm keyframes trong `src/app/globals.css`: **`mc-blink-green-amber`** (ô vừa chọn vừa đúng sau reveal), **`mc-blink-green`** (ô đúng khi user chọn sai).
- `MultipleChoicePlayer`: gắn class tương ứng thay cho `animate-pulse` trên ô có `data-mc-correct-reveal`.
- Khi **thắng** (`revealPayload.won`): **`await` ~1,8s** rồi mới `setWon(true)` để vẫn thấy lưới + nhấp nháy; trong banner thắng thêm nút **`Chơi lại`** (`data-testid="mc-play-again"`, cùng id với màn thua).

### Kiểm thử hồi quy

- **Đã test:** `npm run verify` — **T004-play-03:** `mc-blink-green` trên ô đúng; **T004-play-02:** sau `mc-win` click `mc-play-again` → `mc-question-text` hiện lại.

**Trạng thái:** **Đã fix**.

---

## 2026-04-17 — [BUG-004-02] Admin MC: nút 「+ Thêm câu hỏi」chỉ ở đầu danh sách

### Triệu chứng

- Nút **+ Thêm câu hỏi** nằm cố định **trên** cùng; khi đã kéo xuống nhập câu cuối, muốn thêm câu phải **scroll lên** — khó thao tác.

### Cách sửa (đã áp dụng)

- Bỏ nút cạnh tiêu đề **Ngân hàng câu hỏi**; thêm nút **+ Thêm câu hỏi** ở **cuối mỗi card** câu (`data-testid="mc-add-question-after-card"`).

### Kiểm thử hồi quy

- **Đã test:** `npm run verify` (E2E admin T004 không phụ thuộc nút mới; hành vi thủ công).

**Trạng thái:** **Đã fix**.

---

## 2026-04-17 — [BUG-004-03] Copy 「Đáp án sẽ được công bố sau…」không tự nhiên

### Triệu chứng

- Sau khi chọn đáp án, hiện dòng chữ kiểu **「Đáp án sẽ được công bố sau…」** — product cảm thấy **không tự nhiên**, không cần thiết.

### Cách sửa (đã áp dụng)

- **Gỡ** hoàn toàn block copy chờ (`mc-suspense`) khỏi `MultipleChoicePlayer`; giữ **khóa + cam** rồi **chờ ~5s** im lặng rồi reveal (đúng spec thời gian, không bắt buộc chữ).

### Kiểm thử hồi quy

- **Đã test:** `npm run verify` — cập nhật **T004-play-02** / **T004-play-03** (bỏ assert `mc-suspense`).

**Trạng thái:** **Đã fix**.
