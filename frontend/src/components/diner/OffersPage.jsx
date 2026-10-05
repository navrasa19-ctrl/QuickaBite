import { useState, useEffect } from "react";
import {
  HiTicket,
  HiBuildingLibrary,
  HiSparkles,
  HiTag,
  HiWallet,
  HiCalendar,
  HiCheck,
} from "react-icons/hi2";
import { MdRestaurant } from "react-icons/md";
import { DETAILED_OFFERS } from "../../data";
import { dinerService } from "../../api/dinerService";
import { useCart } from "../../context/CartContext";

export default function OffersPage({
  preAppliedCoupon,
  setPreAppliedCoupon,
  triggerToast,
}) {
  const { appliedCoupon, setAppliedCoupon, removeCoupon, cartItems } = useCart();
  const [selectedOfferCategory, setSelectedOfferCategory] = useState(null);
  const isMock = import.meta.env.VITE_USE_MOCK !== "false";
  const [offersList, setOffersList] = useState(() =>
    isMock ? [...DETAILED_OFFERS] : [],
  );

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const list = await dinerService.getActiveCoupons();
        const formatted = (list || []).map((item) => ({
          id: item._id || item.id || item.code,
          code: item.code,
          title: item.title || item.bannerTitle || `${item.code} Coupon`,
          desc: item.desc || item.policyText || `Get discount on your order using ${item.code}`,
          discount: item.discount || (item.discountType === "percentage" ? `${item.discountValue}% OFF` : `₹${item.discountValue} OFF`),
          expiry: item.expiry || "Valid today",
          category: item.category || "coupon",
          calc: item.calc || null,
          discountType: item.discountType,
          discountValue: item.discountValue,
          minOrder: item.minimumOrderAmount || item.minOrder || 0,
          accentColor: item.accentColor || "bg-orange-100 text-orange-700 border border-orange-200",
        }));

        if (isMock) {
          const merged = [
            ...formatted,
            ...DETAILED_OFFERS.filter(
              (o) => !formatted.some((l) => l.code === o.code),
            ),
          ];
          setOffersList(merged);
        } else {
          setOffersList(formatted.length > 0 ? formatted : DETAILED_OFFERS);
        }
      } catch (err) {
        console.error("Failed to fetch coupons on OffersPage:", err);
        setOffersList(DETAILED_OFFERS);
      }
    };
    fetchCoupons();
  }, []);

  return (
    <div
      className="space-y-10 max-w-[1400px] mx-auto py-1 animate-fade-in"
      id="offers-viewport"
    >
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 transform hover:scale-105 transition-all duration-300">
          <HiTicket className="text-3xl" />
        </div>
        <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight">
          Coupons, Offers & Cashback
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Save big on your culinary journeys. Explore bank rewards, festive
          deals, sponsor dining discounts, and instant cashbacks.
        </p>

        {/* Highlight state of currently pre-applied coupon */}
        {preAppliedCoupon && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-full font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active Basket Promo:{" "}
            <span className="font-mono underline font-black">
              {preAppliedCoupon}
            </span>
            <button
              onClick={() => {
                setPreAppliedCoupon("");
                triggerToast("Promo code removed.");
              }}
              className="ml-2 hover:text-red-500 underline font-black cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Quick Filter Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 border-b border-gray-100 pb-5">
        {[
          { id: "all", label: "All Deals", icon: HiTicket },
          { id: "bank", label: "Bank Offers", icon: HiBuildingLibrary },
          { id: "festival", label: "Festival Offers", icon: HiSparkles },
          { id: "restaurant", label: "Restaurants", icon: MdRestaurant },
          { id: "coupon", label: "Coupon Cards", icon: HiTag },
          { id: "cashback", label: "Cashback Offers", icon: HiWallet },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive =
            (cat.id === "all" && !selectedOfferCategory) ||
            selectedOfferCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedOfferCategory(cat.id === "all" ? null : cat.id)
              }
              className={`group inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-gray-900 text-white shadow-md scale-105 ring-2 ring-gray-900/10"
                  : "bg-gray-100 text-gray-600 hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 hover:scale-105 active:scale-95 border border-transparent hover:border-orange-400"
              }`}
            >
              <Icon
                className={`text-base transition-colors duration-200 ${
                  isActive
                    ? "text-orange-400"
                    : "text-gray-500 group-hover:text-white"
                }`}
              />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Rendering of Sections */}
      {["bank", "festival", "restaurant", "coupon", "cashback"]
        .filter(
          (cat) => !selectedOfferCategory || selectedOfferCategory === cat,
        )
        .map((cat) => {
          const sectionOffers = offersList.filter(
            (o) =>
              o.category === cat ||
              (cat === "coupon" &&
                !["bank", "festival", "restaurant", "cashback"].includes(o.category)),
          );
          if (sectionOffers.length === 0) return null;

          const sectionMeta = {
            bank: { title: "Bank Offers", icon: HiBuildingLibrary },
            festival: { title: "Festival Offers", icon: HiSparkles },
            restaurant: { title: "Restaurant Offers", icon: MdRestaurant },
            coupon: { title: "Coupon Cards", icon: HiTag },
            cashback: { title: "Cashback Offers", icon: HiWallet },
          };

          const sectionSubtitles = {
            bank: "Save extra using partner debit, credit, or internet banking cards",
            festival:
              "Limited-period celebration promos and local cultural feast deals",
            restaurant:
              "Exclusive discounts directly sponsored by your favorite outlets",
            coupon:
              "Standard utility coupon cards for smart and speedy savings",
            cashback:
              "Earn instant loyalty credits and wallet balance on successful checkout",
          };

          const { title: sectionTitle, icon: SectionIcon } = sectionMeta[cat];

          return (
            <div key={cat} className="space-y-4 animate-fade-in">
              <div className="border-l-4 border-orange-500 pl-3">
                <h3 className="font-display font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                  <SectionIcon className="text-orange-500 text-xl shrink-0" />
                  <span>{sectionTitle}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {sectionSubtitles[cat]}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {sectionOffers.map((offer) => {
                  const isApplied =
                    (appliedCoupon && appliedCoupon.code === offer.code) ||
                    preAppliedCoupon === offer.code;
                  return (
                    <div
                      key={offer.id}
                      className={`border border-dashed p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 relative bg-white hover:border-orange-300 hover:shadow-xs ${isApplied ? "border-emerald-500 ring-2 ring-emerald-50/70 bg-emerald-50/10" : "border-gray-200"}`}
                    >
                      {/* Inner ticket design semi-circles */}
                      <div className="absolute top-1/2 -left-3 h-6 w-6 bg-neutral-50 border-r border-dashed border-gray-200 rounded-full transform -translate-y-1/2" />
                      <div className="absolute top-1/2 -right-3 h-6 w-6 bg-neutral-50 border-l border-dashed border-gray-200 rounded-full transform -translate-y-1/2" />

                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <span
                            className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${offer.accentColor}`}
                          >
                            {offer.discount}
                          </span>
                          <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                            <HiCalendar className="text-xs text-gray-400" />
                            <span>{offer.expiry}</span>
                          </span>
                        </div>

                        <h4 className="font-display font-black text-lg text-gray-900 leading-tight">
                          {offer.title}
                        </h4>

                        <p className="text-xs text-gray-500 leading-relaxed">
                          {offer.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 gap-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(offer.code);
                            triggerToast(`Coupon code "${offer.code}" copied!`);
                          }}
                          className="font-mono font-black text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg tracking-wider border border-orange-100 flex items-center gap-1 transition cursor-pointer"
                          title="Click to copy code"
                        >
                          {offer.code}
                          <span className="text-[11px] text-orange-400 font-normal">
                            (Copy)
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            if (isApplied) {
                              if (typeof setPreAppliedCoupon === "function") {
                                setPreAppliedCoupon("");
                              }
                              removeCoupon();
                              triggerToast(
                                `Removed coupon code: ${offer.code}`,
                              );
                            } else {
                              const subtotal = cartItems.reduce(
                                (acc, curr) =>
                                  acc +
                                  Number(curr?.menuItem?.price ?? curr?.price ?? 0) *
                                    Number(curr?.quantity ?? 1),
                                0,
                              );
                              let discount = 0;
                              if (offer.calc) {
                                discount = offer.calc(subtotal);
                              } else if (offer.discountType === "percentage") {
                                const calcVal = Math.round(
                                  subtotal * ((offer.discountValue || 40) / 100),
                                );
                                discount = offer.maximumDiscount
                                  ? Math.min(offer.maximumDiscount, calcVal)
                                  : calcVal;
                              } else {
                                discount = offer.discountValue || 40;
                              }
                              if (typeof setPreAppliedCoupon === "function") {
                                setPreAppliedCoupon(offer.code);
                              }
                              setAppliedCoupon({
                                code: offer.code,
                                discount,
                                discountType: offer.discountType || "percentage",
                                minOrder: offer.minOrder || 0,
                                couponObj: offer,
                              });
                              triggerToast(
                                `Coupon code "${offer.code}" applied to cart!`,
                              );
                            }
                          }}
                          className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${isApplied ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs" : "bg-gray-900 hover:bg-gray-800 text-white"}`}
                        >
                          {isApplied ? (
                            <>
                              <HiCheck className="text-sm stroke-[1.5]" />
                              <span>Applied</span>
                            </>
                          ) : (
                            "Apply Code"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}

