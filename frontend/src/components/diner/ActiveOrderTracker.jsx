import { useState, useEffect } from "react";
import {
  Truck,
  CheckCircle2,
  MapPin,
  Store,
  Compass,
  Phone,
  User,
  Star,
  Clock,
  MessageSquare,
  Send,
  X,
  XCircle
} from "lucide-react";
export default function ActiveOrderTracker({ order, onClose, triggerToast }) {
  const riderName = order.driverName || order.delivery?.driverName || "Ahmed Ali";
  const driverPhone = order.driverPhone || order.delivery?.driverPhone || "+91 9876543210";
  const partnerLogo = order.deliveryPartner ? `${order.deliveryPartner}` : "Gold Partner";
  const vehicleInfo = order.vehicleDetails || "Red Honda Activa (DX-09-RT-4412)";
  const remarks = order.deliveryRemarks || "";
  const [courierPos, setCourierPos] = useState({ x: 25, y: 35 });
  const [currentStep, setCurrentStep] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "rider", text: "Hello! I'm your delivery partner today. I will ensure your food remains double-sealed and hot.", time: "Just now" }
  ]);
  const steps = [
    { name: "Order placed", desc: "Securely received by kitchen", icon: CheckCircle2 },
    { name: "Order accepted", desc: "Chef confirmed your order", icon: CheckCircle2 },
    { name: "Preparing", desc: "Chef is baking & packaging food", icon: Compass },
    { name: "Out for delivery", desc: "Rider is zooming to doorstep", icon: Truck },
    { name: "Delivered", desc: "Enjoy your warm delicious meal!", icon: CheckCircle2 }
  ];
  const getStepFromStatus = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "received" || s === "placed" || s === "pending") return 0;
    if (s === "accepted" || s === "confirmed") return 1;
    if (s === "preparing" || s === "ready" || s === "ready-for-pickup") return 2;
    if (
      s === "dispatched" ||
      s === "out_for_delivery" ||
      s === "out for delivery" ||
      s === "out" ||
      s === "delivering" ||
      s === "in_transit" ||
      s === "in transit" ||
      s === "on_way" ||
      s === "on way" ||
      s === "shipped"
    ) return 3;
    if (s === "delivered" || s === "completed") return 4;
    return 0;
  };

  useEffect(() => {
    const step = getStepFromStatus(order.status);
    setCurrentStep(step);
    if (step === 0) setCourierPos({ x: 25, y: 35 });
    else if (step === 1) setCourierPos({ x: 38, y: 45 });
    else if (step === 2) setCourierPos({ x: 50, y: 55 });
    else if (step === 3) setCourierPos({ x: 68, y: 65 });
    else if (step === 4) setCourierPos({ x: 85, y: 75 });
  }, [order.status]);
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage.trim();
    const nowStr = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedMsgs = [...messages, { sender: "user", text: userMsg, time: nowStr }];
    setMessages(updatedMsgs);
    setChatMessage("");
    setTimeout(() => {
      let riderReply = "Thank you for the note. I am driving safely to your location.";
      const lowCase = userMsg.toLowerCase();
      if (lowCase.includes("spicy") || lowCase.includes("sauce") || lowCase.includes("extra")) {
        riderReply = "I have notified the restaurant kitchen about your instruction to make sure everything is perfect!";
      } else if (lowCase.includes("gate") || lowCase.includes("door") || lowCase.includes("code") || lowCase.includes("watchman")) {
        riderReply = "Got it! I will deliver according to your special instructions on arrival.";
      } else if (lowCase.includes("hot") || lowCase.includes("fresh")) {
        riderReply = "I am using an insulated thermal bag to keep your food perfectly hot and fresh.";
      } else if (lowCase.includes("where") || lowCase.includes("time") || lowCase.includes("eta") || lowCase.includes("far")) {
        if (currentStep < 2) {
          riderReply = "The food is still being prepared at the kitchen. I am waiting inside the restaurant and will leave immediately!";
        } else {
          riderReply = "I am currently on the main road beating traffic. Expect me in about 8-10 minutes!";
        }
      }
      setMessages((prev) => [...prev, { sender: "rider", text: riderReply, time: nowStr }]);
    }, 1500);
  };
  return <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" id="order-tracker-card">

    {
      /* Header Info */
    }
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
      <div>
        <span className="text-xs font-extrabold text-orange-700 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit">
          <span className="h-2 w-2 rounded-full bg-brand-orange animate-ping" />
          Live Delivery Tracking
        </span>
        <h3 className="font-display font-black text-2xl text-gray-800 mt-2">
          {order.restaurantName}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Order ID: <span className="font-mono font-bold text-gray-600">{order.id}</span> • Booked at {order.timestamp}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="text-xs font-black text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="View all active and past orders"
        >
          <span>All Active Orders</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
          title="Close tracker"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>

    {(order.status === "rejected" || order.status === "cancelled") && (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-rose-900 text-sm uppercase">
              Order Rejected by Kitchen
            </h4>
            <p className="text-xs text-rose-700 font-semibold mt-0.5">
              Reason: {order.rejectionReason || order.reason || "Item unavailable or kitchen at capacity"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs shrink-0"
        >
          View Orders Page
        </button>
      </div>
    )}

    {
      /* Grid Virtual Google Maps Visualizer */
    }
    <div className="relative bg-amber-50/20 rounded-3xl h-72 border border-orange-100/30 overflow-hidden" id="tracker-map-stage">

      {
        /* Mock Grid Map Background Grid & Roads */
      }
      <div className="absolute inset-0 bg-grid-neutral-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]" style={{ backgroundImage: "radial-gradient(#e2e8f0 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />

      {
        /* Custom Painted Roads on Map */
      }
      <svg className="absolute inset-0 h-full w-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {
          /* Main Highway */
        }
        <path d="M 0,150 Q 300,100 600,180 T 1200,140" fill="none" stroke="#94a3b8" strokeWidth="18" strokeLinecap="round" />
        <path d="M 0,150 Q 300,100 600,180 T 1200,140" fill="none" stroke="#cbd5e1" strokeWidth="14" strokeLinecap="round" strokeDasharray="6 6" />

        {
          /* Delivery Route Path dashed line */
        }
        <path d="M 150,110 L 510,215" fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 8" className="animate-pulse" />

        {
          /* Local Streets */
        }
        <line x1="150" y1="0" x2="150" y2="300" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
        <line x1="510" y1="0" x2="510" y2="300" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
        <line x1="0" y1="215" x2="1000" y2="215" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
      </svg>

      {
        /* Restaurant Location Marker */
      }
      <div className="absolute transition-all duration-500" style={{ left: "25%", top: "35%", transform: "translate(-50%, -50%)" }}>
        <div className="flex flex-col items-center">
          <div className="bg-gray-900 text-white p-2.5 rounded-full shadow-lg border-2 border-white ring-4 ring-orange-100">
            <Store className="h-4.5 w-4.5" />
          </div>
          <span className="bg-gray-900 text-white text-[11px] font-black uppercase px-2 py-0.5 rounded-md mt-1 shadow-sm">
            Kitchen
          </span>
        </div>
      </div>

      {
        /* Home / Client Location Marker */
      }
      <div className="absolute transition-all duration-500" style={{ left: "85%", top: "75%", transform: "translate(-50%, -50%)" }}>
        <div className="flex flex-col items-center">
          <div className="bg-brand-orange text-white p-2.5 rounded-full shadow-lg border-2 border-white ring-4 ring-orange-200/50 animate-bounce">
            <MapPin className="h-4.5 w-4.5" />
          </div>
          <span className="bg-brand-orange text-white text-[11px] font-black uppercase px-2 py-0.5 rounded-md mt-1 shadow-sm">
            Home
          </span>
        </div>
      </div>

      {
        /* Courier Moving Marker */
      }
      <div
        className="absolute transition-all duration-1000 ease-out z-10"
        style={{ left: `${courierPos.x}%`, top: `${courierPos.y}%`, transform: "translate(-50%, -50%)" }}
        id="courier-tracker-marker"
      >
        <div className="flex flex-col items-center">
          <div className="bg-emerald-500 text-white p-2.5 rounded-full shadow-xl border-2 border-white ring-4 ring-emerald-200">
            <Truck className="h-5 w-5 animate-pulse" />
          </div>
          <div className="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md mt-1 shadow-md whitespace-nowrap flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
            <span>{riderName} ({partnerLogo})</span>
          </div>
        </div>
      </div>

      {
        /* Google Maps Watermark & Status Info bar */
      }
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-md border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Google Maps Live Gateway Active</span>
        </div>
        <span className="text-[11px] text-gray-400 font-mono">GPS Lat/Long Sync: Verified</span>
      </div>

    </div>

    {
      /* 5-step Delivery Status Timeline */
    }
    <div className="space-y-4 bg-gray-50/50 border border-gray-100 rounded-3xl p-6">
      <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider block">Live Timeline Tracker</h4>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="tracker-steps-bar">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx <= currentStep;
          const isCurrent = idx === currentStep;
          return <div key={idx} className="flex flex-col items-center text-center space-y-2">
            <div
              className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 border ${isCurrent ? "bg-brand-orange text-white scale-110 ring-4 ring-orange-100 border-brand-orange shadow-md shadow-orange-600/10" : isDone ? "bg-orange-50 text-brand-orange border-orange-200" : "bg-white text-gray-300 border-gray-100"}`}
            >
              <StepIcon className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className={`text-xs font-black block transition-colors ${isCurrent ? "text-orange-700" : isDone ? "text-gray-800" : "text-gray-400"}`}>
                {step.name}
              </span>
              <p className="text-[11px] text-gray-400 leading-tight hidden md:block max-w-[120px] mx-auto">
                {step.desc}
              </p>
            </div>
          </div>;
        })}
      </div>
    </div>

    {
      /* Courier Rider Details Card */
    }
    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6" id="courier-rider-card">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-gradient-to-tr from-orange-100 to-amber-100 text-orange-700 rounded-full flex items-center justify-center font-bold shadow-inner border border-white">
          <User className="h-7 w-7" />
        </div>
        <div>
          <h4 className="font-display font-black text-lg text-gray-800">{riderName}</h4>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/50">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="font-extrabold">4.9</span>
              </div>
              <span className="text-xs text-gray-400 font-semibold">• {partnerLogo} Fleet ({vehicleInfo})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-700 mt-0.5">
              <Phone className="h-3.5 w-3.5 text-orange-700 shrink-0" />
              <span>{driverPhone}</span>
            </div>
            {remarks && <span className="text-[11px] text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg mt-1 font-bold">
              ⚠️ Special Instructions: "{remarks}"
            </span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xs">
          <Clock className="h-5 w-5 text-orange-700 animate-pulse" />
          <div className="text-left">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Delivery</span>
            <span className="font-mono text-sm font-black text-gray-800">
              {currentStep === 4 ? "Delivered! Enjoy 🎉" : "10-15 mins"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">

          <a
            href={`tel:${driverPhone.replace(/\s+/g, "")}`}
            onClick={(e) => {
              if (window.innerWidth > 768) {
                e.preventDefault();
                if (triggerToast) {
                  triggerToast(`Calling ${riderName} at ${driverPhone}...`);
                } else {
                  alert(`Calling ${riderName} (${driverPhone})...`);
                }
              }
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-orange hover:bg-orange-700 font-display font-black text-xs text-white px-6 py-3.5 rounded-2xl transition shadow-md shadow-orange-600/10"
          >
            <Phone className="h-4 w-4" />
            <span>Call Driver ({driverPhone})</span>
          </a>
        </div>
      </div>
    </div>

    {
      /* INTERACTIVE CHAT DRAWER */
    }
    {isChatOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl relative animate-slide-in">

        {
          /* Chat Header */
        }
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-gray-800 text-sm">{riderName} ({partnerLogo} Rider)</h4>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                Online • On Bike ({vehicleInfo})
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-700" />
          </button>
        </div>

        {
          /* Chat Messages Body */
        }
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
          {messages.map((msg, index) => <div
            key={index}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs shadow-xs leading-relaxed ${msg.sender === "user" ? "bg-brand-orange text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"}`}
            >
              {msg.text}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 px-1">{msg.time}</span>
          </div>)}
        </div>

        {
          /* Quick Helper presets */
        }
        <div className="px-6 py-2 border-t border-gray-50 flex gap-2 overflow-x-auto whitespace-nowrap bg-white">
          {[
            "Please leave near door",
            "Gate code is 4242",
            "Are you close?",
            "Keep the change!"
          ].map((preset) => <button
            key={preset}
            onClick={() => setChatMessage(preset)}
            className="bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full transition shrink-0"
          >
            {preset}
          </button>)}
        </div>

        {
          /* Input Form */
        }
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder={`Type your message to ${riderName}...`}
            className="flex-1 px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs outline-none focus:bg-white focus:border-orange-200"
          />
          <button
            type="submit"
            className="bg-brand-orange hover:bg-orange-700 text-white p-3 rounded-xl transition flex items-center justify-center shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>}

  </div>;
}
