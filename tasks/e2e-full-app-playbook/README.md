# Kịch bản E2E — toàn bộ màn hình (playbook)

**Mục đích:** Tài liệu để **review trước khi** viết/ghi thêm test Playwright; không thay thế test đang chạy trong `e2e/` cho đến khi team chốt kịch bản và triển khai.

**File chính:** [KICH-BAN-E2E.md](./KICH-BAN-E2E.md) — cuối file có **§9 bảng tổng hợp** mã PB-* + trạng thái Pass / Chưa có / … để theo dõi.

**Liên quan:** Task crossword + public play hiện có test tối thiểu trong `e2e/crossword-basic.spec.ts` + seed `e2e/global-setup.ts`. Playbook này mở rộng phạm vi sang **mọi route `page.tsx`** trong App Router.

**Cập nhật playbook:** khi thêm/sửa route hoặc đổi luồng auth — sửa `KICH-BAN-E2E.md` và dòng *Cập nhật* ở cuối file đó.
