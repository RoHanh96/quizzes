# Quizzes

Ứng dụng Next.js tạo và chia sẻ quiz (crossword basic/advanced, multiple choice — MC đang mở rộng).

## Chạy local

```bash
npm install
cp .env.example .env.local   # gồm NEXTAUTH_*, DATABASE_URL (SQLite dev)
# Hoặc: export DATABASE_URL="file:./dev.db" rồi chạy Prisma CLI (đường dẫn tương đối theo thư mục prisma/)
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

**Hai file SQLite:** `npm run dev` / `build` / `start` dùng `DATABASE_URL=file:./dev.db` (mặc định trong `package.json`). **`npm run e2e` / `verify`** dùng `file:./e2e.db` — Playwright seed/xóa theo `shareLink` test **không** ghi đè dữ liệu trong `prisma/dev.db`.

**Danh sách admin (`/`, `/quizzes`):** ẩn quiz seed E2E (user `e2e-seed@example.com` hoặc `shareLink` bắt đầu `e2e-share-`). Server test Playwright bật `SHOW_E2E_SEED_IN_DASHBOARD_LIST=1` (trong `playwright.config.ts`) để spec vẫn tìm được thẻ “E2E …”.

Mở [http://localhost:3000](http://localhost:3000). Admin mặc định: `admin@example.com` (mật khẩu tùy ý theo cấu hình dev trong `authorize`).

## Luồng chính

| Vai trò | Route |
|--------|--------|
| Admin — danh sách / tạo / sửa | `/`, `/quizzes`, `/quizzes/create`, `/quizzes/[id]/edit` |
| Admin / user — chơi (cần đăng nhập) | `/quizzes/[id]` |
| **User — chơi công khai (không đăng nhập)** | `/play/[shareLink]` |

`shareLink` được tạo khi admin tạo quiz mới (nanoid). Dùng link **Link public** trên dashboard admin để copy đường `/play/...`.

## Stack

Next.js 14 (App Router), Prisma + SQLite (dev), NextAuth, Tailwind.

Kế hoạch refactor / spec / bugfix: mỗi mục một folder dưới [tasks/](tasks/) (ví dụ `task-001-quiz-refactor/`). Mục lục: [tasks/README.md](tasks/README.md). Trạng thái tổng hợp: [tasks/STATUS.md](tasks/STATUS.md). Rule: `.cursor/rules/`.
