# Sửa tra cứu đơn và trang chỉnh sửa sản phẩm

## Những phần đã sửa

1. Tra cứu đơn chuẩn hóa số điện thoại ở cả dữ liệu cũ và dữ liệu mới:
   - `0973119122`
   - `84973119122`
   - `+84973119122`
   - `0084973119122`
   - số có khoảng trắng, dấu chấm hoặc gạch ngang.
2. API không còn biến lỗi RPC/secret thành thông báo sai rằng đơn không tồn tại.
3. Trang sửa sản phẩm đọc trực tiếp theo ID, không tải toàn bộ catalog.
4. Lỗi tạm thời ở bảng `product_types` không còn làm sập trang sửa sản phẩm.
5. Bổ sung error boundary và nút thử lại cho trang sửa sản phẩm.

## Migration cần chạy

Nếu Supabase đã chạy `0008_storefront.sql`, chạy tiếp:

```text
supabase/migrations/0009_lookup_and_product_editor.sql
```

Không chạy lại `0001`–`0008`.

## Đồng bộ STOREFRONT_RPC_SECRET

Lấy đúng giá trị `STOREFRONT_RPC_SECRET` đang đặt trên Netlify storefront, rồi chạy trong Supabase SQL Editor:

```sql
insert into storefront_secrets (name, secret_hash)
values (
  'storefront_rpc',
  encode(digest('DAN_CHUOI_STOREFRONT_RPC_SECRET_O_DAY', 'sha256'), 'hex')
)
on conflict (name) do update
set secret_hash = excluded.secret_hash,
    updated_at = now();
```

Không thêm dấu `< >`. Sau khi thay secret trên Netlify phải deploy lại.

## Test

1. Mở `/tra-cuu`.
2. Nhập mã RFQ và đúng số điện thoại đặt đơn.
3. Mở `/admin/products` và bấm biểu tượng cây bút.
4. Sửa tên hoặc mô tả nhỏ, bấm lưu, tải lại trang và kiểm tra dữ liệu còn nguyên.
