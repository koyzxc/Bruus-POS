import { AlertCircle } from "lucide-react";
import { Inventory } from "@shared/schema";

type LowStockAlertProps = {
  item: Inventory;
};

export function LowStockAlert({ item }: LowStockAlertProps) {
  const getUnit = (itemName: string) => {
    if (["MILK", "WHIP CREAM"].includes(itemName)) return "box";
    if (["JAVA CHIP", "SUGAR", "COFFEE BEANS"].includes(itemName)) return "kg";
    if (["CUPS"].includes(itemName)) return "pcs";
    return "unit";
  };

  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            Low stock alert: {item.name} ({item.currentStock} {getUnit(item.name)} remaining)
          </p>
        </div>
      </div>
    </div>
  );
}
