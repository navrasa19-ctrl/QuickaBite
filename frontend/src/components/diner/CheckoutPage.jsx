import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Mail,
  CreditCard,
  ShieldCheck,
  Ticket,
  Percent,
  Loader2,
  CheckCircle,
  Truck,
  Wallet,
  Smartphone,
  Check,
  AlertCircle,
  Lock,
  Building,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Key,
  Shield,
  LockKeyhole,
  ArrowRight,
  ShoppingBag,
  Plus,
  Home,
  Briefcase,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { dinerService } from "../../api/dinerService";
import { paymentService, loadRazorpayScript } from "../../services/payment.service";
import { requestExactHighAccuracyGps } from "../../utils/locationHelper";

export default function CheckoutPage({
  cartItems,
  restaurantName,
  restaurantId,
  onClearCart,
  onCheckoutSuccess,
  setActiveTab,
  triggerToast,
  preAppliedCoupon,
  setPreAppliedCoupon,
}) {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  const {
    cartRestaurant,
    tipAmount = 0,
    appliedCoupon,
    setAppliedCoupon,
    removeCoupon,
  } = useCart();
  const { profile, addresses, addAddress } = useAuth();

  const [name, setName] = useState(profile?.name || "Vedanshi Bhabhra");
  const [phone, setPhone] = useState(profile?.phone || "+91 9876543210");
  const [email, setEmail] = useState(
    profile?.email || "bhabhravedanshi@gmail.com",
  );
  const [addressType, setAddressType] = useState("home");
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Inline address creation state
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrCustomLabel, setNewAddrCustomLabel] = useState("");
  const [newAddrDetail, setNewAddrDetail] = useState("");
  const [newAddrContact, setNewAddrContact] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // GPS Accuracy & Permission status state
  const [gpsAccuracyStatus, setGpsAccuracyStatus] = useState({
    isApproximate: true,
    accuracy: null,
    isRequesting: false,
    exactAcquired: false,
  });

  const handleEnableHighAccuracyGps = async () => {
    setGpsAccuracyStatus((prev) => ({ ...prev, isRequesting: true }));
    try {
      const res = await requestExactHighAccuracyGps();
      setGpsAccuracyStatus({
        isApproximate: false,
        accuracy: res.accuracy,
        isRequesting: false,
        exactAcquired: true,
      });
      triggerToast(`Exact High-Accuracy GPS acquired! Precision: ${res.accuracy}m`);

      if (res.lat && res.lng) {
        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${res.lat}&lon=${res.lng}`
          );
          const data = await revRes.json();
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || "";
          const road = data.address?.road || "";
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const fullAddr = [road, suburb, city].filter(Boolean).join(", ");
          if (fullAddr) {
            setAddressDetail(fullAddr);
          }
        } catch (e) {
          console.warn("Reverse geocode exact error:", e);
        }
      }
    } catch (err) {
      setGpsAccuracyStatus((prev) => ({ ...prev, isRequesting: false }));
      triggerToast(err.message || "Failed to switch on High-Accuracy GPS.");
    }
  };

  const getAvailableDefaultLabel = () => {
    const hasHome = (addresses || []).some(
      (a) => (a.label || "").toLowerCase() === "home",
    );
    if (!hasHome) return "Home";
    const hasWork = (addresses || []).some(
      (a) => (a.label || "").toLowerCase() === "work",
    );
    if (!hasWork) return "Work";
    return "Other";
  };

  const openAddAddressForm = () => {
    const defaultLabel = getAvailableDefaultLabel();
    setNewAddrLabel(defaultLabel);
    setNewAddrDetail("");
    setNewAddrContact(phone);
    setNewAddrCustomLabel("");
    setIsAddingNewAddress(true);
  };

  // Requirement 3: Handling Mobile Tab Reload (Polling Fallback)
  useEffect(() => {
    const pendingOrderId = localStorage.getItem("pending_razorpay_order_id");
    if (!pendingOrderId) return;

    let isMounted = true;
    const pollStatus = async () => {
      try {
        const res = await paymentService.checkPaymentStatus(pendingOrderId);
        const status =
          res?.paymentStatus ||
          res?.data?.paymentStatus ||
          res?.data?.order?.paymentStatus;
        if (status === "paid" && isMounted) {
          localStorage.removeItem("pending_razorpay_order_id");
          if (typeof onClearCart === "function") onClearCart();
          navigate(`/order-success/${pendingOrderId}`);
        }
      } catch (err) {
        console.error("Tab reload polling error:", err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate, onClearCart]);

  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.email) setEmail(profile.email);
    }
    if (addresses && addresses.length > 0) {
      setSavedAddresses(addresses);
      const currentSelected = addresses.find(
        (a) =>
          (a.id || a._id) === selectedAddressId || a.detail === addressDetail,
      );
      if (!currentSelected) {
        const def = addresses.find((a) => a.isDefault) || addresses[0];
        if (def) {
          setSelectedAddressId(def.id || def._id);
          setAddressDetail(def.detail);
          setAddressType((def.label || "home").toLowerCase());
          if (def.contact) setPhone(def.contact);
        }
      }
    } else {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      setAddressDetail("");
    }
  }, [profile, addresses]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id || addr._id);
    setAddressDetail(addr.detail);
    setAddressType((addr.label || "home").toLowerCase());
    if (addr.contact) setPhone(addr.contact);
    setIsAddingNewAddress(false);
    triggerToast(`Selected ${addr.label || "Delivery"} address`);
  };

  const handleSaveNewAddress = async (e) => {
    if (e) e.preventDefault();
    if (!newAddrDetail.trim()) {
      triggerToast("Please enter full address details.");
      return;
    }

    const targetLabel =
      newAddrLabel === "Other"
        ? newAddrCustomLabel.trim() || "Other"
        : newAddrLabel;

    // Check duplicate label case-insensitively
    const isDuplicate = (addresses || []).some(
      (a) => (a.label || "").toLowerCase() === targetLabel.toLowerCase(),
    );

    if (isDuplicate) {
      triggerToast(
        `An address labeled "${targetLabel}" already exists in your profile. Please choose a different category or enter a unique custom label.`,
      );
      return;
    }

    setIsSavingAddress(true);
    try {
      const addressData = {
        label: targetLabel,
        detail: newAddrDetail.trim(),
        contact: newAddrContact || phone,
        isDefault: (addresses || []).length === 0,
      };
      let created = null;
      if (typeof addAddress === "function") {
        created = await addAddress(addressData);
      } else {
        created = { ...addressData, id: `addr-${Date.now()}` };
      }
      triggerToast(`✓ New ${targetLabel} address saved to profile!`);
      setIsAddingNewAddress(false);
      setNewAddrDetail("");
      setNewAddrContact("");
      setNewAddrCustomLabel("");
      if (created) {
        const createdId = created.id || created._id || `addr-${Date.now()}`;
        setSelectedAddressId(createdId);
        if (created.detail) setAddressDetail(created.detail);
        if (created.label)
          setAddressType((created.label || "home").toLowerCase());
      }
    } catch (err) {
      console.error("Failed to save new address:", err);
      triggerToast("Failed to save address. Please try again.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const [deliveryInstruction, setDeliveryInstruction] = useState("");
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [paymentScreenActive, setPaymentScreenActive] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi_gpay");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("Vedanshi Bhabhra");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardFocusedField, setCardFocusedField] = useState(null);

  const [debitPin, setDebitPin] = useState("");
  const [debitStep, setDebitStep] = useState("card");

  const [upiOption, setUpiOption] = useState("vpa");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiTimer, setUpiTimer] = useState(180);
  const [qrScanned, setQrScanned] = useState(false);

  const [selectedWallet, setSelectedWallet] = useState("applepay");
  const [walletLinking, setWalletLinking] = useState(false);
  const [linkedWallets, setLinkedWallets] = useState({
    applepay: true,
    gpay: false,
    paytm: false,
    phonepe: false,
  });

  const [selectedBank, setSelectedBank] = useState("enbd");
  const [netBankingUserId, setNetBankingUserId] = useState("");
  const [netBankingPassword, setNetBankingPassword] = useState("");
  const [netBankingStep, setNetBankingStep] = useState("login");
  const [netBankingOtp, setNetBankingOtp] = useState("");
  const [nbSimulatedOtp, setNbSimulatedOtp] = useState("");

  const [codCaptchaInput, setCodCaptchaInput] = useState("");
  const [codCaptchaCode, setCodCaptchaCode] = useState("");
  const [codCaptchaVerified, setCodCaptchaVerified] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [generatedOrder, setGeneratedOrder] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponsList, setCouponsList] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const list = await dinerService.getActiveCoupons();
        setCouponsList(list || []);
      } catch (err) {
        console.error("Failed to load coupons in CheckoutPage:", err);
      }
    };
    fetchCoupons();
  }, []);

  const isMock = import.meta.env.VITE_USE_MOCK !== "false";
  const staticCoupons = [
    {
      code: "WELCOME50",
      desc: "50% off on your current order",
      minOrder: 0,
      calc: (sub) => Math.round(sub * 0.5),
    },
    {
      code: "FOOD40",
      desc: "40% off on orders above ₹ 100",
      minOrder: 100,
      calc: (sub) => Math.round(sub * 0.4),
    },
    {
      code: "SAVE10",
      desc: "Flat ₹ 10 off for orders above ₹ 40",
      minOrder: 40,
      calc: () => 10,
    },
    {
      code: "FREEDEL",
      desc: "Free delivery on orders above ₹ 39",
      minOrder: 39,
      calc: () => 0,
    },
    {
      code: "HSBC20",
      desc: "20% off up to ₹ 25 with HSBC cards",
      minOrder: 50,
      calc: (sub) => Math.min(25, Math.round(sub * 0.2)),
    },
    {
      code: "ENBD25",
      desc: "25% off up to ₹ 30 with Emirates NBD",
      minOrder: 60,
      calc: (sub) => Math.min(30, Math.round(sub * 0.25)),
    },
    {
      code: "MCWORLD",
      desc: "Flat ₹ 15 off with Mastercard World",
      minOrder: 50,
      calc: () => 15,
    },
    {
      code: "EIDFEAST",
      desc: "30% off up to ₹ 40",
      minOrder: 50,
      calc: (sub) => Math.min(40, Math.round(sub * 0.3)),
    },
    {
      code: "DIWALI50",
      desc: "50% off up to ₹ 50",
      minOrder: 80,
      calc: (sub) => Math.min(50, Math.round(sub * 0.5)),
    },
    { code: "CHILLY20", desc: "Flat ₹ 20 off", minOrder: 50, calc: () => 20 },
    { code: "KFCFREE", desc: "Flat ₹ 15 off", minOrder: 45, calc: () => 15 },
    {
      code: "PIZZALOVE",
      desc: "25% off up to ₹ 20",
      minOrder: 50,
      calc: (sub) => Math.min(20, Math.round(sub * 0.25)),
    },
    {
      code: "SUB15",
      desc: "Flat 15% off",
      minOrder: 40,
      calc: (sub) => Math.round(sub * 0.15),
    },
    {
      code: "CASHBACK15",
      desc: "15% instant cashback up to ₹ 15",
      minOrder: 40,
      calc: (sub) => Math.min(15, Math.round(sub * 0.15)),
    },
    {
      code: "CASHBACK10",
      desc: "Flat ₹ 10 instant cashback",
      minOrder: 30,
      calc: () => 10,
    },
  ];

  const getCouponCalc = (c) => {
    if (typeof c.calc === "function") return c.calc;
    const matchedStatic = staticCoupons.find((sc) => sc.code === c.code);
    if (matchedStatic && typeof matchedStatic.calc === "function") {
      return matchedStatic.calc;
    }
    return (sub) => {
      const type =
        c.discountType || (c.code.includes("OFF") ? "percentage" : "flat");
      let val = Number(c.discountValue) || 0;
      if (!val && typeof c.discount === "string") {
        const match = c.discount.match(/\d+/);
        if (match) val = Number(match[0]);
      }
      if (!val && typeof c.code === "string") {
        const match = c.code.match(/\d+/);
        if (match) val = Number(match[0]);
      }
      if (type === "percentage" || c.discountType === "percentage") {
        const calcVal = Math.round(sub * (val / 100));
        return c.maximumDiscount
          ? Math.min(c.maximumDiscount, calcVal)
          : calcVal;
      }
      return val || 0;
    };
  };

  const availableCouponsMap = new Map();
  staticCoupons.forEach((sc) => {
    availableCouponsMap.set(sc.code, { ...sc, calc: getCouponCalc(sc) });
  });
  (couponsList || []).forEach((c) => {
    if (c && c.code) {
      const existing = availableCouponsMap.get(c.code) || {};
      availableCouponsMap.set(c.code, {
        ...existing,
        ...c,
        minOrder:
          c.minOrder !== undefined ? c.minOrder : existing.minOrder || 0,
        calc: getCouponCalc({ ...existing, ...c }),
      });
    }
  });
  const availableCoupons = Array.from(availableCouponsMap.values());

  useEffect(() => {
    if (preAppliedCoupon) {
      const code = preAppliedCoupon.toUpperCase().trim();
      const sub = (cartItems || []).reduce(
        (acc, curr) =>
          acc +
          Number(curr?.menuItem?.price ?? curr?.price ?? 0) *
          Number(curr?.quantity ?? 1),
        0,
      );
      const coupon = availableCoupons.find((c) => c.code === code);
      if (coupon) {
        if (sub >= coupon.minOrder) {
          const discount = coupon.calc(sub);
          setAppliedCoupon({
            code,
            discount,
            discountType: coupon.discountType,
          });
          setCouponError("");
        } else {
          setCouponError(
            `Min order value of ₹ ${coupon.minOrder} is required for ${code}.`,
          );
        }
      }
    }
  }, [preAppliedCoupon, cartItems, couponsList]);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = (cartItems || []).reduce(
    (acc, curr) =>
      acc +
      Number(curr?.menuItem?.price ?? curr?.price ?? 0) *
      Number(curr?.quantity ?? 1),
    0,
  );

  const restaurantDeliveryFee =
    cartRestaurant?.deliveryFee !== undefined
      ? Number(cartRestaurant.deliveryFee)
      : 0;
  const isFreeDelivery =
    cartRestaurant?.isFreeDelivery || restaurantDeliveryFee === 0;

  const deliveryFee =
    appliedCoupon?.code === "FREEDEL" ||
      appliedCoupon?.discountType === "free-delivery" ||
      isFreeDelivery
      ? 0
      : restaurantDeliveryFee;
  const taxesAndService = Math.round(subtotal * 0.05);
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const currentTip = Number(tipAmount) || 0;

  const grandTotal = Math.max(
    0,
    subtotal + deliveryFee + taxesAndService + currentTip - couponDiscount,
  );

  useEffect(() => {
    let timer;
    if (
      paymentScreenActive &&
      paymentMethod === "upi" &&
      upiOption === "qr" &&
      upiTimer > 0 &&
      !qrScanned
    ) {
      timer = setInterval(() => {
        setUpiTimer((prev) => prev - 1);
      }, 1e3);
    }
    return () => clearInterval(timer);
  }, [paymentScreenActive, paymentMethod, upiOption, upiTimer, qrScanned]);

  useEffect(() => {
    let timeout;
    if (
      paymentScreenActive &&
      paymentMethod === "upi" &&
      upiOption === "qr" &&
      !qrScanned
    ) {
      timeout = setTimeout(() => {
        setQrScanned(true);
        triggerToast(
          "QR Code scanned successfully! Proceeding with authorization...",
        );
      }, 7e3);
    }
    return () => clearTimeout(timeout);
  }, [paymentScreenActive, paymentMethod, upiOption, qrScanned]);

  const generateCaptcha = () => {
    const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCodCaptchaCode(result);
    setCodCaptchaInput("");
    setCodCaptchaVerified(false);
  };

  useEffect(() => {
    if (paymentScreenActive && paymentMethod === "cod") {
      generateCaptcha();
    }
  }, [paymentScreenActive, paymentMethod]);

  useEffect(() => {
    let interval;
    if (orderSuccess && redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1e3);
    } else if (orderSuccess && redirectCountdown === 0 && generatedOrder) {
      onClearCart();
    }
    return () => clearInterval(interval);
  }, [orderSuccess, redirectCountdown, generatedOrder]);

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    if (typeof setPreAppliedCoupon === "function") {
      setPreAppliedCoupon("");
    }
    setCouponError("");
    triggerToast("Coupon removed.");
  };

  const togglePresetInstruction = (preset) => {
    if (selectedPresets.includes(preset)) {
      setSelectedPresets(selectedPresets.filter((p) => p !== preset));
    } else {
      setSelectedPresets([...selectedPresets, preset]);
    }
  };

  const verifyUPI = () => {
    if (!upiId.trim() || !upiId.includes("@")) {
      triggerToast("Please enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    setUpiVerified(true);
    triggerToast("✓ UPI ID verified successfully!");
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length > 0 ? parts.join(" ") : v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted.slice(0, 19));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setCardExpiry(value.slice(0, 5));
  };

  const handleLinkWallet = (walletId) => {
    setWalletLinking(true);
    triggerToast(
      `Establishing encrypted connection with ${walletId.toUpperCase()}...`,
    );
    setTimeout(() => {
      setLinkedWallets((prev) => ({ ...prev, [walletId]: true }));
      setWalletLinking(false);
      triggerToast(
        `✓ ${walletId.toUpperCase()} linked successfully! Available: ₹ 500.00`,
      );
    }, 1800);
  };

  const handleBankAuthSubmit = (e) => {
    e.preventDefault();
    if (!netBankingUserId.trim() || !netBankingPassword.trim()) {
      triggerToast("Please fill in your bank credentials.");
      return;
    }
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    setNbSimulatedOtp(code);
    setNetBankingStep("otp");
    setTimeout(() => {
      triggerToast(`SMS alert: QuikaBite Secure login OTP is ${code}`);
    }, 1200);
  };

  const handleBankOtpVerify = (e) => {
    e.preventDefault();
    if (netBankingOtp === nbSimulatedOtp || netBankingOtp === "123456") {
      setNetBankingStep("success");
      triggerToast("✓ Bank account authenticated! Secure tokens saved.");
    } else {
      triggerToast(
        "Invalid verification code. Please check your simulated OTP.",
      );
    }
  };

  const verifyCodCaptcha = () => {
    if (codCaptchaInput.toUpperCase() === codCaptchaCode) {
      setCodCaptchaVerified(true);
      triggerToast("✓ Human verification successful!");
    } else {
      triggerToast("Captcha mismatch. Please try again.");
      generateCaptcha();
    }
  };

  const getCardType = (num) => {
    const cleanNum = num.replace(/\D/g, "");
    if (cleanNum.startsWith("4")) return "Visa";
    if (cleanNum.startsWith("5")) return "Mastercard";
    if (cleanNum.startsWith("37") || cleanNum.startsWith("34")) return "Amex";
    if (cleanNum.startsWith("60") || cleanNum.startsWith("65")) return "RuPay";
    return "Card";
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      triggerToast("Your cart is empty.");
      return;
    }
    if (!name.trim() || !phone.trim() || !email.trim()) {
      triggerToast("Please complete your Contact Details.");
      return;
    }
    if (!addresses || addresses.length === 0) {
      triggerToast(
        "No saved profile address found. Please add a delivery address first.",
      );
      setNewAddrLabel("Home");
      setNewAddrDetail("");
      setNewAddrContact(phone);
      setIsAddingNewAddress(true);
      return;
    }
    if (!addressDetail.trim()) {
      triggerToast("Please select a saved Delivery Address from your profile.");
      return;
    }
    setPaymentScreenActive(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    triggerToast("Transferring to secure 256-bit payment node...");
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      triggerToast("Your cart is empty.");
      return;
    }
    if (!name.trim() || !phone.trim() || !email.trim()) {
      triggerToast("Please complete your Contact Details.");
      return;
    }
    if (!addresses || addresses.length === 0 || !addressDetail.trim()) {
      triggerToast(
        "Please select or add a Delivery Address from your profile.",
      );
      return;
    }

    if (paymentMethod === "credit_card") {
      const cleanNum = cardNumber.replace(/\s+/g, "");
      if (cleanNum.length < 15) {
        triggerToast("Please enter a valid Card Number.");
        return;
      }
      if (!cardExpiry.includes("/") || cardExpiry.length < 5) {
        triggerToast("Please specify Card Expiry (MM/YY).");
        return;
      }
      if (cardCvv.length < 3) {
        triggerToast("Please specify the 3-digit CVV/CVC code.");
        return;
      }
      if (!cardName.trim()) {
        triggerToast("Please enter Cardholder Name.");
        return;
      }
    }

    setIsPlacingOrder(true);
    triggerToast("Initiating order creation...");

    const selectedAddr = savedAddresses.find((a) => a.detail === addressDetail);
    const addressId =
      selectedAddr?.id || selectedAddr?._id || "6a61f47e198289aa34c30eeb";

    const latVal = Number(selectedAddr?.lat || selectedAddr?.location?.coordinates?.[1] || 26.9124);
    const lngVal = Number(selectedAddr?.lng || selectedAddr?.location?.coordinates?.[0] || 75.7873);

    const formattedItems = cartItems.map((item) => ({
      menuItem:
        item.menuItem?.id || item.menuItem?._id || item.id || item._id || "",
      name: item.menuItem?.name || item.name || "Dish Item",
      price: Number(item.menuItem?.price ?? item.price ?? 0),
      quantity: Number(item.quantity || 1),
    }));

    const orderPayload = {
      address: addressId,
      exactDeliveryLocation: {
        type: "Point",
        coordinates: [lngVal, latVal],
        latitude: latVal,
        longitude: lngVal,
        addressDetail: addressDetail || selectedAddr?.detail || "",
        label: addressType || selectedAddr?.label || "Home",
        isApproximateLocation: gpsAccuracyStatus.isApproximate,
        gpsAccuracyMeters: gpsAccuracyStatus.accuracy,
      },
      restaurant: restaurantId,
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      items: formattedItems,
      contactName: name,
      contactPhone: phone,
      contactEmail: email,
      tipAmount: currentTip,
      tip: currentTip,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      tax: taxesAndService,
      discount: couponDiscount,
      total: grandTotal,
      grandTotal: grandTotal,
      couponCode: appliedCoupon?.code || "",
      deliveryInstructions: {
        presets: selectedPresets,
        customNote: deliveryInstruction,
      },
    };

    try {
      if (paymentMethod === "cod") {
        const responseOrder = await dinerService.createCodOrder(orderPayload);
        const orderObj = responseOrder?.order || responseOrder || {};
        const finalOrder = {
          ...responseOrder,
          ...orderObj,
          id:
            orderObj?._id ||
            orderObj?.id ||
            orderObj?.orderNumber ||
            responseOrder?.id ||
            responseOrder?._id ||
            `GE-${Math.floor(1e5 + Math.random() * 9e5)}`,
          restaurantId:
            restaurantId ||
            orderObj?.restaurant?._id ||
            orderObj?.restaurant ||
            responseOrder?.restaurantId,
          restaurantName:
            restaurantName ||
            orderObj?.restaurant?.name ||
            orderObj?.restaurantName ||
            responseOrder?.restaurantName ||
            "Gourmet Kitchen",
          items:
            cartItems && cartItems.length > 0
              ? [...cartItems]
              : responseOrder?.items || orderObj?.items || [],
          status:
            orderObj?.orderStatus ||
            orderObj?.status ||
            responseOrder?.status ||
            "received",
          timestamp: orderObj?.createdAt
            ? new Date(orderObj.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          subtotal:
            orderObj?.subtotal !== undefined
              ? orderObj.subtotal
              : subtotal || 0,
          deliveryFee:
            orderObj?.deliveryFee !== undefined
              ? orderObj.deliveryFee
              : deliveryFee || 0,
          discount:
            orderObj?.discountValue !== undefined
              ? orderObj.discountValue
              : couponDiscount || 0,
          tax:
            orderObj?.tax !== undefined ? orderObj.tax : taxesAndService || 0,
          total:
            orderObj?.totalAmount !== undefined
              ? orderObj.totalAmount
              : grandTotal || 0,
          paymentMethod: "cod",
          couponCode:
            appliedCoupon?.code ||
            orderObj?.couponCode ||
            responseOrder?.couponCode ||
            "",
          driverCoords: { x: 12, y: 18 },
        };

        setGeneratedOrder(finalOrder);
        setOrderSuccess(true);
        setIsPlacingOrder(false);
        triggerToast("COD Order Booked Successfully!");
        onCheckoutSuccess(finalOrder);
        return;
      }

      // Razorpay / Direct UPI Payment Flow
      await paymentService.loadRazorpayScript();

      let rzpData = null;
      try {
        rzpData = await paymentService.createRazorpayOrder(orderPayload);
        console.log("[Razorpay Order Initiation Response]", rzpData);
      } catch (backendErr) {
        console.error(
          "[Razorpay Backend Order Error]:",
          backendErr.response?.data || backendErr.message,
        );
        setIsPlacingOrder(false);
        triggerToast(
          backendErr.response?.data?.message ||
          "Failed to initiate order with payment gateway. Please try again.",
        );
        return;
      }

      const rawData = rzpData?.data || rzpData;
      const razorpayObj = rawData?.razorpay || rzpData?.razorpay || rawData;
      const internalOrderObj =
        rawData?.order?.order ||
        rawData?.order ||
        rzpData?.order?.order ||
        rzpData?.order ||
        rawData?.internalOrder ||
        rzpData;

      const keyId =
        razorpayObj?.keyId ||
        razorpayObj?.key_id ||
        rawData?.keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      const razorpayOrderId =
        razorpayObj?.orderId ||
        razorpayObj?.order_id ||
        razorpayObj?.id ||
        rawData?.razorpayOrderId ||
        rawData?.orderId;

      const amountPaise =
        razorpayObj?.amount ||
        rawData?.amount ||
        Math.round(grandTotal * 100);

      const currency =
        razorpayObj?.currency ||
        rawData?.currency ||
        "INR";

      const internalOrderId =
        internalOrderObj?._id ||
        internalOrderObj?.id ||
        rawData?.orderId ||
        rzpData?.orderId;

      const orderNumber =
        internalOrderObj?.orderNumber ||
        internalOrderObj?._id ||
        internalOrderId;

      if (!keyId) {
        setIsPlacingOrder(false);
        triggerToast("Razorpay Key ID is missing in backend response / environment.");
        return;
      }

      // Save pending order ID for tab reload polling fallback
      localStorage.setItem("pending_razorpay_order_id", internalOrderId);

      const razorpayData = {
        keyId,
        orderId: razorpayOrderId,
        amount: amountPaise,
        currency,
      };

      const internalOrder = {
        _id: internalOrderId,
        id: internalOrderId,
        orderNumber: orderNumber,
      };

      const currentUser = {
        name: name,
        email: email || "",
        phone: phone,
      };

      const getConfigForMethod = (method) => {
        if (method === "credit_card") {
          return {
            display: {
              blocks: {
                banks: {
                  name: "Pay via Credit / Debit Card",
                  instruments: [{ method: "card" }],
                },
              },
              sequence: ["block.banks"],
            },
          };
        }
        if (method === "netbanking") {
          return {
            display: {
              blocks: {
                netbanking: {
                  name: "Pay via NetBanking",
                  instruments: [{ method: "netbanking" }],
                },
              },
              sequence: ["block.netbanking"],
            },
          };
        }
        return {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI (PhonePe / GPay / Paytm)",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.upi"],
          },
        };
      };

      if (window.Razorpay) {
        const options = {
          key: razorpayData.keyId,
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          name: "QuikaBite",
          description: `Order #${internalOrder.orderNumber}`,
          order_id: razorpayData.orderId,
          handler: async function (response) {
            triggerToast("Verifying payment signature...");
            const rzpPaymentId = response.razorpay_payment_id || response.payment_id;
            const rzpOrderId = response.razorpay_order_id || response.order_id || razorpayOrderId;
            const rzpSignature = response.razorpay_signature || response.signature;

            if (rzpPaymentId) localStorage.setItem("temp_rzp_payment_id", rzpPaymentId);
            if (rzpOrderId) localStorage.setItem("temp_rzp_order_id", rzpOrderId);
            if (rzpSignature) localStorage.setItem("temp_rzp_signature", rzpSignature);

            try {
              const verifyRes = await dinerService.verifyRazorpayPayment({
                orderId: internalOrder._id || internalOrder.id,
                razorpayOrderId: rzpOrderId,
                razorpayPaymentId: rzpPaymentId,
                razorpaySignature: rzpSignature || "test_signature",
              });
              console.log("--> verifyRes result received in CheckoutPage:", verifyRes);

              localStorage.removeItem("pending_razorpay_order_id");
              setIsPlacingOrder(false);
              if (typeof onClearCart === "function") onClearCart();
              navigate(`/order-success/${internalOrder._id || internalOrder.id}`);
            } catch (vErr) {
              console.error("Payment verification error in handler:", vErr);
              setIsPlacingOrder(false);
              triggerToast(vErr.response?.data?.message || "Payment verification failed!");
            }
          },
          prefill: {
            name: currentUser.name,
            email: currentUser.email || "",
            contact: currentUser.phone,
          },
          theme: {
            color: "#FF6B35",
          },
          modal: {
            ondismiss: async function () {
              localStorage.removeItem("pending_razorpay_order_id");
              setIsPlacingOrder(false);
              triggerToast("Razorpay checkout cancelled by user.");
              const pendingId = internalOrder._id || internalOrder.id;
              if (pendingId) {
                await dinerService.cancelPendingPaymentOrder(pendingId);
              }
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setIsPlacingOrder(false);
        triggerToast("Failed to load Razorpay SDK.");
      }
    } catch (err) {
      console.error(
        "Order creation detailed error:",
        err.response?.data || err,
      );
      setIsPlacingOrder(false);
      const serverMsg =
        err.response?.data?.message || err.response?.data?.error || err.message;
      triggerToast("Failed to place order: " + serverMsg);
    }
  };

  const confettiArray = Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
    duration: `${2.5 + Math.random() * 3}s`,
    color: [
      "#FF6B35",
      "#10B981",
      "#3B82F6",
      "#F59E0B",
      "#EC4899",
      "#8B5CF6",
      "#14B8A6",
    ][Math.floor(Math.random() * 7)],
    size: `${Math.random() * 10 + 6}px`,
    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
  }));

  if (orderSuccess && generatedOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-900/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <style>{`
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
          @keyframes scaleCard {
            0% { transform: scale(0.9) translateY(20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
          }
          @keyframes scale-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-success-card {
            animation: scaleCard 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-confetti {
            animation: confetti-fall linear infinite;
          }
          .animate-pulse-success {
            animation: scale-pulse 2s infinite ease-in-out;
          }
        `}</style>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiArray.map((p) => (
            <div
              key={p.id}
              className="absolute animate-confetti"
              style={{
                left: p.left,
                top: "-50px",
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.borderRadius,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>

        <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-white/20 p-8 text-center relative overflow-hidden animate-success-card">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100 shadow-lg shadow-emerald-500/10 relative z-10 animate-pulse-success">
            <svg
              className="w-12 h-12 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                style={{ animation: "drawCheck 0.6s 0.2s ease-out forwards" }}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">
            🛡️ Secure Booking Verified
          </span>
          <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">
            Order Placed Successfully!
          </h2>
          <p className="text-gray-400 text-xs mt-1 font-semibold">
            Your payment is processed and order has been locked with restaurant.
          </p>

          <div className="my-6 bg-neutral-50 border border-neutral-100 rounded-3xl p-5 text-left space-y-4 relative">
            <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
              <div>
                <span className="text-[11px] text-gray-400 font-black uppercase tracking-wider">
                  Transaction Hash
                </span>
                <span className="font-mono text-xs text-gray-700 block font-black">
                  #TXN-{Math.floor(1e7 + Math.random() * 9e7)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-gray-400 font-black uppercase tracking-wider">
                  Secure Protocol
                </span>
                <span className="text-xs text-emerald-600 block font-bold flex items-center gap-1 justify-end">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  SSL-256
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">
                  Restaurant Node
                </span>
                <span className="font-extrabold text-gray-800">
                  {generatedOrder.restaurantName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">
                  Gourmet Feast Summary
                </span>
                <span className="font-bold text-gray-800">
                  {generatedOrder.items.length} item(s) ordered
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">
                  Grand Total Charged
                </span>
                <span className="font-mono font-black text-orange-700">
                  ₹ {generatedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100/60 p-3 rounded-2xl flex items-center gap-3">
              <div className="bg-emerald-100/80 p-2 rounded-xl text-emerald-600 shrink-0">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] text-emerald-800 font-black uppercase tracking-wider block">
                  Kitchen Notified
                </span>
                <p className="text-[11px] text-emerald-600 font-medium">
                  Chef preparing gourmet meal. Arrival estimated in 25-35 mins.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-semibold text-gray-500">
              Auto-redirecting to live tracker in{" "}
              <span className="font-mono font-black text-orange-700 text-sm">
                {redirectCountdown}s
              </span>
              ...
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onCheckoutSuccess(generatedOrder);
                  onClearCart();
                }}
                className="flex-1 bg-gray-900 hover:bg-black text-white py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md shadow-black/10"
              >
                <span>Track Live Order</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if ((!cartItems || cartItems.length === 0) && !orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="mx-auto w-20 h-20 bg-orange-50 text-orange-700 rounded-full flex items-center justify-center border border-orange-100 shadow-sm">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-black text-2xl text-gray-900">
            Your Basket is Empty
          </h2>
          <p className="text-gray-400 text-xs max-w-md mx-auto">
            You don't have any items in your checkout basket. Add delicious
            dishes from your favorite restaurants to proceed.
          </p>
        </div>
        <button
          onClick={() => navigate("/home")}
          className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-700 text-white font-display font-black text-xs px-6 py-3.5 rounded-2xl shadow-md shadow-orange-600/10 transition"
        >
          <span>Explore Restaurants</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="max-w-[1400px] mx-auto py-1 animate-fade-in"
      id="checkout-page-container"
    >
      <style>{`
        @keyframes laser-sweep {
          0%, 100% { top: 0%; opacity: 0.2; }
          50% { top: 100%; opacity: 1; }
        }
        .animate-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #FF6B35;
          box-shadow: 0 0 10px #FF6B35;
          animation: laser-sweep 2s infinite ease-in-out;
        }
      `}</style>

      <div className="mb-8 space-y-1">
        <button
          onClick={() => {
            if (paymentScreenActive) {
              setPaymentScreenActive(false);
              return;
            }
            if (typeof goBack === "function") {
              goBack();
              return;
            }
            window.history.back();
          }}
          className="hover:text-orange-700 flex items-center gap-1.5 transition text-gray-500 text-xs font-bold uppercase tracking-wider mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            {paymentScreenActive ? "Back to Delivery Details" : "Back to Cart"}
          </span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-3xl text-gray-900 tracking-tight flex items-center gap-2.5">
              {paymentScreenActive ? (
                <>
                  <Lock className="h-8 w-8 text-emerald-600 animate-pulse" />
                  <span>Secure Payment Portal</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-8 w-8 text-emerald-600 animate-pulse" />
                  <span>Secure Checkout</span>
                </>
              )}
            </h1>
            <p className="text-gray-400 text-xs font-medium">
              {paymentScreenActive
                ? "Authorized connection verified. Select payment below."
                : "Please review details & secure your booking"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {!paymentScreenActive ? (
            // Stage 1 (kept from existing file via minimal placeholder to avoid breaking)
            <div className="space-y-6 animate-fade-in">
              <div
                className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-xs"
                id="checkout-contact-section"
              >
                <div className="flex items-center gap-2 text-gray-800 font-extrabold text-base border-b border-gray-50 pb-2">
                  <User className="h-5 w-5 text-orange-700" />
                  <h3>1. Contact Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-black uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-xs outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-black uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-xs outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-gray-400 font-black uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-xs outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </div>

              <div
                className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-xs"
                id="checkout-address-section"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-2 text-gray-800 font-extrabold text-base">
                    <MapPin className="h-5 w-5 text-orange-700" />
                    <h3>2. Delivery Address</h3>
                  </div>
                  {addresses && addresses.length > 0 && !isAddingNewAddress && (
                    <button
                      type="button"
                      onClick={openAddAddressForm}
                      className="cursor-pointer text-xs font-bold text-orange-700 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {/* APPROXIMATE LOCATION WARNING BANNER & GPS PERMISSION SWITCH */}
                {!gpsAccuracyStatus.exactAcquired && (
                  <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                        <AlertCircle className="h-5 w-5 text-amber-600 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                          <span>Using Approximate Location</span>
                          <span className="bg-amber-200 text-amber-900 text-[11px] px-2 py-0.5 rounded-full font-bold">
                            {gpsAccuracyStatus.accuracy ? `~${gpsAccuracyStatus.accuracy}m Accuracy` : "Device GPS Disabled"}
                          </span>
                        </h4>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                          Your device's high-precision GPS may be turned off or location permission was limited. Our rider needs your exact GPS coordinates to deliver your order without delay.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={gpsAccuracyStatus.isRequesting}
                      onClick={handleEnableHighAccuracyGps}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-black text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {gpsAccuracyStatus.isRequesting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Requesting High-Accuracy Device GPS…</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4" />
                          <span>⚡ Switch On High-Accuracy GPS Permission</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {gpsAccuracyStatus.exactAcquired && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 font-extrabold shadow-xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Exact High-Accuracy GPS coordinates acquired! ({gpsAccuracyStatus.accuracy ? `Precision: ${gpsAccuracyStatus.accuracy}m` : "Pinpoint Location"})</span>
                  </div>
                )}

                {/* CASE 1: No saved addresses in profile and not adding yet */}
                {(!addresses || addresses.length === 0) &&
                  !isAddingNewAddress && (
                    <div className="bg-amber-50/80 border border-amber-200/70 p-5 rounded-2xl space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                            No Saved Address Found
                          </h4>
                          <p className="text-xs text-amber-700 font-medium mt-0.5 leading-relaxed">
                            You don't have any saved address in your profile.
                            Please add a delivery address to proceed with
                            checkout.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={openAddAddressForm}
                        className="w-full bg-brand-orange hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Delivery Address to Profile</span>
                      </button>
                    </div>
                  )}

                {/* CASE 2: Inline Add Address Form */}
                {isAddingNewAddress && (
                  <form
                    onSubmit={handleSaveNewAddress}
                    className="bg-gray-50 border border-gray-200/80 p-4 sm:p-5 rounded-2xl space-y-4 animate-fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                        <Plus className="h-4 w-4 text-orange-700" />
                        Add New Delivery Address
                      </span>
                      {addresses && addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewAddress(false)}
                          className="text-[11px] font-bold text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-gray-400 font-black uppercase tracking-wider block mb-1.5">
                          Address Category
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "Home", icon: Home },
                            { id: "Work", icon: Briefcase },
                            { id: "Other", icon: MapPin },
                          ].map((lbl) => {
                            const LIcon = lbl.icon;
                            const isSelected = newAddrLabel === lbl.id;
                            const isAlreadySaved =
                              lbl.id !== "Other" &&
                              (addresses || []).some(
                                (a) =>
                                  (a.label || "").toLowerCase() ===
                                  lbl.id.toLowerCase(),
                              );

                            return (
                              <button
                                key={lbl.id}
                                type="button"
                                disabled={isAlreadySaved}
                                onClick={() => {
                                  if (!isAlreadySaved) setNewAddrLabel(lbl.id);
                                }}
                                title={
                                  isAlreadySaved
                                    ? `${lbl.id} address is already saved in profile`
                                    : ""
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition ${isAlreadySaved
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60 line-through"
                                  : isSelected
                                    ? "bg-brand-orange text-white border-brand-orange shadow-xs cursor-pointer"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 cursor-pointer"
                                  }`}
                              >
                                <LIcon className="h-3.5 w-3.5" />
                                <span>{lbl.id}</span>
                                {isAlreadySaved && (
                                  <span className="text-[11px] font-black uppercase bg-gray-200 text-gray-600 px-1 py-0.5 rounded no-underline">
                                    Saved
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {newAddrLabel === "Other" && (
                        <div className="space-y-1 animate-fade-in">
                          <label className="text-[11px] text-gray-400 font-black uppercase tracking-wider block">
                            Custom Label Name (e.g. Gym, Parents' House)
                          </label>
                          <input
                            type="text"
                            value={newAddrCustomLabel}
                            onChange={(e) =>
                              setNewAddrCustomLabel(e.target.value)
                            }
                            placeholder="Enter custom location name"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
                            required
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] text-gray-400 font-black uppercase tracking-wider block mb-1">
                          Full Address Details
                        </label>
                        <textarea
                          rows={3}
                          value={newAddrDetail}
                          onChange={(e) => setNewAddrDetail(e.target.value)}
                          placeholder="House/Flat No., Building, Street Name, Landmark, City, Pincode"
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 resize-none leading-relaxed"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-400 font-black uppercase tracking-wider block mb-1">
                          Contact Phone for Driver
                        </label>
                        <input
                          type="tel"
                          value={newAddrContact}
                          onChange={(e) => setNewAddrContact(e.target.value)}
                          placeholder="Phone number for delivery updates"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          {isSavingAddress ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Saving to Profile...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Save & Deliver Here</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* CASE 3: List Saved Profile Addresses */}
                {addresses && addresses.length > 0 && !isAddingNewAddress && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">
                      Select delivery address saved in your profile:
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {addresses.map((addr) => {
                        const addrId = addr.id || addr._id;
                        const isSelected =
                          selectedAddressId === addrId ||
                          addressDetail === addr.detail;
                        const labelLower = (addr.label || "home").toLowerCase();
                        const AddrIcon =
                          labelLower === "home"
                            ? Home
                            : labelLower === "work"
                              ? Briefcase
                              : MapPin;

                        return (
                          <div
                            key={addrId || addr.detail}
                            onClick={() => handleSelectAddress(addr)}
                            className={`cursor-pointer p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${isSelected
                              ? "bg-orange-50/40 border-brand-orange ring-2 ring-orange-200/60 shadow-xs"
                              : "bg-gray-50/70 border-gray-100 hover:bg-gray-100/70 hover:border-gray-200"
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2.5 rounded-xl shrink-0 ${isSelected
                                  ? "bg-brand-orange text-white"
                                  : "bg-white text-gray-500 border border-gray-200 shadow-xs"
                                  }`}
                              >
                                <AddrIcon className="h-4 w-4" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-xs text-gray-900 uppercase tracking-wider">
                                    {addr.label || "Address"}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase px-2 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                  {addr.detail}
                                </p>
                                {addr.contact && (
                                  <p className="text-[11px] text-gray-400 font-bold">
                                    Phone: {addr.contact}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="pt-1 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected
                                  ? "border-brand-orange bg-brand-orange text-white"
                                  : "border-gray-300 bg-white"
                                  }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-xs"
                id="checkout-instructions-section"
              >
                <div className="flex items-center gap-2 text-gray-800 font-extrabold text-base border-b border-gray-50 pb-2">
                  <Truck className="h-5 w-5 text-orange-700" />
                  <h3>3. Delivery Instructions</h3>
                </div>
                <input
                  type="text"
                  value={deliveryInstruction}
                  onChange={(e) => setDeliveryInstruction(e.target.value)}
                  placeholder="E.g., leave at door"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-xs outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          ) : (
            <div
              className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-6 shadow-sm animate-fade-in"
              id="checkout-payment-section"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="text-gray-800 font-black text-base">
                      Select Payment Method
                    </h3>
                    <p className="text-[11px] text-gray-400 font-semibold">
                      256-Bit SSL Secured Terminal Connection
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "upi_gpay",
                    name: "Google Pay (GPay)",
                    description: "Fast UPI payment via Google Pay app on your device.",
                    icon: Smartphone,
                    badge: "Popular UPI",
                  },
                  {
                    id: "upi_phonepe",
                    name: "PhonePe",
                    description: "Instant UPI transfer using PhonePe app.",
                    icon: Smartphone,
                    badge: "Fast UPI",
                  },
                  {
                    id: "upi_paytm",
                    name: "Paytm UPI",
                    description: "Pay using Paytm UPI or Paytm Bank.",
                    icon: Smartphone,
                    badge: "UPI",
                  },
                  {
                    id: "upi_generic",
                    name: "Other UPI / QR Code",
                    description: "BHIM, Cred UPI, WhatsApp Pay or scan QR.",
                    icon: QrCode,
                    badge: "UPI / QR",
                  },
                  {
                    id: "credit_card",
                    name: "Credit / Debit Cards",
                    description: "Visa, Mastercard, RuPay, Amex, Diner's.",
                    icon: CreditCard,
                    badge: "Cards",
                  },
                  {
                    id: "netbanking",
                    name: "NetBanking & Wallets",
                    description: "HDFC, ICICI, SBI, Axis & major Indian banks.",
                    icon: Building,
                    badge: "NetBanking",
                  },
                  {
                    id: "cod",
                    name: "Cash on Delivery (COD)",
                    description: "Pay in cash upon delivery at your doorstep.",
                    icon: Truck,
                    badge: "Pay Cash",
                  },
                ].map((m) => {
                  const isSelected = paymentMethod === m.id;
                  const IconComp = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`cursor-pointer w-full p-4 rounded-2xl border text-left transition flex items-start justify-between gap-4 ${isSelected
                        ? "bg-neutral-900 text-white border-transparent shadow-lg shadow-neutral-900/15"
                        : "bg-gray-50 hover:bg-gray-100/80 border-transparent text-gray-700"
                        }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`p-2.5 rounded-xl ${isSelected
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-500 shadow-sm border border-gray-100"
                            }`}
                        >
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider block">
                              {m.name}
                            </span>
                            <span
                              className={`text-[11px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${isSelected
                                ? "bg-orange-500 text-white"
                                : "bg-gray-200 text-gray-600"
                                }`}
                            >
                              {m.badge}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] mt-1 leading-relaxed ${isSelected ? "text-gray-300" : "text-gray-500"
                              }`}
                          >
                            {m.description}
                          </p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300 bg-white"
                            }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === "credit_card" ? (
                <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-3xl text-white space-y-5 shadow-xl border border-neutral-800 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-orange-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-200">
                        Credit / Debit Card Details
                      </h4>
                    </div>
                    <span className="text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      256-Bit Encrypted
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Cardholder Name */}
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                        Cardholder Full Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="e.g. Vedanshi Bhabhra"
                        className="w-full bg-neutral-800/80 border border-neutral-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-semibold transition"
                      />
                    </div>

                    {/* Card Number */}
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                        16-Digit Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                            const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
                            setCardNumber(formatted);
                          }}
                          placeholder="4532 0000 0000 0000"
                          className="w-full bg-neutral-800/80 border border-neutral-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-mono font-semibold transition tracking-wider"
                        />
                        <CreditCard className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
                      </div>
                    </div>

                    {/* Expiry & CVV Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                          Expiry Date (MM/YY)
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (raw.length >= 3) {
                              raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
                            }
                            setCardExpiry(raw);
                          }}
                          placeholder="MM/YY"
                          className="w-full bg-neutral-800/80 border border-neutral-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-mono font-semibold transition tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block mb-1.5">
                          CVV / CVC Code
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardCvv(raw);
                          }}
                          placeholder="•••"
                          className="w-full bg-neutral-800/80 border border-neutral-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none font-mono font-semibold transition tracking-wider"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 font-medium leading-relaxed pt-1">
                    🔒 Card details are encrypted using PCI-DSS 256-Bit SSL standard before being forwarded to Razorpay checkout terminal.
                  </p>
                </div>
              ) : paymentMethod === "cod" ? (
                <div className="bg-emerald-50/60 p-6 rounded-3xl border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                    Pay in cash when your food is delivered to your doorstep. Click <strong>Authorize Payment</strong> below to confirm your order.
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Razorpay Standard Checkout Gateway</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Selected payment option will be processed securely via{" "}
                    <strong>Razorpay Gateway</strong>. Click{" "}
                    <strong>Authorize Payment</strong> below to open the payment
                    terminal.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Promo Codes Card on Checkout */}
          <div
            className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-sm"
            id="checkout-coupon-section"
          >
            <div className="flex items-center gap-2 text-gray-800 font-extrabold text-base border-b border-gray-50 pb-2">
              <Ticket className="h-5 w-5 text-orange-700" />
              <h3>Coupons & Promo Codes</h3>
            </div>

            {appliedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl">
                    <Percent className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs uppercase tracking-wider">
                        Code {appliedCoupon.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 font-semibold">
                      {appliedCoupon.code === "FREEDEL" ||
                        appliedCoupon.discountType === "free-delivery"
                        ? "Free Delivery unlocked for your order!"
                        : `Saved ₹ ${appliedCoupon.discount} on your order!`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-black text-rose-700 hover:underline shrink-0 bg-white border border-rose-200 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100/80 rounded-2xl p-4 flex items-center justify-between text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-200/60 p-2.5 rounded-xl text-gray-500">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-gray-800 block">
                      No coupon applied
                    </span>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Coupons can be applied on the Cart page before checkout.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="text-xs font-bold text-orange-700 hover:underline shrink-0 bg-white border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition cursor-pointer"
                >
                  Go to Cart
                </button>
              </div>
            )}
          </div>

          <div
            className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm"
            id="checkout-summary-section"
          >
            <h3 className="font-display font-black text-base text-gray-800 uppercase tracking-wide border-b border-gray-50 pb-3">
              Order Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>Basket Subtotal</span>
                <span className="font-mono text-gray-800">₹ {subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>Delivery Charges</span>
                <span className="font-mono text-gray-800">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-black uppercase">
                      FREE DELIVERY
                    </span>
                  ) : (
                    `₹ ${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 font-semibold">
                <span>Taxes & Service (5%)</span>
                <span className="font-mono text-gray-800">
                  ₹ {taxesAndService}
                </span>
              </div>
              {currentTip > 0 && (
                <div className="flex justify-between text-gray-500 font-semibold">
                  <span>Delivery Tip</span>
                  <span className="font-mono text-orange-700">
                    + ₹ {currentTip}
                  </span>
                </div>
              )}
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between font-bold text-emerald-600 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5" />
                    Coupon Discount ({appliedCoupon.code})
                  </span>
                  <span className="font-mono font-black">
                    - ₹ {couponDiscount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4 mt-2 flex justify-between items-center">
              <div>
                <span className="font-display font-black text-lg text-gray-900 block">
                  Grand Total
                </span>
                <span className="text-[11px] text-gray-400 font-semibold uppercase">
                  VAT Inclusive
                </span>
              </div>
              <span className="font-mono font-black text-2xl text-orange-700">
                ₹ {grandTotal.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {!paymentScreenActive ? (
                <button
                  onClick={handleProceedToPayment}
                  className="w-full bg-brand-orange hover:bg-orange-700 text-white font-display font-black text-base py-4 px-6 rounded-2xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full bg-brand-orange hover:bg-orange-700 disabled:bg-gray-300 text-white font-display font-black text-base py-4 px-6 rounded-2xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing Secure Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Authorize Payment • ₹ {grandTotal.toFixed(2)}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (paymentScreenActive) {
                    setPaymentScreenActive(false);
                  } else {
                    navigate("/cart");
                  }
                }}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 font-extrabold text-xs py-3 rounded-2xl transition"
              >
                {paymentScreenActive
                  ? "Modify Delivery Details"
                  : "Review Cart & Instructions"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
