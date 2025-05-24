import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { SalesData, Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Filter,
  Search
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

// Define comparison operators for filtering
type ComparisonOperator = "gt" | "lt" | "gte" | "lte" | null;

type FilterState = {
  volumeOperator: ComparisonOperator;
  volumeValue: string;
  salesOperator: ComparisonOperator;
  salesValue: string;
}

export default function SalesPage() {
  const { user } = useAuth();
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
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState("");
  
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
      const response = await fetch(url, {
        credentials: 'include', // Include authentication cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      return response.json();
    },
    enabled: !showNonSelling, // Only fetch when not showing non-selling products
  });
  
  // Type for non-selling products with categoryName
  type NonSellingProduct = Product & {
    categoryName: string;
  };
  
  // Fetch non-selling products with date range
  const { data: nonSellingData, isLoading: isNonSellingLoading } = useQuery<NonSellingProduct[]>({
    queryKey: ["/api/sales/non-selling", dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      const fromDate = dateRange.from?.toISOString();
      const toDate = dateRange.to?.toISOString();
      
      const url = `/api/sales/non-selling?from=${fromDate}&to=${toDate}`;
      const response = await fetch(url, {
        credentials: 'include', // Include authentication cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
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
  
  // Debug: Log the calculated totals
  console.log("Debug totals:", { 
    salesDataLength: salesData?.length,
    totalVolume, 
    totalSales,
    sampleData: salesData?.slice(0, 2)
  });

  // Prepare chart data from sales data
  const prepareChartData = () => {
    if (!salesData || salesData.length === 0) return [];
    
    // Create a comprehensive date range for the selected period
    const startDate = dateRange.from || new Date();
    const endDate = dateRange.to || new Date();
    const dateMap = new Map();
    
    // Initialize all dates in range with zero values
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'MMM dd');
      dateMap.set(dateKey, {
        date: dateKey,
        sales: 0,
        volume: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add actual sales data to the chart using exact order timestamps
    salesData.forEach(item => {
      // Use the exact date when each individual order was created and convert to PHT (UTC+8)
      const orderDate = item.createdAt ? new Date(item.createdAt) : new Date();
      // Convert UTC to Philippine Time (UTC+8) to get the correct local date
      const phtDate = new Date(orderDate.getTime() + (8 * 60 * 60 * 1000));
      const dateKey = format(phtDate, 'MMM dd');
      
      // Debug: Log the actual dates being processed
      console.log(`Order date: ${item.createdAt}, Formatted: ${dateKey}, Sales: ${item.totalSales}`);
      
      if (dateMap.has(dateKey)) {
        const dayData = dateMap.get(dateKey);
        dayData.sales += item.totalSales;
        dayData.volume += item.volume;
      }
    });
    
    return Array.from(dateMap.values());
  };

  const chartData = prepareChartData();
  
  // Debug: Log chart data to verify both sales and volume data
  console.log("Full chart data:", chartData);
  console.log("Chart data with values:", chartData.filter(d => d.sales > 0 || d.volume > 0));
  
  // Aggregate sales data for table display (group by product)
  const aggregatedSalesData = salesData ? salesData.reduce((acc, item) => {
    const key = `${item.productId}-${item.size}`;
    if (!acc[key]) {
      acc[key] = {
        ...item,
        volume: 0,
        totalSales: 0
      };
    }
    acc[key].volume += item.volume;
    acc[key].totalSales += item.totalSales;
    return acc;
  }, {} as Record<string, any>) : {};
  
  const aggregatedSalesArray = Object.values(aggregatedSalesData);
  
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
  
  // Apply filters to aggregated sales data for table display
  const filteredSalesData = aggregatedSalesArray?.filter(item => {
    // Skip filtering if no sales data
    if (!item) return false;
    
    // Search filter - filter by product name
    if (searchQuery.trim()) {
      const productName = item.productName?.toLowerCase() || '';
      if (!productName.includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
    }
    
    // Category filter - only show products from selected category
    if (activeCategory !== 'ALL') {
      if (item.categoryName !== activeCategory) {
        return false;
      }
    }
    
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
  
  // Filter non-selling products by selected category and search
  const filteredNonSellingData = nonSellingData?.filter(item => {
    // Skip if no data
    if (!item) return false;
    
    // Search filter - filter by product name
    if (searchQuery.trim()) {
      const productName = item.name?.toLowerCase() || '';
      if (!productName.includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
    }
    
    // Only show products from selected category
    if (activeCategory !== 'ALL') {
      return item.categoryName === activeCategory;
    }
    
    return true;
  });
  
  // Determine which data and loading state to use
  const displayData = showNonSelling ? filteredNonSellingData : filteredSalesData;
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
  
  // Get the proper category name from data
  const getCategoryName = (item: any): string => {
    // First try to use the actual category from the database
    if (item.categoryName) {
      return item.categoryName;
    }
    
    // Fallback for deleted products or legacy data
    return "OTHERS";
  };
  
  // Check if user has permission to view sales data
  if (!user?.canViewSales) {
    return (
      <MainLayout
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeSection="SALES"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-gray-600">You don't have permission to view financial data.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="SALES"
    >
      {/* Sales Overview Chart - At the very top */}
      {!showNonSelling && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">Total Unit Sold</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{salesData?.length || 0}</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-[#F15A29] rounded-full"></div>
                <span className="text-sm font-medium text-orange-700">Total Sales</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">₱{(totalSales || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#F15A29] rounded-full"></div>
                <span>Sales (₱)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Unit Sold</span>
              </div>
            </div>
          </div>
          
          {/* Chart Container */}
          <div className="h-80 w-full border-0" style={{ outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 10, right: 40, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="sales"
                  orientation="left"
                  stroke="#F15A29"
                  fontSize={12}
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  yAxisId="volume"
                  orientation="right"
                  stroke="#3b82f6"
                  fontSize={12}
                  domain={[0, 'dataMax']}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      // Show both Sales and Orders data in the tooltip
                      const salesData = payload.find(p => p.name === 'Sales');
                      const ordersData = payload.find(p => p.name === 'Orders');
                      
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                          <p className="text-gray-700 font-medium mb-2">{label}</p>
                          {salesData && (
                            <p className="text-orange-600 font-semibold">
                              Sales: ₱{Number(salesData.value).toFixed(2)}
                            </p>
                          )}
                          {ordersData && (
                            <p className="text-blue-600 font-semibold">
                              Unit Sold: {ordersData.value}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  yAxisId="sales"
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#F15A29" 
                  strokeWidth={5}
                  dot={false}
                  activeDot={{ r: 8, fill: '#F15A29', stroke: '#F15A29', strokeWidth: 2 }}
                  connectNulls={false}
                  name="Sales"
                />
                <Line 
                  yAxisId="volume"
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={5}
                  dot={false}
                  activeDot={{ r: 8, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 2 }}
                  connectNulls={false}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sales Analytics - Grouped section with controls AND data table */}
      <div className="bg-white rounded-xl shadow-md">
        {/* Date Selection Controls with Filters */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-start">
            {/* Left side - Filter Controls */}
            <div className="flex items-center gap-2">
              {/* Show Non-Selling button first */}
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

              {/* Filter button with count badge */}
              {!showNonSelling && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29]"
                    >
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 bg-[#F15A29] text-white">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    {/* Active filters display */}
                    {activeFilterCount > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs font-medium pt-1 pb-0">Active Filters</DropdownMenuLabel>
                        <div className="p-2 space-y-1">
                          {filters.volumeOperator && (
                            <div className="flex items-center justify-between text-xs bg-blue-50 p-2 rounded">
                              <span>Unit Sold {getOperatorText(filters.volumeOperator)} {filters.volumeValue}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setVolumeFilter(null, "")}
                                className="h-5 w-5 p-0 hover:bg-blue-200"
                              >
                                ×
                              </Button>
                            </div>
                          )}
                          {filters.salesOperator && (
                            <div className="flex items-center justify-between text-xs bg-orange-50 p-2 rounded">
                              <span>Sales {getOperatorText(filters.salesOperator)} ₱{filters.salesValue}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSalesFilter(null, "")}
                                className="h-5 w-5 p-0 hover:bg-orange-200"
                              >
                                ×
                              </Button>
                            </div>
                          )}
                        </div>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={clearAllFilters}
                            className="w-full text-xs"
                          >
                            Clear All Filters
                          </Button>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Volume Filters */}
                    <DropdownMenuLabel className="text-xs font-medium pt-1 pb-0">Unit Sold Filters</DropdownMenuLabel>
                    <div className="p-2 grid grid-cols-2 gap-2">
                      {/* Greater than */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`text-xs justify-start ${filters.volumeOperator === "gt" ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
                        onClick={() => {
                          const value = prompt("Enter value for Unit Sold >", filters.volumeValue || "");
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
                          const value = prompt("Enter value for Unit Sold <", filters.volumeValue || "");
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
                          const value = prompt("Enter value for Unit Sold ≥", filters.volumeValue || "");
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
                          const value = prompt("Enter value for Unit Sold ≤", filters.volumeValue || "");
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
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Right side - Date controls */}
            <div className="flex flex-col gap-2">
              {/* Date range picker at top */}
              <div className="flex justify-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start font-normal text-left bg-white w-[250px]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formattedDateRange()}
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
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
              </div>
              
              {/* Date shortcut buttons below - aligned with date picker */}
              <div className="flex gap-1 w-[250px] ml-auto">
                <Button onClick={handleTodayClick} variant="outline" size="sm" className="flex-1 text-xs">Today</Button>
                <Button onClick={handleWeekClick} variant="outline" size="sm" className="flex-1 text-xs">Week</Button>
                <Button onClick={handleMonthClick} variant="outline" size="sm" className="flex-1 text-xs">Month</Button>
              </div>
            </div>

            {/* Search Bar - positioned below the buttons */}
            <div className="mt-3">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border border-gray-300 focus:border-[#F15A29] focus:ring-[#F15A29]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sales Data Table - Integrated in the grouped section */}
        <div className="p-4">
        {isLoading ? (
          // Loading skeleton
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-full mb-4" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
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
                        <TableHead className="py-4 px-6 text-center text-white">Unit Sold</TableHead>
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
                          {getCategoryName(product)}
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
                  <p className="text-sm text-gray-500">Total Unit Sold</p>
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
      </div>
    </MainLayout>
  );
}