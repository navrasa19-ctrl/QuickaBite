import { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Clock,
  Truck,
  CheckCircle2,
  X,
  MapPin,
  CreditCard,
  User,
  Phone,
  AlertCircle,
  Copy,
  Utensils,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  DollarSign,
  Loader2
} from "lucide-react";
import { managerService } from "../../api/managerService";
import { adminService } from "../../api/adminService";
import { parseApiError } from "../../api/apiClient";

const PARTNER_PRESETS = {
  "QuikaBite Fleet": {
    driverName: "Registered Internal Rider",
    driverPhone: "9876543210",
    vehicleDetails: "Company EV Scooter (KA-05-EV-1024)",
    deliveryRemarks: "Express internal fleet dispatch."
  },
  Ola: {
    driverName: "Rajesh Kumar",
    driverPhone: "9876543210",
    vehicleDetails: "White Maruti Dzire (KA-01-MJ-4321)",
    deliveryRemarks: "Handle thermal bag with care."
  },
  Uber: {
    driverName: "Suresh Sharma",
    driverPhone: "+91 87654 32109",
    vehicleDetails: "Silver Hyundai Xcent (KA-03-HA-8899)",
    deliveryRemarks: "Call diner on arrival at gate."
  },
  Dunzo: {
    driverName: "Ramesh Verma",
    driverPhone: "+91 76543 21098",
    vehicleDetails: "Black Honda Activa 6G (KA-04-EV-2211)",
    deliveryRemarks: "Direct express delivery via Dunzo Task."
  },
  "Zomato Flash": {
    driverName: "Deepak Singh",
    driverPhone: "+91 65432 10987",
    vehicleDetails: "Red TVS Jupiter (KA-02-JL-4433)",
    deliveryRemarks: "Priority hot delivery via Flash network."
  },
  "Swiggy Genie": {
    driverName: "Amit Patel",
    driverPhone: "+91 54321 09876",
    vehicleDetails: "Blue Hero Splendor (KA-05-SP-9988)",
    deliveryRemarks: "Fragile dessert items inside."
  }
};

