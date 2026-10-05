import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import {
  Search,
  Mic,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
  Sparkles,
} from "lucide-react";
import { HiMagnifyingGlass, HiFire } from "react-icons/hi2";
import {
  FaPizzaSlice,
  FaBurger,
  FaBowlFood,
  FaLeaf,
  FaDrumstickBite,
  FaBreadSlice,
} from "react-icons/fa6";
import { MdRestaurant } from "react-icons/md";
import { POPULAR_CUISINES } from "../../data";
import { extractImageUrl } from "../../api/dinerService";

export default function SearchPage({
  searchQuery,
  setSearchQuery,
  restaurants,
  onAddToCart,
  setSelectedRestaurant,
  setActiveTab,
  triggerToast,
  isLoading,
}) {
  const [searchVegOnly, setSearchVegOnly] = useState(false);
  const [searchNonVegOnly, setSearchNonVegOnly] = useState(false);
  const [searchPriceFilter, setSearchPriceFilter] = useState("all");
  const [searchRatingFilter, setSearchRatingFilter] = useState("all");
  const [searchDeliveryTimeFilter, setSearchDeliveryTimeFilter] =
    useState("all");
  const [searchHasOffersOnly, setSearchHasOffersOnly] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    "Biryani",
    "Smash Burger",
    "Butter Chicken",
    "Healthy Salad",
  ]);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (isVoiceSearching) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVoiceSearching]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectSearchQuery = (query, hideSuggestions = true) => {
    setSearchQuery(query);
    if (hideSuggestions) {
      setShowSuggestions(false);
    }
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (q) => q.toLowerCase() !== query.toLowerCase(),
      );
      return [query, ...filtered].slice(0, 6);
    });
  };

  const recognitionRef = useRef(null);

  const handleTriggerVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      triggerToast("Web Speech Voice Recognition is not supported in this browser. Try Google Chrome.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      setIsVoiceSearching(true);

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          handleSelectSearchQuery(transcript, false);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsVoiceSearching(false);
        if (event.error !== "no-speech") {
          triggerToast(`Voice Error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
        if (searchQuery.trim()) {
          triggerToast(`Voice Recognized: "${searchQuery}"`);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to initialize Web Speech API:", err);
      setIsVoiceSearching(false);
      triggerToast("Could not start microphone voice capture.");
    }
  };

  const searchSuggestions = searchQuery.trim()
    ? Array.from(
      new Set([
        ...restaurants
          .filter((r) =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((r) => r.name),
        ...restaurants
          .flatMap((r) => r.menu)
          .filter((m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((m) => m.name),
      ]),
    ).slice(0, 6)
    : [];

  // Use debounced query for heavy filtering operations

  const [apiDishes, setApiDishes] = useState([]);
  const [apiPagination, setApiPagination] = useState(null);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  useEffect(() => {
    const fetchSearchMenu = async () => {
      if (!debouncedSearchQuery.trim()) {
        setApiDishes([]);
        setApiPagination(null);
        return;
      }

      setIsSearchingApi(true);
      try {
        const filters = {
          search: debouncedSearchQuery.trim(),
          page: 1,
          limit: 10,
          returnFullPayload: true,
        };
        if (searchVegOnly) filters.isVegetarian = true;

        const res = await dinerService.getMenuItems(null, filters);
        if (res && typeof res === "object") {
          setApiDishes(Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : []);
          if (res.pagination) setApiPagination(res.pagination);
        } else {
          setApiDishes(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        console.error("Failed to execute live menu search API:", err);
      } finally {
        setIsSearchingApi(false);
      }
    };

    fetchSearchMenu();
  }, [debouncedSearchQuery, searchVegOnly]);

  const searchedDishes = debouncedSearchQuery.trim() && apiDishes.length > 0
    ? apiDishes.map((item) => {
        const resObj = typeof item.restaurant === "object" ? item.restaurant : null;
        const targetRes = restaurants.find(
          (r) => String(r.id || r._id) === String(resObj?._id || resObj?.id || item.restaurant)
        );
        return {
          ...item,
          restaurantId: resObj?._id || resObj?.id || item.restaurant || targetRes?.id || targetRes?._id,
          restaurantName: resObj?.name || targetRes?.name || "Kitchen Outlet",
          restaurantRating: targetRes?.rating || 4.5,
          deliveryTime: targetRes?.deliveryTime || "25 mins",
          hasPromoBadge: targetRes?.isPromoBadge || false,
          discount: targetRes?.discount || "",
        };
      }).filter((dish) => {
        if (searchVegOnly && !dish.isVeg && !dish.isVegetarian) return false;
        if (searchNonVegOnly && (dish.isVeg || dish.isVegetarian)) return false;
        if (searchPriceFilter === "under-99" && Number(dish.price) > 99) return false;
        if (searchPriceFilter === "under-199" && Number(dish.price) > 199) return false;
        if (searchPriceFilter === "under-299" && Number(dish.price) > 299) return false;
        if (searchPriceFilter === "above-299" && Number(dish.price) < 299) return false;
        return true;
      })
    : restaurants
        .flatMap((restaurant) =>
          restaurant.menu.map((item) => ({
            ...item,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            restaurantRating: restaurant.rating,
            deliveryTime: restaurant.deliveryTime,
            hasPromoBadge: restaurant.isPromoBadge,
            discount: restaurant.discount,
          })),
        )
        .filter((dish) => {
          const matchesSearch = debouncedSearchQuery.trim()
            ? dish.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            dish.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            dish.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            dish.restaurantName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            : true;
          if (!matchesSearch) return false;
          if (searchVegOnly && !dish.isVeg) return false;
          if (searchNonVegOnly && dish.isVeg) return false;
          if (searchPriceFilter === "under-99" && Number(dish.price) > 99)
            return false;
          if (searchPriceFilter === "under-199" && Number(dish.price) > 199)
            return false;
          if (searchPriceFilter === "under-299" && Number(dish.price) > 299)
            return false;
          if (searchPriceFilter === "above-299" && Number(dish.price) < 299)
            return false;
          if (searchRatingFilter === "4.5" && dish.restaurantRating < 4.5)
            return false;
          if (searchRatingFilter === "4.0" && dish.restaurantRating < 4)
            return false;
          if (searchDeliveryTimeFilter !== "all") {
            const minTime = parseInt(dish.deliveryTime, 10);
            if (searchDeliveryTimeFilter === "under-30" && minTime > 30)
              return false;
            if (searchDeliveryTimeFilter === "under-45" && minTime > 45)
              return false;
          }
          if (searchHasOffersOnly && !dish.hasPromoBadge) return false;
          return true;
        });

  const searchedRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = debouncedSearchQuery.trim()
      ? restaurant.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      restaurant.cuisines.some((c) =>
        c.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
      ) ||
      restaurant.menu.some((item) =>
        item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
      )
      : true;
    if (!matchesSearch) return false;
    if (searchVegOnly && !restaurant.menu.some((item) => item.isVeg))
      return false;
    if (searchNonVegOnly && !restaurant.menu.some((item) => !item.isVeg))
      return false;
    if (searchPriceFilter !== "all") {
      const hasMatchingPrice = restaurant.menu.some((item) => {
        const price = Number(item.price);
        if (searchPriceFilter === "under-99") return price <= 99;
        if (searchPriceFilter === "under-199") return price <= 199;
        if (searchPriceFilter === "under-299") return price <= 299;
        if (searchPriceFilter === "above-299") return price >= 299;
        return true;
      });
      if (!hasMatchingPrice) return false;
    }
    if (searchRatingFilter === "4.5" && restaurant.rating < 4.5) return false;
    if (searchRatingFilter === "4.0" && restaurant.rating < 4) return false;
    if (searchDeliveryTimeFilter !== "all") {
      const minTime = parseInt(restaurant.deliveryTime, 10);
      if (searchDeliveryTimeFilter === "under-30" && minTime > 30) return false;
      if (searchDeliveryTimeFilter === "under-45" && minTime > 45) return false;
    }
    if (searchHasOffersOnly && !restaurant.isPromoBadge) return false;
    return true;
  });

  if (!restaurants || restaurants.length === 0) {
    if (isLoading) {
      return (
        <div
          className="space-y-6 max-w-4xl mx-auto py-6 animate-pulse"
          id="search-viewport-loading"
        >
          {/* Header Title Loading */}
          <div className="text-center max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 bg-neutral-200 rounded-full mx-auto" />
            <div className="h-6 bg-neutral-200 rounded-full w-3/4 mx-auto" />
            <div className="h-3 bg-neutral-200 rounded-full w-1/2 mx-auto" />
          </div>
          {/* Search Bar Skeleton */}
          <div className="bg-neutral-100/50 border border-neutral-200 rounded-2xl p-4 h-16" />
          {/* Popular Cuisines Skeleton */}
          <div className="space-y-3">
            <div className="h-4 bg-neutral-200 rounded-full w-32" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-20 w-20 bg-neutral-200 rounded-2xl shrink-0"
                />
              ))}
            </div>
          </div>
          {/* Recent Searches Skeleton */}
          <div className="space-y-3 bg-white border border-neutral-150 rounded-3xl p-5">
            <div className="h-4 bg-neutral-200 rounded-full w-40" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-24 bg-neutral-200 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white p-10 rounded-3xl border border-neutral-100 text-center space-y-3 my-6 shadow-sm max-w-4xl mx-auto">
        <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-700">
          <Search className="h-8 w-8 animate-bounce" />
        </div>
        <h4 className="font-display font-black text-lg text-gray-900">
          No Outlets Available at Your Location
        </h4>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          No restaurants deliver to your location right now. Try changing your delivery address or location.
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 max-w-6xl mx-auto py-2 animate-fade-in"
      id="search-viewport"
    >
      {/* Header Title */}
      <div className="text-center max-w-md mx-auto space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 transform hover:scale-105 transition-all duration-300">
          <HiMagnifyingGlass className="text-3xl" />
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
          Gourmet Craving Search
        </h2>
        <p className="text-xs text-gray-500">
          Type or speak to discover exquisite dishes and top-rated kitchens
          instantly.
        </p>
      </div>

      {/* Custom Search Box & Voice Search */}
      <div
        ref={searchContainerRef}
        className="relative z-30 glass-panel rounded-premium p-4 shadow-premium space-y-3"
        id="search-container"
      >
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search dishes, cuisines, or restaurants..."
              value={searchQuery}
              onChange={(e) => {
                handleSelectSearchQuery(e.target.value, true);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Enter") {
                  setShowSuggestions(false);
                }
              }}
              className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-100 focus:border-brand-orange/40 rounded-2xl text-sm placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-brand-orange/10 outline-none transition"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-700" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-orange-700 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Voice Search CTA */}
          <button
            onClick={handleTriggerVoiceSearch}
            className="bg-brand-orange hover:bg-orange-600 text-white p-3.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition shrink-0 flex items-center justify-center group cursor-pointer"
            title="Voice Search"
          >
            <Mic className="h-5 w-5 group-hover:scale-110 transition duration-300 animate-pulse" />
          </button>
        </div>

        {/* Live Search Suggestions Dropdown Overlay */}
        {showSuggestions &&
          searchQuery.trim().length > 0 &&
          searchSuggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 space-y-1">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                Suggestions
              </div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleSelectSearchQuery(suggestion);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50/50 hover:text-orange-700 rounded-xl transition font-medium flex items-center justify-between cursor-pointer"
                >
                  <span>{suggestion}</span>
                  <ChevronRight className="h-3 w-3 opacity-40" />
                </button>
              ))}
            </div>
          )}

        {/* Advanced Filter Sub-Bar */}
        <div className="pt-2 border-t border-gray-100/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-orange-700 shrink-0" />
            <span>Customize Your Search Filters</span>
          </div>

          {/* Horizontal scrollable filters */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Veg Toggle */}
            <button
              onClick={() => {
                setSearchVegOnly(!searchVegOnly);
                if (searchNonVegOnly) setSearchNonVegOnly(false);
              }}
              className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 border cursor-pointer ${searchVegOnly
                ? "bg-emerald-500 text-white border-emerald-600 shadow-md scale-105"
                : "bg-white text-gray-600 border-gray-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${searchVegOnly ? "bg-white" : "bg-emerald-500 group-hover:bg-white"}`}
              />
              Veg Only
            </button>

            {/* Non Veg Toggle */}
            <button
              onClick={() => {
                setSearchNonVegOnly(!searchNonVegOnly);
                if (searchVegOnly) setSearchVegOnly(false);
              }}
              className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 border cursor-pointer ${searchNonVegOnly
                ? "bg-red-500 text-white border-red-600 shadow-md scale-105"
                : "bg-white text-gray-600 border-gray-200 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${searchNonVegOnly ? "bg-white" : "bg-red-500 group-hover:bg-white"}`}
              />
              Non-Veg Only
            </button>

            {/* Price range filter */}
            <select
              value={searchPriceFilter}
              onChange={(e) => setSearchPriceFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-600 hover:border-orange-400 hover:shadow-sm font-extrabold text-xs px-3.5 py-2 rounded-full outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="all">Any Price</option>
              <option value="under-99">Under ₹ 99</option>
              <option value="under-199">Under ₹ 199</option>
              <option value="under-299">Under ₹ 299</option>
              <option value="above-299">₹ 299+</option>
            </select>

            {/* Rating filter */}
            <select
              value={searchRatingFilter}
              onChange={(e) => setSearchRatingFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-600 hover:border-orange-400 hover:shadow-sm font-extrabold text-xs px-3.5 py-2 rounded-full outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="all">Any Rating</option>
              <option value="4.5">4.5★ or above</option>
              <option value="4.0">4.0★ or above</option>
            </select>

            {/* Delivery time filter */}
            <select
              value={searchDeliveryTimeFilter}
              onChange={(e) => setSearchDeliveryTimeFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-600 hover:border-orange-400 hover:shadow-sm font-extrabold text-xs px-3.5 py-2 rounded-full outline-none transition-all duration-200 cursor-pointer"
            >
              <option value="all">Any Speed</option>
              <option value="under-30">Under 30 mins</option>
              <option value="under-45">Under 45 mins</option>
            </select>

            {/* Offers Only filter */}
            <button
              onClick={() => setSearchHasOffersOnly(!searchHasOffersOnly)}
              className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 border cursor-pointer ${searchHasOffersOnly
                ? "bg-orange-500 text-white border-orange-600 shadow-md scale-105"
                : "bg-white text-gray-600 border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                }`}
            >
              <HiFire
                className={`text-sm ${searchHasOffersOnly ? "text-white" : "text-orange-500 group-hover:text-white transition-colors"}`}
              />
              <span>Offers Only</span>
            </button>

            {/* Clear all filters button if any active */}
            {(searchVegOnly ||
              searchNonVegOnly ||
              searchPriceFilter !== "all" ||
              searchRatingFilter !== "all" ||
              searchDeliveryTimeFilter !== "all" ||
              searchHasOffersOnly) && (
                <button
                  onClick={() => {
                    setSearchVegOnly(false);
                    setSearchNonVegOnly(false);
                    setSearchPriceFilter("all");
                    setSearchRatingFilter("all");
                    setSearchDeliveryTimeFilter("all");
                    setSearchHasOffersOnly(false);
                  }}
                  className="bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 font-extrabold text-xs px-3.5 py-2 rounded-full border border-transparent transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Empty State / Discovery Panel (Visible when no search is active) */}
      {!searchQuery.trim() && (
        <div className="space-y-6 animate-fade-in" id="search-discovery-panel">
          {/* Recent Searches Row */}
          {recentSearches.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-premium p-5 space-y-3 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <RotateCcw className="h-3.5 w-3.5 text-orange-700" />
                  Recent Searches
                </span>
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  title="Clear History"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchQuery(term)}
                    className="group bg-gray-100 hover:bg-orange-500 hover:text-white text-gray-700 font-bold text-xs px-4 py-2 rounded-full border border-transparent hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/20 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3 text-gray-400 group-hover:text-white transition-colors" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending dishes */}
          <div className="bg-white border border-gray-100 rounded-premium p-5 space-y-3 shadow-soft">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-orange-700" />
              Trending Dishes Right Now
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Special Chicken Biryani", icon: FaDrumstickBite },
                { name: "Butter Chicken Pizza", icon: FaPizzaSlice },
                { name: "Double Smash Beef Burger", icon: FaBurger },
                { name: "Chilli Garlic Noodles", icon: FaBowlFood },
                { name: "Falafel Wrap", icon: FaBreadSlice },
                { name: "Healthy Salad", icon: FaLeaf },
              ].map((dish, idx) => {
                const DishIcon = dish.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchQuery(dish.name)}
                    className="group bg-gray-100 hover:bg-orange-500 hover:text-white text-gray-700 font-bold text-xs px-4 py-2 rounded-full border border-transparent hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/20 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <DishIcon className="text-xs text-orange-500 group-hover:text-white transition-colors" />
                    <span>{dish.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular cuisines section */}
          <div className="bg-white border border-gray-100 rounded-premium p-5 space-y-4 shadow-soft">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
              Browse Popular Cuisines
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
              {POPULAR_CUISINES.map((cuis) => (
                <button
                  key={cuis.id}
                  onClick={() => handleSelectSearchQuery(cuis.name)}
                  className="flex flex-col items-center gap-2 group outline-none cursor-pointer"
                >
                  <div className="h-14 w-14 rounded-full bg-orange-50 group-hover:bg-brand-orange transition duration-300 flex items-center justify-center border border-orange-100/50 shadow-xs group-hover:shadow-md relative overflow-hidden shrink-0">
                    <img
                      src={cuis.image}
                      alt={cuis.name}
                      className="h-full w-full object-cover transform group-hover:scale-110 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[11px] font-extrabold text-gray-600 truncate max-w-full text-center group-hover:text-orange-700 transition">
                    {cuis.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Search Results (Visible when search query exists) */}
      {isLoading ? (
        <div
          className="space-y-6 pt-4 animate-pulse"
          id="search-loading-skeleton"
        >
          <div className="space-y-3">
            <div className="h-5 bg-neutral-200 rounded-full w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 h-[112px]"
                >
                  <div className="h-20 w-20 bg-neutral-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-neutral-200 rounded-full w-2/3" />
                    <div className="h-3 bg-neutral-200 rounded-full w-full" />
                    <div className="h-3 bg-neutral-200 rounded-full w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-5 bg-neutral-200 rounded-full w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 h-[112px]"
                >
                  <div className="h-20 w-20 bg-neutral-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-neutral-200 rounded-full w-1/2" />
                    <div className="h-3 bg-neutral-200 rounded-full w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : searchQuery.trim() ? (
        <div className="space-y-6 animate-fade-in" id="search-results-section">
          {/* 1. SECTION: MATCHING DISHES */}
          <div className="space-y-3">
            <h3 className="font-display font-black text-base text-gray-900 flex items-center justify-between">
              <span>Delicious Dishes Match</span>
              <span className="text-xs bg-brand-orange/10 text-orange-700 px-2.5 py-1 rounded-full font-extrabold">
                {searchedDishes.length} items
              </span>
            </h3>

            {searchedDishes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchedDishes.map((dish) => (
                  <div
                    key={dish.id || dish._id}
                    onClick={(e) => {
                      if (e.target.closest("button") || e.target.closest("a")) return;
                      const res = restaurants.find(
                        (r) => String(r.id || r._id) === String(dish.restaurantId),
                      );
                      if (res) {
                        setSelectedRestaurant({
                          ...res,
                          initialMenuItemId: dish.id || dish._id,
                        });
                      }
                    }}
                    className="bg-white border border-gray-100 hover:border-orange-200 rounded-2xl p-4 flex gap-4 transition shadow-xs hover:shadow-md relative overflow-hidden cursor-pointer group"
                  >
                    {/* Left: Dish Image */}
                    <div className="h-20 w-20 rounded-xl bg-neutral-100 overflow-hidden shrink-0 relative">
                      <img
                        src={extractImageUrl(dish.image)}
                        alt={dish.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Veg / Non-veg Badge */}
                      <span
                        className={`absolute top-1 left-1 h-4 w-4 rounded-full border border-white flex items-center justify-center ${dish.isVeg ? "bg-emerald-500" : "bg-red-500"}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                    </div>

                    {/* Right: Info */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate group-hover:text-orange-700 transition-colors">
                            {dish.name}
                          </h4>
                          <span className="font-mono font-extrabold text-orange-700 text-xs shrink-0">
                            ₹ {dish.price}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {dish.description}
                        </p>

                        {/* Parent Restaurant Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const res = restaurants.find(
                              (r) => String(r.id || r._id) === String(dish.restaurantId),
                            );
                            if (res) {
                              setSelectedRestaurant({
                                ...res,
                                initialMenuItemId: dish.id || dish._id,
                              });
                            }
                          }}
                          className="text-[11px] text-gray-500 hover:text-orange-700 font-semibold flex items-center gap-1 mt-1 hover:underline cursor-pointer"
                        >
                          <span>from {dish.restaurantName}</span>
                          <span className="text-amber-500 font-bold flex items-center">
                            ★ {dish.restaurantRating}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-orange-700 shrink-0" />
                          <span>{dish.deliveryTime}</span>
                        </span>
                        {dish.isAvailable === false ||
                          dish.availability === false ? (
                          <span className="bg-neutral-100 text-neutral-400 border border-neutral-200 text-[11px] font-black px-2.5 py-1 rounded-lg select-none uppercase tracking-wider">
                            OUT OF STOCK
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(
                                dish.restaurantId,
                                dish.restaurantName,
                                dish,
                              );
                            }}
                            className="bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add to Basket</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-premium text-gray-400 text-xs font-semibold">
                No matching dishes found with active filters.
              </div>
            )}
          </div>

          {/* 2. SECTION: MATCHING RESTAURANTS */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display font-black text-base text-gray-900 flex items-center justify-between">
              <span>Matching Restaurants</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-extrabold">
                {searchedRestaurants.length} kitchens
              </span>
            </h3>

            {searchedRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchedRestaurants.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => setSelectedRestaurant(res)}
                    className="bg-white border border-gray-100 rounded-premium p-4 flex gap-4 hover:border-orange-100 cursor-pointer transition shadow-xs group"
                  >
                    <div className="h-20 w-20 rounded-xl bg-neutral-50 overflow-hidden shrink-0 relative">
                      <img
                        src={res.image}
                        alt={res.name}
                        className="h-full w-full object-cover transform group-hover:scale-105 transition"
                      />
                      {res.discount && (
                        <span className="absolute bottom-1 right-1 bg-brand-orange text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded">
                          {res.discount}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate group-hover:text-orange-700 transition">
                            {res.name}
                          </h4>
                          <div className="flex items-center gap-0.5 text-amber-500 shrink-0 font-extrabold text-xs ml-2">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{res.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {res.cuisines.join(", ")}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {res.address}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold mt-2">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3.5 w-3.5 text-orange-700" />
                          {res.deliveryTime}
                        </span>
                        {res.isFreeDelivery ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            Free Delivery
                          </span>
                        ) : (
                          <span className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            ₹{res.deliveryFee} Delivery
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-premium text-gray-400 text-xs font-semibold">
                No matching kitchens found with active filters.
              </div>
            )}
          </div>

          {/* 3. BOTH SECTION EMPTY - NO RESULTS */}
          {searchedDishes.length === 0 && searchedRestaurants.length === 0 && (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-premium p-8 max-w-md mx-auto shadow-sm space-y-4">
              <div className="h-24 w-24 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto relative border border-orange-100 shadow-xs">
                <MdRestaurant className="text-4xl text-orange-500" />
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
                  <HiMagnifyingGlass className="text-base" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-display font-black text-lg text-gray-900">
                  No Delicious Matches Found
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  We searched high and low but couldn't locate any matching
                  culinary items. Try adjusting your filter preferences or
                  searching something else!
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchVegOnly(false);
                  setSearchNonVegOnly(false);
                  setSearchPriceFilter("all");
                  setSearchRatingFilter("all");
                  setSearchDeliveryTimeFilter("all");
                  setSearchHasOffersOnly(false);
                }}
                className="bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>
      ) : null}

      {isVoiceSearching && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          id="voice-search-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
              }
              setIsVoiceSearching(false);
            }
          }}
        >
          <div
            className="bg-white rounded-premium border border-gray-100 p-8 max-w-sm w-full text-center space-y-8 shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <span className="text-orange-700 font-black text-xs uppercase tracking-widest block animate-pulse">
                QuikaBite Audio Engine
              </span>
              <h3 className="font-display font-black text-2xl text-gray-900">
                Listening to Craving
              </h3>
              <p className="text-xs text-gray-400">
                Speak clearly into your device, like "Spicy Mutton Biryani"
              </p>
            </div>

            {/* Pulsing Concentric Ring */}
            <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-orange/10 rounded-full animate-ping" />
              <div className="absolute inset-4 bg-brand-orange/20 rounded-full animate-ping [animation-delay:0.5s]" />
              <div className="h-16 w-16 bg-brand-orange text-white rounded-full flex items-center justify-center relative z-10 shadow-lg">
                <Mic className="h-7 w-7 animate-pulse" />
              </div>
            </div>

            {/* Animated Waveform */}
            <div className="flex justify-center items-end gap-1.5 h-10 pt-2">
              <span className="w-1 bg-brand-orange rounded-full h-8 animate-bounce" />
              <span className="w-1 bg-orange-400 rounded-full h-5 animate-bounce [animation-delay:0.1s]" />
              <span className="w-1 bg-brand-orange rounded-full h-9 animate-bounce [animation-delay:0.3s]" />
              <span className="w-1 bg-orange-400 rounded-full h-6 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 bg-brand-orange rounded-full h-4 animate-bounce [animation-delay:0.4s]" />
              <span className="w-1 bg-orange-300 rounded-full h-7 animate-bounce [animation-delay:0.15s]" />
            </div>

            <p className="text-xs text-gray-500 font-medium italic">
              "Say what you want to eat..."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
