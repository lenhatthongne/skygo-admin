# Nguồn hợp đồng API

Backend tham chiếu trong máy hiện tại: `/Users/lenhatthong/React/Demo/skygo-backend`. Nếu không truy cập được đường dẫn này, dùng OpenAPI của backend được cấu hình; nếu cả hai đều chưa có, yêu cầu thông tin hợp đồng còn thiếu trước khi triển khai phần phụ thuộc.

Đọc từ backend:

- `docs/API.md`, `docs/EMAIL_OTP.md`, `postman/README.md`.
- `src/main/java/com/skygo/controller/admin/` và `controller/auth/AuthController.java`.
- `dto/request/`, `dto/response/`, `config/SecurityConfiguration.java` và service liên quan khi cần xác định quy tắc.
- OpenAPI local: `http://localhost:8080/v3/api-docs`; Swagger: `http://localhost:8080/swagger-ui.html`.

Schema và phân quyền thực tế phải được kiểm tra từ code/OpenAPI. Không coi ví dụ trong tài liệu là dữ liệu thật. Không đọc hoặc sao chép secret trong `.env` backend sang frontend.

