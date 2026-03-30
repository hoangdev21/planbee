# 🗄️ Hướng dẫn Deploy Database (TiDB)

Dự án PlanBee sử dụng **TiDB Cloud (Serverless Tier)** làm database MySQL-compatible mạnh mẽ và miễn phí.

## 1. Đăng ký & Tạo Cluster
1. Truy cập [TiDB Cloud](https://tidbcloud.com/).
2. Đăng ký tài khoản (miễn phí).
3. Nhấp vào **"Create Cluster"**, chọn **"Serverless"** (Free Tier).
4. Chọn Region gần bạn nhất (ví dụ: Tokyo hoặc Singapore).
5. Sau khi cluster được khởi tạo, nhấn **"Connect"**.

## 2. Lấy thông tin kết nối
Trong modal **Connect**, hãy chọn phương thức kết nối là **Node.js (mysql2)**. Ghi lại các thông tin sau:
- **Host**: (Ví dụ: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
- **Port**: `4000` (mặc định của TiDB)
- **User**: (Ví dụ: `2Bv...root`)
- **Password**: Hãy tự tạo mật khẩu mới nếu chưa có.
- **Database Name**: `planbee_db` (hoặc tên bạn đặt).

> [!IMPORTANT]
> TiDB Serverless bắt buộc phải sử dụng **SSL**. Khi thiết lập Backend trên Render, hãy đảm bảo set biến môi trường `DB_SSL=true`.

## 3. Khởi tạo Schema
Bạn cần chạy file `schema.sql` để tạo các bảng dữ liệu:
1. Trong TiDB Console, chọn tab **"Chat2Query"** hoặc sử dụng một MySQL Client (như DBeaver, TablePlus).
2. Mở file `backend/schema.sql` trong project.
3. Copy toàn bộ nội dung SQL và chạy (Execute) trên cluster TiDB của bạn.
4. Kiểm tra xem các bảng `users`, `tasks`, `habits`, `plans`, `notes`, `reminders`, `notifications` đã được tạo chưa.

---
✅ **Hoàn tất!** Bây giờ bạn đã có database sẵn sàng để Backend kết nối.
