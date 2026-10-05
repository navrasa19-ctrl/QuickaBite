import React, { useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import {
  X,
  Star,
  Clock,
  Search,
  Check,
  CheckCircle,
  Ticket,
  Calendar,
  Camera,
  Plus,
  Minus,
  ShoppingCart,
  ShoppingBag,
  ThumbsUp,
  Send,
  Sparkles,
  Upload,
  Trash2,
  Heart,
  Edit3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { extractImageUrl, dinerService, normalizeReview } from "../../api/dinerService";
import { parseApiError } from "../../api/apiClient";
const getInitialReviewsForRestaurant = (restaurantId) => {
  const commonReplies = {
    chef: {
      text: "Thank you so much! Our kitchen team is extremely dedicated to packing meals with premium insulated wraps so they arrive fresh and hot. We are thrilled to cook for you!",
      date: "Today",
      author: "Head Chef",
    },
    manager: {
      text: "We appreciate your wonderful feedback. We share these words with our staff to keep delivering top quality. Looking forward to your next order!",
      date: "Yesterday",
      author: "Restaurant Manager",
    },
  };
  const reviewsByRestaurant = {
    "bombay-darling": [
      {
        id: "bd-rev-1",
        userName: "Mariam Al-Mansoori",
        rating: 5,
        date: "Today",
        text: "The Chicken Biryani was absolutely scrumptious! Highly recommended. The delivery arrived 10 minutes earlier than estimated, and the food was steaming hot.",
        likes: 14,
        photos: [
          "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.chef,
      },
      {
        id: "bd-rev-2",
        userName: "Hassan Syed",
        rating: 5,
        date: "3 days ago",
        text: "The Butter Chicken with Garlic Naan is legendary! Perfect sweetness and spice balance. Consistent quality every single time.",
        likes: 9,
        photos: [
          "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: null,
      },
    ],
    "biryani-junction": [
      {
        id: "bj-rev-1",
        userName: "Aisha Al-Maktoum",
        rating: 5,
        date: "Today",
        text: "The Hyderabadi Dum Biryani here is as authentic as it gets. Long grain rice, perfectly spiced chicken, and beautiful saffron aroma. Best biryani in town!",
        likes: 18,
        photos: [
          "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.chef,
      },
      {
        id: "bj-rev-2",
        userName: "Kabir Dev",
        rating: 4,
        date: "5 days ago",
        text: "Tried the Lucknowi Mutton Biryani. It was cooked to perfection, mutton was falling off the bone. A bit mild for my taste but high quality.",
        likes: 7,
        photos: [],
        restaurantReply: null,
      },
    ],
    "la-dolce-vita": [
      {
        id: "ldv-rev-1",
        userName: "Francesca Rossi",
        rating: 5,
        date: "Yesterday",
        text: "Mamma Mia! The woodfired Margherita pizza took me straight to Naples. The crust is perfectly thin and charred. Best Italian option on this app!",
        likes: 21,
        photos: [
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.chef,
      },
      {
        id: "ldv-rev-2",
        userName: "Liam Cooper",
        rating: 5,
        date: "4 days ago",
        text: "Outstanding Creamy Fettuccine Carbonara. Very rich, perfectly seasoned with real parmigiano. Delivery was prompt.",
        likes: 12,
        photos: [
          "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.manager,
      },
    ],
    "the-burger-lab": [
      {
        id: "tbl-rev-1",
        userName: "Zayn Malik",
        rating: 5,
        date: "Today",
        text: "The Lava Cheese Burger is an absolute masterpiece! Cheesy goodness oozing with every bite. Fries were seasoned perfectly too.",
        likes: 15,
        photos: [
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.chef,
      },
      {
        id: "tbl-rev-2",
        userName: "Sarah Jenkins",
        rating: 4,
        date: "3 days ago",
        text: "Loved the Peri-Peri fried chicken burger. Crispy, spicy, and juicy. Deducting one star because delivery took a bit longer than estimated.",
        likes: 6,
        photos: [],
        restaurantReply: commonReplies.manager,
      },
    ],
    "sweet-treats-co": [
      {
        id: "stc-rev-1",
        userName: "Fatima Al-Kamali",
        rating: 5,
        date: "Yesterday",
        text: "Best chocolate fudge lava cake I have ever had! Warm, gooey, and absolutely decadent. Highly recommend ordering.",
        likes: 11,
        photos: [
          "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.chef,
      },
      {
        id: "stc-rev-2",
        userName: "Noah Miller",
        rating: 5,
        date: "2 weeks ago",
        text: "The red velvet cupcakes are out of this world. Frosting is not too sweet, just perfect. My kids absolutely loved them!",
        likes: 8,
        photos: [
          "https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: null,
      },
    ],
    "green-lean-salads": [
      {
        id: "gls-rev-1",
        userName: "Emily Watson",
        rating: 5,
        date: "Today",
        text: "Finally a healthy option that actually tastes incredible! Avocado Quinoa bowl is loaded with fresh, high-quality ingredients.",
        likes: 13,
        photos: [
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.chef,
      },
      {
        id: "gls-rev-2",
        userName: "Ryan Reynolds",
        rating: 5,
        date: "4 days ago",
        text: "The Grilled Salmon salad was fresh and healthy. Dressing was outstanding, Salmon cooked beautifully. Will order daily!",
        likes: 19,
        photos: [
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=crop&q=80&w=400",
        ],
        restaurantReply: commonReplies.manager,
      },
    ],
  };
  const defaultReviews = [
    {
      id: "def-1",
      userName: "Mariam Al-Mansoori",
      rating: 5,
      date: "Today",
      text: "The food was absolutely scrumptious! The delivery arrived 10 minutes earlier than estimated, and the hot items were piping hot. Best meal of the week.",
      likes: 14,
      isLocal: false,
      photos: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=500",
      ],
      restaurantReply: commonReplies.chef,
    },
    {
      id: "def-2",
      userName: "Hassan Syed",
      rating: 5,
      date: "3 days ago",
      text: "Superb quantity and quality of ingredients. The bestseller dishes are highly recommended. Extremely hygienic packaging!",
      likes: 9,
      isLocal: false,
      photos: [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=500",
      ],
      restaurantReply: null,
    },
    {
      id: "def-3",
      userName: "Oliver Bennett",
      rating: 4,
      date: "1 week ago",
      text: "Really good flavor profile, especially the signature dishes. A minor delay in delivery but they made up for it with extra promo codes.",
      likes: 4,
      isLocal: false,
      photos: [],
      restaurantReply: {
        text: "We appreciate your feedback! We are sharing this note with our delivery drivers to optimize routes. Glad you loved the signature tastes!",
        date: "6 days ago",
        author: "Restaurant Manager",
      },
    },
  ];
  return reviewsByRestaurant[restaurantId] || defaultReviews;
};

const MenuItemCard = React.memo(function MenuItemCard({
  item,
  quantityInCart,
  isOutOfStock,
  isFavorite,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavoriteDish,
  restaurantId,
  restaurantName,
}) {
  return (
    <div
      className={`flex gap-4 p-4 border border-gray-100 hover:border-orange-100/70 hover:bg-orange-50/10 rounded-2xl transition-all duration-300 ${isOutOfStock ? "grayscale opacity-75" : ""}`}
      id={`menu-item-${item.id || item._id}`}
    >
      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`h-4 w-4 border-2 flex items-center justify-center rounded-sm shrink-0 ${item.isVeg ? "border-emerald-500" : "border-rose-600"}`}
            title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? "bg-emerald-500" : "bg-rose-600"}`}
            />
          </div>

          {item.isBestseller && (
            <span className="bg-amber-50 text-amber-700 text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 uppercase tracking-wider border border-amber-100">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              <span>Bestseller</span>
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-800 text-base">{item.name}</h3>
        <span className="font-mono font-black text-gray-900 text-sm mt-0.5 block">
          ₹ {item.price}
        </span>
        <p className="text-gray-400 text-xs mt-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Image & Action container */}
      <div className="flex flex-col items-center shrink-0 self-center">
        {/* Image Div */}
        <div
          className="relative w-24 h-24 bg-neutral-50 rounded-2xl overflow-hidden"
          id={`dish-thumb-${item.id}`}
        >
          <img
            src={extractImageUrl(item.image)}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-2 justify-center w-full">
          <div className="w-[104px]">
            {isOutOfStock ? (
              <div className="w-full bg-neutral-100 text-neutral-400 border border-neutral-200 text-[11px] font-black py-1.5 rounded-lg shadow-xs text-center select-none uppercase tracking-wider">
                OUT OF STOCK
              </div>
            ) : quantityInCart > 0 ? (
              <div className="bg-white border border-brand-orange text-orange-700 flex items-center justify-between rounded-xl font-bold text-sm transition-all">
                <button
                  onClick={() => onRemoveFromCart(restaurantId, item.id || item._id)}
                  className="h-10 w-9 flex items-center justify-center hover:bg-orange-50 rounded-lg text-orange-700 font-bold transition cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-black text-gray-800">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onAddToCart(restaurantId, restaurantName, item)}
                  className="h-10 w-9 flex items-center justify-center hover:bg-orange-50 rounded-lg text-orange-700 font-bold transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(restaurantId, restaurantName, item)}
                className="cursor-pointer w-full bg-white text-orange-700 hover:bg-orange-50 active:bg-orange-100 border border-orange-200 text-sm font-bold h-10 px-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                Add
              </button>
            )}
          </div>

          {onToggleFavoriteDish && (
            <button
              onClick={() => onToggleFavoriteDish(item.id || item._id)}
              className="h-7 w-7 bg-white hover:bg-neutral-50 text-gray-700 border border-neutral-200 rounded-lg flex items-center justify-center transition-colors duration-150 shadow-sm active:scale-90 cursor-pointer shrink-0"
              title={isFavorite ? "Remove from favorites" : "Save to favorites"}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorite ? "text-rose-500 fill-rose-500" : "text-gray-400"
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
export default function RestaurantDetailModal({
  restaurant,
  cartItems,
  onClose,
  onAddToCart,
  onRemoveFromCart,
  favoriteDishes = [],
  onToggleFavoriteDish,
  onViewCart,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("menu");
  const [isScrolled, setIsScrolled] = useState(false);

  const handleGoToCart = () => {
    if (onViewCart) {
      onViewCart();
    } else {
      onClose();
      navigate("/cart");
    }
  };

  const handleScroll = (e) => {
    const scrolled = e.target.scrollTop > 60;
    setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
  };

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  React.useEffect(() => {
    const targetDishId = restaurant?.initialMenuItemId || restaurant?.initialDishId;
    if (targetDishId) {
      setActiveTab("menu");
      const timer = setTimeout(() => {
        const el = document.getElementById(`menu-item-${targetDishId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-brand-orange", "bg-orange-50/50");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-brand-orange", "bg-orange-50/50");
          }, 3000);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [restaurant?.initialMenuItemId, restaurant?.initialDishId]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [vegOnly, setVegOnly] = useState(false);
  const [bestsellersOnly, setBestsellersOnly] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState("all");
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewErrorMsg, setReviewErrorMsg] = useState(null);

  // Edit / Delete Review State
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewComment, setEditReviewComment] = useState("");
  const [editReviewSubmitting, setEditReviewSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState(null);
  const [editAttachedPhotos, setEditAttachedPhotos] = useState([]);

  // Unified attached photos state: array of { id, url, file }
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const reviewPhotos = React.useMemo(() => attachedPhotos.map((p) => p.url), [attachedPhotos]);
  const reviewImageFiles = React.useMemo(() => attachedPhotos.map((p) => p.file).filter(Boolean), [attachedPhotos]);

  const resId = restaurant?.id || restaurant?._id;

  const fetchReviews = React.useCallback(async () => {
    if (!resId) return;
    setLoadingReviews(true);
    setReviewErrorMsg(null);
    try {
      const data = await dinerService.getReviewsByRestaurant(resId);
      setReviewsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      const fallback = getInitialReviewsForRestaurant(resId);
      setReviewsList(fallback);
    } finally {
      setLoadingReviews(false);
    }
  }, [resId]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const isReviewOwner = React.useCallback((rev) => {
    if (!rev) return false;
    if (rev.isLocal) return true;

    try {
      let loggedUserId = null;
      let loggedUserName = null;
      let loggedUserEmail = null;

      const profileStr = localStorage.getItem("globaleats_profile_info");
      if (profileStr) {
        const p = JSON.parse(profileStr);
        loggedUserId = p?.id || p?._id || loggedUserId;
        loggedUserName = p?.name || p?.fullName || loggedUserName;
        if (p?.email) loggedUserEmail = String(p.email).toLowerCase();
      }

      const userStr = localStorage.getItem("globaleats_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        loggedUserId = u?.id || u?._id || loggedUserId;
        loggedUserName = u?.name || u?.fullName || loggedUserName;
        if (u?.email) loggedUserEmail = String(u.email).toLowerCase();
      }

      const token = localStorage.getItem("globaleats_token");
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const decoded = JSON.parse(atob(base64));
            if (decoded?.userId) loggedUserId = String(decoded.userId);
            if (decoded?.id) loggedUserId = String(decoded.id);
            if (decoded?._id) loggedUserId = String(decoded._id);
          }
        } catch (e) {
          // ignore
        }
      }

      if (!loggedUserId && !loggedUserEmail && !loggedUserName) {
        return false;
      }

      const customerObj = rev.customer || rev.user;
      const revUserId = typeof customerObj === "object" ? String(customerObj?._id || customerObj?.id || "") : String(customerObj || "");
      const revUserEmail = typeof customerObj === "object" && customerObj?.email ? String(customerObj.email).toLowerCase() : null;
      const revUserName = rev.userName || (typeof customerObj === "object" ? customerObj?.fullName || customerObj?.name : null);

      if (loggedUserId && revUserId && String(revUserId) === String(loggedUserId)) {
        return true;
      }
      if (loggedUserEmail && revUserEmail && revUserEmail === loggedUserEmail) {
        return true;
      }
      if (loggedUserName && revUserName && String(revUserName).trim().toLowerCase() === String(loggedUserName).trim().toLowerCase()) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }, []);

  const isUserLoggedIn = React.useMemo(() => {
    try {
      const isLoggedInFlag = localStorage.getItem("globaleats_is_logged_in");
      const token = localStorage.getItem("globaleats_token");
      const profile = localStorage.getItem("globaleats_profile_info");
      const user = localStorage.getItem("globaleats_user");

      return isLoggedInFlag === "true" || Boolean(token) || Boolean(profile) || Boolean(user);
    } catch (e) {
      return false;
    }
  }, []);

  const hasUserReviewed = React.useMemo(() => {
    if (!reviewsList || !reviewsList.length) return false;
    return reviewsList.some((rev) => isReviewOwner(rev));
  }, [reviewsList, isReviewOwner]);

  const canWriteReview = isUserLoggedIn && !hasUserReviewed;

  const FOOD_PHOTO_PRESETS = [
    {
      name: "Pizza 🍕",
      url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400",
    },
    {
      name: "Burger 🍔",
      url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
    },
    {
      name: "Pasta 🍝",
      url: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=400",
    },
    {
      name: "Sushi 🍣",
      url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400",
    },
    {
      name: "Cake 🍰",
      url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400",
    },
  ];

  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [dragActive, setDragActive] = useState(false);
  const [votedReviews, setVotedReviews] = useState([]);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const photosList = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1560684352-8497838a2229?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=500",
  ];
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const openingHours = "9:00 AM - 11:30 PM";
  const [offersList, setOffersList] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCoupon = (code) => {
    const copy = () => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    };
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(copy).catch(() => {
        // fallback
        const el = document.createElement("textarea");
        el.value = code;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        copy();
      });
    } else {
      const el = document.createElement("textarea");
      el.value = code;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      copy();
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    const fetchCoupons = async () => {
      setOffersLoading(true);
      try {
        const coupons = await dinerService.getActiveCoupons();
        if (!cancelled) setOffersList(Array.isArray(coupons) ? coupons : []);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
        if (!cancelled) setOffersList([]);
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    };
    fetchCoupons();
    return () => { cancelled = true; };
  }, []);

  const cartQuantityMap = React.useMemo(() => {
    const map = {};
    if (cartItems && cartItems.length) {
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const id = item?.menuItem?.id || item?.menuItem?._id;
        if (id != null) {
          map[id] = item.quantity;
          map[String(id)] = item.quantity;
        }
      }
    }
    return map;
  }, [cartItems]);

  const favoriteSet = React.useMemo(() => {
    const set = new Set();
    if (favoriteDishes && favoriteDishes.length) {
      for (let i = 0; i < favoriteDishes.length; i++) {
        const f = favoriteDishes[i];
        const id = typeof f === "object" ? f?.id || f?._id : f;
        if (id != null) set.add(String(id));
      }
    }
    return set;
  }, [favoriteDishes]);

  const [fetchedMenu, setFetchedMenu] = useState([]);

  React.useEffect(() => {
    let isMounted = true;
    const loadMenu = async () => {
      if (!resId) return;
      if (restaurant?.menu && Array.isArray(restaurant.menu) && restaurant.menu.length > 0) {
        setFetchedMenu(restaurant.menu);
        return;
      }
      try {
        const full = await dinerService.getRestaurantById(resId);
        if (isMounted && full?.menu && Array.isArray(full.menu) && full.menu.length > 0) {
          setFetchedMenu(full.menu);
          return;
        }
        const items = await dinerService.getMenuItems(null, { restaurant: resId });
        if (isMounted && Array.isArray(items) && items.length > 0) {
          setFetchedMenu(items);
        }
      } catch (err) {
        console.error("Failed to load restaurant menu:", err);
      }
    };
    loadMenu();
    return () => { isMounted = false; };
  }, [resId, restaurant?.menu]);

  const activeMenu = (restaurant?.menu && Array.isArray(restaurant.menu) && restaurant.menu.length > 0)
    ? restaurant.menu
    : fetchedMenu;

  const menuCategories = React.useMemo(() => {
    if (!activeMenu || !activeMenu.length) return ["all"];
    return [
      "all",
      ...Array.from(new Set(activeMenu.map((item) => item.category).filter(Boolean))),
    ];
  }, [activeMenu]);

  const filteredMenu = React.useMemo(() => {
    if (!activeMenu || !activeMenu.length) return [];
    const search = debouncedSearchTerm.toLowerCase();
    return activeMenu.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search));
      const matchesVeg = vegOnly ? item.isVeg : true;
      const matchesBestseller = bestsellersOnly ? item.isBestseller : true;
      const matchesCategory =
        activeMenuCategory === "all"
          ? true
          : item.category === activeMenuCategory;
      return matchesSearch && matchesVeg && matchesBestseller && matchesCategory;
    });
  }, [
    activeMenu,
    debouncedSearchTerm,
    vegOnly,
    bestsellersOnly,
    activeMenuCategory,
  ]);

  const totalCartCount = React.useMemo(
    () => cartItems.reduce((acc, curr) => acc + curr.quantity, 0),
    [cartItems]
  );
  const totalCartCost = React.useMemo(
    () =>
      cartItems.reduce(
        (acc, curr) => acc + curr.quantity * (curr.menuItem?.price || 0),
        0
      ),
    [cartItems]
  );

  const reviewsStats = React.useMemo(() => {
    if (!reviewsList || !reviewsList.length) {
      return { avg: "0.0", starRows: [], total: 0 };
    }
    const total = reviewsList.length;
    let sum = 0;
    const countMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let i = 0; i < total; i++) {
      const r = reviewsList[i];
      sum += r.rating;
      if (countMap[r.rating] !== undefined) countMap[r.rating]++;
    }
    const avg = (sum / total).toFixed(1);
    const starRows = [5, 4, 3, 2, 1].map((star) => {
      const count = countMap[star] || 0;
      const pct = Math.round((count / total) * 100);
      return { star, count, pct };
    });
    return { avg, starRows, total };
  }, [reviewsList]);
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };
  const processFiles = (files) => {
    if (attachedPhotos.length >= 3) {
      setReviewErrorMsg("Maximum 3 images allowed per review.");
      return;
    }
    const currentCount = attachedPhotos.length;
    const remainingSlots = 3 - currentCount;
    const validImages = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (validImages.length > remainingSlots) {
      setReviewErrorMsg("Maximum 3 images allowed per review.");
    }

    const imagesToProcess = validImages.slice(0, remainingSlots);
    imagesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedPhotos((prev) => {
            if (prev.length >= 3) return prev;
            return [
              ...prev,
              {
                id: `file-${Date.now()}-${Math.random()}`,
                url: event.target.result,
                file: file,
              },
            ];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };
  const handlePhotoUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };
  const removeReviewPhoto = (indexToRemove) => {
    setAttachedPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };
  const togglePresetPhoto = (url) => {
    setAttachedPhotos((prev) => {
      const exists = prev.some((p) => p.url === url);
      if (exists) {
        return prev.filter((p) => p.url !== url);
      } else {
        return [...prev, { id: `preset-${url}`, url: url, file: null }];
      }
    });
  };
  const handleHelpfulClick = (reviewId) => {
    if (votedReviews.includes(reviewId)) {
      setReviewsList((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId || rev._id === reviewId) {
            return { ...rev, likes: Math.max(0, rev.likes - 1) };
          }
          return rev;
        }),
      );
      setVotedReviews((prev) => prev.filter((id) => id !== reviewId));
    } else {
      setReviewsList((prev) =>
        prev.map((rev) => {
          if (rev.id === reviewId || rev._id === reviewId) {
            return { ...rev, likes: rev.likes + 1 };
          }
          return rev;
        }),
      );
      setVotedReviews((prev) => [...prev, reviewId]);
    }
  };

  // --- API HANDLERS ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    setReviewSubmitting(true);
    setReviewErrorMsg(null);

    const currentRating = newReviewRating;
    const currentComment = newReviewText.trim();
    let reviewerName = "Verified Diner";
    try {
      const storedUser = localStorage.getItem("globaleats_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        reviewerName = parsed?.fullName || parsed?.name || "Verified Diner";
      }
    } catch (e) {
      // ignore
    }

    try {
      const formData = new FormData();
      formData.append("restaurant", resId);
      formData.append("rating", String(currentRating));
      formData.append("comment", currentComment);

      reviewImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const resData = await dinerService.createReview({
        restaurant: resId,
        rating: currentRating,
        comment: currentComment,
        images: reviewImageFiles,
        photoUrls: reviewPhotos,
        userName: reviewerName,
      });

      const rawItem = resData?.data || (resData?.success ? resData : null);
      let newReviewItem = rawItem ? normalizeReview(rawItem) : null;

      if (!newReviewItem) {
        newReviewItem = {
          id: String(Date.now()),
          _id: String(Date.now()),
          userName: reviewerName,
          rating: currentRating,
          text: currentComment,
          comment: currentComment,
          photos: [...reviewPhotos],
          images: reviewPhotos,
          date: "Just Now",
          isLocal: true,
          likes: 0,
        };
      } else {
        newReviewItem.isLocal = true;
        if (!newReviewItem.photos || newReviewItem.photos.length === 0) {
          newReviewItem.photos = reviewPhotos.length > 0 ? [...reviewPhotos] : [];
        }
      }

      setReviewsList((prev) => [newReviewItem, ...prev]);
      setNewReviewText("");
      setNewReviewRating(5);
      setAttachedPhotos([]);
      setReviewSuccessMsg(true);
      setTimeout(() => setReviewSuccessMsg(false), 4000);
      await fetchReviews();
    } catch (err) {
      console.error("Failed to create review:", err);
      const msg = parseApiError(err, "Failed to post review. Please try again.");
      setReviewErrorMsg(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const processEditFiles = (files) => {
    if (editAttachedPhotos.length >= 3) {
      setReviewErrorMsg("Maximum 3 images allowed per review.");
      return;
    }
    const currentCount = editAttachedPhotos.length;
    const remainingSlots = 3 - currentCount;
    const validImages = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (validImages.length > remainingSlots) {
      setReviewErrorMsg("Maximum 3 images allowed per review.");
    }

    const imagesToProcess = validImages.slice(0, remainingSlots);
    imagesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAttachedPhotos((prev) => {
            if (prev.length >= 3) return prev;
            return [
              ...prev,
              {
                id: `edit-file-${Date.now()}-${Math.random()}`,
                url: event.target.result,
                file: file,
              },
            ];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEditPhoto = (indexToRemove) => {
    setEditAttachedPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id || rev._id);
    setEditReviewRating(rev.rating || 5);
    setEditReviewComment(rev.text || rev.comment || "");
    const photos = rev.photos && Array.isArray(rev.photos) ? rev.photos : [];
    setEditAttachedPhotos(
      photos.map((p, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        url: typeof p === "string" ? p : p?.url || p?.secure_url || "",
        file: null,
      })).filter((item) => Boolean(item.url))
    );
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditReviewRating(5);
    setEditReviewComment("");
    setEditAttachedPhotos([]);
  };

  const handleUpdateReview = async (reviewId) => {
    if (!editReviewComment.trim()) return;
    setEditReviewSubmitting(true);
    setReviewErrorMsg(null);

    try {
      const editFiles = editAttachedPhotos.map((p) => p.file).filter(Boolean);
      const editPhotoUrls = editAttachedPhotos.map((p) => p.url);

      await dinerService.updateReview(reviewId, {
        rating: editReviewRating,
        comment: editReviewComment.trim(),
        images: editFiles,
        photoUrls: editPhotoUrls,
      });

      setReviewsList((prev) =>
        prev.map((rev) => {
          if (String(rev.id) === String(reviewId) || String(rev._id) === String(reviewId)) {
            return {
              ...rev,
              rating: editReviewRating,
              text: editReviewComment.trim(),
              comment: editReviewComment.trim(),
              photos: editPhotoUrls,
            };
          }
          return rev;
        })
      );
      handleCancelEdit();
      await fetchReviews();
    } catch (err) {
      console.error("Failed to update review:", err);
      const msg = parseApiError(err, "Failed to update review.");
      setReviewErrorMsg(msg);
    } finally {
      setEditReviewSubmitting(false);
    }
  };

  const handleDeleteReview = (reviewId) => {
    setConfirmDeleteReviewId(reviewId);
  };

  const handleConfirmDeleteReview = async () => {
    if (!confirmDeleteReviewId) return;
    const reviewId = confirmDeleteReviewId;
    setDeletingReviewId(reviewId);
    setReviewErrorMsg(null);

    try {
      await dinerService.deleteReview(reviewId);
      setReviewsList((prev) =>
        prev.filter(
          (rev) => String(rev.id) !== String(reviewId) && String(rev._id) !== String(reviewId)
        )
      );
      setConfirmDeleteReviewId(null);
      await fetchReviews();
    } catch (err) {
      console.error("Failed to delete review:", err);
      const msg = parseApiError(err, "Failed to delete review.");
      setReviewErrorMsg(msg);
    } finally {
      setDeletingReviewId(null);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden animate-fade-in"
      id="restaurant-detail-page-overlay"
    >
      <div
        className="w-full h-full flex flex-col bg-white overflow-hidden"
        id="restaurant-detail-page-card"
      >
        {/* Full Page Header Bar */}
        <div className="h-14 px-4 sm:px-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-xs z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition flex items-center gap-1 font-bold text-xs cursor-pointer"
              aria-label="Back to home"
            >
              <X className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <h2 className="font-display font-black text-base sm:text-lg text-gray-900 truncate">
              {restaurant.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-orange-50 text-orange-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 border border-orange-200/60 shadow-2xs">
              <ShoppingBag className="h-3.5 w-3.5 text-orange-700" />
              <span>{totalCartCount} Cart Items (₹{totalCartCost.toFixed(2)})</span>
            </span>
          </div>
        </div>

        {/* Split Screen 2-Column Layout */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* LEFT COLUMN: Restaurant Banner, Details, Quick Stats, Offers/Coupons & Reviews */}
          <div className="w-full md:w-5/12 lg:w-4/12 border-r border-gray-100 flex flex-col md:overflow-y-auto bg-gray-50/30 scrollbar-thin shrink-0 md:shrink [&>*]:shrink-0">
            {/* Restaurant Banner Image */}
            <div className="relative h-48 sm:h-56 bg-neutral-100 shrink-0">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="bg-brand-orange text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block mb-1 shadow-sm">
                  {restaurant.discount || "SPECIAL PROMO"}
                </span>
                <h1 className="font-display font-black text-xl sm:text-2xl leading-tight">
                  {restaurant.name}
                </h1>
                <p className="text-gray-200 text-xs font-semibold mt-0.5 truncate">
                  {(restaurant.cuisines || []).join(", ")}
                </p>
              </div>
            </div>

            {/* Quick Metadata Bar */}
            <div className="p-4 bg-white border-b border-gray-100 space-y-2.5 text-xs text-gray-600 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-orange-700 bg-orange-50 border border-orange-200/60 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs">
                    <ShoppingBag className="h-3.5 w-3.5 text-orange-700" />
                    <span>{totalCartCount} Items in Cart</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                  <span>OPEN NOW</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[11px]">
                <span className="flex items-center gap-1 text-gray-500 font-semibold">
                  <Clock className="h-3.5 w-3.5 text-orange-700" />
                  {restaurant.deliveryTime}
                </span>
                <span className="text-gray-400 font-medium">📍 {restaurant.address || "Downtown, Dubai"}</span>
              </div>
            </div>

            {/* Coupons & Offers Section */}
            <div className="p-4 bg-white border-b border-gray-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-wider">
                <Ticket className="h-4 w-4 text-orange-700" />
                <span>Available Offers &amp; Coupons</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {offersLoading ? (
                  <div className="text-xs text-gray-400">Loading coupons...</div>
                ) : offersList.length === 0 ? (
                  <div className="text-xs text-gray-400 font-medium py-1">No coupons available right now</div>
                ) : (
                  offersList.map((coupon) => {
                    let subtitle = coupon.title || "";
                    if (coupon.discountType === "percentage" && coupon.discountValue) {
                      subtitle = `${coupon.discountValue}% OFF`;
                    } else if (coupon.discountType === "flat" && coupon.discountValue) {
                      subtitle = `FLAT ₹${coupon.discountValue} OFF`;
                    }
                    const isCopied = copiedCode === coupon.code;
                    return (
                      <div
                        key={coupon.id || coupon.code}
                        onClick={() => handleCopyCoupon(coupon.code)}
                        className={`cursor-pointer select-none bg-gradient-to-br from-amber-50 to-orange-50/50 border rounded-xl p-2.5 min-w-[180px] shrink-0 flex flex-col justify-between transition-all ${
                          isCopied ? "border-emerald-400 ring-2 ring-emerald-100" : "border-orange-100 hover:border-orange-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-[11px] text-orange-700">{subtitle}</span>
                            <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-white border border-orange-200 text-orange-700">
                              {isCopied ? "✓ COPIED" : coupon.code}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Your Cart Items Panel (Replaced Customer Ratings) */}
            <div className="p-4 space-y-3 bg-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-xs uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-orange-700" />
                  <span>Your Cart Items</span>
                  <span className="bg-brand-orange text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                    {totalCartCount}
                  </span>
                </h3>
                {totalCartCount > 0 && (
                  <span className="text-xs font-black text-orange-700">
                    ₹{totalCartCost.toFixed(2)}
                  </span>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="p-4 bg-orange-50/50 border border-dashed border-orange-200/70 rounded-2xl text-center space-y-1">
                  <div className="text-xl">🛒</div>
                  <p className="text-xs font-bold text-gray-700">Your cart is empty</p>
                  <p className="text-[11px] text-gray-400">Select dishes from the menu to add to your order</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                  {cartItems.map((cartItem, idx) => {
                    const dish = cartItem.menuItem || cartItem;
                    return (
                      <div
                        key={dish.id || dish._id || idx}
                        className="p-2.5 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="h-2 w-2 rounded-full shrink-0 bg-emerald-500" />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {dish.name}
                            </h4>
                            <p className="text-[11px] text-gray-400 font-medium">
                              ₹{dish.price} x {cartItem.quantity}
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(dish.id || dish._id)}
                            className="h-5 w-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded flex items-center justify-center text-xs transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-black px-1 text-gray-900">
                            {cartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddToCart(dish, resId, restaurant.name)}
                            className="h-5 w-5 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded flex items-center justify-center text-xs transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Full Menu & Interactive Cart */}
          <div className="w-full md:w-7/12 lg:w-8/12 flex flex-col md:h-full bg-white md:overflow-hidden">
            {/* Search & Category Filter Header */}
            <div className="p-4 border-b border-gray-100 space-y-3 bg-white shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <input
                    type="text"
                    placeholder="Search in menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-700 outline-none focus:bg-white focus:border-orange-300 transition"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                      vegOnly ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-600 border-gray-100"
                    }`}
                  >
                    🌱 Veg Only
                  </button>
                  <button
                    onClick={() => setBestsellersOnly(!bestsellersOnly)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                      bestsellersOnly ? "bg-amber-500 text-white border-amber-500" : "bg-gray-50 text-gray-600 border-gray-100"
                    }`}
                  >
                    ⭐ Bestsellers
                  </button>
                </div>
              </div>

              {/* Subcategories Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {menuCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveMenuCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition capitalize shrink-0 cursor-pointer ${
                      activeMenuCategory === cat ? "bg-brand-orange text-white shadow-xs font-black" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat === "all" ? "All Items" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 md:overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {filteredMenu.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs font-semibold">
                  No matching dishes found in menu.
                </div>
              ) : (
                filteredMenu.map((item) => {
                  const qty = cartQuantityMap[item.id] || cartQuantityMap[item._id] || 0;
                  const isFav = favoriteSet.has(String(item.id || item._id));
                  return (
                    <MenuItemCard
                      key={item.id || item._id}
                      item={item}
                      quantityInCart={qty}
                      isOutOfStock={item.isAvailable === false}
                      isFavorite={isFav}
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                      onToggleFavoriteDish={onToggleFavoriteDish}
                      restaurantId={resId}
                      restaurantName={restaurant.name}
                    />
                  );
                })
              )}
            </div>

            {/* Sticky Bottom Cart Bar */}
            {totalCartCount > 0 && (
              <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0 shadow-lg z-20">
                <button
                  onClick={handleGoToCart}
                  className="w-full bg-[#60B246] hover:bg-[#529e3a] active:scale-[0.99] text-white px-5 py-3.5 rounded-2xl shadow-md transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                      {totalCartCount} {totalCartCount === 1 ? "ITEM" : "ITEMS"}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold">
                      Total: <span className="font-black text-base text-white">₹{totalCartCost.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm uppercase">
                    <span>View Cart</span>
                    <span>➔</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox photo viewer */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-55 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged food screenshot"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl animate-fade-in"
            />
          </div>
        )}

        {/* Custom Delete Confirmation Popup Modal */}
        {confirmDeleteReviewId && (
          <div
            className="fixed inset-0 z-55 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setConfirmDeleteReviewId(null)}
          >
            <div
              className="bg-white rounded-3xl p-6 max-w-xs sm:max-w-sm w-full shadow-2xl space-y-4 text-center border border-gray-100 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Trash2 className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-900">
                  Delete Review?
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteReviewId(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteReview}
                  disabled={deletingReviewId === confirmDeleteReviewId}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deletingReviewId === confirmDeleteReviewId ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

