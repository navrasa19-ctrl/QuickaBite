import React, { useState } from "react";
import {
  ChefHat,
  ShieldCheck,
  SlidersHorizontal,
  Award,
  ShoppingBag,
  Menu,
  MessageSquare,
  Sparkles,
  Users,
  FileText,
  Cpu,
  Briefcase,
  Home,
  Search,
  Ticket,
  Tag,
  ShoppingCart,
  User,
  Heart,
} from "lucide-react";
import { useFavorites } from "../../context/FavoritesContext";

export default function BottomNavbar({
  activeTab,
  setActiveTab,
  userRole,
  cartItems,
  adminSubTab,
  setAdminSubTab,
  marketingSubTab,
  setMarketingSubTab,
}) {
  const [marketingMenuOpen, setMarketingMenuOpen] = useState(false);
  const { favorites, favoriteDishes } = useFavorites();

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const favoritesCount = (favorites?.length || 0) + (favoriteDishes?.length || 0);

  if (userRole === "admin" || activeTab === "admin") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-stretch min-h-16 pb-[env(safe-area-inset-bottom)] xl:hidden">
      {userRole === "manager" ? (
        <button
          onClick={() => {
            setActiveTab("manager");
          }}
          className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "manager" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
        >
          <ChefHat className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "manager" ? "scale-110" : "hover:scale-105"}`} />
          <span>Kitchen Ops</span>
        </button>
      ) : userRole === "admin" ? (
        <>
          <button
            onClick={() => {
              setActiveTab("admin");
              setAdminSubTab("overview");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${(activeTab === "home" || activeTab === "admin") && adminSubTab !== "restaurants" && adminSubTab !== "brands" && adminSubTab !== "orders" && adminSubTab !== "marketing" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <ShieldCheck className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${(activeTab === "home" || activeTab === "admin") && adminSubTab !== "restaurants" && adminSubTab !== "brands" && adminSubTab !== "orders" && adminSubTab !== "marketing" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Dashboard</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("admin");
              setAdminSubTab("restaurants");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${(activeTab === "home" || activeTab === "admin") && adminSubTab === "restaurants" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <SlidersHorizontal className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${(activeTab === "home" || activeTab === "admin") && adminSubTab === "restaurants" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Menu</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("admin");
              setAdminSubTab("brands");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${(activeTab === "home" || activeTab === "admin" || activeTab === "brands") && adminSubTab === "brands" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <Award className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${(activeTab === "home" || activeTab === "admin" || activeTab === "brands") && adminSubTab === "brands" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Brands</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("admin");
              setAdminSubTab("orders");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${(activeTab === "home" || activeTab === "admin") && adminSubTab === "orders" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <ShoppingBag className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${(activeTab === "home" || activeTab === "admin") && adminSubTab === "orders" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Orders</span>
          </button>

          {/* Marketing (Hamburger Menu Popup) */}
          <div className="relative flex-1 flex flex-col items-center">
            <button
              onClick={() => setMarketingMenuOpen(!marketingMenuOpen)}
              className={`w-full flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "admin" && adminSubTab === "marketing" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
            >
              <Menu className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "admin" && adminSubTab === "marketing" ? "scale-110" : "hover:scale-105"}`} />
              <span className="cursor-pointer">Marketing</span>
            </button>

            {marketingMenuOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setMarketingMenuOpen(false)}
                />
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white border border-gray-100 rounded-2xl shadow-xl py-2.5 w-48 z-50 animate-fade-in text-left">
                  <div className="px-3 pb-1.5 mb-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                    Marketing Command
                  </div>
                  {[
                    { id: "contacts", label: "Diner Directory", icon: Users },
                    { id: "automations", label: "Workflows", icon: Cpu },
                    { id: "leads", label: "Lead CRM", icon: Briefcase },
                    { id: "coupons", label: "Promo Coupons", icon: Ticket },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSel =
                      activeTab === "admin" &&
                      adminSubTab === "marketing" &&
                      marketingSubTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab("admin");
                          setAdminSubTab("marketing");
                          setMarketingSubTab(item.id);
                          setMarketingMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-neutral-50 transition ${isSel ? "text-orange-700 bg-orange-50/50" : "text-neutral-600 hover:text-neutral-900"}`}
                      >
                        <Icon className="h-3.5 w-3.5 cursor-pointer" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setActiveTab("home");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "home" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <Home className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "home" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Home</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("search");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "search" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <Search className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "search" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Search</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("offers");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "offers" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <Ticket className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "offers" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Offers</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("favorites");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "favorites" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <div className="relative">
              <Heart className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "favorites" ? "scale-110" : "hover:scale-105"}`} />
              {favoritesCount > 0 && (
                <span className="cursor-pointer absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[11px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {favoritesCount}
                </span>
              )}
            </div>
            <span className="cursor-pointer">Favorites</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("cart");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "cart" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <div className="relative">
              <ShoppingCart className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "cart" ? "scale-110" : "hover:scale-105"}`} />
              {cartCount > 0 && (
                <span className="cursor-pointer absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[11px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="cursor-pointer">Cart</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("orders");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "orders" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <ShoppingBag className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "orders" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Orders</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("profile");
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ${activeTab === "profile" ? "text-orange-700" : "text-gray-400 hover:text-gray-700"}`}
          >
            <User className={`h-5 w-5 cursor-pointer transition-transform duration-200 ${activeTab === "profile" ? "scale-110" : "hover:scale-105"}`} />
            <span className="cursor-pointer">Profile</span>
          </button>
        </>
      )}
    </nav>
  );
}
