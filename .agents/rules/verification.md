# Kiểm chứng và bàn giao

- Chạy các lệnh kiểm tra có sẵn trong package.json phù hợp với thay đổi: build, typecheck, lint và test liên quan. Không tự đổi package manager hoặc nâng dependency ngoài yêu cầu.
- Với Ant Design Pro này, dùng `npm run build`, `npm run lint` (Biome + TypeScript), `npx antd lint ./src`; chạy `npm run test` cho test liên quan. Hai lệnh lint phải đạt trước khi commit. Nếu được yêu cầu commit, dùng Conventional Commits; không tự commit khi chưa được yêu cầu.
- Kiểm tra luồng mật khẩu → OTP → role ADMIN, route bảo vệ, phân trang, lọc, form chỉnh sửa và lỗi API. Chỉ kiểm thử ghi dữ liệu trên dữ liệu test đã được cho phép.
- Không chạy toàn bộ collection có thao tác ghi hoặc gửi email thật khi chưa kiểm tra phạm vi tác động.
- Báo rõ màn hình nào đã nối API, kiểm tra nào đã chạy và phần nào còn cần backend/tài khoản Admin thật. Không tuyên bố tích hợp thành công nếu chỉ build với mock.
