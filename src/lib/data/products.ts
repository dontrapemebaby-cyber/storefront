import 'server-only';
// src/lib/data/products.ts
// Đọc catalog sản phẩm. RLS đã lọc sẵn: anon chỉ thấy sản phẩm is_published và
// chưa xóa mềm, nên các hàm ở đây không cần lặp lại điều kiện đó.
import { cache } from 'react';
import { createSupabaseAnonClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { PRODUCT_COLUMNS, mapProduct, type ProductRow } from '@/lib/data/mappers';
import type { Product } from '@/types/storefront';

export const getPublishedProducts = cache(async (): Promise<Product[]> => {
  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
      .from('storefront_products')
      .select(PRODUCT_COLUMNS)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
  } catch (error) {
    console.error('[products] không đọc được danh sách:', error);
    return [];
  }
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  try {
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
      .from('storefront_products')
      .select(PRODUCT_COLUMNS)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProduct(data as unknown as ProductRow) : null;
  } catch (error) {
    console.error('[products] không đọc được sản phẩm:', error);
    return null;
  }
});

export const getFeaturedProducts = cache(async (limit = 6): Promise<Product[]> => {
  const all = await getPublishedProducts();
  const featured = all.filter((p) => p.isFeatured);
  return (featured.length ? featured : all).slice(0, limit);
});

/** Sản phẩm liên quan: cùng nhóm trước, thiếu thì bù bằng sản phẩm khác. */
export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const all = await getPublishedProducts();
  const others = all.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

/** Dùng cho trang quản trị: thấy cả sản phẩm chưa publish (RLS cho staff đọc). */
export async function getAllProductsForAdmin(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('storefront_products')
    .select(PRODUCT_COLUMNS)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[products] admin không đọc được danh sách:', error);
    return [];
  }
  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}
