# Geography quiz — functional spec (v1 draft)

> **Trạng thái:** v1 **draft** — chờ chốt sau khi review phase 0 (dữ liệu + UX thoát).  
> **Ngôn ngữ nội dung chơi:** **English** (prompts, options, toasts).  
> **Mục tiêu sản phẩm:** học tập miễn phí, không thương mại hóa; vẫn **ghi credits / license** cho ảnh (xem §5).

---

## 1. Goals

- Admin tạo quiz mới với **`type = geography`** chỉ bằng luồng tối thiểu: chọn **phạm vi địa lý (theo châu lục)** → submit (**không** nhập từng câu hỏi tay).
- Người chơi mở **public link** (`/play/[shareLink]`) và trả lời **lần lượt** các câu trắc nghiệm **4 đáp án**; có **cờ** và **ảnh địa danh** (landmark) khi template câu cần.
- **Không có giới hạn cứng** về tổng số câu trong một phiên: phiên tiếp tục cho đến khi **trả lời sai một câu** (game over) — đối chiếu UX “endless / survival” đã thống nhất với stakeholder. *(Tuỳ chọn v1.1: nút “End session” / “I’m done” để thoát sớm có điểm — ghi vào backlog nếu chưa làm v1.)*

---

## 2. Admin

### 2.1 Create flow

- Trên màn tạo quiz (hoặc entry tương đương), admin chọn type **Geography** (label UI có thể khác; **mã lưu DB** đề xuất: `geography`).
- **Bắt buộc:** chọn ít nhất **một châu lục** trong tập cố định (đề xuất v1):
  - `Africa`, `Asia`, `Europe`, `North America`, `South America`, `Oceania`, `Antarctica`
- **Tuỳ chọn v1 (nếu cần đơn giản hóa):** chỉ cho chọn **một** châu lần đầu; multi-continent là **stretch** sau khi generator ổn định.
- Không cần field `playLength` (khác MC task 004): độ dài phiên do luật “đến khi sai” quyết định.

### 2.2 Validation

- Không cho tạo nếu không có phạm vi châu lục hợp lệ.
- Nếu tập quốc gia trong phạm vi **rỗng** (lỗi seed / filter) → báo lỗi rõ, không tạo quiz “cụt”.

---

## 3. Question templates (English)

Mỗi **round** là một câu 4 lựa chọn; đáp án đúng và distractor lấy từ **cùng pool** quốc gia sau khi áp filter châu lục (ưu tiên distractor cùng châu để độ khó hợp lý).

| Template ID (gợi ý) | Prompt (EN) | Media | Đúng là |
|---------------------|-------------|-------|---------|
| `flag_to_country` | “Which country does this flag belong to?” | Flag image | Country name |
| `country_to_capital` | “What is the capital of {Country}?” | None hoặc cờ nhỏ (tuỳ chọn) | Capital city |
| `landmark_to_country` | “In which country is this place?” | Landmark photo | Country name |

- **Shuffle:** thứ tự 4 lựa chọn hiển thị xáo trộn (server-side), không lộ đáp án trong payload GET tương tự nguyên tắc MC hiện có.
- **RNG:** mỗi round chọn template + quốc gia “đúng” + 3 nước “sai” theo rule pool; có thể dùng seed theo phiên để debug/E2E.

---

## 4. Public play

- Route hiện có: **`/play/[shareLink]`** — nhánh render player khi `quiz.type === 'geography'`.
- Luồng gợi ý API (chi tiết chốt lúc implement, bám pattern task 004):
  - **GET** (hoặc tương đương): lấy **round hiện tại** (prompt + options + image URLs đã chuẩn bị cho `next/image` hoặc asset nội bộ) — **không** chứa index đáp án đúng.
  - **POST:** gửi lựa chọn → trả kết quả reveal + `gameOver` nếu sai; nếu đúng → client có thể gọi GET tiếp cho round kế hoặc POST trả luôn “next round stub” — **một** pattern duy nhất nên chốt trong phase API.
- **Thắng / thua:** không có “thắng hết quiz” cố định; có thể hiển thị **streak** (số câu đúng liên tiếp) và **game over** khi sai; nút **Play again** tạo phiên mới (giống tinh thần MC).

---

## 5. Data, assets, licensing

- **Không** crawl/clone bài quiz có bản quyền từ site bên thứ ba.
- **Nên:** snapshot dữ liệu từ **Wikidata** (country, capital, continent, links ảnh Commons) + metadata license từng ảnh landmark; **cờ** ưu tiên bộ asset cố định (SVG/PNG theo ISO) có LICENSE rõ hoặc mirror Commons có attribution.
- **Cache:** khuyến nghị **build-time hoặc import-time** copy ảnh vào `public/...` hoặc object storage nội bộ + bảng metadata (`credit`, `license`, `sourceUrl`) để UI hiển thị mục Credits / “Data sources”.
- **Chốt kiến trúc lưu trữ (v1):** **phương án B** — toàn bộ catalog quốc gia (sau khi chuẩn hoá) nằm trong **bảng Prisma** (ví dụ `GeographyCountry`), seed/refresh từ pipeline offline; `Quiz` chỉ lưu phạm vi châu lục + metadata quiz. Chi tiết quy trình lấy dữ liệu từ Wikidata và map vào DB: [implementation-plan.md — § Phương án B](./implementation-plan.md#plan-b-geography-country).

---

## 6. Non-goals (v1)

- Không yêu cầu i18n tiếng Việt cho prompt (đã chọn EN).
- Không yêu cầu ô chữ / crossword.
- Không yêu cầu admin sửa từng câu trong bank.

---

## 7. Open decisions (cần chốt trước code)

1. **Multi-continent** ngay v1 hay chỉ single-select?
2. **Antarctica:** giữ trong list hay ẩn vì pool nhỏ?
3. **GET/POST shape** cho geography session: tái sử dụng route pattern `multiple-choice-session` (mở rộng) hay route riêng `geography-session`?
4. **Landmark coverage:** tối thiểu bao nhiêu quốc gia có landmark hợp lệ trước khi bật template `landmark_to_country`?

---

*Cập nhật: 2026-04-18 — draft từ yêu cầu stakeholder.*
