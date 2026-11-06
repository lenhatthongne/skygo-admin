# SkyGo Admin

Frontend dùng Umi Max, Ant Design Pro và `request` từ `@umijs/max`. Hợp đồng được đối chiếu với controller, DTO và tài liệu trong `../skygo-backend`. Không thay đổi backend hoặc service sinh tự động.

## Chạy local

1. Dùng Node >= 22 và dependency theo `package-lock.json` (`npm ci` nếu chưa cài).
2. Sao chép `.env.example` thành `.env.local` nếu cần đổi `SKYGO_API_BASE_URL`. Giá trị mặc định là `http://localhost:8080/api`; biến này được đưa vào bundle lúc dev/build, không chứa secret.
3. Khởi động backend và cấu hình gửi email OTP theo `docs/EMAIL_OTP.md` của backend.
4. Chạy `npm run dev`, mở địa chỉ Umi thông báo (mặc định `http://localhost:8000`). Backend cần cho phép origin này trong `CORS_ALLOWED_ORIGINS`. Không tắt CORS/bảo mật trình duyệt.
5. Nhập email và mật khẩu của tài khoản ADMIN, sau đó nhập OTP từ email. Không dùng tài khoản demo của template. Với challenge REGISTER, xác thực email rồi đăng nhập lại để nhận OTP LOGIN mới.

Mock bị tắt trong cấu hình Umi cho toàn bộ các lệnh khởi động. Các routes mẫu, dashboard và quản lý tài khoản không nằm trong menu/routes SkyGo. Chưa có endpoint dashboard, quản lý người dùng, xóa chuyến hoặc sửa trực tiếp trạng thái đơn.

JWT chỉ nằm trong bộ nhớ: reload cần đăng nhập lại. Đăng xuất và 401 ở API được bảo vệ xóa phiên và dữ liệu trong bộ nhớ bằng tải lại trang đăng nhập. Không có refresh token hoặc endpoint logout. 401 ở bước mật khẩu/OTP giữ người dùng tại form.

## Màn hình và API

Các path dưới đây tương đối với base URL đã có `/api`:

| Route frontend | API |
|---|---|
| `/flights` | GET/POST `/admin/flights`, GET/PUT `/admin/flights/{id}`, PUT `/admin/fare-classes/{id}`, GET `/airports`, GET `/airlines` |
| `/bookings` | GET `/admin/bookings`, GET `/admin/bookings/{id}` |
| `/cancellations` | GET `/admin/cancellation-requests`, POST `/{id}/approve` hoặc `/{id}/reject` dưới path đó; GET chi tiết đơn |
| `/tickets` | POST `/admin/tickets/verify` với nội dung QR dán vào form |
| `/faqs` | GET/POST `/admin/faqs`, GET/PUT/DELETE `/admin/faqs/{id}` |
| `/support` | GET `/admin/support-requests`, GET/PUT `/admin/support-requests/{id}` |

Tất cả routes nghiệp vụ dùng `canAdmin` theo `currentUser.role === 'ADMIN'`. Backend vẫn quyết định phân quyền. Form lấy chi tiết mới trước khi sửa; PUT chuyến giữ toàn bộ hạng vé hiện có. Số tiền gửi dưới dạng số nguyên VND; giờ bay hiển thị và nhập theo giờ Việt Nam. Danh sách phân trang từ 0 ở API, từ 1 ở UI, size tối đa 100. Lỗi mạng được hiển thị riêng với trạng thái rỗng; lỗi field từ ProblemDetail được ánh xạ vào form.

## Kiểm tra

```sh
npm run build
npm run lint
npx antd lint ./src --format json
PLAYWRIGHT_CHANNEL=chrome npm run test -- src/access.test.ts src/app.test.tsx src/requestErrorConfig.test.ts src/skygo src/pages/user/login/index.test.tsx
```

`PLAYWRIGHT_CHANNEL=chrome` dùng Google Chrome đã cài. Có thể bỏ biến này khi máy đã cài Chromium của Playwright. Các test dùng fixture riêng trong test, không gửi OTP hoặc sửa dữ liệu backend thật.

Để kiểm thử thực tế cần backend hoạt động, tài khoản ADMIN nhận được email và dữ liệu test được phép chỉnh sửa. Nhập mật khẩu/OTP trực tiếp tại giao diện; không đưa chúng vào biến môi trường frontend hoặc commit. Build và unit/component test không chứng minh API thật đang kết nối thành công.

## Quản lý tài khoản

Mở mục **Tài khoản** trên menu (`/accounts`) sau khi đăng nhập ADMIN. Trang dùng API thật `/api/admin/accounts`: tổng quan toàn bộ tài khoản theo trạng thái, bảng phân trang, tìm tên/email, lọc role/status và ngăn chi tiết. Số liệu tổng quan không bị giới hạn theo bộ lọc của bảng.

Khách hàng có thao tác khóa (bắt buộc lý do) hoặc mở khóa qua hộp thoại xác nhận. Tài khoản ADMIN/chính mình không có nút khóa. Sau mở khóa, trạng thái lấy lại từ backend vì tài khoản có thể vẫn bị khóa tạm hoặc chưa xác thực email. Không hỗ trợ tạo/xóa/đổi role do API không cung cấp.

Kiểm tra bằng Node >=22 (trên máy hiện tại có Node 24 qua nvm). Test trang: `PLAYWRIGHT_CHANNEL=chrome npm run test -- src/pages/skygo/Accounts.test.tsx`; Chrome channel dùng trình duyệt sẵn có khi thiếu Chromium của Playwright. Dữ liệu mock chỉ có trong test. Phiên đăng nhập hiện lưu trong bộ nhớ nên tải lại trang cần đăng nhập lại; điều hướng bằng menu giữ phiên.
