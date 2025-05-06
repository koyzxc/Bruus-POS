import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import { Product } from "@shared/schema";

export default function ProductManagement() {
  const { user } = useAuth();
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  
  // Only show for admin and barista
  if (!user || (user.role !== "owner" && user.role !== "barista")) {
    return null;
  }
  
  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setShowProductForm(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };
  
  return (
    <div className="mb-4">
      <Button 
        onClick={handleAddProduct}
        className="bg-[#F15A29] hover:bg-[#D84A19] text-white"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New Product
      </Button>
      
      {showProductForm && (
        <ProductForm 
          isOpen={showProductForm}
          onClose={() => setShowProductForm(false)}
          product={selectedProduct}
        />
      )}
    </div>
  );
}