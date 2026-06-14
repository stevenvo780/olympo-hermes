/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductSchema from '../ProductSchema';
import axiosServer from '@/utils/axiosServer';

// Mock env for axiosServer (indirectly)
vi.mock('@/utils/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://test.com'
  }
}));

vi.mock('@/utils/axiosServer');

describe('ProductSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing / empty array if fetch fails', async () => {
    (axiosServer.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

    // Call component logic
    const result = await ProductSchema({ storeId: 'test' });

    // It returns <script ... />
    // props.dangerouslySetInnerHTML.__html contains the JSON
    const html = (result as { props: { dangerouslySetInnerHTML: { __html: string } } }).props.dangerouslySetInnerHTML.__html;
    const json = JSON.parse(html);

    expect(json.itemListElement).toEqual([]);
  });

  it('renders products passed as props', async () => {
    const products: any[] = [{ title: 'Prop Product', sku: '123', totalPrice: 1000, stock: 10 }];
    const result = await ProductSchema({ products });
    const html = (result as { props: { dangerouslySetInnerHTML: { __html: string } } }).props.dangerouslySetInnerHTML.__html;
    const json = JSON.parse(html);

    expect(json.itemListElement).toHaveLength(1);
    expect(json.itemListElement[0].item.name).toBe('Prop Product');
  });

  it('fetches products if storeId provided', async () => {
    const productsResponse = {
      data: {
        products: [{ title: 'Fetched Product', sku: '456', totalPrice: 2000, stock: 0 }]
      }
    };
    (axiosServer.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(productsResponse);

    const result = await ProductSchema({ storeId: 'test-store' });
    const html = (result as { props: { dangerouslySetInnerHTML: { __html: string } } }).props.dangerouslySetInnerHTML.__html;
    const json = JSON.parse(html);

    expect(axiosServer.get).toHaveBeenCalledWith('/products/test-store', expect.any(Object));
    expect(json.itemListElement).toHaveLength(1);
    expect(json.itemListElement[0].item.name).toBe('Fetched Product');
    expect(json.itemListElement[0].item.offers.availability).toContain('OutOfStock');
  });
});
