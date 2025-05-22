import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import ProductForm from "@/components/ProductForm";
import InventoryForm from "@/components/InventoryForm";
import { Inventory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch inventory data
  const { data: inventoryItems, isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });
  
  // Filter inventory items based on search query
  const filteredInventoryItems = useMemo(() => {
    if (!inventoryItems) return [];
    
    if (!searchQuery.trim()) return inventoryItems;
    
    const query = searchQuery.toLowerCase().trim();
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }, [inventoryItems, searchQuery]);
  
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
  
  // State for product form
  const [showProductForm, setShowProductForm] = useState(false);
  
  // Listen for addNewProduct event from sidebar
  useEffect(() => {
    const handleAddNewProduct = () => {
      setShowProductForm(true);
    };
    
    window.addEventListener('addNewProduct', handleAddNewProduct);
    
    return () => {
      window.removeEventListener('addNewProduct', handleAddNewProduct);
    };
  }, []);
  
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
      // Invalidate both inventory and low-stock queries after deletion
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
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
      
      {/* Product Form Dialog */}
      {showProductForm && (
        <ProductForm
          isOpen={showProductForm}
          onClose={() => setShowProductForm(false)}
        />
      )}
      
      {/* Top controls - Only Search */}
      <div className="mb-4 flex justify-end items-center">
        {/* Search Bar */}
        <div className="relative w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29] focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-xl overflow-hidden shadow-lg mt-2">
        <div className="relative">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="text-left py-4 px-6 font-bold text-lg">NAME OF THE INGREDIENT</TableHead>
                <TableHead className="text-center py-4 px-6 font-bold text-lg w-[200px]">QUANTITY</TableHead>
                <TableHead className="text-right py-4 px-6 font-bold text-lg w-[180px]">STOCKS</TableHead>
                <TableHead className="text-right py-4 px-6 font-bold text-lg w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div className="max-h-[calc(100vh-240px)] overflow-y-auto overflow-x-hidden">
          <Table>
            <TableBody>
              {isLoading ? (
                Array(6)
                  .fill(null)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-4 px-6">
                        <Skeleton className="h-6 w-3/4" />
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right w-[180px]">
                        <Skeleton className="h-6 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                filteredInventoryItems.map((item) => {
                  return (
                    <TableRow key={item.id} className="border-b hover:bg-[#FFF3E6] group relative">
                      <TableCell className="py-4 px-6">
                        <span>{item.name}</span>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-center w-[200px]">
                        {item.containerType !== "direct" && item.containerQuantity ? (
                          <span>
                            {/* Show numberOfContainers if more than 1 */}
                            {item.numberOfContainers && parseFloat(item.numberOfContainers) > 1 ? 
                              `${item.numberOfContainers} ` : ""}
                              
                            {/* Capitalize first letter of container type */}
                            {item.containerType.charAt(0).toUpperCase() + item.containerType.slice(1)}
                            
                            {item.secondaryUnit && item.containerQuantity && (
                              <> ({item.containerQuantity} {
                                // If secondary unit is piece and final unit is pc, simplify display
                                item.secondaryUnit === "piece" && item.unit === "pc" 
                                  ? "pc" 
                                  : item.secondaryUnit
                              })</>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right w-[180px]">
                        <div className="flex flex-col">
                          <span className={`font-medium text-lg ${
                            parseFloat(item.currentStock) <= parseFloat(item.minimumThreshold) ? "text-red-500" : ""
                          }`}>
                            {item.currentStock} {item.unit || ""}
                          </span>
                          
                          {item.containerType !== "direct" && 
                           item.containerQuantity && 
                           item.quantityPerUnit && (
                            <div className="text-xs text-gray-500 mt-1">
                              {/* Display the number of containers */}
                              {item.numberOfContainers && parseFloat(item.numberOfContainers) > 1 && (
                                <>Total: {parseFloat(item.currentStock)} {item.unit}</>
                              )}
                              {/* Display the quantity per unit information */}
                              {item.secondaryUnit && (
                                <div>{parseFloat(item.quantityPerUnit)} {item.unit}/{item.secondaryUnit === "piece" ? "pc" : item.secondaryUnit}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right w-[100px]">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-end">
                          {canManageProducts && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditInventory(item);
                              }}
                              className="px-2"
                            >
                              <Edit className="h-4 w-4 text-gray-500 hover:text-[#F15A29]" />
                            </Button>
                          )}
                          
                          {/* Delete button - owner only */}
                          {user?.role === "owner" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInventory(item);
                              }}
                              className="px-2"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              
              {!isLoading && (!filteredInventoryItems.length) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-10 text-gray-500">
                    No inventory items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
