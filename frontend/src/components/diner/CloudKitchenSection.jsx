import { useState, useEffect, useMemo } from "react";
import { dinerService } from "../../api/dinerService";
import {
  Flame,
  Pizza as PizzaIcon,
  Soup,
  Star,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Check,
  ChefHat,
  Utensils,
  Award,
  AlertTriangle
} from "lucide-react";
export const ICON_MAP = {
  Flame,
  Pizza: PizzaIcon,
  Soup,
  ChefHat,
  Utensils,
  Award
};

export const PALETTE_MAP = {
  Flame: {
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    button: "bg-amber-600 hover:bg-amber-700",
    gradient: "from-amber-600 to-yellow-500",
    glow: "shadow-amber-500/10",
    ring: "ring-amber-500",
  },
  Pizza: {
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    button: "bg-rose-600 hover:bg-rose-700",
    gradient: "from-rose-600 to-orange-500",
    glow: "shadow-rose-500/10",
    ring: "ring-rose-500",
  },
  Soup: {
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    button: "bg-emerald-600 hover:bg-emerald-700",
    gradient: "from-emerald-600 to-teal-500",
    glow: "shadow-emerald-500/10",
    ring: "ring-emerald-500",
  },
  ChefHat: {
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    button: "bg-orange-600 hover:bg-orange-700",
    gradient: "from-orange-600 to-amber-500",
    glow: "shadow-orange-500/10",
    ring: "ring-orange-500",
  },
  Utensils: {
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    button: "bg-blue-600 hover:bg-blue-700",
    gradient: "from-blue-600 to-indigo-500",
    glow: "shadow-blue-500/10",
    ring: "ring-blue-500",
  },
  Award: {
    text: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    button: "bg-purple-600 hover:bg-purple-700",
    gradient: "from-purple-600 to-pink-500",
    glow: "shadow-purple-500/10",
    ring: "ring-purple-500",
  },
};

