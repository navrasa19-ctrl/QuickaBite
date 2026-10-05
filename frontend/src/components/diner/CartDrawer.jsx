import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Ticket,
  CreditCard,
  Loader2,
  Info,
} from "lucide-react";
import { dinerService } from "../../api/dinerService";
export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  restaurantId,
  restaurantName,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onCheckoutSuccess,
  onProceedToCheckout,
}) {
  const {
    cartRestaurant,
    specialInstructions,
    updateSpecialInstructions,
    tipAmount = 0,
    appliedCoupon,
    setAppliedCoupon,
    removeCoupon,
  } = useCart();
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [couponsList, setCouponsList] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const list = await dinerService.getActiveCoupons();
        setCouponsList(list || []);
      } catch (err) {
        console.error("Failed to load coupons in CartDrawer:", err);
      }
    };
    if (isOpen) {
      fetchCoupons();
    }
  }, [isOpen]);

  useEffect(() => {
    if (specialInstructions !== undefined) {
      setDeliveryNotes(specialInstructions);
    }
  }, [specialInstructions]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;
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
    deliveryType === "delivery" &&
    !(
      appliedCoupon?.code === "FREEDEL" ||
      appliedCoupon?.discountType === "free-delivery"
    ) &&
    !isFreeDelivery
      ? restaurantDeliveryFee
      : 0;
  const taxAndServices = subtotal > 0 ? 5 : 0;
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
    if (c.calc) return c.calc;
    return (sub) => {
      if (c.discountType === "percentage") {
        const calcVal = Math.round(sub * (c.discountValue / 100));
        return c.maximumDiscount
          ? Math.min(c.maximumDiscount, calcVal)
          : calcVal;
      }
      if (c.discountType === "flat") {
        return c.discountValue || 0;
      }
      return 0;
    };
  };

  const availableCoupons = isMock
    ? [
        ...couponsList.map((c) => ({ ...c, calc: getCouponCalc(c) })),
        ...staticCoupons,
      ]
    : couponsList.map((c) => ({ ...c, calc: getCouponCalc(c) }));
  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCode).toUpperCase().trim();
    if (!code) return;
    setCouponError("");
    const coupon = availableCoupons.find((c) => c.code === code);
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
    const discount = coupon.calc(subtotal);
    setAppliedCoupon({
      code,
      discount,
      discountType: coupon.discountType,
      minOrder: coupon.minOrder,
      couponObj: coupon,
    });
    setCouponCode("");
  };
  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setCouponCode("");
    setCouponError("");
  };
  const finalDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const currentTip = Number(tipAmount) || 0;
  const total = Math.max(
    0,
    subtotal + deliveryFee + taxAndServices + currentTip - finalDiscount,
  );
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (onProceedToCheckout) {
      onProceedToCheckout();
      onClose();
      return;
    }
    setIsCheckingOut(true);
    setTimeout(() => {
      const mockOrder = {
        id: `GE-${Math.floor(1e5 + Math.random() * 9e5)}`,
        restaurantId,
        restaurantName,
        items: [...cartItems],
        status: "received",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        subtotal,
        deliveryFee,
        discount: finalDiscount,
        tax: taxAndServices,
        total,
        couponCode: appliedCoupon?.code,
        driverCoords: { x: 10, y: 15 },
      };
      onCheckoutSuccess(mockOrder);
      setIsCheckingOut(false);
      onClearCart();
      onClose();
    }, 2e3);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      id="cart-drawer-container"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
        id="cart-drawer-panel"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-orange-700" />
            <h2 className="font-display font-extrabold text-lg text-gray-800">
              Your Basket
            </h2>
            <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
              {cartItems.length} Items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cartItems.length > 0 ? (
          <>
            {/* Scrollable Cart Details */}
            <div
              className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
              id="cart-scroll-container"
            >
              {/* Delivery Type selector */}
              <div className="grid grid-cols-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${deliveryType === "delivery" ? "bg-white text-orange-700 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Home Delivery
                </button>
              </div>

              {/* Restaurant title card */}
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/30">
                <span className="text-[11px] text-orange-700 font-extrabold uppercase tracking-widest block">
                  Ordering From
                </span>
                <span className="font-display font-black text-base text-gray-800 block">
                  {restaurantName}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-4" id="cart-items-list">
                {cartItems.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="flex items-center justify-between gap-4 py-2 border-b border-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-3 w-3 border flex items-center justify-center rounded-xs ${item.menuItem.isVeg ? "border-emerald-500" : "border-rose-500"}`}
                        >
                          <div
                            className={`h-1 w-1 rounded-full ${item.menuItem.isVeg ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                        </div>
                        <h4 className="font-bold text-gray-700 text-sm truncate">
                          {item.menuItem.name}
                        </h4>
                      </div>
                      <span className="font-mono text-xs text-gray-400 mt-0.5 block">
                        ₹ {item.menuItem.price} each
                      </span>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg p-1">
                      <button
                        onClick={() =>
                          onRemoveFromCart(restaurantId, item.menuItem.id)
                        }
                        className="h-6 w-6 text-gray-500 hover:bg-gray-200 rounded flex items-center justify-center font-bold text-sm transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-sm text-gray-800">
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
                        className="h-6 w-6 text-gray-500 hover:bg-gray-200 rounded flex items-center justify-center font-bold text-sm transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-gray-800 text-sm w-16 text-right">
                      ₹ {item.menuItem.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Special Instructions
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  onBlur={(e) => updateSpecialInstructions(e.target.value)}
                  placeholder="E.g. Ring the doorbell twice, leave at reception..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100 transition resize-none h-16"
                />
              </div>

              {/* Coupons & Promos box */}
              <div className="border-t border-gray-100 pt-5 space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Promo Codes
                </label>

                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-emerald-800">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-xs">
                          COUPON {appliedCoupon.code} APPLIED!
                        </span>
                        <p className="text-[11px] text-emerald-600 mt-0.5">
                          {appliedCoupon.code === "FREEDEL"
                            ? "Free delivery charge applied"
                            : `Saved ₹ ${appliedCoupon.discount} on your feast`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-black text-emerald-800 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter WELCOME50, FOOD40..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-orange-200 transition font-mono uppercase"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      className="bg-gray-800 hover:bg-black text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-500 font-semibold">
                    {couponError}
                  </p>
                )}

                {/* Popular fast coupons helpers */}
                {!appliedCoupon && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setCouponCode("WELCOME50");
                        handleApplyCoupon("WELCOME50");
                      }}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition"
                    >
                      WELCOME50 (50% Off)
                    </button>
                    <button
                      onClick={() => {
                        setCouponCode("FOOD40");
                        handleApplyCoupon("FOOD40");
                      }}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition"
                    >
                      FOOD40 (40% Off)
                    </button>
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div
                className="border-t border-gray-100 pt-5 space-y-2.5"
                id="cart-bill-details"
              >
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Basket Subtotal</span>
                  <span className="font-mono">₹ {subtotal}</span>
                </div>
                {deliveryType === "delivery" && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Delivery Charge</span>
                    <span className="font-mono">
                      {appliedCoupon?.code === "FREEDEL" ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹ ${deliveryFee}`
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Taxes & Service Fees</span>
                  <span className="font-mono">₹ {taxAndServices}</span>
                </div>
                {currentTip > 0 && (
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>Delivery Tip</span>
                    <span className="font-mono text-orange-700">
                      + ₹ {currentTip}
                    </span>
                  </div>
                )}
                {appliedCoupon && appliedCoupon.discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">
                      - ₹ {appliedCoupon.discount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base text-gray-800 font-extrabold pt-2 border-t border-dashed border-gray-100">
                  <span>Grand Total</span>
                  <span className="font-mono text-orange-700">₹ {total}</span>
                </div>
              </div>

              {/* Secure guarantee */}
              <div className="bg-emerald-50/50 rounded-xl p-3 flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>
                  100% Secure Checkout. Handled professionally under premium
                  safety parameters.
                </span>
              </div>
            </div>

            {/* Bottom Checkout trigger */}
            <div
              className="p-6 border-t border-gray-100 bg-white"
              id="cart-bottom-checkout-trigger"
            >
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-brand-orange hover:bg-orange-700 disabled:bg-gray-400 text-white font-display font-extrabold text-base py-4 rounded-2xl shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2.5 transition active:scale-98"
                id="cart-checkout-btn"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Place Order • ₹ {total}</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-20 w-20 bg-orange-50 text-orange-700 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-gray-800">
              Your basket is empty
            </h3>
            <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed">
              Add mouthwatering delicacies from your favorite restaurants and
              check out with elite rewards!
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-brand-orange hover:bg-orange-700 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-md transition"
            >
              Start Exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
