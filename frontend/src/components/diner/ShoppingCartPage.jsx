import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { dinerService } from "../../api/dinerService";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Ticket,
  Percent,
  ArrowLeft,
  CreditCard,
  Loader2,
  Heart,
  Coins,
  Utensils,
  ShieldCheck,
} from "lucide-react";
const availableCoupons = [
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

export default function ShoppingCartPage({
  cartItems,
  restaurantName,
  restaurantId,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onCheckoutSuccess,
  setActiveTab,
  triggerToast,
  preAppliedCoupon,
  setPreAppliedCoupon,
}) {
  const {
    cartRestaurant,
    specialInstructions,
    tipAmount: contextTipAmount,
    updateSpecialInstructions,
    updateTip,
    appliedCoupon,
    setAppliedCoupon,
    removeCoupon,
  } = useCart();
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [tipAmount, setTipAmount] = useState(null);
  const [customTip, setCustomTip] = useState("");
  const [showCustomTipInput, setShowCustomTipInput] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [couponsList, setCouponsList] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const list = await dinerService.getActiveCoupons();
        setCouponsList(list || []);
      } catch (e) {
        console.error("Failed to load coupons in ShoppingCartPage:", e);
      }
    };
    fetchCoupons();
  }, []);

  const isMock = import.meta.env.VITE_USE_MOCK !== "false";
  const mergedCoupons = isMock
    ? [
      ...couponsList,
      ...availableCoupons.filter(
        (ac) => !couponsList.some((lc) => lc.code === ac.code),
      ),
    ]
    : couponsList;

  const getCouponDiscount = (coupon, sub) => {
    if (coupon.calc) {
      return coupon.calc(sub);
    }
    if (coupon.discountType === "percentage") {
      const calcVal = Math.round(sub * (coupon.discountValue / 100));
      return coupon.maximumDiscount
        ? Math.min(coupon.maximumDiscount, calcVal)
        : calcVal;
    }
    return coupon.discountValue || 0;
  };

  useEffect(() => {
    if (specialInstructions !== undefined) {
      setInstructions(specialInstructions);
    }
  }, [specialInstructions]);

  useEffect(() => {
    if (
      contextTipAmount !== undefined &&
      contextTipAmount !== null &&
      contextTipAmount > 0
    ) {
      setTipAmount(contextTipAmount);
      if (![5, 10, 15, 20].includes(Number(contextTipAmount))) {
        setCustomTip(String(contextTipAmount));
        setShowCustomTipInput(true);
      }
    } else {
      setTipAmount(null);
    }
  }, [contextTipAmount]);

  useEffect(() => {
    if (preAppliedCoupon && mergedCoupons.length > 0) {
      const code = preAppliedCoupon.toUpperCase().trim();
      const sub = cartItems.reduce(
        (acc, curr) =>
          acc +
          Number(curr?.menuItem?.price ?? curr?.price ?? 0) *
          Number(curr?.quantity ?? 1),
        0,
      );
      const coupon = mergedCoupons.find((c) => c.code === code);
      if (coupon) {
        if (sub >= coupon.minOrder) {
          const discount = getCouponDiscount(coupon, sub);
          setAppliedCoupon({
            code,
            discount,
            discountType: coupon.discountType,
          });
          triggerToast(`Coupons applied automatically: ${code}`);
        } else {
          setCouponError(
            `Min order value of ₹ ${coupon.minOrder} is required for ${code}.`,
          );
        }
      }
    }
  }, [preAppliedCoupon, cartItems.length, mergedCoupons.length]);

  const subtotal = cartItems.reduce(
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
  const currentTip = tipAmount || Number(customTip) || 0;
  const grandTotal = Math.max(
    0,
    subtotal + deliveryFee + taxesAndService + currentTip - couponDiscount,
  );

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).toUpperCase().trim();
    if (!code) return;
    setCouponError("");
    const coupon = mergedCoupons.find((c) => c.code === code);
    if (!coupon) {
      setCouponError(
        "Invalid coupon code. Try WELCOME50, FOOD40, HSBC20, or EIDFEAST.",
      );
      setAppliedCoupon(null);
      return;
    }
    if (subtotal < coupon.minOrder) {
      setCouponError(
        `Min order value of ₹ ${coupon.minOrder} is required for ${code}.`,
      );
      setAppliedCoupon(null);
      return;
    }

    if (import.meta.env.VITE_USE_MOCK === "false") {
      try {
        const res = await dinerService.applyCoupon(code);
        if (res && res.success === false && res.message) {
          if (!res.message.toLowerCase().includes("already applied")) {
            setCouponError(res.message.replace(/AED/gi, "₹"));
            setAppliedCoupon(null);
            return;
          }
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to apply coupon.";
        if (!msg.toLowerCase().includes("already applied")) {
          const cleanedMsg = msg.replace(/AED/gi, "₹");
          setCouponError(cleanedMsg);
          setAppliedCoupon(null);
          return;
        }
      }
    }

    const discount = getCouponDiscount(coupon, subtotal);
    setAppliedCoupon({
      code,
      discount,
      discountType: coupon.discountType,
      minOrder: coupon.minOrder,
      couponObj: coupon,
    });
    setCouponCode("");
    triggerToast(`Promo code ${code} applied successfully!`);
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setCouponError("");
    triggerToast("Coupon removed.");
  };
  const handleRemoveTip = () => {
    setTipAmount(null);
    setCustomTip("");
    setShowCustomTipInput(false);
    updateTip(0);
    triggerToast("Tip removed.");
  };

  const handleTipSelect = (amount) => {
    if (Number(tipAmount) === Number(amount)) {
      handleRemoveTip();
    } else {
      setTipAmount(amount);
      setCustomTip("");
      setShowCustomTipInput(false);
      updateTip(amount);
      triggerToast(
        `₹ ${amount} driver tip added! Thank you for your generosity.`,
      );
    }
  };

  const handleCustomButtonClick = () => {
    const isCustomActive =
      showCustomTipInput ||
      (tipAmount !== null &&
        tipAmount > 0 &&
        ![5, 10, 15, 20].includes(Number(tipAmount)));
    if (isCustomActive) {
      handleRemoveTip();
    } else {
      setTipAmount(null);
      setShowCustomTipInput(true);
    }
  };

  const handleCustomTipSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(customTip);
    if (isNaN(val) || val <= 0) {
      handleRemoveTip();
      return;
    }
    if (customTip.replace(/[^0-9]/g, "").length > 4) {
      triggerToast("Custom tip cannot exceed 4 digits.");
      return;
    }
    setTipAmount(val);
    updateTip(val);
    triggerToast(`Custom tip of ₹ ${val} added!`);
  };
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    updateTip(currentTip);
    navigate("/checkout");
    triggerToast("Proceeding to checkout...");
  };
  return (
    <div
      className="max-w-[1400px] mx-auto py-1 animate-fade-in"
      id="shopping-cart-page-view"
    >
      {/* Page Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => navigate("/home")}
              className="hover:text-orange-700 flex items-center gap-1 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </button>
            <span>/</span>
            <span className="text-orange-700">My Basket</span>
          </div>
          <h1 className="font-display font-black text-3xl text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-orange-700" />
            <span>Your cart</span>
          </h1>
        </div>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SECTION: Items list & settings */}
          <div className="lg:col-span-7 space-y-6">
            {/* Restaurant Badge header */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-6 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-orange-700 font-black uppercase tracking-wider block">
                  Ordering from
                </span>
                <h2 className="font-display font-black text-xl text-gray-900">
                  {restaurantName}
                </h2>
                <span className="text-xs text-gray-400 font-semibold block">
                  Fresh ingredients, cooked hygienically & packed with safety
                  seals.
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-orange-100/50 hidden sm:block">
                <Utensils className="h-6 w-6 text-orange-700" />
              </div>
            </div>

            {/* Ordered items container card */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                  Ordered Dishes
                </h3>
                <span className="bg-orange-100 text-orange-700 text-xs font-black px-2.5 py-0.5 rounded-full">
                  {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}{" "}
                  Items
                </span>
              </div>

              <div className="divide-y divide-gray-50 px-6">
                {cartItems.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Item Information */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-4 w-4 border-2 flex items-center justify-center rounded-sm shrink-0 mt-1 ${item.menuItem.isVeg ? "border-emerald-500" : "border-rose-600"}`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${item.menuItem.isVeg ? "bg-emerald-500" : "bg-rose-600"}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-gray-800 text-base">
                          {item.menuItem.name}
                        </h4>
                        <p className="text-gray-400 text-xs line-clamp-1 max-w-sm">
                          {item.menuItem.description}
                        </p>
                        <span className="font-mono text-xs text-gray-400 font-semibold block">
                          ₹ {item.menuItem.price} each
                        </span>
                      </div>
                    </div>

                    {/* Quantity selectors and Total price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-1">
                        <button
                          onClick={() =>
                            onRemoveFromCart(restaurantId, item.menuItem.id)
                          }
                          className="h-8 w-8 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-lg flex items-center justify-center font-bold text-sm transition"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-black text-sm text-gray-800 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onAddToCart(
                              restaurantId,
                              restaurantName,
                              item.menuItem,
                            )
                          }
                          className="h-8 w-8 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-lg flex items-center justify-center font-bold text-sm transition"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        <span className="font-mono font-black text-gray-900 text-sm">
                          ₹ {item.menuItem.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions block */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📝</span>
                <h3 className="font-display font-extrabold text-base text-gray-800">
                  Add instructions
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Any requests for the kitchen or rider? (e.g. "Make it mild" or "Do not ring the bell").
              </p>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                onBlur={(e) => updateSpecialInstructions(e.target.value)}
                placeholder="Type your notes or directives here..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-100 focus:border-orange-200 focus:bg-white rounded-2xl p-4 text-xs outline-none focus:ring-2 focus:ring-orange-100 transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* RIGHT SECTION: Bill Summary & Coupons */}
          <div className="lg:col-span-5 space-y-6">
            {/* Promo Codes Entry Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-5 w-5 text-orange-700" />
                <h3 className="font-display font-extrabold text-base text-gray-800">
                  Coupons & Promo Codes
                </h3>
              </div>

              {appliedCoupon ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-xl">
                      <Percent className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-black text-xs block uppercase">
                        Code {appliedCoupon.code} Applied
                      </span>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        Saved ₹ {appliedCoupon.discount} on your gourmet meal!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs font-black text-emerald-800 hover:underline shrink-0 bg-white border border-emerald-100 px-3 py-1.5 rounded-xl hover:bg-emerald-100/50 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER COUPON CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs outline-none focus:bg-white focus:border-orange-200 transition font-mono uppercase"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      className="bg-brand-orange hover:bg-orange-700 text-white font-black text-xs px-5 rounded-2xl shadow-sm transition"
                    >
                      Apply
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-red-500 font-semibold animate-shake">
                      {couponError}
                    </p>
                  )}

                  {/* Available fast vouchers helper */}
                  <div className="space-y-2 pt-2 border-t border-gray-50">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                      Recommended Promo Codes
                    </p>
                    <div className="space-y-2">
                      {mergedCoupons.map((coup) => (
                        <button
                          key={coup.code}
                          type="button"
                          onClick={() => {
                            setCouponCode(coup.code);
                            handleApplyCoupon(coup.code);
                          }}
                          className="w-full text-left p-2.5 bg-gray-50 hover:bg-orange-50/50 hover:border-orange-100 border border-transparent rounded-xl transition flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <span className="font-mono font-black text-xs text-gray-800 group-hover:text-orange-700">
                              {coup.code}
                            </span>
                            <p className="text-[11px] text-gray-400 font-medium">
                              {coup.desc}
                            </p>
                          </div>
                          <span className="text-[11px] text-orange-700 font-bold uppercase group-hover:underline">
                            Apply ✦
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Bill Summary Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm">
              <h3 className="font-display font-black text-base text-gray-800 uppercase tracking-wide border-b border-gray-50 pb-3">
                Order Bill Summary
              </h3>

              <div className="space-y-3" id="detailed-bill-breakdown">
                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>Basket Subtotal</span>
                  <span className="font-mono text-gray-800">₹ {subtotal}</span>
                </div>

                <div className="flex justify-between text-xs text-gray-500 font-semibold">
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

                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>Taxes & Municipal Services (5%)</span>
                  <span className="font-mono text-gray-800">
                    ₹ {taxesAndService}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50/50 p-2.5 rounded-xl">
                    <span className="flex items-center gap-1">
                      🏷️ Promo ({appliedCoupon.code})
                    </span>
                    <span className="font-mono">
                      - ₹ {appliedCoupon.discount}
                    </span>
                  </div>
                )}

                {currentTip > 0 && (
                  <div className="flex justify-between items-center text-xs text-orange-600 font-bold bg-orange-50/50 p-2.5 rounded-xl">
                    <span className="flex items-center gap-1">
                      💖 Rider Tip Support
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">₹ {currentTip}</span>
                      <button
                        onClick={handleRemoveTip}
                        className="text-[11px] text-gray-400 hover:text-red-500 font-bold underline transition"
                        title="Remove tip"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

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
              </div>

              {/* Secure parameters certificate */}
              <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 flex items-start gap-2.5 text-[11px] text-gray-500 font-medium">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-gray-700">
                    Premium Hygiene & Safety Certified
                  </span>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    No-contact delivery, double sanitization steps, and
                    thermally isolated cargo ensure supreme food security.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-brand-orange hover:bg-orange-700 disabled:bg-gray-300 text-white font-display font-black text-base py-4 px-6 rounded-2xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]"
                  id="checkout-proceed-btn"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Securing Feast Booking...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      <span>Proceed to Checkout • ₹ {grandTotal}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 font-extrabold text-xs py-3 rounded-2xl transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="max-w-md mx-auto text-center py-16 px-4 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-6">
          <div className="h-20 w-20 bg-orange-50 text-orange-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShoppingBag className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-black text-xl text-gray-800">
              Your Shopping Cart is Empty
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
              You haven't added any dishes to your basket yet. Explore our top
              restaurants to start a fresh feast!
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setActiveTab("home");
                setTimeout(() => {
                  const resSection = document.getElementById("restaurants-grid-section");
                  if (resSection) {
                    resSection.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              }}
              className="cursor-pointer bg-brand-orange hover:bg-orange-700 text-white font-black text-xs px-6 py-3.5 rounded-full shadow-md transition hover:scale-105"
            >
              Start Exploring Restaurants
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
