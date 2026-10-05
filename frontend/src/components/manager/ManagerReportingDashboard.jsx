// src/components/manager/ManagerReportingDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Users,
  Download,
  Calendar,
  Sparkles,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Search,
  FileSpreadsheet,
  X,
  User,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  Loader2,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import managerService from "../../api/managerService";

const BRAND_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];
const STATUS_COLORS = {
  delivered: "#10b981",
  completed: "#10b981",
  preparing: "#3b82f6",
  confirmed: "#6366f1",
  "ready-for-pickup": "#8b5cf6",
  dispatched: "#f59e0b",
  rejected: "#ef4444",
  cancelled: "#ef4444",
  pending: "#6b7280",
};

export default function ManagerReportingDashboard({ triggerToast }) {
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'today', 'yesterday', 'last7days', 'thismonth', 'custom'
  const [customRange, setCustomRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [detailedOrderData, setDetailedOrderData] = useState(null);
  const [brandViewMode, setBrandViewMode] = useState("graph"); // 'graph' or 'cards'

  const handleOpenOrderDetails = async (order) => {
    if (!order) return;
    setSelectedOrder(order);
    setDetailedOrderData(order);
    setOrderDetailsLoading(true);
    const orderId = order._id || order.id;
    try {
      const fullDetails = await managerService.getOrderDetails(orderId);
      if (fullDetails) {
        setDetailedOrderData(fullDetails);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const fetchStats = async (filterToUse = activeFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await managerService.getDashboardStats(
        filterToUse,
        customRange,
      );
      if (res && res.data) {
        setStatsData(res.data);
        setIsFallback(Boolean(res.isFallback));
      } else {
        throw new Error("No reporting data returned from server");
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError(err.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(activeFilter);
  }, [activeFilter]);

  const handleCustomRangeSubmit = (e) => {
    e.preventDefault();
    if (activeFilter === "custom") {
      fetchStats("custom");
    } else {
      setActiveFilter("custom");
    }
  };

  // Derive CSV export data using backend API or local generator
  const handleExportCSV = async () => {
    try {
      if (!statsData) return;

      // 1. Try Backend CSV Export API (GET /api/v1/dashboard/export?reportType=comprehensive&filter=...&format=csv)
      const exportRes = await managerService.exportDashboardCSV({
        reportType: "comprehensive",
        filter: activeFilter === "all" ? "last30days" : activeFilter,
        format: "csv",
        startDate: customRange.startDate,
        endDate: customRange.endDate,
      });

      if (exportRes && exportRes.success && !exportRes.isFallback) {
        if (triggerToast) {
          triggerToast(
            "Comprehensive CSV Report downloaded via Backend API!",
            "success",
          );
        }
        return;
      }

      // 2. Comprehensive Client-side CSV Generator with all Manager BI Sections
      const escapeCsv = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
      const lines = [];

      // SECTION 1: REPORT METADATA & HEADER
      lines.push(
        "================================================================================",
      );
      lines.push(
        "QuikaBITE KITCHEN MANAGEMENT - EXECUTIVE BI & PERFORMANCE REPORT",
      );
      lines.push(
        "================================================================================",
      );
      lines.push(
        `"Report Filter Scope:",${escapeCsv(activeFilter.toUpperCase())}`,
      );
      lines.push(
        `"Generated Date & Time:",${escapeCsv(new Date().toLocaleString())}`,
      );
      lines.push(
        `"Data Source:",${escapeCsv(isFallback ? "Local System Analytics" : "Live Manager Analytics API")}`,
      );
      if (
        activeFilter === "custom" &&
        customRange.startDate &&
        customRange.endDate
      ) {
        lines.push(
          `"Custom Date Range:",${escapeCsv(`${customRange.startDate} to ${customRange.endDate}`)}`,
        );
      }
      lines.push("");

      // SECTION 2: EXECUTIVE KPI SUMMARY
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push("1. EXECUTIVE KPI SUMMARY");
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push("Metric Name,Value");
      lines.push(
        `"Total Sales / Gross Revenue (₹)",${escapeCsv(kpis.totalRevenue)}`,
      );
      lines.push(`"Total Orders Count",${escapeCsv(kpis.totalOrders)}`);
      lines.push(
        `"Average Order Value (AOV) (₹)",${escapeCsv(kpis.avgOrderValue)}`,
      );
      lines.push(
        `"Completed / Delivered Orders",${escapeCsv(kpis.completedOrders)}`,
      );
      lines.push(`"Active / Pending Orders",${escapeCsv(kpis.activeOrders)}`);
      lines.push(
        `"Order Fulfillment Rate (%)",${escapeCsv(kpis.totalOrders > 0 ? Math.round((kpis.completedOrders / kpis.totalOrders) * 100) + "%" : "100%")}`,
      );
      lines.push("");

      // SECTION 3: TOP SELLING DISHES LEADERBOARD
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push("2. TOP SELLING DISHES LEADERBOARD");
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push("Rank,Dish Name,Quantity Sold,Revenue Generated (₹)");
      if (chartDatasets.topItems.length === 0) {
        lines.push(
          `"N/A","No item sales data available for this timeframe","0","0.00"`,
        );
      } else {
        chartDatasets.topItems.forEach((item, idx) => {
          lines.push(
            `"#${idx + 1}",${escapeCsv(item.name)},${item.count},${Number(item.revenue || 0).toFixed(2)}`,
          );
        });
      }
      lines.push("");

      // SECTION 4: CATEGORY / BRAND BREAKDOWN
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push("3. CATEGORY & CUISINE PERFORMANCE BREAKDOWN");
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push("Category / Brand Name,Revenue Generated (₹)");
      if (chartDatasets.brandData.length === 0) {
        lines.push(`"N/A","No category data available"`);
      } else {
        chartDatasets.brandData.forEach((b) => {
          lines.push(`${escapeCsv(b.name)},${Number(b.value || 0).toFixed(2)}`);
        });
      }
      lines.push("");

      // SECTION 5: HIGHEST SPENDING CUSTOMERS
      if (chartDatasets.topCustomers.length > 0) {
        lines.push(
          "--------------------------------------------------------------------------------",
        );
        lines.push("4. TOP SPENDING CUSTOMERS LEADERBOARD");
        lines.push(
          "--------------------------------------------------------------------------------",
        );
        lines.push("Customer Name,Email,Total Orders,Total Amount Spent (₹)");
        chartDatasets.topCustomers.forEach((cust) => {
          lines.push(
            `${escapeCsv(cust.customerName || "Customer")},${escapeCsv(cust.email || "N/A")},${cust.totalOrders || 1},${Number(cust.totalAmountSpent || 0).toFixed(2)}`,
          );
        });
        lines.push("");
      }

      // SECTION 6: ORDER STATUS ANALYTICS
      if (chartDatasets.statusData.length > 0) {
        lines.push(
          "--------------------------------------------------------------------------------",
        );
        lines.push("5. ORDER STATUS ANALYTICS BREAKDOWN");
        lines.push(
          "--------------------------------------------------------------------------------",
        );
        lines.push("Order Status,Order Count");
        chartDatasets.statusData.forEach((st) => {
          lines.push(`${escapeCsv(st.name.toUpperCase())},${st.value}`);
        });
        lines.push("");
      }

      // SECTION 7: DETAILED ORDERS BREAKDOWN TABLE
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push("6. DETAILED ORDERS BREAKDOWN LIST");
      lines.push(
        "--------------------------------------------------------------------------------",
      );
      lines.push(
        "Order ID,Customer Name,Date / Timestamp,Restaurant / Kitchen,Status,Items & Quantity Summary,Total Amount (₹)",
      );
      const orders =
        filteredOrders.length > 0 ? filteredOrders : statsData.orders || [];
      if (orders.length === 0) {
        lines.push(`"N/A","No orders recorded","N/A","N/A","N/A","N/A","0.00"`);
      } else {
        orders.forEach((o) => {
          const id = o.id || o._id || "N/A";
          const customer = o.customerName || o.customer || o.user?.name || o.userName || "Customer";
          const date =
            o.date ||
            (o.createdAt ? new Date(o.createdAt).toLocaleString() : "Recent");
          const brand =
            o.restaurantName || o.brand || "QuikaBite Partner Kitchen";
          const status = String(o.status || "completed").toUpperCase();
          const amount = Number(
            o.total || o.totalAmount || o.price || 0,
          ).toFixed(2);
          const itemSummary = Array.isArray(o.items)
            ? o.items
              .map((i) => `${i.qty || i.quantity || 1}x ${i.name || i.title}`)
              .join("; ")
            : o.item || "Order Items";

          lines.push(
            [
              escapeCsv(id),
              escapeCsv(customer),
              escapeCsv(date),
              escapeCsv(brand),
              escapeCsv(status),
              escapeCsv(itemSummary),
              amount,
            ].join(","),
          );
        });
      }

      lines.push("");
      lines.push(
        "================================================================================",
      );
      lines.push("END OF REPORT - QuikaBITE MANAGER DASHBOARD");
      lines.push(
        "================================================================================",
      );

      const csvString = lines.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `QuikaBite_Manager_Executive_Report_${activeFilter}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (triggerToast) {
        triggerToast("Detailed Executive CSV report downloaded!", "success");
      }
    } catch (err) {
      console.error("CSV Export error:", err);
      if (triggerToast) triggerToast("Failed to generate CSV export", "error");
    }
  };

  // Process visual chart datasets from live API or fallback
  const chartDatasets = useMemo(() => {
    if (!statsData) {
      return {
        trendData: [],
        statusData: [],
        brandData: [],
        topItems: [],
        topCustomers: [],
      };
    }

    // 1. Top Items
    let topItems = [];
    const rawItems =
      statsData.topSellingItems ||
      statsData.topPerformingMenu ||
      statsData.topItems;
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      topItems = rawItems.map((item) => ({
        name: item.menuName || item.name || "Menu Item",
        count: item.quantitySold || item.count || 1,
        revenue: Number(item.revenueGenerated || item.revenue || 0),
      }));
    }

    // 2. Category / Brand Breakdown
    let brandData = [];
    if (
      Array.isArray(statsData.topCategories) &&
      statsData.topCategories.length > 0
    ) {
      brandData = statsData.topCategories.map((cat) => ({
        name: cat.category || cat.name || "Category",
        value: Number(cat.revenue || cat.orders || cat.value || 0),
      }));
    } else if (Array.isArray(statsData.categoryBreakdown)) {
      brandData = statsData.categoryBreakdown;
    }

    // 3. Order Status Analytics
    let statusData = [];
    if (
      statsData.orderStatusAnalytics &&
      typeof statsData.orderStatusAnalytics === "object"
    ) {
      statusData = Object.entries(statsData.orderStatusAnalytics)
        .filter(([_, count]) => count > 0)
        .map(([name, value]) => ({ name, value }));
    }

    // 4. Sales Trend
    let trendData = [];
    if (
      Array.isArray(statsData.dailySales) &&
      statsData.dailySales.length > 0
    ) {
      trendData = statsData.dailySales.map((d) => ({
        date: d.date || d.day || "Day",
        revenue: Number(d.sales !== undefined ? d.sales : (d.revenue || d.totalSales || 0)),
        orders: Number(d.orders || d.totalOrders || 0),
      }));
    } else if (
      Array.isArray(statsData.weeklyRevenue) &&
      statsData.weeklyRevenue.length > 0
    ) {
      trendData = statsData.weeklyRevenue.map((w) => ({
        date: w.week || w.date || "Week",
        revenue: Number(w.revenue || 0),
        orders: Number(w.orders || 0),
      }));
    }

    // Aggregate from orders array if available
    if (Array.isArray(statsData.orders) && statsData.orders.length > 0) {
      if (topItems.length === 0 && statsData.topItems) {
        topItems = statsData.topItems;
      }

      if (trendData.length === 0) {
        const dateAgg = {};
        const statusAgg = {};
        const brandAgg = {};

        statsData.orders.forEach((o) => {
          const rawDate = o.createdAt || o.date || o.timestamp || Date.now();
          const formattedDate = new Date(rawDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (!dateAgg[formattedDate]) {
            dateAgg[formattedDate] = {
              date: formattedDate,
              revenue: 0,
              orders: 0,
            };
          }
          const val = Number(o.total || o.totalAmount || o.price || 0);
          dateAgg[formattedDate].revenue += val;
          dateAgg[formattedDate].orders += 1;

          const st = String(o.status || "completed").toLowerCase();
          statusAgg[st] = (statusAgg[st] || 0) + 1;

          const brand = o.restaurantName || o.brand || "Main Kitchen";
          brandAgg[brand] = (brandAgg[brand] || 0) + val;
        });

        trendData = Object.values(dateAgg);
        if (statusData.length === 0) {
          statusData = Object.entries(statusAgg).map(([name, value]) => ({
            name,
            value,
          }));
        }
        if (brandData.length === 0) {
          brandData = Object.entries(brandAgg).map(([name, value]) => ({
            name,
            value: Number(value.toFixed(2)),
          }));
        }
      }
    }

    // Default trend point if dataset is still empty
    if (trendData.length === 0) {
      const rev = Number(
        statsData.kpis?.totalRevenue ||
        statsData.totalRevenue ||
        brandData.reduce((s, b) => s + b.value, 0) ||
        topItems.reduce((s, i) => s + i.revenue, 0) ||
        0,
      );
      trendData = [
        {
          date: "Period Total",
          revenue: rev,
          orders: statsData.kpis?.totalOrders || statsData.totalOrders || 0,
        },
      ];
    }

    // Highest spending customers list
    const topCustomers = Array.isArray(statsData.highestSpendingCustomers)
      ? statsData.highestSpendingCustomers
      : [];

    const virtualBrands = Array.isArray(statsData.virtualBrandPerformance)
      ? statsData.virtualBrandPerformance.map((vb) => ({
          brandId: vb.brandId || vb._id || vb.id,
          brandName: vb.brandName || vb.name || "Virtual Brand",
          logo: vb.logo || vb.image || vb.coverImage || "",
          totalOrders: Number(vb.totalOrders || 0),
          quantitySold: Number(
            vb.quantitySold !== undefined ? vb.quantitySold : (vb.totalItemsSold || vb.itemsSold || 0)
          ),
          totalRevenue: Number(vb.totalRevenue || vb.revenue || 0),
          averageOrderValue: Number(
            vb.averageOrderValue !== undefined
              ? vb.averageOrderValue
              : (vb.totalOrders > 0 ? vb.totalRevenue / vb.totalOrders : 0)
          ),
          topSellingDish: vb.topSellingDish || vb.topItem || "",
        }))
      : [];

    return {
      trendData,
      statusData,
      brandData,
      topItems,
      topCustomers,
      virtualBrands,
    };
  }, [statsData]);

  const getCustomerName = useCallback((o) => {
    if (!o) return "Valued Diner";
    if (typeof o.customerName === "string" && o.customerName.trim()) return o.customerName.trim();
    if (typeof o.customer === "string" && o.customer.trim()) return o.customer.trim();
    if (o.customer && typeof o.customer === "object") {
      if (typeof o.customer.name === "string") return o.customer.name;
      if (typeof o.customer.fullName === "string") return o.customer.fullName;
      if (typeof o.customer.firstName === "string") return `${o.customer.firstName} ${o.customer.lastName || ""}`.trim();
    }
    if (typeof o.userName === "string" && o.userName.trim()) return o.userName.trim();
    if (o.user && typeof o.user === "object") {
      if (typeof o.user.name === "string") return o.user.name;
      if (typeof o.user.fullName === "string") return o.user.fullName;
    }
    if (o.deliveryAddress && typeof o.deliveryAddress === "object" && typeof o.deliveryAddress.name === "string") {
      return o.deliveryAddress.name;
    }
    if (o.address && typeof o.address === "object" && typeof o.address.name === "string") {
      return o.address.name;
    }
    if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
    return "Valued Diner";
  }, []);

  const formatAddress = useCallback((addr) => {
    if (!addr) return "Downtown, Dubai";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      return (
        (typeof addr.fullAddress === "string" && addr.fullAddress) ||
        (typeof addr.street === "string" && addr.street) ||
        (typeof addr.address === "string" && addr.address) ||
        (typeof addr.label === "string" && addr.label) ||
        (typeof addr.city === "string" ? `${addr.city}, ${addr.country || ""}` : "Downtown, Dubai")
      );
    }
    return "Downtown, Dubai";
  }, []);

  const formatPhone = useCallback((phone) => {
    if (!phone) return "N/A";
    if (typeof phone === "string" || typeof phone === "number") return String(phone);
    if (typeof phone === "object") {
      return (
        (typeof phone.number === "string" && phone.number) ||
        (typeof phone.phone === "string" && phone.phone) ||
        (typeof phone.mobile === "string" && phone.mobile) ||
        "N/A"
      );
    }
    return "N/A";
  }, []);

  const formatEmail = useCallback((email) => {
    if (!email) return "N/A";
    if (typeof email === "string") return email;
    if (typeof email === "object") {
      return (typeof email.email === "string" && email.email) || "N/A";
    }
    return "N/A";
  }, []);

  const formatOrderDate = useCallback((rawDate) => {
    if (!rawDate) return "N/A";
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(rawDate);
    }
  }, []);

  // Filtered order list for table display
  const filteredOrders = useMemo(() => {
    if (!statsData) return [];

    let ordersList = Array.isArray(statsData.orders) ? statsData.orders : [];

    // Synthesize display rows if API returned top spending customers instead of explicit raw orders array
    if (
      ordersList.length === 0 &&
      Array.isArray(statsData.highestSpendingCustomers) &&
      statsData.highestSpendingCustomers.length > 0
    ) {
      ordersList = statsData.highestSpendingCustomers.map((cust, idx) => ({
        id: `ORD-${Date.now().toString().slice(-4)}-${idx + 1}`,
        customerName: cust.customerName || cust.name || "Customer",
        date: "Recent Activity",
        status: "outForDelivery",
        total: cust.totalAmountSpent || cust.total || 0,
        restaurantName: "QuikaBite Partner Kitchen",
      }));
    }

    return ordersList.filter((o) => {
      const custName = getCustomerName(o);
      const matchesSearch =
        debouncedSearchQuery.trim() === "" ||
        String(o.id || o._id || "")
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        custName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        String(o.restaurantName || o.brand || "")
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        String(o.status).toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [statsData, debouncedSearchQuery, statusFilter, getCustomerName]);

  const kpis = useMemo(() => {
    if (!statsData) {
      return {
        totalRevenue: "₹0.00",
        totalOrders: 0,
        avgOrderValue: "₹0.00",
        completedOrders: 0,
        activeOrders: 0,
        totalUnitsDispatched: 0,
        activeCustomers: 0,
        averageBasketSize: 0,
      };
    }

    const rawKpis = statsData.kpis || statsData;

    const topCategoriesRevenue = Array.isArray(statsData.topCategories)
      ? statsData.topCategories.reduce((sum, c) => sum + Number(c.revenue || 0), 0)
      : 0;

    const topItemsRevenue = Array.isArray(statsData.topSellingItems)
      ? statsData.topSellingItems.reduce((sum, i) => sum + Number(i.revenueGenerated || i.revenue || 0), 0)
      : 0;

    const rawRevenue = Number(
      rawKpis.totalRevenue !== undefined
        ? rawKpis.totalRevenue
        : (statsData.totalRevenue || topCategoriesRevenue || topItemsRevenue || 0)
    );

    const totalOrders = Number(
      rawKpis.totalOrders !== undefined
        ? rawKpis.totalOrders
        : (statsData.totalOrders || 0)
    );

    const avgOrderValue = Number(
      rawKpis.averageOrderValue !== undefined
        ? rawKpis.averageOrderValue
        : (totalOrders > 0 ? rawRevenue / totalOrders : 0)
    );

    const completedOrders = Number(
      rawKpis.totalDeliveredOrders !== undefined
        ? rawKpis.totalDeliveredOrders
        : (statsData.orderStatusAnalytics?.delivered || statsData.completedOrders || 0)
    );

    const activeOrders = Number(
      rawKpis.pendingPreparingOrders !== undefined
        ? rawKpis.pendingPreparingOrders
        : (statsData.activeOrders || 0)
    );

    const totalUnitsDispatched = Number(
      rawKpis.totalUnitsDispatched !== undefined
        ? rawKpis.totalUnitsDispatched
        : 0
    );

    const activeCustomers = Number(
      rawKpis.activeCustomers !== undefined
        ? rawKpis.activeCustomers
        : 0
    );

    const averageBasketSize = Number(
      rawKpis.averageBasketSize !== undefined
        ? rawKpis.averageBasketSize
        : 0
    );

    return {
      totalRevenue: rawRevenue.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
      }),
      totalOrders,
      avgOrderValue: avgOrderValue.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
      }),
      completedOrders,
      activeOrders,
      totalUnitsDispatched,
      activeCustomers,
      averageBasketSize,
    };
  }, [statsData]);

  return (
    <div
      className="space-y-6 text-neutral-100"
      id="manager-reporting-dashboard"
    >
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-neutral-900/90 border border-neutral-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Manager Performance & Reporting
            </h1>

          </div>
          <p className="text-sm text-neutral-400">
            Real-time analytics, revenue trends, and filterable reporting
            endpoints for store management.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchStats(activeFilter)}
            disabled={loading}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-all border border-neutral-700/60 disabled:opacity-50"
            title="Refresh Reporting Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`}
            />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || !statsData}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950/40 border border-emerald-500/40 active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV Report
          </button>
        </div>
      </div>

      {/* Filter Selector Pills */}
      <div className="bg-neutral-900/70 border border-neutral-800/80 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-orange-400" /> Filter:
          </span>
          {[
            { id: "all", label: "All Time", api: "ManagerReportDashboard" },
            { id: "today", label: "Today", api: "ManagerReportToday" },
            {
              id: "yesterday",
              label: "Yesterday",
              api: "ManagerReportYesterday",
            },
            {
              id: "last7days",
              label: "Last 7 Days",
              api: "ManagerReportLast7Days",
            },
            {
              id: "thismonth",
              label: "This Month",
              api: "ManagerReportThisMonth",
            },
            { id: "custom", label: "Custom Range", api: "ManagerReportCustom" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all border ${activeFilter === item.id
                ? "bg-orange-500/20 border-orange-500/60 text-orange-300"
                : "bg-neutral-800/60 border-neutral-700/40 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        {activeFilter === "custom" && (
          <form
            onSubmit={handleCustomRangeSubmit}
            className="flex items-center gap-2"
          >
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) =>
                setCustomRange((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
            />
            <span className="text-neutral-500 text-xs">to</span>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) =>
                setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-orange hover:bg-orange-600 text-white text-xs font-medium rounded-xl transition-all"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && !statsData && (
        <div className="p-12 text-center bg-neutral-900/60 border border-neutral-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
          <p className="text-neutral-300 text-sm font-medium">
            Fetching dashboard statistics...
          </p>
        </div>
      )}

      {/* Error state if no stats data available */}
      {error && !loading && !statsData && (
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-rose-300 mb-1">
            Failed to Connect to Reporting API
          </h3>
          <p className="text-sm text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => fetchStats(activeFilter)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Retry API Connection
          </button>
        </div>
      )}

      {/* Dashboard Main Content */}
      {statsData && (
        <>
          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 1. Total Revenue */}
            <div className="p-4 bg-gradient-to-br from-neutral-900/90 to-neutral-900/50 border border-neutral-800/80 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Total Sales
                </span>
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {kpis.totalRevenue}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Gross revenue
              </p>
            </div>

            {/* 2. Total Orders */}
            <div className="p-4 bg-gradient-to-br from-neutral-900/90 to-neutral-900/50 border border-neutral-800/80 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {kpis.totalOrders}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-orange-400" />
                {kpis.completedOrders} delivered, {kpis.activeOrders} pending
              </p>
            </div>

            {/* 3. Units Dispatched */}
            <div className="p-4 bg-gradient-to-br from-neutral-900/90 to-neutral-900/50 border border-neutral-800/80 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Units Dispatched
                </span>
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {kpis.totalUnitsDispatched}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                Dispatched dish units
              </p>
            </div>

            {/* 4. Active Diners */}
            <div className="p-4 bg-gradient-to-br from-neutral-900/90 to-neutral-900/50 border border-neutral-800/80 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Active Diners
                </span>
                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {kpis.activeCustomers}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                Unique purchasing customers
              </p>
            </div>

            {/* 5. Avg Basket Size */}
            <div className="p-4 bg-gradient-to-br from-neutral-900/90 to-neutral-900/50 border border-neutral-800/80 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Basket Size
                </span>
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {kpis.averageBasketSize} items
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                Items per order
              </p>
            </div>

            {/* 6. Avg Order Value */}
            <div className="p-4 bg-gradient-to-br from-neutral-900/90 to-neutral-900/50 border border-neutral-800/80 rounded-2xl relative overflow-hidden group hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Avg Ticket (AOV)
                </span>
                <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-white tracking-tight">
                {kpis.avgOrderValue}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                Average order spend
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue & Volume Area Chart */}
            <div className="lg:col-span-2 bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue
                    & Order Growth Trend
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Daily sales trajectory
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartDatasets.trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                    <YAxis stroke="#737373" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171717",
                        borderColor: "#404040",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue (₹)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category / Brand Sales Pie */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <PieIcon className="w-4 h-4 text-orange-400" /> Category
                  Breakdown
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Revenue distribution by cuisine/brand
                </p>
              </div>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDatasets.brandData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDatasets.brandData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BRAND_COLORS[index % BRAND_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "16px",
                        color: "#ffffff",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                        padding: "10px 14px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                      itemStyle={{ color: "#38bdf8", fontWeight: "bold" }}
                      formatter={(val, name) => [`₹${Number(val).toLocaleString("en-IN")}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {chartDatasets.brandData.map((b, idx) => (
                  <div
                    key={b.name}
                    className="flex items-center gap-1.5 text-xs text-neutral-300 bg-neutral-800/70 px-2.5 py-1 rounded-lg"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          BRAND_COLORS[idx % BRAND_COLORS.length],
                      }}
                    />
                    <span className="truncate max-w-[100px]">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Virtual Kitchen Brand Performance Matrix & Graph */}
          {chartDatasets.virtualBrands.length > 0 && (
            <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-400" /> Virtual Kitchen Concepts Performance
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Comparative performance graph & metrics per virtual brand concept (Revenue ₹ vs Dispatched Unit Sales).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-xl border border-neutral-700/60">
                    <button
                      onClick={() => setBrandViewMode("graph")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${brandViewMode === "graph" ? "bg-orange-500 text-white shadow-md" : "text-neutral-400 hover:text-white"}`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Graph Chart</span>
                    </button>
                    <button
                      onClick={() => setBrandViewMode("cards")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${brandViewMode === "cards" ? "bg-orange-500 text-white shadow-md" : "text-neutral-400 hover:text-white"}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Metric Cards</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-2 rounded-xl">
                    {chartDatasets.virtualBrands.length} Concepts Active
                  </span>
                </div>
              </div>

              {/* GRAPH CHART VIEW */}
              {brandViewMode === "graph" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDatasets.virtualBrands}
                        margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis
                          dataKey="brandName"
                          stroke="#a3a3a3"
                          fontSize={11}
                          tick={{ fill: "#d4d4d4" }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#FF6B35"
                          fontSize={11}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#06b6d4"
                          fontSize={11}
                        />
                        <Tooltip
                          cursor={false}
                          contentStyle={{
                            backgroundColor: "#171717",
                            borderColor: "#404040",
                            borderRadius: "14px",
                            color: "#fff",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                          }}
                          formatter={(value, name) => {
                            if (name === "Revenue (₹)") return [`₹${Number(value).toLocaleString("en-IN")}`, name];
                            return [`${value} units`, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                        <Bar
                          yAxisId="left"
                          dataKey="totalRevenue"
                          name="Revenue (₹)"
                          fill="#FF6B35"
                          radius={[8, 8, 0, 0]}
                          barSize={36}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="quantitySold"
                          name="Quantity Sold (Units)"
                          fill="#06b6d4"
                          radius={[8, 8, 0, 0]}
                          barSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Brand Summary Legend Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {chartDatasets.virtualBrands.map((vb) => (
                      <div
                        key={vb.brandId || vb.brandName}
                        className="bg-neutral-800/40 border border-neutral-700/40 p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {vb.logo ? (
                            <img
                              src={vb.logo}
                              alt=""
                              className="h-7 w-7 object-cover rounded-lg border border-neutral-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {vb.brandName.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <div className="text-xs font-semibold text-neutral-200 truncate">
                              {vb.brandName}
                            </div>
                            <div className="text-[9px] text-neutral-400">
                              {vb.totalOrders} orders ({vb.quantitySold} units)
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                          ₹{Number(vb.totalRevenue || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CARDS MATRIX VIEW */}
              {brandViewMode === "cards" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {chartDatasets.virtualBrands.map((vb) => (
                    <div
                      key={vb.brandId || vb.brandName}
                      className="p-4 bg-neutral-800/60 border border-neutral-700/50 hover:border-orange-500/40 rounded-2xl space-y-3 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-700/40 pb-2.5">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {vb.logo ? (
                            <img
                              src={vb.logo}
                              alt={vb.brandName}
                              className="h-8 w-8 object-cover rounded-xl border border-neutral-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs shrink-0 border border-orange-500/30">
                              {vb.brandName.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-white truncate">
                              {vb.brandName}
                            </h4>
                            <span className="text-[9px] text-neutral-400 block font-medium">
                              ID: {String(vb.brandId).slice(-6)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-emerald-400 shrink-0">
                          ₹{Number(vb.totalRevenue || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div className="bg-neutral-900/50 p-2 rounded-xl border border-neutral-800 text-center">
                          <span className="text-neutral-400 text-[8px] font-bold uppercase block">
                            Orders
                          </span>
                          <span className="font-black text-neutral-200">
                            {vb.totalOrders || 0}
                          </span>
                        </div>
                        <div className="bg-neutral-900/50 p-2 rounded-xl border border-neutral-800 text-center">
                          <span className="text-neutral-400 text-[8px] font-bold uppercase block">
                            Qty Sold
                          </span>
                          <span className="font-black text-orange-400">
                            {vb.quantitySold || 0}
                          </span>
                        </div>
                        <div className="bg-neutral-900/50 p-2 rounded-xl border border-neutral-800 text-center">
                          <span className="text-neutral-400 text-[8px] font-bold uppercase block">
                            Avg Basket
                          </span>
                          <span className="font-black text-amber-400">
                            ₹{Number(vb.averageOrderValue || 0).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Top Items & Top Customers & Detailed Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Items & Top Customers List */}
            <div className="space-y-6">
              {/* Top Selling Dishes */}
              <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl backdrop-blur-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Top Selling
                  Dishes
                </h3>
                <div className="space-y-3">
                  {chartDatasets.topItems.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-4 text-center">
                      No dish performance data for this period
                    </p>
                  ) : (
                    chartDatasets.topItems.map((item, idx) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-3 bg-neutral-800/50 border border-neutral-700/40 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-neutral-200">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {item.count} orders sold
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-emerald-400">
                          ₹{Number(item.revenue || 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Highest Spending Customers */}
              {chartDatasets.topCustomers.length > 0 && (
                <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl backdrop-blur-xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Top Spending
                    Customers
                  </h3>
                  <div className="space-y-3">
                    {chartDatasets.topCustomers.map((cust, idx) => (
                      <div
                        key={cust.customerName || idx}
                        className="flex items-center justify-between p-3 bg-neutral-800/50 border border-neutral-700/40 rounded-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                            {(cust.customerName || "C").charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-200">
                              {cust.customerName || "Customer"}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {cust.email || `${cust.totalOrders || 1} orders`}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-emerald-400">
                          ₹{Number(cust.totalAmountSpent || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Orders Summary Table */}
            <div className="lg:col-span-2 bg-neutral-900/80 border border-neutral-800 p-6 rounded-3xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-400" /> Period
                  Order Summary
                </h3>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search order ID or customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-neutral-800/80 border border-neutral-700/80 text-xs text-neutral-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-purple-500 w-48"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-neutral-800/80 border border-neutral-700/80 text-xs text-neutral-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="delivered">Delivered</option>
                    <option value="preparing">Preparing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto scrollbar-none">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-800/60 text-neutral-400 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3 rounded-l-xl">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 rounded-r-xl text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-neutral-500"
                        >
                          No matching orders found for active filters.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const statusKey = String(
                          o.status || "completed",
                        ).toLowerCase();
                        const color = STATUS_COLORS[statusKey] || "#10b981";
                        return (
                          <tr
                            key={o.id || o._id}
                            onClick={() => handleOpenOrderDetails(o)}
                            className="hover:bg-neutral-800/80 transition-colors cursor-pointer group"
                            title="Click to view full order details"
                          >
                            <td className="p-3 font-mono font-medium text-neutral-300 group-hover:text-purple-400 transition-colors">
                              #{String(o.id || o._id).slice(-8)}
                            </td>
                            <td className="p-3 font-medium text-neutral-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-500/30">
                                  {getCustomerName(o).charAt(0).toUpperCase()}
                                </div>
                                <span className="truncate">{getCustomerName(o)}</span>
                              </div>
                            </td>
                            <td className="p-3 text-neutral-400">
                              {o.date ||
                                (o.createdAt
                                  ? new Date(o.createdAt).toLocaleDateString()
                                  : "Today")}
                            </td>
                            <td className="p-3">
                              <span
                                className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full capitalize"
                                style={{
                                  backgroundColor: `${color}20`,
                                  color: color,
                                  border: `1px solid ${color}40`,
                                }}
                              >
                                {statusKey}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-400">
                              ₹
                              {Number(
                                o.total || o.totalAmount || o.price || 0,
                              ).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Order Details Modal Popup */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setSelectedOrder(null);
            setDetailedOrderData(null);
          }}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-white shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                    Order #{String(detailedOrderData?._id || detailedOrderData?.id || selectedOrder.id || selectedOrder._id).slice(-8)}
                  </span>
                  <span
                    className="px-2.5 py-1 text-xs font-bold rounded-full capitalize"
                    style={{
                      backgroundColor: `${STATUS_COLORS[String(detailedOrderData?.status || selectedOrder.status).toLowerCase()] || "#10b981"}20`,
                      color: STATUS_COLORS[String(detailedOrderData?.status || selectedOrder.status).toLowerCase()] || "#10b981",
                      border: `1px solid ${STATUS_COLORS[String(detailedOrderData?.status || selectedOrder.status).toLowerCase()] || "#10b981"}40`,
                    }}
                  >
                    {detailedOrderData?.status || selectedOrder.status || "Completed"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral-400">
                  <p>
                    Full ID: <span className="font-mono text-neutral-300 select-all">{detailedOrderData?._id || detailedOrderData?.id || selectedOrder._id || selectedOrder.id}</span>
                  </p>
                  <span className="hidden sm:inline">•</span>
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Placed On: <strong className="text-purple-300">{formatOrderDate(detailedOrderData?.createdAt || selectedOrder?.createdAt || selectedOrder?.date)}</strong></span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setDetailedOrderData(null);
                }}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderDetailsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-xs text-neutral-400 font-medium">Loading order details...</p>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {/* Customer & Restaurant Information */}
                <div className="bg-neutral-800/50 border border-neutral-800 p-4 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" /> Customer &amp; Kitchen Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-300">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Customer Name</span>
                      <span className="font-semibold text-white">{getCustomerName(detailedOrderData || selectedOrder)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Order Placed Date &amp; Time</span>
                      <span className="font-semibold text-purple-300">{formatOrderDate(detailedOrderData?.createdAt || selectedOrder?.createdAt || selectedOrder?.date)}</span>
                    </div>
                    {detailedOrderData?.actualDeliveredAt && (
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Actual Delivered Date &amp; Time</span>
                        <span className="font-semibold text-emerald-400">{formatOrderDate(detailedOrderData.actualDeliveredAt)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Phone</span>
                      <span className="font-semibold text-white">{formatPhone(detailedOrderData?.contactPhone || detailedOrderData?.user?.phone || detailedOrderData?.customerPhone || detailedOrderData?.phone)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Email</span>
                      <span className="font-semibold text-white">{formatEmail(detailedOrderData?.contactEmail || detailedOrderData?.user?.email || detailedOrderData?.customerEmail || detailedOrderData?.email)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Restaurant</span>
                      <span className="font-semibold text-white">{detailedOrderData?.restaurant?.name || detailedOrderData?.restaurantName || "Rominus"} ({detailedOrderData?.restaurant?.city || "Jaipur"})</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Delivery Address</span>
                      <span className="font-semibold text-white block">{formatAddress(detailedOrderData?.address || detailedOrderData?.deliveryAddress)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Logistics Information */}
                {Boolean(detailedOrderData?.delivery || detailedOrderData?.driverName) && (
                  <div className="bg-neutral-800/50 border border-neutral-800 p-4 rounded-2xl space-y-3">
                    <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" /> Delivery Logistics &amp; Driver
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-300">
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Delivery Partner</span>
                        <span className="font-semibold text-white">{detailedOrderData?.delivery?.partner || detailedOrderData?.deliveryPartner || "Gold Partner"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Driver Name</span>
                        <span className="font-semibold text-white">{detailedOrderData?.delivery?.driverName || detailedOrderData?.driverName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Driver Phone</span>
                        <span className="font-semibold text-white">{detailedOrderData?.delivery?.driverPhone || detailedOrderData?.driverPhone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Vehicle Details</span>
                        <span className="font-semibold text-white truncate block">{detailedOrderData?.delivery?.vehicleDetails || detailedOrderData?.vehicleDetails || "N/A"}</span>
                      </div>
                      {detailedOrderData?.delivery?.deliveryRemarks && (
                        <div className="sm:col-span-2">
                          <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Delivery Remarks</span>
                          <span className="font-semibold text-amber-400 block">{detailedOrderData.delivery.deliveryRemarks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Ordered List */}
                <div className="bg-neutral-800/50 border border-neutral-800 p-4 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-400" /> Order Items ({Array.isArray(detailedOrderData?.items || detailedOrderData?.orderItems) ? (detailedOrderData?.items || detailedOrderData?.orderItems).length : 1})
                  </h4>
                  <div className="divide-y divide-neutral-800">
                    {(Array.isArray(detailedOrderData?.items) && detailedOrderData.items.length > 0
                      ? detailedOrderData.items
                      : Array.isArray(detailedOrderData?.orderItems) && detailedOrderData.orderItems.length > 0
                        ? detailedOrderData.orderItems
                        : [
                          {
                            itemName: detailedOrderData?.itemNames || "Gourmet Dish Item",
                            quantity: detailedOrderData?.quantity || 1,
                            unitPrice: Number(detailedOrderData?.total || detailedOrderData?.totalAmount || selectedOrder.total || 0),
                          },
                        ]
                    ).map((item, idx) => {
                      const name = item.itemName || item.name || item.title || item.menuItem?.name || "Gourmet Dish";
                      const qty = item.quantity || item.qty || 1;
                      const price = Number(item.unitPrice ?? item.price ?? item.menuItem?.price ?? 0);
                      const totalItemPrice = Number(item.totalPrice ?? (price * qty));
                      const isVeg = item.isVegetarian !== undefined ? item.isVegetarian : (item.itemType === "veg");

                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-neutral-300">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-[11px]">
                              {qty}x
                            </span>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{name}</span>
                                <span className={`h-2 w-2 rounded-full ${isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
                              </div>
                              {item.category && <span className="text-[10px] text-neutral-500 block">{item.category}</span>}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-white">
                            ₹{totalItemPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment & Bill Summary */}
                <div className="bg-neutral-800/50 border border-neutral-800 p-4 rounded-2xl space-y-2">
                  <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-2 pb-1 border-b border-neutral-800">
                    <CreditCard className="w-4 h-4 text-purple-400" /> Payment &amp; Bill Breakdown
                  </h4>
                  <div className="flex justify-between text-neutral-400 pt-1">
                    <span>Payment Method &amp; Status</span>
                    <span className="font-mono text-neutral-200 uppercase">{String(detailedOrderData?.paymentMethod || "COD")} • <span className="text-emerald-400 font-bold">{String(detailedOrderData?.paymentStatus || "Paid").toUpperCase()}</span></span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-neutral-200">₹{Number(detailedOrderData?.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Delivery Fee</span>
                    <span className="font-mono text-neutral-200">₹{Number(detailedOrderData?.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Taxes &amp; Service</span>
                    <span className="font-mono text-neutral-200">₹{Number(detailedOrderData?.tax || 0).toFixed(2)}</span>
                  </div>
                  {Boolean(detailedOrderData?.discount > 0) && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span className="font-mono">- ₹{Number(detailedOrderData.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-neutral-800">
                    <span>Total Amount</span>
                    <span className="font-mono text-emerald-400">₹{Number(detailedOrderData?.totalAmount || detailedOrderData?.total || selectedOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setDetailedOrderData(null);
                }}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
