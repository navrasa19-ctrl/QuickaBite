import { useState, useEffect } from "react";
import {
  Trash2,
  Send,
  Tag,
  AlertCircle,
  Sparkles,
  Smartphone,
  MessageSquare,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  Mail
} from "lucide-react";
import { adminService } from "../../api/adminService";

export default function NotificationsTab({ notifications, setNotifications, triggerToast }) {
  const [channel, setChannel] = useState("push");
  const [category, setCategory] = useState("promotions");
  const [targetSegment, setTargetSegment] = useState("All Diners");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [amount, setAmount] = useState("");
  const [whatsappTemplate, setWhatsappTemplate] = useState("welcome_promo");
  const [whatsappVar1, setWhatsappVar1] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("2026-06-28");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [tabFilter, setTabFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [customNotifs, setCustomNotifs] = useState([]);

  const DEFAULT_CUSTOM_NOTIFS = [
    {
      id: "notif-sch-1",
      type: "push",
      category: "promotions",
      title: "Weekend Feasts Ahead! 🍕",
      message: "Double up your rewards this weekend! Order above ₹ 100 and get a free chocolate fudge pot.",
      targetSegment: "All Diners",
      scheduledTime: "2026-06-28 12:00",
      status: "scheduled",
      recipientsCount: 4850
    },
    {
      id: "notif-sch-2",
      type: "whatsapp",
      category: "offers",
      message: "Hello Suhail Al Mazrouei, our premium bento packages are now loaded for your Ministry annual gala reviewing.",
      targetSegment: "Corporate Catering",
      scheduledTime: "2026-06-27 15:30",
      status: "scheduled",
      recipientsCount: 1
    },
    {
      id: "notif-sch-3",
      type: "sms",
      category: "wallet",
      message: "Exclusive: Get ₹ 20 instant cashback in your QuikaBite wallet using premium credit cards. Valid till Sunday!",
      targetSegment: "VIP Members",
      scheduledTime: "2026-06-29 09:00",
      status: "scheduled",
      recipientsCount: 240
    },
    {
      id: "notif-sch-4",
      type: "push",
      category: "offers",
      title: "Royal Biryani Hub Flash Deal! 🏷️",
      message: "Flash Sale: Order any Biryani and get 50% flat discount with coupon ROYAL50. Valid for 2 hours.",
      targetSegment: "All Diners",
      scheduledTime: "2026-06-26 18:00",
      status: "sent",
      recipientsCount: 5200,
      openRate: "42.8%",
      clickRate: "15.4%",
      discountCode: "ROYAL50"
    },
    {
      id: "notif-sch-5",
      type: "sms",
      category: "orders",
      message: "Your QuikaBite order #9832 has been picked up by our premium gourmet partner porter. Track here: dxb.eats/9832",
      targetSegment: "All Diners",
      scheduledTime: "2026-06-26 14:22",
      status: "sent",
      recipientsCount: 1250,
      openRate: "98.2%",
      clickRate: "88.5%"
    },
    {
      id: "notif-sch-6",
      type: "whatsapp",
      category: "offers",
      message: "Hi Fatima Al Qasimi, we just published a brand new slider station custom menu for your Sharjah Youth Council birthday event!",
      targetSegment: "Party Bookings",
      scheduledTime: "2026-06-25 10:15",
      status: "sent",
      recipientsCount: 1,
      openRate: "100%",
      clickRate: "100%"
    }
  ];

  useEffect(() => {
    const loadNotifs = async () => {
      const saved = await adminService.getCustomNotifications();
      if (saved && saved.length > 0) {
        setCustomNotifs(saved);
      } else {
        setCustomNotifs(DEFAULT_CUSTOM_NOTIFS);
      }
    };
    loadNotifs();
  }, []);

  useEffect(() => {
    if (customNotifs.length > 0) {
      adminService.saveCustomNotifications(customNotifs);
    }
  }, [customNotifs]);
  const SEGMENT_ESTIMATES = {
    "All Diners": 5200,
    "VIP Members": 240,
    "Corporate Catering": 18,
    "Party Bookings": 45,
    "Franchise Queries": 12
  };
  // const WHATSAPP_TEMPLATES = {
  //   "welcome_promo": {
  //     name: "Welcome Onboard Gift (Marketing)",
  //     body: "Hi {{1}}, welcome to QuikaBite! 🌟 Use code GOURMET50 to save 50% off on your first cloud kitchen delivery."
  //   },
  //   "corporate_pitch": {
  //     name: "Corporate Catering Folio (Utility)",
  //     body: "Dear {{1}}, thank you for choosing QuikaBite. Your custom catalog for segment {{2}} is ready for executive review. Let us know if we should hop on a call!"
  //   },
  //   "reengagement_cashback": {
  //     name: "Re-engagement Wallet Ping (Marketing)",
  //     body: "Hey {{1}}! We missed you. 💖 We credited {{2}} directly into your active QuikaBite wallet. Treat yourself tonight!"
  //   }
  // };
  // const getRenderedMessage = () => {
  //   if (channel !== "whatsapp") return message || "Type message text...";
  //   const tpl = WHATSAPP_TEMPLATES[whatsappTemplate];
  //   if (!tpl) return "Type WhatsApp text...";
  //   let rendered = tpl.body;
  //   rendered = rendered.replace("{{1}}", whatsappVar1 || "[Lead Name]");
  //   if (whatsappTemplate === "corporate_pitch") {
  //     rendered = rendered.replace("{{2}}", targetSegment);
  //   } else if (whatsappTemplate === "reengagement_cashback") {
  //     rendered = rendered.replace("{{2}}", amount || "₹ 15");
  //   }
  //   return rendered;
  // };
  const handleCreateNotification = (e) => {
    e.preventDefault();
    if (channel === "push" && !title) {
      triggerToast("Please provide a Title for Push alert!");
      return;
    }
    const finalMessage = getRenderedMessage();
    if (!finalMessage || finalMessage.includes("[Lead Name]")) {
      triggerToast("Please write a message or fill required template variables.");
      return;
    }
    const finalTime = isScheduled ? `${scheduledDate} ${scheduledTime}` : (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substr(0, 16);
    const newNotif = {
      id: `custom-notif-${Date.now()}`,
      type: channel,
      category,
      title: channel === "push" ? title : void 0,
      message: finalMessage,
      targetSegment,
      scheduledTime: finalTime,
      status: isScheduled ? "scheduled" : "sent",
      recipientsCount: SEGMENT_ESTIMATES[targetSegment] || 1,
      discountCode: discountCode || void 0,
      amount: amount || void 0
    };
    if (newNotif.status === "sent" && channel === "push") {
      const appNotif = {
        id: `notif-${Date.now()}`,
        category,
        title,
        message: finalMessage,
        timestamp: "Just now",
        isRead: false,
        discountCode: discountCode || void 0,
        amount: amount || void 0
      };
      setNotifications((prev) => [appNotif, ...prev]);
    }
    setCustomNotifs((prev) => [newNotif, ...prev]);
    triggerToast(
      isScheduled ? `Notification successfully scheduled for ${finalTime}!` : `Multi-channel broadcast dispatched to ${newNotif.recipientsCount} recipients!`
    );
    setTitle("");
    setMessage("");
    setDiscountCode("");
    setAmount("");
    setWhatsappVar1("");
    setIsScheduled(false);
  };
  const handleDeleteNotif = (id) => {
    setCustomNotifs((prev) => prev.filter((n) => n.id !== id));
    triggerToast("Alert removed from outbox.");
  };
  const handleTriggerNow = (id) => {
    setCustomNotifs((prev) => prev.map((n) => {
      if (n.id === id) {
        if (n.type === "push") {
          const appNotif = {
            id: `notif-${Date.now()}`,
            category: n.category,
            title: n.title || "Special Promotion!",
            message: n.message,
            timestamp: "Just now",
            isRead: false,
            discountCode: n.discountCode,
            amount: n.amount
          };
          setNotifications((prevNotifs) => [appNotif, ...prevNotifs]);
        }
        return {
          ...n,
          status: "sent",
          scheduledTime: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substr(0, 16)
        };
      }
      return n;
    }));
    triggerToast("Scheduled broadcast triggered instantly!");
  };
  const filteredNotifs = customNotifs.filter((n) => {
    const matchesTab = tabFilter === "all" || n.type === tabFilter;
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    return matchesTab && matchesStatus;
  });
  return <div className="space-y-6 animate-fade-in" id="notification-center-module">

    {
      /* HEADER SECTION WITH STATS */
    }
    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-neutral-400">Push Outbox</span>
            <span className="text-lg font-black text-neutral-900">
              {customNotifs.filter((n) => n.type === "push" && n.status === "sent").length} Broadcasts
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-neutral-400">SMS & WhatsApp</span>
            <span className="text-lg font-black text-neutral-900">
              {customNotifs.filter((n) => n.type !== "push" && n.status === "sent").length} Dispatched
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-150 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-orange-50 text-orange-700 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase text-neutral-400">Scheduled Queue</span>
            <span className="text-lg font-black text-neutral-900">
              {customNotifs.filter((n) => n.status === "scheduled").length} Campaigns Pending
            </span>
          </div>
        </div>
      </div> */}

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      {
        /* LEFT COLUMN: MULTI-CHANNEL WIZARD */
      }
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-150 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-orange-700" />
            <span>Multi-Channel Dispatcher</span>
          </h3>
          <p className="text-[10px] font-semibold text-neutral-400">Compose, target, and schedule push notifications, SMS text, or Meta WhatsApp pings.</p>
        </div>

        <form onSubmit={handleCreateNotification} className="space-y-4 text-left">

          {
            /* CHANNEL SELECTOR */
          }
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Delivery Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "push", label: "Push App", icon: Smartphone, color: "hover:text-indigo-600 hover:border-indigo-400 border-indigo-200 bg-indigo-50/20 text-indigo-700" },
                { id: "sms", label: "SMS Carrier", icon: Mail, color: "hover:text-blue-600 hover:border-blue-400 border-blue-200 bg-blue-50/20 text-blue-700" }
              ].map((ch) => {
                const Icon = ch.icon;
                const isSel = channel === ch.id;
                return <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setChannel(ch.id);
                    if (ch.id === "whatsapp") {
                      setWhatsappVar1("");
                    }
                  }}
                  className={`py-2 px-3 rounded-xl border font-black text-[10px] uppercase transition flex flex-col items-center gap-1 cursor-pointer ${isSel ? "bg-neutral-900 text-white border-neutral-900 shadow-sm" : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{ch.label}</span>
                </button>;
              })}
            </div>
          </div>

          {
            /* AUDIENCE SEGMENT TARGETING */
          }
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Target Segment</label>
              <select
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
              >
                <option value="All Diners">All Registered Diners</option>
                <option value="VIP Members">VIP Silver & Gold</option>
                <option value="Corporate Catering">Corporate Contacts</option>
                <option value="Party Bookings">Party Event Leads</option>
                <option value="Franchise Queries">Franchise Operators</option>
              </select>
              <p className="text-[8.5px] text-neutral-400 font-bold px-1">
                Target Size: <span className="font-mono text-neutral-700">{SEGMENT_ESTIMATES[targetSegment]} devices/numbers</span>
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Feed Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
              >
                <option value="promotions">Promotions 📢</option>
                <option value="offers">Cuisine Offers 🏷️</option>
                <option value="wallet">Wallet Cashback 💳</option>
                <option value="orders">Orders & Logistics 📦</option>
              </select>
            </div>
          </div>

          {
            /* PUSH-SPECIFIC TITLE */
          }
          {channel === "push" && <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Short Alert Title *</label>
            <input
              type="text"
              required={channel === "push"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biryani Fest Double Points! 🌶️"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>}

          {
            /* MESSAGE / CONTENT WRITER */
          }
          {channel !== "whatsapp" ? <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Message Content *</label>
              {channel === "sms" && <span className="text-[9px] font-mono font-bold text-neutral-400">
                {message.length}/160 chars
              </span>}
            </div>
            <textarea
              required={channel !== "whatsapp"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={channel === "sms" ? "Type carrier text message. Maximum of 160 characters for standard carrier packages." : "Write short description details of the promotion or coupon code."}
              rows={3}
              maxLength={channel === "sms" ? 160 : 250}
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div> : (
            // WHATSAPP META TEMPLATE CONTROLS
            <div className="space-y-3 bg-green-50/40 p-3 rounded-2xl border border-green-100">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-green-700">Meta WhatsApp Template</label>
                <select
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full bg-white border border-neutral-150 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-green-500"
                >
                  {Object.entries(WHATSAPP_TEMPLATES).map(([key, t]) => <option key={key} value={key}>{t.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-green-700">Template Dynamic Value (Variable 1)</label>
                <input
                  type="text"
                  value={whatsappVar1}
                  onChange={(e) => setWhatsappVar1(e.target.value)}
                  placeholder="e.g. Fatima Al Qasimi or Suhail"
                  className="w-full bg-white border border-neutral-150 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-green-500"
                />
              </div>
            </div>
          )}

          {
            /* AUXILIARY REWARDS (COUPONS & CASHBACKS) */
          }
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Coupon attachment (Optional)</label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="e.g. DOUBLE100"
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-brand-orange"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">Credit Amount (Optional)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. ₹ 15"
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {
            /* SCHEDULING CONTROLS */
          }
          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-150 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-700">Delivery Schedule</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-orange" />
                <span className="ml-2 text-[9px] font-extrabold text-neutral-500 uppercase">Later</span>
              </label>
            </div>

            {isScheduled && <div className="grid grid-cols-2 gap-2 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-neutral-400">Release Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-white border border-neutral-150 rounded-lg p-2 text-xs font-semibold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-neutral-400">Release Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-white border border-neutral-150 rounded-lg p-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>}
          </div>

          {
            /* SUBMIT BROADCAST */
          }
          <button
            type="submit"
            className="w-full bg-neutral-950 hover:bg-neutral-900 text-white font-black py-3 rounded-xl text-xs transition mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <Send className="h-4 w-4 text-orange-400" />
            <span>{isScheduled ? "Schedule Outbound Campaign" : "Dispatch Live Broadcast"}</span>
          </button>

        </form>

      </div>

      {
        /* RIGHT COLUMN: QUEUES & INTERACTIVE PREVIEW FRAME */
      }
      <div className="lg:col-span-7 space-y-5">

        {
          /* INTERACTIVE MOBILE PREVIEW FRAME */
        }
        <div className="bg-neutral-950 p-4 rounded-3xl border-4 border-neutral-800 shadow-2xl relative overflow-hidden" style={{ minHeight: "190px" }}>
          {
            /* Phone Notch */
          }
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-neutral-800 w-24 h-4.5 rounded-b-xl z-20" />

          {
            /* App screen name */
          }
          <div className="flex justify-between items-center text-[8.5px] text-neutral-500 font-mono mb-3.5 pt-1 font-bold">
            <span>Dubai Telecom 5G</span>
            <span>02:40 AM</span>
          </div>

          {
            /* CHANNEL SPECIFIC LIVE PREVIEW BUBBLE */
          }
          <div className="p-3">
            {channel === "push" && <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 text-left text-white shadow-lg space-y-1.5 max-w-sm mx-auto animate-fade-in">
              <div className="flex justify-between items-center text-[9px] text-neutral-400 font-bold">
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 rounded-md bg-emerald-600 flex items-center justify-center text-[9px] text-white font-black">QB</span>
                  <span>QuikaBite App</span>
                </span>
                <span>Just now</span>
              </div>
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-xs text-white">{title || "Weekend Feasts! 🍕"}</h5>
                <p className="text-[10px] text-neutral-300 font-medium leading-relaxed">{message || "Your meal offers are waiting inside..."}</p>
              </div>
              {(discountCode || amount) && <div className="flex gap-2 pt-1 border-t border-neutral-800/80">
                {discountCode && <span className="text-[8px] font-black bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-mono">
                  CODE: {discountCode}
                </span>}
                {amount && <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Wallet +{amount}
                </span>}
              </div>}
            </div>}

            {channel === "sms" && <div className="bg-neutral-900/95 border border-neutral-800 rounded-3xl p-3 text-left shadow-lg max-w-sm mx-auto animate-fade-in space-y-2">
              <div className="text-center text-[9px] text-neutral-500 font-bold">Text Message • Dubai-Carrier</div>
              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 text-[10px] font-semibold leading-relaxed ml-6 max-w-[85%]">
                {message || "Type SMS text..."}
              </div>
              <div className="text-right text-[8px] text-neutral-500 font-bold pr-1">Delivered</div>
            </div>}

            {channel === "whatsapp" && <div className="bg-[#E5DDD5] rounded-3xl p-3 text-left shadow-lg max-w-sm mx-auto animate-fade-in space-y-2 border border-neutral-300" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>

              {
                /* Whatsapp chat header */
              }
              <div className="bg-[#075E54] text-white p-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase">
                <div className="h-5 w-5 rounded-full bg-emerald-700 flex items-center justify-center text-[9px]">🟢</div>
                <div>
                  <h6 className="leading-tight font-black">QuikaBite Business</h6>
                  <span className="text-[8px] opacity-75 lowercase font-semibold">Official Business Account</span>
                </div>
              </div>

              <div className="bg-white text-neutral-800 rounded-xl rounded-tl-none p-3 text-[10.5px] font-semibold leading-relaxed shadow-sm max-w-[90%] space-y-1.5">
                {/* <p>{getRenderedMessage()}</p> */}
                <div className="text-right text-[8px] text-neutral-400 font-mono">02:40 AM ✓✓</div>
              </div>
            </div>}
          </div>

          {
            /* Custom overlay instructions badge */
          }
          <div className="absolute bottom-2 right-4 text-[8px] font-mono font-black uppercase text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            Real-time Sandbox Simulator
          </div>
        </div>

        {
          /* ACTIVE QUEUES AND FILTERS GRID */
        }
        <div className="bg-white p-5 rounded-3xl border border-neutral-150 shadow-xs space-y-4">

          {
            /* Tab Controls & Filters */
          }
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">Campaign Log & Queue</h3>
              <p className="text-[9.5px] font-semibold text-neutral-400">Total multi-channel broadcasts ({customNotifs.length})</p>
            </div>

            {
              /* Filtering Controls */
            }
            <div className="flex flex-wrap gap-1.5">
              <select
                value={tabFilter}
                onChange={(e) => setTabFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-lg p-1.5 text-[9.5px] font-bold outline-none"
              >
                <option value="all">All Channels</option>
                <option value="push">Push Only</option>
                <option value="sms">SMS Only</option>
                <option value="whatsapp">WhatsApp Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-lg p-1.5 text-[9.5px] font-bold outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled Queue</option>
                <option value="sent">Dispatched Sent</option>
              </select>
            </div>
          </div>

          {
            /* LOGS LIST */
          }
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredNotifs.length === 0 ? <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl">
              <AlertCircle className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">No matching campaigns found</p>
            </div> : filteredNotifs.map((n) => {
              const isScheduledItem = n.status === "scheduled";
              let channelPill = "bg-indigo-50 text-indigo-700 border-indigo-200";
              if (n.type === "sms") channelPill = "bg-blue-50 text-blue-700 border-blue-200";
              if (n.type === "whatsapp") channelPill = "bg-green-50 text-green-700 border-green-200";
              let catColor = "bg-rose-50 text-rose-600 border-rose-200";
              if (n.category === "wallet") catColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
              if (n.category === "orders") catColor = "bg-sky-50 text-sky-600 border-sky-200";
              if (n.category === "offers") catColor = "bg-orange-50 text-orange-700 border-orange-200";
              return <div
                key={n.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row justify-between items-start gap-4 ${isScheduledItem ? "border-orange-100 bg-orange-50/20 hover:bg-orange-50/45" : "border-neutral-100 bg-neutral-50 hover:bg-white hover:shadow-xs"}`}
              >
                <div className="space-y-2 text-left flex-1">

                  <div className="flex flex-wrap items-center gap-1.5">
                    {
                      /* Channel Badge */
                    }
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${channelPill}`}>
                      {n.type}
                    </span>

                    {
                      /* Category Badge */
                    }
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${catColor}`}>
                      {n.category}
                    </span>

                    <span className="text-[9.5px] text-neutral-400 font-mono font-bold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {n.scheduledTime}
                    </span>

                    {isScheduledItem && <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                      Pending Schedule
                    </span>}
                  </div>

                  {
                    /* Title & Body */
                  }
                  <div className="space-y-0.5">
                    {n.title && <h4 className="text-xs font-black text-neutral-900">{n.title}</h4>}
                    <p className="text-[10px] font-semibold text-neutral-500 leading-relaxed">{n.message}</p>
                  </div>

                  {
                    /* Recipients & Analytics */
                  }
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-200/50">
                    <span className="text-[9px] font-bold text-neutral-500 flex items-center gap-1">
                      <Users className="h-3 w-3 text-neutral-400" />
                      <span>Target: {n.targetSegment} ({n.recipientsCount} diner(s))</span>
                    </span>

                    {n.discountCode && <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200/50 flex items-center gap-1 font-mono">
                      <Tag className="h-3 w-3" />
                      <span>CODE: {n.discountCode}</span>
                    </span>}

                    {n.openRate && <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200/40 font-mono flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Open: {n.openRate}</span>
                    </span>}

                    {n.clickRate && <span className="text-[9px] font-black bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200/40 font-mono flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>CTR: {n.clickRate}</span>
                    </span>}
                  </div>

                </div>

                {
                  /* Action controllers */
                }
                <div className="flex gap-1.5 shrink-0 self-start sm:self-center">
                  {isScheduledItem && <button
                    onClick={() => handleTriggerNow(n.id)}
                    className="p-1.5 bg-neutral-900 hover:bg-neutral-950 text-white rounded-xl transition cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5"
                    title="Dispatch Immediately"
                  >
                    <Send className="h-3 w-3 text-orange-400" />
                    <span>Trigger</span>
                  </button>}
                  <button
                    onClick={() => handleDeleteNotif(n.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Delete / Cancel Campaign"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

              </div>;
            })}
          </div>

        </div>

      </div>

    </div>

  </div>;
}
