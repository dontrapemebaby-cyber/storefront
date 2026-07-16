-- 0009_lookup_and_product_editor.sql
-- Sửa tra cứu đơn cho dữ liệu số điện thoại cũ/mới và tăng độ ổn định của
-- các truy vấn quản trị sản phẩm. Chạy sau 0008_storefront.sql.

-- Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx. Hàm xử lý cả dữ liệu
-- từng được lưu ở dạng +84, 84, 0084 hoặc có khoảng trắng / dấu chấm / gạch.
create or replace function storefront_normalize_vn_phone(p_phone text)
returns text
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(trim(p_phone), ''), '[^0-9+]', '', 'g');

  if v ~ '^0[0-9]{9}$' then
    return v;
  elsif v ~ '^\+84[0-9]{9}$' then
    return '0' || substr(v, 4);
  elsif v ~ '^0084[0-9]{9}$' then
    return '0' || substr(v, 5);
  elsif v ~ '^84[0-9]{9}$' then
    return '0' || substr(v, 3);
  end if;

  return v;
end;
$$;

revoke execute on function storefront_normalize_vn_phone(text) from public;
grant execute on function storefront_normalize_vn_phone(text) to anon, authenticated;

-- Ghi đè hàm tra cứu hiện tại. Vẫn yêu cầu mã RFQ + số điện thoại và RPC
-- secret, nhưng so sánh số điện thoại sau khi chuẩn hóa ở cả hai phía.
create or replace function storefront_lookup_request(
  p_secret text,
  p_code   text,
  p_phone  text
)
returns table (
  o_code           text,
  o_status         text,
  o_product_name   text,
  o_quantity       int,
  o_created_at     timestamptz,
  o_updated_at     timestamptz,
  o_amount_due     numeric,
  o_payment_kind   text,
  o_payment_status text,
  o_quote_total    numeric,
  o_quote_valid_until date
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not storefront_check_secret(p_secret) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  return query
  select r.code,
         r.status::text,
         coalesce(o.product_name, pt.name_vi, 'Yêu cầu in'),
         r.quantity,
         r.created_at,
         r.updated_at,
         coalesce(o.amount_due, 0),
         coalesce(o.payment_kind, 'none'),
         coalesce(o.payment_status, 'awaiting'),
         q.total,
         q.valid_until
  from print_requests r
  join customers c on c.id = r.customer_id
  left join product_types pt on pt.id = r.product_type_id
  left join storefront_orders o on o.request_id = r.id
  left join quotes q
         on q.request_id = r.id
        and q.is_current = true
        and q.deleted_at is null
        and q.status in ('sent','viewed','accepted')
  where upper(trim(r.code)) = upper(trim(p_code))
    and storefront_normalize_vn_phone(c.phone) = storefront_normalize_vn_phone(p_phone)
    and storefront_normalize_vn_phone(p_phone) ~ '^0[0-9]{9}$'
    and r.deleted_at is null
  order by r.created_at desc
  limit 1;
end;
$$;

revoke execute on function storefront_lookup_request(text, text, text) from public, anon, authenticated;
grant execute on function storefront_lookup_request(text, text, text) to anon;
