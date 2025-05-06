import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { SalesData } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";

export default function SalesPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  const today = new Date();
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfDay(today),
    to: endOfDay(today),
  });
  
  // Date range presets
  const handleTodayClick = () => {
    setDateRange({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    });
  };

  const handleWeekClick = () => {
    setDateRange({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    });
  };

  const handleMonthClick = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };
  
  // Format date range for display
  const formattedDateRange = () => {
    if (!dateRange.from) return "Select date range";
    
    if (!dateRange.to) {
      return format(dateRange.from, "MMM dd, yyyy");
    }
    
    return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(
      dateRange.to,
      "MMM dd, yyyy"
    )}`;
  };

  // Fetch sales data with date range
  const { data: salesData, isLoading } = useQuery<SalesData[]>({
    queryKey: ["/api/sales", dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      const fromDate = dateRange.from?.toISOString();
      const toDate = dateRange.to?.toISOString();
      
      const url = `/api/sales?from=${fromDate}&to=${toDate}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      return response.json();
    },
  });
  
  // Calculate totals
  const totalVolume = salesData?.reduce((sum, item) => sum + item.volume, 0) || 0;
  const totalSales = salesData?.reduce((sum, item) => sum + item.totalSales, 0) || 0;
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="SALES"
    >
      {/* Date Range Controls */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Sales Analytics</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal border-dashed border-gray-300 hover:border-[#F15A29]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formattedDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({
                        from: range.from,
                        to: range.to || range.from
                      });
                    }
                  }}
                  numberOfMonths={2}
                  className="bg-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleTodayClick}
              className="bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29]"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              onClick={handleWeekClick}
              className="bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29]"
            >
              Last 7 Days
            </Button>
            <Button 
              variant="outline" 
              onClick={handleMonthClick}
              className="bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29]"
            >
              This Month
            </Button>
          </div>
        </div>
        
        {/* Summary Numbers */}
        <div className="grid grid-cols-2 mt-4 gap-4">
          <div className="bg-[#FFE6C7] rounded-lg p-3 text-[#333]">
            <div className="text-sm uppercase">Total Volume</div>
            <div className="text-2xl font-bold">{totalVolume}</div>
          </div>
          <div className="bg-[#F15A29] rounded-lg p-3 text-white">
            <div className="text-sm uppercase">Total Revenue</div>
            <div className="text-2xl font-bold">₱ {totalSales.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
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
