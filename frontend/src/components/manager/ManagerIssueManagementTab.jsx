// src/components/manager/ManagerIssueManagementTab.jsx
import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Image as ImageIcon,
  Check,
  X,
  FileText,
} from "lucide-react";
import {
  getRestaurantIssues,
  resolveIssueTicket,
  getUserLoyaltyScore,
} from "../../services/supportIssue.service";

export default function ManagerIssueManagementTab({ restaurantId }) {
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [userLoyalty, setUserLoyalty] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  // Resolution Form state
  const [resolutionAction, setResolutionAction] = useState("ACCEPTED"); // "ACCEPTED" | "REJECTED"
  const [refundStatus, setRefundStatus] = useState("FULL"); // "FULL" | "PARTIAL"
  const [refundAmount, setRefundAmount] = useState("");
  const [managerRemark, setManagerRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchIssues();
  }, [restaurantId]);

  const fetchIssues = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all tickets for the restaurant so all status counts (PENDING, ACCEPTED, REJECTED, ALL) are complete & accurate
      const data = await getRestaurantIssues(restaurantId, "");
      setIssues(data || []);
    } catch (err) {
      setError(err.message || "Failed to load restaurant support tickets");
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter === "ALL") return true;
    return issue.status === statusFilter;
  });

  const handleInspectIssue = async (issue) => {
    setSelectedIssue(issue);
    setResolutionAction("ACCEPTED");
    setRefundStatus("FULL");
    setRefundAmount(issue.order?.totalAmount ? String(issue.order.totalAmount) : "0");
    setManagerRemark("");
    setSuccessMessage("");
    setError("");

    // Fetch user trust & loyalty rating score
    if (issue.user?._id) {
      setLoyaltyLoading(true);
      try {
        const loyaltyData = await getUserLoyaltyScore(issue.user._id);
        setUserLoyalty(loyaltyData);
      } catch (err) {
        console.error("Error fetching user loyalty:", err);
      } finally {
        setLoyaltyLoading(false);
      }
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (resolutionAction === "REJECTED" && !managerRemark.trim()) {
      setError("Please provide a rejection remark to explain to the customer.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await resolveIssueTicket(selectedIssue._id, {
        status: resolutionAction,
        refundStatus: resolutionAction === "ACCEPTED" ? refundStatus : "NONE",
        refundAmount: resolutionAction === "ACCEPTED" ? Number(refundAmount) || 0 : 0,
        managerRemark,
      });

      setSuccessMessage(
        `Issue ticket #${selectedIssue.ticketNumber} successfully marked as ${resolutionAction}. Customer notified!`
      );
      setTimeout(() => {
        setSelectedIssue(null);
        fetchIssues();
      }, 1800);
    } catch (err) {
      setError(err.message || "Failed to resolve ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const getBadge = (status) => {
    if (status === "ACCEPTED") {
      return (
        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> ACCEPTED
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> REJECTED
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING
      </span>
    );
  };

  const getTrustBadgeComponent = (loyalty) => {
    if (!loyalty) return null;
    if (loyalty.trustBadge === "HIGH_RISK_SUSPICIOUS") {
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <span className="font-black block">FLAGGED USER (High Issue Claim Rate: {loyalty.issueRatioPercent}%)</span>
            <span className="text-[11px] opacity-90 font-medium">{loyalty.trustDescription} • Claims: {loyalty.totalIssuesCount} / Delivered: {loyalty.deliveredOrders}</span>
          </div>
        </div>
      );
    }
    if (loyalty.trustBadge === "MODERATE_RISK") {
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <span className="font-black block">MODERATE RISK USER ({loyalty.issueRatioPercent}% Issue Rate)</span>
            <span className="text-[11px] opacity-90 font-medium">{loyalty.trustDescription} • Total Claims: {loyalty.totalIssuesCount}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
        <div>
          <span className="font-black block">LOYAL CUSTOMER ({loyalty.issueRatioPercent}% Issue Rate)</span>
          <span className="text-[11px] opacity-90 font-medium">{loyalty.trustDescription} • Delivered Orders: {loyalty.deliveredOrders}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-neutral-900 font-sans animate-fade-in">
      {/* Top Header & Filter Chips */}
      <div className="bg-white border border-neutral-200 p-6 md:p-8 rounded-3xl shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-brand-orange to-orange-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-orange-500/20 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-black text-neutral-900 flex items-center gap-2">
              <span>Branch Order Issues & Support Tickets</span>
              <span className="text-xs font-black bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                {issues.length} Tickets
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-medium leading-relaxed">
              Inspect customer photo proofs, review reliability scores, and resolve refund requests instantly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-neutral-100/70 p-1.5 rounded-2xl border border-neutral-200">
          {["PENDING", "ACCEPTED", "REJECTED", "ALL"].map((f) => {
            const count = f === "ALL" ? issues.length : issues.filter((i) => i.status === f).length;
            const isActive = statusFilter === f;
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-md"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white/80"
                }`}
              >
                <span>{f}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${isActive ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues List Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-neutral-200 text-center space-y-3 shadow-2xs">
          <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full mx-auto" />
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Loading branch support tickets...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-neutral-200 text-center text-neutral-500 text-xs shadow-2xs space-y-2">
          <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-black text-neutral-800">No Support Tickets Found</p>
          <p className="text-xs text-neutral-500 font-medium">
            No claims matched the filter: <span className="text-orange-700 font-bold uppercase">{statusFilter}</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIssues.map((issue) => {
            const userName = issue.user?.fullName || "Guest Customer";
            const initial = userName.charAt(0).toUpperCase();

            return (
              <div
                key={issue._id}
                className="bg-white border border-neutral-200 hover:border-neutral-300 p-6 rounded-3xl space-y-4 shadow-soft hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 bg-neutral-900 text-white font-black text-xs rounded-xl flex items-center justify-center shadow-xs">
                        {initial}
                      </div>
                      <div>
                        <span className="text-xs font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 font-mono">
                          Ticket #{issue.ticketNumber}
                        </span>
                        <p className="text-[11px] font-mono font-bold text-neutral-400 mt-0.5">
                          Order #{issue.order?.orderNumber || "QB-0000"}
                        </p>
                      </div>
                    </div>
                    <div>{getBadge(issue.status)}</div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-neutral-900 group-hover:text-orange-700 transition-colors">
                      {issue.selectedQuestion}
                    </h4>
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                      <span className="font-bold text-neutral-800">{userName}</span> • {issue.user?.phone || issue.order?.contactPhone || "No contact"}
                    </p>

                    {issue.description && (
                      <p className="text-xs text-neutral-600 font-medium italic bg-neutral-50 p-3 rounded-2xl border border-neutral-150 line-clamp-2">
                        "{issue.description}"
                      </p>
                    )}

                    {issue.images && issue.images.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl text-xs font-black mt-1">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>{issue.images.length} Photo Proof Attached</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">Total Order</span>
                    <span className="text-base font-black text-neutral-900">₹{issue.order?.totalAmount || 0}</span>
                  </div>
                  <button
                    onClick={() => handleInspectIssue(issue)}
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-brand-orange text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-md shadow-neutral-950/10 group-hover:scale-102"
                  >
                    <Eye className="w-4 h-4 text-brand-orange group-hover:text-white transition-colors" />
                    <span>Inspect &amp; Action</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECTION & ACTION FULL-SCREEN WORKSPACE */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col animate-fade-in font-sans overflow-hidden">
          <div className="w-full h-full flex flex-col bg-gradient-to-br from-orange-50/40 via-slate-50 to-amber-50/30 overflow-hidden">
            {/* Full-Screen Compact Header */}
            <div className="px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-white/95 backdrop-blur-md shrink-0 shadow-xs h-14">
              <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-neutral-950 text-brand-orange rounded-xl flex items-center justify-center font-black shadow-xs">
                    <FileText className="w-4.5 h-4.5 text-orange-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-black text-neutral-900 flex items-center gap-2">
                      <span>Inspect Ticket</span>
                      <span className="text-orange-700 font-mono">#{selectedIssue.ticketNumber}</span>
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-medium hidden sm:block">
                      Order #{selectedIssue.order?.orderNumber || "QB-0000"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getBadge(selectedIssue.status)}
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase tracking-wider border border-neutral-200"
                  >
                    <span>Close</span>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Full-Screen Main Workspace: No-scroll on Desktop (lg:overflow-hidden), Scrollable on Mobile */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 sm:p-6">
              <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* Left Column: Customer Audit, Order Info & Photo Proofs */}
                <div className="lg:col-span-6 flex flex-col space-y-4 h-full justify-between">
                  {/* User Trust Rating Banner */}
                  {loyaltyLoading ? (
                    <div className="p-3 bg-white border border-neutral-200 rounded-2xl text-xs text-neutral-500 font-bold animate-pulse">
                      Auditing user reliability score...
                    </div>
                  ) : (
                    getTrustBadgeComponent(userLoyalty)
                  )}

                  {/* Order & Issue Details Matrix */}
                  <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-150">
                        <span className="text-neutral-400 font-extrabold uppercase tracking-wider text-[9px] block">Customer Details</span>
                        <span className="font-extrabold text-neutral-900 truncate block mt-0.5">{selectedIssue.user?.fullName || "Customer"}</span>
                        <span className="text-neutral-500 text-[11px] block font-medium truncate">{selectedIssue.user?.email || selectedIssue.order?.contactPhone}</span>
                      </div>
                      <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-150">
                        <span className="text-neutral-400 font-extrabold uppercase tracking-wider text-[9px] block">Order Financials</span>
                        <span className="font-black text-orange-700 text-sm block mt-0.5">₹{selectedIssue.order?.totalAmount || 0}</span>
                        <span className="text-neutral-500 text-[10px] uppercase font-bold block">Status: {selectedIssue.order?.paymentStatus || "PAID"}</span>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-150 text-xs">
                      <span className="text-neutral-400 font-extrabold uppercase tracking-wider text-[9px] block">Reported Claim Category</span>
                      <p className="font-black text-neutral-900 text-xs mt-1">{selectedIssue.selectedQuestion}</p>
                      {selectedIssue.description && (
                        <p className="text-neutral-700 font-medium italic text-[11px] mt-1.5 bg-white p-2.5 rounded-xl border border-neutral-200/80 leading-relaxed">
                          "{selectedIssue.description}"
                        </p>
                      )}
                    </div>

                    {/* Customer Photo Proof Gallery */}
                    {selectedIssue.images && selectedIssue.images.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">
                          Attached Photo Proofs ({selectedIssue.images.length})
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedIssue.images.map((img, idx) => (
                            <a
                              key={idx}
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-20 h-20 rounded-2xl overflow-hidden border border-neutral-200 hover:border-brand-orange transition-all shadow-2xs group relative"
                            >
                              <img src={img.url} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition-opacity">
                                View
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Manager Decision Workspace */}
                <div className="lg:col-span-6 h-full flex flex-col">
                  {selectedIssue.status === "PENDING" ? (
                    <form onSubmit={handleResolveSubmit} className="bg-white border border-neutral-200 rounded-3xl p-5 md:p-6 shadow-xs h-full flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                          <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                            Process Manager Decision &amp; Refund Action
                          </h4>
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                            Action Needed
                          </span>
                        </div>

                        {error && (
                          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold mb-3">
                            {error}
                          </div>
                        )}
                        {successMessage && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold mb-3">
                            {successMessage}
                          </div>
                        )}

                        {/* Accept vs Reject Choice */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <button
                            type="button"
                            onClick={() => setResolutionAction("ACCEPTED")}
                            className={`py-3 px-3 rounded-2xl font-black text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              resolutionAction === "ACCEPTED"
                                ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                            }`}
                          >
                            <Check className="w-4 h-4 text-emerald-600" /> ACCEPT &amp; REFUND
                          </button>
                          <button
                            type="button"
                            onClick={() => setResolutionAction("REJECTED")}
                            className={`py-3 px-3 rounded-2xl font-black text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              resolutionAction === "REJECTED"
                                ? "bg-rose-50 border-rose-400 text-rose-800 shadow-xs"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900"
                            }`}
                          >
                            <X className="w-4 h-4 text-rose-600" /> REJECT CLAIM
                          </button>
                        </div>

                        {/* If ACCEPTED: Refund amount and type */}
                        {resolutionAction === "ACCEPTED" && (
                          <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-150">
                            <div>
                              <label className="block text-neutral-600 font-bold mb-1 text-[11px]">Refund Type</label>
                              <select
                                value={refundStatus}
                                onChange={(e) => {
                                  setRefundStatus(e.target.value);
                                  if (e.target.value === "FULL") {
                                    setRefundAmount(String(selectedIssue.order?.totalAmount || 0));
                                  }
                                }}
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:border-brand-orange text-xs"
                              >
                                <option value="FULL">FULL REFUND (₹{selectedIssue.order?.totalAmount})</option>
                                <option value="PARTIAL">PARTIAL REFUND</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-neutral-600 font-bold mb-1 text-[11px]">Refund Amount (₹)</label>
                              <input
                                type="number"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-900 font-bold focus:outline-none focus:border-brand-orange text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* Manager Remark */}
                        <div>
                          <label className="block text-xs font-black text-neutral-700 mb-1.5">
                            Manager Remark / Message (Sent directly to customer)
                          </label>
                          <textarea
                            rows={3}
                            value={managerRemark}
                            onChange={(e) => setManagerRemark(e.target.value)}
                            placeholder="e.g. Approved refund for damaged item / Photos do not match reported issue..."
                            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-orange font-medium resize-none"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2 flex justify-end gap-3 border-t border-neutral-150">
                        <button
                          type="button"
                          onClick={() => setSelectedIssue(null)}
                          className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-xl text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? "Processing..." : "Confirm & Send Decision"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs space-y-3 h-full flex flex-col justify-center">
                      <span className="font-black text-neutral-900 text-sm block">Resolution Result ({selectedIssue.status})</span>
                      <p className="text-neutral-800 italic bg-neutral-50 p-4 rounded-2xl border border-neutral-150 text-xs">
                        "{selectedIssue.resolution?.managerRemark || "Decision recorded."}"
                      </p>
                      <p className="text-neutral-500 text-xs pt-1">
                        Actioned by: <span className="font-bold">{selectedIssue.resolution?.actionByRole || "Branch Manager"}</span> on {selectedIssue.resolution?.actionAt ? new Date(selectedIssue.resolution.actionAt).toLocaleString() : "Recent"}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
