# 💻 Hướng dẫn Deploy Frontend (Vercel)

Dự án PlanBee Frontend được deploy lên **Vercel (Hobby Tier)**.

## 1. Chuẩn bị Repository
1. Dự án của bạn đã được push lên **GitHub** hoặc **GitLab**.
2. Truy cập [Vercel](https://vercel.com/) và đăng nhập.
3. Nhấp vào **"Add New"** -> **"Project"**.
4. Chọn repo PlanBee trong danh sách.

## 2. Cấu hình Vercel
Khi thiết lập Project, hãy điền các thông tin quan trọng sau:
- **Project Name**: `plan-bee-frontend` (hoặc tên tùy thích).
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Cấu hình Rewrite API (khuyến nghị)
Tạo file `frontend/vercel.json` để route API cùng domain và tránh lỗi CORS phía trình duyệt:

```json
{
	"rewrites": [
		{
			"source": "/api/:path*",
			"destination": "https://<tên-backend-trên-render>.onrender.com/api/:path*"
		}
	]
}
```

## 3. Biến môi trường (Environment Variables)
Trong phần **"Environment Variables"** của trình tạo project, hãy thêm biến môi trường sau:

| Tên (Key) | Giá trị (Value) |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://<tên-backend-trên-render>.onrender.com` |

> [!IMPORTANT]
> Biến `VITE_API_BASE_URL` cho phép Frontend Vite của bạn biết được Backend API nằm ở đâu trong môi trường Production. Hãy chắc chắn URL này **KHÔNG** kết thúc bằng dấu `/` (ví dụ: `https://planbee.onrender.com`).

> [!TIP]
> Frontend hiện tại sẽ ưu tiên gọi `https://<domain-frontend>/api/...` trước, sau đó mới fallback sang `VITE_API_BASE_URL`.

## 4. Kiểm tra
Sau khi nhấn **"Deploy"**, Vercel sẽ tự động build và cấp cho bạn một tên miền (domain) kết thúc bằng `.vercel.app`.
1. Nhấp vào link domain của bạn.
2. Kiểm tra xem trang có load không và có thể đăng nhập/đăng ký được không.
3. Nếu gặp lỗi, hãy kiểm tra tab **"Logs"** trên Vercel hoặc Console của Browser (F12).

---
✅ **Hoàn tất!** Dự án PlanBee của bạn đã chính thức được triển khai toàn bộ lên Internet! 🐝✨
