# Cấu hình và lớp gọi API

### Quy ước Ant Design Pro của frontend này

- Stack theo hướng dẫn dự án: Umi Max v4, antd v6, ProComponents v3, TypeScript strict, Node >= 22, npm và `package-lock.json`. Đối chiếu package.json trước khi triển khai; không tự nâng phiên bản.
- Dùng `request` từ `@umijs/max`, cấu hình chung tại `src/requestErrorConfig.ts`; không thêm Axios. API viết tay đặt trong `service.ts` theo trang hoặc module riêng theo cấu trúc hiện có.
- Không sửa `src/services/ant-design-pro/` vì là code sinh tự động. Chỉ chạy `npm run openapi` sau khi xác minh cấu hình trỏ đúng schema SkyGo và kiểm tra phạm vi file sẽ bị ghi đè.
- Routes tại `config/routes.ts`, cấu hình tại `config/config.ts`. Nối `name` của route với key `menu.xxx` trong locale; dùng `access` để kiểm soát menu và route.
- Session/currentUser dùng `getInitialState` trong `src/app.tsx` và `useModel('@@initialState')`. Thay lời gọi mẫu `GET /api/currentUser` bằng `GET /auth/me` tương đối với base URL SkyGo. Không giữ request mẫu chạy song song.
- Sửa `src/access.ts` để `canAdmin` kiểm tra role thật `currentUser.role === 'ADMIN'` theo UserResponse backend; không dùng điều kiện mẫu `currentUser.access === 'admin'`. Đồng bộ type currentUser với DTO thật.
- Thay luồng đăng nhập mẫu bằng mật khẩu + OTP bên dưới. Không dùng tài khoản mock `admin/ant.design` hoặc giả lập đăng nhập thành công.
- Chạy `npm run dev` để tích hợp API thật; theo hướng dẫn dự án, `npm start` bật mock. Kiểm tra `mock/`, `src/pages/**/_mock.ts` và proxy để request SkyGo không bị handler mẫu chặn hoặc chuyển nhầm server.
- ProTable `request` cần chuyển PageResponse thành `{data: response.content, success: true, total: response.totalElements}`; gửi `page=(params.current ?? 1)-1`, `size=params.pageSize ?? 20`. Khi lỗi phải thể hiện lỗi, không trả success giả.
- Dùng `useModel` cho state theo quy ước sẵn có; chỉ dùng React Query nếu dự án có nhu cầu và dependency phù hợp.
- Giữ i18n qua `useIntl().formatMessage`. Ưu tiên Tailwind v4 cho layout, antd-style/createStyles cho theme, rồi CSS Modules; Less chỉ cho phần legacy.
- Trước khi viết code component antd, chạy `npx antd info <Component>` để xem API phiên bản đang dùng. Chỉ dùng Biome, không thêm ESLint/Prettier.
- Không sửa file sinh trong `.umi`. Không chạy `npm run simple` trong công việc tích hợp này vì có thể xóa cấu trúc dự án. Không tự nâng cấp template hoặc cài skill Claude chỉ để nối API.
- Thay đổi tối thiểu, không thêm chức năng suy đoán; làm rõ điểm thiếu hợp đồng trước phần triển khai phụ thuộc và tiếp tục các phần độc lập.

- Base URL local mặc định `http://localhost:8080/api`. Đưa vào biến môi trường theo công cụ build đang dùng; nếu dùng Vite, có thể dùng `VITE_API_BASE_URL`. Tạo `.env.example` không chứa secret.
- Biến môi trường frontend là dữ liệu công khai. Không đưa DB password, SMTP password, JWT secret hoặc mật khẩu Admin vào đó.
- Dùng HTTP client hiện có; tập trung base URL, header và xử lý lỗi tại một nơi. Tách API service theo chức năng, không rải URL/request trong component trình bày.
- Nếu base URL đã có `/api`, service dùng `/admin/flights`, `/auth/login`… để tránh `/api/api`.
- Gửi JSON camelCase và `Authorization: Bearer <accessToken>` sau đăng nhập. Không gửi token qua URL hoặc log.
- Dùng DTO/type khớp response thật. Không giả định có wrapper `{data: ...}` nếu API trả trực tiếp đối tượng hoặc PageResponse.
- Lỗi dùng `application/problem+json`: đọc `status`, `code`, `detail`, `errors` khi có. Không giả định mọi lỗi đều có đủ trường.
- Không tự retry thao tác ghi như tạo chuyến, duyệt hủy, gửi OTP. Chặn submit lặp và hiển thị trạng thái đang xử lý.
- Nếu lỗi CORS, kiểm tra origin frontend đã nằm trong `CORS_ALLOWED_ORIGINS` backend. Báo cấu hình cần chỉnh; không tắt bảo mật trình duyệt hoặc dùng `no-cors`.

