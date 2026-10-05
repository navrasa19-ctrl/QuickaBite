import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORIES,
  OFFER_CARDS,
  COLLECTIONS,
  POPULAR_CUISINES,
  INITIAL_RESTAURANTS,
} from "../../data";
import HeroSlider from "./HeroSlider";
import CloudKitchenSection from "./CloudKitchenSection";
import { dinerService } from "../../api/dinerService";
import { useFavorites } from "../../context/FavoritesContext";

const CARD_COLORS = [
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-indigo-50 text-indigo-800 border-indigo-200",
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-rose-50 text-rose-800 border-rose-200",
  "bg-purple-50 text-purple-800 border-purple-200",
  "bg-blue-50 text-blue-800 border-blue-200",
];

import {
  Utensils,
  Soup,
  ChefHat,
  Flame,
  Pizza,
  Clock,
  Plus,
  Heart,
  Star,
  Ticket,
  ArrowRight,
  Zap,
  ShieldCheck,
  MessageSquare,
  ChevronsRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

import { FaMotorcycle } from "react-icons/fa";
import { PiFilmReelFill, PiBowlFoodFill } from "react-icons/pi";

export default function HomePage({
  restaurants,
  userLocationCoords,
  currentLocation,
  onRequestGpsAgain,
  selectedCategory,
  setSelectedCategory,
  isCuisineExpanded,
  setIsCuisineExpanded,
  isPopularCuisinesExpanded,
  setIsPopularCuisinesExpanded,
  triggerToast,
  cartItems,
  handleAddToCart,
  handleRemoveFromCart,
  filterFastDelivery,
  setFilterFastDelivery,
  filterTopRated,
  setFilterTopRated,
  filterPureVeg,
  setFilterPureVeg,
  filterOffers,
  setFilterOffers,
  filterPrice,
  setFilterPrice,
  filteredRestaurants,
  setSelectedRestaurant,
  favorites,
  handleToggleFavorite,
  isExploreMoreUnlocked,
  handleToggleRadius,
  setActiveReelId,
  setActiveTab,
}) {
  const location = useLocation();
  // Filtered categories for the Quick Cuisine Filter drawer (excluding "all" and "more")
  const QUICK_CATEGORIES = CATEGORIES.filter(
    (cat) => cat.id !== "all" && cat.id !== "more",
  );

  // Combine CATEGORIES and POPULAR_CUISINES for the dropdown options
  const cuisineOptions = [];
  const addedIds = new Set();

  CATEGORIES.forEach((cat) => {
    if (cat.id !== "more" && !addedIds.has(cat.id)) {
      addedIds.add(cat.id);
      cuisineOptions.push({
        id: cat.id,
        name: cat.id === "all" ? "All Cuisines" : cat.name,
      });
    }
  });

  POPULAR_CUISINES.forEach((cuis) => {
    if (!addedIds.has(cuis.id)) {
      addedIds.add(cuis.id);
      cuisineOptions.push({ id: cuis.id, name: cuis.name });
    }
  });

  const [isCuisineDropdownOpen, setIsCuisineDropdownOpen] = useState(false);
  const cuisineDropdownRef = useRef(null);
  const cuisineScrollRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(null);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [liveCoupons, setLiveCoupons] = useState([]);
  const [randomSideCoupons, setRandomSideCoupons] = useState([]);
  const [reelsList, setReelsList] = useState([]);
  const [isDishesExpanded, setIsDishesExpanded] = useState(false);
  const topChainsScrollRef = useRef(null);
  const cravingScrollRef = useRef(null);

  const scrollCraving = (direction) => {
    if (cravingScrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      cravingScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollTopChains = (direction) => {
    if (topChainsScrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      topChainsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const DEFAULT_REELS = [
    {
      id: "reel-1",
      title: "Signature Angus Truffle Burger",
      restaurantName: "The Gourmet Burger Bistro",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
      rating: "4.9",
      deliveryTime: "15 min",
      offer: "30% OFF",
      logo: "🍔",
      tag: "TRENDING",
    },
    {
      id: "reel-2",
      title: "Royal Mutton Dum Biryani",
      restaurantName: "Royal Biryani Palace",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
      rating: "4.8",
      deliveryTime: "20 min",
      offer: "FLAT ₹100",
      logo: "🍛",
      tag: "POPULAR",
    },
    {
      id: "reel-3",
      title: "Woodfired Truffle Cheese Pizza",
      restaurantName: "Napoli Artisan Pizza",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
      rating: "4.9",
      deliveryTime: "18 min",
      offer: "BUY 1 GET 1",
      logo: "🍕",
      tag: "HOT",
    },
    {
      id: "reel-4",
      title: "Charcoal Shish Kebab Platter",
      restaurantName: "Kebab House",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80",
      rating: "4.7",
      deliveryTime: "25 min",
      offer: "FREE DEL",
      logo: "🥙",
      tag: "CHEF'S SPECIAL",
    },
    {
      id: "reel-5",
      title: "Crispy Szechuan Chili Noodles",
      restaurantName: "Asian Wok",
      image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80",
      rating: "4.6",
      deliveryTime: "22 min",
      offer: "20% OFF",
      logo: "🥡",
      tag: "SPICY",
    },
  ];

  const displayReels = (reelsList && reelsList.length > 0) ? reelsList : DEFAULT_REELS;

  const activeRestaurantsList =
    (filteredRestaurants && filteredRestaurants.length > 0)
      ? filteredRestaurants
      : (restaurants && restaurants.length > 0)
        ? restaurants
        : [];

  const [directMenuItems, setDirectMenuItems] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDirectMenuItems = async () => {
      try {
        const items = await dinerService.getMenuItems(userLocationCoords);
        if (isMounted && Array.isArray(items) && items.length > 0) {
          setDirectMenuItems(items);
        }
      } catch (err) {
        console.error("Error fetching direct menu items for HomePage:", err);
      }
    };
    fetchDirectMenuItems();
    return () => { isMounted = false; };
  }, [userLocationCoords?.lat, userLocationCoords?.lng]);

  useEffect(() => {
    let isMounted = true;
    const fetchReels = async () => {
      try {
        const fetched = await dinerService.getReels();
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          setReelsList(fetched);
        }
      } catch (err) {
        console.error("Error fetching reels on HomePage:", err);
      }
    };
    fetchReels();
    return () => { isMounted = false; };
  }, []);


  const { favoriteDishes, toggleFavoriteDish } = useFavorites();

  const handleCuisineMouseDown = (e) => {
    if (!cuisineScrollRef.current) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - cuisineScrollRef.current.offsetLeft;
    scrollLeftStartRef.current = cuisineScrollRef.current.scrollLeft;
    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    setIsDraggingState(true);
  };

  const handleCuisineMouseMove = (e) => {
    if (!isMouseDownRef.current || !cuisineScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - cuisineScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(x - startXRef.current) > 5) {
      hasDraggedRef.current = true;
    }

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      const distance = e.pageX - lastXRef.current;
      velocityRef.current = distance / dt;
    }
    lastXRef.current = e.pageX;
    lastTimeRef.current = now;

    cuisineScrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleCuisineMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsDraggingState(false);

    if (cuisineScrollRef.current && Math.abs(velocityRef.current) > 0.1) {
      let vel = velocityRef.current * 14;
      const momentumStep = () => {
        if (!cuisineScrollRef.current || Math.abs(vel) < 0.3) return;
        cuisineScrollRef.current.scrollLeft -= vel;
        vel *= 0.92;
        animFrameRef.current = requestAnimationFrame(momentumStep);
      };
      animFrameRef.current = requestAnimationFrame(momentumStep);
    }
  };

  const handleCuisineMouseLeave = () => {
    if (isMouseDownRef.current) {
      handleCuisineMouseUp();
    }
  };

  const handleCuisineScroll = () => {
    const container = cuisineScrollRef.current;
    if (!container) return;
    const singleSetWidth = container.scrollWidth / 5;
    if (singleSetWidth <= 0) return;

    if (container.scrollLeft >= singleSetWidth * 3.5) {
      container.scrollLeft -= singleSetWidth * 2;
    } else if (container.scrollLeft <= singleSetWidth * 0.5) {
      container.scrollLeft += singleSetWidth * 2;
    }
  };

  useEffect(() => {
    if (isCuisineExpanded) {
      const timer = setTimeout(() => {
        if (cuisineScrollRef.current) {
          const container = cuisineScrollRef.current;
          const singleSetWidth = container.scrollWidth / 5;
          if (singleSetWidth > 0) {
            container.scrollLeft = singleSetWidth * 2;
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isCuisineExpanded]);

  useEffect(() => {
    let isMounted = true;
    const fetchActiveCoupons = async () => {
      try {
        const fetched = await dinerService.getActiveCoupons();
        if (isMounted) {
          setLiveCoupons(fetched || []);
        }
      } catch (err) {
        console.error("Error fetching coupons on HomePage:", err);
      }
    };
    fetchActiveCoupons();
  }, []);

  useEffect(() => {
    const pool = liveCoupons.length > 0 ? liveCoupons : OFFER_CARDS;
    if (pool && pool.length > 0) {
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      setRandomSideCoupons(shuffled.slice(0, 2));
    }
  }, [liveCoupons]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        cuisineDropdownRef.current &&
        !cuisineDropdownRef.current.contains(event.target)
      ) {
        setIsCuisineDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (
      location.hash === "#restaurants-grid-section" ||
      location.hash === "#explore" ||
      location.state?.scrollTo === "restaurants-grid-section" ||
      location.state?.scrollTo === "explore"
    ) {
      const timer = setTimeout(() => {
        const resSection =
          document.getElementById("restaurants-grid-section") ||
          document.getElementById("explore");
        if (resSection) {
          resSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.state]);

  return (
    <div className="space-y-10 animate-fade-in" id="home-viewport">
      <HeroSlider
        onSearchClick={() => {
          const resSection = document.getElementById(
            "restaurants-grid-section",
          );
          if (resSection) {
            resSection.scrollIntoView({
              behavior: "smooth",
            });
          }
        }}
        currentLocation={currentLocation}
        onRequestGpsAgain={onRequestGpsAgain}
        onCuisineSelect={(cuisineId) => {
          setSelectedCategory(cuisineId);
          triggerToast(`Showing ${cuisineId} restaurants!`);
          const resSection = document.getElementById("restaurants-grid-section");
          if (resSection) resSection.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Promotional Offers & Coupons Showcase Section */}
      <div className="space-y-4 pt-2" id="home-offers-promos-section">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-l sm:text-2xl md:text-3xl text-gray-900 tracking-tight flex items-center gap-2">
              <span>Offers and deals for you</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">Claim exclusive discount promo codes &amp; save on your meal</p>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab("offers")}
              className="text-xs font-black text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Offers</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {(liveCoupons.length > 0 ? liveCoupons.slice(0, 3) : OFFER_CARDS.slice(0, 3)).map((coupon, i) => {
            let title = coupon.title || coupon.code || "SPECIAL OFFER";
            let subtitle = coupon.desc || "";
            if (coupon.discountType === "percentage" && coupon.discountValue) {
              subtitle = `${coupon.discountValue}% OFF UP TO ₹${coupon.maximumDiscount || 100}`;
            } else if (coupon.discountType === "flat" && coupon.discountValue) {
              subtitle = `FLAT ₹${coupon.discountValue} OFF`;
            }
            const code = coupon.code || "SAVE30";
            const imageUrl = typeof coupon.image === "object" ? coupon.image?.url : (typeof coupon.image === "string" ? coupon.image : "");
            const defaultBg = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

            return (
              <motion.div
                layout
                key={coupon.id || coupon.code || i}
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  triggerToast(`Coupon code '${code}' copied to clipboard!`);
                }}
                className="rounded-3xl shadow-soft hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group cursor-pointer h-[280px] sm:h-[300px] active:scale-[0.99] border border-white/10"
                title="Click to copy coupon code"
              >
                {/* Full-Card Background Image */}
                <img
                  src={imageUrl || defaultBg}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  onError={(e) => {
                    e.target.src = defaultBg;
                  }}
                />

                {/* Dark Gradient Overlay for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30 backdrop-blur-[1px]" />

                {/* Top Category Badge */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                    {coupon.campaignCategory || "PROMO"}
                  </span>
                  <span className="bg-orange-500/90 text-white backdrop-blur-md text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md border border-orange-400/40">
                    {coupon.discountLabel || "SPECIAL"}
                  </span>
                </div>

                {/* Card Main Info Overlay */}
                <div className="relative z-10 p-4 space-y-2 text-white">
                  <h4 className="font-display font-black text-lg sm:text-xl text-white leading-tight drop-shadow-md truncate">
                    {title}
                  </h4>
                  <p className="text-xs text-neutral-200 font-semibold line-clamp-2 leading-relaxed drop-shadow-sm">
                    {subtitle || coupon.policyText || "Apply at cart checkout for instant savings."}
                  </p>

                  {/* Bottom Row with Promocode and Small Copy Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/20 mt-2">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block leading-none mb-0.5">
                        Code
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm text-amber-400 uppercase tracking-wider">
                        {code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(code);
                        triggerToast(`Coupon code '${code}' copied!`);
                      }}
                      className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shadow-md shadow-orange-500/30 border border-orange-400/50"
                      title="Copy Coupon Code"
                    >
                      <Ticket className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* What's on your mind? — Swiggy-style circular HD food photography carousel */}
      <div className="space-y-4 pt-2" id="explore-cuisine-circular-section">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-gray-900 tracking-tight flex items-center gap-2">
              <span>What's on your mind?</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">Explore top dishes &amp; filter kitchens by dish</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCraving("left")}
              className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCraving("right")}
              className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
              aria-label="Scroll Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Circular HD food tiles horizontal carousel */}
        {(() => {
          const CRAVING_ITEMS = [
            { id: "biryani", label: "Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400" },
            { id: "pizza", label: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400" },
            { id: "burger", label: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400" },
            { id: "chinese", label: "Chinese", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400" },
            { id: "arabian", label: "Shawarma", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&q=80&w=400" },
            { id: "desserts", label: "Cakes", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400" },
            { id: "healthy", label: "Salads", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400" },
            { id: "japanese", label: "Sushi", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400" },
            { id: "italian", label: "Pasta", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400" },
            { id: "american", label: "Tacos", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=400" },
            { id: "indian", label: "North Indian", image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400" },
            { id: "mexican", label: "Rolls", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=400" },
          ];
          return (
            <div
              ref={cravingScrollRef}
              className="flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar py-2 scroll-smooth snap-x snap-mandatory"
            >
              {CRAVING_ITEMS.map((item) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const found = restaurants.find(r =>
                        (r.cuisines || []).some(c => c.toLowerCase().includes(item.id.toLowerCase())) ||
                        r.name.toLowerCase().includes(item.id.toLowerCase())
                      );
                      if (found) {
                        setSelectedRestaurant(found);
                      } else {
                        setSelectedCategory(item.id === selectedCategory ? "all" : item.id);
                        triggerToast(`Showing ${item.label} kitchens!`);
                        const resSection = document.getElementById("restaurants-grid-section");
                        if (resSection) resSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="shrink-0 snap-start flex flex-col items-center gap-2.5 group cursor-pointer active:scale-95 focus:outline-none"
                  >
                    {/* HD Circular Avatar Container */}
                    <div
                      className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 transition-all duration-300 transform group-hover:scale-105 shadow-md ${isSelected
                          ? "ring-4 ring-brand-orange ring-offset-2 scale-105 shadow-xl bg-orange-500"
                          : "bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200/60 hover:shadow-lg"
                        }`}
                    >
                      <img
                        src={item.image}
                        alt={item.label}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400";
                        }}
                        className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:rotate-2"
                      />
                      {isSelected && (
                        <span className="absolute bottom-1 right-1 bg-brand-orange text-white text-[11px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-xs sm:text-sm font-extrabold tracking-tight transition-colors ${isSelected ? "text-orange-700" : "text-gray-700 group-hover:text-gray-900"
                        }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Top restaurant chains in your area — Swiggy horizontal carousel */}
      {activeRestaurantsList.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-100" id="top-chains-carousel-section">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-gray-900 tracking-tight flex items-center gap-2">
              <span>Top restaurant chains in your area</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollTopChains("left")}
                className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTopChains("right")}
                className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-xs"
                aria-label="Scroll Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            ref={topChainsScrollRef}
            className="flex gap-5 overflow-x-auto no-scrollbar pb-3 scroll-smooth snap-x snap-mandatory"
          >
            {activeRestaurantsList.map((res) => {
              const distanceNum = res.distance !== null && res.distance !== undefined
                ? Number(res.distance)
                : (res.coordinates?.x ? (res.coordinates.x * 0.05 + res.coordinates.y * 0.03 + 0.8) : null);
              const distanceStr = distanceNum !== null ? `${distanceNum.toFixed(1)} km` : "1.5 km";
              const ratingDisplay = res.rating && res.rating > 0 ? (res.rating % 1 === 0 ? res.rating : res.rating.toFixed(1)) : (res.totalReviews > 0 ? res.rating : "NEW");

              return (
                <div
                  key={`chain-${res.id || res._id}`}
                  onClick={() => setSelectedRestaurant(res)}
                  className="shrink-0 snap-start w-[240px] sm:w-[270px] bg-white rounded-2xl overflow-hidden cursor-pointer group shadow-xs hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100"
                >
                  {/* Image + Swiggy Badge */}
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={res.image}
                      alt={res.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Swiggy Discount Ribbon */}
                    <div className="absolute bottom-2.5 left-3 text-white font-black text-xs uppercase tracking-wider drop-shadow-md flex items-center gap-1">
                      <span>🏷️</span>
                      <span>{res.discount || (res.isPromoBadge ? "FLAT 30% OFF" : (res.isFreeDelivery ? "FREE DELIVERY" : `₹${res.deliveryFee} DEL`))}</span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(res.id || res._id, e, res.name)}
                      className="absolute top-2.5 right-2.5 h-7 w-7 bg-white/80 hover:bg-white text-gray-700 rounded-full flex items-center justify-center backdrop-blur-sm transition shadow-xs z-10 cursor-pointer"
                    >
                      <Heart
                        className={`h-4 w-4 ${(favorites || []).some(f => String(f) === String(res.id) || String(f?.id) === String(res.id))
                            ? "text-red-500 fill-red-500"
                            : "text-gray-500"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-3.5 space-y-1">
                    <h4 className="font-display font-extrabold text-base text-gray-900 truncate group-hover:text-orange-700 transition">
                      {res.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                      <span className="flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[11px] font-black">
                        ★ {ratingDisplay}
                      </span>
                      <span>•</span>
                      <span>{res.deliveryTime}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium truncate">
                      {(res.cuisines || []).join(", ")}
                    </p>
                    <p className="text-[11px] text-gray-400 font-semibold truncate">
                      {res.address ? `${res.address} • ${distanceStr}` : distanceStr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="space-y-4" id="reels-highlights-section">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-gray-900 leading-tight">
                Food Reels
              </h3>
              <p className="text-[11px] text-gray-400 font-medium leading-none">Watch &amp; order instantly</p>
            </div>
          </div>
          {reelsList && reelsList.length > 0 && (
            <button
              onClick={() => setActiveReelId(reelsList[0].id || reelsList[0]._id)}
              className="flex items-center gap-1 text-xs font-black text-orange-700 hover:underline cursor-pointer"
            >
              <span>See All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Reel cards horizontal scroll */}
        <div
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory"
          id="reels-scroller"
        >
          {displayReels.map((reel, idx) => {
            /* One navy scrim for every reel keeps the cards on-brand */
            const overlay = "from-brand-dark/90 via-brand-dark/35 to-transparent";

            return (
              <div
                key={reel.id || reel._id}
                onClick={() => setActiveReelId(reel.id || reel._id)}
                className="relative shrink-0 snap-start w-[160px] sm:w-[180px] h-[280px] sm:h-[310px] rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                id={`reel-card-${reel.id || reel._id}`}
              >
                {/* Food image */}
                <img
                  src={reel.bgImage || reel.image}
                  alt={reel.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />

                {/* Gradient overlay — bottom-heavy like Reels */}
                <div className={`absolute inset-0 bg-gradient-to-t ${overlay}`} />

                {/* Top row: tag badge + play button */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
                  {reel.tag && (
                    <span className={`bg-brand-orange text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shadow-md`}>
                      {reel.tag}
                    </span>
                  )}
                  {/* Animated play icon */}
                  <div className="relative h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md group-hover:bg-white/35 transition ml-auto shrink-0">
                    <span className="text-white text-xs ml-0.5">▶</span>
                    
                  </div>
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 space-y-2">
                  {/* Restaurant logo + name */}
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-full bg-brand-orange flex items-center justify-center text-white text-[11px] font-black shadow-md border-2 border-white/30 shrink-0`}>
                      {reel.logo}
                    </div>
                    <span className="text-white/90 text-[11px] font-bold truncate leading-tight">
                      {reel.restaurantName}
                    </span>
                  </div>

                  {/* Dish title */}
                  <h4 className="font-display font-extrabold text-sm text-white leading-tight line-clamp-2 drop-shadow-md">
                    {reel.title}
                  </h4>

                  {/* Rating + delivery time */}
                  <div className="flex items-center gap-2">
                    {reel.rating && (
                      <span className="flex items-center gap-0.5 bg-black/30 backdrop-blur-sm text-white text-[11px] font-black px-1.5 py-0.5 rounded-md">
                        ⭐ {reel.rating}
                      </span>
                    )}
                    {reel.deliveryTime && (
                      <span className="flex items-center gap-0.5 bg-black/30 backdrop-blur-sm text-white text-[11px] font-black px-1.5 py-0.5 rounded-md">
                        🕐 {reel.deliveryTime}
                      </span>
                    )}
                  </div>

                  {/* Offer badge */}
                  {reel.offer && (
                    <span className={`${reel.offerColor || "bg-orange-500"} text-white text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide inline-block shadow-sm`}>
                      🏷 {reel.offer}
                    </span>
                  )}

                  {/* Order Now CTA */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReelId(reel.id || reel._id);
                    }}
                    className="w-full bg-white text-gray-900 font-extrabold text-[11px] py-2 rounded-xl shadow-md hover:bg-orange-500 hover:text-white active:scale-95 transition-all duration-200 cursor-pointer text-center block mt-1"
                  >
                    Order Now →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Restaurants Section with Advanced Filter bar and Layout Toggle */}
      <div className="space-y-6" id="restaurants-grid-section">
        {/* Header block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight text-gray-900">
                Dishes you might like
              </h3>
            </div>
            <p className="text-xs text-gray-500 ml-1">
              Delicious picks, made for every craving
            </p>
          </div>
          {selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-2 bg-brand-orange text-white text-xs font-black px-4 py-2 rounded-full shadow-md">
              <span>🍴</span>
              <span className="capitalize">{selectedCategory}</span>
              <button
                onClick={() => setSelectedCategory("all")}
                className="ml-1 text-white/80 hover:text-white font-black cursor-pointer"
                aria-label="Clear filter"
              >✕</button>
            </span>
          )}
        </div>

        {/* Empty State when no restaurants deliver to location */}
        {activeRestaurantsList.length === 0 && (
          <div className="bg-white p-10 rounded-3xl border border-neutral-100 text-center space-y-3 my-6 shadow-sm">
            <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-700">
              <MapPin className="h-8 w-8 animate-bounce" />
            </div>
            <h4 className="font-display font-black text-lg text-gray-900">
              No Outlets Delivering to Your Location
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              No restaurants deliver to your current location right now. Try changing your delivery address or location.
            </p>
          </div>
        )}

        {/* Vertical Dishes Grid (20 Dishes with Explore More Button) */}
        {(() => {
          // Extract menu dishes from active restaurants list or fallback mock dishes
          const allDishes = [];
          activeRestaurantsList.forEach((r) => {
            if (r.menu && Array.isArray(r.menu)) {
              r.menu.forEach((item) => {
                const resObj = typeof item.restaurant === "object" ? item.restaurant : r;
                allDishes.push({
                  ...item,
                  restaurantName: item.restaurantName || resObj?.name || r.name,
                  restaurantObj: r || resObj,
                  rating: r.rating || 4.5,
                });
              });
            }
          });

          if (allDishes.length === 0 && directMenuItems.length > 0) {
            directMenuItems.forEach((item) => {
              const resObj = typeof item.restaurant === "object" ? item.restaurant : null;
              const resId = resObj?._id || resObj?.id || item.restaurantId || item.restaurant;
              const matchedRestro = activeRestaurantsList.find(
                (r) => String(r._id || r.id) === String(resId)
              );
              allDishes.push({
                ...item,
                restaurantName: item.restaurantName || resObj?.name || matchedRestro?.name || "QuickaBite Partner",
                restaurantObj: matchedRestro || resObj || { _id: resId, name: item.restaurantName || resObj?.name || "QuickaBite Partner" },
                rating: matchedRestro?.rating || 4.5,
              });
            });
          }

          // 20 Mock/Fallback Dishes for rich variety
          const MOCK_20_DISHES = [
            { id: "d-1", name: "Special Mutton Dum Biryani", price: 299, restaurantName: "Royal Biryani Palace", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400", rating: 4.8, isVeg: false, isBestseller: true, category: "Biryani" },
            { id: "d-2", name: "Truffle Cheese Loaded Pizza", price: 349, restaurantName: "Napoli Woodfire Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400", rating: 4.9, isVeg: false, isBestseller: true, category: "Pizza" },
            { id: "d-3", name: "Smoky BBQ Angus Cheeseburger", price: 249, restaurantName: "The Burger Bistro", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400", rating: 4.7, isVeg: false, isBestseller: true, category: "Burger" },
            { id: "d-4", name: "Butter Chicken & Garlic Naan", price: 279, restaurantName: "Bombay Darling", image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400", rating: 4.8, isVeg: false, isBestseller: true, category: "Indian" },
            { id: "d-5", name: "Fiery Schezwan Wok Noodles", price: 199, restaurantName: "Asian Wok Kitchen", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400", rating: 4.6, isVeg: true, isBestseller: false, category: "Chinese" },
            { id: "d-6", name: "Crispy Falafel Shawarma Roll", price: 149, restaurantName: "Al Sultan Mandi & Grill", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&q=80&w=400", rating: 4.7, isVeg: true, isBestseller: true, category: "Arabian" },
            { id: "d-7", name: "Paneer Butter Masala", price: 239, restaurantName: "Bombay Darling", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400", rating: 4.6, isVeg: true, isBestseller: false, category: "Indian" },
            { id: "d-8", name: "Nashville Hot Fried Chicken Burger", price: 269, restaurantName: "The Burger Bistro", image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&q=80&w=400", rating: 4.8, isVeg: false, isBestseller: true, category: "Burger" },
            { id: "d-9", name: "Creamy Alfredo Penne Pasta", price: 229, restaurantName: "Napoli Woodfire Pizza", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400", rating: 4.5, isVeg: true, isBestseller: false, category: "Italian" },
            { id: "d-10", name: "Fresh Salmon Nigiri Sushi (6 pcs)", price: 399, restaurantName: "Tokyo Sushi Express", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400", rating: 4.9, isVeg: false, isBestseller: true, category: "Japanese" },
            { id: "d-11", name: "Mexican Chipotle Beef Tacos", price: 219, restaurantName: "Taco Loco Grill", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=400", rating: 4.7, isVeg: false, isBestseller: false, category: "Mexican" },
            { id: "d-12", name: "Charcoal Grilled Shish Kebab Platter", price: 359, restaurantName: "Al Sultan Mandi & Grill", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400", rating: 4.8, isVeg: false, isBestseller: true, category: "Arabian" },
            { id: "d-13", name: "Dal Makhani with Jeera Rice", price: 189, restaurantName: "Royal Biryani Palace", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400", rating: 4.6, isVeg: true, isBestseller: true, category: "Indian" },
            { id: "d-14", name: "Crispy Szechuan Chili Dumplings", price: 179, restaurantName: "Asian Wok Kitchen", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400", rating: 4.7, isVeg: false, isBestseller: false, category: "Chinese" },
            { id: "d-15", name: "Classic Italian Pepperoni Pizza", price: 319, restaurantName: "Napoli Woodfire Pizza", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=400", rating: 4.9, isVeg: false, isBestseller: true, category: "Pizza" },
            { id: "d-16", name: "Avocado & Quinoa Power Salad Bowl", price: 209, restaurantName: "Green Bowl Healthy", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400", rating: 4.6, isVeg: true, isBestseller: false, category: "Healthy" },
            { id: "d-17", name: "Warm Chocolate Fudge Brownie", price: 139, restaurantName: "Sweet Treats Bakery", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400", rating: 4.9, isVeg: true, isBestseller: true, category: "Desserts" },
            { id: "d-18", name: "Hyderabadi Dum Chicken Biryani", price: 259, restaurantName: "Royal Biryani Palace", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400", rating: 4.8, isVeg: false, isBestseller: true, category: "Biryani" },
            { id: "d-19", name: "Golden Crispy Mozzarella Sticks", price: 159, restaurantName: "The Burger Bistro", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400", rating: 4.5, isVeg: true, isBestseller: false, category: "Burger" },
            { id: "d-20", name: "Authentic Mango Lassi", price: 99, restaurantName: "Bombay Darling", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400", rating: 4.7, isVeg: true, isBestseller: true, category: "Desserts" },
          ];

          const poolDishes = allDishes;
          const initialLimit = 8;
          const displayDishes = isDishesExpanded ? poolDishes.slice(0, 20) : poolDishes.slice(0, initialLimit);

          return (
            <div className="space-y-6">
              {displayDishes.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-xs text-gray-500 font-semibold">
                  No dishes currently available for the selected category. Try selecting "All Cuisines" or clearing active filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {displayDishes.map((dish, i) => {
                    const isDishFav = (favoriteDishes || []).some(
                      (fId) => String(fId) === String(dish.id) || String(fId) === String(dish._id)
                    );

                    return (
                      <div
                        key={dish.id || dish._id || i}
                        onClick={() => {
                          if (dish.restaurantObj) {
                            setSelectedRestaurant(dish.restaurantObj);
                          } else {
                            const foundRes = restaurants.find(
                              (r) => r.name.toLowerCase() === (dish.restaurantName || "").toLowerCase()
                            ) || activeRestaurantsList[0];
                            if (foundRes) setSelectedRestaurant(foundRes);
                          }
                        }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image + Veg badge + Favorite */}
                          <div className="relative h-44 bg-gray-100 overflow-hidden">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Diet Indicator */}
                            <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
                              <span
                                className={`h-2 w-2 rounded-full ${dish.isVeg ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                              />
                              <span className="text-[11px] font-black uppercase text-gray-700">
                                {dish.isVeg ? "VEG" : "NON-VEG"}
                              </span>
                            </div>

                            {/* Bestseller ribbon */}
                            {dish.isBestseller && (
                              <span className="absolute bottom-2.5 left-2.5 bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-md uppercase shadow-xs">
                                ⭐ BESTSELLER
                              </span>
                            )}

                            {/* Favorite Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (toggleFavoriteDish) {
                                  toggleFavoriteDish(dish.id || dish._id, triggerToast);
                                } else if (handleToggleFavoriteDish) {
                                  handleToggleFavoriteDish(dish.id || dish._id);
                                } else {
                                  triggerToast(`Added ${dish.name} to favorites!`);
                                }
                              }}
                              className="absolute top-2.5 right-2.5 h-8 w-8 bg-white/80 hover:bg-white text-gray-700 rounded-full flex items-center justify-center backdrop-blur-xs transition shadow-xs z-10 cursor-pointer"
                            >
                              <Heart
                                className={`h-4.5 w-4.5 ${isDishFav ? "text-red-500 fill-red-500" : "text-gray-500"
                                  }`}
                              />
                            </button>
                          </div>

                          {/* Content details */}
                          <div className="p-3.5 space-y-1">
                            <h4 className="font-display font-black text-sm sm:text-base text-gray-900 line-clamp-1 group-hover:text-orange-700 transition">
                              {dish.name}
                            </h4>
                            <p className="text-xs text-gray-400 font-semibold truncate">
                              {dish.restaurantName || "QuickaBite Partner"}
                            </p>
                          </div>
                        </div>

                        {/* Footer: Price + Add Button */}
                        <div className="px-3.5 pb-3.5 pt-1 flex items-center justify-between border-t border-gray-50">
                          <span className="font-black text-base text-gray-900">
                            ₹{dish.price}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (handleAddToCart) {
                                const foundRes = dish.restaurantObj || activeRestaurantsList.find(
                                  (r) => (r.name || "").toLowerCase() === (dish.restaurantName || "").toLowerCase()
                                ) || activeRestaurantsList[0] || { id: "res-default", name: dish.restaurantName || "QuickaBite Partner" };

                                const resId = foundRes.id || foundRes._id || "res-default";
                                const resName = foundRes.name || dish.restaurantName || "QuickaBite Partner";

                                handleAddToCart(resId, resName, dish, triggerToast);
                              }
                            }}
                            className="bg-orange-50 text-brand-orange hover:bg-brand-orange hover:text-white border border-orange-200 text-xs font-black uppercase px-3.5 py-1.5 rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
                          >
                            ADD +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explore More Dishes Button */}
              {poolDishes.length > initialLimit && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setIsDishesExpanded(!isDishesExpanded)}
                    className="border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white rounded-full px-8 py-3 flex items-center justify-center gap-2 text-xs font-black tracking-wider transition-all duration-300 cursor-pointer shadow-sm active:scale-95 uppercase"
                  >
                    <span>{isDishesExpanded ? "SHOW LESS DISHES" : "EXPLORE MORE DISHES"}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isDishesExpanded ? "-rotate-90" : "rotate-90"}`} />
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Value Props Bar (Service Guarantees) */}
      <div
        className="bg-white border border-gray-100 rounded-3xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-6"
        id="value-props-bar"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-xs">
              Live Order Tracking
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Track your order in real-time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-xs">
              Superfast Delivery
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              On-time or it is completely free
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-xs">Best Quality</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              100% gourmet hygienic standards
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-xs">24/7 Support</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Dedicated experts ready to assist
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
