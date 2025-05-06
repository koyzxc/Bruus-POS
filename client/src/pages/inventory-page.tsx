import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import ProductManagement from "@/components/ProductManagement";
import InventoryForm from "@/components/InventoryForm";
import { Inventory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const { user } = useAuth();
  
  // Fetch inventory data
  const { data: inventoryItems, isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });
  
  // Check if user is authorized to manage products
  const canManageProducts = user && (user.role === "owner" || user.role === "barista");
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="INV"
    >
      {/* Product and Inventory Management Buttons */}
      {canManageProducts && (
        <div className="flex justify-between items-center mb-4">
          <ProductManagement />
          
          <Button
            onClick={() => setIsInventoryFormOpen(true)}
            className="bg-[#F15A29] hover:bg-[#D84A19] text-white flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Ingredient
          </Button>
        </div>
      )}

      {/* Inventory Form Dialog */}
      {isInventoryFormOpen && (
        <InventoryForm 
          isOpen={isInventoryFormOpen} 
          onClose={() => setIsInventoryFormOpen(false)} 
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
                    <TableCell className="py-4 px-6">{item.name}</TableCell>
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
    </MainLayout>
  );
}
