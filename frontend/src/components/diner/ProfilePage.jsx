import { useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  Award,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Edit3,
  Save,
  Plus,
  Trash2,
  ChevronRight,
  Send,
  Copy,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Mail,
  MessageCircle,
  Compass,
  Map as MapIcon,
  Navigation,
  CheckCircle2,
  Search,
} from "lucide-react";
import { RESTAURANTS } from "../../data";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/authService";
import { useFavorites } from "../../context/FavoritesContext";
import DeliveryLocationPicker from "./DeliveryLocationPicker";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin as GmpPin,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
const API_KEY =
  (typeof process !== "undefined"
    ? process.env.GOOGLE_MAPS_PLATFORM_KEY
    : "") ||
  import.meta.env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  globalThis.GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

const formatAddressDetail = (detail) => {
  if (!detail) return "";
  const LIMIT = 45; // Change line after 45 characters
  if (detail.length <= LIMIT) return detail;

  const lines = [];
  let remaining = detail;
  while (remaining.length > 0) {
    if (remaining.length <= LIMIT) {
      lines.push(remaining);
      break;
    }
    let breakPoint = remaining.lastIndexOf(" ", LIMIT);
    if (breakPoint === -1 || breakPoint === 0) {
      breakPoint = LIMIT;
    }
    lines.push(remaining.substring(0, breakPoint));
    remaining = remaining.substring(breakPoint).trim();
  }

  return lines.map((line, idx) => (
    <span key={idx}>
      {line}
      {idx < lines.length - 1 && <br />}
    </span>
  ));
};

