import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { SalesData } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalesPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  
  // Fetch sales data
  const { data: salesData, isLoading } = useQuery<SalesData[]>({
    queryKey: ["/api/sales"],
  });
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="SALES"
    >
      <div className="bg-[#F15A29] rounded-xl overflow-hidden shadow-lg text-white">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white border-opacity-20">
              <TableHead className="text-left py-4 px-6 font-bold text-white">PRODUCT NAME</TableHead>
              <TableHead className="text-center py-4 px-6 font-bold text-white">PRICE</TableHead>
              <TableHead className="text-center py-4 px-6 font-bold text-white">VOLUME</TableHead>
              <TableHead className="text-right py-4 px-6 font-bold text-white">SALES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(6)
                .fill(null)
                .map((_, i) => (
                  <TableRow key={i} className="border-b border-white border-opacity-20">
                    <TableCell className="py-4 px-6 text-white">
                      <Skeleton className="h-6 w-3/4 bg-white/20" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center text-white">
                      <Skeleton className="h-6 w-20 mx-auto bg-white/20" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center text-white">
                      <Skeleton className="h-6 w-12 mx-auto bg-white/20" />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right text-white">
                      <Skeleton className="h-6 w-24 ml-auto bg-white/20" />
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              salesData?.map((item) => (
                <TableRow key={item.id} className="border-b border-white border-opacity-20 hover:bg-[#FF7A47]">
                  <TableCell className="py-4 px-6 text-white">{item.productName}</TableCell>
                  <TableCell className="py-4 px-6 text-center text-white">₱ {item.price.toFixed(2)}</TableCell>
                  <TableCell className="py-4 px-6 text-center text-white">{item.volume}</TableCell>
                  <TableCell className="py-4 px-6 text-right text-white">₱ {item.totalSales.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
            
            {!isLoading && (!salesData || salesData.length === 0) && (
              <TableRow className="border-b border-white border-opacity-20">
                <TableCell colSpan={4} className="text-center py-10 text-white">
                  No sales data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
