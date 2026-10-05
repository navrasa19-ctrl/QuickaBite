import { useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { motion } from "framer-motion";
import {
  Truck,
  CheckCircle2,
  Search,
  Phone,
  AlertCircle,
  ChevronRight,
  Map
} from "lucide-react";
export default function DeliveryManagementTab({ orders, setOrders, triggerToast }) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const activeDeliveries = orders.filter((o) => {
    return o.deliveryPartner || o.status === "dispatched" || o.status === "out_for_delivery" || o.status === "delivered";
  });
  const deliveriesWithStatus = activeDeliveries.map((o) => {
    let currentDeliveryStatus = o.deliveryStatus;
    if (!currentDeliveryStatus) {
      if (o.status === "delivered") {
        currentDeliveryStatus = "Delivered";
      } else if (o.status === "out_for_delivery") {
        currentDeliveryStatus = "Out For Delivery";
      } else {
        currentDeliveryStatus = "Assigned";
      }
    }
    return { ...o, deliveryStatus: currentDeliveryStatus };
  });
  const filteredDeliveries = deliveriesWithStatus.filter((d) => {
    const matchesSearch = String(d.id || d._id || d.orderNumber).toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || d.driverName && d.driverName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || d.restaurantName.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesPartner = partnerFilter === "all" || d.deliveryPartner === partnerFilter;
    const matchesStatus = statusFilter === "all" || d.deliveryStatus === statusFilter;
    return matchesSearch && matchesPartner && matchesStatus;
  });
  const currentOrderId = selectedOrderId || (filteredDeliveries.length > 0 ? (filteredDeliveries[0].id || filteredDeliveries[0]._id || filteredDeliveries[0].orderNumber) : null);
  const selectedDelivery = deliveriesWithStatus.find((d) => (d.id || d._id || d.orderNumber) === currentOrderId);
  const handleTransitionStatus = (orderId, nextDeliveryStatus) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id === orderId || o._id === orderId || o.orderNumber === orderId) {
        let nextMainStatus = o.status;
        if (nextDeliveryStatus === "Out For Delivery") {
          nextMainStatus = "out_for_delivery";
        } else if (nextDeliveryStatus === "Delivered") {
          nextMainStatus = "delivered";
        } else {
          nextMainStatus = "dispatched";
        }
        let nextCoords = { ...o.driverCoords };
        if (nextDeliveryStatus === "Picked Up") {
          nextCoords = { x: 35, y: 45 };
        } else if (nextDeliveryStatus === "Out For Delivery") {
          nextCoords = { x: 55, y: 65 };
        } else if (nextDeliveryStatus === "Delivered") {
          nextCoords = { x: 80, y: 85 };
        }
        return {
          ...o,
          status: nextMainStatus,
          deliveryStatus: nextDeliveryStatus,
          driverCoords: nextCoords
        };
      }
      return o;
    }));
    triggerToast(`Delivery Status updated to ${nextDeliveryStatus.toUpperCase()} for Order #${orderId.slice(-5)}`);
  };
  const timelineSteps = [
    { key: "Assigned", label: "Assigned", desc: "Rider confirmed & securing container", color: "text-sky-500 bg-sky-50 border-sky-200" },
    { key: "Picked Up", label: "Picked Up", desc: "Fresh meal loaded from kitchen", color: "text-amber-500 bg-amber-50 border-amber-200" },
    { key: "Out For Delivery", label: "Out For Delivery", desc: "Rider en-route to destination", color: "text-indigo-500 bg-indigo-50 border-indigo-200" },
    { key: "Delivered", label: "Delivered", desc: "Food safely handed to customer", color: "text-emerald-500 bg-emerald-50 border-emerald-200" }
  ];
  return <div className="space-y-6 animate-fade-in" id="delivery-management-pane">
      {
    /* Overview stats bar */
  }
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
    { label: "Assigned Deliveries", count: deliveriesWithStatus.filter((d) => d.deliveryStatus === "Assigned").length, color: "border-sky-100 bg-sky-50/50 text-sky-700" },
    { label: "Meals Picked Up", count: deliveriesWithStatus.filter((d) => d.deliveryStatus === "Picked Up").length, color: "border-amber-100 bg-amber-50/50 text-amber-700" },
    { label: "Out For Delivery", count: deliveriesWithStatus.filter((d) => d.deliveryStatus === "Out For Delivery").length, color: "border-indigo-100 bg-indigo-50/50 text-indigo-700" },
    { label: "Successfully Delivered", count: deliveriesWithStatus.filter((d) => d.deliveryStatus === "Delivered").length, color: "border-emerald-100 bg-emerald-50/50 text-emerald-700" }
  ].map((stat, idx) => <div key={idx} className={`p-4 rounded-2xl border-2 shadow-xs flex flex-col justify-between ${stat.color}`}>
            <span className="text-[10px] font-black uppercase tracking-wider opacity-75">{stat.label}</span>
            <span className="text-2xl font-black mt-2 font-mono">{stat.count}</span>
          </div>)}
      </div>

      {
    /* Main workspace splits */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {
    /* Left Column: List with Filters */
  }
        <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-150 p-6 space-y-4 flex flex-col">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 flex items-center gap-1.5">
                <Truck className="h-4.5 w-4.5 text-orange-700" />
                <span>Active Delivery Log</span>
              </h3>
              <p className="text-[10px] font-bold text-neutral-400">Monitor and track third-party dispatch statuses.</p>
            </div>
            <span className="font-mono text-xs font-black bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-lg">
              {filteredDeliveries.length} entries
            </span>
          </div>

          {
    /* Search bar */
  }
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
    type="text"
    placeholder="Search driver, restaurant, or order ID..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:border-neutral-900 focus:bg-white transition"
  />
          </div>

          {
    /* Quick Filters */
  }
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black uppercase text-neutral-400 block mb-1">Partner Filter</label>
              <select
    value={partnerFilter}
    onChange={(e) => setPartnerFilter(e.target.value)}
    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold text-neutral-700 outline-none"
  >
                <option value="all">All Partners</option>
                <option value="Ola">Ola Fleet</option>
                <option value="Uber">Uber Fleet</option>
                <option value="Rapido">Rapido Fleet</option>
                <option value="Porter">Porter Fleet</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-neutral-400 block mb-1">Status Filter</label>
              <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold text-neutral-700 outline-none"
  >
                <option value="all">All Statuses</option>
                <option value="Assigned">Assigned</option>
                <option value="Picked Up">Picked Up</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          {
    /* Deliveries List */
  }
          <div className="space-y-2.5 overflow-y-auto max-h-[450px] pr-1 flex-1">
            {filteredDeliveries.length === 0 ? <div className="text-center py-10 text-neutral-400 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-xs font-bold">No active deliveries match filters.</p>
                <p className="text-[10px] uppercase">Ready to dispatch new ones from the Orders tab!</p>
              </div> : filteredDeliveries.map((item) => {
    const itemId = item.id || item._id || item.orderNumber;
    const isSelected = itemId === currentOrderId;
    let statusBadge = "bg-neutral-100 text-neutral-600";
    if (item.deliveryStatus === "Assigned") statusBadge = "bg-sky-50 text-sky-700 border-sky-100";
    if (item.deliveryStatus === "Picked Up") statusBadge = "bg-amber-50 text-amber-700 border-amber-100";
    if (item.deliveryStatus === "Out For Delivery") statusBadge = "bg-indigo-50 text-indigo-700 border-indigo-100";
    if (item.deliveryStatus === "Delivered") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
    return <button
      key={itemId}
      onClick={() => {
        setSelectedOrderId(itemId);
      }}
      className={`w-full text-left p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${isSelected ? "bg-brand-dark border-neutral-950 text-white shadow-md" : "bg-neutral-50 hover:bg-neutral-100 border-neutral-100 text-neutral-800"}`}
    >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${isSelected ? "bg-white/10 text-white border-white/20" : statusBadge}`}>
                          {item.deliveryStatus}
                        </span>
                        <span className={`text-[9px] font-black uppercase ${isSelected ? "text-sky-300" : "text-neutral-500"}`}>
                          {item.deliveryPartner || "Third Party"}
                        </span>
                      </div>
                      <p className="font-black text-xs truncate">Order #{String(itemId).slice(-6).toUpperCase()}</p>
                      <p className={`text-[10px] font-bold truncate ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                        {item.restaurantName} • {item.driverName || "No Rider"}
                      </p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-neutral-400"}`} />
                  </button>;
  })}
          </div>
        </div>

        {
    /* Right Column: Timeline UI & Detail Dashboard */
  }
        <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-150 p-6 flex flex-col justify-between space-y-6">
          {selectedDelivery ? <div className="space-y-6 flex-1 flex flex-col justify-between">
              {
    /* Delivery info header */
  }
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-brand-dark text-white px-2.5 py-1 rounded-md">
                      {selectedDelivery.deliveryPartner || "Standard"} Integration
                    </span>
                    <span className="font-mono text-xs font-black text-neutral-400">#{selectedDelivery.id || selectedDelivery._id || selectedDelivery.orderNumber}</span>
                  </div>
                  <h3 className="text-base font-black uppercase mt-1 text-neutral-900">
                    Route: {selectedDelivery.restaurantName} → Client Destination
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                    Live Telemetry active
                  </span>
                </div>
              </div>

              {
    /* Rider card */
  }
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-neutral-400">RIDER DETAILS</span>
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-neutral-200 flex items-center justify-center text-sm">👤</div>
                    <div>
                      <p className="font-black text-xs text-neutral-900">{selectedDelivery.driverName || "Not Assigned"}</p>
                      <p className="text-[10px] text-neutral-500 font-semibold">{selectedDelivery.vehicleDetails || "No vehicle data"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-neutral-400">CONTACT INFO</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
    href={`tel:${selectedDelivery.driverPhone || ""}`}
    className="inline-flex items-center gap-1.5 text-xs font-black text-neutral-900 hover:text-orange-700 transition"
  >
                      <Phone className="h-3.5 w-3.5 text-orange-700" />
                      <span>{selectedDelivery.driverPhone || "No Phone"}</span>
                    </a>
                  </div>
                  {selectedDelivery.deliveryRemarks && <p className="text-[9px] text-orange-700 font-bold leading-normal italic">
                      "Remarks: {selectedDelivery.deliveryRemarks}"
                    </p>}
                </div>
              </div>

              {
    /* TIMELINE UI */
  }
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Delivery Lifecycle Timeline
                </span>
                
                <div className="relative pl-6 space-y-6">
                  {
    /* Timeline connecting bar */
  }
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-neutral-100" />

                  {timelineSteps.map((step, idx) => {
    const currentStatusIdx = timelineSteps.findIndex((s) => s.key === selectedDelivery.deliveryStatus);
    const isCompleted = idx < currentStatusIdx;
    const isActive = idx === currentStatusIdx;
    const isFuture = idx > currentStatusIdx;
    return <div key={step.key} className="relative flex items-start gap-4">
                        {
      /* Status bullet node */
    }
                        <div className={`absolute -left-[21px] h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : isActive ? "bg-white border-neutral-950 text-neutral-950 ring-4 ring-neutral-950/10" : "bg-white border-neutral-200 text-neutral-300"}`}>
                          {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" /> : <span className="text-[8px] font-black">{idx + 1}</span>}
                        </div>

                        {
      /* Text and meta */
    }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-black uppercase tracking-wide ${isActive ? "text-neutral-950" : isCompleted ? "text-neutral-600" : "text-neutral-400"}`}>
                              {step.label}
                            </h4>
                            {isActive && <span className="text-[8px] font-black bg-brand-orange text-white px-1.5 py-0.2 rounded-md uppercase tracking-wider animate-pulse">
                                Current
                              </span>}
                          </div>
                          <p className={`text-[10px] font-semibold ${isActive ? "text-neutral-600" : "text-neutral-400"}`}>
                            {step.desc}
                          </p>
                        </div>

                        {
      /* Simulated status time */
    }
                        <span className="text-[9px] font-mono font-bold text-neutral-400">
                          {isCompleted ? "Done" : isActive ? "Active" : "Pending"}
                        </span>
                      </div>;
  })}
                </div>
              </div>

              {
    /* Interactive state transition controls */
  }
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Transition Courier Status
                </span>

                <div className="flex flex-wrap gap-2">
                  <button
    disabled={selectedDelivery.deliveryStatus === "Picked Up" || selectedDelivery.deliveryStatus === "Out For Delivery" || selectedDelivery.deliveryStatus === "Delivered"}
    onClick={() => handleTransitionStatus(selectedDelivery.id, "Picked Up")}
    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center ${selectedDelivery.deliveryStatus === "Assigned" ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm" : "bg-white border border-neutral-200 text-neutral-400 cursor-not-allowed"}`}
  >
                    📦 Confirm Pick Up
                  </button>

                  <button
    disabled={selectedDelivery.deliveryStatus !== "Picked Up"}
    onClick={() => handleTransitionStatus(selectedDelivery.id, "Out For Delivery")}
    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center ${selectedDelivery.deliveryStatus === "Picked Up" ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" : "bg-white border border-neutral-200 text-neutral-400 cursor-not-allowed"}`}
  >
                    🛵 Out For Delivery
                  </button>

                  <button
    disabled={selectedDelivery.deliveryStatus !== "Out For Delivery"}
    onClick={() => handleTransitionStatus(selectedDelivery.id, "Delivered")}
    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center ${selectedDelivery.deliveryStatus === "Out For Delivery" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : "bg-white border border-neutral-200 text-neutral-400 cursor-not-allowed"}`}
  >
                    🏁 Mark Delivered
                  </button>
                </div>
              </div>

              {
    /* Map visualizer */
  }
              <div className="h-32 bg-brand-dark rounded-2xl relative overflow-hidden border-2 border-neutral-950 shadow-inner flex items-center justify-center">
                {
    /* Simulated Grid Map Background */
  }
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                
                {
    /* Simulated path */
  }
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
    d="M 50 80 Q 150 40 250 70 T 350 30"
    fill="none"
    stroke="#e11d48"
    strokeWidth="3"
    strokeDasharray="4 4"
    className="animate-[dash_20s_linear_infinite]"
  />
                </svg>

                {
    /* Simulated markers */
  }
                <div className="absolute left-[40px] bottom-[20px] bg-neutral-900 border border-neutral-800 p-1 rounded text-white flex items-center gap-1 text-[8px] font-bold z-10">
                  <span>🏪 Kitchen</span>
                </div>

                <div className="absolute right-[40px] top-[15px] bg-neutral-900 border border-neutral-800 p-1 rounded text-white flex items-center gap-1 text-[8px] font-bold z-10">
                  <span>🏠 Customer</span>
                </div>

                {
    /* Animated Rider Position */
  }
                {selectedDelivery.deliveryStatus !== "Delivered" && <motion.div
    animate={{
      x: selectedDelivery.deliveryStatus === "Assigned" ? -100 : selectedDelivery.deliveryStatus === "Picked Up" ? -50 : 50,
      y: selectedDelivery.deliveryStatus === "Assigned" ? 20 : selectedDelivery.deliveryStatus === "Picked Up" ? 10 : -10
    }}
    transition={{ type: "spring", stiffness: 50 }}
    className="absolute bg-brand-orange text-white p-1 rounded-full shadow-lg border border-white flex items-center justify-center z-20"
  >
                    <Truck className="h-4.5 w-4.5 animate-bounce" />
                  </motion.div>}

                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                  <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                    <Map className="h-3.5 w-3.5 text-sky-400" />
                    <span>Route Coordinates: ({selectedDelivery.driverCoords?.x || 50}%, {selectedDelivery.driverCoords?.y || 50}%)</span>
                  </p>
                </div>
              </div>
            </div> : <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-400 space-y-3">
              <Truck className="h-12 w-12 text-neutral-300 stroke-1" />
              <h4 className="font-black text-sm uppercase text-neutral-950">No Delivery Selected</h4>
              <p className="text-xs font-bold text-neutral-400 text-center max-w-sm">
                Select an active dispatched order from the registry on the left to review its transit lifecycle and telemetry.
              </p>
            </div>}
        </div>

      </div>
    </div>;
}
