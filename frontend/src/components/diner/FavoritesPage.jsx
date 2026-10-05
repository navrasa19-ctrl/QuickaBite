import { useState } from "react";
import {
  Heart,
  Trash2,
  Plus,
  Star,
  Clock,
  Compass,
  Utensils,
  Sparkles,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { RESTAURANTS } from "../../data";
import { useFavorites } from "../../context/FavoritesContext";
import { extractImageUrl } from "../../api/dinerService";

export default function FavoritesPage({
  favorites: propsFavorites,
  setFavorites: propsSetFavorites,
  favoriteDishes: propsFavoriteDishes,
  setFavoriteDishes: propsSetFavoriteDishes,
  restaurants: propsRestaurants,
  onAddToCart,
  setSelectedRestaurant,
  setActiveTab,
  triggerToast,
}) {
  const contextFavs = useFavorites();
  const favorites = propsFavorites !== undefined ? propsFavorites : contextFavs.favorites;
  const favoriteDishes = propsFavoriteDishes !== undefined ? propsFavoriteDishes : contextFavs.favoriteDishes;

  const [activeSubTab, setActiveSubTab] = useState("restaurants");

  const sourceRestaurants = propsRestaurants || [];
  
  const isRestaurantFav = (r) => {
    if (!r || !favorites) return false;
    const rId = String(r.id || r._id || "");
    const rId2 = String(r._id || r.id || "");
    return favorites.some((f) => {
      const fId = typeof f === "object" ? String(f._id || f.id || f.restaurant || "") : String(f);
      return fId === rId || fId === rId2;
    });
  };

  const isDishFav = (dish) => {
    if (!dish || !favoriteDishes) return false;
    const dId = String(dish.id || dish._id || "");
    const dId2 = String(dish._id || dish.id || "");
    return favoriteDishes.some((f) => {
      const fId = typeof f === "object" ? String(f._id || f.id || f.menu || "") : String(f);
      return fId === dId || fId === dId2;
    });
  };

  const savedRestaurants = sourceRestaurants.filter(isRestaurantFav);
  const savedDishes = sourceRestaurants.flatMap((restaurant) =>
    (restaurant.menu || []).map((item) => ({
      ...item,
      restaurantId: restaurant.id || restaurant._id,
      restaurantName: restaurant.name,
      restaurantRating: restaurant.rating,
      deliveryTime: restaurant.deliveryTime,
    })),
  ).filter(isDishFav);

  const handleRemoveRestaurant = (id, name) => {
    if (contextFavs.removeFavoriteRestaurant) {
      contextFavs.removeFavoriteRestaurant(id);
    } else if (propsSetFavorites) {
      propsSetFavorites((prev) => prev.filter((item) => item !== id));
    }
    if (triggerToast) triggerToast(`Removed ${name} from your favorites`);
  };

  const handleRemoveDish = (id, name) => {
    if (contextFavs.removeFavoriteMenu) {
      contextFavs.removeFavoriteMenu(id);
    } else if (propsSetFavoriteDishes) {
      propsSetFavoriteDishes((prev) => prev.filter((item) => item !== id));
    }
    if (triggerToast) triggerToast(`Removed ${name} from saved dishes`);
  };
  const handleQuickReorder = (dish) => {
    const menuItem = {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      description: dish.description,
      image: dish.image,
      isVeg: dish.isVeg,
      category: dish.category,
      isBestseller: dish.isBestseller,
    };
    onAddToCart(dish.restaurantId, dish.restaurantName, menuItem);
  };
  const handleViewRestaurant = (resId) => {
    const res = (sourceRestaurants || []).find((r) => String(r.id || r._id) === String(resId));
    if (res) {
      setSelectedRestaurant(res);
      triggerToast(`Opened ${res.name} detailed gourmet menu!`);
    }
  };
  return (
    <div
      className="max-w-[1400px] mx-auto py-1 animate-fade-in"
      id="favorites-page-main"
    >
      {/* Decorative top title section */}
      <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
        <div className="inline-flex bg-rose-50 p-3 rounded-full border border-rose-100/50 text-rose-500 animate-pulse">
          <Heart className="h-6 w-6 fill-current" />
        </div>
        <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight">
          Your Saved Favorites
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Access your personalized gourmet lounge. Instantly order your favorite
          comfort dishes or visit your preferred local kitchens in one single
          click.
        </p>
      </div>

      {/* Subtab Segmented Switch Controls */}
      <div className="flex justify-center mb-8">
        <div className="bg-white border border-gray-150 p-1 rounded-2xl flex items-center shadow-xs">
          <button
            onClick={() => setActiveSubTab("restaurants")}
            className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition duration-200 ${activeSubTab === "restaurants" ? "bg-brand-orange text-white shadow-md scale-102 font-black" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Utensils className="h-4 w-4" />
            <span>Saved Restaurants</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${activeSubTab === "restaurants" ? "bg-white text-orange-700" : "bg-gray-100 text-gray-600"}`}
            >
              {savedRestaurants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("dishes")}
            className={`cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition duration-200 ${activeSubTab === "dishes" ? "bg-brand-orange text-white shadow-md scale-102 font-black" : "text-gray-500 hover:text-gray-800"}`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Saved Dishes</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${activeSubTab === "dishes" ? "bg-white text-orange-700" : "bg-gray-100 text-gray-600"}`}
            >
              {savedDishes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main viewport based on active subtab */}
      {activeSubTab === "restaurants" ? (
        /* SAVED RESTAURANTS TAB */
        savedRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 animate-fade-in">
            {savedRestaurants.map((res) => {
              const distanceStr = `${(res.coordinates.x * 0.05 + res.coordinates.y * 0.03 + 0.8).toFixed(1)} km`;
              return (
                <div
                  key={res.id}
                  className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-100 transition duration-300 flex flex-col justify-between group"
                >
                  {/* cover image */}
                  <div className="relative h-44 bg-neutral-100 overflow-hidden shrink-0">
                    <img
                      src={res.image}
                      alt={res.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Floating Heart Button */}
                    <button
                      onClick={() => handleRemoveRestaurant(res.id, res.name)}
                      className="absolute top-3 right-3 h-8 w-8 bg-white/95 hover:bg-white text-rose-500 rounded-full flex items-center justify-center transition shadow-md z-10"
                      title="Remove from favorites"
                    >
                      <Heart className="h-4.5 w-4.5 fill-current text-rose-500" />
                    </button>

                    {/* Ratings badge */}
                    <div className="absolute bottom-3 right-3 bg-white/95 text-gray-900 text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 backdrop-blur-sm">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>{res.rating}</span>
                      <span className="text-[11px] text-gray-400 font-bold">
                        ({res.reviewsCount})
                      </span>
                    </div>

                    {res.isPromoBadge && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        {res.discount}
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-black text-lg text-gray-800 line-clamp-1 group-hover:text-orange-700 transition">
                        {res.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        <span>{res.address}</span>
                      </p>

                      {/* Cuisines tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {res.cuisines.map((c, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-extrabold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer parameters & CTA */}
                    <div className="mt-5 space-y-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-orange-700 shrink-0" />
                          <span>{res.deliveryTime}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          <span>{distanceStr} away</span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleViewRestaurant(res.id)}
                        className="w-full bg-brand-orange hover:bg-orange-600 text-white font-black text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Compass className="h-4 w-4" />
                        <span>View Kitchen Menu</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE FOR RESTAURANTS */
          <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl p-8 max-w-md mx-auto shadow-sm space-y-5 animate-fade-in">
            <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto relative">
              <Utensils className="h-8 w-8 text-rose-400" />
              <Heart className="h-4 w-4 text-rose-500 fill-current absolute -bottom-1 -right-1 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h4 className="font-display font-black text-lg text-gray-900">
                No Saved Kitchens
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                Your favorite restaurants list is looking empty. When browsing
                kitchens, tap the heart icon on any card to save it here for
                speedy access!
              </p>
            </div>
            <button
              onClick={() => setActiveTab("home")}
              className="cursor-pointer bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition inline-flex items-center gap-1.5"
            >
              <span>Explore Kitchen Feeds</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )
      ) : /* SAVED DISHES TAB */
      savedDishes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {savedDishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-white border border-gray-150 rounded-3xl p-4 flex gap-4 hover:border-orange-100 hover:shadow-sm transition-all duration-300 relative group overflow-hidden"
            >
              {/* Left side: Dish Photo and Indicators */}
              <div className="h-24 w-24 rounded-2xl bg-neutral-50 overflow-hidden shrink-0 relative self-center">
                <img
                  src={extractImageUrl(dish.image)}
                  alt={dish.name}
                  className="h-full w-full object-cover transform group-hover:scale-105 transition duration-300"
                />
                {/* Veg / Non veg indicators */}
                <span
                  className={`absolute top-1.5 left-1.5 h-4 w-4 rounded-full border border-white flex items-center justify-center ${dish.isVeg ? "bg-emerald-500" : "bg-red-500"}`}
                  title={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>

                {dish.isBestseller && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded uppercase">
                    Best
                  </span>
                )}
              </div>

              {/* Right side: Dish Info & Actions */}
              <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                <div className="space-y-1 relative">
                  {/* Delete Icon */}
                  <button
                    onClick={() => handleRemoveDish(dish.id, dish.name)}
                    className="absolute top-0 right-0 text-gray-300 hover:text-red-500 p-1 rounded transition duration-150"
                    title="Remove from saved dishes"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <h4 className="font-bold text-gray-800 text-sm sm:text-base pr-6 truncate">
                    {dish.name}
                  </h4>

                  <span className="font-mono font-black text-orange-700 text-xs sm:text-sm block">
                    ₹ {dish.price}
                  </span>

                  <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed">
                    {dish.description}
                  </p>

                  {/* From Restaurant line */}
                  <button
                    onClick={() => handleViewRestaurant(dish.restaurantId)}
                    className="text-[11px] text-gray-500 hover:text-orange-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>From {dish.restaurantName}</span>
                    <span className="text-amber-500">
                      ★ {dish.restaurantRating}
                    </span>
                  </button>
                </div>

                {/* Actions footer (Quick Reorder) */}
                <div className="flex items-center justify-between border-t border-gray-50 mt-3 pt-2">
                  <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-0.5">
                    <Clock className="h-3.5 w-3.5 text-gray-300" />
                    <span>Delivery: {dish.deliveryTime}</span>
                  </span>

                  {(dish.isAvailable === false || dish.availability === false) ? (
                    <span className="bg-neutral-100 text-neutral-400 border border-neutral-200 text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl select-none">
                      OUT OF STOCK
                    </span>
                  ) : (
                    <button
                      onClick={() => handleQuickReorder(dish)}
                      className="bg-brand-orange hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Quick Reorder</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* EMPTY STATE FOR DISHES */
        <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl p-8 max-w-md mx-auto shadow-sm space-y-5 animate-fade-in">
          <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto relative">
            <Sparkles className="h-8 w-8 text-rose-400" />
            <Heart className="h-4 w-4 text-rose-500 fill-current absolute -bottom-1 -right-1 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h4 className="font-display font-black text-lg text-gray-900">
              No Saved Dishes
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Craving quick reorders? When viewing restaurant menus, tap the
              heart icon on any signature dish to save them here for one-click
              reordering!
            </p>
          </div>
          <button
            onClick={() => setActiveTab("home")}
            className="cursor-pointer bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition inline-flex items-center gap-1.5"
          >
            <span>Browse Comfort Foods</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
