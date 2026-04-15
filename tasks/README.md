# tasks/

**Tổng quan trạng thái (đã / đang / nợ):** [STATUS.md](./STATUS.md)

Mỗi lần **fix bug**, **sửa spec**, hoặc **thêm chức năng** có tài liệu kèm theo → tạo **một folder riêng** (dễ nhìn, dễ archive).

## Quy ước đặt tên

- Dạng: **`task-NNN-kebab-short-title/`**
  - `NNN`: số thứ tự tăng dần (001, 002, …).
  - `kebab-short-title`: mô tả ngắn (ASCII, không dấu).

## Trong mỗi folder

| Gợi ý | Mục đích |
|--------|-----------|
| **`README.md`** | Một dòng giới thiệu + link tới file chi tiết chính. |
| **`spec.md`**, **`plan.md`**, **`notes.md`**, … | Nội dung chi tiết (chọn tên rõ nghĩa). |

## Task hiện có

| Folder | Nội dung |
|--------|----------|
| [task-001-quiz-refactor](./task-001-quiz-refactor/) | Refactor quiz-centric, module, API, xóa Game. |
| [task-002-crossword-basic-spec](./task-002-crossword-basic-spec/) | Spec & checklist triển khai crossword basic. |

Task mới: copy cấu trúc từ một folder trên hoặc tạo `task-003-...` rồi thêm một dòng vào bảng này **và** cập nhật [STATUS.md](./STATUS.md).
