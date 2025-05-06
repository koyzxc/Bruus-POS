import { AlertCircle } from "lucide-react";
import { Inventory } from "@shared/schema";

type LowStockAlertProps = {
  item: Inventory;
};

export function LowStockAlert({ item }: LowStockAlertProps) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-2 mb-2 max-w-md rounded-r-md shadow-sm" 
         style={{ zIndex: 20 }}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="ml-2">
          <p className="text-xs font-medium">
            Low stock: {item.name} ({item.currentStock} {item.unit} left)
          </p>
        </div>
      </div>
    </div>
  );
}
