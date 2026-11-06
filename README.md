# SkyGo Admin

Web quản trị cho hệ thống đặt vé máy bay SkyGo: chuyến bay và hạng vé, đơn đặt vé, yêu cầu hủy, xác minh vé QR,
câu hỏi thường gặp, nhắc giờ bay, hộp thư hỗ trợ khách hàng (chat thời gian thực) và quản lý tài khoản.

Xây dựng bằng Umi Max, Ant Design 6 và ProComponents. Gọi backend `skygo-backend` (Spring Boot) qua REST và WebSocket.

## Chạy

```bash
npm install
npm start
```

Mặc định `npm start` gọi `http://localhost:8080/api`. Để gọi backend trên Render, đặt địa chỉ trong `.env.local`
(file này không đưa lên Git):

```
SKYGO_API_BASE_URL=https://skygo-backend.onrender.com/api
```

`npm run build` luôn trỏ về backend trên Render, trừ khi đặt `SKYGO_API_BASE_URL`.

## Cấu trúc

- `src/pages/skygo/`: các trang quản trị (Tổng quan, Đơn đặt vé, Hộp thư hỗ trợ, Chuyến bay...).
- `src/skygo/`: lớp gọi API, kiểu dữ liệu, kết nối WebSocket và tiện ích dùng chung.
- `src/pages/user/login`: đăng nhập bằng mật khẩu và mã OTP.
- `config/routes.ts`: các route, nhóm theo việc (Vận hành, Chuyến bay, Nội dung).

Chi tiết nghiệp vụ và quy ước: `docs/SKYGO_ADMIN.md`, thư mục `.agents/rules/`.

## Kiểm tra

```bash
npm run lint
npm test
```
