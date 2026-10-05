import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Clock,
  Truck,
  Compass,
  Utensils,
  Star,
  Download,
  Printer,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  XCircle,
  AlertTriangle,
  LifeBuoy,
  X,
} from "lucide-react";
import { RESTAURANTS } from "../../data";
import ReportIssueModal from "./ReportIssueModal";

export default function OrdersPage({
  orders,
  setOrders,
  activeOrder,
  setActiveOrder,
  onAddToCart,
  setIsCartOpen,
  setActiveTab,
  triggerToast,
}) {
  const [activeSubTab, setActiveSubTab] = useState("active");
  const [reportIssueOrder, setReportIssueOrder] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [ratingOrder, setRatingOrder] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectedOrderTimes, setRejectedOrderTimes] = useState(() => {
    try {
      const stored = localStorage.getItem("globaleats_rejected_times");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [dismissedRejectedIds, setDismissedRejectedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("globaleats_rejected_dismissed");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [now, setNow] = useState(Date.now());

  const REJECTION_GRACE_MS = 12000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const safeArr = Array.isArray(orders) ? orders : [];
    let updated = false;
    setRejectedOrderTimes((prev) => {
      const next = { ...prev };
      safeArr.forEach((o) => {
        if (!o) return;
        const oId = String(o.id || o._id || "");
        if (!oId) return;
        const isRejected = o.status === "rejected" || o.status === "cancelled";
        if (isRejected && o.rejectedAt) {
          const t = new Date(o.rejectedAt).getTime();
          if (!isNaN(t) && next[oId] !== t) {
            next[oId] = t;
            updated = true;
          }
        }
      });
      if (updated) {
        try {
          localStorage.setItem("globaleats_rejected_times", JSON.stringify(next));
        } catch (e) { }
        return next;
      }
      return prev;
    });
  }, [orders]);

  useEffect(() => {
    const safeArr = Array.isArray(orders) ? orders : [];
    const hasActiveGrace = safeArr.some((o) => {
      if (!o || (o.status !== "rejected" && o.status !== "cancelled")) return false;
      const oId = String(o.id || o._id || "");
      if (dismissedRejectedIds.has(oId)) return false;
      const rawTime = o.rejectedAt ? new Date(o.rejectedAt).getTime() : rejectedOrderTimes[oId];
      if (!rawTime) return false;
      const elapsed = Date.now() - rawTime;
      return elapsed >= 0 && elapsed < REJECTION_GRACE_MS;
    });

    if (!hasActiveGrace) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [orders, rejectedOrderTimes, dismissedRejectedIds]);

  const isRecentlyRejectedActive = (order) => {
    if (!order) return false;
    if (order.status !== "rejected" && order.status !== "cancelled") return false;
    const oId = String(order.id || order._id || "");
    if (dismissedRejectedIds.has(oId)) return false;
    const rawTime = order.rejectedAt ? new Date(order.rejectedAt).getTime() : rejectedOrderTimes[oId];
    if (!rawTime) return false;
    const rejTime = typeof rawTime === "number" ? rawTime : new Date(rawTime).getTime();
    if (isNaN(rejTime)) return false;
    const elapsed = now - rejTime;
    return elapsed >= 0 && elapsed < REJECTION_GRACE_MS;
  };

  const handleDismissToHistory = (orderId) => {
    const targetStr = String(orderId || "");
    setDismissedRejectedIds((prev) => {
      const next = new Set(prev);
      next.add(targetStr);
      try {
        localStorage.setItem("globaleats_rejected_dismissed", JSON.stringify(Array.from(next)));
      } catch (e) { }
      return next;
    });
    if (triggerToast) {
      triggerToast("Rejected order moved to Order History.");
    }
  };

  useEffect(() => {
    if (invoiceModalOrder) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [invoiceModalOrder]);
  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };
  const safeOrders = Array.isArray(orders) ? orders : [];
  const activeOrdersList = safeOrders.filter((o) => {
    if (!o) return false;
    if (
      o.status !== "delivered" &&
      o.status !== "rejected" &&
      o.status !== "cancelled"
    ) {
      return true;
    }
    if (activeOrder && (activeOrder.id === o.id || activeOrder._id === o._id)) {
      return true;
    }
    if (isRecentlyRejectedActive(o)) {
      return true;
    }
    return false;
  });

  const pastOrdersList = safeOrders.filter((o) => {
    if (!o) return false;
    if (o.status === "delivered") return true;
    if (o.status === "rejected" || o.status === "cancelled") {
      if (activeOrder && (activeOrder.id === o.id || activeOrder._id === o._id)) return false;
      if (isRecentlyRejectedActive(o)) return false;
      return true;
    }
    return false;
  });
  const getRestaurantImage = (resName, orderImg) => {
    if (orderImg && typeof orderImg === "string" && (orderImg.startsWith("http") || orderImg.startsWith("data:"))) {
      return orderImg;
    }
    if (!resName || typeof resName !== "string") {
      return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300";
    }
    const res = RESTAURANTS.find(
      (r) => r && r.name && r.name.toLowerCase() === resName.toLowerCase(),
    );
    return (
      res?.image ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300"
    );
  };
  const handleReorder = (order) => {
    if (!order) return;
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const menuItemObj = item.menuItem || { name: item.name, price: item.price };
      onAddToCart(order.restaurantId, order.restaurantName || "Restaurant", menuItemObj);
    });
    if (setActiveTab) {
      setActiveTab("cart");
    }
    triggerToast(
      `Added all items from ${order.restaurantName || "Restaurant"} to your basket!`,
    );
  };
  const handleSubmitRating = (orderId) => {
    if (ratingValue === 0) {
      triggerToast("Please select a star rating first.");
      return;
    }
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            rating: ratingValue,
            ratingComment: ratingComment.trim(),
          };
        }
        return o;
      }),
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder({
        ...activeOrder,
        rating: ratingValue,
        ratingComment: ratingComment.trim(),
      });
    }
    triggerToast("Thank you for sharing your gourmet feedback!");
    setRatingOrder(null);
    setRatingValue(0);
    setRatingComment("");
  };
  const handleDownloadInvoice = (order) => {
    if (!order) return;
    const divider = "=".repeat(45);
    const items = Array.isArray(order.items) ? order.items : [];
    const itemLines = items
      .map(
        (item) => {
          const name = item?.menuItem?.name || item?.name || "Item";
          const price = Number(item?.menuItem?.price ?? item?.price ?? 0);
          const qty = Number(item?.quantity ?? 1);
          return (
            `${name.padEnd(28)} x${qty}`.padEnd(35) +
            `₹ ${(price * qty).toFixed(2).padStart(8)}`
          );
        }
      )
      .join("\n");
    const subtotalNum = Number(order.subtotal ?? 0);
    const deliveryFeeNum = Number(order.deliveryFee ?? 0);
    const taxNum = Number(order.tax ?? 0);
    const discountNum = Number(order.discount ?? 0);
    const totalNum = Number(order.total ?? order.grandTotal ?? 0);
    const statusStr = String(order.status || "received").toUpperCase();

    const invoiceText = `
${divider}
            GLOBAL EATS GOURMET RECEIPT            
${divider}
Order ID      : ${order.id || order._id || "GE-000000"}
Date & Time   : ${order.timestamp || "Recently"}
Restaurant    : ${order.restaurantName || "Gourmet Kitchen"}
Delivery Status: ${statusStr}
Client Name   : Vedanshi Bhabhra
${divider}
ITEMS ORDERED:
${itemLines}
${divider}
Subtotal      : ₹ ${subtotalNum.toFixed(2).padStart(8)}
Delivery Fee  : ${deliveryFeeNum === 0 ? "FREE".padStart(10) : `₹ ${deliveryFeeNum.toFixed(2).padStart(8)}`}
Tax & Svc (5%): ₹ ${taxNum.toFixed(2).padStart(8)}
${discountNum > 0
        ? `Promo Discount: -₹ ${discountNum.toFixed(2).padStart(7)}
`
        : ""
      }${divider}
GRAND TOTAL   : ₹ ${totalNum.toFixed(2).padStart(8)}
${divider}
Payment Mode  : Secured Gateway
Thank you for choosing QuikaBite Gourmet dining!
For support, contact support@Quikabite.ae
${divider}
    `;
    const blob = new Blob([invoiceText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${order.id || "receipt"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Invoice for ${order.id || "order"} downloaded successfully!`);
  };

  const handlePrintInvoice = (order) => {
    if (!order) return;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      if (triggerToast) triggerToast("Please allow popups in your browser to print invoice.");
      return;
    }

    const itemsHtml = (Array.isArray(order.items) ? order.items : [])
      .map((item) => {
        const name = item?.menuItem?.name || item?.name || "Gourmet Item";
        const price = Number(item?.menuItem?.price ?? item?.price ?? 0);
        const qty = Number(item?.quantity ?? 1);
        return `
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee;">${name} x${qty}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹ ${(price * qty).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.id || "QB-0000"} - Quickaa Bite</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 650px; margin: auto; }
            .header { text-align: center; border-bottom: 3px solid #ea580c; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; color: #ea580c; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
            .header p { margin: 6px 0 0; color: #666; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
            .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 25px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
            th { text-align: left; background: #f8f8f8; padding: 10px 8px; border-bottom: 2px solid #e5e5e5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .totals { font-size: 13px; margin-top: 15px; }
            .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-size: 16px; font-weight: 900; border-top: 2px solid #111; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #888; border-top: 1px border-dashed #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>QuickaBite</h1>
            <p>AUTHENTICATED TAX INVOICE & RECEIPT</p>
          </div>
          <div class="meta">
            <div>
              <strong>Order ID:</strong> #${order.id || "QB-0000"}<br>
              <strong>Date & Time:</strong> ${order.timestamp || new Date().toLocaleString()}<br>
              <strong>Restaurant:</strong> ${order.restaurantName || "QuickaBite Kitchen Outpost"}
            </div>
            <div style="text-align: right;">
              <strong>Payment Status:</strong> PAID ONLINE ✓<br>
              <strong>TRN Number:</strong> 100459302840003
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal:</span> <span>₹ ${Number(order.subtotal || 0).toFixed(2)}</span></div>
            ${Number(order.discount || 0) > 0 ? `<div><span style="color:#059669; font-weight:bold;">Promo Discount (${order.couponCode || "COUPON"}):</span> <span style="color:#059669; font-weight:bold;">-₹ ${Number(order.discount).toFixed(2)}</span></div>` : ""}
            <div><span>Delivery Fee:</span> <span>${Number(order.deliveryFee || 0) === 0 ? "<strong style='color:#059669;'>FREE</strong>" : `₹ ${Number(order.deliveryFee).toFixed(2)}`}</span></div>
            <div><span>5% VAT & Service Charge:</span> <span>₹ ${Number(order.tax || 0).toFixed(2)}</span></div>
            <div class="grand-total"><span>Grand Total:</span> <span>₹ ${Number(order.total || order.grandTotal || 0).toFixed(2)}</span></div>
          </div>
          <div class="footer">
            Thank you for ordering with QuickaBite! • Computer-generated tax receipt.
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const getStatusInfo = (status) => {
    switch (status) {
      case "received":
      case "placed":
      case "pending":
        return {
          label: "Order Received",
          color: "text-purple-700 bg-purple-50 border-purple-200",
          dot: "bg-purple-500",
          icon: Clock,
          desc: "Your culinary request has been received by the kitchen",
        };
      case "accepted":
      case "confirmed":
        return {
          label: "Order Accepted",
          color: "text-indigo-700 bg-indigo-50 border-indigo-200",
          dot: "bg-indigo-500",
          icon: CheckCircle2,
          desc: "Chef has accepted your order and is queuing ingredients",
        };
      case "preparing":
        return {
          label: "Preparing Feast",
          color: "text-blue-700 bg-blue-50 border-blue-200",
          dot: "bg-blue-500",
          icon: Compass,
          desc: "Our master chefs are preparing your delicious meals",
        };
      case "ready":
      case "ready-for-pickup":
        return {
          label: "Ready for Pickup",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
          desc: "Your meal is prepared, warm, and waiting for courier pickup",
        };
      case "dispatched":
      case "out_for_delivery":
        return {
          label: "Dispatched / Out",
          color: "text-amber-700 bg-amber-50 border-amber-200",
          dot: "bg-amber-500",
          icon: Truck,
          desc: "Rider is speeding towards your doorstep",
        };
      case "delivered":
        return {
          label: "Delivered",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
          desc: "Delivered hot and sealed at your door!",
        };
      case "rejected":
      case "cancelled":
        return {
          label: "Order Rejected",
          color: "text-rose-700 bg-rose-50 border-rose-200",
          dot: "bg-rose-500",
          icon: XCircle,
          desc: "Order could not be fulfilled by kitchen",
        };
      default:
        return {
          label: "Processing",
          color: "text-gray-700 bg-gray-50 border-gray-200",
          dot: "bg-gray-400",
          icon: Clock,
          desc: "Your gourmet request is in process",
        };
    }
  };
  if (isLoading) {
    return (
      <div
        className="space-y-8 max-w-6xl mx-auto py-1 animate-pulse animate-fade-in"
        id="orders-page-loading"
      >
        {/* Header Loading */}
        <div className="text-center max-w-xl mx-auto space-y-2 pt-4 sm:pt-6">
          <div className="h-10 w-10 bg-neutral-200 rounded-full mx-auto" />
          <div className="h-8 bg-neutral-200 rounded-full w-2/3 mx-auto" />
          <div className="h-4 bg-neutral-200 rounded-full w-1/2 mx-auto" />
        </div>
        {/* Subtabs Loading */}
        <div className="flex justify-center">
          <div className="h-12 w-64 bg-neutral-200 rounded-full" />
        </div>
        {/* List of items Loading */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white border border-neutral-150 rounded-2xl p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-neutral-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded-full w-32" />
                    <div className="h-3 bg-neutral-200 rounded-full w-20" />
                  </div>
                </div>
                <div className="h-6 bg-neutral-200 rounded-full w-20" />
              </div>
              <div className="h-8 bg-neutral-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-8 max-w-6xl mx-auto py-2 animate-fade-in"
      id="orders-page-container"
    >
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto space-y-3">
                <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight">
          Your orders
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Track live orders, reorder your favourites and download invoices.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1.5 rounded-full flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab("active")}
            className={`cursor-pointer px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeSubTab === "active" ? "bg-white text-gray-900 shadow-md scale-102 font-black" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Clock className="h-4 w-4" />
            Active Orders
            {activeOrdersList.length > 0 && (
              <span className="bg-brand-orange text-white text-[11px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {activeOrdersList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("past")}
            className={`cursor-pointer px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeSubTab === "past" ? "bg-white text-gray-900 shadow-md scale-102 font-black" : "text-gray-500 hover:text-gray-800"}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Order History
            {pastOrdersList.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-[11px] px-2 py-0.5 rounded-full font-bold">
                {pastOrdersList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === "active" ? (
        <div className="space-y-6">
          {activeOrdersList.length > 0 ? (
            <div className="space-y-6">
              {activeOrdersList.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                const isExpanded = !!expandedOrders[order.id];
                return (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition duration-300"
                    id={`active-order-card-${order.id}`}
                  >
                    {/* Top restaurant and tracking bar */}
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 bg-neutral-50/50">
                      <div className="flex items-center gap-4">
                        <img
                          src={getRestaurantImage(order.restaurantName, order.restaurantImage)}
                          alt={order.restaurantName}
                          className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-xs shrink-0"
                        />
                        <div>
                          <h3 className="font-display font-black text-lg text-gray-900 leading-snug">
                            {order.restaurantName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-gray-400">
                              ID: {order.id}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {order.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side live status indicator */}
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-ping`}
                          />
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo.label}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {statusInfo.desc}
                        </p>
                      </div>
                    </div>

                    {/* Progress visual steps tracker OR Rejection Banner */}
                    {order.status === "rejected" || order.status === "cancelled" ? (
                      <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <XCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-black text-rose-900 uppercase">Order Rejected by Kitchen</h4>
                              {(() => {
                                const oId = String(order.id || order._id || "");
                                const rawTime = order.rejectedAt ? new Date(order.rejectedAt).getTime() : rejectedOrderTimes[oId];
                                const rejTime = typeof rawTime === "number" ? rawTime : new Date(rawTime).getTime();
                                const remainingSecs = Math.max(0, Math.ceil((REJECTION_GRACE_MS - (now - (rejTime || now))) / 1000));
                                return remainingSecs > 0 ? (
                                  <span className="text-[11px] font-bold text-rose-700 bg-rose-150/80 px-2 py-0.5 rounded-full animate-pulse border border-rose-200">
                                    Moving to Order History in {remainingSecs}s
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                              Reason: {order.rejectionReason || order.reason || "Item currently unavailable or kitchen at capacity"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDismissToHistory(order.id)}
                            className="px-3.5 py-2 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                          >
                            Move to History Now
                          </button>
                          <button
                            onClick={() => handleReorder(order)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition shrink-0 cursor-pointer shadow-xs"
                          >
                            Reorder Items
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-5 border-b border-gray-50 bg-white">
                        <div className="relative flex justify-between items-center max-w-3xl mx-auto">
                          {/* Track bar line */}
                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />

                          {/* Dynamic filled line */}
                          <div
                            className="absolute left-0 top-1/2 h-0.5 bg-brand-orange -translate-y-1/2 z-0 transition-all duration-1000"
                            style={{
                              width:
                                order.status === "received" ||
                                  order.status === "placed" ||
                                  order.status === "pending"
                                  ? "0%"
                                  : order.status === "accepted" ||
                                    order.status === "confirmed"
                                    ? "25%"
                                    : order.status === "preparing" ||
                                      order.status === "ready" ||
                                      order.status === "ready-for-pickup"
                                      ? "50%"
                                      : order.status === "dispatched" ||
                                        order.status === "out_for_delivery" ||
                                        order.status === "out for delivery" ||
                                        order.status === "delivering" ||
                                        order.status === "in_transit" ||
                                        order.status === "in transit" ||
                                        order.status === "on_way" ||
                                        order.status === "on way" ||
                                        order.status === "shipped"
                                        ? "75%"
                                        : "100%",
                            }}
                          />

                          {[
                            { key: "received", label: "Placed", icon: Clock },
                            {
                              key: "accepted",
                              label: "Accepted",
                              icon: CheckCircle2,
                            },
                            {
                              key: "preparing",
                              label: "Preparing",
                              icon: Utensils,
                            },
                            {
                              key: "dispatched",
                              label: "On Way",
                              icon: Truck,
                            },
                            {
                              key: "delivered",
                              label: "Arrived",
                              icon: CheckCircle2,
                            },
                          ].map((step, idx) => {
                            const stepsArr = [
                              "received",
                              "accepted",
                              "preparing",
                              "dispatched",
                              "delivered",
                            ];
                            const sStr = String(order.status || "").toLowerCase().trim();
                            const normStatus =
                              sStr === "received" || sStr === "placed" || sStr === "pending"
                                ? "received"
                                : sStr === "accepted" || sStr === "confirmed"
                                  ? "accepted"
                                  : sStr === "preparing" || sStr === "ready" || sStr === "ready-for-pickup"
                                    ? "preparing"
                                    : sStr === "dispatched" ||
                                      sStr === "out_for_delivery" ||
                                      sStr === "out for delivery" ||
                                      sStr === "delivering" ||
                                      sStr === "in_transit" ||
                                      sStr === "in transit" ||
                                      sStr === "on_way" ||
                                      sStr === "on way" ||
                                      sStr === "shipped"
                                      ? "dispatched"
                                      : sStr === "delivered" || sStr === "completed"
                                        ? "delivered"
                                        : sStr;
                            const currentIdx = stepsArr.indexOf(normStatus);
                            const stepIdx = stepsArr.indexOf(step.key);
                            const isDone = stepIdx <= currentIdx;
                            const isCurrent = step.key === normStatus;
                            const StepIcon = step.icon;
                            return (
                              <div
                                key={step.key}
                                className="relative z-10 flex flex-col items-center"
                              >
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isDone ? "bg-brand-orange text-white ring-4 ring-orange-50" : "bg-white border-2 border-gray-200 text-gray-400"} ${isCurrent ? "scale-110 animate-pulse" : ""}`}
                                >
                                  <StepIcon className="w-4 h-4" />
                                </div>
                                <span
                                  className={`text-[11px] font-bold mt-2 tracking-tight ${isDone ? "text-gray-900" : "text-gray-400"}`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Middle section for order cost details & track live shortcut */}
                    <div className="p-6 bg-white space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-800">
                            Total amount:{" "}
                            <span className="font-mono text-orange-700 text-lg font-black">
                              ₹ {order.total}
                            </span>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-xs text-gray-500">
                            {order.items.length} items ordered
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition"
                          >
                            <span>
                              {isExpanded ? "Hide Details" : "View Items"}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Items details collapse panel */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 pt-4 mt-2 space-y-3 bg-gray-50/50 rounded-2xl p-4 animate-fade-in">
                          <p className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                            Itemized Receipt
                          </p>
                          <div className="space-y-2">
                            {(Array.isArray(order.items) ? order.items : []).map((item, idx) => {
                              const itemName = item?.menuItem?.name || item?.name || "Gourmet Item";
                              const itemPrice = Number(item?.menuItem?.price ?? item?.price ?? 0);
                              const itemQty = Number(item?.quantity ?? 1);
                              return (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-xs"
                                >
                                  <span className="text-gray-600 font-medium">
                                    {itemName}{" "}
                                    <span className="font-black text-gray-800">
                                      x{itemQty}
                                    </span>
                                  </span>
                                  <span className="font-mono font-bold text-gray-700">
                                    ₹ {itemPrice * itemQty}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5 text-xs">
                            <div className="flex justify-between text-gray-400">
                              <span>Subtotal</span>
                              <span className="font-mono text-gray-700">
                                ₹ {order.subtotal ?? 0}
                              </span>
                            </div>
                            {Number(order.discount || 0) > 0 && (
                              <div className="flex justify-between text-emerald-600 font-bold">
                                <span>Promo Discount ({order.couponCode})</span>
                                <span className="font-mono">
                                  -₹ {order.discount}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-400">
                              <span>Delivery Fee</span>
                              <span className="font-mono text-gray-700 font-bold">
                                {Number(order.deliveryFee || 0) === 0 ? (
                                  <span className="text-emerald-600">FREE</span>
                                ) : (
                                  `₹ ${order.deliveryFee}`
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>VAT & Service (5%)</span>
                              <span className="font-mono text-gray-700">
                                ₹ {order.tax ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                          title="Download Text Invoice File"
                        >
                          <Download className="h-3.5 w-3.5 text-gray-400" />
                          <span>Download Invoice</span>
                        </button>

                        <button
                          onClick={() => setInvoiceModalOrder(order)}
                          className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                          title="Print / PDF Invoice View"
                        >
                          <Printer className="h-3.5 w-3.5 text-gray-400" />
                          <span>Print View</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setActiveOrder(order);
                            triggerToast("Live tracker opened on full map!");
                          }}
                          className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          <Compass className="h-4 w-4 animate-spin-slow" />
                          <span>Track Live GPS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl space-y-4">
              <p className="text-gray-500 font-bold">No active orders</p>
              <p className="text-gray-400 text-xs max-w-xs mx-auto">
                Hungry? Your next order will show up here with live updates.
              </p>
              <button
                onClick={() => {
                  if (setActiveTab) {
                    setActiveTab("home#restaurants-grid-section");
                  }
                  setTimeout(() => {
                    const resSection = document.getElementById("restaurants-grid-section");
                    if (resSection) {
                      resSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
                className="cursor-pointer bg-brand-orange hover:bg-orange-700 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-md transition"
              >
                Order now
              </button>
            </div>
          )}
        </div>
      ) : (
        /* PAST ORDERS TAB */
        <div className="space-y-6">
          {pastOrdersList.length > 0 ? (
            <div className="space-y-6">
              {pastOrdersList.map((order) => {
                const isExpanded = !!expandedOrders[order.id];
                const hasRated = order.rating !== void 0;
                return (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden hover:shadow-md transition duration-300"
                    id={`past-order-card-${order.id}`}
                  >
                    {/* Header bar */}
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50">
                      <div className="flex items-center gap-4">
                        <img
                          src={getRestaurantImage(order.restaurantName, order.restaurantImage)}
                          alt={order.restaurantName}
                          className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-xs shrink-0 grayscale-20"
                        />
                        <div>
                          <h3 className="font-display font-black text-lg text-gray-800 leading-snug flex items-center gap-2">
                            <span>{order.restaurantName}</span>
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-gray-400">
                              ID: {order.id}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {order.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Completed tag & price */}
                      <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                        {order.status === "rejected" || order.status === "cancelled" ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-150 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            <span>Rejected ✕</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Delivered ✓</span>
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-gray-800">
                          Total Amount:{" "}
                          <span className="font-mono text-gray-900 text-base font-black">
                            ₹ {order.total}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Order summary with rating & expand */}
                    <div className="p-6 bg-white space-y-4">
                      {/* Sub-summary item count */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          {order.items.length} items • {order.status === "rejected" || order.status === "cancelled" ? "Rejected by kitchen" : "Completed successfully"}
                        </span>

                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 transition"
                        >
                          <span>
                            {isExpanded ? "Hide Details" : "View Items"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Items collapsible details */}
                      {isExpanded && (
                        <div className="border-t border-gray-150 pt-4 mt-2 space-y-3 bg-gray-50/55 rounded-2xl p-4 animate-fade-in">
                          <p className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                            Order items & sub-breakdowns
                          </p>
                          <div className="space-y-2">
                            {(Array.isArray(order.items) ? order.items : []).map((item, idx) => {
                              const itemName = item?.menuItem?.name || item?.name || "Gourmet Item";
                              const itemPrice = Number(item?.menuItem?.price ?? item?.price ?? 0);
                              const itemQty = Number(item?.quantity ?? 1);
                              return (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-xs"
                                >
                                  <span className="text-gray-600 font-medium">
                                    {itemName}{" "}
                                    <span className="font-black text-gray-800">
                                      x{itemQty}
                                    </span>
                                  </span>
                                  <span className="font-mono font-bold text-gray-700">
                                    ₹ {itemPrice * itemQty}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-xs">
                            <div className="flex justify-between text-gray-400">
                              <span>Subtotal</span>
                              <span className="font-mono text-gray-700">
                                ₹ {order.subtotal ?? 0}
                              </span>
                            </div>
                            {Number(order.discount || 0) > 0 && (
                              <div className="flex justify-between text-emerald-600 font-bold">
                                <span>Discount ({order.couponCode})</span>
                                <span className="font-mono">
                                  -₹ {order.discount}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-400">
                              <span>Delivery Fee</span>
                              <span className="font-mono text-gray-700 font-bold">
                                {Number(order.deliveryFee || 0) === 0 ? (
                                  <span className="text-emerald-600">FREE</span>
                                ) : (
                                  `₹ ${order.deliveryFee}`
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>VAT & Service (5%)</span>
                              <span className="font-mono text-gray-700">
                                ₹ {order.tax ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PERSISTED RATING SHOWCASE OR STAR RATING FORM */}
                      {hasRated ? (
                        <div className="bg-amber-50/40 border border-amber-100/50 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center gap-1">
                              👑 You Rated This Experience:
                            </span>
                            <div className="flex items-center text-amber-400 gap-0.5 ml-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4.5 h-4.5 fill-current ${i < (order.rating || 0) ? "text-amber-400" : "text-gray-200"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {order.ratingComment && (
                            <p className="text-xs italic text-gray-600 font-medium pl-1">
                              "{order.ratingComment}"
                            </p>
                          )}
                        </div>
                      ) : ratingOrder === order.id ? (
                        /* Rating form expansion box */
                        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-gray-800">
                              Rate your meal from {order.restaurantName}
                            </h4>
                            <p className="text-xs text-gray-400">
                              Your feedback helps local master chefs elevate
                              their gourmet recipes
                            </p>
                          </div>

                          {/* Star interactive icons */}
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const ratingStar = i + 1;
                              const isLit =
                                hoverRating >= ratingStar ||
                                ratingValue >= ratingStar;
                              return (
                                <button
                                  key={i}
                                  onMouseEnter={() =>
                                    setHoverRating(ratingStar)
                                  }
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => setRatingValue(ratingStar)}
                                  className="transform hover:scale-120 transition focus:outline-none"
                                >
                                  <Star
                                    className={`w-7 h-7 ${isLit ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                                  />
                                </button>
                              );
                            })}
                          </div>

                          {/* Comment review box */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600">
                              Review Comments (Optional)
                            </label>
                            <textarea
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              placeholder="Describe taste, warmth, packaging, or speed..."
                              className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                              rows={2}
                            />
                          </div>

                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => setRatingOrder(null)}
                              className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitRating(order.id)}
                              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs tracking-wider uppercase transition shadow-xs"
                            >
                              Submit Review
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start">
                          <button
                            onClick={() => {
                              setRatingOrder(order.id);
                              setRatingValue(0);
                              setRatingComment("");
                            }}
                            className="bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-700 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                          >
                            <Star className="h-4 w-4 text-amber-500 animate-pulse" />
                            <span>Rate Order</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                          title="Download Text Invoice File"
                        >
                          <Download className="h-3.5 w-3.5 text-gray-400" />
                          <span>Download Invoice</span>
                        </button>

                        <button
                          onClick={() => setInvoiceModalOrder(order)}
                          className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                          title="Print / PDF Invoice View"
                        >
                          <Printer className="h-3.5 w-3.5 text-gray-400" />
                          <span>Print View</span>
                        </button>

                        <button
                          onClick={() => setReportIssueOrder(order)}
                          className="bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          title="Raise Support Ticket"
                        >
                          <LifeBuoy className="h-3.5 w-3.5 text-amber-600" />
                          <span>Support / Raise Ticket</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleReorder(order)}
                          className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Re-order</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl space-y-4">
              <p className="text-gray-500 font-bold">
                Your Past Order history is empty
              </p>
              <p className="text-gray-400 text-xs max-w-xs mx-auto">
                Any orders you complete and have successfully delivered will be
                compiled here!
              </p>
              <button
                onClick={() => {
                  if (setActiveTab) {
                    setActiveTab("home#restaurants-grid-section");
                  }
                  setTimeout(() => {
                    const resSection = document.getElementById("restaurants-grid-section");
                    if (resSection) {
                      resSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
                className="cursor-pointer bg-brand-orange hover:bg-orange-700 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-md transition"
              >
                Start Ordering
              </button>
            </div>
          )}
        </div>
      )}

      {/* INVOICE MODAL / PRINT PREVIEW PORTAL */}
      {invoiceModalOrder && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer overflow-y-auto"
          onClick={() => setInvoiceModalOrder(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 my-auto cursor-default flex flex-col max-h-[85vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar */}
            <div className="p-4 sm:p-5 bg-neutral-950 text-white border-b border-neutral-800 flex items-center justify-between shrink-0">
              <h4 className="font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 text-white">
                <Printer className="h-4.5 w-4.5 text-orange-700 shrink-0" />
                <span>Verified Tax Invoice Portal</span>
              </h4>
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center"
                title="Close Window"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Area content */}
            <div
              className="p-6 sm:p-8 space-y-6 text-gray-800 max-h-[70vh] overflow-y-auto"
              id={`printable-invoice-${invoiceModalOrder.id}`}
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-950 tracking-tight">
                  QUICKABITE FOODS
                </h3>
                <p className="text-[11px] text-gray-400 font-mono font-bold uppercase tracking-widest">
                  Gourmet Cloud Kitchen Delivery Services
                </p>
                <p className="text-xs text-gray-500">
                  QuickaBite Corporate Hub, Tax Reg #100459302840003
                </p>
              </div>

              {/* Receipt Metadata */}
              <div className="border-y border-dashed border-gray-200 py-4 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-gray-400">Receipt No:</p>
                  <p className="font-mono font-bold text-gray-800">
                    {invoiceModalOrder.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400">Date & Time:</p>
                  <p className="font-bold text-gray-800">
                    {invoiceModalOrder.timestamp}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400">Restaurant Outpost:</p>
                  <p className="font-bold text-gray-800">
                    {invoiceModalOrder.restaurantName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400">Payment Status:</p>
                  <p className="font-bold text-emerald-600">PAID ONLINE ✓</p>
                </div>
              </div>

              {/* Itemized row */}
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Itemized Description
                </p>
                <div className="space-y-2 text-xs">
                  {(Array.isArray(invoiceModalOrder.items) ? invoiceModalOrder.items : []).map((item, idx) => {
                    const itemName = item?.menuItem?.name || item?.name || "Gourmet Item";
                    const itemPrice = Number(item?.menuItem?.price ?? item?.price ?? 0);
                    const itemQty = Number(item?.quantity ?? 1);
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium text-gray-700">
                          {itemName}{" "}
                          <span className="font-bold text-gray-900">
                            x{itemQty}
                          </span>
                        </span>
                        <span className="font-mono font-bold text-gray-900">
                          ₹ {(itemPrice * itemQty).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipt calculations */}
              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold">
                    ₹ {Number(invoiceModalOrder.subtotal ?? 0).toFixed(2)}
                  </span>
                </div>
                {Number(invoiceModalOrder.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>
                      Discount Coupon ({invoiceModalOrder.couponCode})
                    </span>
                    <span className="font-mono">
                      -₹ {Number(invoiceModalOrder.discount ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Standard Delivery Charge</span>
                  <span className="font-mono font-bold">
                    {Number(invoiceModalOrder.deliveryFee ?? 0) === 0 ? (
                      <span className="text-emerald-600">FREE</span>
                    ) : (
                      `₹ ${Number(invoiceModalOrder.deliveryFee ?? 0).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>5% VAT & Municipal Svc Tax</span>
                  <span className="font-mono font-bold">
                    ₹ {Number(invoiceModalOrder.tax ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-double border-gray-300 pt-3 flex justify-between text-base font-black text-gray-950">
                  <span>Grand Total</span>
                  <span className="font-mono">
                    ₹ {Number(invoiceModalOrder.total ?? invoiceModalOrder.grandTotal ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Secure Stamp */}
              <div className="pt-4 flex flex-col items-center justify-center text-center space-y-1 bg-gray-50 rounded-2xl p-4">
                <span className="text-lg">🛡️</span>
                <p className="text-[11px] font-mono font-bold text-emerald-600 uppercase tracking-widest">
                  Secured Gateway • Paid Online
                </p>
                <p className="text-[11px] text-gray-400">
                  Tax Registration Number (TRN): 100459302840003
                </p>
              </div>
            </div>

            {/* Action controls footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2.5">
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDownloadInvoice(invoiceModalOrder)}
                className="flex-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="h-4 w-4 text-gray-500" />
                <span>Download file</span>
              </button>

              <button
                onClick={() => handlePrintInvoice(invoiceModalOrder)}
                className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-black py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Support / Issue Reporting Modal */}
      <ReportIssueModal
        isOpen={!!reportIssueOrder}
        onClose={() => setReportIssueOrder(null)}
        order={reportIssueOrder}
        onSuccess={() => {
          if (triggerToast) triggerToast("Support ticket submitted successfully!");
          setReportIssueOrder(null);
        }}
      />
    </div>
  );
}
