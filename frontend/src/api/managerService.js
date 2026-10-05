// src/api/managerService.js
import apiClient from "./apiClient";
import { normalizeOrder, isPaidOrCodOrder } from "./dinerService";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export const managerService = {
  // 1. Fetch Incoming Orders (GET /v1/orders/manager/incoming)
  async getIncomingOrders() {
    try {
      const response = await apiClient.get("/v1/orders/manager/incoming");
      const raw = response.data?.data || response.data?.orders || response.data;
      const list = Array.isArray(raw) ? raw : [];
      const remoteOrders = list.map(normalizeOrder).filter(Boolean);

      try {
        localStorage.setItem("globaleats_orders", JSON.stringify(remoteOrders));
      } catch (e) {
        console.error("Error caching orders in localStorage:", e);
      }

      return remoteOrders;
    } catch (err) {
      console.warn("getIncomingOrders API error:", err?.message || err);
      if (!USE_MOCK) {
        return [];
      }
      try {
        const cached = localStorage.getItem("globaleats_orders");
        const parsed = cached ? JSON.parse(cached) : [];
        return Array.isArray(parsed) ? parsed.map(normalizeOrder).filter(Boolean) : [];
      } catch {
        return [];
      }
    }
  },

  // Alias for backward compatibility
  async getOrders() {
    return this.getIncomingOrders();
  },

  // Fetch Dashboard Stats (GET /v1/dashboard/stats?filter=...) with local fallback
  async getDashboardStats(filter = "all", customRange = {}) {
    const cleanFilter = (filter || "all").toString().trim().toLowerCase();

    if (!USE_MOCK) {
      try {
        const params = {};
        if (cleanFilter && cleanFilter !== "all") {
          params.filter = cleanFilter;
        }
        if (cleanFilter === "custom" && customRange.startDate && customRange.endDate) {
          params.startDate = customRange.startDate;
          params.endDate = customRange.endDate;
        }
        const response = await apiClient.get("/v1/dashboard/stats", { params });
        const raw = response.data?.data || response.data;
        if (raw && typeof raw === "object") {
          // If live API returns stats without explicit orders list, attach incoming orders for table display
          if (!Array.isArray(raw.orders) || raw.orders.length === 0) {
            try {
              const incoming = await this.getIncomingOrders();
              raw.orders = incoming;
            } catch (e) {
              console.warn("Could not attach incoming orders to API stats payload:", e);
            }
          }
          return {
            success: true,
            isFallback: false,
            data: raw,
          };
        }
      } catch (err) {
        console.warn("getDashboardStats live API failed, switching to local fallback:", err?.message || err);
      }
    }

    // Fallback Computation from Local Orders
    const orders = await this.getIncomingOrders();
    const fallbackStats = this._computeLocalStats(orders, cleanFilter, customRange);
    return {
      success: true,
      isFallback: true,
      data: fallbackStats,
    };
  },

  // Export CSV Attachment (GET /v1/dashboard/export?reportType=items&filter=last30days&format=csv)
  async exportDashboardCSV(options = {}) {
    const reportType = options.reportType || "items";
    const filter = options.filter || "last30days";
    const format = options.format || "csv";

    if (!USE_MOCK) {
      try {
        const params = { reportType, filter, format };
        if (options.startDate && options.endDate) {
          params.startDate = options.startDate;
          params.endDate = options.endDate;
        }
        const response = await apiClient.get("/v1/dashboard/export", {
          params,
          responseType: "blob",
        });

        // Download returned blob directly
        const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Manager_Report_${reportType}_${filter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, isFallback: false };
      } catch (err) {
        console.warn("exportDashboardCSV live API failed, utilizing local fallback generator:", err?.message || err);
      }
    }
    return { success: false, isFallback: true };
  },

  // Helper method to compute analytics stats dynamically from an array of orders
  _computeLocalStats(orders = [], filter = "all", customRange = {}) {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const last7DaysDate = new Date(now);
    last7DaysDate.setDate(now.getDate() - 7);

    const filteredOrders = orders.filter((o) => {
      if (!o) return false;
      const orderDate = new Date(o.createdAt || o.date || o.timestamp || Date.now());
      const dateStr = orderDate.toISOString().split("T")[0];

      if (filter === "today") {
        return dateStr === todayStr;
      } else if (filter === "yesterday") {
        return dateStr === yesterdayStr;
      } else if (filter === "last7days") {
        return orderDate >= last7DaysDate;
      } else if (filter === "thismonth") {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else if (filter === "custom") {
        if (!customRange.startDate || !customRange.endDate) return true;
        const start = new Date(customRange.startDate);
        const end = new Date(customRange.endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });

    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || o.totalAmount || o.price || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = filteredOrders.filter((o) => ["delivered", "completed"].includes(String(o.status).toLowerCase())).length;
    const activeOrders = filteredOrders.filter((o) => ["pending", "confirmed", "preparing", "ready-for-pickup", "dispatched"].includes(String(o.status).toLowerCase())).length;

    // Top selling items aggregator
    const itemMap = {};
    const brandMap = {};
    const virtualBrandMap = {};
    filteredOrders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [{ name: o.item || "Standard Order Item", qty: o.qty || 1, price: o.price || o.total || 0 }];
      const brand = o.restaurantName || o.brand || "QuikaBite Main Kitchen";

      if (!virtualBrandMap[brand]) {
        virtualBrandMap[brand] = {
          brandId: o.restaurantId || o.brandId || brand,
          brandName: brand,
          totalOrders: 0,
          itemsSold: 0,
          totalRevenue: 0,
          dishMap: {},
        };
      }
      virtualBrandMap[brand].totalOrders += 1;
      virtualBrandMap[brand].totalRevenue += Number(o.total || o.totalAmount || o.price || 0);

      items.forEach((it) => {
        const name = it.name || it.title || "Custom Dish";
        const qty = Number(it.quantity || it.qty || 1);
        const price = Number(it.price || 0);
        const revenue = price * qty || Number(o.total || 0);

        if (!itemMap[name]) itemMap[name] = { name, count: 0, revenue: 0 };
        itemMap[name].count += qty;
        itemMap[name].revenue += revenue;

        virtualBrandMap[brand].itemsSold += qty;
        virtualBrandMap[brand].dishMap[name] = (virtualBrandMap[brand].dishMap[name] || 0) + qty;

        if (!brandMap[brand]) brandMap[brand] = { name: brand, value: 0 };
        brandMap[brand].value += revenue;
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const categoryBreakdown = Object.values(brandMap);

    const virtualBrandPerformance = Object.values(virtualBrandMap).map((vb) => {
      const topSellingDish = Object.entries(vb.dishMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const avgOrderVal = vb.totalOrders > 0 ? vb.totalRevenue / vb.totalOrders : 0;
      return {
        brandId: vb.brandId,
        brandName: vb.brandName,
        totalOrders: vb.totalOrders,
        quantitySold: vb.itemsSold,
        totalRevenue: Number(vb.totalRevenue.toFixed(2)),
        averageOrderValue: Number(avgOrderVal.toFixed(2)),
        topSellingDish,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalUnitsDispatched = filteredOrders.reduce((sum, o) => {
      if (Array.isArray(o.items) && o.items.length > 0) {
        return sum + o.items.reduce((s, it) => s + Number(it.quantity || it.qty || 1), 0);
      }
      return sum + 1;
    }, 0);

    const activeCustomersCount = new Set(
      filteredOrders.map(o => o.customerName || o.customer?.name || o.customer?.email || o.user?.name || o.id)
    ).size;

    return {
      kpis: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        totalUnitsDispatched,
        activeCustomers: activeCustomersCount,
        averageBasketSize: totalOrders > 0 ? Number((totalUnitsDispatched / totalOrders).toFixed(2)) : 0,
        averageOrderValue: Number(avgOrderValue.toFixed(2)),
        totalDeliveredOrders: completedOrders,
        pendingPreparingOrders: activeOrders,
      },
      virtualBrandPerformance,
      dailySales: [],
      weeklyRevenue: [],
      topSellingItems: topItems,
      topCategories: categoryBreakdown,
      highestSpendingCustomers: [],
      orderStatusAnalytics: {},
      orders: filteredOrders,
    };
  },

  // Helper to resolve 24-hex Mongo _id from orderId / order object / display order number
  async _resolveDbOrderId(orderId) {
    if (!orderId) return "";
    let raw = orderId;
    if (typeof raw === "object" && raw !== null) {
      raw = raw._id || raw.id || raw.orderId || "";
    }
    const strId = String(raw || "").trim();
    const clean = strId.replace(/^GE-/, "");

    if (/^[0-9a-fA-F]{24}$/.test(clean)) {
      return clean;
    }

    try {
      const cached = localStorage.getItem("globaleats_orders");
      const list = cached ? JSON.parse(cached) : [];
      if (Array.isArray(list)) {
        const found = list.find(
          (o) =>
            String(o.orderNumber) === clean ||
            String(o.orderId) === clean ||
            String(o.id) === clean ||
            String(o._id) === clean ||
            String(o.orderNumber) === strId ||
            String(o.id) === strId ||
            String(o._id) === strId
        );
        if (found) {
          const dbId = found._id || found.orderId || found.id;
          if (dbId && /^[0-9a-fA-F]{24}$/.test(String(dbId))) {
            return String(dbId);
          }
        }
      }
    } catch (e) {
      // ignore parse error
    }

    try {
      const incoming = await this.getIncomingOrders();
      if (Array.isArray(incoming)) {
        const found = incoming.find(
          (o) =>
            String(o.orderNumber) === clean ||
            String(o.orderId) === clean ||
            String(o.id) === clean ||
            String(o._id) === clean ||
            String(o.orderNumber) === strId ||
            String(o.id) === strId ||
            String(o._id) === strId
        );
        if (found) {
          const dbId = found._id || found.orderId || found.id;
          if (dbId && /^[0-9a-fA-F]{24}$/.test(String(dbId))) {
            return String(dbId);
          }
        }
      }
    } catch (e) {
      // ignore error
    }

    return clean;
  },

  // 3. Fetch Single Order Details (GET /v1/orders/:orderId)
  async getOrderDetails(orderId) {
    const cleanId = await this._resolveDbOrderId(orderId);
    if (USE_MOCK) {
      const cached = localStorage.getItem("globaleats_orders");
      const list = cached ? JSON.parse(cached) : [];
      const found = list.find((o) => String(o.id) === String(orderId) || String(o._id) === String(orderId) || String(o._id) === String(cleanId));
      return found ? normalizeOrder(found) : null;
    } else {
      try {
        const response = await apiClient.get(`/v1/orders/${cleanId}`);
        const raw = response.data?.data || response.data?.order || response.data;
        return raw ? normalizeOrder(raw) : null;
      } catch (err) {
        console.error("getOrderDetails API error:", err);
        return null;
      }
    }
  },

  // 2. Accept Order (PATCH /v1/orders/:orderId/status -> { "status": "confirmed" })
  async acceptOrder(orderId) {
    return this._patchOrderStatus(orderId, { status: "confirmed" });
  },

  // 4. Reject Order (PATCH /v1/orders/:orderId/status -> { "status": "rejected", "reason": "..." })
  async rejectOrder(orderId, reason = "Item currently unavailable") {
    return this._patchOrderStatus(orderId, { status: "rejected", reason });
  },

  // 5. Preparing Order Started (PATCH /v1/orders/:orderId/status -> { "status": "preparing" })
  async startPreparingOrder(orderId) {
    return this._patchOrderStatus(orderId, { status: "preparing" });
  },

  // 6. Order Ready (PATCH /v1/orders/:orderId/status -> { "status": "ready-for-pickup" })
  async markOrderReady(orderId) {
    return this._patchOrderStatus(orderId, { status: "ready-for-pickup" });
  },

  // 8. Order Delivered (PATCH /v1/orders/:orderId/status -> { "status": "delivered" })
  async markOrderDelivered(orderId) {
    return this._patchOrderStatus(orderId, { status: "delivered" });
  },

  // 7. Courier Assigned and Dispatched (PATCH /v1/orders/:orderId/dispatch)
  async dispatchOrder(orderId, deliveryDetails = {}) {
    const cleanId = await this._resolveDbOrderId(orderId);
    const payload = {
      partner: deliveryDetails.partner || "Ola",
      driverName: deliveryDetails.driverName || "Rajesh Kumar",
      driverPhone: deliveryDetails.driverPhone || "9876543210",
      vehicleDetails: deliveryDetails.vehicleDetails || "White Maruti Dzire KA-01-MJ-4321",
      deliveryRemarks: deliveryDetails.deliveryRemarks || "Drive carefully"
    };

    try {
      await apiClient.patch(`/v1/orders/${cleanId}/dispatch`, payload);
      return await this.getIncomingOrders();
    } catch (err) {
      console.warn("dispatchOrder live API call failed, falling back to local state:", err?.message || err);
      return this._updateLocalOrderState(orderId, {
        status: "dispatched",
        deliveryPartner: payload.partner,
        driverName: payload.driverName,
        driverPhone: payload.driverPhone,
        vehicleDetails: payload.vehicleDetails,
        deliveryRemarks: payload.deliveryRemarks,
        deliveryStatus: "Assigned"
      });
    }
  },

  // Alias for backward compatibility
  async assignDelivery(orderId, deliveryDetails) {
    return this.dispatchOrder(orderId, deliveryDetails);
  },

  // General Status Update helper
  async updateOrderStatus(orderId, nextStatus, options = {}) {
    const s = String(nextStatus).toLowerCase().trim();
    if (s === "accepted" || s === "confirmed") {
      return this.acceptOrder(orderId);
    } else if (s === "preparing") {
      return this.startPreparingOrder(orderId);
    } else if (s === "ready" || s === "ready-for-pickup" || s === "ready_for_pickup") {
      return this.markOrderReady(orderId);
    } else if (s === "dispatched" || s === "out_for_delivery") {
      return this.dispatchOrder(orderId, options);
    } else if (s === "delivered" || s === "completed") {
      return this.markOrderDelivered(orderId);
    } else if (s === "rejected" || s === "cancelled") {
      return this.rejectOrder(orderId, options.reason);
    } else {
      return this._patchOrderStatus(orderId, { status: nextStatus });
    }
  },

  // Internal helper to handle PATCH /v1/orders/:orderId/status
  async _patchOrderStatus(orderId, payload) {
    const cleanId = await this._resolveDbOrderId(orderId);
    const apiPayload = { ...payload };
    if (apiPayload.status === "ready") {
      apiPayload.status = "ready-for-pickup";
    }
    try {
      await apiClient.patch(`/v1/orders/${cleanId}/status`, apiPayload);
      return await this.getIncomingOrders();
    } catch (err) {
      console.warn("_patchOrderStatus live API call failed, falling back to local state:", err?.message || err);
      return this._updateLocalOrderState(orderId, {
        status: payload.status,
        rejectionReason: payload.reason,
        reason: payload.reason
      });
    }
  },

  // Internal helper to update localStorage in mock mode
  async _updateLocalOrderState(orderId, fieldsToUpdate) {
    const fieldsToApply = {
      ...fieldsToUpdate,
      ...(fieldsToUpdate.status ? { orderStatus: fieldsToUpdate.status } : {}),
      ...(fieldsToUpdate.status === "rejected" || fieldsToUpdate.status === "cancelled"
        ? { rejectedAt: new Date().toISOString() }
        : {})
    };
    const cached = localStorage.getItem("globaleats_orders");
    const orders = cached ? JSON.parse(cached) : [];
    let matchFound = false;
    const updated = orders.map((o) => {
      const isMatch = String(o.id) === String(orderId) || String(o._id) === String(orderId);
      if (isMatch) {
        matchFound = true;
        return { ...o, ...fieldsToApply };
      }
      return o;
    });

    if (!matchFound) {
      updated.unshift({
        id: String(orderId),
        _id: String(orderId),
        status: fieldsToApply.status || "dispatched",
        orderStatus: fieldsToApply.status || "dispatched",
        timestamp: new Date().toISOString(),
        ...fieldsToApply
      });
    }

    try {
      localStorage.setItem("globaleats_orders", JSON.stringify(updated));
    } catch (e) {
      console.error("Error setting local orders:", e);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("globaleats_order_mutated", { detail: { orderId, fieldsToUpdate } }));
    }
    return updated.map(normalizeOrder).filter(Boolean).filter(isPaidOrCodOrder);
  }
};

export default managerService;
