# Multiple choice — functional spec (v1 chốt)

> Trạng thái: **spec v1 đã chốt** (2026-04-17) — sẵn sàng làm backlog implement / e2e.  
> Rule tổng quan: [.cursor/rules/quiz-product-architecture.mdc](../../.cursor/rules/quiz-product-architecture.mdc). Phần MCQ **15 câu cố định theo thứ tự** trong file đó **bị thay thế** bởi spec này cho loại `multiple_choice`.

---

## 1. Admin — ngân hàng câu hỏi

- Admin tạo **nhiều câu hỏi** cho một quiz loại multiple choice.
- Mỗi câu có **đúng 4 phương án** (slot **A, B, C, D** trong dữ liệu — admin nhập nội dung từng slot).
- Admin **chỉ định rõ slot nào là đáp án đúng** (một trong A / B / C / D). Đây là nguồn sự thật khi chấm đúng/sai; **không** suy từ thứ tự hiển thị sau khi shuffle (mục §3).
- Mỗi câu có **một** mức độ khó: **dễ** | **trung bình** | **khó** | **siêu khó**.
- Admin chỉ định `**playLength`** = số câu trong **một lần chơi**. Bắt buộc: `**playLength` ≤ tổng số câu** trong ngân hàng của bài đó.
- **Không** bắt buộc validate thêm theo “đủ pool từng bucket” hay “mỗi mức ít nhất N câu” — thiếu câu trong bucket vẫn cho phép lưu và chơi; engine xử lý theo §2.3.

---

## 2. Phân bucket theo vị trí câu trong phiên

### 2.1 Mẫu chuẩn (tham chiếu `L_ref = 13`)

Ranh giới **không chồng** — áp dụng khi `playLength ≥ 13` cho các vị trí 1…13:


| Vị trí câu trong phiên | Bucket độ khó |
| ---------------------- | ------------- |
| **1 – 4**              | Dễ            |
| **5 – 8**              | Trung bình    |
| **9 – 12**             | Khó           |
| **13+**                | Siêu khó      |


Với `playLength = 13`: đúng **4 + 4 + 4 + 1** câu theo bốn mức (câu 13 chỉ thuộc siêu khó).

### 2.2 `playLength = L` — co giảm theo tỉ lệ & mở rộng dài phiên

**Trường hợp `L ≥ 13`:** giữ đúng ranh giới mục §2.1 cho các vị trí **1…12**; mọi vị trí **13 … `L`** đều thuộc bucket **siêu khó** (ví dụ `L = 20` → 4 dễ + 4 TB + 4 khó + 8 siêu khó).

**Trường hợp `L < 13`:** co giảm theo **cùng tỉ lệ** 4 : 4 : 4 : 1 trên 13 câu:

- Tính bốn số nguyên `**n_E`, `n_M`, `n_H`, `n_S`** sao cho `n_E + n_M + n_H + n_S = L` và gần với tỉ lệ trên (chuẩn kỹ thuật: **largest remainder / Hamilton** trên `L × (4,4,4,1) / 13`, phần dư phân cho các bucket có phần thập phân lớn nhất; **tie-break** cố định **dễ → trung bình → khó → siêu khó**).
- Gán bucket theo **thứ tự vị trí câu** (độ khó tăng dần theo index):
  - Câu **1 … `n_E`**: **dễ**;
  - tiếp `**n_M`** câu: **trung bình**;
  - tiếp `**n_H`** câu: **khó**;
  - `**n_S`** câu cuối: **siêu khó**.

*Ví dụ `L = 8`: **3 dễ + 2 TB + 2 khó + 1 SK** (Hamilton); QA có thể bảng hóa `L = 1…12` để đối chiếu.*

`**L ≥ 1`:** không cho phép `playLength = 0` (một lần chơi phải có ít nhất một câu).

### 2.3 Chọn câu ngẫu nhiên trong bucket

- Với mỗi vị trí câu, **random** một câu trong ngân hàng **thuộc đúng bucket** độ khó của vị trí đó.
- **Ưu tiên không trùng** cùng một câu (cùng `questionId` / row) trong **một phiên**: khi còn đủ câu khác trong bucket (và chưa dùng hết trong phiên), **không** chọn lại câu đã dùng.
- **Ngoại lệ:** nếu admin **chỉ có một câu** (hoặc tập đã dùng hết) cho bucket / tình huống đó thì **cho phép trùng** cùng một câu trong phiên — không báo lỗi.
- **Không** validate bắt buộc “đủ pool” lúc lưu hay lúc bắt đầu chơi; không bắt buộc fallback sang bucket khác — chỉ random trong đúng bucket của vị trí, kèm quy tắc trùng như trên.

---

## 3. Màn chơi user — đáp án & hiển thị

### 3.1 Shuffle thứ tự 4 phương án

- Khi render màn chơi: **xáo trộn thứ tự hiển thị** bốn phương án (seed theo phiên hoặc theo câu — chi tiết implement).
- Đáp án đúng vẫn xác định bởi **slot admin đã chọn** (mục §1); UI map index shuffle ↔ id slot để chấm đúng/sai.

### 3.2 Chọn đáp án, khóa, chờ 5s, reveal

- User chọn **một** phương án:
  - Ngay sau khi chọn: **khóa** — **không** cho đổi lựa chọn (kể cả trong ~5s chờ và sau khi reveal).
  - Phương án được chọn: style **cam** (selected).
  - **Không** bắt buộc hiển thị dòng copy chờ giữa lúc khóa và reveal (tránh cảm giác không tự nhiên); có thể chỉ **im lặng** trong ~5s rồi công bố đáp án đúng.
- Sau **khoảng 5 giây** (có thể ±tolerance nhỏ do timer; không yêu cầu frame-perfect):
  - Phương án **đúng**: style **xanh nhạt** (correct), nhấp nháy.
  - Nếu user chọn **trùng** đáp án đúng: **cam + xanh nhạt chồng** và **nhấp nháy** (blink) theo đã thống nhất.

### 3.3 Sai / thắng / chơi lại

- **Sai** ở bất kỳ câu nào → **game over**; hiển thị màn / modal có copy **「Bạn đã thua」** (hoặc tương đương) và nút **「Chơi lại」** — bấm thì **bắt đầu phiên mới từ câu 1** (generate lại thứ tự câu / shuffle đáp án theo rule, không reset im lặng).
- **Câu cuối** của phiên: nếu **đúng** → thông điệp **「Bạn là người chiến thắng」** (copy có thể tinh chỉnh sau).

### 3.4 Accessibility

- Trạng thái đúng/sai/chọn không chỉ dựa vào màu: nên kèm **viền / icon / nhãn text** (implement).

---

## 4. Liên hệ codebase & API (nhắc việc)

- Validate body admin: pattern `src/modules/quiz/validation/…`.
- Public play: payload **không** lộ đáp án đúng trước reveal — backlog [tasks/STATUS.md](../STATUS.md) (`getForPlay` / task 001).

---

*Cập nhật: 2026-04-17 — v1 chốt theo xác nhận product.*