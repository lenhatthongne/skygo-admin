# Đăng nhập Admin bằng mật khẩu và OTP

1. `POST /auth/login` body `{email,password}` trả `{challengeId,email,purpose,expiresAt,resendAfterSeconds}`; bước này chưa có token.
2. Hiện form nhập OTP 6 số, giữ mã dưới dạng chuỗi để bảo toàn số 0 đầu.
3. Với purpose `LOGIN`, gọi `POST /auth/login/verify` body `{challengeId,code}`. Response `{accessToken,tokenType,expiresIn,role,user}`.
4. Chỉ cho vào giao diện Admin nếu `role === 'ADMIN'`. Tài khoản CUSTOMER phải nhận thông báo không có quyền.
5. Nếu purpose `REGISTER`, xác thực qua `POST /auth/register/verify`, sau đó quay lại luồng đăng nhập để nhận OTP LOGIN mới; không coi xác thực đăng ký là đã đăng nhập.
6. Gửi lại: `POST /auth/otp/resend` body `{challengeId}`. Cập nhật challenge mới, xóa OTP cũ và dùng countdown từ response. Không tự động gửi mã khi component render lại.
7. Khi có token, có thể gọi `GET /auth/me` để xác minh phiên và role. Bảo vệ cả route trực tiếp lẫn menu. Backend vẫn là nơi quyết định quyền.

Giữ cơ chế lưu phiên an toàn hiện có; nếu chưa có, ưu tiên token trong bộ nhớ và đăng nhập lại khi reload, không tự thêm lưu bền vĩnh viễn. Đăng xuất xóa token và dữ liệu cache của phiên. Không có refresh token hoặc endpoint logout theo thiết kế hiện tại.

401 ở API đã bảo vệ: xóa phiên và chuyển về đăng nhập, tránh vòng lặp. 401 ở form đăng nhập/OTP: hiện lỗi tại form. 403: thông báo không đủ quyền. Xử lý OTP hết hạn, sai mã và rate limit theo `code`, countdown/retryAfterSeconds khi backend trả về.

