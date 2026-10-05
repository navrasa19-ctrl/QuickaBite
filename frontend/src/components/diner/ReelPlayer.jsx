import { useState, useEffect } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
export default function ReelPlayer({
  reels,
  initialReelId,
  onClose,
  onAddToCart,
}) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!reels || !Array.isArray(reels) || reels.length === 0) return 0;
    const idx = reels.findIndex((r) => r.id === initialReelId || r._id === initialReelId);
    return idx !== -1 ? idx : 0;
  });
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState({});
  const [likeCount, setLikeCount] = useState({
    "reel-1": 1420,
    "reel-2": 945,
    "reel-3": 1180,
    "reel-4": 832,
    "reel-5": 2104,
    "reel-6": 731,
  });
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!reels || !Array.isArray(reels) || reels.length === 0 || !reels[currentIndex]) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 sm:p-4 animate-fade-in cursor-pointer"
        id="reels-player-overlay"
        onClick={handleOverlayClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition cursor-pointer"
          aria-label="Close reels player"
        >
          <X className="h-6 w-6" />
        </button>

        <div
          className="relative w-full max-w-md h-full sm:h-[80vh] sm:max-h-[850px] flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full h-full bg-neutral-900 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-6 animate-pulse border border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-neutral-800 rounded-md" />
              <div className="h-8 w-8 bg-neutral-800 rounded-full" />
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 my-auto">
              <div className="h-16 w-16 rounded-full bg-neutral-800" />
              <div className="h-4 w-48 bg-neutral-800 rounded" />
              <div className="h-3 w-32 bg-neutral-800 rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-4 w-36 bg-neutral-800 rounded" />
              <div className="h-6 w-56 bg-neutral-800 rounded" />
              <div className="h-16 w-full bg-neutral-800 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentReel = reels[currentIndex];
  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(reels.length - 1);
    }
  };
  const handleLike = (id) => {
    const isLiked = !liked[id];
    setLiked({ ...liked, [id]: isLiked });
    setLikeCount({
      ...likeCount,
      [id]: isLiked ? likeCount[id] + 1 : likeCount[id] - 1,
    });
  };
  const handleOrderNow = () => {
    const mockMenuItem = {
      id: currentReel.orderNowItem.id,
      name: currentReel.orderNowItem.name,
      price: currentReel.orderNowItem.price,
      description: currentReel.description,
      image: currentReel.bgImage,
      isVeg:
        currentReel.title.toLowerCase().includes("paneer") ||
        currentReel.title.toLowerCase().includes("veg") ||
        currentReel.title.toLowerCase().includes("noodle"),
      category: "Reel Special",
    };
    onAddToCart(
      currentReel.restaurantId,
      currentReel.restaurantName,
      mockMenuItem,
    );
    setShowOrderSuccess(true);
    setTimeout(() => {
      setShowOrderSuccess(false);
    }, 2e3);
  };
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 sm:p-4 animate-fade-in cursor-pointer"
      id="reels-player-overlay"
      onClick={handleOverlayClick}
    >
      {/* Absolute close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition cursor-default"
        aria-label="Close reels player"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Wrapper to position navigation buttons relative to the card */}
      <div
        className="relative w-full max-w-md h-full sm:h-[80vh] sm:max-h-[850px] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Reels Navigation Buttons on Side of screen (Desktop) */}
        <div
          className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-5"
        >
          <button
            onClick={handlePrev}
            className="cursor-pointer h-10 w-10 rounded-full bg-white/50 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition"
            title="Previous Reel"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="cursor-pointer h-10 w-10 rounded-full bg-white/50 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition"
            title="Next Reel"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        <div
          className="relative w-full h-full bg-neutral-900 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end cursor-default"
          id="reels-main-stage"
        >
        {/* Background Visual representation of the reel */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentReel.bgImage}
            alt={currentReel.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />
        </div>

        {/* Muted toggle & Status indicator */}
        <div
          className="absolute top-4 left-4 z-20 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-extrabold tracking-widest uppercase px-2 py-1 rounded-md animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span>LIVE SHOWCASE</span>
          </div>
          <button
            onClick={() => setMuted(!muted)}
            className="h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition"
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-green-400" />
            )}
          </button>
        </div>

        {/* Right interaction column */}
        <div
          className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-5"
          id="reel-sidebar-actions"
        >
          {/* Like button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleLike(currentReel.id)}
              className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition active:scale-75 ${liked[currentReel.id] ? "bg-red-500 text-white" : "bg-black/50 text-white hover:bg-black/60"}`}
            >
              <Heart
                className={`h-6 w-6 ${liked[currentReel.id] ? "fill-current" : ""}`}
              />
            </button>
            <span className="text-white text-xs font-bold mt-1 shadow-sm">
              {likeCount[currentReel.id]}
            </span>
          </div>

          {/* Comment button */}
          <div className="flex flex-col items-center">
            <button className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/60 text-white flex items-center justify-center shadow-lg transition">
              <MessageCircle className="h-6 w-6" />
            </button>
            <span className="text-white text-xs font-bold mt-1 shadow-sm">
              {Math.floor(likeCount[currentReel.id] / 4)}
            </span>
          </div>

          {/* Share button */}
          <div className="flex flex-col items-center">
            <button className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/60 text-white flex items-center justify-center shadow-lg transition">
              <Share2 className="h-6 w-6" />
            </button>
            <span className="text-white text-xs font-bold mt-1 shadow-sm">
              Share
            </span>
          </div>

          {/* Restaurant logo thumbnail */}
          <div className="h-11 w-11 rounded-full border-2 border-brand-orange bg-brand-orange text-white flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden shrink-0">
            {currentReel.logo}
          </div>
        </div>

        {/* Text Details & Dish Promo at Bottom */}
        <div className="p-6 sm:p-8 z-10 text-white" id="reel-text-container">
          {/* Chef Name / Restaurant */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="font-display font-black text-base text-orange-400">
              @{currentReel.restaurantName}
            </span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full text-white backdrop-blur-sm">
              {currentReel.offer}
            </span>
          </div>

          {/* Reel Title & description */}
          <h3 className="font-display font-extrabold text-2xl leading-snug mb-1">
            {currentReel.title}
          </h3>
          <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-6">
            {currentReel.description}
          </p>

          {/* Loaded order card inside the Reel */}
          <div
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4"
            id="reel-order-cta-box"
          >
            <div className="min-w-0">
              <span className="text-[11px] text-orange-400 uppercase font-black tracking-widest">
                Reel Exclusive Deal
              </span>
              <h4 className="font-bold text-sm text-white truncate">
                {currentReel.orderNowItem.name}
              </h4>
              <span className="font-mono font-extrabold text-white text-sm">
                ₹ {currentReel.orderNowItem.price}
              </span>
            </div>

            <button
              onClick={handleOrderNow}
              className="bg-brand-orange hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-1.5 transition shrink-0 active:scale-95"
              id="reel-order-now-btn"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Quick Order</span>
            </button>
          </div>
        </div>

        {/* Swiping Indicator / Mobile instruction at very bottom */}
        <div
          onClick={handleNext}
          className="bg-black/40 text-center py-2 text-[11px] text-gray-400 cursor-pointer hover:text-white transition uppercase tracking-widest font-bold z-10 border-t border-white/5"
        >
          Click here or tap sidebar to Next Reel ➔
        </div>

        {/* Order success visual ripple/modal overlay */}
        {showOrderSuccess && (
          <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center animate-fade-in">
            <div className="bg-brand-orange text-white p-4 rounded-full shadow-2xl animate-bounce">
              <ShoppingBag className="h-12 w-12" />
            </div>
            <p className="text-white font-display font-extrabold text-xl mt-4">
              Added to Cart!
            </p>
            <p className="text-orange-200 text-xs mt-1">
              ₹ {currentReel.orderNowItem.price} applied from{" "}
              {currentReel.restaurantName}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
