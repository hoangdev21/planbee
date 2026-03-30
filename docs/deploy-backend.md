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
| `BACKEND_URL` | `https://<tên-web-service-của-bạn>.onrender.com` |

> [!TIP]
> Biến `BACKEND_URL` rất quan trọng vì nó được sử dụng bởi script `keepAlive.js` (trong `backend/utils`) để tự động "ping" server của bạn mỗi 5 phút, giữ cho server không bị ngủ (sleep) ở gói Free.

## 4. Theo dõi Log
Sau khi nhấn **"Create Web Service"**, hãy theo dõi tab **"Events"** và **"Logs"**. Nếu thấy dòng `Server is running on port 10000` và `[Keep-Alive] Starting pinger...` là deploy thành công.

---
✅ **Hoàn tất!** Backend của bạn đã sống và sẵn sàng phục vụ Frontend.
