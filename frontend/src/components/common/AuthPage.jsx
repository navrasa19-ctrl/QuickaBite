import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone as PhoneIcon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ChefHat,
  Truck,
  Gift,
  MessageCircle,
  Loader2,
} from "lucide-react";
import QuikaBiteLogo from "./QuikaBiteLogo";
import { FaUtensils, FaUserTie } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
export default function AuthPage({
  onLoginSuccess,
  triggerToast,
  onBackToHome,
}) {
  const { sendLoginOtp, verifyLoginOtp, sendSignupOtp, verifySignupOtp, resendOtp } = useAuth();

  const [currentScreen, setCurrentScreen] = useState("welcome");
  const [slideDirection, setSlideDirection] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpChannel, setOtpChannel] = useState("call");
  const [selectedRole, setSelectedRole] = useState("user");
  // pendingUser tracks { phone, name, role, otpChannel, flow: "login"|"signup" }
  const [pendingUser, setPendingUser] = useState(null);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [otpTimer, setOtpTimer] = useState(59);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    let interval;
    if (currentScreen === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1e3);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [currentScreen, otpTimer]);
  const navigateTo = (screen, direction = "next") => {
    setSlideDirection(direction === "next" ? 1 : -1);
    setCurrentScreen(screen);
  };
  const slides = [
    {
      title: "Handcrafted Gourmet Cooking",
      description:
        "Experience 5-star culinary mastery prepared in state-of-the-art kitchens and handcrafted to perfection by expert chefs.",
      icon: <ChefHat className="h-16 w-16 text-orange-700" />,
      colorClass: "bg-orange-50 text-orange-700 border-orange-100",
      illustration: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute h-40 w-40 rounded-full border-4 border-dashed border-orange-200"
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-28 w-28 bg-white rounded-3xl shadow-xl border border-orange-100 flex items-center justify-center z-10"
          >
            <ChefHat className="h-14 w-14 text-orange-700" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-md"
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          </motion.div>
          {/* Decorative floating ingredients / stars */}
          <div className="absolute top-8 left-1/4 h-3 w-3 rounded-full bg-brand-orange/40 animate-pulse" />
          <div className="absolute bottom-10 right-1/4 h-4 w-4 rounded-full bg-amber-400/40 animate-pulse delay-500" />
        </div>
      ),
    },
    {
      title: "Express Hot-Thermal Delivery",
      description:
        "Our custom thermal bags and real-time mapping dispatch team ensure your gourmet meals arrive piping hot and fresh.",
      icon: <Truck className="h-16 w-16 text-emerald-600" />,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
      illustration: (
        <div className="relative w-full h-48 flex items-center justify-center overflow-hidden">
          {/* Delivery Road Line */}
          <div className="absolute bottom-12 left-0 right-0 h-1 bg-gray-100 flex justify-between px-4">
            <div className="h-1 w-8 bg-gray-200 rounded-full" />
            <div className="h-1 w-8 bg-gray-200 rounded-full" />
            <div className="h-1 w-8 bg-gray-200 rounded-full" />
          </div>
          <motion.div
            animate={{ x: [-80, 80, -80] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-28 w-28 bg-white rounded-3xl shadow-xl border border-emerald-100 flex flex-col items-center justify-center z-10"
          >
            <Truck className="h-12 w-12 text-emerald-600" />
            <div className="flex gap-1 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce delay-100" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce delay-200" />
            </div>
          </motion.div>
          {/* Speed Indicator */}
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], x: [10, -10, 10] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-10 right-10 flex flex-col gap-1"
          >
            <div className="h-1 w-12 bg-emerald-200 rounded-full" />
            <div className="h-1 w-8 bg-emerald-300 rounded-full align-end" />
          </motion.div>
        </div>
      ),
    },
    {
      title: "Premium Gourmet Loyalty",
      description:
        "Unlock luxury coupon code tiers, collect Gourmet points, and receive complimentary appetizers with every premium dispatch.",
      icon: <Gift className="h-16 w-16 text-purple-600" />,
      colorClass: "bg-purple-50 text-purple-600 border-purple-100",
      illustration: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-28 w-28 bg-white rounded-3xl shadow-xl border border-purple-100 flex items-center justify-center z-10"
          >
            <Gift className="h-14 w-14 text-purple-600" />
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-3 -left-3 bg-purple-600 text-white p-2 rounded-full shadow-md"
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          </motion.div>
          {/* Confetti Elements */}
          <div className="absolute top-6 left-1/3 w-2 h-2 rounded-full bg-pink-400 animate-ping" />
          <div className="absolute bottom-12 right-1/3 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping delay-300" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-yellow-400 rotate-45" />
          <div className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-blue-400 rounded-xs" />
        </div>
      ),
    },
  ];
  useEffect(() => {
    let timer;
    if (currentScreen === "welcome") {
      timer = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % slides.length);
      }, 5e3);
    }
    return () => clearInterval(timer);
  }, [currentScreen]);
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      triggerToast("Please enter your phone number.");
      return;
    }
    const isPhoneAdmin = phone.includes("9999");
    const isPhoneManager = phone.includes("8888");
    const assignedRole =
      selectedRole === "admin" || isPhoneAdmin
        ? "admin"
        : selectedRole === "manager" || isPhoneManager
          ? "manager"
          : "user";

    const channelLabel =
      otpChannel === "whatsapp"
        ? "WhatsApp"
        : otpChannel === "call"
          ? "Voice Call"
          : "SMS";

    setIsLoading(true);
    try {
      const res = await sendLoginOtp(phone, otpChannel, assignedRole);
      const sessionId = res?.data?.sessionId || "mock-session-id";
      setPendingUser({ phone, role: assignedRole, otpChannel, flow: "login", sessionId });
      setOtpTimer(59);
      setCanResendOtp(false);
      setOtpValues(["", "", "", "", "", ""]);
      triggerToast(`Security OTP sent to your phone via ${channelLabel}`);
      navigateTo("otp", "next");
    } catch (err) {
      triggerToast("Failed to send OTP. Please try again.");
      console.error("sendLoginOtp error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      triggerToast("Please complete all registration fields.");
      return;
    }

    const channelLabel =
      otpChannel === "whatsapp"
        ? "WhatsApp"
        : otpChannel === "call"
          ? "Voice Call"
          : "SMS";

    setIsLoading(true);
    try {
      const res = await sendSignupOtp(name, phone, otpChannel);
      const sessionId = res?.data?.sessionId || "mock-session-id";
      setPendingUser({ name, phone, role: "user", otpChannel, flow: "signup", sessionId });
      setOtpTimer(59);
      setCanResendOtp(false);
      setOtpValues(["", "", "", "", "", ""]);
      triggerToast(`Verification code dispatched via ${channelLabel}!`);
      navigateTo("otp", "next");
    } catch (err) {
      triggerToast("Failed to send OTP. Please try again.");
      console.error("sendSignupOtp error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleOtpChange = (index, val) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    if (!cleaned) {
      const updated2 = [...otpValues];
      updated2[index] = "";
      setOtpValues(updated2);
      return;
    }
    // If pasted full 6-digit OTP code or multiple digits
    if (cleaned.length >= 6) {
      const digits = cleaned.slice(0, 6).split("");
      const newOtp = ["", "", "", "", "", ""];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpValues(newOtp);
      otpRefs[5].current?.focus();
      return;
    }
    const lastChar = cleaned[cleaned.length - 1];
    const updated = [...otpValues];
    updated[index] = lastChar;
    setOtpValues(updated);
    if (index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };
  const handleOtpVerify = async () => {
    const enteredOtp = otpValues.join("");
    if (enteredOtp.length < 6) {
      triggerToast("Please enter the complete 6-digit verification code.");
      return;
    }

    const { phone: pPhone, name: pName, role: pRole, flow, sessionId } = pendingUser || {};

    setIsLoading(true);
    try {
      let data;
      if (flow === "signup") {
        data = await verifySignupOtp(pName, pPhone, enteredOtp, sessionId);
      } else {
        data = await verifyLoginOtp(pPhone, enteredOtp, pRole, sessionId);
      }

      const roleLabel =
        data.role === "admin"
          ? "Administrator"
          : data.role === "manager"
            ? "Operations Manager"
            : "Diner";
      triggerToast(`Verification complete! Welcome ${roleLabel}!`);
      onLoginSuccess(data.profile);
    } catch (err) {
      let errorMsg = "Invalid OTP. Please check the code and try again.";
      if (err.response) {
        errorMsg = err.response.data?.message || "Verification failed. Please check the code and try again.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      triggerToast(errorMsg);
      console.error("verifyOtp error:", err);
      setOtpValues(["", "", "", "", "", ""]);
      otpRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendOtp = async () => {
    setOtpTimer(59);
    setCanResendOtp(false);
    setOtpValues(["", "", "", "", "", ""]);
    otpRefs[0].current?.focus();

    const channelLabel =
      pendingUser?.otpChannel === "whatsapp"
        ? "WhatsApp"
        : pendingUser?.otpChannel === "call"
          ? "Voice Call"
          : "SMS";

    try {
      const res = await resendOtp(
        pendingUser?.phone,
        pendingUser?.otpChannel || "call",
        pendingUser?.flow || "login",
        pendingUser?.name || ""
      );
      const newSessionId = res?.data?.sessionId || pendingUser?.sessionId;
      setPendingUser((prev) => ({
        ...prev,
        sessionId: newSessionId,
      }));
      triggerToast(`Fresh verification OTP code dispatched to your phone via ${channelLabel}!`);
    } catch (err) {
      triggerToast("Failed to resend OTP. Please try again.");
      console.error("resendOtp error:", err);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Absolute Decorative Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Auth Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 min-h-[620px] max-h-[850px]">
        {/* LEFT COLUMN: Premium Dynamic Visual Onboarding (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-orange-950 p-10 flex-col justify-between text-white relative overflow-hidden border-r border-neutral-800">
          {/* Subtle grid pattern overlay */}
          <div
            style={{ backgroundColor: "#eb5555", color: "#ff2e2e" }}
            className="absolute inset-0 bg-[linear-gradient(to_right,#FF6B35_1px,transparent_1px),linear-gradient(to_bottom,#FF6B35_1px,transparent_1px)] bg-[size:24px_24px] opacity-15"
          />

          {/* Luxury Logo Branding */}
          <div className="z-10 relative w-fit">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/25 flex items-center">
              <QuikaBiteLogo size="sm" />
            </div>
          </div>

          {/* Center Illustration carousel block */}
          <div className="my-auto py-6 flex flex-col items-center text-center z-10 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={carouselIndex}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.5 }}
                className="w-full space-y-6"
              >
                {/* Illustration Asset Box */}
                <div
                  style={{ backgroundColor: "#ffffff" }}
                  className="rounded-3xl p-4 bg-neutral-900/40 backdrop-blur-md border border-neutral-800 shadow-xl max-w-sm mx-auto"
                >
                  {slides[carouselIndex].illustration}
                </div>

                {/* Onboarding text */}
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3
                    style={{ backgroundColor: "#b90000" }}
                    className="font-display font-black text-xl tracking-tight text-white"
                  >
                    {slides[carouselIndex].title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    {slides[carouselIndex].description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Dots Indicator */}
            <div className="flex gap-2.5 mt-8 justify-center">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${carouselIndex === idx ? "w-8 bg-brand-orange" : "w-2 bg-neutral-700 hover:bg-neutral-600"}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer Quality Badges */}
        </div>

        {/* RIGHT COLUMN: Interactive Auth Screens */}
        <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-8 lg:p-12 bg-white relative overflow-y-auto">
          <AnimatePresence mode="wait" custom={slideDirection}>
            {currentScreen === "welcome" && (
              <motion.div
                key="welcome"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center space-y-8"
              >
                {/* Back button */}
                {onBackToHome && (
                  <button
                    onClick={onBackToHome}
                    className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-neutral-900 transition w-fit cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                  </button>
                )}

                {/* Header welcoming text */}
                <div className="space-y-3">
                  <div className="bg-orange-50 text-orange-700 font-black text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-full w-fit">
                    Premium Dining Access
                  </div>
                  <h2 className="font-display font-black text-3xl text-neutral-900 tracking-tight leading-tight">
                    Embark on a Culinary Journey
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Create your secure fine-dining account or log in to track
                    coordinates, redeem chef gifts, and check order dispatches.
                  </p>
                </div>

                {/* Core Onboarding Illustrative Preview on Mobile only */}
                <div className="block lg:hidden bg-neutral-50 p-5 border border-neutral-100 rounded-3xl text-center space-y-3">
                  <div className="flex justify-center">
                    {slides[carouselIndex].icon}
                  </div>
                  <h4 className="font-display font-black text-sm text-neutral-800">
                    {slides[carouselIndex].title}
                  </h4>
                  <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                    {slides[carouselIndex].description}
                  </p>
                </div>

                {/* Primary Access Actions */}
                <div className="space-y-3 shrink-0">
                  <button
                    onClick={() => navigateTo("login", "next")}
                    style={{ backgroundColor: "#099535" }}
                    className="w-full text-white font-black py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm shrink-0"
                  >
                    <span>Log In to Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => navigateTo("signup", "next")}
                    className="w-full bg-white hover:bg-neutral-50 text-neutral-800 font-extrabold py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl transition border-2 border-neutral-200 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm shrink-0"
                  >
                    <span>Create Free Account</span>
                  </button>

                  {onBackToHome && (
                    <button
                      onClick={onBackToHome}
                      className="w-full bg-transparent hover:bg-neutral-50 text-neutral-500 hover:text-neutral-850 font-black py-3 px-6 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <span>← Browse as Guest</span>
                    </button>
                  )}
                </div>


              </motion.div>
            )}

            {currentScreen === "login" && (
              <motion.div
                key="login"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center space-y-6"
              >
                {/* Back button */}
                <button
                  onClick={() => navigateTo("welcome", "prev")}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-neutral-900 transition w-fit cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Welcome</span>
                </button>

                {/* Header text */}
                <div className="space-y-1">
                  <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight">
                    Welcome Back!
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium">
                    Provide your credentials or choose a quick-access portal
                    role to continue.
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="bg-neutral-50 p-1.5 rounded-2xl flex border border-neutral-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("user");
                      if (import.meta.env.VITE_USE_MOCK === "true") {
                        setPhone("+91 93501234567");
                        triggerToast("Diner demo profile pre-filled.");
                      }
                    }}
                    style={{
                      backgroundColor:
                        selectedRole === "user" ? "#2d8404" : void 0,
                      borderColor: selectedRole === "user" ? "#2d8404" : void 0,
                    }}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedRole === "user" ? "bg-brand-orange text-white shadow-xs border border-brand-orange" : "text-neutral-400 hover:text-neutral-600"}`}
                  >
                    <FaUtensils className="h-3.5 w-3.5" />
                    <span>Diner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("manager");
                      if (import.meta.env.VITE_USE_MOCK === "true") {
                        setPhone("+91 9508888888");
                        triggerToast("‍Manager command desk pre-filled.");
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedRole === "manager" ? "bg-brand-orange text-white shadow-xs border border-brand-orange" : "text-neutral-400 hover:text-neutral-600"}`}
                  >
                    <FaUserTie className="h-3.5 w-3.5" />
                    <span>Manager</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("admin");
                      if (import.meta.env.VITE_USE_MOCK === "true") {
                        setPhone("+91 9509999999");
                        triggerToast("Admin command desk pre-filled.");
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedRole === "admin" ? "bg-brand-orange text-white shadow-xs border border-brand-orange" : "text-neutral-400 hover:text-neutral-600"}`}
                  >
                    <RiAdminFill className="h-3.5 w-3.5" />
                    <span>Admin</span>
                  </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Phone field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Phone Number
                    </label>
                    <div className="flex gap-2.5">
                      {/* Country Code Prefix */}
                      <div className="flex items-center justify-center bg-neutral-50 border border-neutral-150 rounded-2xl px-4 py-3.5 text-xs font-bold text-neutral-600 select-none min-w-[64px]">
                        <span>+91</span>
                      </div>

                      {/* Phone input */}
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">
                          <PhoneIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone.startsWith("+91") ? phone.slice(3).trim() : phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            let cleaned = val.replace(/[^0-9]/g, "");
                            if (cleaned.startsWith("91") && cleaned.length > 10) {
                              cleaned = cleaned.slice(2);
                            }
                            cleaned = cleaned.slice(0, 10);
                            setPhone(cleaned ? `+91 ${cleaned}` : "");
                          }}
                          placeholder="9876543210"
                          className="w-full bg-neutral-50 border border-neutral-150 focus:border-brand-orange rounded-2xl py-3.5 pl-11 pr-4 text-xs font-semibold text-neutral-900 outline-none transition focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{ backgroundColor: "#1c6c29", opacity: isLoading ? 0.65 : 1 }}
                    className="w-full text-white font-black py-4 px-6 rounded-2xl transition shadow-lg hover:shadow-xl hover:shadow-neutral-950/15 flex items-center justify-center gap-2 cursor-pointer text-xs mt-2 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <span>Sending OTP…</span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Log In securely</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>



                <p className="text-center text-[11px] text-neutral-400 font-medium">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigateTo("signup", "next")}
                    className="text-orange-700 font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              </motion.div>
            )}

            {currentScreen === "signup" && (
              <motion.div
                key="signup"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center space-y-4"
              >
                {/* Back button */}
                <button
                  onClick={() => navigateTo("welcome", "prev")}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-neutral-900 transition w-fit cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Welcome</span>
                </button>

                {/* Header text */}
                <div className="space-y-1">
                  <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight leading-none">
                    Join Quickaa Bite
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium">
                    Set up your secure profile to unlock discount coupon
                    multipliers.
                  </p>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Vedanshi Bhabhra"
                        className="w-full bg-neutral-50 border border-neutral-150 focus:border-brand-orange rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-neutral-900 outline-none transition focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Phone Number
                    </label>
                    <div className="flex gap-2.5">
                      {/* Country Code Prefix */}
                      <div className="flex items-center justify-center bg-neutral-50 border border-neutral-150 rounded-2xl px-4 py-3 text-xs font-bold text-neutral-600 select-none min-w-[64px]">
                        <span>+91</span>
                      </div>

                      {/* Phone input */}
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">
                          <PhoneIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone.startsWith("+91") ? phone.slice(3).trim() : phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            let cleaned = val.replace(/[^0-9]/g, "");
                            if (cleaned.startsWith("91") && cleaned.length > 10) {
                              cleaned = cleaned.slice(2);
                            }
                            cleaned = cleaned.slice(0, 10);
                            setPhone(cleaned ? `+91 ${cleaned}` : "");
                          }}
                          placeholder="9701234567"
                          className="w-full bg-neutral-50 border border-neutral-150 focus:border-brand-orange rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-neutral-900 outline-none transition focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 px-6 rounded-2xl transition shadow-lg hover:shadow-xl hover:shadow-neutral-950/15 flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    {isLoading ? (
                      <>
                        <span>Sending OTP…</span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Register Account</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-[11px] text-neutral-400 font-medium">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigateTo("login", "prev")}
                    className="text-orange-700 font-bold hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              </motion.div>
            )}

            {currentScreen === "otp" && (
              <motion.div
                key="otp"
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center space-y-4 sm:space-y-6"
              >
                {/* Back button */}
                <button
                  onClick={() => navigateTo(pendingUser?.flow || "login", "prev")}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-neutral-900 transition w-fit cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to {pendingUser?.flow === "signup" ? "Sign Up" : "Log In"}</span>
                </button>

                {/* Header icon / illustration */}
                <div className="flex flex-col items-center text-center space-y-2 sm:space-y-4">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 text-orange-700 animate-pulse">
                    <Smartphone className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <h2 className="font-display font-black text-xl sm:text-2xl text-neutral-900 tracking-tight leading-none">
                      Verify OTP Identity 🔐
                    </h2>
                    <p className="text-[11px] sm:text-xs text-neutral-400 font-medium max-w-sm leading-relaxed">
                      For secure multi-factor gourmet auth, enter the 6-digit
                      code dispatched to phone{" "}
                      <span className="text-neutral-700 font-extrabold">
                        {pendingUser?.phone || "+91 9876543210"}
                      </span>{" "}
                      via{" "}
                      <span className="text-orange-700 font-black">
                        {pendingUser?.otpChannel === "whatsapp"
                          ? "WhatsApp"
                          : pendingUser?.otpChannel === "call"
                            ? "Voice Call"
                            : "SMS"}
                      </span>.
                    </p>
                  </div>
                </div>

                {/* OTP digit inputs box */}
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex justify-center gap-1.5 xs:gap-2 sm:gap-3 px-1">
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 h-11 xs:w-11 xs:h-12 sm:w-14 sm:h-14 text-center bg-neutral-50 border-2 border-neutral-150 focus:border-brand-orange text-lg sm:text-xl font-black text-neutral-900 rounded-xl sm:rounded-2xl outline-none focus:bg-white focus:shadow-md transition shrink-0"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  {/* OTP channel reminder */}
                  <p className="text-center text-[11px] text-neutral-400 font-semibold">
                    Sent via{" "}
                    <span className="font-black text-neutral-700">
                      {pendingUser?.otpChannel === "whatsapp"
                        ? "WhatsApp"
                        : pendingUser?.otpChannel === "call"
                          ? "Voice Call"
                          : "SMS"}
                    </span>{" "}
                    to{" "}
                    <span className="font-black text-neutral-700">
                      {pendingUser?.phone || "your phone"}
                    </span>
                  </p>

                  {/* Verify button */}
                  <button
                    onClick={handleOtpVerify}
                    disabled={isLoading}
                    className="w-full bg-neutral-950 hover:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 sm:py-4 px-6 rounded-2xl transition shadow-lg hover:shadow-xl hover:shadow-neutral-950/15 flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    {isLoading ? (
                      <span>Verifying…</span>
                    ) : (
                      <>
                        <span>Confirm & Authorize</span>
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {/* Countdown Timer */}
                  <div className="text-center">
                    {canResendOtp ? (
                      <button
                        onClick={handleResendOtp}
                        className="text-xs font-black text-orange-700 hover:underline cursor-pointer"
                      >
                        Resend Code Now
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400 font-semibold">
                        Resend OTP code in{" "}
                        <span className="font-mono font-black text-neutral-700">
                          0:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
