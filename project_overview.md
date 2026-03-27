# Hệ thống Lập kế hoạch PlanBee

Chào mừng bạn đến với dự án **PlanBee**, một ứng dụng quản lý công việc và lập kế hoạch chuyên nghiệp.

## 📁 Cấu trúc dự án

```text
plan-bee/
├── backend/                # Node.js + Expressjs
│   ├── index.js           # Entry point
│   ├── server.js          # Server configuration
│   ├── .env               # Environment variables
│   └── schema.sql         # MySQL database schema
└── frontend/               # Vite + Vanilla JS + CSS
    ├── main.js             # Router & State management
    ├── index.html          # HTML Entry
    ├── style.css           # Global layout & layout styles
    └── src/
        ├── components/     # Sidebar, Topbar, v.v.
        ├── pages/          # 5 trang chính + Landing + Auth
        └── styles/         # Design system (CSS variables)
```

## ✨ Các tính năng đã triển khai

### 1. Design System & Giao diện
- **Chuyên nghiệp & Hiện đại**: Sử dụng bộ màu Honey Yellow (Vàng mật ong) làm chủ đạo, không dùng gradient theo yêu cầu, tạo cảm giác phẳng và sang trọng.
- **Dark/Light Mode**: Đồng nhất toàn bộ hệ thống, tự động lưu lựa chọn người dùng vào `localStorage`.
- **Sidebar & Topbar**: Cố định và đồng nhất giữa tất cả các trang nội bộ.

### 2. Hệ thống các trang (5 Page chính)
- **Tổng quan (Dashboard)**: Hiển thị thống kê nhanh (Hoàn thành, Đang làm, Quá hạn), nhiệm vụ sắp tới và tóm tắt thói quen.
- **Nhiệm vụ (Tasks)**: Bảng quản lý nhiệm vụ chi tiết với bộ lọc (Tất cả, Đang làm, Hoàn thành, Quan trọng).
- **Lập kế hoạch (Planning)**: Giao diện lịch tháng (Calendar) trực quan để sắp xếp công việc theo thời gian.
- **Thói quen (Habits)**: Theo dõi Streak (chuỗi ngày thực hiện) và tiến độ % của từng thói quen trong tuần.
- **Cài đặt (Settings)**: Quản lý thông tin cá nhân, phân quyền và tùy chỉnh giao diện.

### 3. Trang chủ & Xác thực
- **Landing Page**: Giới thiệu các tính năng nổi bật của PlanBee với thiết kế responsive.
- **Login/Register**: Giao diện đăng nhập/đăng ký hiện đại, hỗ trợ lưu trạng thái phiên làm việc (mock token).

## 🚀 Hướng dẫn vận hành

### Frontend
1. Mở terminal và di chuyển vào thư mục `frontend`.
2. Chạy lệnh: `npm install` (nếu chưa chạy).
3. Khởi động server phát triển: `npm run dev`.

### Backend
1. Đảm bảo bạn đã có **MySQL** được cài đặt.
2. Tạo database bằng file `backend/schema.sql`.
3. Cập nhật thông tin database (`DB_USER`, `DB_PASS`) trong file `backend/.env`.
4. Mở terminal và di chuyển vào thư mục `backend`.
5. Chạy lệnh: `npm install` (nếu chưa chạy).
6. Khởi động backend: `node server.js` (hoặc `nodemon server.js`).

---
> [!TIP]
> Bạn có thể nhấn vào biểu tượng **Mặt trăng / Mặt trời** ở Topbar để chuyển đổi giao diện Dark/Light mode ngay lập tức.
