# Plan-Bee 🐝 - Hệ thống quản lý năng suất cá nhân tích hợp AI

**Plan-Bee** là một ứng dụng web hiện đại giúp bạn tối ưu hóa hiệu suất làm việc và xây dựng thói quen tốt thông qua sự hỗ trợ của Trợ lý AI thông minh mang tên **Bee**. Với giao diện trực quan, tính năng mạnh mẽ và khả năng đồng bộ qua Telegram, Plan-Bee là người bạn đồng hành lý tưởng trên con đường đạt được mục tiêu của bạn.

---

## Tính năng nổi bật

### 1. Trợ lý ảo AI (Bee) 
- **Chat trực tiếp**: Trò chuyện với Bee để nhận lời khuyên về năng suất hoặc yêu cầu hỗ trợ.
- **Tự động hóa**: Bee có thể giúp bạn tạo Task, Plan hoặc Habit chỉ qua vài câu lệnh chat nhờ tích hợp Tool Use.
- **Tổng hợp lịch trình**: Yêu cầu Bee liệt kê công việc cần làm trong ngày hoặc kiểm tra các mục quá hạn.

### 2. Quản lý công việc (Tasks) 
- Tạo danh sách việc cần làm (To-do list) với mức độ ưu tiên (High, Medium, Low).
- Theo dõi trạng thái hoàn thành và hạn chót (Due date).

### 3. Lập kế hoạch (Planning) 
- Lên lịch trình chi tiết cho các dự án hoặc sự kiện ngắn hạn/dài hạn.
- Giao diện trực quan, dễ dàng theo dõi dòng thời gian công việc.

### 4. Xây dựng thói quen (Habits) 
- Theo dõi sự tiến bộ hàng ngày, ghi nhận chuỗi ngày duy trì (Streak).
- Nhắc nhở thực hiện thói quen để hình thành kỷ luật bản thân.

### 5. Tích hợp Telegram Bot 
- Nhận thông báo nhắc nhở công việc ngay trên điện thoại.
- Kiểm tra lịch trình nhanh chóng qua ứng dụng Telegram.

### 6. Dashboard & Quản trị (Admin) 
- Hệ thống Dashboard cung cấp cái nhìn tổng quan về tiến độ công việc.
- Trang Admin cho phép quản lý người dùng và cấu hình hệ thống AI.

---

## Công nghệ sử dụng

### Frontend
- **Công nghệ**: Vanilla JavaScript, Vite (Build Tool).
- **Styling**: CSS hiện đại (Glassmorphism, Dark mode ready).
- **Deployment**: Vercel.

### Backend
- **Nền tảng**: Node.js, Express.js.
- **Cơ sở dữ liệu**: MySQL (mysql2).
- **AI Engine**: Groq API (Llama models) - Tích hợp Tool Calling linh hoạt.
- **Notification**: Node-Telegram-Bot-API.
- **Authentication**: JSON Web Token (JWT), BcryptJS.
- **Deployment**: Render.

---

## Cài đặt và Chạy dự án

### Yêu cầu hệ thống
- Node.js (v18 trở lên)
- MySQL Server

### Các bước thực hiện

1. **Clone dự án**:
   ```bash
   git clone https://github.com/hoangdev21/planbee.git
   cd plan-bee
   ```

2. **Cấu hình Backend**:
   - Truy cập thư mục `backend/`.
   - Tạo file `.env` và cấu hình các biến môi trường (Tham khảo `backend/.env` mẫu hoặc xem file schema).
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Cấu hình Frontend**:
   - Truy cập thư mục `frontend/`.
   - Tạo file `.env` với đường dẫn VITE_API_URL.
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## Cấu trúc thư mục

```text
plan-bee/
├── backend/            # Mã nguồn server (API, Controllers, Services)
│   ├── config/         # Cấu hình DB và Middleware
│   ├── controllers/    # Xử lý logic chính (AI, Task, Plan...)
│   ├── routes/         # Định nghĩa các endpoint API
│   └── services/       # Tích hợp dịch vụ ngoài (Telegram API)
├── frontend/           # Mã nguồn giao diện người dùng
│   ├── src/
│   │   ├── pages/      # Các trang tính năng chính
│   │   ├── components/ # Thành phần UI dùng chung
│   │   └── utils/      # Các hàm tiện ích (API call, định dạng ngày)
│   └── public/         # Tài nguyên tĩnh
└── docs/               # Tài liệu hướng dẫn sử dụng và triển khai
```

---

## Về chúng tôi
Dự án được phát triển với mục tiêu mang lại giải pháp quản lý thời gian tối ưu cho người dùng.

---
**Plan-Bee** - *Làm việc thông minh hơn, không phải vất vả hơn!* 🐝
