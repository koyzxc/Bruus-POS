import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { SalesData, Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from "date-fns";
import { BarChart2, CalendarIcon, AlertTriangle } from "lucide-react";

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
  
  // Add a state to toggle between selling and non-selling products
  const [showNonSelling, setShowNonSelling] = useState(false);
  
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
  const { data: salesData, isLoading: isSalesLoading } = useQuery<SalesData[]>({
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
    enabled: !showNonSelling, // Only fetch sales data when not showing non-selling products
  });
  
  // Fetch non-selling products with date range
  const { data: nonSellingData, isLoading: isNonSellingLoading } = useQuery<Product[]>({
    queryKey: ["/api/sales/non-selling", dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      const fromDate = dateRange.from?.toISOString();
      const toDate = dateRange.to?.toISOString();
      
      const url = `/api/sales/non-selling?from=${fromDate}&to=${toDate}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch non-selling products');
      }
      
      return response.json();
    },
    enabled: showNonSelling, // Only fetch non-selling data when showing non-selling products
  });
  
  // Calculate totals (only for sales data)
  const totalVolume = salesData?.reduce((sum, item) => sum + item.volume, 0) || 0;
  const totalSales = salesData?.reduce((sum, item) => sum + item.totalSales, 0) || 0;
  
  // Determine which data and loading state to use based on the showNonSelling toggle
  const displayData = showNonSelling ? nonSellingData : salesData;
  const isLoading = showNonSelling ? isNonSellingLoading : isSalesLoading;
  
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
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Sales Analytics</h2>
              <Button 
                variant={showNonSelling ? "default" : "outline"}
                onClick={() => setShowNonSelling(!showNonSelling)}
                className={`flex items-center gap-2 ${showNonSelling ? 'bg-[#F15A29] hover:bg-[#D94E24] text-white' : 'bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29]'}`}
              >
                {showNonSelling ? (
                  <>
                    <AlertTriangle className="h-4 w-4" /> 
                    <span>Non-Selling Products</span>
                  </>
                ) : (
                  <>
                    <BarChart2 className="h-4 w-4" /> 
                    <span>Show Non-Selling</span>
                  </>
                )}
              </Button>
            </div>
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
        
        {/* Summary Numbers - Only show for sales data, not for non-selling products */}
        {!showNonSelling && (
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
        )}
        
        {/* Info box for non-selling products */}
        {showNonSelling && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <div className="font-medium text-amber-800">Non-Selling Products</div>
              <div className="text-sm text-amber-700">
                Showing products with no sales during the selected date range
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-[#F15A29] rounded-xl overflow-hidden shadow-lg text-white">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white border-opacity-20">
              <TableHead className="text-left py-4 px-6 font-bold text-white">PRODUCT NAME</TableHead>
              <TableHead className="text-center py-4 px-6 font-bold text-white">PRICE</TableHead>
              {!showNonSelling && (
                <>
                  <TableHead className="text-center py-4 px-6 font-bold text-white">VOLUME</TableHead>
                  <TableHead className="text-right py-4 px-6 font-bold text-white">SALES</TableHead>
                </>
              )}
              {showNonSelling && (
                <TableHead className="text-center py-4 px-6 font-bold text-white">CATEGORY</TableHead>
              )}
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
                    {!showNonSelling && (
                      <>
                        <TableCell className="py-4 px-6 text-center text-white">
                          <Skeleton className="h-6 w-12 mx-auto bg-white/20" />
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right text-white">
                          <Skeleton className="h-6 w-24 ml-auto bg-white/20" />
                        </TableCell>
                      </>
                    )}
                    {showNonSelling && (
                      <TableCell className="py-4 px-6 text-center text-white">
                        <Skeleton className="h-6 w-24 mx-auto bg-white/20" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
            ) : (
              // Show appropriate content based on which mode we're in
              showNonSelling ? (
                // Non-selling products display
                nonSellingData?.map((product) => (
                  <TableRow key={product.id} className="border-b border-white border-opacity-20 hover:bg-[#FF7A47]">
                    <TableCell className="py-4 px-6 text-white">
                      <div>
                        {product.name} <span className="inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-white text-[#F15A29]">{product.size}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center text-white">₱ {product.price.toFixed(2)}</TableCell>
                    <TableCell className="py-4 px-6 text-center text-white">
                      {product.categoryId === 1 ? "COFFEE" : 
                       product.categoryId === 2 ? "NON-COFFEE" : 
                       product.categoryId === 3 ? "PASTRY" : "OTHER"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Sales data display
                salesData?.map((item) => (
                  <TableRow key={item.id} className="border-b border-white border-opacity-20 hover:bg-[#FF7A47]">
                    <TableCell className="py-4 px-6 text-white">
                      {item.productName === null ? "(Deleted Product)" : (
                        <div>
                          {item.productName} <span className="inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-white text-[#F15A29]">{item.size}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center text-white">₱ {item.price.toFixed(2)}</TableCell>
                    <TableCell className="py-4 px-6 text-center text-white">{item.volume}</TableCell>
                    <TableCell className="py-4 px-6 text-right text-white">₱ {item.totalSales.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )
            )}
            
            {!isLoading && (
              // Empty state messages
              showNonSelling ? 
                (!nonSellingData || nonSellingData.length === 0) && (
                  <TableRow className="border-b border-white border-opacity-20">
                    <TableCell colSpan={3} className="text-center py-10 text-white">
                      All products have sales in the selected date range
                    </TableCell>
                  </TableRow>
                ) : 
                (!salesData || salesData.length === 0) && (
                  <TableRow className="border-b border-white border-opacity-20">
                    <TableCell colSpan={4} className="text-center py-10 text-white">
                      No sales data found for the selected date range
                    </TableCell>
                  </TableRow>
                )
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
