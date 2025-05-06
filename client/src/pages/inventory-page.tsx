import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { Inventory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  
  // Fetch inventory data
  const { data: inventoryItems, isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="INV"
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left py-4 px-6 font-bold text-lg">NAME OF THE PRODUCT</TableHead>
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
                const getUnit = (name: string) => {
                  if (["MILK", "WHIP CREAM"].includes(name)) return "BOX";
                  if (["JAVA CHIP", "SUGAR", "COFFEE BEANS"].includes(name)) return "KL";
                  if (["CUPS"].includes(name)) return "PCS";
                  return "UNIT";
                };
                
                return (
                  <TableRow key={item.id} className="border-b hover:bg-[#FFF3E6]">
                    <TableCell className="py-4 px-6">{item.name}</TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <span className={`font-medium ${
                        item.currentStock <= item.minimumThreshold ? "text-red-500" : ""
                      }`}>
                        {item.currentStock} {getUnit(item.name)}
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