export const normalizeBrand = (brand) => {
  if (!brand) return null;

  const rawIcon = String(brand.icon || brand.iconName || "utensils").toLowerCase();
  const iconName = rawIcon.charAt(0).toUpperCase() + rawIcon.slice(1);
  const themeColor = (brand.themeColor && typeof brand.themeColor === "object" && brand.themeColor.gradient)
    ? brand.themeColor
    : (PALETTE_MAP[iconName] || PALETTE_MAP.Utensils);

  const categoryName = typeof brand.category === "object" && brand.category?.name
    ? brand.category.name
    : (typeof brand.category === "string" ? brand.category : "Gourmet");

  const restaurantsList = Array.isArray(brand.restaurants) ? brand.restaurants : [];
  const primaryRestaurant = restaurantsList.length > 0 && typeof restaurantsList[0] === "object"
    ? restaurantsList[0]
    : null;

  return {
    ...brand,
    id: String(brand._id || brand.id || `brand-${Math.random()}`),
    _id: String(brand._id || brand.id || ""),
    name: brand.name || "Virtual Brand",
    slogan: brand.tagline || brand.slogan || "Gourmet Kitchen Concept",
    tagline: brand.tagline || brand.slogan || "Gourmet Kitchen Concept",
    description: brand.description || "Artisanal culinary concept.",
    category: brand.category,
    categoryName: categoryName,
    rating: Number(brand.averageRating !== undefined ? brand.averageRating : (brand.rating || 4.8)),
    reviewsCount: Number(brand.totalReviews !== undefined ? brand.totalReviews : (brand.reviewsCount || 0)),
    prepTime: brand.averagePrepTime || brand.prepTime || "20 mins",
    averagePrepTime: brand.averagePrepTime || brand.prepTime || "20 mins",
    deliveryFee: brand.deliveryFee !== undefined ? (brand.deliveryFee === 0 ? "Free" : `₹${brand.deliveryFee}`) : (brand.isFreeDelivery ? "Free" : "₹40"),
    isFreeDelivery: brand.isFreeDelivery !== undefined ? Boolean(brand.isFreeDelivery) : true,
    promoBadgeText: brand.promoBadgeText || "50% OFF",
    iconName: iconName,
    icon: rawIcon,
    themeColor: themeColor,
    bannerImage: brand.coverImage || brand.bannerImage || brand.logo || brand.image?.url || (typeof brand.image === "string" ? brand.image : "") || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    coverImage: brand.coverImage || brand.bannerImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    keyNotes: Array.isArray(brand.features) && brand.features.length > 0 ? brand.features : (Array.isArray(brand.keyNotes) ? brand.keyNotes : [categoryName, "100% Hygiene Certified", "Express Delivery"]),
    status: brand.isActive !== undefined ? (brand.isActive ? "Active" : "Disabled") : (brand.status || "Active"),
    isActive: brand.isActive !== undefined ? Boolean(brand.isActive) : true,
    isVisible: brand.isVisibleOnHome !== undefined ? Boolean(brand.isVisibleOnHome) : (brand.isVisible !== undefined ? Boolean(brand.isVisible) : true),
    isVisibleOnHome: brand.isVisibleOnHome !== undefined ? Boolean(brand.isVisibleOnHome) : true,
    restaurants: restaurantsList,
    primaryRestaurant: primaryRestaurant,
    specialties: Array.isArray(brand.specialties) ? brand.specialties : (Array.isArray(brand.items) ? brand.items : []),
  };
};
export const INITIAL_BRANDS = [
  {
    id: "globaleats-biryani",
    name: "QuikaBite Biryani",
    slogan: "Claypot Saffron Masterpieces",
    description: "Fragrant, slow-dum claypot biryanis made using age-old royal recipes, premium basmati rice, and pure organic saffron.",
    rating: 4.9,
    reviewsCount: 340,
    prepTime: "20 mins",
    deliveryFee: "Free",
    iconName: "Flame",
    themeColor: {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      button: "bg-amber-600 hover:bg-amber-700",
      gradient: "from-amber-600 to-yellow-500",
      glow: "shadow-amber-500/10",
      ring: "ring-amber-500"
    },
    bannerImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    keyNotes: ["Claypot Slow Dum", "Aged Basmati Rice", "Pure Iranian Saffron"],
    status: "Active",
    isVisible: true,
    specialties: [
      {
        id: "cb-biryani-1",
        name: "Zaffron Chicken Dum Biryani",
        price: 42,
        description: "Saffron-scented aged basmati rice layered with juicy marinated chicken, slow-cooked in sealed claypots with secret spices.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400",
        isVeg: false,
        isBestseller: true,
        category: "Biryani"
      },
      {
        id: "cb-biryani-2",
        name: "Paneer Makhani Claypot Biryani",
        price: 38,
        description: "Melt-in-your-mouth spiced paneer cubes layered with aromatic basmati rice, mint leaves, and a splash of saffron-infused milk.",
        image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=400",
        isVeg: true,
        isBestseller: true,
        category: "Biryani"
      },
      {
        id: "cb-biryani-3",
        name: "Nawabi Mutton Shahi Biryani",
        price: 52,
        description: "Tender, slow-braised lamb chunks layered with rich spiced basmati rice, caramelized onions, and fried cashew nuts.",
        image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=400",
        isVeg: false,
        isBestseller: false,
        category: "Biryani"
      }
    ]
  },
  {
    id: "globaleats-pizza",
    name: "QuickaBite Pizza",
    slogan: "Artisanal Wood-Fired Sourdough",
    description: "Neapolitan-style sourdough crust fermented for 48 hours, topped with house marinara, premium fior di latte, and fresh local toppings.",
    rating: 4.8,
    reviewsCount: 280,
    prepTime: "15 mins",
    deliveryFee: "Free",
    iconName: "Pizza",
    themeColor: {
      text: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      button: "bg-rose-600 hover:bg-rose-700",
      gradient: "from-rose-600 to-orange-500",
      glow: "shadow-rose-500/10",
      ring: "ring-rose-500"
    },
    bannerImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    keyNotes: ["48h Cold Ferment", "San Marzano Marinara", "Fior di Latte Mozzarella"],
    status: "Active",
    isVisible: true,
    specialties: [
      {
        id: "cb-pizza-1",
        name: "Artisanal Burrata & Pesto Pizza",
        price: 49,
        description: "Wood-fired sourdough crust topped with fresh burrata ball, basil pesto, cherry tomatoes, and aged balsamic glaze drop.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400",
        isVeg: true,
        isBestseller: true,
        category: "Pizza"
      },
      {
        id: "cb-pizza-2",
        name: "Spiced Tandoori Chicken Sourdough Pizza",
        price: 44,
        description: "Juicy shredded tandoori chicken, pickled red onions, cilantro, and mint-yogurt drizzle on fresh mozzarella bed.",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400",
        isVeg: false,
        isBestseller: true,
        category: "Pizza"
      },
      {
        id: "cb-pizza-3",
        name: "Double Truffle Wild Mushroom Pizza",
        price: 48,
        description: "White sauce base, sautéed porcini & button mushrooms, fontina cheese, fresh rosemary, drizzled with premium black truffle oil.",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400",
        isVeg: true,
        isBestseller: false,
        category: "Pizza"
      }
    ]
  },
  {
    id: "globaleats-wok",
    name: "QuickaBite Wok",
    slogan: "Sizzling Sichuan & Asian Bowls",
    description: "High-heat wok-fired noodles, rice, and dim sums loaded with robust Sichuan peppers, house chilis, and authentic Asian sauces.",
    rating: 4.7,
    reviewsCount: 190,
    prepTime: "12 mins",
    deliveryFee: "Free",
    iconName: "Soup",
    themeColor: {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      button: "bg-red-600 hover:bg-red-700",
      gradient: "from-red-600 to-rose-500",
      glow: "shadow-red-500/10",
      ring: "ring-red-500"
    },
    bannerImage: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800",
    keyNotes: ["Fiery Wok Hei", "House Sichuan Chili Oil", "Handmade Dim Sums"],
    status: "Active",
    isVisible: true,
    specialties: [
      {
        id: "cb-wok-1",
        name: "Schezwan Chili Garlic Wok Noodles",
        price: 36,
        description: "Thick wheat noodles tossed in high-heat woks with crunchy spring greens, burnt garlic, and our signature fiery Schezwan paste.",
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400",
        isVeg: true,
        isBestseller: true,
        category: "Wok"
      },
      {
        id: "cb-wok-2",
        name: "Crispy Lotus Root in Honey Chili",
        price: 32,
        description: "Thinly sliced lotus root wheels quick-fried to golden crisp, tossed in a sweet-spicy honey-chili glaze with white sesame seeds.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
        isVeg: true,
        isBestseller: true,
        category: "Wok"
      },
      {
        id: "cb-wok-3",
        name: "Steamed Crystal Shrimp Har Gow (6 pcs)",
        price: 39,
        description: "Translucent dumpling skins hand-wrapped with juicy seasoned shrimp filling, steamed in bamboo baskets, served with ginger soy.",
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=400",
        isVeg: false,
        isBestseller: false,
        category: "Wok"
      }
    ]
  }
];
export default function CloudKitchenSection({
  cartItems,
  onAddToCart,
  onRemoveFromCart
}) {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBrandId, setActiveBrandId] = useState("globaleats-biryani");
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const saved = await dinerService.getBrands();
        const rawList = Array.isArray(saved) ? saved : (saved?.brands || saved?.data || []);
        if (rawList && rawList.length > 0) {
          setBrands(rawList.map(normalizeBrand).filter(Boolean));
        } else {
          setBrands(INITIAL_BRANDS.map(normalizeBrand));
        }
      } catch (err) {
        console.error("Failed to fetch brands in CloudKitchenSection:", err);
        setBrands(INITIAL_BRANDS.map(normalizeBrand));
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrands();
  }, []);
  const visibleBrands = useMemo(() => {
    return brands.filter((b) => b.isVisible && b.status === "Active");
  }, [brands]);
  useEffect(() => {
    if (visibleBrands.length > 0 && !visibleBrands.some((b) => b.id === activeBrandId)) {
      setActiveBrandId(visibleBrands[0].id);
    }
  }, [visibleBrands, activeBrandId]);

  if (isLoading) {
    return (
      <div className="bg-white/50 border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-premium animate-pulse space-y-6" id="cloud-kitchen-loading">
        {/* Title and subtitle skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-neutral-200 rounded-full w-48" />
          <div className="h-3 bg-neutral-200 rounded-full w-80" />
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-2 border-b border-gray-150 pb-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-neutral-200 rounded-full shrink-0" />
          ))}
        </div>
        {/* Banner skeleton */}
        <div className="h-48 bg-neutral-200 rounded-2xl w-full" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-150 rounded-2xl p-4 space-y-3">
              <div className="h-36 bg-neutral-200 rounded-xl w-full" />
              <div className="h-4 bg-neutral-200 rounded-full w-2/3" />
              <div className="h-3 bg-neutral-200 rounded-full w-full" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-neutral-200 rounded-full w-12" />
                <div className="h-8 bg-neutral-200 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visibleBrands.length === 0) {
    return <div className="bg-white/50 border border-orange-100 rounded-3xl p-8 shadow-premium text-center flex flex-col items-center justify-center space-y-4">
      <AlertTriangle className="h-10 w-10 text-amber-500 animate-bounce" />
      <h3 className="font-display font-black text-lg text-gray-900">Cloud Kitchens Temporarily Offline</h3>
      <p className="text-sm text-gray-500 max-w-md">Our culinary labs are undergoing scheduled maintenance. Please check our restaurant section below for local partner outlets!</p>
    </div>;
  }
  const activeBrand = visibleBrands.find((b) => b.id === activeBrandId) || visibleBrands[0];
  const BrandIcon = ICON_MAP[activeBrand.iconName] || Utensils;
  const getItemQuantity = (itemId) => {
    const item = cartItems.find((i) => i.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };
  return <div className="bg-white/50 border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-premium relative overflow-hidden" id="multi-brand-cloud-kitchen-container">
    {
      /* Visual background details */
    }
    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-40 -mr-20 -mt-20 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-40 -ml-20 -mb-20 pointer-events-none" />

    {
      /* Section Header */
    }
    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <span className="text-orange-700 font-extrabold text-xs tracking-wider uppercase bg-orange-100/60 border border-brand-orange/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2 shadow-xs">
          <Sparkles className="h-3 w-3 animate-spin text-orange-700" />
          <span>Quickaa Bite signature kitchens</span>
        </span>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">
          Multi-Brand Cloud Kitchens
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Indulge in specialized, chef-led culinary brands crafted in one premium, hygienic smart facility.
        </p>
      </div>

      {
        /* Brand Switcher Pills */
      }
      <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200/40 shrink-0 self-start md:self-center">
        {visibleBrands.map((brand) => {
          const IsActive = brand.id === activeBrandId;
          const IconComponent = ICON_MAP[brand.iconName] || Utensils;
          return <button
            key={brand.id}
            onClick={() => setActiveBrandId(brand.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-300 focus:outline-none ${IsActive ? `bg-white ${brand.themeColor.text} shadow-sm border border-gray-200/50 scale-102` : "text-gray-500 hover:text-gray-800 hover:bg-white/50"}`}
            id={`brand-tab-${brand.id}`}
          >
            <IconComponent className={`h-4 w-4 ${IsActive ? brand.themeColor.text : "text-gray-400"}`} />
            <span>{brand.name.replace("QuikaBite ", "")}</span>
          </button>;
        })}
      </div>
    </div>

    {
      /* Main Grid View */
    }
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-4">

      {
        /* LEFT COLUMN: BRAND HERO SHOWCASE CARD */
      }
      <div
        className="lg:col-span-4 rounded-premium overflow-hidden border border-gray-100 bg-white shadow-soft flex flex-col justify-between relative group"
        id={`brand-hero-card-${activeBrand.id}`}
      >
        {
          /* Decorative colored glow on top */
        }
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${activeBrand.themeColor.gradient}`} />

        <div className="p-6">
          {
            /* Header Badge & Brand Info */
          }
          <div className="flex items-center justify-between mt-2">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${activeBrand.themeColor.gradient} shadow-md ${activeBrand.themeColor.glow}`}>
              <BrandIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-black border border-amber-100">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
              <span>{activeBrand.rating}</span>
              <span className="text-[11px] text-amber-500 font-medium">({activeBrand.reviewsCount})</span>
            </div>
          </div>

          <h3 className="font-display font-extrabold text-xl text-gray-900 tracking-tight mt-5">
            {activeBrand.name}
          </h3>

          <p className={`text-xs font-extrabold uppercase tracking-wider ${activeBrand.themeColor.text} mt-1`}>
            {activeBrand.slogan}
          </p>

          <p className="text-xs text-gray-500 leading-relaxed mt-3.5">
            {activeBrand.description}
          </p>

          {
            /* Quick specifications / features list */
          }
          <div className="space-y-2 mt-5 border-t border-gray-50 pt-4">
            {activeBrand.keyNotes.map((note, index) => <div key={index} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <Check className={`h-4 w-4 ${activeBrand.themeColor.text} shrink-0`} />
              <span>{note}</span>
            </div>)}
          </div>
        </div>

        {
          /* Quick Stats banner with brand primary theme background */
        }
        <div className={`m-4 p-4 rounded-2xl bg-gradient-to-br ${activeBrand.themeColor.gradient} text-white flex justify-between items-center shadow-sm`}>
          <div className="flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-white/90" />
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-white/70 font-black">Preps In</span>
              <span className="text-xs font-extrabold">{activeBrand.prepTime}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/20" />

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-white/90" />
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-white/70 font-black">Delivery</span>
              <span className="text-xs font-extrabold">{activeBrand.deliveryFee} Fee</span>
            </div>
          </div>
        </div>

      </div>

      {
        /* RIGHT COLUMN: BRAND SPECIALTIES LISTING */
      }
      <div className="lg:col-span-8 flex flex-col justify-between gap-4" id={`brand-specialties-${activeBrand.id}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full items-stretch">
          {(Array.isArray(activeBrand.specialties) ? activeBrand.specialties : []).map((specialty) => {
            const quantity = getItemQuantity(specialty.id);
            return <div
              key={specialty.id}
              className="bg-white border border-gray-100 rounded-premium p-4 flex flex-col justify-between shadow-soft hover:shadow-md transition duration-300 relative group/item"
              id={`kitchen-item-${specialty.id}`}
            >
              {
                /* Bestseller ribbon if present */
              }
              {specialty.isBestseller && <span className="absolute top-3 left-3 bg-red-500 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md z-10 uppercase tracking-wider shadow-xs">
                Bestseller
              </span>}

              <div className="space-y-3">
                {
                  /* Specialty Image with zoom */
                }
                <div className="relative w-full h-[120px] rounded-xl overflow-hidden bg-gray-50">
                  <img
                    referrerPolicy="no-referrer"
                    src={specialty.image}
                    alt={specialty.name}
                    className="w-full h-full object-cover transform group-hover/item:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                  {
                    /* Dietary Tag Marker */
                  }
                  <span className={`absolute bottom-2 right-2 px-2 py-0.5 text-[11px] font-black tracking-wider rounded-md text-white flex items-center gap-1 shadow-sm ${specialty.isVeg ? "bg-emerald-600" : "bg-red-600"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {specialty.isVeg ? "VEG" : "NON-VEG"}
                  </span>
                </div>

                {
                  /* Dish Info */
                }
                <div className="space-y-1">
                  <h4 className="font-display font-extrabold text-xs sm:text-sm text-gray-900 group-hover/item:text-orange-700 transition line-clamp-1">
                    {specialty.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed min-h-[32px]">
                    {specialty.description}
                  </p>
                </div>
              </div>

              {
                /* Pricing and Quick Actions */
              }
              <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-4">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Price</span>
                  <span className="text-sm font-black text-gray-800">₹ {specialty.price}</span>
                </div>

                {
                  /* Quantity Selector / Add Button */
                }
                <div className="flex items-center">
                  {quantity > 0 ? <div className="flex items-center bg-gray-100 rounded-xl border border-gray-200/60 p-1 gap-1.5 animate-fade-in shadow-inner">
                    <button
                      onClick={() => onRemoveFromCart(activeBrand.id, specialty.id)}
                      className="h-7 w-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:text-red-500 text-gray-600 transition shadow-xs focus:outline-none"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <span className="text-xs font-black text-gray-800 px-1.5 min-w-[14px] text-center">
                      {quantity}
                    </span>

                    <button
                      onClick={() => onAddToCart(activeBrand.id, activeBrand.name, specialty)}
                      className="h-7 w-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 text-gray-600 hover:text-orange-700 transition shadow-xs focus:outline-none"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div> : (specialty.isAvailable === false || specialty.availability === false) ? (
                    <span className="bg-neutral-100 text-neutral-400 border border-neutral-200 text-[11px] font-black px-3.5 py-2 rounded-xl select-none uppercase tracking-wider text-center w-full block">
                      OUT OF STOCK
                    </span>
                  ) : (
                    <button
                      onClick={() => onAddToCart(activeBrand.id, activeBrand.name, specialty)}
                      className={`flex items-center justify-center gap-1 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition duration-300 shadow-sm shadow-black/5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${activeBrand.themeColor.button} ${activeBrand.themeColor.ring}`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>

            </div>;
          })}
        </div>

        {
          /* Slogan banner at bottom */
        }
        <div className="bg-gray-50 border border-gray-200/30 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hygienic smart packaging • Temperature controlled delivery vehicles</span>
          </span>
          <span className="hidden sm:inline text-orange-700 font-bold hover:underline cursor-pointer">Learn More</span>
        </div>
      </div>

    </div>
  </div>;
}
