import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import { Product } from "@shared/schema";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient"; 
import { useToast } from "@/hooks/use-toast";

export default function ProductManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
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
  
  // Delete mutation for products (owner only)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };
  
  return (
    <>
      <div className="flex flex-col space-y-4 mb-4">
        <h1 className="text-2xl font-bold text-[#F15A29]">Product Management</h1>
        
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="rounded-full bg-[#F15A29] p-1 flex items-center justify-center mr-2">
              <PlusCircle className="h-4 w-4 text-white" />
            </div>
            <span 
              className="text-[#F15A29] font-medium cursor-pointer hover:underline"
              onClick={handleAddProduct}
            >
              Add New Product
            </span>
          </div>
          
          {/* Show delete product button only for owners */}
          {user.role === "owner" && selectedProduct && (
            <div className="flex items-center">
              <div className="rounded-full bg-red-500 p-1 flex items-center justify-center mr-2">
                <Trash2 className="h-4 w-4 text-white" />
              </div>
              <span 
                className="text-red-500 font-medium cursor-pointer hover:underline"
                onClick={() => handleDeleteProduct(selectedProduct)}
              >
                Delete Product
              </span>
            </div>
          )}
        </div>
      </div>
      
      {showProductForm && (
        <ProductForm 
          isOpen={showProductForm}
          onClose={() => setShowProductForm(false)}
          product={selectedProduct}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}