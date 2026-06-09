export type ServiceCatalog = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  vehicleType: "MOTOR" | "MOBIL";
  price: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  category?: { id: string; name: string } | null;
};

export type Sparepart = {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  brand: string;
  description: string;
  vehicleType: "MOTOR" | "MOBIL";
  stock: number;
  minStock: number;
  sellPrice: number;
  isActive: boolean;
  category?: { id: string; name: string } | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
};

const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api";

function toQueryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return query.toString();
}

async function fetchList<T>(path: string): Promise<ApiListResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data katalog");
  }

  return response.json() as Promise<ApiListResponse<T>>;
}

export function fetchServiceCatalogs(params: {
  search?: string;
  categoryId?: string;
  vehicleType?: string;
  page?: string;
  limit?: string;
}) {
  const query = toQueryString({
    search: params.search,
    categoryId: params.categoryId,
    vehicleType: params.vehicleType,
    page: params.page || "1",
    limit: params.limit || "12",
  });
  return fetchList<ServiceCatalog>(`/public/service-catalogs?${query}`);
}

export function fetchSpareparts(params: {
  search?: string;
  categoryId?: string;
  brand?: string;
  vehicleType?: string;
  page?: string;
  limit?: string;
}) {
  const query = toQueryString({
    search: params.search,
    categoryId: params.categoryId,
    brand: params.brand,
    vehicleType: params.vehicleType,
    page: params.page || "1",
    limit: params.limit || "12",
  });
  return fetchList<Sparepart>(`/public/spareparts?${query}`);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
