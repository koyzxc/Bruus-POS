import { AlertCircle } from "lucide-react";
import { Inventory } from "@shared/schema";

type LowStockAlertProps = {
  item: Inventory;
};

export function LowStockAlert({ item }: LowStockAlertProps) {
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-2 max-w-md rounded-r-md" style={{ zIndex: 20 }}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertCircle className="h-4 w-4" />
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
