// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  options: Record<string, string>; // e.g. { color: "Red", size: "M" }
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: ProductImage[];
  variants: ProductVariant[];
  categories: Category[];
  rating: number;
  reviewCount: number;
  specs: Record<string, unknown>;
  inStock: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CartItemResponse {
  variantId: string;
  quantity: number;
  variant: ProductVariant;
  product: Product;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  total: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutIntent {
  id: string;
  total: number;
  status: string;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  items: CartItemResponse[];
  shippingAddress: ShippingAddress;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_BASE = '/api/v1';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? res.statusText, body);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ProductListParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export async function getProducts(
  params: ProductListParams = {}
): Promise<PaginatedResponse<Product>> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
  if (params.sort) qs.set('sort', params.sort);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);

  const query = qs.toString();
  return request<PaginatedResponse<Product>>(
    `/products${query ? `?${query}` : ''}`
  );
}

export async function getProduct(id: string): Promise<Product> {
  return request<Product>(`/products/${id}`);
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories');
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export async function getCart(): Promise<CartResponse> {
  return request<CartResponse>('/cart');
}

export async function addToCart(
  variantId: string,
  quantity: number
): Promise<CartResponse> {
  return request<CartResponse>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ variantId, quantity }),
  });
}

export async function updateCartItem(
  variantId: string,
  quantity: number
): Promise<CartResponse> {
  return request<CartResponse>(`/cart/items/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(
  variantId: string
): Promise<CartResponse> {
  return request<CartResponse>(`/cart/items/${variantId}`, {
    method: 'DELETE',
  });
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CreateCheckoutIntentParams {
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  email: string;
}

export async function createCheckoutIntent(
  params: CreateCheckoutIntentParams
): Promise<CheckoutIntent> {
  return request<CheckoutIntent>('/checkout/intent', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function register(
  params: RegisterParams
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<User> {
  return request<User>('/auth/me');
}
