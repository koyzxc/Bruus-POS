import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import ProductManagement from "@/components/ProductManagement";
import InventoryForm from "@/components/InventoryForm";
import { Inventory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
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

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<Inventory | undefined>(undefined);
  const [inventoryToDelete, setInventoryToDelete] = useState<Inventory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch inventory data
  const { data: inventoryItems, isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });
  
  // Check if user is authorized to manage products
  const canManageProducts = user && (user.role === "owner" || user.role === "barista");
  
  const handleEditInventory = (item: Inventory) => {
    setSelectedInventoryItem(item);
    setIsInventoryFormOpen(true);
  };
  
  const handleOpenInventoryForm = () => {
    setSelectedInventoryItem(undefined);
    setIsInventoryFormOpen(true);
  };
  
  // Delete mutation for inventory items (owner only)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/inventory/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setInventoryToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteInventory = (item: Inventory) => {
    setInventoryToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (inventoryToDelete) {
      deleteMutation.mutate(inventoryToDelete.id);
    }
  };
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="INV"
      onOpenInventoryForm={handleOpenInventoryForm}
    >

      {/* Inventory Form Dialog */}
      {isInventoryFormOpen && (
        <InventoryForm 
          isOpen={isInventoryFormOpen} 
          onClose={() => {
            setIsInventoryFormOpen(false);
            setSelectedInventoryItem(undefined);
          }} 
          inventoryItem={selectedInventoryItem}
        />
      )}
      
      <div className="bg-white rounded-xl overflow-hidden shadow-lg mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left py-4 px-6 font-bold text-lg">NAME OF THE INGREDIENT</TableHead>
              <TableHead className="text-right py-4 px-6 font-bold text-lg">STOCKS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(6)
                .fill(null)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-4 px-6">
                      <Skeleton className="h-6 w-3/4" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              inventoryItems?.map((item) => {
                return (
                  <TableRow key={item.id} className="border-b hover:bg-[#FFF3E6]">
                    <TableCell className="py-4 px-6">
                      <div className="flex justify-between items-center">
                        <span>{item.name}</span>
                        <div className="flex">
                          {canManageProducts && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditInventory(item)}
                              className="ml-2"
                            >
                              <Edit className="h-4 w-4 text-gray-500 hover:text-[#F15A29]" />
                            </Button>
                          )}
                          
                          {/* Delete button - owner only */}
                          {user?.role === "owner" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteInventory(item)}
                              className="ml-2"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className={`font-medium ${
                        item.currentStock <= item.minimumThreshold ? "text-red-500" : ""
                      }`}>
                        {item.currentStock} {item.unit || ""}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            
            {!isLoading && (!inventoryItems || inventoryItems.length === 0) && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10 text-gray-500">
                  No inventory items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inventory item
              "{inventoryToDelete?.name}".
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
    </MainLayout>
  );
}
