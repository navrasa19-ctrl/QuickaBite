// src/components/diner/ReportIssueModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  CreditCard,
  Utensils,
  ShoppingBag,
  Truck,
  HelpCircle,
} from "lucide-react";
import { getFaqOptions, createSupportTicket } from "../../services/supportIssue.service";

export default function ReportIssueModal({ isOpen, onClose, order, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [description, setDescription] = useState("");
  const [requestedRefund, setRequestedRefund] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchFaqs();
      resetForm();
    }
  }, [isOpen]);

  const fetchFaqs = async () => {
    try {
      const data = await getFaqOptions();
      setCategories(data || []);
      if (data && data.length > 0) {
        setSelectedCategory(data[0]);
        if (data[0].questions?.length > 0) {
          setSelectedQuestion(data[0].questions[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load FAQs:", err);
    }
  };

  const resetForm = () => {
    setSelectedQuestion(null);
    setDescription("");
    setRequestedRefund("");
    setFiles([]);
    setPreviews([]);
    setError("");
    setSubmittedTicket(null);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    if (cat.questions && cat.questions.length > 0) {
      setSelectedQuestion(cat.questions[0]);
    } else {
      setSelectedQuestion(null);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setError("You can attach a maximum of 5 photos.");
      return;
    }
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !selectedQuestion) {
      setError("Please select a problem category and specific issue.");
      return;
    }
    if (selectedQuestion.requiresProof && files.length === 0) {
      setError("Photo proof or payment screenshot is required for this issue type.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("orderId", order._id || order.id);
      formDataPayload.append("issueCategory", selectedCategory.id);
      formDataPayload.append("selectedQuestion", selectedQuestion.question);
      if (description) formDataPayload.append("description", description);
      formDataPayload.append(
        "requestedRefundAmount",
        String(requestedRefund ? Number(requestedRefund) : order.totalAmount || order.total || 0)
      );

      // Append image File objects for multipart upload
      files.forEach((file) => {
        formDataPayload.append("images", file);
      });

      const ticketData = await createSupportTicket(formDataPayload);

      setSubmittedTicket(ticketData);
      if (onSuccess) onSuccess(ticketData);
    } catch (err) {
      setError(err.message || "Failed to submit support ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col animate-fade-in font-sans overflow-hidden">
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-orange-50 via-slate-50 to-amber-50/50 overflow-hidden">
        {/* Refined Light Full-Screen Header */}
        <div className="px-6 py-4.5 border-b border-orange-100/80 flex items-center justify-between bg-white/95 backdrop-blur-md shrink-0 shadow-soft">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 text-orange-700 rounded-2xl flex items-center justify-center font-black shadow-xs">
                <HelpCircle className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-display font-black text-neutral-900 flex items-center gap-2">
                  <span>Report Issue for Order</span>
                  <span className="text-orange-700 font-mono text-lg">#{order?.orderNumber || "QB-0000"}</span>
                </h2>
                <p className="text-xs text-neutral-500 font-medium">
                  Select problem category, view guidance, and submit proof directly to the manager.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-orange-50 text-brand-orange hover:bg-brand-orange hover:text-white rounded-2xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black uppercase tracking-wider border border-orange-200/80 shadow-2xs"
            >
              <span>Close</span>
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Refined Light Body Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-10 my-auto min-h-full flex flex-col justify-center">
            <div className="bg-white p-6 md:p-9 rounded-3xl border border-neutral-200/80 shadow-xl space-y-7">
          {submittedTicket ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900">Ticket Submitted Successfully!</h3>
              <p className="text-sm text-neutral-600 max-w-md mx-auto">
                Ticket Number: <span className="text-orange-700 font-black">#{submittedTicket.ticketNumber}</span>. Your request has been dispatched to the branch manager.
              </p>
              <div className="bg-neutral-50 p-5 rounded-2xl text-left max-w-md mx-auto text-xs text-neutral-700 space-y-2 border border-neutral-200/80">
                <p>• Status: <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-200">PENDING REVIEW</span></p>
                <p>• Issue: <span className="font-bold">{submittedTicket.selectedQuestion}</span></p>
                <p>• You can check live responses anytime in your <strong>Support Tickets</strong> section.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-xl transition-all shadow-md cursor-pointer text-xs"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category Selector Chips */}
              <div>
                <label className="block text-xs font-black text-neutral-900 uppercase tracking-wider mb-2.5">
                  1. Select Problem Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand-orange text-white border-brand-orange shadow-md font-black shadow-orange-500/20"
                            : "bg-neutral-50/80 border-neutral-200 text-neutral-700 hover:bg-orange-50/60 hover:border-orange-200"
                        }`}
                      >
                        <span className="text-xs font-extrabold">{cat.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Problem Selection */}
              {selectedCategory?.questions?.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-neutral-900 uppercase tracking-wider mb-2.5">
                    2. Select Specific Issue
                  </label>
                  <div className="space-y-2">
                    {selectedCategory.questions.map((q) => {
                      const isSelected = selectedQuestion?.id === q.id;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setSelectedQuestion(q)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                            isSelected
                              ? "bg-orange-500 border-orange-500 text-white font-bold shadow-md shadow-orange-500/20"
                              : "bg-neutral-50/60 border-neutral-200 text-neutral-800 hover:bg-neutral-100/80"
                          }`}
                        >
                          <span className="text-xs font-semibold">{q.question}</span>
                          {isSelected && <CheckCircle2 className="w-4.5 h-4.5 text-white shrink-0 ml-2 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Automated Answer Guidance */}
              {selectedQuestion?.autoAnswer && (
                <div className="p-4 bg-orange-50/80 border border-orange-200/90 rounded-2xl space-y-1.5">
                  <div className="text-xs font-black text-orange-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4" />
                    Support Policy & Guidance:
                  </div>
                  <p className="text-xs text-neutral-800 leading-relaxed font-medium">
                    {selectedQuestion.autoAnswer}
                  </p>
                </div>
              )}

              {/* Photo Proof Upload */}
              <div>
                <label className="block text-xs font-black text-neutral-900 uppercase tracking-wider mb-1">
                  3. Attach Photos / Screenshots {selectedQuestion?.requiresProof && <span className="text-rose-600">* (Required)</span>}
                </label>
                <p className="text-[11px] text-neutral-500 mb-2 font-medium">
                  Upload dish photo or receipt screenshot (max 5 photos)
                </p>

                <div className="flex flex-wrap gap-3 items-center">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 group shadow-xs">
                      <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {files.length < 5 && (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-brand-orange bg-neutral-50 hover:bg-orange-50/50 flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-orange-700 transition-all">
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-bold">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Comments / Details */}
              <div>
                <label className="block text-xs font-black text-neutral-900 uppercase tracking-wider mb-2">
                  4. Additional Comments / Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what went wrong in detail..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-orange transition-all resize-none font-medium"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-150">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-7 py-3 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-xl text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {loading ? "Submitting Ticket..." : "Submit Issue Ticket"}
                </button>
              </div>
            </form>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
