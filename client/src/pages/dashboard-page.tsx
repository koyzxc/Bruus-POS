import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import ProductCard from "@/components/ProductCard";
import ProductManagement from "@/components/ProductManagement";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  const { user } = useAuth();
  
  // Fetch products by category
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", activeCategory],
  });
  
  // Loading skeleton for products
  const ProductSkeleton = () => (
    <div className="rounded-xl overflow-hidden bg-white shadow-md">
      <div className="h-32 w-full">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="p-2 text-center">
        <Skeleton className="h-6 w-3/4 mx-auto" />
      </div>
    </div>
  );
  
  // Check if user is authorized to manage products
  const canManageProducts = user && (user.role === "owner" || user.role === "barista");
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="MENU"
    >
      {/* Product Management Panel */}
      {canManageProducts && <ProductManagement />}
      
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading
          ? Array(6)
              .fill(null)
              .map((_, i) => <ProductSkeleton key={i} />)
          : products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        
        {!isLoading && products?.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No products found in this category</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
