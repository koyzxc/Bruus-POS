import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Logo from "./Logo";
import ProductManagement from "@/components/ProductManagement";
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
  activeSection?: "MENU" | "INV" | "SALES";
  onOpenInventoryForm?: () => void;
};

export default function Sidebar({ activeCategory, setActiveCategory, activeSection, onOpenInventoryForm }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  
  // Fetch low stock items for alerts
  const { data: lowStockItems } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory/low-stock"],
    enabled: true,
  });
  
  const handleSignOut = () => {
    logoutMutation.mutate();
  };
  
  const categories = ["COFFEE", "SHAKE", "FOOD", "OTHERS"];
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
            {categories.map((category) => (
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
            {activeSection === "INV" && canManageProducts && (
              <div className="space-y-3 mt-6">
                <ProductManagement />
                
                <div className="mt-3"> {/* Added consistent margin to match ProductManagement */}
                  <Button
                    onClick={onOpenInventoryForm}
                    className="w-full bg-[#F15A29] hover:bg-[#D84A19] text-white flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add New Ingredient
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 p-4 w-64 md:w-72">
        {/* Low Stock Alerts above sign out button */}
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="mb-4 max-h-[140px] overflow-y-auto">
            {lowStockItems.map((item) => (
              <LowStockAlert key={item.id} item={item} />
            ))}
          </div>
        )}
        
        <button
          className="w-full py-3 bg-[#FFE6C7] text-[#333333] rounded font-medium hover:bg-[#F5D7B5] transition duration-300 text-base"
          onClick={handleSignOut}
        >
          SIGN OUT
        </button>
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
