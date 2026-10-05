import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Download,
  Layers,
  Calendar,
  Sparkles,
  ChevronDown,
  Loader2,
  Store
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { adminService } from "../../api/adminService";

export default function ReportingDashboard({ orders = [], triggerToast }) {
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [selectedRange, setSelectedRange] = useState("7days");

  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [biData, setBiData] = useState(null);
  const [isLoadingBi, setIsLoadingBi] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // 1. Fetch Restaurant Dropdown List
  useEffect(() => {
    let isMounted = true;
    const fetchRestaurants = async () => {
      try {
        const list = await adminService.getRestaurantDropdownList();
        if (isMounted && Array.isArray(list)) {
          setRestaurantOptions(list);
        }
      } catch (err) {
        console.error("Failed to load BI restaurants dropdown list:", err);
      }
    };
    fetchRestaurants();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Full BI Dashboard Data
  useEffect(() => {
    let isMounted = true;
    const fetchBiData = async () => {
      setIsLoadingBi(true);
      try {
        const data = await adminService.getFullBIDashboardData(selectedRestaurant);
        if (isMounted && data) {
          setBiData(data);
        }
      } catch (err) {
        console.error("Failed to fetch BI dashboard data:", err);
      } finally {
        if (isMounted) setIsLoadingBi(false);
      }
    };
    fetchBiData();
    return () => {
      isMounted = false;
    };
  }, [selectedRestaurant]);

  // 3. Export CSV Report Handler
  const handleExportReport = async (dataType = "all") => {
    setIsExportingCsv(true);
    try {
      const csvData = await adminService.exportToCsv(selectedRestaurant);
      if (csvData && typeof csvData === "string" && csvData.trim()) {
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bi_report_${selectedRestaurant || "all"}_${dataType}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (triggerToast) {
          triggerToast("Successfully exported BI CSV report! Check your downloads.");
        }
      } else {
        if (triggerToast) triggerToast("CSV report generated!");
      }
    } catch (err) {
      console.error("Failed to export BI CSV report:", err);
      if (triggerToast) triggerToast("Failed to export BI CSV report.");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const kpis = biData?.kpis;
  const safeLiveOrdersList = Array.isArray(orders) ? orders : [];

  const computedTotalRevenue = safeLiveOrdersList.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalRevenue = kpis?.calculatedRevenue ?? biData?.totalRevenue ?? computedTotalRevenue;

  const computedUnitsDispatched = safeLiveOrdersList.reduce(
    (sum, o) => sum + (Array.isArray(o.items) ? o.items.reduce((s, i) => s + Number(i.quantity || 1), 0) : 1),
    0
  );
  const totalItemsSold = kpis?.totalUnitsDispatched ?? biData?.totalUnitsDispatched ?? computedUnitsDispatched;

  const uniqueCustomersCount = kpis?.uniqueActiveCustomers ?? biData?.uniqueActiveCustomers ?? 0;
  const averageOrderValue = kpis?.averageBasketSize ?? biData?.averageBasketSize ?? (safeLiveOrdersList.length > 0 ? totalRevenue / safeLiveOrdersList.length : 0);

  // Strictly real data from API (mapped to support all backend schemas)
  const dailySalesData = (biData?.dailySales || []).map((d) => ({
    date: d.date || d.day || "Date",
    sales: Number(d.sales ?? d.revenue ?? 0),
  }));

  const weeklySalesData = (biData?.weeklyRevenue || []).map((w) => ({
    week: w.week || w.date || "Week",
    sales: Number(w.revenue ?? w.sales ?? 0),
    revenue: Number(w.revenue ?? w.sales ?? 0),
  }));

  const brandPerformanceData = (biData?.restaurantRevenueContribution || biData?.categoryBreakdown || []).map((b) => ({
    name: b.restaurantName || b.category || b.name || "Restaurant",
    value: Number(b.revenue ?? b.value ?? 0),
    salesCount: Number(b.unitsSold ?? b.salesCount ?? b.sales ?? 0),
  }));

  const customerGrowthData = (biData?.customerGrowth || []).map((c) => ({
    date: c.date || "Date",
    activeCustomers: Number(c.activeCustomers ?? 0),
    newCustomers: Number(c.newCustomers ?? 0),
  }));

  const topProducts = (biData?.topPerformingMenuItems || biData?.topSellingItems || []).map((p) => ({
    name: p.menuName || p.name || p.itemName || "Item",
    brand: p.category || p.brand || p.restaurantName || "Category",
    qty: Number(p.quantitySold ?? p.qty ?? p.salesCount ?? 0),
    revenue: Number(p.revenue ?? p.total ?? 0),
  }));

  const topCustomers = (biData?.highestSpendingCustomers || []).map((c) => ({
    customer: c.customerName || c.customer || c.name || "Customer",
    email: c.email || "N/A",
    ordersCount: Number(c.orders ?? c.ordersCount ?? 0),
    totalSpent: Number(c.totalSpent ?? c.revenue ?? 0),
  }));

  const COLORS = ["#FF6B35", "#F43F5E", "#10B981", "#3B82F6", "#8B5CF6"];

  return (
    <div className="space-y-6" id="reporting-dashboard-pane">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-150">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-700 animate-pulse" />
            <span>Interactive Business Intelligence Dashboard</span>
          </h2>
          <p className="text-xs text-neutral-500 font-semibold">
            Evaluate restaurant margins, daily growth vectors, and diner retention indicators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Restaurant Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xl px-4 py-2 text-xs font-bold outline-none appearance-none pr-8 focus:border-neutral-950 transition cursor-pointer"
              id="report-brand-selector"
            >
              <option value="all">All Restaurants</option>
              {restaurantOptions.map((res) => (
                <option key={res._id || res.id} value={res._id || res.id}>
                  {res.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          </div>

          

          {/* Global Export CSV Button */}
          <button
            onClick={() => handleExportReport("full_bi")}
            disabled={isExportingCsv}
            className="px-4 py-2 bg-brand-orange hover:bg-orange-700 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-black uppercase shadow-xs border border-orange-600 cursor-pointer disabled:opacity-50"
          >
            {isExportingCsv ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExportingCsv ? "Exporting..." : "Export CSV Report"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Calculated Revenue",
            value: `₹ ${Number(totalRevenue).toFixed(2)}`,
            desc: "Direct order settlement",
            icon: DollarSign,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100",
          },
          {
            label: "Total Units Dispatched",
            value: `${totalItemsSold} Items`,
            desc: "Kitchen dispatches count",
            icon: ShoppingBag,
            color: "text-orange-700 bg-orange-50 border-orange-100",
          },
          {
            label: "Unique Active Diners",
            value: uniqueCustomersCount,
            desc: "Diners database index",
            icon: Users,
            color: "text-blue-600 bg-blue-50 border-blue-100",
          },
          {
            label: "Avg Basket Size",
            value: `₹ ${Number(averageOrderValue).toFixed(1)}`,
            desc: "Dynamic receipt margins",
            icon: TrendingUp,
            color: "text-purple-600 bg-purple-50 border-purple-100",
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-3xl border border-neutral-150 flex flex-col justify-between shadow-soft hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-black text-neutral-900 font-mono">
                  {card.value}
                </h3>
                <p className="text-[9px] text-neutral-400 font-bold mt-1 uppercase tracking-wide">
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS LAYOUT ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART A: Daily Sales (Area) */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-150 flex flex-col justify-between space-y-4 shadow-soft">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Daily Sales Vectors (₹)</span>
              </h3>
              <p className="text-[10px] text-neutral-400 font-semibold">
                Track daily cash receipts flows.
              </p>
            </div>
            <button
              onClick={() => handleExportReport("daily_sales")}
              disabled={isExportingCsv}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl transition flex items-center gap-1.5 text-[9px] font-black uppercase border border-neutral-200 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>

          <div className="h-64">
            {dailySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailySalesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={9}
                    fontWeight="bold"
                  />
                  <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderRadius: "12px",
                      border: "none",
                    }}
                    labelStyle={{
                      color: "#94a3b8",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    itemStyle={{
                      color: "#10B981",
                      fontSize: "12px",
                      fontWeight: "black",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales (₹)"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-neutral-400">
                No daily sales data recorded
              </div>
            )}
          </div>
        </div>

        {/* CHART B: Weekly Sales Trend (Bar) */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-150 flex flex-col justify-between space-y-4 shadow-soft">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-orange-700" />
                <span>Weekly Cumulative Revenue</span>
              </h3>
              <p className="text-[10px] text-neutral-400 font-semibold">
                Evaluate historical velocity scaling.
              </p>
            </div>
            <button
              onClick={() => handleExportReport("weekly_revenue")}
              disabled={isExportingCsv}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl transition flex items-center gap-1.5 text-[9px] font-black uppercase border border-neutral-200 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>

          <div className="h-64">
            {weeklySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklySalesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="week"
                    stroke="#94a3b8"
                    fontSize={9}
                    fontWeight="bold"
                  />
                  <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderRadius: "12px",
                      border: "none",
                    }}
                    labelStyle={{
                      color: "#94a3b8",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    itemStyle={{
                      color: "#FF6B35",
                      fontSize: "12px",
                      fontWeight: "black",
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    name="Revenue (₹)"
                    fill="#FF6B35"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  >
                    {weeklySalesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === weeklySalesData.length - 1
                            ? "#FF6B35"
                            : "#CCE1D5"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-neutral-400">
                No weekly revenue data recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS LAYOUT ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART C: Brand / Restaurant Contribution (Pie) */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-150 flex flex-col justify-between space-y-4 shadow-soft">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span>Restaurant Revenue Share Contribution</span>
              </h3>
              <p className="text-[10px] text-neutral-400 font-semibold">
                Compare revenue share percentage per restaurant outlet.
              </p>
            </div>
            <button
              onClick={() => handleExportReport("restaurant_contribution")}
              disabled={isExportingCsv}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl transition flex items-center gap-1.5 text-[9px] font-black uppercase border border-neutral-200 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>

          <div className="h-64 grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            {brandPerformanceData.length > 0 ? (
              <>
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={brandPerformanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {brandPerformanceData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          borderRadius: "12px",
                          border: "none",
                        }}
                        itemStyle={{
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "black",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend & Details */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {brandPerformanceData.map((b, idx) => (
                    <div
                      key={b.name || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-md"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-xs font-extrabold text-neutral-800 truncate max-w-[100px]">
                          {b.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-neutral-900 block font-mono">
                          ₹ {Number(b.value || 0).toFixed(0)}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-bold">
                          {b.salesCount || 0} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="col-span-2 text-center py-8 text-xs text-neutral-400 font-semibold">
                No restaurant revenue contribution recorded
              </div>
            )}
          </div>
        </div>

        {/* CHART D: Customer Growth Trend (Line) */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-150 flex flex-col justify-between space-y-4 shadow-soft">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Cumulative Customer Growth</span>
              </h3>
              <p className="text-[10px] text-neutral-400 font-semibold">
                Active accounts signups and orders conversion.
              </p>
            </div>
            <button
              onClick={() => handleExportReport("customer_growth")}
              disabled={isExportingCsv}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl transition flex items-center gap-1.5 text-[9px] font-black uppercase border border-neutral-200 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>

          <div className="h-64">
            {customerGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={customerGrowthData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={9}
                    fontWeight="bold"
                  />
                  <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderRadius: "12px",
                      border: "none",
                    }}
                    labelStyle={{
                      color: "#94a3b8",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    itemStyle={{
                      color: "#3B82F6",
                      fontSize: "12px",
                      fontWeight: "black",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="activeCustomers"
                    name="Active Customers"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newCustomers"
                    name="New Sign-ups"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-neutral-400">
                No customer growth data recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table 1: Top Products */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-neutral-150 p-6 space-y-4 shadow-soft">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Top Performing Recipes
              </h3>
              <p className="text-[10px] text-neutral-400 font-semibold">
                Highest-grossing menu items across restaurants.
              </p>
            </div>
            <button
              onClick={() => handleExportReport("products")}
              disabled={isExportingCsv}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl transition flex items-center gap-1.5 text-[9px] font-black uppercase border border-neutral-200 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[9px] font-black uppercase text-neutral-400 tracking-wider">
                  <th className="py-2.5 px-2">Recipe Item</th>
                  <th className="py-2.5 px-2">Restaurant</th>
                  <th className="py-2.5 px-2 text-center">Qty Sold</th>
                  <th className="py-2.5 px-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-xs text-neutral-700">
                {topProducts.length > 0 ? (
                  topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 px-2 font-black text-neutral-900">
                        {p.name || p.itemName}
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-md border text-[8px] font-black uppercase bg-amber-50 text-amber-700 border-amber-100">
                          {p.brand || p.restaurantName || "Restaurant"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-bold font-mono text-neutral-500">
                        {p.qty || p.salesCount || 0} units
                      </td>
                      <td className="py-3 px-2 text-right font-black font-mono text-neutral-800">
                        ₹ {Number(p.revenue || p.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-neutral-400 font-semibold">
                      No top performing recipe items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Top Customers */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-neutral-150 p-6 space-y-4 shadow-soft">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Highest Ticket Diners
              </h3>
              <p className="text-[10px] text-neutral-400 font-semibold">
                Active accounts filtered by total checkout size.
              </p>
            </div>
            <button
              onClick={() => handleExportReport("customers")}
              disabled={isExportingCsv}
              className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl transition flex items-center gap-1.5 text-[9px] font-black uppercase border border-neutral-200 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[9px] font-black uppercase text-neutral-400 tracking-wider">
                  <th className="py-2.5 px-2">Customer Name</th>
                  <th className="py-2.5 px-2">Identifier Email</th>
                  <th className="py-2.5 px-2 text-center">Orders</th>
                  <th className="py-2.5 px-2 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-xs text-neutral-700">
                {topCustomers.length > 0 ? (
                  topCustomers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 px-2 font-black text-neutral-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-700 font-bold text-[9px] flex items-center justify-center uppercase">
                          {(c.customer || c.name || "Customer")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span>{c.customer || c.name || "Customer"}</span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-neutral-400 font-mono text-[10px]">
                        {c.email || "N/A"}
                      </td>
                      <td className="py-3 px-2 text-center font-bold font-mono text-neutral-500">
                        {c.ordersCount || c.orders || 0} orders
                      </td>
                      <td className="py-3 px-2 text-right font-black font-mono text-neutral-800">
                        ₹ {Number(c.totalSpent || c.revenue || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-neutral-400 font-semibold">
                      No highest ticket diner records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
