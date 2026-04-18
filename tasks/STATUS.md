# Trạng thái tổng hợp — tasks

File này là **cái nhìn tổng quát** (đã làm / đang làm / còn nợ). Chi tiết kỹ thuật vẫn nằm trong từng folder task.

**Cập nhật:** khi đóng mục, đổi trạng thái task, hoặc thêm task mới — sửa bảng dưới và dòng *Cập nhật lần cuối* ở cuối.

---

## Ý nghĩa cột **Trạng thái**


| Giá trị          | Ý nghĩa                                                         |
| ---------------- | --------------------------------------------------------------- |
| **Hoàn thành**   | Mục tiêu task đã đạt; chỉ còn bảo trì nhỏ nếu có.               |
| **Gần xong**     | Phần chính xong; còn vài mục phụ / tech debt ghi rõ trong task. |
| **Đang làm**     | Đang triển khai tích cực.                                       |
| **Chưa bắt đầu** | Chỉ có spec/plan hoặc chưa có code.                             |
| **Tạm dừng**     | Không ưu tiên trong giai đoạn hiện tại.                         |


---

## Bảng task


| ID                                         | Task                                                 | Trạng thái                | Tóm tắt tiến độ                                                                                                                                                                                                                                                           |
| ------------------------------------------ | ---------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [001](./task-001-quiz-refactor/)           | Quiz refactor (module, API, bỏ Game)                 | **Hoàn thành**            | Phase 0–5 xong; Phase 6: còn registry đầy đủ & alias `@/modules` tùy chọn. Phase 5: nợ `**getForPlay`** tách payload (ẩn đáp án MC khi public). Chi tiết: [refactor-plan.md](./task-001-quiz-refactor/refactor-plan.md).                                                  |
| [002](./task-002-crossword-basic-spec/)    | Crossword basic — spec & triển khai                  | **Hoàn thành** (MVP code) | Pipeline `normalizeCrosswordQuestions` + gán index; editor/preview/player + `answersMatch`; e2e Playwright tối thiểu + checklist §5.1 trong [spec.md](./task-002-crossword-basic-spec/spec.md); kiểm thử tay A4–A6 còn mở.                                                |
| [003](./task-003-crossword-advanced-spec/) | Crossword advanced — ảnh + lưới + keyword            | **Hoàn thành**            | Spec: [spec.md](./task-003-crossword-advanced-spec/spec.md) — một ảnh, lưới **R×C = N** (ước số, gần vuông), số 1…N random, đúng câu mở đúng ô; đoán secret + modal như basic; min 500KB.                                                                                 |
| [004](./task-004-multiple-choice-spec/)    | Multiple choice — bank + play length + bucket random | **Hoàn thành** (MVP code) | Spec [spec.md](./task-004-multiple-choice-spec/spec.md); code: `playLength` + `difficulty`/`order`, `multiple-choice-session`, form/API, `MultipleChoicePlayer`, E2E `task-004-mc-*.spec.ts`.                                                                             |
| [005](./task-005-geography-quiz-spec/)     | Geography — generated MCQ, continent scope, public endless play | **Chưa bắt đầu** (chỉ spec/plan) | [spec.md](./task-005-geography-quiz-spec/spec.md), [implementation-plan.md](./task-005-geography-quiz-spec/implementation-plan.md); English prompts; data Wikidata/Commons + asset mirror; chưa có code/E2E. |


---

## Hàng đợi gợi ý (không phải task số)

Các mục chưa gom vào folder riêng nhưng liên quan trực tiếp bảng trên:

- **Public play + MC:** task 004 dùng `GET/POST .../multiple-choice-session` (không lộ đáp án trong GET). Nợ task 001: gom/tách `getForPlay` nếu muốn một entry API duy nhất.

---

*Cập nhật lần cuối: 2026-04-18 — thêm task 005 geography (spec/plan, chưa code).*