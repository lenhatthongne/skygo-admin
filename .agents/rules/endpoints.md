# Ánh xạ màn hình với endpoint

Các path dưới đây tương đối với base URL có `/api`:

| Màn hình | API được backend hỗ trợ |
|---|---|
| Chuyến bay | GET, POST `/admin/flights`; GET, PUT `/admin/flights/{id}` |
| Hạng vé | PUT `/admin/fare-classes/{id}` |
| Đơn đặt vé | GET `/admin/bookings`; GET `/admin/bookings/{id}` |
| Yêu cầu hủy | GET `/admin/cancellation-requests`; POST `/admin/cancellation-requests/{id}/approve` hoặc `/reject` |
| Xác minh QR | POST `/admin/tickets/verify`, body `{qrToken}`; nhận nội dung `SKYGO:...` theo hợp đồng backend |
| FAQ | GET, POST `/admin/faqs`; GET, PUT, DELETE `/admin/faqs/{id}` |
| Hỗ trợ | GET `/admin/support-requests`; GET, PUT `/admin/support-requests/{id}` |
| Danh mục cho form | GET `/airports`, GET `/airlines` |

Backend hiện chưa cung cấp endpoint dashboard thống kê, xóa chuyến hoặc sửa trực tiếp trạng thái đơn. Không tạo nút thao tác gọi endpoint tưởng tượng. Không hiển thị số liệu thống kê giả; chỉ tổng hợp từ dữ liệu có phạm vi xác định và ghi rõ phạm vi nếu người dùng yêu cầu.


## Quản lý tài khoản

- GET `/admin/accounts` hỗ trợ search, role, status, page, size; GET `/admin/accounts/{id}` xem chi tiết.
- PUT `/admin/accounts/{id}/block` body `{reason}` bắt buộc tối đa 500 ký tự; PUT `/admin/accounts/{id}/unblock` không body. Chỉ thao tác trên CUSTOMER; không khóa ADMIN/chính mình.
- Status theo ưu tiên BLOCKED (Admin khóa), LOCKED (khóa tạm do mật khẩu/OTP), UNVERIFIED (chưa xác thực), ACTIVE (hoạt động). Không phải online/offline.
- Mở khóa không xóa khóa tạm hoặc xác thực email. Token và OTP cũ bị thu hồi khi khóa; không tự đổi status thành ACTIVE sau mở khóa.
