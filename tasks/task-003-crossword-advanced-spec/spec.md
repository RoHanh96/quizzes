# Crossword advanced — spec (task 003)

> **Trạng thái:** chốt product cho triển khai; chưa có checklist code chi tiết.  
> **Phạm vi:** loại quiz `crossword_advanced` — **một ảnh** gợi ý từ khóa, lưới mảnh, đánh số ngẫu nhiên; hàng ngang chỉ là câu hỏi/đáp án (không gắn ảnh từng câu).  
> **Out of scope (task này):** chi tiết implementation UI pixel-perfect (sẽ tinh chỉnh khi code).

---

## 1. Tóm tắt khác basic

| Khía cạnh | Basic | Advanced (task 003) |
|-----------|-------|----------------------|
| Gợi ý từ khóa | Dải ô chữ + optional strip | **Một ảnh** chia lưới; mở từng **mảnh** sau câu đúng |
| Ảnh | Không bắt buộc | **Bắt buộc** đúng **một** `imageUrl` / file upload cho cả quiz |
| `N` câu vs từ khóa | `N` = độ dài từ khóa chuẩn hóa | **`N` = số câu hàng ngang**; **không** ràng buộc độ dài `secretWord` |
| Đáp án hàng ngang | Chứa ký tự slot từ khóa | **Chỉ** Q/A text; **không** liên hệ ký tự trong ảnh |

---

## 2. Ảnh & lưới

### 2.1 Một file ảnh cho cả quiz

- Ảnh **chỉ** phục vụ gợi ý **từ khóa (secret word)**; **không** dùng ảnh riêng từng câu hàng ngang.
- Upload bắt buộc khi tạo/sửa quiz advanced (validation server + UI).

### 2.2 Kích thước & validation

- **Tỉ lệ:** tùy ý; **gợi ý** 16:9 trong UI (helper text).
- **Dung lượng tối thiểu:** **500 KB** (file size) — reject nếu nhỏ hơn.
- **Crop:** **tự động** theo lưới (xem 2.3); server hoặc client crop về vùng hiển thị chuẩn trước khi lưu — chi tiết kỹ thuật (thư viện, định dạng output) ghi trong plan code.

### 2.3 Số hàng / số cột (đã chốt)

- Đặt **N** = số câu hỏi (hàng ngang).
- **Bắt buộc** **R×C = N** (lưới phủ kín ảnh, **không** ô đệm): chọn cặp số nguyên dương **(R, C)** sao cho **R·C = N**, trong đó ưu tiên **|R−C|** nhỏ nhất (lưới gần vuông); nếu còn nhiều cặp tương đương, ưu tiên **R** nhỏ hơn (thường hợp ảnh ngang 16:9).
- Ví dụ: **N = 3** → **1×3**; **N = 4** → **2×2**; **N = 5** → **1×5**; **N = 6** → **2×3**; **N = 7** (nguyên tố) → **1×7**.

### 2.4 Chia ảnh theo lưới

- Ảnh (sau crop) chia **đều** thành **R×C = N** ô hình học (mỗi ô một “tile” bitmap, **phủ kín** vùng ảnh).
- **N ô** đều tham gia game: sau shuffle, **mỗi ô đúng một nhãn** trong **1…N** (số **k** = câu thứ **k** theo `order` — xem §3). **Không** có ô lưới không gắn câu trong layout chuẩn này.

---

## 3. Hiển thị & random

### 3.1 Trước khi có bất kỳ câu đúng nào

- Toàn vùng ảnh gợi ý **che kín** (chưa lộ pixel ảnh từ khóa).
- Hiển thị **lưới R×C** với **R×C = N**; trên **đúng N ô** có **số 1…N** (mỗi ô một số sau shuffle) — số **k** tương ứng **câu hỏi thứ k** (theo `order` / thứ tự đã định nghĩa trong editor).
- Vị trí các số **ngẫu nhiên** trên toàn bộ **N** ô (hoán vị nhãn 1…N).

### 3.2 Sau khi trả lời **đúng** câu k

- **Bắt buộc** trả lời đúng mới mở **đúng một** mảnh ảnh: ô có **nhãn k** chuyển từ che → hiển thị **tile ảnh** tại **vị trí hình học** của ô đó trên lưới (mảnh R×C tương ứng).
- **Không** mở mảnh ngẫu nhiên khác; mapping **số k ↔ câu k** ↔ **ô đã random có số k** ↔ **tile hình học tại ô đó**.

### 3.3 Sai đáp án

- Cho phép nhập lại **không giới hạn** (không trừ mạng / không khóa hàng sau sai).

---

## 4. Từ khóa (secret word) & public play

- Người chơi có thể **đoán từ khóa bất cứ lúc nào** (giống basic).
- **Public `/play/{shareLink}`:** cùng họ ý với basic — **modal xác nhận rủi ro** + checkbox + gửi đoán; sai một lần → hết quyền đoán từ khóa trong phiên (sessionStorage / rule tương đương basic); poll / spectator nếu product giữ parity với basic (ghi rõ khi implement — tái sử dụng pattern task 002).

### 4.1 Chuẩn hóa text

- **Giống basic:** `normalizeKeyword` / `answersMatch` (bỏ dấu, bỏ space, không phân biệt hoa thường) cho **secret word** và **đáp án hàng ngang**.

---

## 5. Admin — tạo / sửa

- Loại quiz: **Crossword advanced**.
- Trường: `secretWord`, **một** upload ảnh (hoặc URL sau upload), danh sách câu hỏi hàng ngang (Q + đáp án + thứ tự); **không** ảnh per-câu.
- `letterIndex` / logic “ký tự trong từ khóa” của basic **không** áp dụng cho advanced trong task này (editor advanced chỉ cần Q/A + order phù hợp N).

---

## 6. Dữ liệu & migration

- **Bài advanced cũ** (trước spec này): **xoá** khỏi DB được chấp nhận — **chưa có production**; triển khai bằng migration Prisma hoặc script seed + `deleteMany` theo `type = 'crossword_advanced'`.
- **Bài mới** tuân spec từ §2–§5.

---

## 7. E2E & tài liệu

- Báo cáo kịch bản: [e2e-test-report.md](./e2e-test-report.md). Rule repo: `.cursor/rules/quiz-e2e-and-test-docs.mdc` (mọi thay đổi hành vi advanced phải cập nhật `e2e/task-003-*.spec.ts` + báo cáo).
- Spec Playwright: `e2e/task-003-advanced-play.spec.ts`, `e2e/task-003-keyword.spec.ts`. Seed: `E2E_SHARE_ADVANCED`, `E2E_SHARE_ADVANCED_KEYWORD`, `E2E_SHARE_ADVANCED_WRONG`, `E2E_SHARE_ADVANCED_SPECTATOR` trong `e2e/constants.ts` + `e2e/global-setup.ts`.

---

## 8. Rủi ro / cần lưu ý khi code

- **N nguyên tố / dải 1×N:** các tile rất hẹp hoặc rất cao — kiểm tra responsive trên mobile.
- **Random:** seed deterministic cho **CI** (query param debug hoặc seed trong DB quiz) để E2E ổn định.
- **500 KB min:** ảnh nén nhỏ có thể bị reject — thông báo rõ cho admin.

---

_Cập nhật: 2026-04-15 — chốt theo thảo luận với product (grid R/C, random số, một ảnh, modal giống basic, xoá advanced cũ). Cập nhật cùng ngày: **R×C = N** (ước số, gần vuông), bỏ ô đệm._
