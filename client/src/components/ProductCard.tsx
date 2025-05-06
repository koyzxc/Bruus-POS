import { Product } from "@shared/schema";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Info } from "lucide-react";
import { useState } from "react";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  
  // Fetch product ingredients
  const { data: ingredients, isLoading: loadingIngredients } = useQuery<any[]>({
    queryKey: [`/api/products/${product.id}/ingredients`, product.id],
    enabled: isIngredientsDialogOpen,
  });
  
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
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const confirmDelete = () => {
    deleteMutation.mutate(product.id);
  };
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't add to cart if clicked on a button
    if ((e.target as HTMLElement).closest('button')) {
      e.stopPropagation();
      return;
    }
    addItem(product);
  };
  
  return (
    <div 
      className="product-card rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition duration-300 cursor-pointer relative"
      onClick={handleClick}
    >
      {/* Admin controls overlay */}
      {user && (user.role === "owner" || user.role === "barista") && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button 
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm"
            onClick={() => setIsIngredientsDialogOpen(true)}
          >
            <Info className="h-4 w-4 text-blue-600" />
          </Button>
          
          {user.role === "owner" && (
            <Button 
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 shadow-sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      )}
      
      <div className="h-36 md:h-40 w-full overflow-hidden relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 text-center">
        <h3 className="text-base md:text-lg font-medium uppercase tracking-wide">
          {product.name} 
          {product.size && (
            <span className="text-xs md:text-sm ml-1 bg-gray-100 px-1.5 py-0.5 rounded-sm font-normal">
              {product.size}
            </span>
          )}
        </h3>
        <p className="text-base md:text-lg font-semibold text-gray-700 mt-1">
          ₱{parseFloat(product.price).toFixed(2)}
        </p>
      </div>
      
      {/* Ingredients Dialog */}
      <Dialog open={isIngredientsDialogOpen} onOpenChange={setIsIngredientsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{product.name} Ingredients</DialogTitle>
            <DialogDescription>
              List of ingredients used in this product.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingIngredients ? (
              <p>Loading ingredients...</p>
            ) : ingredients && Array.isArray(ingredients) && ingredients.length > 0 ? (
              <ul className="space-y-2">
                {ingredients.map((ing: any) => (
                  <li key={ing.id || ing.inventoryId} className="flex justify-between items-center border-b pb-2">
                    <span>
                      <span className="font-medium">{ing.inventoryName}</span>
                      <span className="text-gray-500 ml-2">
                        {ing.quantityUsed} {ing.unit}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No ingredients defined for this product.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{product.name}".
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
    </div>
  );
}
