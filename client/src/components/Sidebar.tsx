import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import InventoryForm from "@/components/InventoryForm";
import { useQuery } from "@tanstack/react-query";
import { Inventory } from "@shared/schema";
import { LowStockAlert } from "@/components/LowStockAlert";

type SidebarProps = {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  activeSection?: "MENU" | "INV" | "SALES" | "ADMIN";
  onOpenInventoryForm?: () => void;
  onRestockClick?: (item: Inventory) => void;
};

export default function Sidebar({ activeCategory, setActiveCategory, activeSection, onOpenInventoryForm, onRestockClick }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  
  // Fetch low stock items for alerts with frequent refresh
  const { data: lowStockItems } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory/low-stock"],
    enabled: true,
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
  });
  
  const handleSignOut = () => {
    logoutMutation.mutate();
  };
  
  // Fetch categories from the database
  const { data: dbCategories } = useQuery<{id: number, name: string, displayOrder: number}[]>({
    queryKey: ["/api/categories"],
  });
  
  // Use categories from database, if available, or add "ALL" option for filtering
  const categories = activeSection === "SALES" 
    ? ["ALL", ...(dbCategories ? dbCategories.map(cat => cat.name) : ["COFFEE", "SHAKE", "FOOD", "OTHERS"])]
    : (dbCategories ? dbCategories.map(cat => cat.name) : ["COFFEE", "SHAKE", "FOOD", "OTHERS"]);
  const canManageProducts = user && (user.role === "owner" || user.role === "barista");
  
  return (
    <div className="bg-[#F15A29] text-white w-64 md:w-72 flex-shrink-0">
      <div className="p-4 text-center border-b border-[#FF7A47]">
        <Logo />
      </div>
      
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">DASHBOARD</h2>
        
        {/* Only show categories in MENU section */}
        {activeSection === "MENU" || !activeSection ? (
          <nav className="space-y-2">
            {categories.map((category: string) => (
              <button
                key={category}
                className={`category-btn ${
                  activeCategory === category ? "active" : "inactive"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>
        ) : (
          <>
            <div className="text-center text-white opacity-80 mt-4 mb-6">
              {activeSection === "INV" ? "Inventory Management" : "Sales Analytics"}
            </div>
            
            {/* Show management buttons in Inventory section */}
            {activeSection === "INV" && (
              <div className="space-y-3 mt-6">
                {/* Add New Product - only show if user can add products */}
                {user?.canAddProducts && (
                  <Button
                    onClick={() => {
                      const event = new CustomEvent('addNewProduct');
                      window.dispatchEvent(event);
                    }}
                    className="w-full bg-transparent hover:bg-[#FF7A47] text-white border-0 flex items-center justify-start gap-2 pl-2 opacity-90 text-sm"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Add New Product
                  </Button>
                )}
                
                {/* Add New Ingredient - only show if user can manage inventory */}
                {user?.canManageInventory && (
                  <Button
                    onClick={onOpenInventoryForm}
                    className="w-full bg-transparent hover:bg-[#FF7A47] text-white border-0 flex items-center justify-start gap-2 pl-2 opacity-90 text-sm"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Add New Ingredient
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 p-4 w-64 md:w-72">
        {/* Low Stock Alerts above sign out button */}
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="mb-4 max-h-[160px] overflow-y-auto">
            {lowStockItems.map((item) => (
              <LowStockAlert key={item.id} item={item} onRestockClick={onRestockClick} />
            ))}
          </div>
        )}
        
        {/* Show sign out button only for Owner in ADMIN section */}
        {user?.role === "owner" && activeSection === "ADMIN" && (
          <button
            className="w-full py-3 bg-[#FFE6C7] text-[#333333] rounded font-medium hover:bg-[#F5D7B5] transition duration-300 text-base"
            onClick={handleSignOut}
          >
            SIGN OUT
          </button>
        )}
      </div>
      
      {isInventoryFormOpen && (
        <InventoryForm
          isOpen={isInventoryFormOpen}
          onClose={() => setIsInventoryFormOpen(false)}
        />
      )}
    </div>
  );
}
