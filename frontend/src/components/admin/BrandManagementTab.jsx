import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../common/Modal";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  ChefHat,
  Utensils,
  Star,
  ShoppingBag,
  Save,
  FolderPlus,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { INITIAL_BRANDS, ICON_MAP, normalizeBrand } from "../diner/CloudKitchenSection";
import { dinerService } from "../../api/dinerService";

export default function BrandManagementTab({ orders, triggerToast, managerOutletId }) {
  const [brands, setBrands] = useState([]);
  const [availableRestaurants, setAvailableRestaurants] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const loadBrandsAndData = async () => {
      try {
        const [savedBrands, restaurantsList, categoriesList] = await Promise.all([
          dinerService.getBrands(),
          dinerService.getRestaurants(),
          dinerService.getCategories(),
        ]);
        let rawList = Array.isArray(savedBrands) ? savedBrands : (savedBrands?.brands || savedBrands?.data || []);
        let normalizedList = rawList && rawList.length > 0 ? rawList.map(normalizeBrand).filter(Boolean) : INITIAL_BRANDS.map(normalizeBrand);

        if (managerOutletId) {
          normalizedList = normalizedList.filter((b) => {
            if (!b.restaurants || b.restaurants.length === 0) return true;
            return b.restaurants.some((r) => {
              const rId = typeof r === "object" ? (r._id || r.id) : r;
              return String(rId) === String(managerOutletId);
            });
          });
        }

        setBrands(normalizedList);

        if (Array.isArray(restaurantsList)) {
          setAvailableRestaurants(
            managerOutletId
              ? restaurantsList.filter((r) => String(r._id || r.id) === String(managerOutletId))
              : restaurantsList
          );
        }
        if (Array.isArray(categoriesList)) {
          setAvailableCategories(categoriesList);
        }
      } catch (e) {
        console.error("Failed to load brands/restaurants/categories:", e);
        setBrands(INITIAL_BRANDS.map(normalizeBrand));
      }
    };
    loadBrandsAndData();
  }, [managerOutletId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formName, setFormName] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formLogo, setFormLogo] = useState("");
  const [formPrepTime, setFormPrepTime] = useState("15-20 mins");
  const [formIsFreeDelivery, setFormIsFreeDelivery] = useState(true);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSelectedRestaurants, setFormSelectedRestaurants] = useState([]);

  const openAddModal = () => {
    setEditingBrand(null);
    setFormName("");
    setFormTagline("");
    setFormDescription("");
    setFormCoverImage("https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800");
    setFormLogo("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200");
    setFormPrepTime("15-20 mins");
    setFormIsFreeDelivery(true);
    setFormCategoryId(availableCategories.length > 0 ? (availableCategories[0]._id || availableCategories[0].id) : "64f1a2b3c4d5e6f7a8b9c0d1");
    setFormSelectedRestaurants(
      managerOutletId
        ? [managerOutletId]
        : availableRestaurants.length > 0
          ? [availableRestaurants[0]._id || availableRestaurants[0].id]
          : ["64f1a2b3c4d5e6f7a8b9c0d2"]
    );
    setIsModalOpen(true);
  };

  const openEditModal = (brand) => {
    const b = brand;
    setEditingBrand(b);
    setFormName(b.name || "");
    setFormTagline(b.tagline || b.slogan || "");
    setFormDescription(b.description || "");
    setFormCoverImage(b.coverImage || b.bannerImage || "");
    setFormLogo(b.logo || "");
    setFormPrepTime(b.averagePrepTime || b.prepTime || "15-20 mins");
    setFormIsFreeDelivery(b.isFreeDelivery !== undefined ? Boolean(b.isFreeDelivery) : true);
    setFormCategoryId(
      typeof b.category === "object"
        ? (b.category?._id || b.category?.id || "64f1a2b3c4d5e6f7a8b9c0d1")
        : (b.category || (availableCategories.length > 0 ? (availableCategories[0]._id || availableCategories[0].id) : "64f1a2b3c4d5e6f7a8b9c0d1"))
    );
    setFormSelectedRestaurants(
      Array.isArray(b.restaurants) && b.restaurants.length > 0
        ? b.restaurants.map((r) => typeof r === "object" ? (r._id || r.id) : r)
        : (availableRestaurants.length > 0 ? [availableRestaurants[0]._id || availableRestaurants[0].id] : ["64f1a2b3c4d5e6f7a8b9c0d2"])
    );
    setIsModalOpen(true);
  };

  const handleToggleRestaurantSelection = (restId) => {
    setFormSelectedRestaurants((prev) =>
      prev.includes(restId)
        ? prev.filter((id) => id !== restId)
        : [...prev, restId]
    );
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerToast("Please enter a brand name");
      return;
    }

    const selectedRestaurantsList = formSelectedRestaurants.length > 0
      ? formSelectedRestaurants
      : (availableRestaurants.length > 0 ? [availableRestaurants[0]._id || availableRestaurants[0].id] : ["64f1a2b3c4d5e6f7a8b9c0d2"]);

    const resolvedCategoryId = formCategoryId || (availableCategories.length > 0 ? (availableCategories[0]._id || availableCategories[0].id) : "64f1a2b3c4d5e6f7a8b9c0d1");

    const apiBrandPayload = {
      name: formName.trim(),
      category: resolvedCategoryId,
      tagline: formTagline.trim() || "Juicy Gourmet Burgers",
      description: formDescription.trim() || "Premium handcrafted burgers and crispy fries.",
      coverImage: formCoverImage.trim() || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=800",
      logo: formLogo.trim() || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200",
      averagePrepTime: formPrepTime.trim() || "15-20 mins",
      isFreeDelivery: Boolean(formIsFreeDelivery),
      restaurants: selectedRestaurantsList,
    };

    try {
      if (editingBrand) {
        const brandId = editingBrand._id || editingBrand.id;
        await dinerService.updateBrand(brandId, apiBrandPayload);
        triggerToast(`Brand "${formName}" updated successfully!`);
      } else {
        await dinerService.createBrand(apiBrandPayload);
        triggerToast(`Brand "${formName}" created successfully!`);
      }

      // Re-fetch fresh brands list from backend server
      const freshBrands = await dinerService.getBrands();
      const rawList = Array.isArray(freshBrands) ? freshBrands : (freshBrands?.brands || freshBrands?.data || []);
      if (rawList && rawList.length > 0) {
        setBrands(rawList.map(normalizeBrand).filter(Boolean));
      }
    } catch (err) {
      console.error("Failed to update/create brand on backend:", err);
      triggerToast(err.response?.data?.message || err.message || "Failed to save brand on backend server.", "error");
    } finally {
      setIsModalOpen(false);
    }
  };
  const handleToggleVisibility = (id, currentVal) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isVisible: !currentVal } : b)),
    );
    triggerToast(`Visibility toggled for brand`);
  };

  const handleDeleteBrand = async (id, name) => {
    if (
      confirm(
        `Are you sure you want to delete the kitchen brand "${name}"? This will withdraw all menu items and recipes.`,
      )
    ) {
      try {
        await dinerService.deleteBrand(id);
        triggerToast(`Brand "${name}" deleted successfully.`);
        // Re-fetch fresh brands list from backend server
        const freshBrands = await dinerService.getBrands();
        const rawList = Array.isArray(freshBrands) ? freshBrands : (freshBrands?.brands || freshBrands?.data || []);
        if (rawList && rawList.length > 0) {
          setBrands(rawList.map(normalizeBrand).filter(Boolean));
        } else {
          setBrands((prev) => prev.filter((b) => (b.id !== id && b._id !== id)));
        }
      } catch (err) {
        console.error("Failed to delete brand on backend:", err);
        triggerToast(err.response?.data?.message || err.message || "Failed to delete brand.", "error");
        // Fallback local update if offline/mock
        setBrands((prev) => prev.filter((b) => (b.id !== id && b._id !== id)));
      }
    }
  };
  const renderIconWithClass = (iconName, className = "h-5 w-5") => {
    const Component = ICON_MAP[iconName] || Utensils;
    return <Component className={className} />;
  };
  return (
    <div className="space-y-6" id="brand-management-module-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-neutral-900 text-white p-6 rounded-3xl border border-neutral-800 shadow-xl relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-10"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800")',
          }}
        />
        <div className="z-10 space-y-1">
          <h3 className="font-display font-black text-lg sm:text-xl uppercase tracking-wider flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-400 animate-pulse" />
            <span>Virtual Brand Management Studio</span>
          </h3>
          <p className="text-[11px] text-neutral-300 max-w-2xl font-medium">
            Launch new virtual concepts, configure custom aesthetic palette
            styling, toggle live visibility indexes, or lock down brand statuses
            for your smart multi-brand facility.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/20 hover:scale-102"
          >
            <Plus className="h-4 w-4" />
            <span>Add Brand Lab</span>
          </button>
        </div>
      </div>

      {/* CLOUD KITCHEN STATISTICS MATRIX */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        id="brand-management-stats-row"
      >
        {/* Metric 1: Total Brands Count */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft flex items-center gap-4">
          <div className="h-10 w-10 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Total Brands
            </span>
            <h4 className="text-lg font-black text-gray-900">
              {brands.length} Concepts
            </h4>
          </div>
        </div>

        {/* Metric 2: Active Brands */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Active Status
            </span>
            <h4 className="text-lg font-black text-emerald-600">
              {brands.filter((b) => b.status === "Active").length} Live
            </h4>
          </div>
        </div>

        {/* Metric 4: Total Specialties */}
        {/* <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Total Recipes
            </span>
            <h4 className="text-lg font-black text-blue-600">
              {brands.reduce((sum, b) => sum + (b.specialties?.length || 0), 0)}{" "}
              Items
            </h4>
          </div>
        </div> */}
      </div>

      {/* BRAND CARDS DIRECTORY WITH INTEGRATED STATISTICS */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        id="brand-management-cards-grid"
      >
        {brands.map((brand) => {
          const brandOrders = orders.filter(
            (o) =>
              o.restaurantId === brand.id ||
              o.restaurantName
                .toLowerCase()
                .includes(brand.name.toLowerCase().replace("globaleats ", "")),
          );
          const brandOrdersCount =
            brandOrders.length +
            (brand.id === "globaleats-biryani"
              ? 2
              : brand.id === "globaleats-pizza"
                ? 2
                : 1);
          const brandRevenue =
            brandOrders.reduce((sum, o) => sum + o.total, 0) +
            (brand.id === "globaleats-biryani"
              ? 123.1
              : brand.id === "globaleats-pizza"
                ? 214.15
                : 87.9);
          return (
            <motion.div
              layout
              key={brand.id || brand._id}
              onClick={() => openEditModal(brand)}
              className={`bg-white rounded-3xl border border-neutral-100 shadow-soft hover:shadow-lg transition relative overflow-hidden flex flex-col justify-between group cursor-pointer ${brand.status === "Disabled" ? "opacity-70 bg-neutral-50/50" : ""}`}
            >
              <div>
                {/* Banner image representation */}
                <div className="h-32 w-full bg-gray-100 relative">
                  <img
                    referrerPolicy="no-referrer"
                    src={brand.bannerImage}
                    alt={brand.name}
                    className="w-full h-full object-cover grayscale-xs group-hover:scale-102 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                  {/* Brand Meta on Banner */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl bg-gradient-to-br ${brand.themeColor?.gradient || "from-orange-600 to-amber-500"} text-white flex items-center justify-center shadow-lg shrink-0`}
                    >
                      {renderIconWithClass(
                        brand.iconName,
                        "h-5 w-5 text-white",
                      )}
                    </div>
                    <div className="text-white truncate">
                      <h4 className="font-display font-black text-sm truncate">
                        {brand.name}
                      </h4>
                      <p className="text-[10px] text-white/80 font-semibold truncate leading-tight">
                        {brand.slogan}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 space-y-4">
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                    {brand.description}
                  </p>

                  {/* STATS SECTION IN CARD */}
                  <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-100">
                    <div className="text-center">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                        Orders
                      </span>
                      <span className="text-xs font-black text-gray-800 font-mono flex items-center justify-center gap-0.5">
                        <ShoppingBag className="h-3 w-3 text-orange-700" />
                        <span>{brandOrdersCount}</span>
                      </span>
                    </div>

                    <div className="text-center border-x border-neutral-200">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                        Revenue
                      </span>
                      <span className="text-xs font-black text-emerald-600 font-mono">
                        ₹ {brandRevenue.toFixed(0)}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                        Score
                      </span>
                      <span className="text-xs font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{brand.rating}</span>
                      </span>
                    </div>
                  </div>

                  {/* Menu Specialties Previews */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                      Menu Preview
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {brand.specialties?.map((item) => (
                        <span
                          key={item.id}
                          className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-[9px] font-bold border border-neutral-200 max-w-[120px] truncate"
                          title={`${item.name} (₹ ${item.price})`}
                        >
                          {item.name}
                        </span>
                      )) || (
                          <span className="text-[10px] text-gray-400 italic font-medium">
                            No specialties created
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions - ONLY ONE DELETE BUTTON FOR VIRTUAL BRAND */}
              <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-gray-400">
                  Prep: <span className="text-gray-700">{brand.prepTime}</span>
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBrand(brand._id || brand.id, brand.name);
                  }}
                  className="p-1.5 bg-white text-neutral-400 hover:text-red-600 hover:bg-red-50 border border-neutral-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  title="Delete Brand"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-600 font-extrabold">Delete</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* BRAND MODAL (ADD & EDIT) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <div>
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-display font-black text-base text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                {editingBrand ? (
                  <Edit className="h-5 w-5 text-orange-700" />
                ) : (
                  <FolderPlus className="h-5 w-5 text-orange-700" />
                )}
                <span>
                  {editingBrand
                    ? "Edit Virtual Brand Lab"
                    : "Launch New Brand"}
                </span>
              </h4>
              <p className="text-[10px] text-gray-400 font-semibold">
                Configure details to update our distributed cloud kitchen
                recipe lists
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="h-8 w-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSaveBrand} className="p-6 space-y-4">
            {/* Row 1: Brand Name & Category Dropdown */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Burger Express"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Category (Select Name)
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange bg-white"
                >
                  {availableCategories.length > 0 ? (
                    availableCategories.map((cat) => (
                      <option key={cat._id || cat.id} value={cat._id || cat.id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option value="64f1a2b3c4d5e6f7a8b9c0d1">Indian / Fast Food</option>
                  )}
                </select>
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={formTagline}
                onChange={(e) => setFormTagline(e.target.value)}
                placeholder="e.g. Juicy Gourmet Burgers"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Concept Description */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g. Premium handcrafted burgers and crispy fries."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Image URLs: Cover & Logo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  placeholder="https://example.com/images/burger-cover.jpg"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Logo Image URL
                </label>
                <input
                  type="text"
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="https://example.com/images/burger-logo.jpg"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            {/* Prep time & Free Delivery Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Average Prep Time
                </label>
                <input
                  type="text"
                  value={formPrepTime}
                  onChange={(e) => setFormPrepTime(e.target.value)}
                  placeholder="e.g. 15-20 mins"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Free Delivery Status
                </label>
                <button
                  type="button"
                  onClick={() => setFormIsFreeDelivery((prev) => !prev)}
                  className={`w-full py-2 rounded-xl text-xs font-black uppercase transition border ${formIsFreeDelivery ? "bg-emerald-500 border-emerald-500 text-white" : "bg-neutral-100 border-neutral-300 text-gray-700"}`}
                >
                  {formIsFreeDelivery ? "Free Delivery Enabled" : "Paid Delivery"}
                </button>
              </div>
            </div>

            {/* Hosting Physical Kitchen Outlets (Select Restaurants by Name) */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                Hosting Physical Kitchen Outlets (Select Restaurant Names)
              </label>
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 max-h-36 overflow-y-auto space-y-2">
                {availableRestaurants.length > 0 ? (
                  availableRestaurants.map((rest) => {
                    const restId = rest._id || rest.id;
                    const isChecked = formSelectedRestaurants.includes(restId);
                    return (
                      <label
                        key={restId}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${isChecked ? "bg-orange-50 border-brand-orange text-gray-900 font-bold" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRestaurantSelection(restId)}
                            className="rounded text-orange-700 focus:ring-brand-orange h-4 w-4"
                          />
                          <div>
                            <span className="block font-semibold">{rest.name || "Kitchen Outlet"}</span>
                            <span className="text-[9px] text-gray-400 block">{rest.city || "Jaipur"}</span>
                          </div>
                        </div>
                        {isChecked && <span className="text-[10px] font-black text-orange-700 uppercase">Selected</span>}
                      </label>
                    );
                  })
                ) : (
                  <div className="text-[11px] text-gray-400 italic">No physical kitchen outlets found. Default outlet ID will be assigned.</div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
              >
                <Save className="h-4 w-4" />
                <span>
                  {editingBrand ? "Update Virtual Brand" : "Launch Brand"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
