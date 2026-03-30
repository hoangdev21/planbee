# Hướng dẫn Deploy PlanBee lên AWS sử dụng Giao diện (UI)

Tài liệu này hướng dẫn bạn cách deploy ứng dụng PlanBee (Frontend & Backend) lên AWS thông qua AWS Management Console một cách đơn giản nhất.

---

## 1. Chuẩn bị (Prerequisites)
- Tài khoản AWS (Free Tier là đủ).
- Mã nguồn đã được đẩy lên **GitHub**.
- Database: Bạn có thể tiếp tục dùng **TiDB Cloud** hoặc tạo **Amazon RDS (MySQL)** trên AWS. (Khuyên dùng TiDB để tiết kiệm chi phí ban đầu).

---

## 2. Deploy Frontend (Vite) bằng AWS Amplify
AWS Amplify là dịch vụ tốt nhất để deploy các ứng dụng React/Vite.

### Các bước thực hiện:
1. Đăng nhập vào [AWS Console](https://console.aws.amazon.com/).
2. Tìm kiếm **Amplify** và chọn **AWS Amplify**.
3. Nhấp vào **Create new app** -> **GitHub**.
4. Ủy quyền cho AWS truy cập GitHub của bạn và chọn Repository `plan-bee`.
5. **Cấu hình nhánh (Branch):** Chọn nhánh `main` (hoặc nhánh bạn muốn deploy).
6. **Cấu hình Build Settings:**
   - Amplify sẽ tự động nhận diện ứng dụng Vite.
   - Ở phần **Monorepo settings**, tick vào "My app is a monorepo".
   - **App root:** Điền `frontend`.
   - **Environment variables:** Thêm biến `VITE_API_URL` (trỏ đến link Backend sau khi deploy xong ở bước 3).
7. Nhấp **Next** -> **Save and Deploy**.
8. Chờ vài phút để AWS tự động Build và cung cấp một đường link `.amplifyapp.com`.

---

## 3. Deploy Backend (Express) bằng AWS App Runner
App Runner là dịch vụ "serverless" dành cho container hoặc code Node.js, tự động xử lý HTTPS và Scale.

### Các bước thực hiện:
1. Tìm kiếm **App Runner** trong AWS Console.
2. Nhấp **Create service**.
3. **Source and deployment:**
   - **Repository type:** Chọn `Source code repository`.
   - **Connect to GitHub:** Chọn repo `plan-bee`.
   - **Branch:** Chọn `main`.
   - **Deployment settings:** Chọn `Automatic` (tự động redeploy khi push code).
4. **Configure build:**
   - **Runtime:** Chọn `Nodejs 18` (hoặc bản mới nhất có sẵn).
   - **Build command:** `cd backend && npm install`
   - **Start command:** `cd backend && node server.js`
   - **Port:** `5000` (Theo file `server.js` của bạn).
5. **Configure service:**
   - **Service name:** `planbee-backend`.
   - **Environment variables:** Thêm các biến bắt buộc từ file `.env`:
     - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.
     - `JWT_SECRET`.
     - `TELEGRAM_BOT_TOKEN`.
     - `FRONTEND_URL` (Dán link từ AWS Amplify ở bước 2 vào đây).
     - `NODE_ENV`: `production`.
6. Nhấp **Next** -> **Create and Deploy**.
7. Sau khi hoàn tất, bạn sẽ nhận được một **Service URL** (ví dụ: `https://xxxx.awsapprunner.com`).

---

## 4. Kết nối Frontend với Backend
Sau khi có link Backend từ App Runner:
1. Quay lại **AWS Amplify** (Frontend).
2. Vào phần **Environment Variables**.
3. Cập nhật `VITE_API_URL` thành URL của App Runner bạn vừa nhận được.
4. Chạy lại **Redeploy** trong Amplify để áp dụng link mới.

---

## 5. Lưu ý quan trọng
- **CORS:** Đảm bảo `FRONTEND_URL` trong env của Backend khớp chính xác với link Amplify.
- **Database:** Nếu dùng TiDB Cloud, hãy đảm bảo bạn đã whitelist IP của App Runner (hoặc cho phép `0.0.0.0/0` trong giai đoạn test).
- **Chi phí:** App Runner và Amplify có chi phí dựa trên sử dụng. Hãy theo dõi trong Billing Dashboard để tránh phát sinh ngoài ý muốn.

---
**PlanBee Team** - Chúc bạn deploy thành công!
