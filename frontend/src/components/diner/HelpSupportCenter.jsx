// src/components/diner/HelpSupportCenter.jsx
import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { getMySupportTickets } from "../../services/supportIssue.service";

export default function HelpSupportCenter() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getMySupportTickets();
      setTickets(data || []);
    } catch (err) {
      console.error("Failed to load support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (ticket) => {
    const status = ticket.status;
    if (status === "ACCEPTED") {
      return (
        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Accepted {ticket.resolution?.refundAmount > 0 ? `(Refund: ₹${ticket.resolution.refundAmount})` : ""}
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black rounded-full flex items-center gap-1.5 uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Pending Review
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-8 text-neutral-900 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-800 p-8 sm:p-10 shadow-2xl text-white">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-brand-orange/20 border border-brand-orange/30 text-amber-400 rounded-full text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-orange-700" />
            <span>Customer Support Ticket Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
            My Support Tickets & Claims
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
            Track your submitted order issues, review branch manager responses, and check refund processing status.
          </p>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-2 text-base font-black text-neutral-900">
          <MessageSquare className="w-5 h-5 text-orange-700" />
          <span>Submitted Tickets ({tickets.length})</span>
        </div>

        <button
          onClick={fetchTickets}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-orange-700" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* My Support Tickets List */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-12 text-center text-neutral-500 text-xs font-bold">Loading your support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 bg-white border border-neutral-200 rounded-3xl text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-orange-50 text-orange-700 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-neutral-900">No Support Tickets Found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              To raise a new issue ticket or request a refund, go to your <strong>Orders</strong> tab and click <strong>"Support / Raise Ticket"</strong> on your order card.
            </p>
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t._id}
              className="bg-white border border-neutral-200/90 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                      Ticket #{t.ticketNumber}
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs font-mono font-bold text-neutral-400">
                      Order #{t.order?.orderNumber || "QB-0000"}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-neutral-900 mt-2">{t.selectedQuestion}</h4>
                </div>
                <div>{getStatusBadge(t)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-700 bg-neutral-50/60 p-4 rounded-2xl border border-neutral-100">
                <div>
                  <span className="text-neutral-400 font-bold uppercase text-[11px] tracking-wider block">Restaurant</span>
                  <span className="font-extrabold text-neutral-900 text-xs">{t.restaurant?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-bold uppercase text-[11px] tracking-wider block">Submitted Date</span>
                  <span className="font-semibold text-neutral-800">{new Date(t.createdAt).toLocaleString()}</span>
                </div>
                {t.description && (
                  <div className="sm:col-span-2 border-t border-neutral-150 pt-2.5 mt-1">
                    <span className="text-neutral-400 font-bold uppercase text-[11px] tracking-wider block">Your Comments</span>
                    <p className="text-neutral-800 font-medium italic mt-0.5">"{t.description}"</p>
                  </div>
                )}
              </div>

              {/* Attachments Preview */}
              {t.images && t.images.length > 0 && (
                <div>
                  <span className="text-neutral-400 font-bold uppercase tracking-wider text-[11px] block mb-2">
                    Attached Photo Proof
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {t.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-200 hover:border-brand-orange transition-all shadow-xs"
                      >
                        <img src={img.url} alt="Proof" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager / Admin Resolution Box & Remarks */}
              {t.resolution && t.resolution.actionByRole && (
                <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
                  t.status === "ACCEPTED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-rose-50 border-rose-200 text-rose-950"
                }`}>
                  <div className="font-black flex items-center justify-between">
                    <span className="uppercase tracking-wider text-[11px]">
                      Resolution Response by {t.resolution.actionByRole.toUpperCase()}
                    </span>
                    {t.resolution.actionAt && (
                      <span className="text-[11px] font-normal text-neutral-500">
                        {new Date(t.resolution.actionAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {t.resolution.managerRemark && (
                    <p className="font-semibold italic text-neutral-800 bg-white/70 p-2.5 rounded-xl border border-neutral-200/50">
                      "{t.resolution.managerRemark}"
                    </p>
                  )}
                  {t.resolution.refundAmount > 0 && (
                    <p className="font-black text-emerald-700 text-xs">
                      Refund Amount Processed: ₹{t.resolution.refundAmount} ({t.resolution.refundStatus} REFUND)
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
