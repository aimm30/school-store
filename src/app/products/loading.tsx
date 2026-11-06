import { ProductGridSkeleton } from "@/components/product/ProductCard";

export default function Loading() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-label="Loading products">
      <div className="skeleton mb-6 h-8 w-56" />
      <ProductGridSkeleton />
    </div>
  );
}
