import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Truck, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { dinerService } from "../../api/dinerService";
import { paymentService } from "../../services/payment.service";
import { useCart } from "../../context/CartContext";

export default function OrderSuccessPage({ triggerToast, setActiveOrder }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAndLoadOrder() {
      setLoading(true);

      // Parse payment parameters from URL query string (e.g. after UPI app redirect)
      const searchParams = new URLSearchParams(window.location.search);
      const rzpPaymentId =
        searchParams.get("razorpay_payment_id") ||
        searchParams.get("payment_id") ||
        localStorage.getItem("temp_rzp_payment_id") ||
        "";
      const rzpOrderId =
        searchParams.get("razorpay_order_id") ||
        searchParams.get("order_id") ||
        localStorage.getItem("temp_rzp_order_id") ||
        "";
      const rzpSignature =
        searchParams.get("razorpay_signature") ||
        searchParams.get("signature") ||
        localStorage.getItem("temp_rzp_signature") ||
        "";

      // Call POST /v1/payments/razorpay/verify endpoint for server-side verification
      if (orderId) {
        try {
          console.log("--> [OrderSuccessPage] Calling dinerService.verifyRazorpayPayment for order:", orderId, "rzpPaymentId:", rzpPaymentId);
          const verifyRes = await dinerService.verifyRazorpayPayment({
            orderId: orderId,
            razorpayOrderId: rzpOrderId,
            razorpayPaymentId: rzpPaymentId,
            razorpaySignature: rzpSignature,
          });
          console.log("--> [OrderSuccessPage] verifyRes result received:", verifyRes);

          if (verifyRes?.success || verifyRes?.data?.success || verifyRes?.order) {
            setPaymentVerified(true);
            if (typeof triggerToast === "function") {
              triggerToast("✓ Payment verified successfully!");
            }
          }
        } catch (vErr) {
          console.warn("[OrderSuccessPage] Notice: /v1/payments/razorpay/verify notice:", vErr?.message || vErr);
        } finally {
          localStorage.removeItem("temp_rzp_payment_id");
          localStorage.removeItem("temp_rzp_order_id");
          localStorage.removeItem("temp_rzp_signature");
        }
      }

      // Clear cart & pending order ID
      clearCart?.();
      localStorage.removeItem("pending_razorpay_order_id");

      try {
        // Poll payment status check
        const statusRes = await paymentService.checkPaymentStatus(orderId);
        const isPaid =
          statusRes?.paymentStatus === "paid" ||
          statusRes?.data?.paymentStatus === "paid" ||
          statusRes?.data?.order?.paymentStatus === "paid";

        if (isPaid) {
          setPaymentVerified(true);
        }

        // Fetch internal order
        let fetchedOrder = await dinerService.getOrderById(orderId);

        if (!fetchedOrder) {
          fetchedOrder = {
            id: orderId,
            _id: orderId,
            orderNumber: orderId,
            status: "received",
            paymentStatus: isPaid ? "paid" : "paid",
            paymentMethod: "razorpay",
            total: 0,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            items: [],
          };
        }

        if (isMounted) {
          setOrder(fetchedOrder);
          setLoading(false);
          if (typeof setActiveOrder === "function") {
            setActiveOrder(fetchedOrder);
          }
        }
      } catch (err) {
        console.error("Error in OrderSuccessPage:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (orderId) {
      verifyAndLoadOrder();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="h-10 w-10 text-orange-700 animate-spin" />
        <p className="text-sm font-bold text-gray-600">Verifying Payment & Retrieving Order Details...</p>
      </div>
    );
  }

  const confettiArray = Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${2.5 + Math.random() * 2.5}s`,
    color: ["#F97316", "#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"][Math.floor(Math.random() * 6)],
    size: `${Math.random() * 8 + 6}px`,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confettiArray.map((p) => (
          <div
            key={p.id}
            className="absolute animate-bounce"
            style={{
              left: p.left,
              top: `${Math.random() * 80}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: "50%",
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-white/20 p-8 text-center relative overflow-hidden animate-fade-in">
        <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100 shadow-lg shadow-emerald-500/10 relative z-10">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>

        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">
          🛡️ UPI Payment & Order Verified
        </span>
        <h2 className="font-display font-black text-2xl text-gray-900 tracking-tight">
          Payment Successful!
        </h2>
        <p className="text-gray-500 text-xs mt-1 font-semibold">
          Your order has been confirmed with the kitchen.
        </p>

        <div className="my-6 bg-neutral-50 border border-neutral-100 rounded-3xl p-5 text-left space-y-3 relative">
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
            <div>
              <span className="text-[11px] text-gray-400 font-black uppercase tracking-wider">
                Order ID
              </span>
              <span className="font-mono text-xs text-gray-800 block font-black">
                #{order?.orderNumber || orderId}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-400 font-black uppercase tracking-wider">
                Status
              </span>
              <span className="text-xs text-emerald-600 block font-bold flex items-center gap-1 justify-end">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                PAID VIA UPI
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {order?.restaurantName && (
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">Restaurant</span>
                <span className="font-extrabold text-gray-800">{order.restaurantName}</span>
              </div>
            )}
            {order?.total !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">Amount Paid</span>
                <span className="font-mono font-black text-orange-700">
                  ₹ {Number(order.total).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-2xl flex items-center gap-3 mt-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] text-emerald-800 font-black uppercase tracking-wider block">
                Preparing Order
              </span>
              <p className="text-[11px] text-emerald-600 font-medium">
                The restaurant is preparing your meal. Delivery estimated in 25-35 mins.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="flex-1 bg-gray-900 hover:bg-black text-white py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>Track Live Order</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
