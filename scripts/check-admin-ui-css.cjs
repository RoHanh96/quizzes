/**
 * Sau `next build`, xác nhận bundle CSS có utility đại diện cho các trang quan trọng
 * (/, /quizzes) — tránh hồi quy Tailwind `content` thiếu path.
 */
const fs = require("fs");
const path = require("path");

const cssDir = path.join(process.cwd(), ".next/static/css");

if (!fs.existsSync(cssDir)) {
  console.error("[check-admin-ui-css] Thiếu .next/static/css — chạy npm run build trước.");
  process.exit(1);
}

const files = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));
if (!files.length) {
  console.error("[check-admin-ui-css] Không có file .css trong .next/static/css");
  process.exit(1);
}

/** Đại diện: `QuizListView` (/, /quizzes) — shell + thẻ quiz */
const needles = [
  "text-indigo-600",
  "bg-indigo-600",
  "container",
  "text-3xl",
  "min-h-screen",
  "max-w-7xl",
];

let okFile = null;
for (const name of files) {
  const css = fs.readFileSync(path.join(cssDir, name), "utf8");
  if (needles.every((n) => css.includes(n))) {
    okFile = name;
    break;
  }
}

if (!okFile) {
  console.error(
    "[check-admin-ui-css] FAIL: không thấy đủ utility (",
    needles.join(", "),
    ") — kiểm tra tailwind.config.js `content`: `./src/**/*`."
  );
  process.exit(1);
}

console.log("[check-admin-ui-css] OK:", okFile, "(/", "/quizzes)");
