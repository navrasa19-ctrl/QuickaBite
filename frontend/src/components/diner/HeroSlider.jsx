import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin, Zap, Star, Tag } from "lucide-react";
import {
  FaBowlRice,
  FaPizzaSlice,
  FaBurger,
  FaUtensils,
  FaCakeCandles,
  FaCarrot,
  FaDrumstickBite,
  FaFishFins,
  FaBacon,
  FaCookieBite,
  FaFire,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { dinerService } from "../../api/dinerService";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_SLIDES = [
  {
    title: "Up to 50% off",
    subtitle: "On your first order. Hungry? Let's get you something delicious.",
    code: "WELCOME50",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=1200",
    accent: "#FF5200",
    bg: "from-[#FF5200] via-[#FF7340] to-[#FFA040]",
    tag: "🎉 New User Special",
  },
  {
    title: "Flat 40% off",
    subtitle: "On woodfired artisan pizzas",
    code: "FOOD40",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200",
    accent: "#E91E8C",
    bg: "from-[#E91E8C] via-[#F06292] to-[#FF5252]",
    tag: "🍕 Pizza Mania",
  },
  {
    title: "Buy 1, get 1 free",
    subtitle: "On charcoal grilled kebabs",
    code: "YALLABOGO",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1200",
    accent: "#00897B",
    bg: "from-[#00897B] via-[#26A69A] to-[#00BCD4]",
    tag: "🥙 BOGO Feast",
  },
  {
    title: "Free fast delivery",
    subtitle: "On smash burgers and sides",
    code: "FREEDEL",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200",
    accent: "#7B1FA2",
    bg: "from-[#7B1FA2] via-[#AB47BC] to-[#E040FB]",
    tag: "Superfast 20 Min",
  },
];

export default function HeroSlider({ onSearchClick, currentLocation, onCuisineSelect, onRequestGpsAgain }) {
  const { isLoggedIn } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const list = await dinerService.getBanners();
        if (list && list.length > 0) setSlides(list);
      } catch (e) {
        console.error("Failed to load banners:", e);
      }
    };
    loadBanners();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      goToSlide((prev) => (prev + 1) % (slides.length || 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (idxOrFn) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const newIdx = typeof idxOrFn === "function" ? idxOrFn(currentSlide) : idxOrFn;
    setCurrentSlide(newIdx);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => goToSlide((p) => (p - 1 + slides.length) % slides.length);
  const handleNext = () => goToSlide((p) => (p + 1) % slides.length);

  const slide = slides[currentSlide] || DEFAULT_SLIDES[0];

  return (
    <section
      id="hero-slider-section"
      aria-roledescription="carousel"
      aria-label="Offers"
      className="relative overflow-hidden rounded-2xl bg-brand-dark"
    >
      {/* Slide background images (crossfade) */}
      {slides.map((s, idx) => (
        <img
          key={idx}
          src={s.image}
          alt=""
          aria-hidden="true"
          loading={idx === 0 ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {/* Navy scrim keeps text readable on any photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/60 to-brand-dark/10 pointer-events-none" />

      <div className="relative z-10 min-h-[300px] sm:min-h-[360px] lg:min-h-[420px] px-5 sm:px-10 lg:px-14 pt-7 sm:pt-10 pb-16 sm:pb-20 flex items-center">
        <div className="max-w-xl space-y-4 sm:space-y-5 text-left">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg">
            <Tag className="h-3.5 w-3.5 text-yellow-400" />
            {slide.tag || "Exclusive offer"}
          </span>

          <h1 className="font-extrabold text-3xl sm:text-5xl lg:text-[3.25rem] text-white leading-[1.05] tracking-tight">
            {slide.title}
          </h1>
          <p className="text-white/85 font-medium text-base sm:text-lg max-w-md">
            {slide.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onSearchClick}
              className="cursor-pointer bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm sm:text-base h-12 px-7 rounded-xl transition-colors"
            >
              Order now
            </button>
            {slide.code && (
              <div className="h-12 px-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/50 text-white text-sm">
                <span className="text-white/75">Use code</span>
                <span className="font-mono font-bold tracking-wider text-yellow-400">{slide.code}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls live in the bottom bar so they never sit on top of the copy */}
      <div className="absolute bottom-4 sm:bottom-5 inset-x-5 sm:inset-x-10 lg:inset-x-14 z-20 flex items-center justify-between">
        <div className="flex gap-1.5" role="tablist" aria-label="Choose slide">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              role="tab"
              aria-selected={idx === currentSlide}
              aria-label={`Slide ${idx + 1}`}
              className={`rounded-full h-2 transition-all duration-300 cursor-pointer ${idx === currentSlide ? "w-7 bg-brand-orange" : "w-2 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="h-10 w-10 bg-white/15 hover:bg-white/30 text-white rounded-xl flex items-center justify-center backdrop-blur-sm transition cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="h-10 w-10 bg-white/15 hover:bg-white/30 text-white rounded-xl flex items-center justify-center backdrop-blur-sm transition cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
