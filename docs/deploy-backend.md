# 🚀 Hướng dẫn Deploy Backend (Render)

Dự án PlanBee Backend được deploy lên **Render (Web Service Tier)**.

## 1. Chuẩn bị Repository
1. Push project PlanBee của bạn lên **GitHub** hoặc **GitLab**.
2. Trên Render Dashboard, nhấn **"New +"** -> **"Web Service"**.
3. Kết nối với repo GitHub chứa project của bạn.

## 2. Cấu hình Render
Khi tạo Web Service, hãy thiết lập các thông tin sau:
- **Name**: `planbee-backend` (hoặc tên tùy thích).
- **Environment**: `Node`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: `Free`

## 3. Biến môi trường (Environment Variables)
Vào tab **"Environment"** của Web Service trên Render và thêm các biến sau:

| Biến (Key) | Giá trị (Value) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render mặc định) |
| `DB_HOST` | `<Host từ TiDB>` |
| `DB_PORT` | `4000` (TiDB mặc định) |
| `DB_USER` | `<Username từ TiDB>` |
| `DB_PASS` | `<Password từ TiDB>` |
| `DB_NAME` | `<Database Name từ TiDB>` |
| `DB_SSL` | `true` (Bắt buộc cho TiDB) |
| `JWT_SECRET` | `<Một chuỗi ký tự bí mật tùy ý>` |
| `FRONTEND_URL` | `<Link Vercel của bạn sau khi deploy>` |
| `TELEGRAM_BOT_TOKEN` | `<Token từ BotFather>` |
| `TELEGRAM_POLLING_ENABLED` | `false` (khuyên dùng trên Render để tránh lỗi 409 khi có nhiều instance) |
| `START_TELEGRAM_BOT` | `false` nếu đang ưu tiên ổn định API login/register; `true` khi cần bot đầy đủ |
| `START_REMINDER_SERVICE` | `false` nếu cần cô lập lỗi background job; `true` khi muốn bật nhắc lịch |
| `BACKEND_URL` | `https://<tên-web-service-của-bạn>.onrender.com` |

> [!TIP]
> Biến `BACKEND_URL` rất quan trọng vì nó được sử dụng bởi script `keepAlive.js` (trong `backend/utils`) để tự động "ping" server của bạn mỗi 5 phút, giữ cho server không bị ngủ (sleep) ở gói Free.

> [!WARNING]
> Nếu log hiển thị `ETELEGRAM: 409 Conflict: terminated by other getUpdates request`, nghĩa là có hơn một tiến trình bot đang polling cùng một token. Hãy để `TELEGRAM_POLLING_ENABLED=false` trên Render (send-only mode) hoặc chỉ bật `true` ở đúng một instance duy nhất.

> [!TIP]
> Khi gặp `521 Web server is down`, hãy tạm đặt `START_TELEGRAM_BOT=false` và `START_REMINDER_SERVICE=false` để xác nhận API core (login/register) chạy ổn trước, sau đó bật lại từng service một.

## 4. Theo dõi Log
Sau khi nhấn **"Create Web Service"**, hãy theo dõi tab **"Events"** và **"Logs"**. Nếu thấy dòng `Server is running on port 10000` và `[Keep-Alive] Starting pinger...` là deploy thành công.

---
✅ **Hoàn tất!** Backend của bạn đã sống và sẵn sàng phục vụ Frontend.
