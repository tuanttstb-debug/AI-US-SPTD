# PROJECT OVERVIEW

## Tên dự án
**AI Use Case Package Management** — nội bộ gọi là `AI-US-SPTD`

## Mục đích nghiệp vụ
Hệ thống cho phép nhân viên tổ chức (TT SPTD — có thể là Trung tâm Sản phẩm & Dịch vụ Ngân hàng) **đăng ký, quản lý và tái sử dụng các AI Use Case** nội bộ. Thông qua form 4 bước, người dùng mô tả bài toán nghiệp vụ, thiết kế prompt AI, đánh giá hiệu quả và hướng dẫn sử dụng lại cho đồng nghiệp.

## Stack kỹ thuật
| Layer | Technology |
|---|---|
| Frontend | HTML5 + Vanilla CSS + Vanilla JS (no framework) |
| Backend | Google Apps Script (GAS) — deployed as Web App |
| Database | Google Sheets (5 sheets) |
| Hosting | Static file server (GitHub Pages / GCS / local — chưa xác định) |
| Transport | HTTPS via Google Apps Script Web App URL |

## Đặc điểm kiến trúc nổi bật
- **Serverless hoàn toàn** — không có server riêng; backend là GAS chạy trên hạ tầng Google.
- **Google Sheets làm database** — toàn bộ dữ liệu lưu trong Spreadsheet ID `1xLMQLTgj2sRf1l9C6s6AHCT5zWJLQOofL375t8Pv_NA`.
- **No build step** — không có npm, webpack, bundler. JS load thứ tự qua `<script>` tags thẳng trong HTML.
- **No authentication** — hiện tại **không có auth layer nào**; ai có URL đều có thể gọi API.

## Scope hiện tại (v1.0.0)
- [x] Form đăng ký use case 4 bước
- [x] Auto-save draft vào localStorage
- [x] Kiểm tra trùng lặp (Dice similarity) real-time
- [x] Edit mode (load use case cũ theo `?edit=<Record_ID>`)
- [x] Lookup data động từ Google Sheets
- [x] Activity log tự động
- [ ] Dashboard/reporting UI (API có nhưng UI chưa có)
- [ ] Quản lý reviewer / approval workflow (có trong data model nhưng chưa implement)
- [ ] Authentication / phân quyền

## Người dùng mục tiêu
Nhân viên nội bộ TT SPTD: cá nhân, team, toàn trung tâm — phân loại theo `Reuse_Level`.

## Ngôn ngữ
Giao diện: **Tiếng Việt**. Code/variable names: **Tiếng Anh**.
