import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import ProductCard from "@/components/ProductCard";
import ProductForm from "@/components/ProductForm";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  
  // Listen for editProduct event from ProductCard
  useEffect(() => {
    const handleEditProduct = (event: CustomEvent) => {
      const product = event.detail.product;
      setSelectedProduct(product);
      setShowProductForm(true);
    };

    window.addEventListener('editProduct', handleEditProduct as EventListener);
    
    return () => {
      window.removeEventListener('editProduct', handleEditProduct as EventListener);
    };
  }, []);
  
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
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="MENU"
    >
      {/* Products Grid - Optimized for iPad */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array(8)
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

      {/* Product Form Dialog */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setSelectedProduct(undefined);
        }}
        product={selectedProduct}
      />
    </MainLayout>
  );
}
