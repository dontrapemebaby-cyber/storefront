import 'server-only';
// src/lib/data/product-types.ts
// Đọc bảng product_types của dashboard.
//
// Cố tình ĐỌC THẲNG thay vì chép cứng danh sách vào code: product_type_code là
// thứ website gửi lên /api/public/print-requests, và dashboard sẽ từ chối yêu cầu
// nếu mã không tồn tại. Chép cứng nghĩa là dashboard thêm loại sản phẩm mới thì
// website không thấy, còn dashboard bỏ một loại thì admin vẫn chọn được một mã
// đã chết — và lỗi chỉ lộ ra khi khách thật bấm gửi.
//
// RLS của dashboard (0002_rls.sql) cho phép mọi nhân viên đọc bảng này, nên chỉ
// dùng được ở khu quản trị khi đã đăng nhập.
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface ProductType {
  code: string;
  nameVi: string;
  needsSurvey: boolean;
  canQuoteRemote: boolean;
}

export async function getProductTypes(): Promise<ProductType[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('product_types')
    .select('code, name_vi, needs_survey, can_quote_remote')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[product-types] không đọc được từ dashboard:', error);
    return [];
  }

  return (data as { code: string; name_vi: string; needs_survey: boolean; can_quote_remote: boolean }[]).map((row) => ({
    code: row.code,
    nameVi: row.name_vi,
    needsSurvey: row.needs_survey,
    canQuoteRemote: row.can_quote_remote,
  }));
}
