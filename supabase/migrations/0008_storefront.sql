-- =============================================================================
-- 0008_storefront.sql
-- Hạ tầng cho WEBSITE KHÁCH HÀNG (nhain-storefront).
--
-- NGUYÊN TẮC:
--   * CHỈ THÊM MỚI. Không sửa bảng/route/migration 0001–0007 của dashboard.
--   * Không đổi tên bất cứ thứ gì đang chạy.
--   * Yêu cầu in (RFQ) và file KHÔNG được ghi trực tiếp ở đây — chúng đi qua
--     public API của dashboard (/api/public/uploads/*, /api/public/print-requests).
--     Migration này chỉ phục vụ: catalog sản phẩm của website, cấu hình giao
--     diện, cấu hình thanh toán, bản chụp đơn để hiện QR, và tra cứu trạng thái.
--
-- MÔ HÌNH TRUY CẬP:
--   * anon  : CHỈ đọc sản phẩm đã publish + cấu hình website (RLS + grant hẹp).
--   * authenticated (super_admin) : toàn quyền quản trị qua RLS.
--   * backend website : gọi RPC kèm STOREFRONT_RPC_SECRET để ghi bản chụp đơn
--     và tra cứu trạng thái. anon KHÔNG có quyền ghi bảng nào.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. BÍ MẬT DÙNG CHO RPC CỦA BACKEND WEBSITE
-- ---------------------------------------------------------------------------
-- Chỉ lưu HASH (sha256). Giá trị thô nằm trong env STOREFRONT_RPC_SECRET của
-- website, không nằm trong source code và không ra trình duyệt.
create table if not exists storefront_secrets (
  name        text primary key,
  secret_hash text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_storefront_secrets_updated before update on storefront_secrets
  for each row execute function set_updated_at();

alter table storefront_secrets enable row level security;
-- Không policy cho anon/authenticated: bảng này chỉ được đọc bên trong hàm
-- security definer. Kể cả super_admin cũng không đọc hash qua Data API.
revoke all on storefront_secrets from anon, authenticated;

-- Đặt/đổi bí mật. Chỉ super_admin gọi được (kiểm tra bằng is_super_admin()).
create or replace function storefront_set_secret(p_name text, p_secret text)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if not is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_secret is null or length(p_secret) < 32 then
    raise exception 'SECRET_TOO_SHORT' using errcode = 'P0001';
  end if;
  insert into storefront_secrets (name, secret_hash)
  values (p_name, encode(digest(p_secret, 'sha256'), 'hex'))
  on conflict (name) do update set secret_hash = excluded.secret_hash;
end $$;

revoke execute on function storefront_set_secret(text, text) from public, anon;
grant execute on function storefront_set_secret(text, text) to authenticated;

-- So khớp bí mật ở dạng hash, thời gian không đổi theo nội dung.
create or replace function storefront_check_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from storefront_secrets
    where name = 'storefront_rpc'
      and secret_hash = encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex')
  );
$$;
revoke execute on function storefront_check_secret(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. CẤU HÌNH WEBSITE (thương hiệu, giao diện, trang chủ, thanh toán)
-- ---------------------------------------------------------------------------
-- Tách khỏi system_settings của dashboard để không đụng dữ liệu đang chạy.
create table if not exists storefront_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  description text,
  updated_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_storefront_settings_updated before update on storefront_settings
  for each row execute function set_updated_at();

alter table storefront_settings enable row level security;

-- Khách xem website cần đọc cấu hình hiển thị.
create policy storefront_settings_public_read on storefront_settings
  for select to anon using (true);
create policy storefront_settings_staff_read on storefront_settings
  for select to authenticated using (true);
create policy storefront_settings_admin_write on storefront_settings
  for all to authenticated using (is_super_admin()) with check (is_super_admin());

grant select on storefront_settings to anon;
-- Policy RLS không tự cấp quyền bảng: thiếu GRANT thì admin ghi vào sẽ bị
-- "permission denied" dù is_super_admin() trả true. Cấp tường minh thay vì trông
-- vào default privileges của Supabase — quyền phải đọc được ngay trong file này.
grant select, insert, update, delete on storefront_settings to authenticated;

-- ---------------------------------------------------------------------------
-- 3. CATALOG SẢN PHẨM CỦA WEBSITE
-- ---------------------------------------------------------------------------
-- product_type_code trỏ tới product_types.code của dashboard (không sao chép,
-- không đổi tên). Đây là giá trị gửi lên /api/public/print-requests.
create table if not exists storefront_products (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  sku                   text not null unique,
  name                  text not null,
  product_type_code     text not null references product_types(code),

  short_description     text,
  long_description      text,
  image_url             text,
  gallery               jsonb not null default '[]'::jsonb,

  -- Ba loại định giá theo yêu cầu nghiệp vụ.
  pricing_type          text not null default 'QUOTE_REQUIRED'
                        check (pricing_type in ('FIXED_PRICE','QUOTE_REQUIRED','DEPOSIT_REQUIRED')),
  price_from            numeric(14,2),
  price_unit            text,
  pricing               jsonb not null default '{}'::jsonb,  -- cấu hình tính giá (server)
  options               jsonb not null default '[]'::jsonb,  -- các tùy chọn hiển thị + ảnh hưởng giá

  lead_time             text,
  file_guide            text,
  faq                   jsonb not null default '[]'::jsonb,

  needs_quote           boolean not null default true,
  allow_instant_payment boolean not null default false,
  requires_deposit      boolean not null default false,
  deposit_amount        numeric(14,2),

  category              text not null default 'khac',
  service_type          text not null default 'in_an',
  is_featured           boolean not null default false,
  is_published          boolean not null default false,
  sort_order            int not null default 0,

  seo_title             text,
  seo_description       text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index if not exists storefront_products_published_idx
  on storefront_products (is_published, sort_order) where deleted_at is null;
create index if not exists storefront_products_category_idx on storefront_products (category);
create index if not exists storefront_products_type_idx on storefront_products (product_type_code);
create trigger trg_storefront_products_updated before update on storefront_products
  for each row execute function set_updated_at();

alter table storefront_products enable row level security;

-- Khách chỉ thấy sản phẩm đã publish và chưa xóa mềm.
create policy storefront_products_public_read on storefront_products
  for select to anon using (is_published = true and deleted_at is null);
create policy storefront_products_staff_read on storefront_products
  for select to authenticated using (true);
create policy storefront_products_admin_write on storefront_products
  for all to authenticated using (is_super_admin()) with check (is_super_admin());

grant select on storefront_products to anon;
grant select, insert, update, delete on storefront_products to authenticated;

-- ---------------------------------------------------------------------------
-- 4. BẢN CHỤP ĐƠN CỦA WEBSITE (để hiển thị QR và tra cứu)
-- ---------------------------------------------------------------------------
-- Nguồn sự thật của yêu cầu vẫn là print_requests (dashboard). Bảng này chỉ lưu
-- lại thứ dashboard không có: giá đã tính ở server, số tiền cần thanh toán, nội
-- dung chuyển khoản. Không có policy nào cho anon: chỉ ghi/đọc qua RPC có secret.
create table if not exists storefront_orders (
  id                uuid primary key default gen_random_uuid(),
  request_code      text not null unique,           -- mã RFQ do dashboard sinh
  request_id        uuid references print_requests(id) on delete set null,
  product_id        uuid references storefront_products(id) on delete set null,
  product_name      text not null,
  pricing_type      text not null
                    check (pricing_type in ('FIXED_PRICE','QUOTE_REQUIRED','DEPOSIT_REQUIRED')),
  options_snapshot  jsonb not null default '{}'::jsonb,
  price_breakdown   jsonb not null default '{}'::jsonb,
  amount_total      numeric(14,2) not null default 0,
  amount_due        numeric(14,2) not null default 0,   -- số phải trả ngay (toàn bộ hoặc cọc)
  payment_kind      text not null default 'none' check (payment_kind in ('none','full','deposit')),
  payment_reference text,                                -- nội dung chuyển khoản
  payment_status    text not null default 'awaiting'
                    check (payment_status in ('awaiting','reported','confirmed','cancelled')),
  reported_at       timestamptz,
  verified_at       timestamptz,
  verified_by       uuid references profiles(id),
  customer_name     text not null,
  customer_phone    text not null,                       -- đã chuẩn hóa 0xxxxxxxxx
  access_token_hash text not null,                       -- chỉ lưu SHA-256 của token URL
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists storefront_orders_phone_idx on storefront_orders (customer_phone);
create trigger trg_storefront_orders_updated before update on storefront_orders
  for each row execute function set_updated_at();

alter table storefront_orders enable row level security;
revoke all on storefront_orders from anon;

-- Nhân viên xem được để đối soát; chỉ super_admin sửa.
create policy storefront_orders_staff_read on storefront_orders
  for select to authenticated using (is_staff());
create policy storefront_orders_admin_write on storefront_orders
  for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- RLS chỉ giới hạn dòng; authenticated vẫn cần quyền SELECT ở cấp bảng.
grant select on storefront_orders to authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC CHO BACKEND WEBSITE (bắt buộc kèm secret)
-- ---------------------------------------------------------------------------

-- 5.1 Ghi bản chụp đơn sau khi dashboard đã tạo RFQ thành công.
create or replace function storefront_register_order(
  p_secret          text,
  p_request_code    text,
  p_product_id      uuid,
  p_product_name    text,
  p_pricing_type    text,
  p_options         jsonb,
  p_breakdown       jsonb,
  p_amount_total    numeric,
  p_amount_due      numeric,
  p_payment_kind    text,
  p_payment_ref     text,
  p_customer_name   text,
  p_customer_phone  text,
  p_access_token_hash text
)
returns table (o_id uuid, o_request_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_id uuid;
  v_existing   record;
begin
  if not storefront_check_secret(p_secret) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_access_token_hash is null or length(p_access_token_hash) <> 64 then
    raise exception 'INVALID_ACCESS_TOKEN_HASH' using errcode = 'P0001';
  end if;

  -- Bản chụp chỉ hợp lệ khi RFQ thật sự tồn tại trong dashboard.
  select id into v_request_id
  from print_requests
  where code = p_request_code and deleted_at is null;

  if v_request_id is null then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Idempotent: gọi lại với cùng mã RFQ trả về bản ghi đã có, không ghi đè giá.
  select id, request_code into v_existing
  from storefront_orders where request_code = p_request_code;
  if found then
    o_id := v_existing.id;
    o_request_code := v_existing.request_code;
    return next;
    return;
  end if;

  insert into storefront_orders (
    request_code, request_id, product_id, product_name, pricing_type,
    options_snapshot, price_breakdown, amount_total, amount_due,
    payment_kind, payment_reference, customer_name, customer_phone, access_token_hash
  ) values (
    p_request_code, v_request_id, p_product_id, p_product_name, p_pricing_type,
    coalesce(p_options, '{}'::jsonb), coalesce(p_breakdown, '{}'::jsonb),
    coalesce(p_amount_total, 0), coalesce(p_amount_due, 0),
    coalesce(p_payment_kind, 'none'), p_payment_ref, p_customer_name, p_customer_phone, p_access_token_hash
  )
  returning id, request_code into o_id, o_request_code;

  return next;
end $$;

revoke execute on function storefront_register_order(
  text, text, uuid, text, text, jsonb, jsonb, numeric, numeric, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function storefront_register_order(
  text, text, uuid, text, text, jsonb, jsonb, numeric, numeric, text, text, text, text, text
) to anon;

-- 5.2 Đọc đơn để dựng trang thanh toán (backend website gọi, kèm secret).
create or replace function storefront_get_order(p_secret text, p_request_code text, p_access_token text)
returns table (
  o_request_code   text,
  o_product_name   text,
  o_pricing_type   text,
  o_amount_total   numeric,
  o_amount_due     numeric,
  o_payment_kind   text,
  o_payment_ref    text,
  o_payment_status text,
  o_breakdown      jsonb,
  o_options        jsonb,
  o_customer_name  text,
  o_status         text,
  o_created_at     timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if not storefront_check_secret(p_secret) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  return query
  select o.request_code, o.product_name, o.pricing_type, o.amount_total, o.amount_due,
         o.payment_kind, o.payment_reference, o.payment_status, o.price_breakdown,
         o.options_snapshot, o.customer_name, r.status::text, o.created_at
  from storefront_orders o
  join print_requests r on r.id = o.request_id
  where o.request_code = p_request_code
    and o.access_token_hash = encode(digest(coalesce(p_access_token, ''), 'sha256'), 'hex')
    and r.deleted_at is null;
end $$;

revoke execute on function storefront_get_order(text, text, text) from public, anon, authenticated;
grant execute on function storefront_get_order(text, text, text) to anon;

-- 5.3 Khách báo đã chuyển khoản.
create or replace function storefront_report_payment(p_secret text, p_request_code text, p_access_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare v_count int;
begin
  if not storefront_check_secret(p_secret) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  update storefront_orders
     set payment_status = 'reported', reported_at = now()
   where request_code = p_request_code
     and access_token_hash = encode(digest(coalesce(p_access_token, ''), 'sha256'), 'hex')
     and payment_status = 'awaiting'
     and payment_kind <> 'none';
  get diagnostics v_count = row_count;
  return v_count > 0;
end $$;

revoke execute on function storefront_report_payment(text, text, text) from public, anon, authenticated;
grant execute on function storefront_report_payment(text, text, text) to anon;

-- 5.4 Tra cứu trạng thái yêu cầu bằng mã RFQ + số điện thoại.
-- Chỉ trả về đúng những gì khách cần biết; không lộ dữ liệu nội bộ, không lộ
-- file, không cho dò bằng mỗi mã (bắt buộc khớp số điện thoại đã chuẩn hóa).
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
  where upper(r.code) = upper(trim(p_code))
    and c.phone = p_phone
    and r.deleted_at is null
  limit 1;
end $$;

revoke execute on function storefront_lookup_request(text, text, text) from public, anon, authenticated;
grant execute on function storefront_lookup_request(text, text, text) to anon;

-- ---------------------------------------------------------------------------
-- 5.5 LỊCH SỬ VÀ XÁC NHẬN THANH TOÁN CHO SUPER ADMIN
-- ---------------------------------------------------------------------------
create table if not exists storefront_payment_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references storefront_orders(id) on delete cascade,
  old_status  text,
  new_status  text not null,
  note        text,
  changed_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists storefront_payment_history_order_idx
  on storefront_payment_status_history(order_id, created_at desc);

alter table storefront_payment_status_history enable row level security;
create policy storefront_payment_history_staff_read on storefront_payment_status_history
  for select to authenticated using (is_staff());
create policy storefront_payment_history_admin_insert on storefront_payment_status_history
  for insert to authenticated with check (is_super_admin());
grant select, insert on storefront_payment_status_history to authenticated;

create or replace function storefront_admin_set_payment_status(
  p_order_id uuid,
  p_status text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old text;
  v_user uuid := auth.uid();
begin
  if not is_super_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_status not in ('awaiting','reported','confirmed','cancelled') then
    raise exception 'INVALID_PAYMENT_STATUS' using errcode = 'P0001';
  end if;

  select payment_status into v_old
  from storefront_orders
  where id = p_order_id
  for update;

  if v_old is null then
    return false;
  end if;
  if v_old = p_status then
    return true;
  end if;

  update storefront_orders
  set payment_status = p_status,
      verified_at = case when p_status = 'confirmed' then now() else null end,
      verified_by = case when p_status = 'confirmed' then v_user else null end
  where id = p_order_id;

  insert into storefront_payment_status_history(order_id, old_status, new_status, note, changed_by)
  values (p_order_id, v_old, p_status, nullif(trim(coalesce(p_note, '')), ''), v_user);

  return true;
end $$;

revoke execute on function storefront_admin_set_payment_status(uuid, text, text) from public, anon;
grant execute on function storefront_admin_set_payment_status(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. STORAGE CÔNG KHAI CHO ẢNH WEBSITE
-- ---------------------------------------------------------------------------
-- Ảnh sản phẩm/logo là nội dung marketing -> bucket public riêng. File khách gửi
-- vẫn nằm ở 'customer-uploads' (private) và không bị đụng tới.
insert into storage.buckets (id, name, public)
values ('storefront-public', 'storefront-public', true)
on conflict (id) do nothing;

do $$
begin
  create policy storefront_public_read on storage.objects
    for select to public
    using (bucket_id = 'storefront-public');
exception when duplicate_object then null; end $$;

do $$
begin
  create policy storefront_public_insert on storage.objects
    for insert to authenticated
    with check (bucket_id = 'storefront-public' and public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$
begin
  create policy storefront_public_update on storage.objects
    for update to authenticated
    using (bucket_id = 'storefront-public' and public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$
begin
  create policy storefront_public_delete on storage.objects
    for delete to authenticated
    using (bucket_id = 'storefront-public' and public.is_super_admin());
exception when duplicate_object then null; end $$;
