# Dữ liệu, bộ lọc và form

- API phân trang trả `{content,page,size,totalElements}`. Ant Design Table dùng trang bắt đầu từ 1; gửi backend `page = current - 1`, `size = pageSize`, gán `total = totalElements`. Size tối đa 100. Reset về trang đầu khi đổi bộ lọc.
- Chuyến bay: `flightNumber,status,from,to,date,sort,page,size`; sort chỉ `departure|flightNumber`.
- Đơn: `bookingCode,status,date,page,size`; date là ngày khởi hành.
- Hủy: `status=PENDING|APPROVED|REJECTED`. Hỗ trợ: `status=OPEN|ANSWERED|CLOSED`.
- Trạng thái đơn: `PENDING_PAYMENT|PAYMENT_FAILED|CONFIRMED|CANCEL_REQUESTED|CANCELLED|EXPIRED`. Có thể dịch nhãn tiếng Việt, giữ nguyên giá trị gửi API.
- Tiền là số nguyên VND; hiển thị theo locale Việt Nam, không gửi chuỗi đã định dạng hoặc tự nhân/chia 100.
- `departureAt`, `arrivalAt` là Instant: gửi ISO-8601 có múi giờ, hiển thị giờ Việt Nam. Bộ lọc `date` gửi `YYYY-MM-DD` theo giờ Việt Nam, không đổi ngày qua UTC ngoài ý muốn.
- Lấy mã sân bay/hãng và ID từ API. Booking ID là UUID; các ID số phải theo đúng DTO, không tự chuyển mọi ID thành số.
- FlightRequest: `flightNumber,airlineCode,originCode,destinationCode,departureAt,arrivalAt,status,fareClasses`. Status `SCHEDULED|DELAYED|CANCELLED`.
- FareRequest: `classCode,baseFare,taxFee,childRatePct,infantRatePct,infantFee,cabinBaggageKg,checkedBaggageKg,refundable,cancelFee,totalSeats`. Class `ECO_SAVER|ECO_FLEX|BUSINESS`. Đọc DTO để áp dụng đầy đủ giới hạn validation.
- PUT chuyến bay phải gửi đầy đủ các hạng đã có; không làm mất hạng khi chỉnh sửa. PUT hạng vé không đổi `classCode`. Không cho giảm số ghế trái ràng buộc backend; hiển thị lỗi `SEATS_BELOW_SOLD` khi gặp.
- FAQ gửi `{category,question,answer,sortOrder,visible}`. Phản hồi hỗ trợ gửi `{adminReply,status}` với status `ANSWERED|CLOSED`.
- Payload cập nhật tạo từ request DTO, không gửi nguyên response có field chỉ đọc. Boolean phải giữ được giá trị false; số 0 hợp lệ không được lọc mất.

