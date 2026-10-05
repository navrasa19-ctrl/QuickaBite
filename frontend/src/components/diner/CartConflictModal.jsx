import React from "react";

export default function CartConflictModal({
  cartConflict,
  cartRestaurantName,
  onClose,
  onConfirm,
}) {
  React.useEffect(() => {
    if (cartConflict) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartConflict]);

  if (!cartConflict) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-55 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer"
      id="cart-conflict-modal"
      onClick={handleOverlayClick}
    >
      <div className="bg-white border border-gray-100 rounded-premium p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="h-14 w-14 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-black text-xl text-gray-900">
            Replace Basket Items?
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your basket already has items from{" "}
            <span className="font-bold text-gray-800">
              "{cartRestaurantName}"
            </span>
            . Would you like to clear your current basket and start a fresh
            feast with{" "}
            <span className="font-bold text-gray-800">
              "{cartConflict.resName}"
            </span>
            ?
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs py-3 rounded-xl transition"
          >
            Keep Current
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition"
          >
            Clear & Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
