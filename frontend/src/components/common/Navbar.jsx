import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  MapPin,
  ChevronDown,
  User,
  LogOut,
  CheckCircle,
  LifeBuoy,
  Heart,
  ShoppingCart,
  Home,
  Briefcase,
  Plus,
  Navigation,
} from "lucide-react";
import { RiAdminFill } from "react-icons/ri";
import { FaUserTie } from "react-icons/fa";
import QuikaBiteLogo from "./QuikaBiteLogo";
import { useFavorites } from "../../context/FavoritesContext";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  cartCount = 0,
  onCartToggle,
  currentLocation,
  setCurrentLocation,
  onSelectLocation,
  onRequestGpsAgain,
  notifications = [],
  onMarkAllAsRead,
  onToggleRead,
  onDeleteNotification,
  onClearAllNotifications,
  userRole = "user",
  onLogout,
  isLoggedIn = false,
  profile,
}) {
  if (userRole === "admin" || activeTab === "admin") {
    return null;
  }

  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { favorites, favoriteDishes } = useFavorites();
  const { addresses } = useAuth();
  const favoritesCount =
    (favorites?.length || 0) + (favoriteDishes?.length || 0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getAddressDisplayText = (addr) => {
    if (!addr) return "";
    const tag =
      addr.label === "Other" && addr.tagName
        ? addr.tagName
        : addr.label || "Address";
    if (!addr.detail) return tag;
    return `${tag}: ${addr.detail}`;
  };

  useEffect(() => {
    if (
      isLoggedIn &&
      userRole !== "admin" &&
      userRole !== "manager" &&
      addresses &&
      addresses.length > 0 &&
      !currentLocation
    ) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      const formattedDefault = getAddressDisplayText(defaultAddr);
      if (formattedDefault) {
        setCurrentLocation(formattedDefault);
      }
    }
  }, [addresses, isLoggedIn, userRole, currentLocation]);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200"
        id="global-header"
      >
        <div className="page-container">
          <div className="flex flex-wrap xl:flex-nowrap items-center gap-x-3 gap-y-2.5 py-2.5 xl:py-3">
            {/* Logo */}
            <div
              onClick={() => setActiveTab("home")}
              id="brand-logo-container"
              className="cursor-pointer shrink-0 order-1"
            >
              <QuikaBiteLogo size="md" />
            </div>

            {/* Location Selector (Desktop + Compact Mobile Button) */}
            {userRole !== "admin" && userRole !== "manager" && (
              <div
                className="relative order-3 md:order-2 w-full md:w-auto md:flex-1 xl:flex-none xl:w-[250px] 2xl:w-[290px] min-w-0"
                id="location-selector-container"
              >
                <button
                  onClick={() => {
                    if (typeof onRequestGpsAgain === "function") {
                      onRequestGpsAgain();
                    }
                    setShowLocationMenu(!showLocationMenu);
                  }}
                  className={`flex items-center gap-2 min-h-11 px-3.5 rounded-xl text-xs sm:text-[13px] font-semibold transition w-full md:w-auto md:max-w-full xl:w-full cursor-pointer ${
                    !currentLocation
                      ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                      : "bg-white hover:bg-orange-50 text-gray-800 border border-gray-200"
                  }`}
                  id="location-trigger"
                  title={currentLocation ? `Location: ${currentLocation}` : "Location Not Detected • Tap to grant location permission"}
                >
                  <MapPin className={`h-4 w-4 shrink-0 ${!currentLocation ? "text-amber-600" : "text-brand-orange"}`} />
                  <span className="truncate">
                    {currentLocation || "Set delivery location"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 shrink-0 ml-auto" />
                </button>

                {showLocationMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLocationMenu(false)}
                    />
                    <div className="absolute left-0 mt-2 w-[85vw] max-w-xs sm:w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 max-h-80 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLocationMenu(false);
                            if (typeof onRequestGpsAgain === "function") {
                              onRequestGpsAgain();
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-black text-white bg-brand-orange hover:bg-orange-700 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <Navigation className="h-3.5 w-3.5 shrink-0" />
                          <span>Detect Live GPS Location</span>
                        </button>
                      </div>
                      <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Saved Delivery Locations
                        </span>
                      </div>
                      {addresses && addresses.length > 0 ? (
                        addresses.map((addr) => {
                          const formattedText = getAddressDisplayText(addr);
                          const isSelected =
                            currentLocation === formattedText ||
                            currentLocation === addr.detail;
                          const labelLower = (
                            addr.label || "home"
                          ).toLowerCase();
                          const Icon =
                            labelLower === "home"
                              ? Home
                              : labelLower === "work"
                                ? Briefcase
                                : MapPin;
                          return (
                            <button
                              key={addr.id || addr._id || addr.detail}
                              onClick={() => {
                                const addrLat = addr.lat ?? addr.location?.coordinates?.[1];
                                const addrLng = addr.lng ?? addr.location?.coordinates?.[0];
                                if (typeof onSelectLocation === "function") {
                                  onSelectLocation({
                                    lat: addrLat,
                                    lng: addrLng,
                                    displayText: formattedText,
                                  });
                                } else {
                                  setCurrentLocation(formattedText);
                                }
                                setShowLocationMenu(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition flex items-start gap-2.5 ${isSelected ? "bg-orange-50/70" : ""
                                }`}
                            >
                              <Icon
                                className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected
                                  ? "text-orange-700"
                                  : "text-gray-400"
                                  }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-bold text-xs ${isSelected
                                      ? "text-orange-700"
                                      : "text-gray-800"
                                      }`}
                                  >
                                    {addr.label === "Other" && addr.tagName
                                      ? addr.tagName
                                      : addr.label || "Address"}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[11px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {addr.detail}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-xs text-gray-500">
                          No saved addresses found in your profile.
                        </div>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1 px-2">
                        <button
                          onClick={() => {
                            setActiveTab("profile?section=addresses", {
                              state: { section: "addresses" },
                            });
                            setShowLocationMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add / Manage Saved Addresses</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Core Search input with Glassmorphism */}
            <div
              className="hidden md:block order-4 xl:order-3 w-full xl:w-auto xl:flex-1 xl:min-w-[280px] xl:max-w-2xl relative"
              id="search-input-container"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search dishes or restaurants"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== "search" && e.target.value) {
                      setActiveTab("search");
                    }
                  }}
                  className="w-full h-11 pl-11 pr-16 bg-orange-50/60 border border-orange-100 rounded-xl text-sm placeholder-gray-500 text-gray-900 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15 outline-none transition"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-orange-700 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Navigation & Actions */}
            <div
              className="order-2 md:order-3 xl:order-4 ml-auto xl:ml-0 flex items-center gap-2 shrink-0"
              id="desktop-actions"
            >
              {/* Primary navigation (wide screens; smaller screens use the bottom bar) */}
              {userRole !== "admin" && userRole !== "manager" && (
                <nav className="hidden xl:flex items-center gap-1 mr-2" aria-label="Primary">
                  {[
                    { id: "home", label: "Home" },
                    { id: "offers", label: "Offers" },
                    { id: "orders", label: "Orders" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      aria-current={activeTab === item.id ? "page" : undefined}
                      className={`h-11 px-4 rounded-xl text-sm font-semibold transition cursor-pointer ${
                        activeTab === item.id
                          ? "bg-orange-50 text-orange-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              )}

              {/* Favorites Header Action */}
              {userRole !== "admin" && userRole !== "manager" && (
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`hidden md:flex items-center justify-center gap-2 h-11 min-w-11 px-3 xl:px-4 rounded-xl font-semibold text-sm transition border cursor-pointer ${activeTab === "favorites" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"}`}
                  id="navbar-favorites-btn"
                  title="Favorites"
                >
                  <div className="relative flex items-center justify-center">
                    <Heart
                      className={`h-4.5 w-4.5 ${favoritesCount > 0 ? "fill-brand-orange text-brand-orange" : "text-gray-600"}`}
                    />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-2 -right-2.5 bg-brand-orange text-white text-[11px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                        {favoritesCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:inline">Favorites</span>
                </button>
              )}

              {/* Cart Header Action */}
              {userRole !== "admin" && userRole !== "manager" && (
                <button
                  onClick={() =>
                    onCartToggle ? onCartToggle() : setActiveTab("cart")
                  }
                  className={`hidden md:flex items-center justify-center gap-2 h-11 min-w-11 px-3 xl:px-4 rounded-xl font-semibold text-sm transition border cursor-pointer ${activeTab === "cart" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"}`}
                  id="navbar-cart-btn"
                  title="Cart"
                >
                  <div className="relative flex items-center justify-center">
                    <ShoppingCart className="h-4.5 w-4.5 text-gray-600" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2.5 bg-brand-orange text-white text-[11px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:inline">Cart</span>
                </button>
              )}
              {/* Admin Desk Direct Shortcut */}
              {userRole === "admin" && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`hidden md:flex items-center gap-1.5 font-black py-2.5 px-4 rounded-full shadow-xs border transition ${activeTab === "admin" ? "bg-neutral-950 text-white border-neutral-950" : "bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200"}`}
                  id="admin-shortcut-btn"
                >
                  <RiAdminFill className="h-3.5 w-3.5" />
                  <span className="text-xs font-black">Admin Deck</span>
                </button>
              )}

              {userRole === "manager" && (
                <button
                  onClick={() => setActiveTab("manager")}
                  className={`hidden md:flex items-center gap-1.5 font-black py-2.5 px-4 rounded-full shadow-xs border transition ${activeTab === "manager" ? "bg-neutral-950 text-white border-neutral-950" : "bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200"}`}
                  id="manager-shortcut-btn"
                >
                  <FaUserTie className="h-3.5 w-3.5" />
                  <span className="text-xs font-black">Manager Deck</span>
                </button>
              )}

              {/* Profile Menu */}
              {!isLoggedIn ? (
                <button
                  onClick={() => setActiveTab("profile")}
                  className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm h-11 px-4 sm:px-5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0"
                  id="navbar-signin-btn"
                  title="Profile / Sign In"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="text-sm">
                    <span className="inline sm:hidden">Sign in</span>
                    <span className="hidden sm:inline">Sign in</span>
                  </span>
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="cursor-pointer flex items-center gap-1.5 p-1.5 hover:bg-gray-50 rounded-full transition"
                    id="profile-trigger"
                  >
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm ${userRole === "admin" ? "bg-neutral-950 text-brand-orange border border-neutral-800" : "bg-orange-100 border border-orange-200 text-brand-orange"}`}
                    >
                      <User className="h-5 w-5" />
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                  </button>

                  {showProfileMenu &&
                    (() => {
                      const nameVal = profile?.name;
                      const emailVal = profile?.email;
                      return (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowProfileMenu(false)}
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2">
                            <div className="px-4 py-3 border-b border-gray-50">
                              <span className="text-sm font-bold text-gray-800 block truncate">
                                {nameVal}
                              </span>
                              {emailVal && (
                                <span className="text-xs text-gray-400 block truncate">
                                  {emailVal}
                                </span>
                              )}
                              {userRole === "admin" && (
                                <span className="text-[11px] bg-neutral-950 text-brand-orange font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider inline-block mt-1">
                                  Administrator
                                </span>
                              )}
                              {userRole === "manager" && (
                                <span className="text-[11px] bg-neutral-950 text-brand-orange font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider inline-block mt-1">
                                  Operations Manager
                                </span>
                              )}
                            </div>

                            {/* {userRole === "admin" && <button
                        onClick={() => {
                          setActiveTab("admin");
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-neutral-900 font-bold hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2"
                      >
                        <span>👑</span>
                        <span>Admin Control Desk</span>
                      </button>} */}

                            {/* {userRole === "manager" && (
                            <button
                              onClick={() => {
                                setActiveTab("manager");
                                setShowProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-neutral-900 font-bold hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2"
                            >
                              <span>🧑‍💼</span>
                              <span>Manager Control Desk</span>
                            </button>
                          )} */}

                            <button
                              onClick={() => {
                                setActiveTab("profile");
                                setShowProfileMenu(false);
                              }}
                              className="cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2"
                            >
                              <User className="h-4 w-4" />
                              <span>My Profile</span>
                            </button>
                            {userRole !== "manager" && userRole !== "admin" && (
                              <button
                                onClick={() => {
                                  setActiveTab("support");
                                  setShowProfileMenu(false);
                                }}
                                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2"
                              >
                                <LifeBuoy className="h-4 w-4" />
                                <span>Support Helpdesk</span>
                              </button>
                            )}
                            <div className="border-t border-gray-50 my-1" />
                            {onLogout && (
                              <button
                                id="logout-btn"
                                onClick={() => {
                                  setShowProfileMenu(false);
                                  setShowLogoutConfirm(true);
                                }}
                                className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2 font-bold"
                              >
                                <LogOut className="h-4 w-4 text-red-500" />
                                <span>Log Out</span>
                              </button>
                            )}
                            <div className="px-4 py-1.5 flex items-center gap-2 text-[11px] text-emerald-600 font-semibold bg-emerald-50/50">
                              <CheckCircle className="h-3 w-3" />
                              <span>Verified Account</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLogoutConfirm &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fade-in"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-6 text-center border border-gray-100 space-y-6 animate-scale-up animate-duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <h4 className="font-display font-black text-lg text-gray-900 leading-tight">
                  Are you sure you want to logout?
                </h4>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="cursor-pointer flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-300 text-gray-700 font-extrabold rounded-xl text-xs transition border border-gray-200"
                >
                  No
                </button>

                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  className="cursor-pointer flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
