# tasks/

**Tổng quan trạng thái (đã / đang / nợ):** [STATUS.md](./STATUS.md)

Mỗi lần **fix bug**, **sửa spec**, hoặc **thêm chức năng** có tài liệu kèm theo → tạo **một folder riêng** (dễ nhìn, dễ archive).

## Quy ước đặt tên

- Dạng: **`task-NNN-kebab-short-title/`**
  - `NNN`: số thứ tự tăng dần (001, 002, …).
  - `kebab-short-title`: mô tả ngắn (ASCII, không dấu).
- File tài liệu / báo cáo / script trong task: **tên file tiếng Anh** (`kebab-case`), ví dụ `e2e-test-report.md` — xem `.cursor/rules/quiz-delivery-and-docs.mdc` (mục *Đặt tên file*).

## Trong mỗi folder

| Gợi ý | Mục đích |
|--------|-----------|
| **`README.md`** | Một dòng giới thiệu + link tới file chi tiết chính. |
| **`spec.md`**, **`plan.md`**, **`notes.md`**, … | Nội dung chi tiết (chọn tên rõ nghĩa). |
| **`e2e-test-report.md`** (khi có E2E / QA) | Báo cáo / kịch bản E2E: mã case + kỳ vọng nghiệp vụ **và** chuỗi thao tác UI; cập nhật khi thêm `e2e/task-NNN-*.spec.ts` hoặc sau fix bug — xem `.cursor/rules/quiz-e2e-and-test-docs.mdc`. |

## Task hiện có

| Folder | Nội dung |
|--------|----------|
| [task-001-quiz-refactor](./task-001-quiz-refactor/) | Refactor quiz-centric, module, API, xóa Game. |
| [task-002-crossword-basic-spec](./task-002-crossword-basic-spec/) | Spec & checklist triển khai crossword basic. |
| [e2e-full-app-playbook](./e2e-full-app-playbook/) | Kịch bản E2E toàn màn (review trước khi code test). |
| [task-003-crossword-advanced-spec](./task-003-crossword-advanced-spec/) | Crossword advanced — một ảnh, lưới R×C, mở mảnh theo câu đúng; public/modal như basic. |
| [task-004-multiple-choice-spec](./task-004-multiple-choice-spec/) | Multiple choice — MVP code + spec v1; E2E `task-004-mc-*.spec.ts`. |

Task mới: copy cấu trúc từ một folder trên hoặc tạo `task-003-...` rồi thêm một dòng vào bảng này **và** cập nhật [STATUS.md](./STATUS.md).
