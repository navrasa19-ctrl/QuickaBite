// src/components/admin/AdminSupportManagementTab.jsx
import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Image as ImageIcon,
  Check,
  X,
  Award,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  getAllIssuesForAdmin,
  adminOverrideTicket,
  getUserLoyaltyScore,
} from "../../services/supportIssue.service";

export default function AdminSupportManagementTab() {
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [userLoyalty, setUserLoyalty] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // Admin Override Form
  const [overrideAction, setOverrideAction] = useState("ACCEPTED");
  const [refundStatus, setRefundStatus] = useState("FULL");
  const [refundAmount, setRefundAmount] = useState("");
  const [adminRemark, setAdminRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, categoryFilter]);

  const fetchIssues = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllIssuesForAdmin(
        statusFilter === "ALL" ? "" : statusFilter,
        categoryFilter === "ALL" ? "" : categoryFilter
      );
      setIssues(data || []);
    } catch (err) {
      setError(err.message || "Failed to load global support tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleInspectIssue = async (issue) => {
    setSelectedIssue(issue);
    setOverrideAction(issue.status === "ACCEPTED" ? "REJECTED" : "ACCEPTED");
    setRefundStatus("FULL");
    setRefundAmount(issue.order?.totalAmount ? String(issue.order.totalAmount) : "0");
    setAdminRemark("");
    setSuccessMessage("");
    setError("");

    if (issue.user?._id) {
      setLoyaltyLoading(true);
      try {
        const loyaltyData = await getUserLoyaltyScore(issue.user._id);
        setUserLoyalty(loyaltyData);
      } catch (err) {
        console.error("Error fetching user loyalty score:", err);
      } finally {
        setLoyaltyLoading(false);
      }
    }
  };

  const handleAdminOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (!adminRemark.trim()) {
      setError("Please provide an admin remark explaining this override decision.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await adminOverrideTicket(selectedIssue._id, {
        status: overrideAction,
        refundStatus: overrideAction === "ACCEPTED" ? refundStatus : "NONE",
        refundAmount: overrideAction === "ACCEPTED" ? Number(refundAmount) || 0 : 0,
        adminRemark,
      });

      setSuccessMessage(
        `Admin override executed! Ticket #${selectedIssue.ticketNumber} status changed to ${overrideAction}. User notified.`
      );
      setTimeout(() => {
        setSelectedIssue(null);
        fetchIssues();
      }, 1800);
    } catch (err) {
      setError(err.message || "Failed to execute admin override");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "ACCEPTED") {
      return (
        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-full inline-flex items-center gap-1.5 uppercase tracking-wider">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ACCEPTED
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-full inline-flex items-center gap-1.5 uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> REJECTED
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black rounded-full inline-flex items-center gap-1.5 uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6 text-neutral-900 font-sans">
      {/* Header Banner */}
      <div className="bg-neutral-950 border border-neutral-800 p-6 sm:p-8 rounded-3xl text-white space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-black text-white flex items-center gap-2.5 tracking-tight">
              <Award className="w-7 h-7 text-orange-700" />
              Global Support Tickets & User Loyalty Audit
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Review all branch support tickets, audit customer order vs claim reliability metrics, and execute administrative overrides when necessary.
            </p>
          </div>
          <button
            onClick={fetchIssues}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-2xl text-xs font-bold text-neutral-300 hover:text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-orange-700" />
            Refresh Data
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-orange-700" /> Filter By:
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {["ALL", "PENDING", "ACCEPTED", "REJECTED"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  statusFilter === f
                    ? "bg-brand-orange text-white shadow-sm"
                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-orange cursor-pointer ml-auto"
          >
            <option value="ALL">All Categories</option>
            <option value="BILLING_PAYMENT">Billing & Payment</option>
            <option value="FOOD_QUALITY">Food Quality & Packaging</option>
            <option value="MISSING_WRONG_ITEM">Missing / Wrong Items</option>
            <option value="DELIVERY_DELAY">Delivery Delay</option>
          </select>
        </div>
      </div>

      {/* Tickets List Table */}
      {loading ? (
        <div className="p-12 text-center text-neutral-500 text-xs bg-white border border-neutral-200 rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-700 mb-2" />
          Loading global support tickets...
        </div>
      ) : issues.length === 0 ? (
        <div className="p-12 bg-white border border-neutral-200 rounded-3xl text-center space-y-2">
          <div className="text-3xl">🎫</div>
          <p className="text-sm font-bold text-neutral-800">No support tickets found</p>
          <p className="text-xs text-neutral-500">There are no tickets matching your active filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-800">
              <thead className="bg-neutral-950 text-white uppercase tracking-wider text-[11px] font-black border-b border-neutral-800">
                <tr>
                  <th className="p-4 sm:px-6">Ticket / Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Category & Problem</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 sm:px-6">
                      <span className="font-mono font-black text-orange-700 text-xs block">
                        #{issue.ticketNumber}
                      </span>
                      <span className="text-neutral-500 font-mono text-[11px]">
                        Order #{issue.order?.orderNumber || issue.order?.id || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-neutral-900 block">{issue.user?.fullName || "Guest User"}</span>
                      <span className="text-neutral-500 text-[11px]">{issue.user?.email || "No email"}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-neutral-800">{issue.restaurant?.name || "Global Eats Branch"}</span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <span className="font-bold text-neutral-900 block truncate">{issue.selectedQuestion}</span>
                      <span className="text-neutral-500 text-[11px] font-semibold">{issue.issueCategory}</span>
                    </td>
                    <td className="p-4">{getStatusBadge(issue.status)}</td>
                    <td className="p-4 sm:px-6 text-right">
                      <button
                        onClick={() => handleInspectIssue(issue)}
                        className="px-3.5 py-2 bg-orange-50 hover:bg-brand-orange text-brand-orange hover:text-white border border-orange-200 rounded-xl font-black text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Audit & Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN AUDIT & OVERRIDE MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl my-auto animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-800 bg-neutral-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-700" />
                  Admin Audit: Ticket #{selectedIssue.ticketNumber}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-medium">
                  Order #{selectedIssue.order?.orderNumber || selectedIssue.order?.id} • Branch: {selectedIssue.restaurant?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-neutral-900 bg-white">
              {/* User Loyalty & History Audit Card */}
              <div className="p-5 bg-orange-50/50 border border-orange-200/80 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-3">
                  <h4 className="text-xs font-black text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Customer Loyalty & Trust Score Audit
                  </h4>

                  {userLoyalty?.trustBadge && (
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                        userLoyalty.trustColor === "emerald" || userLoyalty.trustBadge === "LOW_RISK" || userLoyalty.trustBadge === "VERY_LOW_RISK"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : userLoyalty.trustColor === "amber" || userLoyalty.trustBadge === "MODERATE_RISK"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        🛡️ {userLoyalty.trustBadge.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>

                {userLoyalty?.trustDescription && (
                  <p className="text-[11px] text-neutral-600 font-semibold italic bg-white p-2.5 rounded-xl border border-neutral-200">
                    "{userLoyalty.trustDescription}"
                  </p>
                )}

                {loyaltyLoading ? (
                  <div className="text-xs text-neutral-500 py-2">Calculating user loyalty score...</div>
                ) : userLoyalty ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs">
                        <span className="text-neutral-500 block text-[9px] font-bold uppercase">Total Orders</span>
                        <span className="text-base font-black text-neutral-900">{userLoyalty.totalOrders ?? userLoyalty.deliveredOrders ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs">
                        <span className="text-neutral-500 block text-[9px] font-bold uppercase">Delivered</span>
                        <span className="text-base font-black text-emerald-600">{userLoyalty.deliveredOrders ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs">
                        <span className="text-neutral-500 block text-[9px] font-bold uppercase">Reported Issues</span>
                        <span className="text-base font-black text-amber-600">{userLoyalty.totalIssuesCount ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs">
                        <span className="text-neutral-500 block text-[9px] font-bold uppercase">Issue Ratio</span>
                        <span className={`text-base font-black ${(userLoyalty.issueRatioPercent ?? 0) > 20 ? "text-rose-600" : "text-emerald-600"}`}>
                          {userLoyalty.issueRatioPercent ?? 0}%
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs col-span-2 sm:col-span-1">
                        <span className="text-neutral-500 block text-[9px] font-bold uppercase">Refund Claims</span>
                        <span className="text-base font-black text-emerald-700">₹{userLoyalty.totalRefundAmountClaimed ?? 0} ({userLoyalty.acceptedRefundsCount ?? 0})</span>
                      </div>
                    </div>

                    {/* Past Reported User Issues */}
                    {Array.isArray(userLoyalty.issues) && userLoyalty.issues.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-orange-200/50">
                        <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block">
                          User Past Issue Logs ({userLoyalty.issues.length})
                        </span>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {userLoyalty.issues.map((iss) => (
                            <div key={iss._id} className="p-2.5 bg-white border border-neutral-200 rounded-xl text-xs flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-orange-700 text-[10px]">#{iss.ticketNumber}</span>
                                  <span className="font-bold text-neutral-900 text-[11px]">{iss.selectedQuestion}</span>
                                </div>
                                <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
                                  Branch: {iss.restaurant?.name || "Kitchen"} • Order #{iss.order?.orderNumber || "N/A"}
                                </span>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                iss.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : iss.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                              }`}>
                                {iss.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Reported Issue Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Reported Issue Information</h4>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs space-y-2">
                  <p className="font-extrabold text-neutral-900 text-sm">{selectedIssue.selectedQuestion}</p>
                  {selectedIssue.description && (
                    <p className="text-neutral-700 italic font-medium">"{selectedIssue.description}"</p>
                  )}
                </div>

                {selectedIssue.images && selectedIssue.images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-neutral-700">Photo Proof Attachments:</p>
                    <div className="flex flex-wrap gap-3">
                      {selectedIssue.images.map((img, idx) => (
                        <a
                          key={idx}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-24 h-24 rounded-2xl overflow-hidden border border-neutral-200 hover:border-brand-orange transition-all shadow-xs"
                        >
                          <img src={img.url} alt="Proof" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Resolution Status */}
              {selectedIssue.resolution?.actionByRole && (
                <div className="p-4 bg-neutral-100 border border-neutral-200 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-neutral-900 block">Current Manager Decision: {selectedIssue.status}</span>
                  <p className="text-neutral-600 italic">"{selectedIssue.resolution?.managerRemark}"</p>
                </div>
              )}

              {/* ADMIN OVERRIDE FORM */}
              <form onSubmit={handleAdminOverrideSubmit} className="p-6 bg-orange-50/40 border border-orange-200/90 rounded-3xl text-neutral-900 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-orange-200/60 pb-3">
                  <h4 className="text-xs font-display font-black text-orange-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-orange-700" /> Admin Executive Override Decision
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-white px-2.5 py-1 rounded-full border border-neutral-200">
                    High Authority Action
                  </span>
                </div>

                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Decision Toggle Buttons */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-neutral-700 uppercase tracking-wider">
                    Select Override Resolution
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOverrideAction("ACCEPTED")}
                      className={`py-3 px-4 rounded-2xl font-black text-xs border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        overrideAction === "ACCEPTED"
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.01]"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                    >
                      <Check className="w-4 h-4" /> OVERRIDE TO ACCEPTED
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverrideAction("REJECTED")}
                      className={`py-3 px-4 rounded-2xl font-black text-xs border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        overrideAction === "REJECTED"
                          ? "bg-rose-600 text-white border-rose-700 shadow-md scale-[1.01]"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-rose-300 hover:text-rose-700"
                      }`}
                    >
                      <X className="w-4 h-4" /> OVERRIDE TO REJECTED
                    </button>
                  </div>
                </div>

                {/* Refund Options */}
                {overrideAction === "ACCEPTED" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-2xl border border-orange-200/80 shadow-xs animate-fade-in">
                    <div>
                      <label className="block text-neutral-700 mb-1.5 font-bold">Refund Plan</label>
                      <select
                        value={refundStatus}
                        onChange={(e) => setRefundStatus(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
                      >
                        <option value="FULL">FULL REFUND (₹{selectedIssue.order?.totalAmount || selectedIssue.order?.total || 0})</option>
                        <option value="PARTIAL">PARTIAL REFUND AMOUNT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-700 mb-1.5 font-bold">Refund Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-neutral-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-mono font-black focus:outline-none focus:ring-2 focus:ring-brand-orange"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Remarks */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Official Admin Remark <span className="text-neutral-400 font-medium">(Visible in customer audit logs)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                    placeholder="Provide detailed administrative rationale for overriding the branch manager's decision..."
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl text-xs text-neutral-900 placeholder-neutral-400 font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange shadow-xs leading-relaxed"
                  />
                </div>

                {/* Submit Controls */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-orange-200/60">
                  <button
                    type="button"
                    onClick={() => setSelectedIssue(null)}
                    className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-2xl text-xs transition shadow-md disabled:opacity-50 cursor-pointer uppercase tracking-wider flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing Override...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm Admin Override</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
