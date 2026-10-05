import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users as UsersIcon,
  Flame,
  Pizza as PizzaIcon,
  Soup,
  Clock,
  Calendar,
  Layers,
  ChevronRight,
  Store
} from "lucide-react";
import { adminService } from "../../api/adminService";

export default function AnalyticsTab({
  orders = [],
  restaurantsCount = 0,
  usersCount = 0,
  driversCount = 0,
  setOrders,
  triggerToast,
  onNavigateSubTab,
  setActiveSubTab
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [activeBrandTab, setActiveBrandTab] = useState("all");
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      setIsLoadingApi(true);
      try {
        const data = await adminService.getAdminDashboard();
        if (isMounted && data) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin dashboard analytics:", err);
      } finally {
        if (isMounted) setIsLoadingApi(false);
      }
    };
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = dashboardData?.kpis;
  const realOrders = orders || [];
  const apiOrders = dashboardData?.recentOrders || [];
  const effectiveOrders = apiOrders.length > 0 ? apiOrders : realOrders;

  // Real KPI Metrics
  const totalOrders = kpis?.totalOrders ?? effectiveOrders.length;
  const computedRevenue = effectiveOrders.reduce(
    (sum, o) => sum + Number(o.amount || o.total || 0),
    0
  );
  const totalRevenue = kpis?.totalRevenue && kpis.totalRevenue > 0
    ? kpis.totalRevenue
    : computedRevenue;

  const activeRestaurantsCount = kpis?.totalRestaurants ?? restaurantsCount ?? 0;
  const totalCustomers = kpis?.totalCustomers ?? usersCount ?? 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const computedTodayCount = effectiveOrders.filter((o) => {
    const t = o.timeline || o.timestamp || o.createdAt;
    return t && String(t).includes(todayStr);
  }).length;
  const todayOrdersCount = kpis?.todayOrders ?? computedTodayCount;

  const computedPendingCount = effectiveOrders.filter((o) => {
    const st = (o.orderStatus || o.status || "").toLowerCase();
    return st === "pending" || st === "confirmed" || st === "preparing" || st === "received" || st === "accepted";
  }).length;
  const pendingOrdersCount = kpis?.pendingOrders ?? computedPendingCount;

  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(1) : "0.00";

  // Days calculations
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Revenue by day calculation
  const revenueByDay = days.map((day) => {
    if (dashboardData?.weeklyRevenue?.length > 0) {
      const match = dashboardData.weeklyRevenue.find((wr) => 
        (wr.day && wr.day.toLowerCase().startsWith(day.toLowerCase())) ||
        (wr.week && wr.week.toLowerCase().includes(day.toLowerCase()))
      );
      if (match) return Number(match.revenue || match.val || 0);
    }
    const dayOrders = effectiveOrders.filter((o) => {
      const t = o.timeline || o.timestamp || o.createdAt;
      if (!t) return false;
      const dateObj = new Date(t);
      if (isNaN(dateObj.getTime())) return false;
      const dayName = days[(dateObj.getDay() + 6) % 7];
      return dayName.toLowerCase() === day.toLowerCase();
    });
    return dayOrders.reduce((sum, o) => sum + Number(o.amount || o.total || 0), 0);
  });

  const maxRevenue = Math.max(...revenueByDay, 1);
  const width = 500;
  const height = 180;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = revenueByDay.map((val, idx) => {
    const x = padding + (idx / (revenueByDay.length - 1)) * chartWidth;
    const y = padding + chartHeight - (val / maxRevenue) * chartHeight;
    return { x, y, day: days[idx], val };
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  // Daily orders volume calculations
  const ordersVolumeData = days.map((day) => {
    if (dashboardData?.ordersTransaction?.length > 0) {
      const match = dashboardData.ordersTransaction.find((ot) => ot.day?.toLowerCase().startsWith(day.toLowerCase()));
      return match ? Number(match.orders || 0) : 0;
    }
    return effectiveOrders.filter((o) => {
      const t = o.timeline || o.timestamp || o.createdAt;
      if (!t) return false;
      const dateObj = new Date(t);
      if (isNaN(dateObj.getTime())) return false;
      const dayName = days[(dateObj.getDay() + 6) % 7];
      return dayName.toLowerCase() === day.toLowerCase();
    }).length;
  });

  const maxOrders = Math.max(...ordersVolumeData, 1);
  const ordersPoints = ordersVolumeData.map((count, idx) => {
    const x = padding + (idx / (ordersVolumeData.length - 1)) * chartWidth;
    const barHeight = (count / maxOrders) * chartHeight;
    const y = padding + chartHeight - barHeight;
    return { x, y, day: days[idx], count, barHeight };
  });

  // Dynamic Restaurant Market Share Breakdown
  const restaurantShareList = dashboardData?.restaurantRevenueShare?.length > 0
    ? dashboardData.restaurantRevenueShare.map(r => ({
        name: r.restaurantName || r.name || "Restaurant",
        orders: r.orders || 0,
        revenue: Number(r.revenue || 0),
      }))
    : Object.values(
        effectiveOrders.reduce((acc, o) => {
          const name = o.restaurantName || o.restaurant || "Restaurant";
          if (!acc[name]) acc[name] = { name, orders: 0, revenue: 0 };
          acc[name].orders += 1;
          acc[name].revenue += Number(o.amount || o.total || 0);
          return acc;
        }, {})
      );

  const totalShareRevenue = restaurantShareList.reduce((sum, r) => sum + r.revenue, 0);

  // Top Customer List (supports customerName & totalAmountSpent)
  const rawTopCustomers = dashboardData?.topCustomers || [];
  const topCustomersList = rawTopCustomers.map(c => ({
    id: c._id || c.id || c.email || c.customerName,
    name: c.customerName || c.name || "Customer",
    email: c.email || `${(c.customerName || "user").toLowerCase().replace(/\s+/g, "")}@gmail.com`,
    totalSpent: c.totalAmountSpent ?? c.totalSpent ?? 0,
    ordersCount: c.totalOrders ?? c.ordersCount ?? 0,
  }));

  const modifyStatus = async (orderId, status) => {
    if (setOrders && triggerToast) {
      const updated = orders.map((o) => (o.id === orderId || o.orderId === orderId ? { ...o, status } : o));
      await setOrders(updated);
      triggerToast(`Order #${String(orderId).slice(-6).toUpperCase()} status set to ${status.toUpperCase()}`);
    } else {
      const cached = localStorage.getItem("globaleats_orders");
      if (cached) {
        const ordersList = JSON.parse(cached);
        const updated = ordersList.map((o) => (o.id === orderId || o.orderId === orderId ? { ...o, status } : o));
        localStorage.setItem("globaleats_orders", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      }
    }
  };

  const handleViewDirectory = () => {
    if (typeof onNavigateSubTab === "function") {
      onNavigateSubTab("users");
    } else if (typeof setActiveSubTab === "function") {
      setActiveSubTab("users");
    } else {
      localStorage.setItem("Quikabite_admin_subtab", "users");
      window.dispatchEvent(new Event("storage"));
    }
  };

  return (
    <div className="space-y-6" id="restaurant-analytics-panel">
      {/* 6 RESTAURANT METRIC CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-full -mr-6 -mt-6 opacity-60 blur-lg group-hover:scale-110 transition duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Orders</span>
            <div className="h-7 w-7 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-xl font-black text-gray-900">{totalOrders}</h3>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">
              All active & historic logs
            </p>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-6 -mt-6 opacity-60 blur-lg group-hover:scale-110 transition duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Revenue</span>
            <div className="h-7 w-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-xl font-black text-gray-900">₹ {Number(totalRevenue).toFixed(2)}</h3>
            <p className="text-[9px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>Avg ticket: ₹ {avgOrderValue}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Total Restaurants */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-full -mr-6 -mt-6 opacity-60 blur-lg group-hover:scale-110 transition duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Restaurants</span>
            <div className="h-7 w-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-xl font-black text-gray-900">{activeRestaurantsCount}</h3>
            <p className="text-[9px] font-semibold text-amber-600 mt-1">
              Active restaurant partners
            </p>
          </div>
        </div>

        {/* Card 4: Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -mr-6 -mt-6 opacity-60 blur-lg group-hover:scale-110 transition duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Customers</span>
            <div className="h-7 w-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-xl font-black text-gray-900">{totalCustomers}</h3>
            <p className="text-[9px] font-semibold text-blue-600 mt-1">
              Active accounts verified
            </p>
          </div>
        </div>

        {/* Card 5: Today's Orders */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-full -mr-6 -mt-6 opacity-60 blur-lg group-hover:scale-110 transition duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Today's Orders</span>
            <div className="h-7 w-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-xl font-black text-gray-900">{todayOrdersCount}</h3>
            <p className="text-[9px] font-semibold text-rose-600 mt-1">
              Placed in last 24h
            </p>
          </div>
        </div>

        {/* Card 6: Pending Orders */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft hover:shadow-md transition relative overflow-hidden group border-l-4 border-l-amber-500">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-full -mr-6 -mt-6 opacity-60 blur-lg group-hover:scale-110 transition duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pending Cook</span>
            <div className="h-7 w-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-xl font-black text-amber-600">{pendingOrdersCount} Left</h3>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">
              Awaiting chef response
            </p>
          </div>
        </div>
      </div>

      {/* THREE INTERACTIVE CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: REVENUE GROWTH SPLINES */}
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-soft lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">Weekly Revenue (₹)</h4>
                <p className="text-[9px] text-gray-400 font-medium">Daily restaurant earnings</p>
              </div>
            </div>

            {/* Line SVG Chart */}
            <div className="relative pt-2">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padding + chartHeight * ratio;
                  return <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f8fafc" strokeWidth="1.5" />;
                })}

                <path d={areaD} fill="url(#brand-revenue-gradient)" opacity="0.15" />
                <path d={pathD} fill="none" stroke="#FF6B35" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                {points.map((p, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    {/* Invisible larger hit target circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="14"
                      fill="transparent"
                      onMouseEnter={() => setHoveredNode({ x: p.day, y: p.val, label: `₹ ${Number(p.val).toFixed(2)}` })}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    {/* Visible circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="white"
                      stroke="#FF6B35"
                      strokeWidth="3"
                      className="transition-transform duration-200 group-hover:scale-150"
                      onMouseEnter={() => setHoveredNode({ x: p.day, y: p.val, label: `₹ ${Number(p.val).toFixed(2)}` })}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    <text x={p.x} y={height - padding + 15} textAnchor="middle" className="text-[10px] font-bold text-gray-400 font-mono">
                      {p.day}
                    </text>
                  </g>
                ))}

                <defs>
                  <linearGradient id="brand-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="h-7 mt-1 flex justify-center items-center">
                {hoveredNode ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-black bg-gray-900 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md border border-gray-700">
                    <span className="text-emerald-400">{hoveredNode.x}:</span>
                    <span className="font-mono text-amber-300">{hoveredNode.label}</span>
                  </motion.div>
                ) : (
                  <span className="text-[9px] text-gray-400 font-semibold tracking-wide uppercase">
                    Hover on points for daily revenue
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: DAILY ORDERS VOLUME BARS */}
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-soft lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">Orders Transacted</h4>
                <p className="text-[9px] text-gray-400 font-medium">Daily order frequency curve</p>
              </div>
              <span className="text-[9px] font-black bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full font-mono">
                {totalOrders} Total
              </span>
            </div>

            <div className="relative pt-2">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padding + chartHeight * ratio;
                  return <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f8fafc" strokeWidth="1.5" />;
                })}

                {ordersPoints.map((p, idx) => {
                  const barWidth = 14;
                  return (
                    <g key={idx}>
                      <rect
                        x={p.x - barWidth / 2}
                        y={p.y}
                        width={barWidth}
                        height={p.barHeight}
                        rx="4"
                        fill="url(#brand-orders-gradient)"
                        className="cursor-pointer hover:opacity-80 transition"
                        onMouseEnter={() => setHoveredBar({ x: p.day, y: p.y, count: p.count })}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      <text x={p.x} y={height - padding + 15} textAnchor="middle" className="text-[10px] font-bold text-gray-400 font-mono">
                        {p.day}
                      </text>
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="brand-orders-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="h-6 mt-1 flex justify-center">
                {hoveredBar ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-[9px] font-black bg-neutral-900 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="text-amber-400">{hoveredBar.x}:</span>
                    <span>{hoveredBar.count} Orders Placed</span>
                  </motion.div>
                ) : (
                  <span className="text-[9px] text-gray-400 italic">Hover bars to inspect order totals</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: RESTAURANT PERFORMANCE BREAKDOWN */}
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-soft lg:col-span-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 mb-1">Restaurant Market Share</h4>
            <p className="text-[9px] text-gray-400 font-medium mb-3">Restaurant contribution by revenue</p>

            {restaurantShareList.length > 0 ? (
              <div className="space-y-3">
                {restaurantShareList.slice(0, 3).map((res, idx) => {
                  const colors = [
                    { bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-700", bar: "bg-amber-500", barBg: "bg-amber-100" },
                    { bg: "bg-rose-50/50", border: "border-rose-100", text: "text-rose-700", bar: "bg-rose-500", barBg: "bg-rose-100" },
                    { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700", bar: "bg-emerald-500", barBg: "bg-emerald-100" }
                  ];
                  const c = colors[idx % colors.length];
                  const pct = totalShareRevenue > 0 ? ((res.revenue / totalShareRevenue) * 100).toFixed(0) : 0;

                  return (
                    <div key={res.name} className={`p-2.5 rounded-2xl ${c.bg} border ${c.border}`}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Store className="h-4 w-4 text-gray-700" />
                          <span className="font-extrabold text-gray-900 text-[11px] truncate max-w-[120px]">{res.name}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black ${c.text} text-[11px] block font-mono`}>₹ {res.revenue.toFixed(0)}</span>
                          <span className="text-[9px] font-bold text-gray-400">{res.orders} orders</span>
                        </div>
                      </div>
                      <div className={`h-2 ${c.barBg} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full ${c.bar} rounded-full transition-all duration-1000`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 font-semibold">
                No restaurant revenue data
              </div>
            )}

            <div className="text-center mt-2.5">
              <span className="text-[9px] text-gray-400 font-bold">
                Total combined turnover: <span className="font-black text-gray-800 font-mono">₹ {totalShareRevenue.toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE DATA TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RECENT ORDERS TABLE (8 COLS) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-orange-100 shadow-soft overflow-hidden p-6" id="recent-restaurant-orders-table">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <div>
              <h4 className="font-display font-black text-sm text-gray-900 uppercase tracking-wider">
                Recent Restaurant Orders
              </h4>
              <p className="text-[10px] text-gray-400 font-semibold">
                Actively coordinate cook-times, statuses, and client receipts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-xs">
                <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3 px-3 bg-white">Order ID</th>
                  <th className="py-3 px-3 bg-white">Restaurant Brand</th>
                  <th className="py-3 px-3 bg-white">Specialty Items</th>
                  <th className="py-3 px-3 font-mono bg-white">Amount</th>
                  <th className="py-3 px-3 bg-white">Timeline</th>
                  <th className="py-3 px-3 text-right bg-white">Chef Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {effectiveOrders.length > 0 ? (
                  effectiveOrders.map((order, idx) => {
                    const statusColors = {
                      confirmed: "bg-blue-50 text-blue-600 border border-blue-100",
                      pending: "bg-amber-50 text-amber-600 border border-amber-100",
                      preparing: "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse",
                      out_for_delivery: "bg-sky-50 text-sky-600 border border-sky-100",
                      delivered: "bg-emerald-50 text-emerald-600 border border-emerald-100",
                      rejected: "bg-rose-50 text-rose-600 border border-rose-100"
                    };

                    const rawId = String(order.orderId || order.id || order._id || idx);
                    const formattedTimeline = order.timeline || order.timestamp || order.createdAt
                      ? (String(order.timeline || order.timestamp || order.createdAt).includes("T")
                        ? new Date(order.timeline || order.timestamp || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : String(order.timeline || order.timestamp).split(" ")[1] || order.timeline || order.timestamp)
                      : "Today";

                    const itemsText = order.itemName || (order.items && order.items.length > 0
                      ? order.items.map((i) => `${i.menuItem?.name || i.name || "Item"} (x${i.quantity || 1})`).join(", ")
                      : "Order Item");

                    return (
                      <tr key={rawId + idx} className="hover:bg-orange-50/10 transition group">
                        <td className="py-3.5 px-3 font-black text-gray-900 font-mono">
                          #{rawId.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 font-extrabold text-[11px] text-amber-600">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {order.restaurantName ? order.restaurantName.replace("QuikaBite ", "") : "Restaurant"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="max-w-[160px] truncate font-semibold" title={itemsText}>
                            {itemsText}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-extrabold font-mono text-gray-800">
                          ₹ {Number(order.amount || order.total || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-gray-400 font-bold text-[10px] font-mono">
                          {formattedTimeline}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${statusColors[order.orderStatus || order.status] || "bg-gray-100 text-gray-600"}`}>
                            {order.dispatchStatus === "DISPATCHED" ? "dispatched" : (order.orderStatus || order.status || "pending")}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-gray-400 font-semibold">
                      No recent orders recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT CUSTOMERS CARD (4 COLS) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-orange-100 shadow-soft p-5" id="recent-restaurant-customers-card">
          <h4 className="font-display font-black text-sm text-gray-900 uppercase tracking-wider mb-1">
            Top Performing Diners
          </h4>
          <p className="text-[10px] text-gray-400 font-semibold mb-4">
            Restaurant loyalists index
          </p>

          <div className="space-y-3.5">
            {topCustomersList.length > 0 ? (
              topCustomersList.map((customer, idx) => (
                <div
                  key={customer.id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100 hover:border-orange-100 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${customer.color || "bg-orange-500"} text-white flex items-center justify-center text-xs font-black shadow-xs`}>
                      {customer.avatar || (customer.name ? customer.name.slice(0, 2).toUpperCase() : "CU")}
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-gray-900 leading-tight">
                        {customer.name}
                      </h5>
                      <p className="text-[9px] text-gray-400 font-bold leading-tight mt-0.5 truncate max-w-[150px]">
                        {customer.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900 block font-mono">
                      ₹ {Number(customer.totalSpent || 0).toFixed(2)}
                    </span>
                    <span className="text-[9px] font-bold text-orange-700">
                      {customer.ordersCount || 0} orders
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 font-semibold">
                No customer activity recorded yet
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400">
            <span>Diner conversion: <span className="text-emerald-600 font-extrabold">--</span></span>
            <button
              type="button"
              onClick={handleViewDirectory}
              className="text-orange-700 hover:underline cursor-pointer flex items-center gap-0.5 font-bold outline-none bg-transparent border-none focus:outline-none"
            >
              <span>View Directory</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
