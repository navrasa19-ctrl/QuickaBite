import { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../common/Modal";
import { Plus, Trash2, Search, Star, Loader2 } from "lucide-react";
import { adminService } from "../../api/adminService";
import { parseApiError } from "../../api/apiClient";

export default function DriversTab({ onDriversChange, triggerToast }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("Honda Activa 6G (EV/Bike)");
  const [licensePlate, setLicensePlate] = useState("");

  const fetchDriversList = async () => {
    setLoading(true);
    try {
      const list = await adminService.getDrivers();
      setDrivers(list);
      if (onDriversChange) {
        onDriversChange(list.length);
      }
    } catch (e) {
      console.error("Failed to load riders fleet:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriversList();
  }, [onDriversChange]);

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!fullName || !phone) {
      triggerToast("Please fill out all required fields.", "error");
      return;
    }
    if (cleanPhone.length !== 10) {
      triggerToast("Phone number must be exactly 10 digits without country code or spaces.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminService.onboardCourier({
        fullName,
        phone: cleanPhone,
        vehicleType,
        licensePlate,
      });

      if (res && res.success !== false) {
        triggerToast(`Courier partner "${fullName}" onboarded successfully!`);
        setFullName("");
        setPhone("");
        setVehicleType("Honda Activa 6G (EV/Bike)");
        setLicensePlate("");
        setShowAddModal(false);
        fetchDriversList();
      } else {
        const msg = parseApiError(res, "Failed to onboard courier.");
        triggerToast(msg, "error");
      }
    } catch (err) {
      const msg = parseApiError(err, "Failed to onboard courier.");
      triggerToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    const uppercaseStatus = nextStatus.toUpperCase();
    // Optimistic UI update
    setDrivers((prev) =>
      prev.map((d) => (d._id === id || d.id === id ? { ...d, status: uppercaseStatus } : d))
    );
    try {
      await adminService.updateRiderStatus(id, uppercaseStatus);
      triggerToast(`Rider status updated to "${uppercaseStatus}"`);
    } catch (err) {
      const msg = parseApiError(err, "Failed to update rider status.");
      triggerToast(msg, "error");
      fetchDriversList();
    }
  };

  const handleDeleteDriver = async (id) => {
    const target = drivers.find((d) => d._id === id || d.id === id);
    const targetName = target?.fullName || target?.name || "Courier";
    // Optimistic UI update
    setDrivers((prev) => prev.filter((d) => d._id !== id && d.id !== id));
    try {
      await adminService.deleteRider(id);
      triggerToast(`Courier "${targetName}" removed from fleet directory.`);
      if (onDriversChange) {
        onDriversChange(drivers.length - 1);
      }
    } catch (err) {
      const msg = parseApiError(err, "Failed to remove rider.");
      triggerToast(msg, "error");
      fetchDriversList();
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const dName = d.fullName || d.name || "";
    const dVehicle = d.vehicleType || d.vehicle || "";
    const searchLower = debouncedSearch.toLowerCase();
    return (
      dName.toLowerCase().includes(searchLower) ||
      dVehicle.toLowerCase().includes(searchLower) ||
      (d.licensePlate && d.licensePlate.toLowerCase().includes(searchLower)) ||
      (d.phone && d.phone.includes(searchLower))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in" id="drivers-tab-viewport">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
            Delivery Fleet (Rider Directory)
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold">
            Manage delivery couriers, track active availability statuses (IDLE, DELIVERING, OFFLINE), and onboard new riders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2 flex items-center gap-2 max-w-xs shrink-0">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search courier, phone, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-900 outline-none w-48"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-brand-orange hover:bg-orange-700 text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Courier</span>
          </button>
        </div>
      </div>

      {/* DRIVERS CARDS GRID */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-dashed border-neutral-200 rounded-3xl space-y-3">
          <Loader2 className="h-8 w-8 text-orange-700 animate-spin mx-auto" />
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Loading Fleet Directory...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-neutral-200 rounded-3xl space-y-2">
          <p className="text-xs font-bold text-neutral-500 uppercase">No riders found in fleet directory</p>
          <p className="text-[10px] text-neutral-400">Click "Onboard Courier" above to register a new rider.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {filteredDrivers.map((d) => {
            const currentStatus = (d.status || "OFFLINE").toUpperCase();
            let statusClass = "bg-neutral-100 text-neutral-500 border-neutral-200";
            let statusLabel = "OFFLINE";
            if (currentStatus === "IDLE") {
              statusClass = "bg-emerald-50 text-emerald-600 border-emerald-200";
              statusLabel = "IDLE (Available)";
            } else if (currentStatus === "DELIVERING") {
              statusClass = "bg-sky-50 text-sky-600 border-sky-200";
              statusLabel = "DELIVERING";
            }
            const ratingVal = typeof d.rating === "number" ? d.rating : 5.0;

            return (
              <div
                key={d._id || d.id}
                className="bg-white border border-neutral-150 rounded-3xl p-5 shadow-xs flex flex-col justify-between relative hover:border-neutral-300 transition"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <span
                      className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                    <div className="flex items-center gap-0.5 font-bold text-amber-500 font-mono text-[10px]">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span>{ratingVal.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-black text-neutral-900 text-sm leading-tight">
                      {d.fullName || d.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-neutral-400 mt-0.5 font-mono">
                      {d.phone}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-[10px] font-semibold text-neutral-500">
                    <div className="flex justify-between">
                      <span>Vehicle:</span>
                      <span className="text-neutral-800 font-bold truncate max-w-[130px]">
                        {d.vehicleType || d.vehicle}
                      </span>
                    </div>
                    {d.licensePlate && (
                      <div className="flex justify-between">
                        <span>Plate:</span>
                        <span className="text-neutral-800 font-bold font-mono">
                          {d.licensePlate}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total deliveries:</span>
                      <span className="text-neutral-800 font-bold font-mono">
                        {d.totalDeliveries || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-between gap-2">
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(d._id || d.id, e.target.value)}
                    className="flex-1 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer outline-none focus:border-brand-orange border border-neutral-150 px-2 text-center"
                  >
                    <option value="IDLE">IDLE</option>
                    <option value="DELIVERING">DELIVERING</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                  <button
                    onClick={() => handleDeleteDriver(d._id || d.id)}
                    className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition cursor-pointer"
                    title="Remove Courier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 mb-1">
          Onboard Courier (Add New Rider)
        </h3>
        <p className="text-[10px] font-semibold text-neutral-400 mb-4">
          Register a new courier driver into the rider database. Phone number must be exactly 10 digits.
        </p>

        <form onSubmit={handleCreateDriver} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Courier Full Name (fullName) *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Amit Patel"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Mobile Phone (10 digits) *
            </label>
            <input
              type="tel"
              required
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="9988776655"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-mono font-semibold outline-none focus:border-brand-orange"
            />
            <p className="text-[9px] text-neutral-400">Exact 10 digits without +91 or spaces.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Vehicle Type & Model (vehicleType)
            </label>
            <input
              type="text"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              placeholder="Honda Activa 6G (EV/Bike)"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              License Plate Number (licensePlate)
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="MH 02 CD 4567"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Onboard Courier</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

