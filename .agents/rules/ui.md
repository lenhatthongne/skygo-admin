# UI Ant Design

- Tái sử dụng layout/menu/theme có sẵn, Table, Form, Modal/Drawer, Select, DatePicker, InputNumber, Tag và thông báo theo phiên bản đã cài.
- Giữ đầy đủ loading, lỗi, rỗng, thành công; không hiển thị lỗi mạng như danh sách rỗng bình thường.
- Form lấy chi tiết hiện tại trước khi sửa; ánh xạ lỗi validation vào field nếu có thể. Khi thất bại giữ dữ liệu người dùng đã nhập.
- Xác nhận trước xóa FAQ hoặc duyệt/từ chối hủy. Chỉ hiện thao tác hủy phù hợp trạng thái; server kiểm tra cuối cùng.
- Sau thao tác thành công, cập nhật hoặc tải lại dữ liệu liên quan. Tránh response cũ ghi đè kết quả bộ lọc mới khi request chạy đồng thời.
- Với body rỗng hoặc HTTP 204, không cố parse JSON. Không hiển thị token hoặc thông tin nhạy cảm trong thông báo.

