# AGENTS.md — SkyGo Admin Frontend

Hướng dẫn triển khai được chia theo chủ đề tại [`.agents/rules`](.agents/rules/). Các file này là một phần của hướng dẫn dự án và áp dụng trên toàn bộ repository.

## Cách đọc quy tắc

- Luôn đọc [Phạm vi và nguyên tắc chung](.agents/rules/scope.md) trước khi làm việc.
- Trước khi sửa code, đọc [Quy ước dự án và lớp gọi API](.agents/rules/project-and-api.md) và [Kiểm chứng, bàn giao](.agents/rules/verification.md).
- Đọc thêm các quy tắc liên quan đến công việc bên dưới trước khi triển khai. Luôn đối chiếu hợp đồng backend khi code thay đổi.

| Chủ đề | File quy tắc |
|---|---|
| Nguồn hợp đồng API và bảo mật thông tin backend | [api-contract.md](.agents/rules/api-contract.md) |
| Đăng nhập mật khẩu, OTP, phiên và phân quyền Admin | [authentication.md](.agents/rules/authentication.md) |
| Màn hình và endpoint được backend hỗ trợ | [endpoints.md](.agents/rules/endpoints.md) |
| Phân trang, bộ lọc, DTO và dữ liệu form | [data-and-forms.md](.agents/rules/data-and-forms.md) |
| Component Ant Design và trạng thái giao diện | [ui.md](.agents/rules/ui.md) |