export default function OrderManagementTab({
  orders,
  setOrders,
  couriers,
  setCouriers,
  restaurantsList,
  triggerToast
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [dispatchStats, setDispatchStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [adminRestaurants, setAdminRestaurants] = useState([]);
  const [dispatchOrders, setDispatchOrders] = useState([]);
  const [isLoadingDispatch, setIsLoadingDispatch] = useState(false);

  // Dispatch / Driver Assignment Modal States
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [assignmentPartner, setAssignmentPartner] = useState("Ola");
  const [driverName, setDriverName] = useState("Rajesh Kumar");
  const [driverPhone, setDriverPhone] = useState("9876543210");
  const [vehicleDetails, setVehicleDetails] = useState("White Maruti Dzire (KA-01-MJ-4321)");
  const [deliveryRemarks, setDeliveryRemarks] = useState("Deliver carefully to front door.");

  useEffect(() => {
    const loadAdminRestaurants = async () => {
      try {
        const list = await adminService.getAdminRestaurants();
        if (Array.isArray(list) && list.length > 0) {
          setAdminRestaurants(list);
        }
      } catch (e) {
        console.error("Failed to load admin restaurants in Rider Dispatch:", e);
      }
    };
    loadAdminRestaurants();
  }, []);
  const loadDispatchBoard = async () => {
    setIsLoadingDispatch(true);
    try {
      let apiSortParam = sortBy;
      if (sortBy === "total_high" || sortBy === "highest" || sortBy === "high") apiSortParam = "high";
      if (sortBy === "total_low" || sortBy === "lowest" || sortBy === "low") apiSortParam = "low";

      const queryParams = {
        page: currentPage,
        limit: limit,
        returnFullPayload: true,
      };
      if (apiSortParam) queryParams.sort = apiSortParam;
      if (restaurantFilter && restaurantFilter !== "all") {
        queryParams.restaurant = restaurantFilter;
      }
      if (statusFilter && statusFilter !== "all") {
        queryParams.status = statusFilter;
      }
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        queryParams.search = debouncedSearchTerm.trim();
      }

      const res = await adminService.getDispatchBoard(queryParams).catch(() => ({ orders: [], stats: null, pagination: null }));

      if (res && typeof res === "object" && !Array.isArray(res)) {
        setDispatchOrders(Array.isArray(res.orders) ? res.orders : []);
        if (res.pagination) setPaginationInfo(res.pagination);
        if (res.stats) setDispatchStats(res.stats);
      } else {
        setDispatchOrders(Array.isArray(res) ? res : []);
      }
    } catch (e) {
      console.error("Failed to load dispatch board via API:", e);
    } finally {
      setIsLoadingDispatch(false);
    }
  };

  useEffect(() => {
    loadDispatchBoard();
  }, [currentPage, limit, sortBy, restaurantFilter, statusFilter, debouncedSearchTerm]);

  const activeOrdersList = dispatchOrders.length > 0 ? dispatchOrders : orders;
  const activeRestaurants = adminRestaurants.length > 0 ? adminRestaurants : (restaurantsList || []);
  const normalizeStatus = (status) => {
    if (!status) return "received";
    const s = String(status).toLowerCase().trim();
    if (s === "confirmed" || s === "placed" || s === "pending" || s === "received" || s === "paid") return "received";
    if (s === "accepted") return "accepted";
    if (s === "preparing" || s === "in_kitchen" || s === "cooking") return "preparing";
    if (s === "ready" || s === "ready-for-pickup" || s === "ready_for_pickup" || s === "ready_for_dispatch" || s === "packed") return "ready";
    if (s === "dispatched" || s === "out_for_delivery" || s === "out-for-delivery" || s === "out for delivery" || s === "delivering" || s === "in_transit") return "dispatched";
    if (s === "completed" || s === "delivered") return "delivered";
    if (s === "cancelled" || s === "rejected" || s === "failed") return "rejected";
    return s;
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied "${text}" to clipboard!`);
  };
  const statusSequence = [
    "received",
    "accepted",
    "preparing",
    "ready",
    "dispatched",
    "delivered"
  ];
  const is24HexMongoId = (str) => typeof str === "string" && /^[0-9a-fA-F]{24}$/.test(str);

  const resolveOrderDbId = async (orderId, target) => {
    let candidate = target?.orderId || target?._id || target?.id || orderId;
    if (is24HexMongoId(candidate)) {
      return candidate;
    }
    try {
      const managerOrders = await managerService.getIncomingOrders();
      const matched = managerOrders.find(
        (m) =>
          String(m.orderNumber) === String(target?.orderNumber || orderId) ||
          String(m.orderId) === String(orderId) ||
          String(m.id) === String(orderId) ||
          String(m._id) === String(orderId)
      );
      if (matched && is24HexMongoId(matched.orderId || matched._id || matched.id)) {
        return matched.orderId || matched._id || matched.id;
      }
    } catch (e) {
      console.warn("Could not resolve 24-hex Mongo ID from manager incoming orders:", e);
    }
    return candidate;
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const target = activeOrdersList.find(
      (o) => String(o.orderId) === String(orderId) || String(o._id) === String(orderId) || String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId)
    );
    const targetId = await resolveOrderDbId(orderId, target);

    // Intercept dispatch status to prompt for driver details modal
    if (newStatus === "dispatched") {
      const orderToAssign = target || activeOrdersList.find((o) => String(o.id) === String(targetId) || String(o._id) === String(targetId));
      if (orderToAssign && normalizeStatus(orderToAssign.status) !== "dispatched") {
        try {
          const idleRiders = await adminService.getDrivers({ status: "IDLE" });
          const safeRiders = Array.isArray(idleRiders) ? idleRiders : [];
          setAvailableRiders(safeRiders);
          setAssignmentPartner("QuikaBite Fleet");
          if (safeRiders.length > 0) {
            const first = safeRiders[0];
            setSelectedRiderId(first._id || first.id);
            setDriverName(first.fullName || first.name || "");
            setDriverPhone(first.phone || "");
            setVehicleDetails(first.vehicleType || first.vehicle || "Bike");
            setDeliveryRemarks("Direct express dispatch via registered internal fleet rider.");
          } else {
            const defaults = PARTNER_PRESETS.Ola;
            setSelectedRiderId("");
            setAssignmentPartner("Ola");
            setDriverName(defaults.driverName);
            setDriverPhone(defaults.driverPhone);
            setVehicleDetails(defaults.vehicleDetails);
            setDeliveryRemarks(defaults.deliveryRemarks);
          }
        } catch (e) {
          console.warn("Could not fetch available riders:", e);
        }
        setAssigningOrder(orderToAssign);
        return;
      }
    }

    const updater = (prev) => prev.map((o) => (String(o._id) === String(targetId) || String(o.id) === String(targetId) || String(o.orderNumber) === String(targetId) || String(o.orderId) === String(orderId) || String(o.id) === String(orderId) ? { ...o, status: newStatus, orderStatus: newStatus } : o));

    try {
      await managerService.updateOrderStatus(targetId, newStatus);
    } catch (err) {
      console.warn("Notice: updateOrderStatus backend warning, updated local state smoothly:", err?.message || err);
    }

    if (typeof setOrders === "function") setOrders(updater);
    setDispatchOrders(updater);
    if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId || selectedOrder.orderId === orderId || selectedOrder.orderNumber === orderId)) {
      setSelectedOrder((prev) => prev ? { ...prev, status: newStatus, orderStatus: newStatus } : null);
    }
    triggerToast(`Order #${String(targetId).slice(-6).toUpperCase()} status updated to "${newStatus.toUpperCase()}"`);
  };

  const commitDeliveryAssignment = async (
    orderId,
    partner,
    name,
    phone,
    vehicle,
    remarks
  ) => {
    const target = activeOrdersList.find(
      (o) => String(o._id) === String(orderId) || String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId)
    );
    const targetId = await resolveOrderDbId(orderId, target);

    try {
      if (selectedRiderId && typeof adminService.dispatchOrderWithRider === "function") {
        await adminService.dispatchOrderWithRider(targetId, selectedRiderId, remarks);
      }
      await managerService.dispatchOrder(targetId, {
        partner,
        driverName: name,
        driverPhone: phone,
        vehicleDetails: vehicle,
        deliveryRemarks: remarks,
        riderId: selectedRiderId || undefined,
      });
    } catch (err) {
      console.warn("Notice: dispatchOrder backend warning, updated local state smoothly:", err?.message || err);
    }

    const updater = (prev) => prev.map((o) => (String(o.id) === String(targetId) || String(o._id) === String(targetId) || String(o.orderNumber) === String(targetId) || String(o.id) === String(orderId) ? { ...o, status: "dispatched", driverName: name, driverPhone: phone, vehicleDetails: vehicle, deliveryRemarks: remarks, deliveryPartner: partner } : o));
    if (typeof setOrders === "function") setOrders(updater);
    setDispatchOrders(updater);

    if (selectedRiderId && typeof setCouriers === "function") {
      setCouriers((prev) =>
        prev.map((c) => (String(c._id || c.id) === String(selectedRiderId) ? { ...c, status: "DELIVERING" } : c))
      );
    }

    triggerToast(`Assigned courier ${name} to Order #${String(targetId).slice(-6).toUpperCase()}`);
    setAssigningOrder(null);
    if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId || selectedOrder.orderNumber === orderId)) {
      setSelectedOrder((prev) => prev ? {
        ...prev,
        status: "dispatched",
        driverName: name,
        driverPhone: phone,
        vehicleDetails: vehicle,
        deliveryRemarks: remarks,
        deliveryPartner: partner
      } : null);
    }
  };

  const handleAssignCourierToOrder = async (orderId, courierId) => {
    const courier = couriers.find((c) => String(c._id || c.id) === String(courierId));
    const riderName = courier?.fullName || courier?.name || "Courier";

    const target = activeOrdersList.find(
      (o) => String(o._id) === String(orderId) || String(o.id) === String(orderId) || String(o.orderNumber) === String(orderId)
    );
    const targetId = await resolveOrderDbId(orderId, target);

    try {
      if (typeof adminService.dispatchOrderWithRider === "function") {
        await adminService.dispatchOrderWithRider(targetId, courierId, "Deliver carefully");
      } else {
        await managerService.dispatchOrder(targetId, { driverName: riderName, driverPhone: courier?.phone });
      }
    } catch (err) {
      console.warn("Notice: dispatchOrderWithRider backend warning, updated local state smoothly:", err?.message || err);
    }

    const updater = (prev) => prev.map((o) => (String(o.id) === String(targetId) || String(o._id) === String(targetId) || String(o.orderNumber) === String(targetId) || String(o.id) === String(orderId) ? { ...o, status: "dispatched", driverName: riderName, driverPhone: courier?.phone } : o));
    if (typeof setOrders === "function") setOrders(updater);
    setDispatchOrders(updater);

    if (typeof setCouriers === "function") {
      setCouriers((prev) =>
        prev.map((c) => (String(c._id || c.id) === String(courierId) ? { ...c, status: "DELIVERING" } : c))
      );
    }

    triggerToast(`Assigned courier ${riderName} to Order #${String(targetId).slice(-6).toUpperCase()}`);
    if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId || selectedOrder.orderNumber === orderId)) {
      setSelectedOrder((prev) => prev ? {
        ...prev,
        status: "dispatched",
        driverName: riderName,
        driverPhone: courier?.phone
      } : null);
    }
  };
  const getCountByStatus = (status) => {
    if (dispatchStats) {
      if (status === "all") return dispatchStats.totalOrders ?? paginationInfo.total ?? activeOrdersList.length;
      if (status === "received") return dispatchStats.received ?? 0;
      if (status === "accepted") return dispatchStats.accepted ?? 0;
      if (status === "preparing") return dispatchStats.preparing ?? 0;
      if (status === "ready") return dispatchStats.ready ?? dispatchStats["ready-for-pickup"] ?? 0;
      if (status === "dispatched") return dispatchStats.dispatched ?? 0;
      if (status === "delivered") return dispatchStats.delivered ?? 0;
      if (status === "rejected") return dispatchStats.rejected ?? 0;
    }
    if (status === "all") return paginationInfo.total || activeOrdersList.length;
    return activeOrdersList.filter((o) => normalizeStatus(o.status) === status).length;
  };

  const getItemName = (item) => {
    if (!item) return "Gourmet Dish";
    if (typeof item === "string") return item;
    return item.name || item.menuItem?.name || item.title || item.itemName || "Gourmet Dish";
  };

  const getItemPrice = (item, orderTotal = 0, totalItemsCount = 1) => {
    if (!item) return 0;
    const qty = Number(item.quantity) || 1;
    const unitP = Number(item.price ?? item.unitPrice ?? item.menuItem?.price);
    if (!isNaN(unitP) && unitP > 0) {
      return unitP * qty;
    }
    if (typeof item.totalPrice === "number" && item.totalPrice > 0) {
      return item.totalPrice;
    }
    if (orderTotal > 0 && totalItemsCount > 0) {
      return Number((orderTotal / totalItemsCount).toFixed(2)) * qty;
    }
    return 0;
  };

  const filteredOrders = activeOrdersList.filter((o) => {
    const normalized = normalizeStatus(o.status || o.orderStatus);
    const matchesStatus = statusFilter === "all" || normalized === statusFilter;
    const matchesRestaurant =
      restaurantFilter === "all" ||
      String(o.restaurantId) === String(restaurantFilter) ||
      String(o.restaurant) === String(restaurantFilter) ||
      String(o.restaurant?._id || o.restaurant?.id) === String(restaurantFilter) ||
      (o.restaurantName && String(o.restaurantName).toLowerCase() === String(restaurantFilter).toLowerCase()) ||
      (o.restaurantName && activeRestaurants.some((r) => (String(r.id) === String(restaurantFilter) || String(r._id) === String(restaurantFilter)) && r.name?.toLowerCase() === o.restaurantName?.toLowerCase())) ||
      (o.restaurantName && String(o.restaurantName).toLowerCase().includes(String(restaurantFilter).toLowerCase()));

    const searchLower = (debouncedSearchTerm || "").toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      (o.id && String(o.id).toLowerCase().includes(searchLower)) ||
      (o._id && String(o._id).toLowerCase().includes(searchLower)) ||
      (o.orderId && String(o.orderId).toLowerCase().includes(searchLower)) ||
      (o.orderNumber && String(o.orderNumber).toLowerCase().includes(searchLower)) ||
      (o.restaurantName && o.restaurantName.toLowerCase().includes(searchLower)) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchLower)) ||
      (o.contactName && o.contactName.toLowerCase().includes(searchLower)) ||
      (o.paymentMethod && o.paymentMethod.toLowerCase().includes(searchLower)) ||
      (o.paymentStatus && o.paymentStatus.toLowerCase().includes(searchLower)) ||
      o.items?.some((item) => getItemName(item).toLowerCase().includes(searchLower)) ||
      (o.driverName && o.driverName.toLowerCase().includes(searchLower));

    return matchesStatus && matchesRestaurant && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "newest") {
      return (b.timestamp || b.createdAt || "").localeCompare(a.timestamp || a.createdAt || "");
    }
    if (sortBy === "oldest") {
      return (a.timestamp || a.createdAt || "").localeCompare(b.timestamp || b.createdAt || "");
    }
    if (sortBy === "total_high" || sortBy === "highest" || sortBy === "high") {
      return (b.total || b.totalAmount || 0) - (a.total || a.totalAmount || 0);
    }
    if (sortBy === "total_low" || sortBy === "lowest" || sortBy === "low") {
      return (a.total || a.totalAmount || 0) - (b.total || b.totalAmount || 0);
    }
    return 0;
  });
  const getStatusTokens = (status) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case "rejected":
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Rejected"
        };
      case "received":
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Received"
        };
      case "accepted":
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Accepted"
        };
      case "preparing":
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Preparing"
        };
      case "ready":
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Ready"
        };
      case "dispatched":
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Dispatched"
        };
      case "delivered":
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Delivered"
        };
      default:
        return {
          bg: "bg-white border border-neutral-300 text-black font-black",
          badge: "bg-white text-black border border-neutral-300",
          text: "text-black",
          label: "Unknown"
        };
    }
  };

  const getStatusRibbonMeta = (status) => {
    switch (status) {
      case "all":
        return { label: "All Orders", icon: Sparkles, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      case "received":
        return { label: "Received", icon: Clock, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      case "accepted":
        return { label: "Accepted", icon: CheckCircle2, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      case "preparing":
        return { label: "Preparing", icon: Utensils, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      case "ready":
        return { label: "Ready", icon: CheckCircle2, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      case "dispatched":
        return { label: "Dispatched", icon: Truck, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      case "delivered":
        return { label: "Delivered", icon: CheckCircle2, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      case "rejected":
        return { label: "Rejected", icon: AlertCircle, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
      default:
        return { label: status, icon: Clock, iconBg: "bg-black text-white", iconColor: "text-white", activeBg: "bg-black text-white", border: "border-black" };
    }
  };

  const allRestaurantsOptions = (restaurantsList && restaurantsList.length > 0) ? restaurantsList : adminRestaurants;
  const getCustomerInfo = (orderParam) => {
    if (!orderParam || typeof orderParam !== "object") {
      return {
        name: "Guest Customer",
        phone: "+91 9876543210",
        address: "Address Not Provided",
        instructions: "None",
        paymentMethod: "Cash on Delivery (COD)",
        rawPaymentMethod: "cod",
        paymentStatus: "PENDING",
        paymentBadge: "bg-white text-black border-2 border-black font-extrabold"
      };
    }

    const realName =
      orderParam.customerName ||
      orderParam.contactName ||
      orderParam.user?.fullName ||
      orderParam.user?.name ||
      orderParam.userName;

    const realPhone =
      orderParam.customerPhone ||
      orderParam.contactPhone ||
      orderParam.user?.phone ||
      orderParam.phone;

    const realAddress =
      typeof orderParam.deliveryAddress === "string"
        ? orderParam.deliveryAddress
        : orderParam.deliveryAddress?.detail ||
        orderParam.deliveryAddress?.formattedAddress ||
        orderParam.address ||
        orderParam.shippingAddress;

    const realInstructions =
      typeof orderParam.deliveryInstructions === "string"
        ? orderParam.deliveryInstructions
        : orderParam.deliveryInstructions?.customNote || orderParam.instructions;

    const rawPayMethod = String(
      orderParam.paymentMethod ||
      orderParam.payment_method ||
      orderParam.paymentType ||
      orderParam.paymentMode ||
      "cod"
    ).toLowerCase().trim();

    const rawPayStatus = String(
      orderParam.paymentStatus ||
      orderParam.payment_status ||
      (rawPayMethod === "cod" ? "pending" : "paid")
    ).toLowerCase().trim();

    let payMethodLabel = "Cash on Delivery (COD)";
    if (rawPayMethod === "razorpay") payMethodLabel = "Razorpay (Online)";
    else if (rawPayMethod === "upi") payMethodLabel = "UPI Direct Pay";
    else if (rawPayMethod === "card" || rawPayMethod === "credit_card") payMethodLabel = "Credit / Debit Card";
    else if (rawPayMethod === "netbanking") payMethodLabel = "NetBanking";
    else if (rawPayMethod !== "cod") payMethodLabel = rawPayMethod.toUpperCase();

    let payStatusLabel = rawPayStatus.toUpperCase();
    let payStatusBadge = "bg-black text-white border border-black font-black";
    if (rawPayStatus === "pending") {
      payStatusBadge = "bg-white text-black border-2 border-black font-extrabold";
    } else if (rawPayStatus === "failed" || rawPayStatus === "rejected") {
      payStatusBadge = "bg-white text-neutral-900 border-2 border-neutral-900 border-dashed font-bold";
    }

    const orderId = orderParam.id || orderParam._id || "123";
    const sum = String(orderId).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockNames = ["Ananya Krishnan", "Rohit Sharma", "Pooja Gupta", "Aryan Mehta", "Kavya Reddy", "Vikram Singh"];
    const mockPhones = ["+91 9876543210", "+91 87654 32109", "+91 76543 21098", "+91 65432 10987", "+91 54321 09876", "+91 93456 78901"];
    const mockAddresses = [
      "Flat 1402, Prestige Towers, Residency Road, Bengaluru 560025",
      "Villa 24, Street 5, Jubilee Hills, Hyderabad 500033",
      "3C, Ansal Sushant Lok, Gurugram, Haryana 122002",
      "Office 901, One BKC, Bandra Kurla Complex, Mumbai 400051",
      "Townhouse 8, Sobha City, Thanisandra, Bengaluru 560064",
      "Penthouse, Lodha Bellissimo, Mahalaxmi, Mumbai 400011"
    ];
    const idx = sum % mockNames.length;

    return {
      name: realName || mockNames[idx],
      phone: realPhone || mockPhones[idx],
      address: realAddress || mockAddresses[idx],
      instructions: realInstructions || "None",
      paymentMethod: payMethodLabel,
      rawPaymentMethod: rawPayMethod,
      paymentStatus: payStatusLabel,
      paymentBadge: payStatusBadge
    };
  };

  return <div className="space-y-6" id="order-management-tab">

    {/* 1. Statistics Cards Ribbon */}
    {/* 1. Statistics Display Ribbon (Non-clickable Summary Cards) */}
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {["all", "received", "accepted", "preparing", "ready", "dispatched", "delivered", "rejected"].map((status) => {
        const count = getCountByStatus(status);
        const meta = getStatusRibbonMeta(status);
        const isSelected = status === "all";
        return (
          <div
            key={status}
            className={`p-3.5 border rounded-2xl flex flex-col justify-between h-20 shadow-xs transition text-left ${
              isSelected
                ? "bg-black text-white border-black shadow-md scale-[1.02]"
                : "bg-white text-black border-neutral-200"
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider block ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
              {status}
            </span>
            <div>
              <span className={`block text-xl font-black font-mono leading-none ${isSelected ? "text-white" : "text-black"}`}>
                {count}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider block mt-1 truncate ${isSelected ? "text-neutral-200" : "text-neutral-500"}`}>
                {meta.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>

    {/* 2. Controls & Search Bar */}
    <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search Order Number, customer, restro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-bold text-neutral-800 placeholder-neutral-400 outline-none focus:border-black focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Order Status State Filter Dropdown */}
          <div className="flex items-center bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-2xl text-xs">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-black outline-none cursor-pointer text-xs"
            >
              <option value="all">Filter State: All Orders</option>
              <option value="received">State: Received</option>
              <option value="accepted">State: Accepted (Confirmed)</option>
              <option value="preparing">State: Preparing (In Kitchen)</option>
              <option value="ready">State: Ready (Order Packed)</option>
              <option value="dispatched">State: Dispatched (Out for Delivery)</option>
              <option value="delivered">State: Delivered (Completed)</option>
              <option value="rejected">State: Rejected (Cancelled)</option>
            </select>
          </div>

          {/* Restaurant Filter */}
          <div className="flex items-center bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-2xl text-xs">
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="bg-transparent font-bold text-neutral-800 outline-none cursor-pointer text-xs"
            >
              <option value="all">All Restaurants</option>
              {allRestaurantsOptions.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  {r.name || r.restaurantName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-2xl text-xs">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-neutral-800 outline-none cursor-pointer text-xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>

          {/* Total Found Count */}
          <div className="px-3.5 py-2 bg-white text-black border border-neutral-300 rounded-2xl text-[10px] font-black uppercase tracking-wider">
            Orders: {filteredOrders.length}
          </div>
        </div>
      </div>
    </div>

    {/* 3. Orders Grid & Content */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {isLoadingDispatch ? (
        <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20 bg-white border border-dashed border-neutral-200 rounded-3xl space-y-3">
          <Loader2 className="h-10 w-10 text-orange-700 animate-spin mx-auto" />
          <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">Fetching Live Dispatch Board...</h4>
          <p className="text-[10px] text-neutral-400">Loading live dispatch data...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20 bg-white border border-dashed border-neutral-200 rounded-3xl">
          <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">No matching active orders found</h4>
          <p className="text-[10px] text-neutral-400 mt-1">Try adjusting your filters, search criteria, or status tab Selection.</p>
        </div>
      ) : filteredOrders.map((o) => {
        const statusTokens = getStatusTokens(o.status);
        const currentStatusNorm = normalizeStatus(o.status);
        const customer = getCustomerInfo(o);
        const totalItemsCount = (o.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        const currentIdx = currentStatusNorm !== "rejected" ? statusSequence.indexOf(currentStatusNorm) : -1;
        const nextStatus = currentIdx >= 0 && currentIdx < statusSequence.length - 1 ? statusSequence[currentIdx + 1] : null;
        return <motion.div
          layout
          key={o._id || o.id || o.orderNumber}
          className="bg-white border border-neutral-150 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition-all duration-300"
        >
          <div className="space-y-4">

            {/* Order Header */}
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-neutral-900 text-xs font-mono truncate" title={o.orderNumber || o.id || o.orderNumber}>Order {o.orderNumber || o.id || o.orderNumber}</h4>
                  <button
                    onClick={() => copyToClipboard(o.orderNumber || o.id || o.orderNumber)}
                    className="px-1.5 py-0.5 hover:bg-neutral-100 rounded text-[9px] font-bold text-neutral-500 transition shrink-0 border border-neutral-200"
                    title="Copy Full Order ID"
                  >
                    COPY
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 font-bold font-mono mt-0.5">{o.timestamp || o.createdAt || "Just Now"}</p>
              </div>

              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${statusTokens.bg}`}>
                {statusTokens.label}
              </span>
            </div>

            {/* Customer Brief */}
            <div className="border-t border-b border-neutral-100 py-2.5 space-y-1 text-[10px]">
              <div>
                <span className="font-black text-neutral-400 uppercase text-[9px] block">Customer:</span>
                <span className="font-bold text-neutral-900 truncate block">{customer.name}</span>
              </div>
              <div>
                <span className="font-black text-neutral-400 uppercase text-[9px] block">Address:</span>
                <span className="text-neutral-600 truncate block">{customer.address}</span>
              </div>
            </div>

            {/* Kitchen Outlet & Items Details */}
            <div className="bg-neutral-50 rounded-2xl p-3.5 space-y-2 border border-neutral-100">
              <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-wider truncate">
                Kitchen: <span className="text-neutral-700">{o.restaurantName || "Kitchen Outlet"}</span>
              </span>

              {/* Compact Item list */}
              <div className="space-y-1">
                {(o.items || []).slice(0, 2).map((item, idx) => {
                  const itemName = getItemName(item);
                  const itemPriceVal = getItemPrice(item, o.total || o.totalAmount || 0, totalItemsCount);
                  const qty = Number(item.quantity) || 1;
                  return (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-semibold text-neutral-600 gap-2">
                      <span className="truncate flex-1">{itemName} <span className="text-neutral-400 font-mono text-[10px]">x{qty}</span></span>
                      <span className="font-bold text-neutral-900 font-mono shrink-0">₹ {itemPriceVal.toFixed(2)}</span>
                    </div>
                  );
                })}
                {(o.items || []).length > 2 && <p className="text-[9px] text-neutral-400 font-bold italic mt-1">
                  + {(o.items || []).length - 2} more item{(o.items || []).length - 2 > 1 ? "s" : ""}...
                </p>}
              </div>

              {/* Total & Payment Method Row */}
              <div className="border-t border-neutral-200 mt-2 pt-2 flex justify-between items-center text-neutral-950 font-black">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">Total:</span>
                  <span className="text-black font-mono text-xs font-black">₹ {Number(o.total || o.totalAmount || 0).toFixed(2)}</span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${customer.paymentBadge}`}>
                  {customer.paymentMethod}
                </span>
              </div>
            </div>

            {/* View Full Slider Drawer Button */}
            <button
              onClick={() => setSelectedOrder(o)}
              className="w-full py-2.5 bg-white hover:bg-neutral-50 text-black border border-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center transition cursor-pointer shadow-xs"
            >
              <span>Inspect Detailed Drawer</span>
            </button>

            {/* Courier Partner */}
            {o.driverName ? <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 text-[10px] font-semibold text-neutral-700 flex items-center justify-between">
              <div className="min-w-0">
                <span className="truncate">Courier: <span className="font-black text-neutral-900">{o.driverName}</span></span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white text-black border border-neutral-300 font-black font-mono shrink-0">ASSIGNED</span>
            </div> : currentStatusNorm === "dispatched" ? <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">Assign Courier Agent</label>
              <select
                onChange={(e) => handleAssignCourierToOrder(o._id || o.id || o.orderNumber, e.target.value)}
                defaultValue=""
                className="w-full bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-xl p-2 text-[10px] font-bold outline-none focus:border-black cursor-pointer"
              >
                <option value="" disabled>Select Courier Agent...</option>
                {couriers.filter((c) => (c.status || "").toUpperCase() === "IDLE" || (c.status || "").toLowerCase() === "idle").map((c) => <option key={c._id || c.id} value={c._id || c.id}>
                  {c.fullName || c.name} ({(c.vehicleType || c.vehicle || "Bike").split(" ")[0]})
                </option>)}
              </select>
            </div> : null}

          </div>

          {/* Dispatch & Manager Control Buttons */}
          <div className="mt-5 pt-3 border-t border-neutral-100 space-y-2">
            <div className="flex items-center gap-2">
              {nextStatus ? (
                <button
                  onClick={() => handleUpdateStatus(o._id || o.id || o.orderNumber, nextStatus)}
                  className="flex-1 py-2.5 bg-white hover:bg-neutral-50 text-black border border-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition cursor-pointer shadow-xs"
                >
                  <span>Mark: {nextStatus.toUpperCase()}</span>
                </button>
              ) : (
                <div className="flex-1 text-center text-[10px] font-black text-black flex items-center justify-center py-2 bg-neutral-50 rounded-xl border border-neutral-300">
                  ORDER COMPLETE
                </div>
              )}

              {currentStatusNorm !== "rejected" && currentStatusNorm !== "delivered" && (
                <button
                  onClick={() => handleUpdateStatus(o._id || o.id || o.orderNumber, "rejected")}
                  className="py-2.5 px-3 bg-white hover:bg-neutral-100 border-2 border-black text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                  title="Reject / Cancel Order"
                >
                  Reject
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-100">
              <span className="text-[9px] font-black uppercase text-neutral-400 shrink-0">State:</span>
              <select
                value={currentStatusNorm}
                onChange={(e) => handleUpdateStatus(o._id || o.id || o.orderNumber, e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-[10px] font-bold text-neutral-700 outline-none focus:border-brand-orange cursor-pointer"
              >
                <option value="received">Received (Pending)</option>
                <option value="accepted">Accepted (Confirmed)</option>
                <option value="preparing">Preparing (In Kitchen)</option>
                <option value="ready">Ready (Order Packed)</option>
                <option value="dispatched">Dispatched (Out for Delivery)</option>
                <option value="delivered">Delivered (Completed)</option>
                <option value="rejected">Rejected (Cancelled)</option>
              </select>
            </div>
          </div>

        </motion.div>;
      })}
    </div>

    {/* 4. Pagination Controls Bar */}
    {((paginationInfo && (paginationInfo.totalPages > 1 || (paginationInfo.total > limit))) || dispatchOrders.length >= limit || currentPage > 1) && (
      <div className="bg-white rounded-3xl border border-neutral-150 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-xs font-semibold text-neutral-500">
          Showing page<span className="font-black text-neutral-900">{paginationInfo.page || currentPage}</span> of{" "}
          <span className="font-black text-neutral-900">{paginationInfo.totalPages || 1}</span> (Total{" "}
          <span className="font-black text-orange-700">{paginationInfo.total || dispatchOrders.length}</span>)
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1 || isLoadingDispatch}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-neutral-700 transition cursor-pointer"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(paginationInfo.totalPages || 1, currentPage + (dispatchOrders.length >= limit ? 1 : 0)) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer ${pg === currentPage
                  ? "bg-black text-white shadow-xs"
                  : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200"
                  }`}
              >
                {pg}
              </button>
            ))}
          </div>

          <button
            disabled={(paginationInfo.totalPages ? currentPage >= paginationInfo.totalPages : dispatchOrders.length < limit) || isLoadingDispatch}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-neutral-700 transition cursor-pointer"
          >
            Next →
          </button>
        </div>
      </div>
    )}

    {/* ORDER DETAILS SLIDE-OVER DRAWER MODAL */}
    <AnimatePresence>
      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Slider Header */}
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-white text-black shrink-0">
              <div>
                <h3 className="font-display font-black text-sm text-black uppercase tracking-wider">
                  Order #{selectedOrder._id || selectedOrder.id || selectedOrder.orderNumber}
                </h3>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {selectedOrder.timestamp || selectedOrder.createdAt || "Live Order"}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-black rounded-lg transition cursor-pointer"
              >
                CLOSE [ ✕ ]
              </button>
            </div>

            {/* Slider Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {(() => {
                const statusTokens = getStatusTokens(selectedOrder.status);
                const customer = getCustomerInfo(selectedOrder);
                const totalItemsCount = (selectedOrder.items || []).reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

                return (
                  <>
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <div>
                        <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-wider">
                          Current Order Status
                        </span>
                        <span className={`inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border mt-1 ${statusTokens.bg}`}>
                          {statusTokens.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-wider">
                          Total Grand Value
                        </span>
                        <span className="font-mono text-base font-black text-black">
                          ₹ {Number(selectedOrder.total || selectedOrder.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                        Customer & Delivery Details
                      </h4>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[9px] font-black uppercase text-neutral-400 block">Name</span>
                          <span className="font-extrabold text-neutral-900">{customer.name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-neutral-400 block">Phone</span>
                          <a href={`tel:${customer.phone}`} className="font-mono font-bold text-black hover:underline">
                            {customer.phone}
                          </a>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 space-y-1">
                        <span className="text-[9px] font-black uppercase text-neutral-400 block">Delivery Address</span>
                        <p className="text-xs font-medium text-neutral-700 leading-relaxed bg-neutral-50 p-2.5 rounded-xl border border-neutral-150">
                          {customer.address}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100 text-xs">
                        <div>
                          <span className="text-[9px] font-black uppercase text-neutral-400 block">Payment Method</span>
                          <span className="font-extrabold text-neutral-800 block mt-0.5">
                            {customer.paymentMethod}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-neutral-400 block">Payment Status</span>
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border mt-0.5 ${customer.paymentBadge}`}>
                            {customer.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kitchen Partner */}
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-neutral-500 block">Partner Kitchen Outlet</span>
                        <h5 className="font-black text-xs text-neutral-900">
                          {selectedOrder.restaurantName || "Kitchen Outlet"}
                        </h5>
                      </div>
                    </div>

                    {/* Ordered Items Breakdown */}
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center justify-between border-b border-neutral-100 pb-2">
                        <span>Ordered Items ({totalItemsCount})</span>
                        <span className="text-[10px] font-mono text-neutral-400 font-bold">Itemized Bill</span>
                      </h4>

                      <div className="divide-y divide-neutral-100">
                        {(selectedOrder.items || []).map((item, idx) => {
                          const itemName = getItemName(item);
                          const itemPriceVal = getItemPrice(item, selectedOrder.total || 0, totalItemsCount);
                          const qty = Number(item.quantity) || 1;

                          return (
                            <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-extrabold text-neutral-900">{itemName}</span>
                                <span className="text-neutral-400 font-mono text-[11px] ml-2">x{qty}</span>
                              </div>
                              <span className="font-mono font-black text-neutral-900">₹ {itemPriceVal.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t-2 border-dashed border-neutral-200 space-y-1">
                        <div className="flex justify-between text-xs text-neutral-500 font-medium">
                          <span>Subtotal Items</span>
                          <span className="font-mono">₹ {(Number(selectedOrder.total || 0) * 0.82).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500 font-medium">
                          <span>Taxes & Service Fee</span>
                          <span className="font-mono">₹ {(Number(selectedOrder.total || 0) * 0.18).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-neutral-950 pt-2 border-t border-neutral-150">
                          <span>Grand Total</span>
                          <span className="font-mono text-orange-700">₹ {Number(selectedOrder.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Courier & Rider Assignment */}
                    <div className="space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <span>Dispatch Rider Assignment</span>
                      </h4>

                      {selectedOrder.driverName ? (
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[9px] font-black uppercase text-emerald-700 block">Assigned Rider</span>
                            <span className="font-black text-neutral-900">{selectedOrder.driverName}</span>
                            {selectedOrder.driverPhone && (
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{selectedOrder.driverPhone}</p>
                            )}
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded-md uppercase">
                            DISPATCHED
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-neutral-500 block">
                            Select Available Rider Agent
                          </label>
                          <select
                            onChange={(e) => handleAssignCourierToOrder(selectedOrder._id || selectedOrder.id || selectedOrder.orderNumber, e.target.value)}
                            defaultValue=""
                            className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-brand-orange"
                          >
                            <option value="" disabled>Select Courier Agent...</option>
                            {couriers.map((c) => (
                              <option key={c._id || c.id} value={c._id || c.id}>
                                {c.fullName || c.name} ({c.vehicleType || "Bike"}) • ⭐{typeof c.rating === "number" ? c.rating.toFixed(1) : "5.0"}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Slider Footer Actions */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-3 shrink-0">
              {(() => {
                const currentNorm = normalizeStatus(selectedOrder.status);
                const currentIdx = currentNorm !== "rejected" ? statusSequence.indexOf(currentNorm) : -1;
                const nextStatus = currentIdx >= 0 && currentIdx < statusSequence.length - 1 ? statusSequence[currentIdx + 1] : null;

                return (
                  <>
                    {nextStatus && (
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder._id || selectedOrder.id || selectedOrder.orderNumber, nextStatus);
                          setSelectedOrder((prev) => prev ? { ...prev, status: nextStatus } : null);
                        }}
                        className="flex-1 py-3 bg-white hover:bg-neutral-50 text-black border border-neutral-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center transition cursor-pointer shadow-xs"
                      >
                        <span>Advance to: {nextStatus.toUpperCase()}</span>
                      </button>
                    )}
                    {currentNorm !== "rejected" && currentNorm !== "delivered" && (
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder._id || selectedOrder.id || selectedOrder.orderNumber, "rejected");
                          setSelectedOrder((prev) => prev ? { ...prev, status: "rejected" } : null);
                        }}
                        className="py-3 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    {/* DISPATCH ORDER & DRIVER ASSIGNMENT MODAL */}
    <AnimatePresence>
      {assigningOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAssigningOrder(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 space-y-0"
          >
            {/* Modal Header */}
            <div className="bg-white text-black border-b border-neutral-200 p-5 flex justify-between items-center">
              <div>
                <h3 className="font-display font-black text-sm text-black uppercase tracking-wider">
                  Dispatch Order #{assigningOrder._id || assigningOrder.id || assigningOrder.orderNumber}
                </h3>
                <p className="text-[10px] text-neutral-500 font-medium">
                  Select a courier agent or enter driver dispatch details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-black rounded-lg transition cursor-pointer"
              >
                CLOSE [ ✕ ]
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Fleet Rider / Partner Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Select Dispatch Option / Courier Fleet
                </label>
                <select
                  value={selectedRiderId ? `rider_${selectedRiderId}` : assignmentPartner}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith("rider_")) {
                      const rid = val.replace("rider_", "");
                      setSelectedRiderId(rid);
                      const foundR = availableRiders.find((r) => String(r._id || r.id) === String(rid)) || couriers.find((c) => String(c._id || c.id) === String(rid));
                      if (foundR) {
                        setAssignmentPartner("QuikaBite Fleet");
                        setDriverName(foundR.fullName || foundR.name || "");
                        setDriverPhone(foundR.phone || "");
                        setVehicleDetails(foundR.vehicleType || foundR.vehicle || "Bike");
                      }
                    } else {
                      setSelectedRiderId("");
                      setAssignmentPartner(val);
                      const defaults = PARTNER_PRESETS[val] || PARTNER_PRESETS.Ola;
                      setDriverName(defaults.driverName);
                      setDriverPhone(defaults.driverPhone);
                      setVehicleDetails(defaults.vehicleDetails);
                      setDeliveryRemarks(defaults.deliveryRemarks);
                    }
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-brand-orange cursor-pointer"
                >
                  <optgroup label="Registered Internal Fleet Riders">
                    {(availableRiders.length > 0 ? availableRiders : couriers.filter(c => (c.status || "").toLowerCase() === "idle")).map((r) => (
                      <option key={r._id || r.id} value={`rider_${r._id || r.id}`}>
                        🚴 {r.fullName || r.name} ({r.phone}) • ⭐{typeof r.rating === "number" ? r.rating.toFixed(1) : "5.0"}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="3PL Logistics Partners">
                    {Object.keys(PARTNER_PRESETS).map((partnerName) => (
                      <option key={partnerName} value={partnerName}>
                        🚚 Partner: {partnerName}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Driver Details Form */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver Name"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:border-brand-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Vehicle Details
                </label>
                <input
                  type="text"
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  placeholder="e.g. KA-01-MJ-4321 (Bike)"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:border-brand-orange"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Delivery Remarks
                </label>
                <textarea
                  rows={2}
                  value={deliveryRemarks}
                  onChange={(e) => setDeliveryRemarks(e.target.value)}
                  placeholder="Special instructions or safety limits..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:border-brand-orange resize-none"
                />
              </div>

              {/* Destination Summary */}
              {(() => {
                const customer = getCustomerInfo(assigningOrder);
                return (
                  <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 text-xs space-y-1">
                    <span className="text-[9px] font-black uppercase text-neutral-400 block">
                      Destination Details
                    </span>
                    <p className="font-extrabold text-neutral-800">
                      {customer.name} ({customer.phone})
                    </p>
                    <p className="text-neutral-500 font-semibold text-[11px]">
                      {customer.address}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-neutral-50 border-t border-neutral-200 p-4 flex gap-3">
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="flex-1 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  commitDeliveryAssignment(
                    assigningOrder._id || assigningOrder.id || assigningOrder.orderNumber,
                    assignmentPartner,
                    driverName,
                    driverPhone,
                    vehicleDetails,
                    deliveryRemarks
                  );
                }}
                className="flex-1 py-2.5 bg-white hover:bg-neutral-50 text-black border border-neutral-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-center font-black"
              >
                <span>Confirm & Dispatch</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>;
}
