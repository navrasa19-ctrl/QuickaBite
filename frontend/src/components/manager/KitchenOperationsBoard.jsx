import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Check,
  Clock,
  X,
  MapPin,
  ShoppingBag,
  User,
  Search,
  Bell,
  UtensilsCrossed,
  Phone,
  Truck,
  CheckCircle2,
  Move,
  Play,
  Radio,
  RotateCw,
  MessageSquare,
  Award,
  Layers,
  Plus,
} from "lucide-react";
import BrandManagementTab from "../admin/BrandManagementTab";
import { managerService } from "../../api/managerService";
import { adminService } from "../../api/adminService";
import { chatService } from "../../api/chatService";
import { parseApiError } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { isPaidOrCodOrder } from "../../api/dinerService";

const PARTNER_PRESETS = {
  "QuikaBite Fleet": {
    driverName: "",
    driverPhone: "",
    vehicleDetails: "",
    deliveryRemarks: "Direct express dispatch via registered internal fleet rider.",
  },
  Ola: {
    driverName: "Rajesh Kumar",
    driverPhone: "9876543210",
    vehicleDetails: "White Maruti Dzire (KA-01-MJ-4321)",
    deliveryRemarks: "Drive carefully. Keep thermal case sealed.",
  },
  Uber: {
    driverName: "Amit Singh",
    driverPhone: "+91 99887 76655",
    vehicleDetails: "Silver Toyota Etios (DL-3C-AY-8899)",
    deliveryRemarks: "Contactless delivery. Call on arrival.",
  },
  Rapido: {
    driverName: "Suren Thapa",
    driverPhone: "+91 88776 65544",
    vehicleDetails: "Black Honda Activa Scooter (MH-12-PQ-9981)",
    deliveryRemarks: "Fast express bike route selected.",
  },
  Porter: {
    driverName: "Balbir Yadav",
    driverPhone: "+91 77665 54433",
    vehicleDetails: "Tata Ace Mini Truck (KA-03-GH-2345)",
    deliveryRemarks: "Heavy load box. Help with unloading.",
  },
};
export default function KitchenOperationsBoard({
  orders,
  setOrders,
  triggerToast,
  setHideBottomNavbar,
}) {
  const { profile } = useAuth();
  const [activeManagerTab, setActiveManagerTab] = useState("orders"); // 'orders' | 'brands'
  const managerOutletId = profile?.restaurant?._id || profile?.restaurant?.id || profile?.restaurantId || "";
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const isMockMode = import.meta.env.VITE_USE_MOCK !== "false";
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [assignmentPartner, setAssignmentPartner] = useState("Ola");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [deliveryRemarks, setDeliveryRemarks] = useState("");
  const [availableRiders, setAvailableRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");

  const setOrdersRef = useRef(setOrders);
  useEffect(() => {
    setOrdersRef.current = setOrders;
  }, [setOrders]);

  const isFetchingRef = useRef(false);

  const playKitchenBeep = (freq = 880, duration = 0.15) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore audio context error
    }
  };
  const simulateNewOrder = () => {
    if (!isMockMode) return;
    const brands = [
      {
        name: "Biryani Central",
        logo: "🍛",
        item: "Lucknowi Mutton Biryani",
        price: 42,
      },
      {
        name: "Pizza Labs",
        logo: "🍕",
        item: "Truffle Mushroom Sourdough Pizza",
        price: 49,
      },
      {
        name: "Chinese Wok Labs",
        logo: "🥢",
        item: "Sichuan Chili Garlic Noodles",
        price: 34,
      },
      {
        name: "Gourmet Burger Kitchen",
        logo: "🍔",
        item: "Double Wagyu Cheese Smasher",
        price: 58,
      },
      {
        name: "Healthy Greens",
        logo: "🥗",
        item: "Superfood Quinoa Avocado Salad",
        price: 38,
      },
    ];
    const chosenBrand = brands[Math.floor(Math.random() * brands.length)];
    const orderId = "GE-" + Math.floor(1e5 + Math.random() * 9e5);
    const mockItem = {
      id: "m-" + Math.floor(Math.random() * 1e3),
      name: chosenBrand.item,
      price: chosenBrand.price,
      description: "Hot kitchen freshly prepared gourmet item.",
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300",
      isVeg: Math.random() > 0.4,
      category: "Main",
    };
    const newOrder = {
      id: orderId,
      restaurantId: "r-simulated",
      restaurantName: chosenBrand.name,
      items: [
        { menuItem: mockItem, quantity: Math.floor(Math.random() * 2) + 1 },
      ],
      status: "received",
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      subtotal: chosenBrand.price,
      deliveryFee: 7,
      discount: 0,
      tax: chosenBrand.price * 0.05,
      total: chosenBrand.price + 7 + chosenBrand.price * 0.05,
      driverCoords: { x: 35, y: 45 },
    };
    try {
      const cached = localStorage.getItem("globaleats_orders");
      const parsed = cached ? JSON.parse(cached) : [];
      localStorage.setItem(
        "globaleats_orders",
        JSON.stringify([newOrder, ...parsed]),
      );
    } catch (e) {
      console.error("Error storing simulated order:", e);
    }
    if (setOrdersRef.current) {
      setOrdersRef.current((prev) => [newOrder, ...prev]);
    }
    playKitchenBeep(987.77, 0.3);
    triggerToast(
      `NEW LIVE ORDER! #${orderId.slice(-5)} from ${chosenBrand.name}`,
    );
  };
  useEffect(() => {
    if (!isMockMode || !isLiveSimulating) return;
    const interval = setInterval(() => {
      simulateNewOrder();
    }, 45e3);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveSimulating, isMockMode]);

  const [chatOrder, setChatOrder] = useState(null);
  const [managerChatMessages, setManagerChatMessages] = useState([]);
  const [managerChatInput, setManagerChatInput] = useState("");
  const [managerChatConv, setManagerChatConv] = useState(null);
  const managerChatEndRef = useRef(null);

  const handleOpenManagerChat = async (order) => {
    setChatOrder(order);
    playKitchenBeep(1200, 0.05);
    try {
      const orderDbId = order._id || order.id;
      const conv = await chatService.startConversation(orderDbId);
      setManagerChatConv(conv);
      const convId = conv?._id || conv?.id || orderDbId;
      const msgs = await chatService.getMessages(convId);
      if (msgs && msgs.length > 0) {
        setManagerChatMessages(
          msgs.map((m) => ({
            id: m._id || m.id || `msg-${Date.now()}`,
            sender:
              m.senderType === "AGENT" || m.sender === "agent"
                ? "agent"
                : m.senderType === "USER" || m.sender === "user"
                  ? "user"
                  : "bot",
            senderType: m.senderType || "USER",
            text: m.message || m.text || "",
            timestamp:
              m.timestamp ||
              (m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "Just now"),
          })),
        );
      } else {
        setManagerChatMessages([
          {
            id: "msg-1",
            sender: "bot",
            senderType: "BOT",
            text: `Support room connected for Order ${getDisplayOrderId(order)}. You can now type direct messages to the customer.`,
            timestamp: "Just now",
          },
        ]);
      }

      // Connect Socket.io and Join Room (Event: join_conversation)
      chatService.connectSocket(convId, (newMsg) => {
        setManagerChatMessages((prev) => {
          const exists = prev.some((m) => m.id === (newMsg._id || newMsg.id));
          if (exists) return prev;
          return [
            ...prev,
            {
              id: newMsg._id || newMsg.id || `msg-${Date.now()}`,
              sender:
                newMsg.senderType === "AGENT" || newMsg.sender === "agent"
                  ? "agent"
                  : newMsg.senderType === "USER" || newMsg.sender === "user"
                    ? "user"
                    : "bot",
              senderType: newMsg.senderType || "USER",
              text: newMsg.message || newMsg.text || "",
              timestamp: newMsg.timestamp || "Just now",
            },
          ];
        });
      });
    } catch (err) {
      console.warn("Failed to open manager chat:", err);
    }
  };

  const handleSendManagerReply = async () => {
    if (!managerChatInput.trim() || !chatOrder) return;

    let conv = managerChatConv;
    if (!conv || !conv._id) {
      const orderDbId = chatOrder._id || chatOrder.id;
      conv = await chatService.startConversation(orderDbId);
      if (conv) setManagerChatConv(conv);
    }

    const convId = conv?._id || conv?.id || chatOrder._id || chatOrder.id;
    const text = managerChatInput.trim();

    let managerId = "";
    try {
      const userStr = localStorage.getItem("globaleats_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const uid = u._id || u.id;
        if (uid && /^[0-9a-fA-F]{24}$/.test(String(uid))) {
          managerId = String(uid);
        }
      }
    } catch {
      // ignore parse error
    }
    if (!managerId && profile?._id && /^[0-9a-fA-F]{24}$/.test(String(profile._id))) {
      managerId = String(profile._id);
    }

    const agentMsg = {
      id: `msg-agent-${Date.now()}`,
      sender: "agent",
      senderType: "AGENT",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setManagerChatMessages((prev) => [...prev, agentMsg]);
    setManagerChatInput("");

    chatService.sendMessage({
      conversationId: convId,
      message: text,
      senderType: "AGENT",
      ...(managerId ? { sender: managerId } : {}),
    });
  };

  const fetchIncomingOrders = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);
    try {
      const incoming = await managerService.getIncomingOrders();
      if (Array.isArray(incoming)) {
        if (setOrdersRef.current) {
          setOrdersRef.current((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) {
              return incoming;
            }
            if (incoming.length === 0) {
              return prev;
            }
            const incomingMap = new Map();
            incoming.forEach((o) => {
              const idKey = String(o.id || o._id || "");
              if (idKey) incomingMap.set(idKey, o);
            });
            const updatedPrev = prev.map((o) => {
              const idKey = String(o.id || o._id || "");
              if (idKey && incomingMap.has(idKey)) {
                const newObj = incomingMap.get(idKey);
                incomingMap.delete(idKey);
                return { ...o, ...newObj };
              }
              return o;
            });
            const brandNewOrders = Array.from(incomingMap.values());
            const merged = [...brandNewOrders, ...updatedPrev];
            if (JSON.stringify(prev) === JSON.stringify(merged)) {
              return prev;
            }
            return merged;
          });
        }
      }
    } catch (err) {
      console.error("Failed to load incoming manager orders:", err);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  const handleManualRefresh = async () => {
    await fetchIncomingOrders();
    playKitchenBeep(1000, 0.08);
    if (triggerToast) {
      triggerToast("Kitchen orders refreshed!");
    }
  };

  useEffect(() => {
    fetchIncomingOrders();

    // Automatically call incoming API every 3 minutes (180,000ms)
    const interval = setInterval(fetchIncomingOrders, 180000);

    const handleOrderMutated = () => {
      fetchIncomingOrders();
    };

    window.addEventListener("globaleats_order_mutated", handleOrderMutated);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "globaleats_order_mutated",
        handleOrderMutated,
      );
    };
  }, [fetchIncomingOrders]);

  useEffect(() => {
    if (setHideBottomNavbar) {
      setHideBottomNavbar(selectedOrder !== null || assigningOrder !== null);
    }
    return () => {
      if (setHideBottomNavbar) {
        setHideBottomNavbar(false);
      }
    };
  }, [selectedOrder, assigningOrder, setHideBottomNavbar]);

  const getOrderColumn = (status) => {
    if (!status) return "received";
    const s = String(status).toLowerCase().trim();
    if (s === "received" || s === "placed" || s === "pending" || s === "paid")
      return "received";
    if (s === "accepted" || s === "confirmed") return "accepted";
    if (s === "preparing" || s === "cooking") return "preparing";
    if (s === "ready" || s === "ready-for-pickup" || s === "packed") return "ready";
    if (s === "dispatched" || s === "out_for_delivery" || s === "out-for-delivery" || s === "out for delivery" || s === "out" || s === "outfordelivery")
      return "dispatched";
    if (s === "delivered" || s === "completed") return "delivered";
    if (s === "rejected" || s === "cancelled") return "rejected";
    return "received";
  };

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    playKitchenBeep(900, 0.08);
    const details = await managerService.getOrderDetails(order.id || order._id);
    if (details) {
      setSelectedOrder((prev) =>
        prev &&
          (String(prev.id) === String(order.id) ||
            String(prev._id) === String(order._id))
          ? { ...prev, ...details }
          : prev,
      );
    }
  };

  const handleUpdateStatus = async (orderId, nextStatus, reason) => {
    const targetOrder = orders.find(
      (o) =>
        String(o.id) === String(orderId) || String(o._id) === String(orderId),
    );
    if (targetOrder) {
      const currentNorm = getOrderColumn(targetOrder.status);
      if (currentNorm === "rejected" || currentNorm === "delivered") {
        triggerToast(
          `Order #${String(orderId).slice(-5)} is already ${targetOrder.status.toUpperCase()} and cannot be changed.`,
          "error",
        );
        return;
      }
    }

    if (nextStatus === "dispatched") {
      const orderToAssign = orders.find(
        (o) =>
          String(o.id) === String(orderId) || String(o._id) === String(orderId),
      );
      if (
        orderToAssign &&
        getOrderColumn(orderToAssign.status) !== "dispatched"
      ) {
        // Fetch available IDLE riders from backend / local fleet (GET /v1/riders?status=IDLE)
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
            setVehicleDetails(first.vehicleType || first.vehicle || "");
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
    try {
      const updated = await managerService.updateOrderStatus(
        orderId,
        nextStatus,
        { reason },
      );
      if (Array.isArray(updated)) {
        setOrders(updated);
      }
      if (nextStatus === "accepted" || nextStatus === "confirmed") {
        playKitchenBeep(523.25, 0.2);
        triggerToast(`Order ${getDisplayOrderId(orderId)} ACCEPTED & queued.`);
      } else if (nextStatus === "preparing") {
        playKitchenBeep(587.33, 0.2);
        triggerToast(
          `Order ${getDisplayOrderId(orderId)} entered PREPARING/COOKING.`,
        );
      } else if (nextStatus === "ready" || nextStatus === "ready-for-pickup") {
        playKitchenBeep(659.25, 0.25);
        triggerToast(
          `Order ${getDisplayOrderId(orderId)} is READY for dispatch!`,
        );
      } else if (nextStatus === "dispatched") {
        playKitchenBeep(783.99, 0.15);
        triggerToast(
          `Order ${getDisplayOrderId(orderId)} DISPATCHED with courier.`,
        );
      } else if (nextStatus === "delivered") {
        playKitchenBeep(1046.5, 0.3);
        triggerToast(`Order ${getDisplayOrderId(orderId)} DELIVERED.`);
      } else if (nextStatus === "rejected") {
        playKitchenBeep(220, 0.35);
        triggerToast(`Order ${getDisplayOrderId(orderId)} REJECTED.`);
      }
      if (
        selectedOrder &&
        (String(selectedOrder.id) === String(orderId) ||
          String(selectedOrder._id) === String(orderId))
      ) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: nextStatus } : null,
        );
      }
    } catch (err) {
      const errMsg = parseApiError(err, "Failed to update order status.");
      triggerToast(errMsg, "error");
    }
  };

  const commitDeliveryAssignment = async (
    orderId,
    partner,
    name,
    phone,
    vehicle,
    remarks,
  ) => {
    try {
      if (selectedRiderId) {
        await adminService.dispatchOrderWithRider(orderId, selectedRiderId, remarks);
      }
      const updated = await managerService.dispatchOrder(orderId, {
        partner,
        driverName: name,
        driverPhone: phone,
        vehicleDetails: vehicle,
        deliveryRemarks: remarks,
        riderId: selectedRiderId || undefined,
      });
      setOrders(updated);
      playKitchenBeep(783.99, 0.35);
      triggerToast(
        `Order ${getDisplayOrderId(orderId)} DISPATCHED to rider ${name}!`,
      );
      setAssigningOrder(null);
      setSelectedOrder(null);
    } catch (err) {
      const errMsg = parseApiError(err, "Failed to dispatch order.");
      triggerToast(errMsg, "error");
    }
  };
  const handleDragStart = (e, orderId) => {
    e.dataTransfer.setData("text/plain", orderId);
    e.dataTransfer.effectAllowed = "move";
    playKitchenBeep(800, 0.05);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDragEnter = (e, column) => {
    e.preventDefault();
    setDraggedOverColumn(column);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const orderId = e.dataTransfer.getData("text/plain");
    if (!orderId) return;
    const draggedOrder = orders.find((o) => o.id === orderId);
    if (!draggedOrder) return;
    handleUpdateStatus(orderId, targetColumn);
  };
  const getCustomerInfo = (orderInput) => {
    if (typeof orderInput === "object" && orderInput !== null) {
      const name =
        orderInput.contactName || orderInput.user?.fullName || "Customer";
      const phone =
        orderInput.contactPhone || orderInput.user?.phone || "98765 43210";
      const addrObj =
        typeof orderInput.address === "object" ? orderInput.address : null;
      const addrStr =
        addrObj?.fullAddress ||
        addrObj?.label ||
        (typeof orderInput.address === "string" ? orderInput.address : "") ||
        "Delivery Address";
      const presets = Array.isArray(orderInput.deliveryInstructions?.presets)
        ? orderInput.deliveryInstructions.presets.join(", ")
        : "";
      const customNote = orderInput.deliveryInstructions?.customNote || "";
      const instructions =
        [presets, customNote].filter(Boolean).join(" - ") || "";
      const payMethod = (orderInput.paymentMethod || "cod").toUpperCase();
      return {
        name,
        phone,
        address: addrStr,
        instructions,
        paymentMethod:
          payMethod === "COD" ? "Cash on Delivery (COD)" : payMethod,
      };
    }
    const orderId = String(orderInput || "99");
    const seed = orderId.charCodeAt(orderId.length - 1) || 99;
    const names = [
      "Vicky Kumar",
      "Arjun Sharma",
      "Priya Mehta",
      "Rahul Verma",
      "Sneha Iyer",
    ];
    const phones = [
      "6204676330",
      "9876543210",
      "8765432109",
      "7654321098",
    ];
    const addresses = [
      "phulwariy keshri tola, saran Bihar",
      "Flat 12A, Sobha Dream Acres, Panathur, Bengaluru 560035",
      "Villa 8, DLF Phase 3, Gurugram, Haryana 122010",
    ];
    return {
      name: names[seed % names.length],
      phone: phones[seed % phones.length],
      address: addresses[seed % addresses.length],
      instructions: "Please call before delivery",
      paymentMethod: "Cash on Delivery (COD)",
    };
  };

  const getDisplayOrderId = (orderInput) => {
    if (!orderInput) return "";
    let rawStr = "";
    if (typeof orderInput === "string") {
      rawStr = orderInput.trim();
    } else if (typeof orderInput === "object" && orderInput !== null) {
      rawStr = String(
        orderInput.orderNumber ||
          orderInput.orderId ||
          orderInput.id ||
          orderInput._id ||
          ""
      ).trim();
    }

    if (!rawStr) return "";

    if (/^(GE|ORD)-\d+$/i.test(rawStr)) {
      return rawStr.toUpperCase();
    }
    if (/^\d{3,8}$/.test(rawStr)) {
      return `#${rawStr}`;
    }
    const cleanStr = rawStr.replace(/^GE-/, "");
    const lastSix = cleanStr.length > 6 ? cleanStr.slice(-6).toUpperCase() : cleanStr.toUpperCase();
    return `#${lastSix}`;
  };
  const searchLower = (debouncedSearchTerm || "").toLowerCase();
  const safeOrdersList = Array.isArray(orders)
    ? orders.filter((o) => {
      if (!o) return false;
      const pStatus = String(o.paymentStatus || "").toLowerCase().trim();
      const oStatus = String(o.status || "").toLowerCase().trim();
      if (
        pStatus === "rejected" ||
        pStatus === "failed" ||
        pStatus === "cancelled" ||
        oStatus === "rejected" ||
        oStatus === "cancelled" ||
        oStatus === "delivered" ||
        oStatus === "completed"
      ) {
        return false;
      }
      return isPaidOrCodOrder(o);
    })
    : [];
  const matchedOrders = safeOrdersList.filter((o) => {
    if (!o) return false;
    const orderIdStr = String(o.id || o._id || "").toLowerCase();
    const resNameStr = String(o.restaurantName || "").toLowerCase();
    const itemsArr = Array.isArray(o.items) ? o.items : [];
    const matchesSearch =
      orderIdStr.includes(searchLower) ||
      resNameStr.includes(searchLower) ||
      itemsArr.some((it) => {
        const name = String(it?.menuItem?.name || it?.name || "").toLowerCase();
        return name.includes(searchLower);
      });
    return matchesSearch;
  });
  const columnsData = [
    {
      id: "received",
      title: "New Orders",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      bg: "bg-indigo-50/40",
      border: "border-indigo-100",
      desc: "Incoming hot requests",
    },
    {
      id: "accepted",
      title: "Accepted",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      bg: "bg-blue-50/40",
      border: "border-blue-100",
      desc: "Fulfillment confirmed",
    },
    {
      id: "preparing",
      title: "Preparing",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      bg: "bg-amber-50/40",
      border: "border-amber-100",
      desc: "Active recipe cooking",
    },
    {
      id: "ready",
      title: "Ready",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      bg: "bg-emerald-50/40",
      border: "border-emerald-100",
      desc: "Packed & warm waiting",
    },
    {
      id: "dispatched",
      title: "Dispatched",
      color: "text-sky-600 bg-sky-50 border-sky-200",
      bg: "bg-sky-50/40",
      border: "border-sky-100",
      desc: "Out with fleet courier",
    },
  ];
  return (
    <div className="space-y-6" id="kitchen-workspace-viewport">
      {/* 1. PROFESSIONAL KITCHEN HUD PANEL */}
      <div className="bg-brand-dark border-2 border-neutral-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-orange" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 flex items-center gap-1.5">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Kitchen Operations Feed Active
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 uppercase">
              <ChefHat className="h-8 w-8 text-orange-700 animate-bounce" />
              <span>
                {profile?.restaurantName || profile?.restaurant?.name
                  ? `Kitchen Ops — ${profile.restaurantName || profile.restaurant?.name}`
                  : "Kitchen Operations Station"}
              </span>
            </h1>
            <p className="text-neutral-400 text-xs font-semibold max-w-xl">
              High-contrast visual controller. Drag and drop any order card to
              progress status or use large tactile buttons. Hear responsive
              beeps on transitions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* MANAGER SUBTAB SWITCHER */}
            <div className="bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveManagerTab("orders")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${activeManagerTab === "orders" ? "bg-brand-orange text-white shadow-md" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
              >
                <ChefHat className="h-4 w-4" />
                <span>Live Orders</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveManagerTab("brands")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${activeManagerTab === "brands" ? "bg-brand-orange text-white shadow-md" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
              >
                <Award className="h-4 w-4" />
                <span>Virtual Brand Labs</span>
              </button>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh Kitchen Orders"
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-black text-neutral-200 hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw
                className={`h-4 w-4 text-orange-700 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex items-center gap-3">
              <div className="space-y-0.5">
                <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                  Real-time Order Feed
                </span>
              </div>
              {isMockMode && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setIsLiveSimulating(!isLiveSimulating);
                      playKitchenBeep(1100, 0.1);
                      triggerToast(
                        isLiveSimulating
                          ? "Auto simulator paused."
                          : "Auto simulator active.",
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition cursor-pointer ${isLiveSimulating ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"}`}
                  >
                    {isLiveSimulating ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => {
                      simulateNewOrder();
                    }}
                    className="px-3 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Incoming
                  </button>
                </div>
              )}
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 px-4 py-3.5 rounded-2xl text-center min-w-[100px]">
              <span className="block text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                Active Orders
              </span>
              <span className="text-2xl font-black text-orange-700">
                {matchedOrders.length}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-neutral-900/80 flex flex-col md:flex-row items-center gap-4">
          {activeManagerTab === "orders" ? (
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer or dish"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold tracking-wide uppercase placeholder-neutral-500 outline-none focus:border-brand-orange text-white"
              />
            </div>
          ) : (
            <div className="text-xs font-semibold text-neutral-400">
              Manage virtual kitchen brands for your outlet. Launch new virtual brands, update logos, taglines, prep times, and menu assignments.
            </div>
          )}
        </div>
      </div>

      {activeManagerTab === "brands" ? (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
          <BrandManagementTab
            orders={orders}
            triggerToast={triggerToast}
            managerOutletId={managerOutletId}
          />
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 lg:grid-cols-5 gap-4"
            id="kitchen-kanban-board"
          >
        {columnsData.map((col) => {
          const colOrders = matchedOrders.filter(
            (o) => getOrderColumn(o.status) === col.id,
          );
          const isOver = draggedOverColumn === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragEnter={(e) => handleDragEnter(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-3xl p-4 transition-all duration-200 flex flex-col min-h-[580px] border-2 ${isOver ? "bg-orange-50/60 border-brand-orange shadow-lg scale-[1.01]" : `${col.bg} ${col.border} border-dashed`}`}
            >
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3 mb-4">
                <div>
                  <span
                    className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-lg ${col.color}`}
                  >
                    {col.title}
                  </span>
                  <span className="block text-[9px] text-neutral-500 font-semibold mt-1 uppercase">
                    {col.desc}
                  </span>
                </div>
                <span className="bg-neutral-900 text-white font-black text-xs h-6 w-6 rounded-full flex items-center justify-center shrink-0">
                  {colOrders.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[620px] pr-1 scrollbar-thin">
                {colOrders.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400 bg-white border border-dashed border-neutral-200/60 rounded-2xl flex flex-col items-center justify-center">
                    <UtensilsCrossed className="h-6 w-6 text-neutral-300 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-wider">
                      LANE EMPTY
                    </p>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const customer = getCustomerInfo(order);
                    const timeDisplay = (() => {
                      if (!order) return "Just now";
                      const raw = order.createdAt || order.timestamp || order.date;
                      if (!raw) return "Just now";
                      try {
                        const d = new Date(raw);
                        if (!isNaN(d.getTime())) {
                          return d.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          });
                        }
                      } catch {
                        // ignore
                      }
                      const str = String(raw);
                      if (str.includes(",")) {
                        return str.split(",").pop().trim();
                      }
                      return str;
                    })();

                    const totalAmount = Number(order.total || order.totalAmount || 0);

                    return (
                      <motion.div
                        layoutId={`order-card-${order.id}`}
                        key={order.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        onClick={() => handleSelectOrder(order)}
                        className="bg-white border-2 border-neutral-200/90 hover:border-neutral-900 p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 cursor-grab active:cursor-grabbing space-y-3 relative group overflow-hidden"
                      >
                        <div className="absolute top-3.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Move className="h-3.5 w-3.5 text-neutral-400" />
                        </div>

                        {/* Card Header: Order ID + Time Badge */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0 pr-4">
                          <span className="text-[10px] font-black tracking-wider text-neutral-900 uppercase truncate bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 shrink">
                            {getDisplayOrderId(order)}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 bg-neutral-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shadow-xs">
                            <Clock className="h-3 w-3 text-orange-700" />
                            <span>{timeDisplay}</span>
                          </div>
                        </div>

                        {/* Customer & Payment Bar */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0">
                              <User className="h-3 w-3 text-orange-700" />
                            </div>
                            <span className="text-xs font-black text-neutral-900 truncate">
                              {customer.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 shrink-0">
                            {customer.paymentMethod?.includes("COD") ? "COD" : "PAID"}
                          </span>
                        </div>

                        {/* Items Container */}
                        <div className="bg-neutral-50 rounded-xl p-3 space-y-2 border border-neutral-150">
                          <div className="space-y-1.5">
                            {(Array.isArray(order.items) ? order.items : []).map(
                              (it, idx) => {
                                const itemName =
                                  it?.menuItem?.name || it?.name || "Gourmet Dish";
                                const qty = it?.quantity ?? 1;
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center text-xs font-bold text-neutral-800 gap-2"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <span className="text-orange-700 font-black text-[11px] shrink-0 bg-brand-orange/15 px-1.5 py-0.5 rounded-md font-mono">
                                        {qty}x
                                      </span>
                                      <span className="truncate leading-tight text-neutral-900">
                                        {itemName}
                                      </span>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                          {totalAmount > 0 && (
                            <div className="pt-2 border-t border-neutral-200/80 flex justify-between items-center text-[11px] font-black text-neutral-900">
                              <span className="text-neutral-400 uppercase tracking-wider text-[9px]">Total</span>
                              <span className="text-orange-700 font-mono text-xs">₹ {totalAmount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {/* Customer Instructions (if present) */}
                        {customer.instructions && (
                          <div className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl font-bold line-clamp-1 flex items-center gap-1">
                            <span>💡</span>
                            <span className="truncate">{customer.instructions}</span>
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div
                          className="pt-2.5 border-t border-neutral-100 flex gap-1.5 items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.id === "received" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order._id || order.id, "accepted")
                              }
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" /> Accept Order
                            </button>
                          )}
                          {col.id === "accepted" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order._id || order.id, "preparing")
                              }
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                            >
                              <Play className="h-3.5 w-3.5 animate-pulse" />{" "}
                              Start Preparing
                            </button>
                          )}
                          {col.id === "preparing" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order._id || order.id, "ready")
                              }
                              className="flex-1 bg-amber-500 hover:bg-amber-650 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                            >
                              <Bell className="h-3.5 w-3.5 animate-bounce" />{" "}
                              Mark Ready
                            </button>
                          )}
                          {col.id === "ready" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order._id || order.id, "dispatched")
                              }
                              className="flex-1 bg-emerald-600 hover:bg-emerald-750 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                            >
                              <Truck className="h-3.5 w-3.5" /> Dispatch Courier
                            </button>
                          )}
                          {col.id === "dispatched" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(order._id || order.id, "delivered")
                              }
                              className="flex-1 bg-neutral-900 hover:bg-neutral-950 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />{" "}
                              Done / Deliver
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {selectedOrder &&
          (() => {
            const customer = getCustomerInfo(selectedOrder);
            const currentLane = getOrderColumn(selectedOrder.status);
            return (
              <div
                className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedOrder(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border-4 border-neutral-950 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-neutral-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-brand-dark text-white p-6 relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 bg-brand-orange/20 px-3 py-1 rounded-md border border-brand-orange/30">
                          Operational Ticket
                        </span>
                        <h2 className="text-2xl font-black uppercase mt-2">
                          Order {getDisplayOrderId(selectedOrder)}
                        </h2>
                        <p className="text-neutral-400 text-xs font-bold uppercase mt-0.5">
                          Brand: {selectedOrder.restaurantName}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          playKitchenBeep(1200, 0.05);
                          setSelectedOrder(null);
                        }}
                        className="bg-neutral-900 text-neutral-400 hover:text-white p-2 rounded-xl transition cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" /> Ordered Items
                      </h3>
                      <div className="bg-neutral-50 rounded-2xl p-4 border-2 border-neutral-200 divide-y divide-neutral-150">
                        {(Array.isArray(selectedOrder.items)
                          ? selectedOrder.items
                          : []
                        ).map((it, idx) => {
                          const itemName =
                            it?.menuItem?.name || it?.name || "Item";
                          const itemPrice = Number(
                            it?.menuItem?.price ?? it?.price ?? 0,
                          );
                          const itemQty = Number(it?.quantity ?? 1);
                          const itemCat =
                            it?.menuItem?.category || it?.category || "Main";
                          return (
                            <div
                              key={idx}
                              className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-base font-black bg-brand-orange/15 text-orange-700 px-3 py-1 rounded-lg">
                                  {itemQty}x
                                </span>
                                <div>
                                  <span className="text-sm font-black text-neutral-900 block leading-tight">
                                    {itemName}
                                  </span>
                                  <span className="text-[9px] text-neutral-400 font-bold uppercase">
                                    Cat: {itemCat}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-black text-neutral-500">
                                ₹ {(itemPrice * itemQty).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
                        <h4 className="text-[9px] font-black uppercase text-neutral-400 flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> Client Info
                        </h4>
                        <p className="text-sm font-black text-neutral-800">
                          {customer.name}
                        </p>
                        <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {customer.phone}
                        </p>
                        <div className="pt-2 border-t border-neutral-200">
                          <span className="text-[9px] text-neutral-400 font-black uppercase block">
                            Payment Method
                          </span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block mt-1">
                            {customer.paymentMethod}
                          </span>
                        </div>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
                        <h4 className="text-[9px] font-black uppercase text-neutral-400 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> Delivery Point
                        </h4>
                        <p className="text-xs font-black text-neutral-700 leading-relaxed uppercase">
                          {customer.address}
                        </p>
                        {customer.instructions && (
                          <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-[10px] text-amber-800 font-bold mt-1">
                            ⚠️ {customer.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-50 border-t border-neutral-200 p-6 space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">
                      Update Order State
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder._id || selectedOrder.id, "preparing");
                          setSelectedOrder(null);
                        }}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${currentLane === "preparing" ? "bg-amber-500 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"}`}
                      >
                        Preparing
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder._id || selectedOrder.id, "ready");
                          setSelectedOrder(null);
                        }}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${currentLane === "ready" ? "bg-emerald-600 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"}`}
                      >
                        Ready
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder._id || selectedOrder.id, "dispatched");
                          setSelectedOrder(null);
                        }}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${currentLane === "dispatched" ? "bg-sky-600 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"}`}
                      >
                        Dispatched
                      </button>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-neutral-200">
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder._id || selectedOrder.id, "delivered");
                          setSelectedOrder(null);
                        }}
                        className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        ✓ Deliver Order
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder._id || selectedOrder.id, "rejected");
                          setSelectedOrder(null);
                        }}
                        className="flex-1 py-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        ✕ Cancel / Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>
      </>
    )}

      <AnimatePresence>
        {assigningOrder &&
          (() => {
            const orderCustomer = getCustomerInfo(assigningOrder.id);
            return (
              <div
                className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => setAssigningOrder(null)}
                id="delivery-assignment-overlay"
              >
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="bg-white border-4 border-neutral-950 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-neutral-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-brand-dark text-white p-6 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-600/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-400/20 px-3 py-1 rounded-md border border-sky-400/30">
                          Logistics Dispatcher
                        </span>
                        <h2 className="text-xl font-black uppercase mt-2">
                          Assign Delivery Partner
                        </h2>
                        <p className="text-neutral-400 text-[10px] font-bold uppercase mt-0.5">
                          Order #{assigningOrder.id.slice(-6)} •{" "}
                          {assigningOrder.restaurantName}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          playKitchenBeep(1200, 0.05);
                          setAssigningOrder(null);
                        }}
                        className="bg-neutral-900 text-neutral-400 hover:text-white p-2 rounded-xl transition cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                        Select Available Courier (Status: IDLE)
                      </label>
                      {availableRiders.length > 0 ? (
                        <select
                          value={selectedRiderId}
                          onChange={(e) => {
                            const rId = e.target.value;
                            setSelectedRiderId(rId);
                            const found = availableRiders.find((r) => String(r._id || r.id) === String(rId));
                            if (found) {
                              setDriverName(found.fullName || found.name || "");
                              setDriverPhone(found.phone || "");
                              setVehicleDetails(found.vehicleType || found.vehicle || "");
                            }
                          }}
                          className="w-full bg-neutral-50 border-2 border-emerald-400 rounded-2xl p-3 text-xs font-bold text-neutral-900 outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
                        >
                          {availableRiders.map((r) => (
                            <option key={r._id || r.id} value={r._id || r.id}>
                              🛵 {r.fullName || r.name} ({r.vehicleType || r.vehicle || "Bike"}{r.licensePlate ? ` - ${r.licensePlate}` : ""})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-[10px] font-bold text-red-600">
                          ⚠️ No couriers currently available (IDLE)
                        </div>
                      )}

                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block pt-2">
                        Select Courier Integration Provider Preset
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {["QuikaBite Fleet", "Ola", "Uber", "Rapido", "Porter"].map((partner) => {
                          const isSelected = assignmentPartner === partner;
                          let brandColor =
                            "border-neutral-200 text-neutral-700 hover:bg-neutral-50";
                          if (isSelected) {
                            if (partner === "QuikaBite Fleet")
                              brandColor =
                                "border-brand-orange bg-orange-50 text-orange-700 ring-2 ring-brand-orange/20 font-black";
                            if (partner === "Ola")
                              brandColor =
                                "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20";
                            if (partner === "Uber")
                              brandColor =
                                "border-neutral-900 bg-neutral-50 text-neutral-950 ring-2 ring-neutral-900/20";
                            if (partner === "Rapido")
                              brandColor =
                                "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20";
                            if (partner === "Porter")
                              brandColor =
                                "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20";
                          }
                          return (
                            <button
                              key={partner}
                              type="button"
                              onClick={async () => {
                                playKitchenBeep(1e3, 0.05);
                                setAssignmentPartner(partner);
                                if (partner === "QuikaBite Fleet") {
                                  try {
                                    const idleRiders = await adminService.getDrivers({ status: "IDLE" });
                                    const safeRiders = Array.isArray(idleRiders) ? idleRiders : [];
                                    setAvailableRiders(safeRiders);
                                    if (safeRiders.length > 0) {
                                      const first = safeRiders[0];
                                      setSelectedRiderId(first._id || first.id);
                                      setDriverName(first.fullName || first.name || "");
                                      setDriverPhone(first.phone || "");
                                      setVehicleDetails(first.vehicleType || first.vehicle || "");
                                    } else {
                                      setSelectedRiderId("");
                                      setDriverName("");
                                      setDriverPhone("");
                                      setVehicleDetails("");
                                    }
                                    setDeliveryRemarks(PARTNER_PRESETS["QuikaBite Fleet"].deliveryRemarks);
                                  } catch (err) {
                                    console.error("Failed to load IDLE fleet riders:", err);
                                  }
                                } else {
                                  const defaults = PARTNER_PRESETS[partner];
                                  setSelectedRiderId("");
                                  setDriverName(defaults.driverName);
                                  setDriverPhone(defaults.driverPhone);
                                  setVehicleDetails(defaults.vehicleDetails);
                                  setDeliveryRemarks(defaults.deliveryRemarks);
                                }
                              }}
                              className={`py-3.5 px-1.5 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition cursor-pointer text-center flex flex-col items-center justify-center gap-1 ${brandColor}`}
                              id={`partner-select-${partner.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              <span className="text-lg">
                                {partner === "QuikaBite Fleet"
                                  ? "⚡"
                                  : partner === "Ola"
                                    ? "🟢"
                                    : partner === "Uber"
                                      ? "⚫"
                                      : partner === "Rapido"
                                        ? "🟡"
                                        : "🔵"}
                              </span>
                              <span className="text-[9px] font-black leading-tight block mt-0.5">
                                {partner}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label
                          htmlFor="driver-name-input"
                          className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block"
                        >
                          Driver Name
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                            👤
                          </span>
                          <input
                            id="driver-name-input"
                            type="text"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            placeholder="e.g. Rajesh Kumar"
                            className="w-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-neutral-900 focus:bg-white transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="driver-phone-input"
                          className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block"
                        >
                          Phone Number
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                            📞
                          </span>
                          <input
                            id="driver-phone-input"
                            type="text"
                            value={driverPhone}
                            onChange={(e) => setDriverPhone(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="w-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-neutral-900 focus:bg-white transition"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="vehicle-details-input"
                        className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block"
                      >
                        Vehicle Details
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                          🚗
                        </span>
                        <input
                          id="vehicle-details-input"
                          type="text"
                          value={vehicleDetails}
                          onChange={(e) => setVehicleDetails(e.target.value)}
                          placeholder="e.g. White Maruti Dzire (KA-01-MJ-4321)"
                          className="w-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-neutral-900 focus:bg-white transition"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="delivery-remarks-input"
                        className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block"
                      >
                        Delivery Remarks / Instructions
                      </label>
                      <textarea
                        id="delivery-remarks-input"
                        rows={2}
                        value={deliveryRemarks}
                        onChange={(e) => setDeliveryRemarks(e.target.value)}
                        placeholder="Special dispatcher warnings, safety limits, gate rules..."
                        className="w-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-neutral-900 focus:bg-white transition resize-none"
                      />
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs space-y-1">
                      <span className="text-[9px] font-black uppercase text-neutral-400 block">
                        Destination & Customer Note
                      </span>
                      <p className="font-extrabold text-neutral-800 uppercase">
                        {orderCustomer.name} ({orderCustomer.phone})
                      </p>
                      <p className="text-neutral-500 font-semibold truncate uppercase">
                        {orderCustomer.address}
                      </p>
                      {orderCustomer.instructions && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100/50 mt-1 font-bold">
                          ⚠️ Customer instruction: "{orderCustomer.instructions}
                          "
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-neutral-50 border-t border-neutral-200 p-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        playKitchenBeep(1200, 0.05);
                        setAssigningOrder(null);
                      }}
                      className="flex-1 py-3 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Cancel / Go Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        commitDeliveryAssignment(
                          assigningOrder.id,
                          assignmentPartner,
                          driverName,
                          driverPhone,
                          vehicleDetails,
                          deliveryRemarks,
                        );
                      }}
                      className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-950 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center flex items-center justify-center gap-1"
                      id="dispatch-assign-btn"
                    >
                      <Truck className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
                      <span>Dispatch Order</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
      </AnimatePresence>

      {/* 4. MANAGER CUSTOMER SUPPORT CHAT MODAL */}
      <AnimatePresence>
        {chatOrder && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[580px]"
            >
              {/* Modal Header */}
              <div className="bg-neutral-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-brand-orange/20 border border-brand-orange/40 rounded-2xl flex items-center justify-center text-lg">
                    💬
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <span>Customer Support Chat</span>
                      <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                        LIVE AGENT ROOM
                      </span>
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-semibold">
                      Order #{String(chatOrder.id || chatOrder._id).slice(-6)} • {getCustomerInfo(chatOrder).name} ({getCustomerInfo(chatOrder).phone})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    chatService.disconnectSocket();
                    setChatOrder(null);
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white p-2 rounded-xl transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50">
                {managerChatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 max-w-[85%] ${msg.sender === "agent" ? "ml-auto flex-row-reverse" : ""
                      }`}
                  >
                    <div className="text-xs shrink-0 select-none">
                      {msg.sender === "agent" ? "🧑‍💼" : msg.sender === "bot" ? "🤖" : "👤"}
                    </div>
                    <div className="space-y-0.5">
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.sender === "agent"
                          ? "bg-brand-orange text-white rounded-br-xs font-bold shadow-xs"
                          : msg.sender === "bot"
                            ? "bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-bl-xs"
                            : "bg-white border border-neutral-200 text-neutral-900 rounded-bl-xs shadow-xs font-semibold"
                          }`}
                      >
                        <p className="whitespace-pre-line break-words">{msg.text}</p>
                      </div>
                      <span
                        className={`text-[8px] text-neutral-400 font-bold block ${msg.sender === "agent" ? "text-right" : "text-left"
                          }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={managerChatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-neutral-150 flex items-center gap-2">
                <input
                  type="text"
                  value={managerChatInput}
                  onChange={(e) => setManagerChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendManagerReply()}
                  placeholder="Type official manager reply to customer..."
                  className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 rounded-xl outline-none focus:border-brand-orange font-semibold"
                />
                <button
                  type="button"
                  onClick={handleSendManagerReply}
                  disabled={!managerChatInput.trim()}
                  className="bg-brand-orange hover:bg-orange-700 disabled:opacity-50 text-white font-black px-4 py-3 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                >
                  <span>Send</span>
                  <Radio className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
