import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { SalesData, Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from "date-fns";
import { 
  BarChart2, 
  CalendarIcon, 
  AlertTriangle, 
  ChevronDown, 
  FilterX, 
  Filter 
} from "lucide-react";

// Define comparison operators for filtering
type ComparisonOperator = "gt" | "lt" | "gte" | "lte" | null;

type FilterState = {
  volumeOperator: ComparisonOperator;
  volumeValue: string;
  salesOperator: ComparisonOperator;
  salesValue: string;
}

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
  
  // State to toggle between selling and non-selling products
  const [showNonSelling, setShowNonSelling] = useState(false);
  
  // State for filters
  const [filters, setFilters] = useState<FilterState>({
    volumeOperator: null,
    volumeValue: "",
    salesOperator: null,
    salesValue: ""
  });
  
  // Count active filters for badge display
  const activeFilterCount = [
    filters.volumeOperator,
    filters.salesOperator
  ].filter(Boolean).length;
  
  // Date range preset handlers
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
    enabled: !showNonSelling, // Only fetch when not showing non-selling products
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
    enabled: showNonSelling, // Only fetch when showing non-selling products
  });
  
  // Calculate totals for sales data
  const totalVolume = salesData?.reduce((sum, item) => sum + item.volume, 0) || 0;
  const totalSales = salesData?.reduce((sum, item) => sum + item.totalSales, 0) || 0;
  
  // Filter setting functions
  const setVolumeFilter = (operator: ComparisonOperator, value: string) => {
    setFilters({
      ...filters,
      volumeOperator: operator,
      volumeValue: value
    });
  };
  
  const setSalesFilter = (operator: ComparisonOperator, value: string) => {
    setFilters({
      ...filters,
      salesOperator: operator,
      salesValue: value
    });
  };
  
  const clearAllFilters = () => {
    setFilters({
      volumeOperator: null,
      volumeValue: "",
      salesOperator: null,
      salesValue: ""
    });
  };
  
  // Filter comparison helper function
  const compareValues = (value: number, compareValue: number, operator: ComparisonOperator): boolean => {
    switch(operator) {
      case "gt": return value > compareValue;
      case "lt": return value < compareValue;
      case "gte": return value >= compareValue;
      case "lte": return value <= compareValue;
      default: return true; // No filter
    }
  };
  
  // Apply filters to sales data
  const filteredSalesData = salesData?.filter(item => {
    // Skip filtering if no sales data
    if (!item) return false;
    
    // Volume filter
    if (filters.volumeOperator && filters.volumeValue) {
      const compareValue = parseFloat(filters.volumeValue);
      if (!isNaN(compareValue)) {
        if (!compareValues(item.volume, compareValue, filters.volumeOperator)) {
          return false;
        }
      }
    }
    
    // Sales filter
    if (filters.salesOperator && filters.salesValue) {
      const compareValue = parseFloat(filters.salesValue);
      if (!isNaN(compareValue)) {
        if (!compareValues(item.totalSales, compareValue, filters.salesOperator)) {
          return false;
        }
      }
    }
    
    return true;
  });
  
  // Determine which data and loading state to use
  const displayData = showNonSelling ? nonSellingData : filteredSalesData;
  const isLoading = showNonSelling ? isNonSellingLoading : isSalesLoading;
  
  // Format helper functions
  const getOperatorText = (operator: ComparisonOperator): string => {
    switch(operator) {
      case "gt": return ">";
      case "lt": return "<";
      case "gte": return "≥";
      case "lte": return "≤";
      default: return "";
    }
  };
  
  const getCategoryName = (id: number): string => {
    switch(id) {
      case 1: return "COFFEE";
      case 2: return "NON-COFFEE";
      case 3: return "PASTRY";
      default: return "OTHER";
    }
  };
  
  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="SALES"
    >
      {/* Analytics Header & Controls */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
              <h2 className="text-xl font-bold">Sales Analytics</h2>
              
              <div className="flex items-center gap-2">
                {/* Filter button with count badge */}
                {!showNonSelling && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2 bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29]"
                      >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#F15A29] text-white text-xs">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72">
                      <DropdownMenuLabel>Apply Filters</DropdownMenuLabel>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Volume Filters */}
                      <DropdownMenuLabel className="text-xs font-medium pt-1 pb-0">Volume Filters</DropdownMenuLabel>
                      <div className="p-2 grid grid-cols-2 gap-2">
                        {/* Greater than */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.volumeOperator === "gt" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Volume > ", filters.volumeValue || "");
                            if (value !== null) {
                              setVolumeFilter("gt", value);
                            }
                          }}
                        >
                          Greater than &gt;
                        </Button>
                        
                        {/* Less than */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.volumeOperator === "lt" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Volume < ", filters.volumeValue || "");
                            if (value !== null) {
                              setVolumeFilter("lt", value);
                            }
                          }}
                        >
                          Less than &lt;
                        </Button>
                        
                        {/* Greater than or equal */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.volumeOperator === "gte" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Volume ≥ ", filters.volumeValue || "");
                            if (value !== null) {
                              setVolumeFilter("gte", value);
                            }
                          }}
                        >
                          Greater than or equal ≥
                        </Button>
                        
                        {/* Less than or equal */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.volumeOperator === "lte" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Volume ≤ ", filters.volumeValue || "");
                            if (value !== null) {
                              setVolumeFilter("lte", value);
                            }
                          }}
                        >
                          Less than or equal ≤
                        </Button>
                      </div>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Sales Filters */}
                      <DropdownMenuLabel className="text-xs font-medium pt-1 pb-0">Sales Filters</DropdownMenuLabel>
                      <div className="p-2 grid grid-cols-2 gap-2">
                        {/* Greater than */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.salesOperator === "gt" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Sales > ₱", filters.salesValue || "");
                            if (value !== null) {
                              setSalesFilter("gt", value);
                            }
                          }}
                        >
                          Greater than &gt;
                        </Button>
                        
                        {/* Less than */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.salesOperator === "lt" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Sales < ₱", filters.salesValue || "");
                            if (value !== null) {
                              setSalesFilter("lt", value);
                            }
                          }}
                        >
                          Less than &lt;
                        </Button>
                        
                        {/* Greater than or equal */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.salesOperator === "gte" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Sales ≥ ₱", filters.salesValue || "");
                            if (value !== null) {
                              setSalesFilter("gte", value);
                            }
                          }}
                        >
                          Greater than or equal ≥
                        </Button>
                        
                        {/* Less than or equal */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={`text-xs justify-start ${filters.salesOperator === "lte" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                          onClick={() => {
                            const value = prompt("Enter value for Sales ≤ ₱", filters.salesValue || "");
                            if (value !== null) {
                              setSalesFilter("lte", value);
                            }
                          }}
                        >
                          Less than or equal ≤
                        </Button>
                      </div>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Active Filters Section */}
                      {activeFilterCount > 0 && (
                        <>
                          <DropdownMenuLabel className="text-xs font-medium pt-1 pb-0">Active Filters</DropdownMenuLabel>
                          <div className="p-2 space-y-2">
                            {filters.volumeOperator && (
                              <div className="flex justify-between items-center p-1 bg-amber-50 text-amber-800 text-sm rounded">
                                <span>Volume {getOperatorText(filters.volumeOperator)} {filters.volumeValue}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0" 
                                  onClick={() => setVolumeFilter(null, "")}
                                >
                                  <FilterX className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            {filters.salesOperator && (
                              <div className="flex justify-between items-center p-1 bg-amber-50 text-amber-800 text-sm rounded">
                                <span>Sales {getOperatorText(filters.salesOperator)} ₱{filters.salesValue}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0" 
                                  onClick={() => setSalesFilter(null, "")}
                                >
                                  <FilterX className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-xs" 
                              onClick={clearAllFilters}
                            >
                              Clear All Filters
                            </Button>
                          </div>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
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
            </div>

            {/* Date Selection */}
            <div className="flex flex-col gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal text-left bg-white"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formattedDateRange()}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range as { from: Date; to: Date });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {/* Date shortcut buttons underneath */}
              <div className="flex gap-2">
                <Button onClick={handleTodayClick} variant="outline" className="flex-1">Today</Button>
                <Button onClick={handleWeekClick} variant="outline" className="flex-1">This Week</Button>
                <Button onClick={handleMonthClick} variant="outline" className="flex-1">This Month</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Data Table */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        {isLoading ? (
          // Loading skeleton
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-full mb-4" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : displayData && displayData.length > 0 ? (
          <>
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-[#F15A29] text-white">
                  <TableRow>
                    <TableHead className="py-4 px-6 text-center text-white">Product</TableHead>
                    <TableHead className="py-4 px-6 text-center text-white">Price</TableHead>
                    <TableHead className="py-4 px-6 text-center text-white">Category</TableHead>
                    {!showNonSelling && (
                      <>
                        <TableHead className="py-4 px-6 text-center text-white">Volume</TableHead>
                        <TableHead className="py-4 px-6 text-center text-white">Total Sales</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((item) => {
                    // Handle different data types based on view mode
                    const product = item as any;
                    
                    return (
                      <TableRow
                        key={product.id}
                        className={showNonSelling ? "bg-amber-50" : ""}
                      >
                        <TableCell className="py-4 px-6 font-medium">
                          <div>
                            {showNonSelling 
                              ? product.name 
                              : product.productName} 
                            <span className="inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-white text-[#F15A29]">
                              {product.size}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          ₱ {Number(product.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center">
                          {getCategoryName(showNonSelling 
                            ? product.categoryId 
                            : product.productId || product.categoryId)}
                        </TableCell>
                        {!showNonSelling && (
                          <>
                            <TableCell className="py-4 px-6 text-center">{product.volume}</TableCell>
                            <TableCell className="py-4 px-6 text-center">₱ {Number(product.totalSales).toFixed(2)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Show totals only for sales data */}
            {!showNonSelling && salesData && salesData.length > 0 && (
              <div className="mt-4 flex justify-end gap-6 border-t pt-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Volume</p>
                  <p className="text-lg font-semibold">{totalVolume}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-lg font-semibold">₱ {totalSales.toFixed(2)}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {showNonSelling
                ? "All products have sales in this date range!"
                : "No sales data available for the selected date range."}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}