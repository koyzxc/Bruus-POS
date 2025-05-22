import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Filter, BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SalesData, Product } from "@shared/schema";
import MainLayout from "@/layouts/MainLayout";

type ComparisonOperator = "gt" | "lt" | "gte" | "lte" | null;

type FilterState = {
  volumeOperator: ComparisonOperator;
  volumeValue: string;
  salesOperator: ComparisonOperator;
  salesValue: string;
}

export default function SalesPage() {
  const [activeCategory, setActiveCategory] = useState("COFFEE");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(),
    to: new Date()
  });

  const [showNonSelling, setShowNonSelling] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    volumeOperator: null,
    volumeValue: "",
    salesOperator: null,
    salesValue: ""
  });

  type NonSellingProduct = Product & {
    categoryName: string;
  };

  const { data: salesData, isLoading } = useQuery<SalesData[]>({
    queryKey: ["/api/sales", dateRange],
    enabled: !showNonSelling
  });

  const { data: nonSellingData, isLoading: isLoadingNonSelling } = useQuery<NonSellingProduct[]>({
    queryKey: ["/api/sales/non-selling", dateRange],
    enabled: showNonSelling
  });

  const setVolumeFilter = (operator: ComparisonOperator, value: string) => {
    setFilters(prev => ({ ...prev, volumeOperator: operator, volumeValue: value }));
  };

  const setSalesFilter = (operator: ComparisonOperator, value: string) => {
    setFilters(prev => ({ ...prev, salesOperator: operator, salesValue: value }));
  };

  const compareValues = (value: number, compareValue: number, operator: ComparisonOperator): boolean => {
    if (!operator) return true;
    switch (operator) {
      case "gt": return value > compareValue;
      case "lt": return value < compareValue;
      case "gte": return value >= compareValue;
      case "lte": return value <= compareValue;
      default: return true;
    }
  };

  const getOperatorText = (operator: ComparisonOperator): string => {
    switch (operator) {
      case "gt": return ">";
      case "lt": return "<";
      case "gte": return "≥";
      case "lte": return "≤";
      default: return "";
    }
  };

  const displayData = useMemo(() => {
    if (showNonSelling) return nonSellingData;
    if (!salesData) return [];

    return salesData.filter(item => {
      const volumeValue = parseFloat(filters.volumeValue || "0");
      const salesValue = parseFloat(filters.salesValue || "0");
      
      const volumeMatch = compareValues(item.volume, volumeValue, filters.volumeOperator);
      const salesMatch = compareValues(item.totalSales, salesValue, filters.salesOperator);
      
      return volumeMatch && salesMatch;
    });
  }, [salesData, nonSellingData, showNonSelling, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.volumeOperator && filters.volumeValue) count++;
    if (filters.salesOperator && filters.salesValue) count++;
    return count;
  }, [filters]);

  const handleTodayClick = () => {
    const today = new Date();
    setDateRange({ from: today, to: today });
  };

  const handleWeekClick = () => {
    const today = new Date();
    setDateRange({
      from: startOfWeek(today, { weekStartsOn: 1 }),
      to: endOfWeek(today, { weekStartsOn: 1 })
    });
  };

  const handleMonthClick = () => {
    const today = new Date();
    setDateRange({
      from: startOfMonth(today),
      to: endOfMonth(today)
    });
  };

  const chartData = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];
    
    const groupedByDate = salesData.reduce((acc, item) => {
      const date = format(new Date(), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, orders: 0, sales: 0 };
      }
      acc[date].orders += item.volume;
      acc[date].sales += item.totalSales;
      return acc;
    }, {} as Record<string, { date: string; orders: number; sales: number }>);
    
    return Object.values(groupedByDate).slice(0, 7);
  }, [salesData]);

  const totalOrders = useMemo(() => {
    return salesData?.reduce((sum, item) => sum + item.volume, 0) || 0;
  }, [salesData]);

  const totalRevenue = useMemo(() => {
    return salesData?.reduce((sum, item) => sum + item.totalSales, 0) || 0;
  }, [salesData]);

  return (
    <MainLayout
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      activeSection="SALES"
    >
      {/* Sales Trend Chart */}
      <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
        
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₱{totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-orange-600">₱{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Orders"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sales" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Sales (₱)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Header & Controls */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Sales Analytics</h2>
            
            {/* Left side controls */}
            <div className="flex items-center gap-2">
              {/* Filter button */}
              {!showNonSelling && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29] h-9"
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
                    <div className="p-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setVolumeFilter(null, "");
                          setSalesFilter(null, "");
                        }}
                        className="w-full text-xs"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Show Non-Selling button */}
              <Button
                onClick={() => setShowNonSelling(!showNonSelling)}
                variant="outline"
                className={`flex items-center gap-2 bg-white hover:bg-[#FFE6C7] hover:text-[#F15A29] h-9 ${showNonSelling ? "border-[#F15A29] bg-[#FFE6C7]" : ""}`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>{showNonSelling ? "Show Selling" : "Show Non-Selling"}</span>
              </Button>
            </div>
          </div>

          {/* Date controls on the right */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleTodayClick} variant="outline" className="px-3 py-2 text-sm h-9">Today</Button>
            <Button onClick={handleWeekClick} variant="outline" className="px-3 py-2 text-sm h-9">This Week</Button>
            <Button onClick={handleMonthClick} variant="outline" className="px-3 py-2 text-sm h-9">This Month</Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto justify-start text-left font-normal h-9 px-3">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange(range as { from: Date; to: Date });
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Sales Data Table */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        {isLoading || isLoadingNonSelling ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F15A29]"></div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {showNonSelling ? "Non-Selling Products" : "Sales Data"}
            </h3>
            
            {displayData && displayData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Price</TableHead>
                    {!showNonSelling && (
                      <>
                        <TableHead>Volume</TableHead>
                        <TableHead>Total Sales</TableHead>
                      </>
                    )}
                    {showNonSelling && <TableHead>Category</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{(item as any).productName || (item as any).name}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>₱{typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}</TableCell>
                      {!showNonSelling && (
                        <>
                          <TableCell>{(item as SalesData).volume}</TableCell>
                          <TableCell>₱{(item as SalesData).totalSales.toFixed(2)}</TableCell>
                        </>
                      )}
                      {showNonSelling && <TableCell>{(item as NonSellingProduct).categoryName}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>
                  {showNonSelling
                    ? "No non-selling products found for the selected date range."
                    : "No sales data available for the selected date range."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}