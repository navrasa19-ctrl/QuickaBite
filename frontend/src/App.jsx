import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, MapPin } from "lucide-react";
import {
  RESTAURANTS,
  CATEGORIES,
  OFFER_CARDS,
  COLLECTIONS,
  saveRestaurantsToStorage,
  EXTRA_KITCHENS,
  INITIAL_NOTIFICATIONS,
} from "./data";
import Navbar from "./components/common/Navbar";
import HeroSlider from "./components/diner/HeroSlider";
import HomePage from "./components/diner/HomePage";
import CloudKitchenSection from "./components/diner/CloudKitchenSection";
import BottomNavbar from "./components/common/BottomNavbar";
import CartConflictModal from "./components/diner/CartConflictModal";
import LandingLoader from "./components/common/LandingLoader";

// Lazy-loaded page view components & heavy overlays
const SearchPage = lazy(() => import("./components/diner/SearchPage"));
const OffersPage = lazy(() => import("./components/diner/OffersPage"));
const OrdersPage = lazy(() => import("./components/diner/OrdersPage"));
const ProfilePage = lazy(() => import("./components/diner/ProfilePage"));
const FavoritesPage = lazy(() => import("./components/diner/FavoritesPage"));
const SupportPage = lazy(() => import("./components/diner/SupportPage"));
const ShoppingCartPage = lazy(() => import("./components/diner/ShoppingCartPage"));
const CheckoutPage = lazy(() => import("./components/diner/CheckoutPage"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const ManagerDashboard = lazy(() => import("./components/manager/ManagerDashboard"));
const BrandManagementTab = lazy(() => import("./components/admin/BrandManagementTab"));
const ReelPlayer = lazy(() => import("./components/diner/ReelPlayer"));
const RestaurantDetailModal = lazy(() => import("./components/diner/RestaurantDetailModal"));
const CartDrawer = lazy(() => import("./components/diner/CartDrawer"));
const ActiveOrderTracker = lazy(() => import("./components/diner/ActiveOrderTracker"));
const AuthPage = lazy(() => import("./components/common/AuthPage"));

import { authService } from "./api/authService";
import { dinerService, normalizeMenuItem } from "./api/dinerService";
import { getUserLocationCoordinates, requestExactHighAccuracyGps } from "./utils/locationHelper";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { OrdersProvider, useOrders } from "./context/OrdersContext";
import { FavoritesProvider, useFavorites } from "./context/FavoritesContext";
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext";
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLoader, setShowLoader] = useState(() => {
    return !sessionStorage.getItem("qb_loaded");
  });

  // Draw global context states
  const { isLoggedIn, setIsLoggedIn, userRole, setUserRole, logout, profile } =
    useAuth();
  const {
    cartItems,
    setCartItems,
    cartRestaurant,
    setCartRestaurant,
    cartConflict,
    setCartConflict,
    addToCart,
    removeFromCart,
    clearCart,
    resolveCartConflict: contextResolveCartConflict,
  } = useCart();
  const { orders, setOrders, activeOrder, setActiveOrder, checkoutSuccess } =
    useOrders();
  const {
    favorites,
    setFavorites,
    favoriteDishes,
    setFavoriteDishes,
    toggleFavorite,
    toggleFavoriteDish,
  } = useFavorites();
  const {
    notifications,
    setNotifications,
    markAllAsRead,
    toggleRead,
    deleteNotification,
    clearAll,
    addNotification,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.substring(1);
    const validTabs = [
      "home",
      "search",
      "offers",
      "orders",
      "profile",
      "admin",
      "manager",
      "brands",
      "favorites",
      "cart",
      "checkout",
      "support",
      "login",
    ];
    if (path && validTabs.includes(path)) {
      return path;
    }
    const role = authService.getCurrentUser().role;
    if (role === "admin") {
      return "admin";
    }
    if (role === "manager") {
      return "manager";
    }
    return "home";
  });

  useEffect(() => {
    const rawPath = location.pathname.substring(1);
    if (!rawPath || rawPath === "") {
      navigate("/home", { replace: true });
      return;
    }

    const parts = rawPath.split("/");
    const path = parts[0];
    const subRoute = parts[1] || "";

    const validTabs = [
      "home",
      "search",
      "offers",
      "orders",
      "profile",
      "admin",
      "manager",
      "brands",
      "favorites",
      "cart",
      "checkout",
      "support",
      "login",
    ];
    if (!validTabs.includes(path)) {
      navigate("/home", { replace: true });
      return;
    }

    // Guard: logged in users should not access the login page
    if (path === "login" && isLoggedIn) {
      if (userRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === "manager") {
        navigate("/manager", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
      return;
    }

    // Auth & Role Guards
    const requiresAuth = [
      "orders",
      "profile",
      "checkout",
      "admin",
      "manager",
      "brands",
    ].includes(path);

    if (requiresAuth && !isLoggedIn) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      triggerToast(
        `Please sign in to access your ${path.charAt(0).toUpperCase() + path.slice(1)}!`,
      );
      return;
    }

    if (path === "admin") {
      if (userRole !== "admin") {
        navigate("/home", { replace: true });
        return;
      }

      const normalizedSub = subRoute.toLowerCase();
      if (!subRoute || normalizedSub === "dashboard" || normalizedSub === "overview") {
        setAdminSubTab("dashboard");
      } else if (normalizedSub === "bireporting" || normalizedSub === "reports") {
        setAdminSubTab("BIreporting");
      } else if (normalizedSub === "support-tickets" || normalizedSub === "support") {
        setAdminSubTab("support-tickets");
      } else if (normalizedSub === "categories") {
        setAdminSubTab("categories");
      } else if (normalizedSub === "brands") {
        setAdminSubTab("brands");
      } else if (normalizedSub === "orders") {
        setAdminSubTab("orders");
      } else if (normalizedSub === "restaurants" || normalizedSub === "menu") {
        setAdminSubTab("restaurants");
      } else if (normalizedSub === "marketing" || normalizedSub === "coupons") {
        setAdminSubTab("marketing");
      } else if (normalizedSub === "users") {
        setAdminSubTab("users");
      } else if (normalizedSub === "notifications") {
        setAdminSubTab("notifications");
      }
    }

    if (path === "manager" && userRole !== "manager") {
      navigate("/home", { replace: true });
      return;
    }

    if (path === "brands" && userRole !== "admin" && userRole !== "manager") {
      navigate("/home", { replace: true });
      return;
    }

    if (
      (path === "favorites" || path === "cart" || path === "checkout" || path === "support") &&
      (userRole === "admin" || userRole === "manager")
    ) {
      navigate("/home", { replace: true });
      return;
    }

    if (path !== activeTab) {
      setActiveTab(path);
    }
  }, [location.pathname, navigate, activeTab, isLoggedIn, userRole]);

  const [restaurants, setRestaurants] = useState([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterPureVeg, setFilterPureVeg] = useState(false);
  const [filterOffers, setFilterOffers] = useState(false);
  const [filterPrice, setFilterPrice] = useState("all");
  const [adminSubTab, setAdminSubTab] = useState("dashboard");
  const [marketingSubTab, setMarketingSubTab] = useState("coupons");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCuisineExpanded, setIsCuisineExpanded] = useState(false);
  const [isPopularCuisinesExpanded, setIsPopularCuisinesExpanded] =
    useState(false);
  const [toast, setToast] = useState(null);
  const [hideBottomNavbar, setHideBottomNavbar] = useState(false);
  const triggerToast = (msg) => {
    setToast(msg);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const navigateWithAuth = (target, options) => {
    if (typeof target === "string") {
      if (target.startsWith("/")) {
        navigate(target, options);
      } else {
        navigate(`/${target}`, options);
      }
    } else {
      navigate(target, options);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    triggerToast("Logged out successfully.");
  };

  const [userLocationCoords, setUserLocationCoords] = useState(null);
  const [isLocationResolved, setIsLocationResolved] = useState(false);
  const lastFetchedCoordsRef = useRef(null);
  const [isGpsDenied, setIsGpsDenied] = useState(false);
  const [showGpsHelpModal, setShowGpsHelpModal] = useState(false);

  const handleRequestGpsAgain = async () => {
    triggerToast("Requesting device location permission...");
    try {
      const res = await requestExactHighAccuracyGps();
      lastFetchedCoordsRef.current = null;
      setUserLocationCoords(res);
      setIsGpsDenied(false);
      setShowGpsHelpModal(false);

      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${res.lat}&lon=${res.lng}`
        );
        const data = await revRes.json();
        const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential;
        const city = data.address?.city || data.address?.town || data.address?.village || "";
        const displayLoc = suburb ? `${suburb}, ${city}` : city;
        if (displayLoc) {
          setCurrentLocation(displayLoc);
          triggerToast(`Location updated: ${displayLoc}`);
        }
      } catch (e) {
        setCurrentLocation("Live GPS Location");
        triggerToast("Exact GPS location acquired!");
      }
    } catch (err) {
      setIsGpsDenied(true);
      setCurrentLocation("");
      setShowGpsHelpModal(true);
      triggerToast(err.message || "Please enable Location permission in your browser settings.");
    }
  };

  const handleSelectLocation = ({ lat, lng, displayText }) => {
    if (displayText) {
      setCurrentLocation(displayText);
    }
    if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
      const newCoords = {
        lat: Number(lat),
        lng: Number(lng),
        source: "user_selected",
      };
      lastFetchedCoordsRef.current = null; // Reset cached coordinate key to force immediate re-fetch
      setUserLocationCoords(newCoords);
      setIsGpsDenied(false);
      triggerToast(`Location updated! Fetching deliverable outlets for ${displayText ? displayText.split(":")[0] : "selected address"}...`);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const resolveLocation = async () => {
      const defaultAddr = Array.isArray(profile?.addresses)
        ? profile.addresses.find((a) => a.isDefault || a.default) || profile.addresses[0]
        : profile?.defaultAddress || null;
      const coords = await getUserLocationCoordinates(isLoggedIn, defaultAddr);
      if (isMounted) {
        if (coords) {
          setUserLocationCoords(coords);

          if (coords.source === "fallback") {
            setIsGpsDenied(true);
            setCurrentLocation(""); // Do NOT show fake default string when location is missing!
          } else {
            setIsGpsDenied(false);
            if (coords.source === "saved_address" && defaultAddr) {
              const tag = defaultAddr.label === "Other" && defaultAddr.tagName ? defaultAddr.tagName : defaultAddr.label || "Address";
              setCurrentLocation(defaultAddr.detail ? `${tag}: ${defaultAddr.detail}` : tag);
            } else {
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
                );
                const data = await res.json();
                const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential;
                const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
                const displayLoc = suburb ? `${suburb}, ${city}` : city;
                if (isMounted && displayLoc) {
                  setCurrentLocation(displayLoc);
                }
              } catch (e) {
                console.warn("Reverse geocode failed:", e);
              }
            }
          }
        } else {
          setUserLocationCoords(null);
          setIsGpsDenied(true);
          setCurrentLocation("");
        }
        setIsLocationResolved(true);
      }
    };
    resolveLocation();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, profile]);

  useEffect(() => {
    if (!isLocationResolved && userLocationCoords === null) {
      return;
    }

    const currentLat = userLocationCoords?.lat ?? null;
    const currentLng = userLocationCoords?.lng ?? null;
    const coordKey = `${currentLat},${currentLng}`;

    if (lastFetchedCoordsRef.current === coordKey) {
      return;
    }

    const loadRestaurants = async () => {
      setIsLoadingRestaurants(true);
      try {
        const list = await dinerService.getRestaurants(userLocationCoords);
        lastFetchedCoordsRef.current = coordKey;

        if (import.meta.env.VITE_USE_MOCK === "false") {
          try {
            const allMenus = await dinerService.getMenuItems(userLocationCoords);

            const updatedList = list.map((res) => {
              const resIdStr = String(res._id || res.id || "");
              const resSlugStr = String(res.slug || "");
              const resNameStr = String(res.name || "").toLowerCase().trim();

              const restaurantMenus = (allMenus || [])
                .filter((item) => {
                  const itemResObj = typeof item.restaurant === "object" ? item.restaurant : null;
                  const itemResId = String(
                    itemResObj?._id ||
                    itemResObj?.id ||
                    item.restaurantId ||
                    (typeof item.restaurant === "string" ? item.restaurant : "")
                  );
                  const itemResName = String(
                    itemResObj?.name || item.restaurantName || ""
                  ).toLowerCase().trim();

                  return (
                    (itemResId && resIdStr && itemResId === resIdStr) ||
                    (itemResId && resSlugStr && itemResId === resSlugStr) ||
                    (itemResName && resNameStr && itemResName === resNameStr)
                  );
                });
              return {
                ...res,
                menu: restaurantMenus.length > 0 ? restaurantMenus : (res.menu || []),
              };
            });
            setRestaurants(updatedList);
          } catch (menuErr) {
            console.error("Failed to load deliverable menus in App.jsx:", menuErr);
            setRestaurants(list);
          }
        } else {
          setRestaurants(list);
        }
      } catch (err) {
        console.error("Failed to load deliverable restaurants in App.jsx:", err);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };
    loadRestaurants();
  }, [userLocationCoords?.lat, userLocationCoords?.lng, isLocationResolved]);
  const [isExploreMoreUnlocked, setIsExploreMoreUnlocked] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [preAppliedCoupon, setPreAppliedCoupon] = useState("");

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [activeReelId, setActiveReelId] = useState(null);
  const [reels, setReels] = useState([]);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const fetched = await dinerService.getReels();
        setReels(Array.isArray(fetched) && fetched.length > 0 ? fetched : []);
      } catch (err) {
        console.error("Error fetching reels in App.jsx:", err);
        setReels([]);
      }
    };
    fetchReels();
  }, []);


  const handleSetSelectedRestaurant = (restaurant) => {
    if (restaurant) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const resId = restaurant.id || restaurant._id;
        next.set("restaurant", resId);
        if (restaurant.initialMenuItemId) {
          next.set("dish", restaurant.initialMenuItemId);
        } else {
          next.delete("dish");
        }
        return next;
      });
    } else {
      if (searchParams.has("restaurant")) {
        navigate(-1);
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("restaurant");
          next.delete("dish");
          return next;
        });
      }
    }
  };

  const handleSetActiveReelId = (reelId) => {
    if (reelId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("reel", reelId);
        return next;
      });
    } else {
      if (searchParams.has("reel")) {
        navigate(-1);
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("reel");
          return next;
        });
      }
    }
  };

  const handleSetIsCartOpen = (isOpen) => {
    if (isOpen) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("cart", "true");
        return next;
      });
    } else {
      if (searchParams.get("cart") === "true") {
        navigate(-1);
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("cart");
          return next;
        });
      }
    }
  };

  const restaurantParam = searchParams.get("restaurant");
  const dishParam = searchParams.get("dish");
  const reelParam = searchParams.get("reel");
  const cartParam = searchParams.get("cart");

  useEffect(() => {
    if (restaurantParam) {
      const found = restaurants.find(
        (r) => String(r.id || r._id) === String(restaurantParam)
      );
      if (found) {
        setSelectedRestaurant({
          ...found,
          initialMenuItemId: dishParam || found.initialMenuItemId,
        });
      } else {
        setSelectedRestaurant(null);
      }
    } else {
      setSelectedRestaurant(null);
    }

    if (reelParam) {
      setActiveReelId(reelParam);
    } else {
      setActiveReelId(null);
    }

    const cartOpen = cartParam === "true";
    setIsCartOpen(cartOpen);
  }, [restaurantParam, reelParam, cartParam, restaurants]);
  const handleToggleFavoriteDish = (dishId) => {
    toggleFavoriteDish(dishId, triggerToast);
  };
  const handleMarkAllNotificationsAsRead = () => {
    markAllAsRead(triggerToast);
  };
  const handleToggleNotificationRead = (id) => {
    toggleRead(id);
  };
  const handleDeleteNotification = (id) => {
    deleteNotification(id, triggerToast);
  };
  const handleClearAllNotifications = () => {
    clearAll(triggerToast);
  };
  const handleCheckoutSuccess = (newOrder) => {
    checkoutSuccess(newOrder, addNotification, navigate);
  };
  const handleAddToCart = (resId, resName, item) => {
    addToCart(resId, resName, item, triggerToast);
  };
  const resolveCartConflict = () => {
    contextResolveCartConflict(triggerToast);
  };
  const handleRemoveFromCart = (resId, itemId) => {
    removeFromCart(resId, itemId);
  };
  const handleToggleRadius = (expanded) => {
    setIsExploreMoreUnlocked(expanded);
    if (import.meta.env.VITE_USE_MOCK === "false") {
      triggerToast(
        expanded
          ? "Delivery radius expanded! Showing all available partners."
          : "Delivery radius reset to Home (Local partners only).",
      );
      return;
    }
    if (expanded) {
      const combined = [...RESTAURANTS, ...EXTRA_KITCHENS];
      const unique = combined.filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
      );
      saveRestaurantsToStorage(unique);
      setRestaurants(unique);
      triggerToast(
        "Delivery radius expanded! 4 hidden gourmet gems unlocked near Jumeirah & Business Bay.",
      );
    } else {
      const extraIds = EXTRA_KITCHENS.map((k) => k.id);
      const filtered = RESTAURANTS.filter((r) => !extraIds.includes(r.id));
      saveRestaurantsToStorage(filtered);
      setRestaurants(filtered);
      triggerToast(
        "Delivery radius reset to Home, Dubai (Local partners only).",
      );
    }
  };
  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    const isSpecial = catId === "italian" || catId === "desserts";
    if (isSpecial && !isExploreMoreUnlocked) {
      handleToggleRadius(true);
      triggerToast(
        `Expanded delivery zone to show premium ${catId === "italian" ? "Italian" : "Dessert"} options!`,
      );
    }
  };
  const handleToggleFavorite = (resId, e, resName) => {
    toggleFavorite(resId, e, triggerToast, resName);
  };
  const filteredRestaurants = restaurants.filter((restaurant) => {
    let matchesCategory = selectedCategory === "all";
    if (!matchesCategory) {
      const cat = selectedCategory.toLowerCase();
      const checkMatch = (term) => {
        const t = term.toLowerCase();
        if (cat === "burger") {
          return (
            t.includes("burger") ||
            t.includes("fast food") ||
            t.includes("american")
          );
        }
        if (cat === "arabian") {
          return (
            t.includes("arab") ||
            t.includes("shawarma") ||
            t.includes("lebanese") ||
            t.includes("middle eastern") ||
            t.includes("kebab")
          );
        }
        if (cat === "indian") {
          return (
            t.includes("indian") ||
            t.includes("mughlai") ||
            t.includes("kebab") ||
            t.includes("biryani")
          );
        }
        if (cat === "biryani") {
          return t.includes("biryani");
        }
        if (cat === "chinese") {
          return (
            t.includes("chinese") ||
            t.includes("thai") ||
            t.includes("asian") ||
            t.includes("sichuan") ||
            t.includes("noodle") ||
            t.includes("ramen") ||
            t.includes("japanese")
          );
        }
        if (cat === "italian") {
          return (
            t.includes("italian") ||
            t.includes("pizza") ||
            t.includes("pasta") ||
            t.includes("truffle")
          );
        }
        if (cat === "healthy") {
          return (
            t.includes("healthy") || t.includes("salad") || t.includes("veg")
          );
        }
        if (cat === "desserts") {
          return (
            t.includes("dessert") ||
            t.includes("sweet") ||
            t.includes("waffle") ||
            t.includes("crepe") ||
            t.includes("ice cream") ||
            t.includes("cake") ||
            t.includes("chocolate")
          );
        }
        return t.includes(cat);
      };
      matchesCategory =
        restaurant.cuisines.some((c) => checkMatch(c)) ||
        restaurant.menu.some(
          (item) => checkMatch(item.category) || checkMatch(item.name),
        );
    }
    if (!matchesCategory) return false;
    if (filterFastDelivery) {
      const minutes = parseInt(restaurant.deliveryTime, 10);
      if (isNaN(minutes) || minutes > 30) return false;
    }
    if (filterTopRated) {
      if (restaurant.rating < 4.5) return false;
    }
    if (filterPureVeg) {
      const hasVeg = restaurant.menu.some((item) => item.isVeg);
      if (!hasVeg) return false;
    }
    if (filterOffers) {
      if (!restaurant.isPromoBadge) return false;
    }
    if (filterPrice !== "all") {
      const hasMatchingPrice = restaurant.menu.some((item) => {
        const price = Number(item.price);
        if (filterPrice === "under-99") return price <= 99;
        if (filterPrice === "under-199") return price <= 199;
        if (filterPrice === "under-299") return price <= 299;
        if (filterPrice === "above-299") return price >= 299;
        return true;
      });
      if (!hasMatchingPrice) return false;
    }
    return true;
  });
  if (activeTab === "login" && isLoggedIn) {
    return null;
  }

  if (activeTab === "login" && !isLoggedIn) {
    return (
      <>
        <AnimatePresence mode="wait">
          {showLoader && (
            <LandingLoader
              onComplete={() => {
                sessionStorage.setItem("qb_loaded", "true");
                setShowLoader(false);
              }}
            />
          )}
        </AnimatePresence>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh] w-full py-12">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        }>
          <AuthPage
            onLoginSuccess={(profileData) => {
              // Auth state (isLoggedIn, userRole, profile) is already set inside
              // AuthContext by verifyLoginOtp / verifySignupOtp. We only handle routing.
              const role = profileData?.role || "user";
              if (role === "admin") {
                navigate("/admin", { replace: true });
              } else if (role === "manager") {
                navigate("/manager", { replace: true });
              } else {
                let redirectPath = location.state?.from || "/home";
                if (redirectPath === "/login") {
                  redirectPath = "/home";
                }
                navigate(redirectPath, { replace: true });
              }
            }}
            onBackToHome={() => navigate("/home")}
            triggerToast={triggerToast}
          />
        </Suspense>
        {toast && (
          <div
            className="fixed inset-x-0 mx-auto w-fit max-w-[calc(100vw-2rem)] bottom-24 xl:bottom-8 z-[9999] bg-brand-dark text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-up"
            id="auth-toast-banner"
          >
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }
  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <LandingLoader
            onComplete={() => {
              sessionStorage.setItem("qb_loaded", "true");
              setShowLoader(false);
            }}
          />
        )}
      </AnimatePresence>
      <div
        className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden ${(userRole === "admin" || userRole === "manager" || activeTab === "admin" || activeTab === "manager") ? "pb-0 bg-neutral-100" : "bg-cream-base pb-28 xl:pb-12"}`}
        id="main-globaleats-app"
      >
        {/* Decorative floating spices/ingredients and herb illustrations in background */}

        {/* 1. Global Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={navigateWithAuth}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cartCount={cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
          onCartToggle={() => navigateWithAuth("cart")}
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
          onSelectLocation={handleSelectLocation}
          onRequestGpsAgain={handleRequestGpsAgain}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onDeleteNotification={handleDeleteNotification}
          onClearAllNotifications={handleClearAllNotifications}
          userRole={userRole}
          onLogout={handleLogout}
          isLoggedIn={isLoggedIn}
          profile={profile}
        />

        {/* GPS Permission Warning / Location Banner */}
        {isGpsDenied && activeTab === "home" && userRole !== "admin" && userRole !== "manager" && (
          <div className="hidden md:flex bg-amber-50 text-amber-900 text-sm px-4 py-2 text-center font-medium border-b border-amber-200 items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span>Showing all restaurants. Enable location permission to see outlets that deliver to you.</span>
          </div>
        )}

        {/* Main Core View Area */}
        <main
          className={`flex-1 w-full relative ${(userRole === "admin" || userRole === "manager" || activeTab === "admin" || activeTab === "manager") ? "max-w-none px-0 py-0" : "page-container py-5 sm:py-6 lg:py-8"}`}
          id="viewports-stage"
        >
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh] w-full py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <span className="text-xs font-semibold text-neutral-500 tracking-wide animate-pulse">Loading content...</span>
              </div>
            </div>
          }>
            {activeTab === "home" &&
              userRole !== "admin" &&
              userRole !== "manager" && (
                <HomePage
                  restaurants={restaurants}
                  userLocationCoords={userLocationCoords}
                  currentLocation={currentLocation}
                  onRequestGpsAgain={handleRequestGpsAgain}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  isCuisineExpanded={isCuisineExpanded}
                  setIsCuisineExpanded={setIsCuisineExpanded}
                  isPopularCuisinesExpanded={isPopularCuisinesExpanded}
                  setIsPopularCuisinesExpanded={setIsPopularCuisinesExpanded}
                  triggerToast={triggerToast}
                  cartItems={cartItems}
                  handleAddToCart={handleAddToCart}
                  handleRemoveFromCart={handleRemoveFromCart}
                  filterFastDelivery={filterFastDelivery}
                  setFilterFastDelivery={setFilterFastDelivery}
                  filterTopRated={filterTopRated}
                  setFilterTopRated={setFilterTopRated}
                  filterPureVeg={filterPureVeg}
                  setFilterPureVeg={setFilterPureVeg}
                  filterOffers={filterOffers}
                  setFilterOffers={setFilterOffers}
                  filterPrice={filterPrice}
                  setFilterPrice={setFilterPrice}
                  filteredRestaurants={filteredRestaurants}
                  setSelectedRestaurant={handleSetSelectedRestaurant}
                  favorites={favorites}
                  handleToggleFavorite={handleToggleFavorite}
                  isExploreMoreUnlocked={isExploreMoreUnlocked}
                  handleToggleRadius={handleToggleRadius}
                  setActiveReelId={handleSetActiveReelId}
                  setActiveTab={navigateWithAuth}
                />
              )}

            {/* TAB 2: SEARCH DIRECT VIEW */}
            {activeTab === "search" && (
              <SearchPage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                restaurants={restaurants}
                onAddToCart={handleAddToCart}
                setSelectedRestaurant={handleSetSelectedRestaurant}
                setActiveTab={navigateWithAuth}
                triggerToast={triggerToast}
                isLoading={isLoadingRestaurants}
              />
            )}

            {/* TAB 3: OFFERS VIEW */}
            {activeTab === "offers" && (
              <OffersPage
                preAppliedCoupon={preAppliedCoupon}
                setPreAppliedCoupon={setPreAppliedCoupon}
                triggerToast={triggerToast}
              />
            )}

            {/* TAB 5: MY ORDERS HISTORY */}
            {activeTab === "orders" &&
              (activeOrder ? (
                <ActiveOrderTracker
                  order={activeOrder}
                  onClose={() => {
                    setActiveOrder(null);
                  }}
                  triggerToast={triggerToast}
                />
              ) : (
                <OrdersPage
                  orders={orders}
                  setOrders={setOrders}
                  activeOrder={activeOrder}
                  setActiveOrder={setActiveOrder}
                  onAddToCart={handleAddToCart}
                  setIsCartOpen={handleSetIsCartOpen}
                  setActiveTab={navigateWithAuth}
                  triggerToast={triggerToast}
                />
              ))}

            {/* TAB 4: MY PROFILE PREFERENCES */}
            {activeTab === "profile" && (
              <ProfilePage
                setSelectedRestaurant={handleSetSelectedRestaurant}
                setActiveTab={navigateWithAuth}
                triggerToast={triggerToast}
                setIsLoggedIn={setIsLoggedIn}
              />
            )}

            {/* TAB 10: ADMIN DASHBOARD */}
            {(activeTab === "home" || activeTab === "admin") &&
              userRole === "admin" && (
                <AdminDashboard
                  orders={orders}
                  setOrders={setOrders}
                  activeOrder={activeOrder}
                  setActiveOrder={setActiveOrder}
                  triggerToast={triggerToast}
                  setActiveTab={navigateWithAuth}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  adminSubTab={adminSubTab}
                  setAdminSubTab={setAdminSubTab}
                  userRole={userRole}
                  marketingSubTab={marketingSubTab}
                  setMarketingSubTab={setMarketingSubTab}
                />
              )}

            {/* TAB 12: MANAGER DASHBOARD */}
            {(activeTab === "home" || activeTab === "manager") &&
              userRole === "manager" && (
                <ManagerDashboard
                  orders={orders}
                  setOrders={setOrders}
                  triggerToast={triggerToast}
                  setHideBottomNavbar={setHideBottomNavbar}
                />
              )}

            {/* TAB 11: VIRTUAL BRAND MANAGEMENT */}
            {activeTab === "brands" &&
              (userRole === "admin" || userRole === "manager") && (
                <div
                  className="bg-cream-base p-4 sm:p-6"
                  id="admin-brands-tab-viewport"
                >
                  <BrandManagementTab
                    orders={orders}
                    triggerToast={triggerToast}
                  />
                </div>
              )}

            {/* TAB 8: FAVORITES VIEW */}
            {activeTab === "favorites" && (
              <FavoritesPage
                favorites={favorites}
                setFavorites={setFavorites}
                favoriteDishes={favoriteDishes}
                setFavoriteDishes={setFavoriteDishes}
                restaurants={restaurants}
                onAddToCart={handleAddToCart}
                setSelectedRestaurant={handleSetSelectedRestaurant}
                setActiveTab={navigateWithAuth}
                triggerToast={triggerToast}
              />
            )}

            {/* TAB 6: SHOPPING CART PAGE */}
            {activeTab === "cart" && (
              <ShoppingCartPage
                cartItems={cartItems}
                restaurantName={cartRestaurant?.name || ""}
                restaurantId={cartRestaurant?.id || ""}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={clearCart}
                onCheckoutSuccess={handleCheckoutSuccess}
                setActiveTab={navigateWithAuth}
                triggerToast={triggerToast}
                preAppliedCoupon={preAppliedCoupon}
                setPreAppliedCoupon={setPreAppliedCoupon}
              />
            )}

            {/* TAB 7: SECURE CHECKOUT PAGE */}
            {activeTab === "checkout" && (
              <CheckoutPage
                cartItems={cartItems}
                restaurantName={cartRestaurant?.name || ""}
                restaurantId={cartRestaurant?.id || ""}
                onClearCart={clearCart}
                onCheckoutSuccess={handleCheckoutSuccess}
                setActiveTab={navigateWithAuth}
                triggerToast={triggerToast}
                preAppliedCoupon={preAppliedCoupon}
                setPreAppliedCoupon={setPreAppliedCoupon}
              />
            )}

            {/* SUPPORT CENTER VIEW */}
            {activeTab === "support" && (
              <SupportPage
                orders={orders}
                triggerToast={triggerToast}
                setActiveTab={navigateWithAuth}
              />
            )}
          </Suspense>
        </main>

        <Suspense fallback={null}>
          {/* 2. Slide Drawer for Cart */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => handleSetIsCartOpen(false)}
            cartItems={cartItems}
            restaurantId={cartRestaurant?.id || ""}
            restaurantName={cartRestaurant?.name || ""}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={clearCart}
            onCheckoutSuccess={handleCheckoutSuccess}
            onProceedToCheckout={() => navigateWithAuth("checkout")}
          />

          {/* 3. Restaurant Detail Modal */}
          {selectedRestaurant && (
            <RestaurantDetailModal
              restaurant={selectedRestaurant}
              cartItems={cartItems.filter(
                (item) => cartRestaurant?.id === selectedRestaurant.id,
              )}
              onClose={() => handleSetSelectedRestaurant(null)}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              favoriteDishes={favoriteDishes}
              onToggleFavoriteDish={handleToggleFavoriteDish}
              onViewCart={() => {
                setSelectedRestaurant(null);
                navigate("/cart");
              }}
            />
          )}

          {/* 4. Reels vertical full screen player */}
          {activeReelId && (
            <ReelPlayer
              reels={reels}
              initialReelId={activeReelId}
              onClose={() => handleSetActiveReelId(null)}
              onAddToCart={handleAddToCart}
            />
          )}
        </Suspense>

        {/* 5. Sticky Bottom Navigation Bar (Responsive floating dock) */}
        {!hideBottomNavbar && activeTab !== "admin" && userRole !== "admin" && (
          <BottomNavbar
            activeTab={activeTab}
            setActiveTab={navigateWithAuth}
            userRole={userRole}
            cartItems={cartItems}
            adminSubTab={adminSubTab}
            setAdminSubTab={setAdminSubTab}
            marketingSubTab={marketingSubTab}
            setMarketingSubTab={setMarketingSubTab}
          />
        )}



        {/* 6. Custom Cart Conflict Modal */}
        <CartConflictModal
          cartConflict={cartConflict}
          cartRestaurantName={cartRestaurant?.name || ""}
          onClose={() => setCartConflict(null)}
          onConfirm={resolveCartConflict}
        />

        {/* 7. GPS Permission Guidance Modal */}
        {showGpsHelpModal && (
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setShowGpsHelpModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-red-600 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Location Permission Blocked
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Your browser has remembered the choice to block location.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                <p className="font-bold text-amber-950">How to unblock location in your browser:</p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium text-amber-900">
                  <li>Click the <strong>🔒 Padlock / Controls icon</strong> on the left side of your browser URL bar.</li>
                  <li>Find <strong>Location</strong> and change the setting to <strong>Allow</strong>.</li>
                  <li>Ensure your device's overall <strong>GPS / Location setting</strong> is turned ON.</li>
                </ol>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGpsHelpModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRequestGpsAgain();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-brand-orange hover:bg-orange-700 transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Try Requesting Again</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. Beautiful Toast Banner */}
        {toast && (
          <div
            className="fixed inset-x-0 mx-auto w-fit max-w-[calc(100vw-2rem)] bottom-24 xl:bottom-8 z-[9999] bg-brand-dark text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-slide-up"
            id="toast-banner"
          >
            <span className="text-orange-700 text-sm font-black">✦</span>
            <span>{toast}</span>
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrdersProvider>
          <FavoritesProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </FavoritesProvider>
        </OrdersProvider>
      </CartProvider>
    </AuthProvider>
  );
}