export default function ProfilePage({
  setSelectedRestaurant,
  setActiveTab,
  triggerToast,
  setIsLoggedIn,
}) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getInitialSection = () => {
    const sectionParam = searchParams.get("section");
    if (sectionParam) return sectionParam;
    if (location.state?.section) return location.state.section;
    return "info";
  };

  const {
    profile,
    updateProfile,
    logout,
    addresses,
    setAddresses: saveAddressesContext,
    addAddress,
    updateAddress,
    deleteAddress,
    payments,
    setPayments: savePaymentsContext,
    notifPrefs,
    setNotifPrefs: saveNotifPrefsContext
  } = useAuth();
  const { setFavorites } = useFavorites();
  const [activeSection, setActiveSection] = useState(getInitialSection);

  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (sectionParam) {
      setActiveSection(sectionParam);
    } else if (location.state?.section) {
      setActiveSection(location.state.section);
    }
  }, [location, searchParams]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditEmail(profile.email || "");
      setEditPhone(profile.phone || "");
    }
  }, [profile]);
  const recentAlerts = [
    {
      id: "a-1",
      title: "Order Delivered Successfully 🍕",
      desc: "Your meal from Jamie's Italian has been hand-delivered by Chef Bilal.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: "a-2",
      title: "50% Off Promo Unlocked! 🎉",
      desc: "Special loyalty code GOURMET50 is now active in your wallet.",
      time: "Yesterday",
      unread: false,
    },
    {
      id: "a-3",
      title: "Daily Streak Milestone reached ⭐",
      desc: "Congrats on your 5-day food streak! Claimed +150 loyalty points.",
      time: "3 days ago",
      unread: false,
    },
  ];
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "m-1",
      sender: "bot",
      text: "Hello, Chef Vedanshi! 🧑‍🍳 Welcome to QuikaBite Gourmet concierge. How can I assist you with your dining experience, billing, or deliveries today?",
      time: "Just now",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatBottomRef = useRef(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrDetail, setNewAddrDetail] = useState("");
  const [newAddrContact, setNewAddrContact] = useState("");
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [newAddrLat, setNewAddrLat] = useState(25.0794);
  const [newAddrLng, setNewAddrLng] = useState(55.1368);
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);
  const [newAddrTagName, setNewAddrTagName] = useState("");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayType, setNewPayType] = useState("Visa");
  const [newPayNumber, setNewPayNumber] = useState("");
  const [newPayExpiry, setNewPayExpiry] = useState("");
  const [newPayHolder, setNewPayHolder] = useState("");
  useEffect(() => {
    if (activeSection === "help" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeSection, isBotTyping]);
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      triggerToast("Profile details cannot be blank.");
      return;
    }
    await updateProfile({
      ...profile,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    });
    setIsEditingProfile(false);
    triggerToast("Profile information updated successfully!");
  };
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddrDetail.trim() || !newAddrContact.trim()) {
      triggerToast("Please fill out all address details.");
      return;
    }

    const finalLabel =
      newAddrLabel === "Other"
        ? newAddrTagName.trim() || "Other"
        : newAddrLabel;

    // Check duplicate label case-insensitively
    const isDuplicate = (addresses || []).some((a) => {
      const aId = a.id || a._id;
      if (editingAddrId && aId === editingAddrId) return false;
      return (a.label || "").toLowerCase() === finalLabel.toLowerCase();
    });

    if (isDuplicate) {
      triggerToast(
        `An address labeled "${finalLabel}" already exists in your profile. Please choose a different category or edit your existing address.`,
      );
      return;
    }

    const nextIsDefault = newAddrIsDefault;
    const payload = {
      label: finalLabel,
      detail: newAddrDetail.trim(),
      contact: newAddrContact.trim(),
      lat: newAddrLat,
      lng: newAddrLng,
      isDefault: nextIsDefault,
      tagName: newAddrLabel === "Other" ? newAddrTagName.trim() : undefined,
    };

    try {
      if (editingAddrId) {
        await updateAddress(editingAddrId, payload);
        triggerToast("Address updated successfully!");
      } else {
        await addAddress(payload);
        triggerToast("New address added to your book!");
      }
      setNewAddrDetail("");
      setNewAddrContact("");
      setNewAddrTagName("");
      setNewAddrIsDefault(false);
      setIsAddingAddress(false);
      setEditingAddrId(null);
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || err.message || "Failed to save address.");
    }
  };
  const startEditAddress = (addr) => {
    setEditingAddrId(addr.id);
    setNewAddrLabel(addr.label);
    setNewAddrDetail(addr.detail);
    setNewAddrContact(addr.contact);
    setNewAddrLat(addr.lat || 25.0794);
    setNewAddrLng(addr.lng || 55.1368);
    setNewAddrIsDefault(addr.isDefault || false);
    setNewAddrTagName(addr.tagName || "");
    setIsAddingAddress(true);
  };
  const handleDeleteAddress = async (id, label) => {
    try {
      await deleteAddress(id);
      triggerToast(`Address "${label}" removed.`);
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || err.message || "Failed to remove address.");
    }
  };
  const makeAddressDefault = async (id) => {
    try {
      await updateAddress(id, { isDefault: true });
      triggerToast("Address set as default delivery location.");
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || err.message || "Failed to set default address.");
    }
  };
  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!newPayNumber.trim() || !newPayExpiry.trim() || !newPayHolder.trim()) {
      triggerToast("Please enter all payment details.");
      return;
    }
    let maskedNumber = newPayNumber.trim().replace(/\s+/g, "");
    if (maskedNumber.length < 4) {
      triggerToast("Invalid card number.");
      return;
    }
    const lastFour = maskedNumber.substring(maskedNumber.length - 4);
    const printedNumber = `•••• •••• •••• ${lastFour}`;
    const newPay = {
      id: `pay-${Date.now()}`,
      type: newPayType,
      number: printedNumber,
      expiry: newPayExpiry,
      holder: newPayHolder.trim().toUpperCase(),
    };
    savePaymentsContext([...payments, newPay]);
    setIsAddingPayment(false);
    setNewPayNumber("");
    setNewPayExpiry("");
    setNewPayHolder("");
    triggerToast(`${newPayType} Card saved securely.`);
  };
  const handleDeletePayment = (id, type) => {
    const updated = payments.filter((p) => p.id !== id);
    savePaymentsContext(updated);
    triggerToast(`${type} payment method removed.`);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: chatInput.trim(),
      time: /* @__PURE__ */ new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsBotTyping(true);
    setTimeout(() => {
      let replyText =
        "Thank you for your message! Our gourmet support culinary agents have received your inquiry. We will contact you at your registered email address bhabhravedanshi@gmail.com shortly.";
      const textLower = userMsg.text.toLowerCase();
      if (
        textLower.includes("order") ||
        textLower.includes("track") ||
        textLower.includes("where is")
      ) {
        replyText =
          'I can help you track your feast! You can view your real-time GPS tracking on your "Orders" tab. Currently, any active delivery will showcase live rider milestones and mock GPS telemetry.';
      } else if (
        textLower.includes("refund") ||
        textLower.includes("money") ||
        textLower.includes("cancel")
      ) {
        replyText =
          "Understood. Refund or cancellations of gourmet bookings can be processed directly if requested within 5 minutes of placing. Let me elevate this to our VIP manager right now to check your card ending in 4820.";
      } else if (
        textLower.includes("address") ||
        textLower.includes("home") ||
        textLower.includes("work")
      ) {
        replyText =
          'You can modify or add unlimited delivery destinations inside your "Saved Addresses" tab. Any update there will sync instantly with your checkout flow!';
      } else if (
        textLower.includes("discount") ||
        textLower.includes("coupon") ||
        textLower.includes("code") ||
        textLower.includes("reward")
      ) {
        replyText =
          'Great news! You are a "Gourmet Master" level tier. Check out your "Gourmet Rewards & Streaks" tab where we have pre-unlocked coupon codes like GOURMET50 and FOODSTREAK for you.';
      } else if (
        textLower.includes("hello") ||
        textLower.includes("hi") ||
        textLower.includes("hey")
      ) {
        replyText =
          "Hey Vedanshi! Hope you are having a tasty day. Are you craving Jumeirah local specialties, signature sushi, or a wood-fired Italian pizza today? Let me know how I can help!";
      }
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        time: /* @__PURE__ */ new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
      setIsBotTyping(false);
    }, 1200);
  };
  const handleLogout = async () => {
    await logout();
    triggerToast(
      "Logged out successfully!",
    );
    setShowLogoutConfirm(false);
    if (setIsLoggedIn) {
      setIsLoggedIn(false);
    }
    setFavorites([]);
    setActiveSection("info");
    if (setActiveTab) {
      setActiveTab("home");
    }
  };

  const faqList = [
    {
      q: "How does the Gourmet Real-Time GPS Tracking work?",
      a: "Once an order is confirmed, our kitchen updates milestones. You can track preparation, rider dispatch, and live route navigation on our Orders tab map overlay.",
    },
    {
      q: "Can I cancel an order once placed?",
      a: "Since gourmet meals are immediately handcrafted on order, cancellations are only possible if the kitchen has not started cooking. Please message support immediately using the chat below.",
    },
    {
      q: "How are rewards and streaks computed?",
      a: "For every ₹ 10 spent, you earn 1 gourmet point. Placing orders on consecutive days builds your streak, boosting point accruals by 1.5x at Gourmet Master levels.",
    },
    {
      q: "Are payment credentials safe?",
      a: "Absolutely. All saved cards are mock-tokenized and stored safely under sandboxed local browser cache using enterprise-grade security structures.",
    },
  ];
  if (!profile) {
    return null;
  }

  return (
    <div
      className="max-w-[1400px] mx-auto py-1 animate-fade-in"
      id="profile-page-main"
    >
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative group">
            <div className="h-20 w-20 bg-orange-100 border-2 border-brand-orange text-orange-700 text-2xl font-black rounded-full flex items-center justify-center shadow-md shrink-0 transition group-hover:scale-105">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-brand-orange text-white p-1 rounded-full shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">
                {profile.name}
              </h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span>{profile.tier}</span>
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Default Member • Joined {profile.joined}
            </p>
            <p className="text-xs font-semibold text-gray-500 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="h-3.5 w-3.5 text-gray-400" /> {profile.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 flex lg:flex-col overflow-x-auto no-scrollbar gap-2 space-y-0 lg:space-y-2 bg-white p-3 sm:p-4 rounded-3xl border border-gray-100 shadow-xs h-fit shrink-0">
          {[
            { id: "info", label: "Profile Information", icon: User },
            {
              id: "addresses",
              label: "Saved Addresses",
              icon: MapPin,
              count: addresses.length,
            },
            {
              id: "payments",
              label: "Payment Methods",
              icon: CreditCard,
              count: payments.length,
            },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "rewards", label: "Gourmet Rewards", icon: Award },
            { id: "support", label: "Support Helpdesk", icon: LifeBuoy },
            { id: "help", label: "Help & Live Support", icon: HelpCircle },
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "support") {
                    setActiveTab("support");
                    return;
                  }
                  setActiveSection(item.id);
                  setIsAddingAddress(false);
                  setIsAddingPayment(false);
                  setEditingAddrId(null);
                }}
                className={`cursor-pointer shrink-0 whitespace-nowrap lg:whitespace-normal w-auto lg:w-full flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold transition-all ${isActive ? "bg-brand-orange text-white shadow-md scale-102 font-black" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 bg-gray-50/50 lg:bg-transparent"}`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.count !== void 0 && item.count > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-black ${isActive ? "bg-white text-orange-700" : "bg-gray-200/80 text-gray-700"}`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Section Details Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs min-h-[480px]">
            {/* SECTION 1: PROFILE INFORMATION */}
            {activeSection === "info" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">
                    Profile Information
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage your secure identity details and contact methods
                  </p>
                </div>

                {!isEditingProfile ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1 bg-neutral-50/50 p-4 rounded-2xl border border-gray-50">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                          Full Name
                        </span>
                        <p className="font-extrabold text-gray-800 text-sm">
                          {profile.name}
                        </p>
                      </div>

                      <div className="space-y-1 bg-neutral-50/50 p-4 rounded-2xl border border-gray-50">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                          Email Address
                        </span>
                        <p className="font-extrabold text-gray-800 text-sm">
                          {profile.email}
                        </p>
                      </div>

                      <div className="space-y-1 bg-neutral-50/50 p-4 rounded-2xl border border-gray-50">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                          Phone Number
                        </span>
                        <p className="font-extrabold text-gray-800 text-sm">
                          {profile.phone}
                        </p>
                      </div>

                      <div className="space-y-1 bg-neutral-50/50 p-4 rounded-2xl border border-gray-50">
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                          Gourmet Membership Tier
                        </span>
                        <p className="font-extrabold text-orange-700 text-sm flex items-center gap-1.5">
                          <Award className="h-4 w-4 animate-bounce" />
                          {profile.tier}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditName(profile.name);
                        setEditEmail(profile.email);
                        setEditPhone(profile.phone);
                        setIsEditingProfile(true);
                      }}
                      className="cursor-pointer bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Profile Information</span>
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSaveProfile}
                    className="space-y-5 animate-fade-in"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="cursor-pointer px-5 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 transition"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="cursor-pointer px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* SECTION 2: SAVED ADDRESSES */}
            {activeSection === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">
                      Saved Addresses
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Manage delivery locations with precise map coordinates
                    </p>
                  </div>
                  {!isAddingAddress && (
                    <button
                      onClick={() => {
                        const hasHome = (addresses || []).some(
                          (a) => (a.label || "").toLowerCase() === "home",
                        );
                        const hasWork = (addresses || []).some(
                          (a) => (a.label || "").toLowerCase() === "work",
                        );
                        const defaultLabel = !hasHome
                          ? "Home"
                          : !hasWork
                            ? "Work"
                            : "Other";

                        setEditingAddrId(null);
                        setNewAddrLabel(defaultLabel);
                        setNewAddrDetail("");
                        setNewAddrContact(profile.phone);
                        setNewAddrLat(12.9716);
                        setNewAddrLng(77.6099);
                        setNewAddrIsDefault(addresses.length === 0);
                        setNewAddrTagName("");
                        setIsAddingAddress(true);
                      }}
                      className="cursor-pointer bg-brand-orange hover:bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Location</span>
                    </button>
                  )}
                </div>

                {isAddingAddress ? (
                  <form
                    onSubmit={handleAddAddress}
                    className="space-y-6 bg-neutral-50/50 border border-neutral-100 rounded-3xl p-6 animate-fade-in"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-200/50">
                      <h4 className="font-display font-black text-sm text-gray-800 flex items-center gap-2">
                        <MapIcon className="h-4 w-4 text-orange-700 animate-bounce" />
                        <span>
                          {editingAddrId
                            ? "Edit Delivery Destination"
                            : "Add New Delivery Destination"}
                        </span>
                      </h4>
                      <span className="text-[11px] font-mono font-bold bg-neutral-200/70 text-neutral-600 px-2.5 py-1 rounded-md">
                        Lat: {newAddrLat.toFixed(4)} • Lng:{" "}
                        {newAddrLng.toFixed(4)}
                      </span>
                    </div>

                    {/* Address Label buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                          Address Category
                        </label>
                        <div className="flex gap-2">
                          {["Home", "Work", "Other"].map((lbl) => {
                            const isAlreadySaved =
                              lbl !== "Other" &&
                              (addresses || []).some((a) => {
                                const aId = a.id || a._id;
                                if (editingAddrId && aId === editingAddrId) return false;
                                return (a.label || "").toLowerCase() === lbl.toLowerCase();
                              });

                            return (
                              <button
                                key={lbl}
                                type="button"
                                disabled={isAlreadySaved}
                                onClick={() => {
                                  if (!isAlreadySaved) setNewAddrLabel(lbl);
                                }}
                                title={isAlreadySaved ? `${lbl} address is already saved in profile` : ""}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isAlreadySaved
                                  ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed opacity-60 line-through"
                                  : newAddrLabel === lbl
                                    ? "bg-brand-orange text-white cursor-pointer"
                                    : "bg-white border border-gray-200 text-gray-500 hover:text-gray-800 cursor-pointer"
                                  }`}
                              >
                                {lbl} {isAlreadySaved ? "(Saved)" : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {newAddrLabel === "Other" && (
                        <div className="space-y-2 animate-fade-in">
                          <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                            Custom Name (Label)
                          </label>
                          <input
                            type="text"
                            value={newAddrTagName}
                            onChange={(e) => setNewAddrTagName(e.target.value)}
                            placeholder="e.g. Gym, Parents' House"
                            className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <DeliveryLocationPicker
                      apiKey={API_KEY}
                      initialLat={newAddrLat}
                      initialLng={newAddrLng}
                      onLocationSelect={({ lat, lng, address }) => {
                        setNewAddrLat(lat);
                        setNewAddrLng(lng);
                        if (address) {
                          setNewAddrDetail(address);
                        }
                      }}
                      triggerToast={triggerToast}
                    />

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                        Complete Street Address & Landmarks
                      </label>
                      <textarea
                        value={newAddrDetail}
                        onChange={(e) => setNewAddrDetail(e.target.value)}
                        placeholder="e.g. Apartment 1402, Signature Residency Towers, Dubai Marina, UAE"
                        className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange leading-relaxed"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                          Recipient Contact Number
                        </label>
                        <input
                          type="text"
                          value={newAddrContact}
                          onChange={(e) => setNewAddrContact(e.target.value)}
                          placeholder="e.g. +91 9876543210"
                          className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                          required
                        />
                      </div>

                      <div className="space-y-2 flex flex-col justify-end pb-1.5">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white p-3 rounded-xl border border-gray-200">
                          <input
                            type="checkbox"
                            checked={newAddrIsDefault}
                            onChange={(e) =>
                              setNewAddrIsDefault(e.target.checked)
                            }
                            className="h-4 w-4 rounded-md border-gray-300 text-orange-700 focus:ring-brand-orange"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-700">
                              Set as default address
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Use this address automatically for future orders
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-neutral-200/50">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAddress(false);
                          setEditingAddrId(null);
                        }}
                        className="cursor-pointer px-5 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-extrabold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="cursor-pointer px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
                      >
                        <Save className="h-4 w-4" />
                        <span>
                          {editingAddrId
                            ? "Save Address Details"
                            : "Save Delivery Address"}
                        </span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {addresses.length > 0 ? (
                      addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${addr.isDefault ? "border-brand-orange/40 ring-1 ring-brand-orange/10 bg-orange-50/5" : "border-gray-100 hover:border-gray-200"}`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`p-3 rounded-xl shrink-0 ${addr.isDefault ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-500"}`}
                            >
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-neutral-800 text-white font-mono text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                                  {addr.label === "Other" && addr.tagName
                                    ? addr.tagName
                                    : addr.label}
                                </span>
                                {addr.isDefault && (
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Default Address</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 font-medium leading-relaxed pt-1.5">
                                {formatAddressDetail(addr.detail)}
                              </p>

                              <div className="flex items-center gap-4 pt-1 flex-wrap">
                                <p className="text-[11px] text-gray-400 font-medium font-mono">
                                  📞 Recipient: {addr.contact}
                                </p>
                                <p className="text-[11px] text-gray-400 font-mono flex items-center gap-0.5">
                                  <Navigation className="h-3 w-3" />
                                  <span>
                                    {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:self-center self-end border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                            {!addr.isDefault && (
                              <button
                                onClick={() => makeAddressDefault(addr.id)}
                                className="cursor-pointer text-[11px] font-extrabold text-brand-orange hover:text-white hover:bg-brand-orange border border-brand-orange/20 hover:border-transparent px-3 py-1.5 rounded-xl transition"
                                title="Set as default address"
                              >
                                Use Default
                              </button>
                            )}
                            <button
                              onClick={() => startEditAddress(addr)}
                              className="cursor-pointer text-gray-400 hover:text-orange-700 p-2 rounded-xl hover:bg-neutral-50 transition"
                              title="Edit address and pin location"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteAddress(
                                  addr.id,
                                  addr.label === "Other" && addr.tagName
                                    ? addr.tagName
                                    : addr.label,
                                )
                              }
                              className="cursor-pointer text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-neutral-50 transition"
                              title="Delete from address book"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 border border-dashed border-gray-200 rounded-3xl space-y-3">
                        <div className="bg-neutral-50 text-neutral-400 p-4 rounded-full inline-flex">
                          <MapIcon className="h-8 w-8" />
                        </div>
                        <p className="text-gray-400 text-xs font-bold">
                          Your address book is empty.
                        </p>
                        <p className="text-gray-300 text-[11px]">
                          Add your delivery destination to start placing orders
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: PAYMENT METHODS */}
            {activeSection === "payments" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">
                      Payment Methods
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Manage saved cards and checkout wallets
                    </p>
                  </div>
                  {!isAddingPayment && (
                    <button
                      onClick={() => {
                        setNewPayType("Visa");
                        setNewPayNumber("");
                        setNewPayExpiry("");
                        setNewPayHolder(profile.name);
                        setIsAddingPayment(true);
                      }}
                      className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Card</span>
                    </button>
                  )}
                </div>

                {isAddingPayment ? (
                  <form
                    onSubmit={handleAddPayment}
                    className="space-y-5 bg-neutral-50/50 border border-neutral-100 rounded-3xl p-6 animate-fade-in"
                  >
                    <h4 className="font-display font-black text-sm text-gray-800">
                      Add Credit / Debit Card
                    </h4>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                        Card Provider
                      </label>
                      <div className="flex gap-2">
                        {["Visa", "Mastercard"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewPayType(type)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newPayType === type ? "bg-brand-orange text-white" : "bg-white border border-gray-200 text-gray-500 hover:text-gray-800"}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={newPayNumber}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .substring(0, 16);
                          const formatted = val
                            .replace(/(.{4})/g, "$1 ")
                            .trim();
                          setNewPayNumber(formatted);
                        }}
                        placeholder="4000 1234 5678 9010"
                        className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={newPayExpiry}
                          onChange={(e) => {
                            let val = e.target.value
                              .replace(/\D/g, "")
                              .substring(0, 4);
                            if (val.length >= 2) {
                              val = `${val.slice(0, 2)}/${val.slice(2)}`;
                            }
                            setNewPayExpiry(val);
                          }}
                          placeholder="MM/YY"
                          className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={newPayHolder}
                          onChange={(e) => setNewPayHolder(e.target.value)}
                          placeholder="VEDANSHI BHABHRA"
                          className="w-full text-xs p-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingPayment(false)}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-black rounded-xl text-xs transition shadow-sm"
                      >
                        Save Card Details
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {payments.map((pay) => (
                      <div
                        key={pay.id}
                        className="bg-white border border-gray-150 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-gray-300 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl font-mono text-[11px] font-black uppercase text-white shadow-xs ${pay.type === "Visa" ? "bg-neutral-950" : "bg-rose-950"}`}
                          >
                            {pay.type}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-gray-800">
                              {pay.holder}
                            </h4>
                            <p className="text-xs font-mono text-gray-500 mt-0.5">
                              {pay.number}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              Expires: {pay.expiry}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePayment(pay.id, pay.type)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-50 transition"
                          title="Remove card"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* SECTION 5: NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">
                    Notification Preferences
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Stay updated with delivery tracking, gourmet promotions, and
                    milestone alerts
                  </p>
                </div>

                {/* Toggles box */}
                <div className="bg-neutral-50/50 border border-neutral-100 rounded-3xl p-5 sm:p-6 space-y-4">
                  <h4 className="font-display font-black text-xs text-gray-400 uppercase tracking-wider">
                    Alert channels
                  </h4>

                  <div className="space-y-3">
                    {[
                      {
                        key: "email",
                        label: "Email Notifications",
                        desc: "Receive invoices, receipt statements, and daily discount digests",
                        icon: Mail,
                      },
                      {
                        key: "push",
                        label: "In-App Push Alerts",
                        desc: "Real-time kitchen confirmation status and GPS delivery milestone updates",
                        icon: Smartphone,
                      },
                      {
                        key: "sms",
                        label: "SMS Messages",
                        desc: "Urgent mobile texts regarding rider drop-offs and special codes",
                        icon: MessageCircle,
                      },
                    ].map((pref) => {
                      const Icon = pref.icon;
                      const val = notifPrefs[pref.key];
                      return (
                        <div
                          key={pref.key}
                          className="flex items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-orange-700 bg-orange-50 p-2 rounded-xl">
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-gray-800">
                                {pref.label}
                              </p>
                              <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                                {pref.desc}
                              </p>
                            </div>
                          </div>

                          {/* Beautiful Toggle Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedPrefs = {
                                ...notifPrefs,
                                [pref.key]: !notifPrefs[pref.key],
                              };
                              saveNotifPrefsContext(updatedPrefs);
                              triggerToast(`Alerts updated successfully!`);
                            }}
                            className={`w-11 h-6 rounded-full p-0.5 transition duration-300 relative shrink-0 ${val ? "bg-brand-orange" : "bg-gray-200"}`}
                          >
                            <span
                              className={`w-5 h-5 bg-white rounded-full block shadow-xs transition duration-300 transform ${val ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Feed */}
                <div className="space-y-4">
                  <h4 className="font-display font-black text-xs text-gray-400 uppercase tracking-wider">
                    Recent Activity Feed
                  </h4>
                  <div className="space-y-3">
                    {recentAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-2xl border flex items-start gap-3 transition ${alert.unread ? "bg-orange-50/20 border-orange-100/50" : "bg-white border-gray-50"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-2 shrink-0 ${alert.unread ? "bg-brand-orange" : "bg-gray-300"}`}
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-800">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            {alert.desc}
                          </p>
                          <span className="text-[11px] text-gray-400 block font-medium">
                            {alert.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: REWARDS & STREAKS */}
            {activeSection === "rewards" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">
                    Gourmet Rewards
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Track active streaks, loyalty loyalty balance, and premium
                    member vouchers
                  </p>
                </div>

                {/* Gamified Card Banner */}
                <div className="bg-radial from-neutral-900 to-gray-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-neutral-800">
                  <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
                    <Award className="h-64 w-64" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="bg-brand-orange text-white text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          Member VIP Level 3
                        </span>
                        <h4 className="font-display font-black text-xl tracking-tight text-white pt-1">
                          Gourmet Platinum Club
                        </h4>
                      </div>
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                        <Award className="h-6 w-6 text-orange-700 animate-spin-slow" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                          Loyalty Points Balance
                        </p>
                        <p className="font-display font-black text-2xl text-orange-700 pt-1">
                          1,250{" "}
                          <span className="text-xs text-white font-medium">
                            pts
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                          Active Ordering Streak
                        </p>
                        <p className="font-display font-black text-2xl text-amber-400 pt-1 flex items-center gap-1.5">
                          <span>5 Days</span>
                          <span className="text-xs animate-bounce">🔥</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress milestone */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Next Tier: Ultimate Diner (1,500 pts)</span>
                        <span>83% Completed</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange rounded-full"
                          style={{ width: "83%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Point Ledger */}
                <div className="space-y-4">
                  <h4 className="font-display font-black text-xs text-gray-400 uppercase tracking-wider">
                    Voucher Hub
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        code: "GOURMET50",
                        discount: "50% OFF",
                        desc: "Applicable on any order above ₹ 80.",
                        expires: "31 Jul 2026",
                      },
                      {
                        code: "FOODSTREAK",
                        discount: "₹ 20 Off",
                        desc: "Loyalty bonus for placing consecutive orders.",
                        expires: "15 Jul 2026",
                      },
                    ].map((voucher) => (
                      <div
                        key={voucher.code}
                        className="border border-dashed border-gray-250 bg-neutral-50/50 rounded-2xl p-4 flex items-center justify-between gap-4 relative overflow-hidden"
                      >
                        <div className="space-y-1">
                          <span className="bg-brand-orange/10 text-orange-700 font-black text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {voucher.discount}
                          </span>
                          <h5 className="font-mono font-black text-sm text-gray-800 pt-1">
                            {voucher.code}
                          </h5>
                          <p className="text-[11px] text-gray-400">
                            {voucher.desc}
                          </p>
                          <span className="text-[11px] text-gray-400 block pt-1 italic">
                            Expires {voucher.expires}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(voucher.code);
                            triggerToast(`Copied coupon ${voucher.code}!`);
                          }}
                          className="bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-gray-250 font-black text-[11px] px-3 py-2 rounded-xl flex items-center gap-1 transition shrink-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 7: HELP & SUPPORT */}
            {activeSection === "help" && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="font-display font-black text-xl text-gray-900 tracking-tight">
                    Help & Customer Support
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Read frequent answers or start an interactive live chat with
                    our gourmet concierge
                  </p>
                </div>

                {/* Support Helpdesk Quick Link Banner */}
                <div className="bg-orange-50/50 border border-brand-orange/25 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 bg-brand-orange/15 rounded-xl flex items-center justify-center shrink-0">
                      <LifeBuoy className="h-5.5 w-5.5 text-orange-700" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-sm text-gray-900 leading-tight">
                        Dedicated Support Helpdesk
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-1 leading-normal max-w-md">
                        Track ongoing tickets, raise refund disputes, contact
                        culinary agents, and get instant resolution.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("support")}
                    className="bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-[11px] px-4 py-2.5 rounded-xl transition shadow-xs hover:shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Helpdesk</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {/* FAQ Collapsible Cards */}
                <div className="space-y-3">
                  <h4 className="font-display font-black text-xs text-gray-400 uppercase tracking-wider">
                    Frequently Asked Questions
                  </h4>
                  <div className="space-y-2">
                    {faqList.map((faq, idx) => {
                      const isExpanded = expandedFaq === idx;
                      return (
                        <div
                          key={idx}
                          className="bg-neutral-50/40 border border-gray-100 rounded-2xl overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedFaq(isExpanded ? null : idx)
                            }
                            className="cursor-pointer w-full flex items-center justify-between p-4 text-xs font-bold text-gray-800 hover:text-gray-950 text-left"
                          >
                            <span>{faq.q}</span>
                            <span className="text-gray-400">
                              {isExpanded ? "−" : "+"}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50/50 pt-2 bg-white">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Concierge Chatbot Widget */}
                <div
                  className="border border-gray-150 rounded-3xl overflow-hidden bg-gray-50"
                  id="support-chatbot-box"
                >
                  {/* Chatbot Header */}
                  <div className="bg-gray-900 p-4 flex items-center gap-3 border-b border-gray-800">
                    <div className="h-9 w-9 bg-brand-orange text-white text-xs font-black rounded-xl flex items-center justify-center animate-bounce">
                      🧑‍🍳
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xs text-white">
                        Quickaa Bite concierge
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] text-gray-400">
                          Gourmet AI Assistant • Online
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chat messages viewport */}
                  <div className="h-64 overflow-y-auto p-4 space-y-3 bg-white">
                    {chatMessages.map((msg) => {
                      const isBot = msg.sender === "bot";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isBot ? "justify-start" : "justify-end"} animate-fade-in`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${isBot ? "bg-neutral-100 text-gray-800 rounded-tl-none" : "bg-brand-orange text-white rounded-tr-none shadow-xs"}`}
                          >
                            <p>{msg.text}</p>
                            <span
                              className={`text-[11px] block text-right mt-1 font-medium ${isBot ? "text-gray-400" : "text-orange-200"}`}
                            >
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {isBotTyping && (
                      <div className="flex justify-start">
                        <div className="bg-neutral-100 text-gray-500 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat controller form */}
                  <form
                    onSubmit={handleSendChat}
                    className="p-3 border-t border-gray-150 bg-neutral-50 flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about orders, payment issues, streaks, coupons..."
                      className="flex-1 text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      maxLength={150}
                    />
                    <button
                      type="submit"
                      className="cursor-pointer bg-brand-orange hover:bg-orange-600 text-white p-3 rounded-xl transition flex items-center justify-center shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && createPortal(
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fade-in"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center border border-gray-100 space-y-6 animate-scale-up animate-duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h4 className="font-display font-black text-lg text-gray-900 leading-tight">
                Are you sure you want to logout?
              </h4>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="cursor-pointer flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-300 text-gray-700 font-extrabold rounded-xl text-xs transition border border-gray-200"
              >
                No
              </button>

              <button
                onClick={handleLogout}
                className="cursor-pointer flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
