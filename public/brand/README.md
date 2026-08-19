# Bộ tài nguyên thương hiệu LiveHub

## Bảng màu

- Cam chủ đạo: `#f97316`
- Cam đậm: `#ea580c`
- Kem: `#fff7ed`
- Màu chữ chính: `#171717`

Logo chính thức sử dụng chất liệu màu cam nguyên bản được nhúng trong hình ảnh. Không vẽ lại logo; khi cần đặt trên nền cam hoặc nền tối, chỉ dùng biến thể trắng có sẵn trong bộ tài nguyên này.

## Danh sách tệp

- `livehub-logo-full.png` — logo chuẩn 500×500 RGBA, được sao chép nguyên vẹn từng byte từ `public/Logo.png`.
- `livehub-logo-256.png` — phiên bản logo đầy đủ 256×256 RGBA, dùng cho giao diện nhỏ gọn và tài liệu.
- `livehub-mark.png` — biểu tượng hình học 334×336 RGBA được cắt sát, không gồm chữ nhỏ, dùng để tạo icon.
- `livehub-logo-white.png` — phiên bản logo đầy đủ màu trắng 500×500 RGBA, dành cho nền tối hoặc nền cam.
- `livehub-mark-white.png` — biểu tượng hình học màu trắng 334×336 RGBA, dành cho footer, thanh điều hướng tối và lớp phủ trên ảnh.
- `livehub-social-card.jpg` — ảnh mạng xã hội 1200×630, được ghép từ `public/BG.jpg` cùng logo chính thức nguyên bản và chừa khoảng trống để nền tảng hiển thị nội dung.
- `livehub-background-1920x1080.png` — ảnh nền chiến dịch không mất dữ liệu theo bảng màu cam của LiveHub.
- `3d/livehub-camera-3d.png` — máy quay livestream 3D 1214×1295 RGBA với nền trong suốt.
- `3d/livehub-microphone-3d.png` — micro phát sóng 3D 1536×1024 RGBA với nền trong suốt.
- `3d/livehub-production-kit-3d.png` — bộ điều khiển sản xuất livestream 3D 1536×1024 RGBA với nền trong suốt.
- `3d/livehub-customer-flow-3d.png` — luồng khách hàng tìm dịch vụ và gửi yêu cầu thuê, 1536×1024 RGBA.
- `3d/livehub-provider-flow-3d.png` — luồng nhà cung cấp đăng dịch vụ và ứng tuyển, 1536×1024 RGBA.
- `3d/livehub-moderation-flow-3d.png` — luồng LiveHub duyệt nội dung, kiểm tra lịch và kết nối, 1536×1024 RGBA.
- `3d/PROMPTS.md` — chế độ và prompt ImageGen của toàn bộ minh hoạ 3D.
- `../BG.jpg` — ảnh nền chiến dịch màu cam 1920×1080, dùng cho phần mở đầu và chân trang của trang đích.
- `../icon-192.png` — icon manifest 192×192 RGB trên nền kem, biểu tượng 132px được căn giữa.
- `../icon-512.png` — icon manifest 512×512 RGB trên nền kem, biểu tượng 352px được căn giữa.
- `../icon-maskable.png` — icon maskable 512×512 RGB trên nền kem, biểu tượng 288px được căn giữa trong vùng an toàn rộng.

## Hướng dẫn sử dụng

- Dùng logo đầy đủ khi phần chữ vẫn hiển thị rõ ràng.
- Dùng biểu tượng đã cắt cho favicon, icon ứng dụng và các nút điều khiển hình vuông kích thước nhỏ.
- Dùng các biến thể màu trắng trên nền cam, nền tối hoặc ảnh có độ tương phản cao; không dùng trên nền sáng.
- Có thể đặt minh hoạ 3D trên thẻ nội dung màu cam, kem hoặc đen. Giữ nguyên tỷ lệ và chừa khoảng thở quanh vật thể.
- Landing dùng `livehub-customer-flow-3d.png`, `livehub-provider-flow-3d.png` và `livehub-microphone-3d.png`; ảnh kiểm duyệt được giữ lại cho tài liệu quy trình.
- Giữ khoảng trống an toàn quanh biểu tượng và duy trì nền kem cho các icon manifest.
- Dùng `livehub-social-card.jpg` làm ảnh Open Graph tại đường dẫn `/brand/livehub-social-card.jpg`.
