import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Utensils,
  ChevronDown,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Tag,
  Info,
  Flame,
  Clock,
  ShoppingBag,
  Ticket,
  Upload,
} from "lucide-react";
import { CATEGORIES } from "../../data";
import apiClient, { parseApiError } from "../../api/apiClient";
import { adminService } from "../../api/adminService";
import { normalizeMenuItem, extractImageUrl, dinerService } from "../../api/dinerService";
const IMAGE_PRESETS = [
  {
    name: "🍔 Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "🍕 Pizza",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "🍲 Curry",
    url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "🥗 Salad",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "🍣 Sushi",
    url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "🍨 Dessert",
    url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "🥤 Beverage",
    url: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=400",
  },
];
const toSentenceCase = (str) => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
export default function MenuManagementTab({
  restaurantsList,
  setRestaurantsList,
  saveRestaurantsToStorage,
  triggerToast,
  onAddRestaurantClick,
  onEditRestaurantClick,
  onDeleteRestaurantClick,
  isLoadingKitchens = false,
  restaurantPagination,
  restaurantPage = 1,
  setRestaurantPage,
  restaurantLimit = 10,
  setRestaurantLimit,
}) {
  const [activeCatalogTab, setActiveCatalogTab] = useState("dishes");
  const [viewMode, setViewMode] = useState("list");

  const [selectedResId, setSelectedResId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeCategory, setActiveCategory] = useState("all");
  const [editingItem, setEditingItem] = useState(null);
  const [targetRestaurantId, setTargetRestaurantId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Indian");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemDragActive, setItemDragActive] = useState(false);
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemIsBestseller, setItemIsBestseller] = useState(false);
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedMenus, setLoadedMenus] = useState(false);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);
  const [virtualBrands, setVirtualBrands] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [itemBrand, setItemBrand] = useState("");

  useEffect(() => {
    const loadCategoriesAndBrands = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.allSettled([
          adminService.getCategories(),
          dinerService.getBrands(),
        ]);

        if (catsRes.status === "fulfilled" && catsRes.value) {
          const rawCats = Array.isArray(catsRes.value)
            ? catsRes.value
            : (catsRes.value?.categories || catsRes.value?.data || []);
          setDbCategories(rawCats);
        }

        if (brandsRes.status === "fulfilled" && brandsRes.value) {
          const rawList = Array.isArray(brandsRes.value)
            ? brandsRes.value
            : (brandsRes.value?.brands || brandsRes.value?.data || []);
          if (Array.isArray(rawList)) {
            setVirtualBrands(rawList);
          }
        }
      } catch (err) {
        console.error("Failed to load categories/brands in MenuManagementTab:", err);
      }
    };
    loadCategoriesAndBrands();
  }, []);

  const handleItemDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setItemDragActive(true);
    } else if (e.type === "dragleave") {
      setItemDragActive(false);
    }
  };

  const processSingleItemFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setItemImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setItemImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setItemDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSingleItemFile(e.dataTransfer.files[0]);
    }
  };

  const handleItemPhotoUpload = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processSingleItemFile(files[0]);
    }
  };

  const handleRemoveItemImage = () => {
    setItemImageFile(null);
    setItemImage("");
  };

  useEffect(() => {
    if (!loadedMenus && import.meta.env.VITE_USE_MOCK === "false") {
      const fetchMenus = async () => {
        setIsLoadingMenus(true);
        try {
          if (restaurantsList.length > 0) {
            const response = await adminService.getAllMenu();
            const allMenus = response?.data || response || [];

            setRestaurantsList(prevList => {
              return prevList.map(res => {
                const restaurantMenus = allMenus.filter(item => {
                  const itemResId = item.restaurant?._id || item.restaurant?.id || item.restaurant;
                  return (
                    String(itemResId) === String(res._id) ||
                    String(itemResId) === String(res.id) ||
                    (res.slug && String(itemResId) === String(res.slug))
                  );
                }).map(item => normalizeMenuItem(item));
                return {
                  ...res,
                  menu: restaurantMenus.length > 0 ? restaurantMenus : (res.menu || []),
                };
              });
            });
          }
        } catch (error) {
          console.error("Failed to fetch menus from API:", error);
          triggerToast("Failed to load menus from database.");
        } finally {
          setIsLoadingMenus(false);
          setLoadedMenus(true);
        }
      };
      fetchMenus();
    }
  }, [restaurantsList.length, loadedMenus]);

  const showDishesSkeleton = isLoadingMenus || isLoadingKitchens || (!loadedMenus && import.meta.env.VITE_USE_MOCK === "false");
  const showKitchensSkeleton = isLoadingKitchens;

  const allFlattenedItems = useMemo(() => {
    const list = [];
    restaurantsList.forEach((res) => {
      (res.menu || []).forEach((dish) => {
        list.push({
          item: dish,
          restaurantId: res.id,
          restaurantDbId: res._id || res.id,
          restaurantName: res.name,
        });
      });
    });
    return list;
  }, [restaurantsList]);
  const filteredItems = useMemo(() => {
    return allFlattenedItems.filter((entry) => {
      if (selectedResId !== "all") {
        const resIdStr = String(selectedResId);
        const matchResId = String(entry.restaurantId) === resIdStr || String(entry.restaurantDbId) === resIdStr;
        if (!matchResId) {
          return false;
        }
      }
      if (activeCategory !== "all") {
        const itemCat = entry.item.category ? entry.item.category.trim().toLowerCase() : "";
        const activeCat = activeCategory.trim().toLowerCase();
        if (itemCat !== activeCat) {
          return false;
        }
      }
      if (debouncedSearchQuery.trim() !== "") {
        const query = debouncedSearchQuery.toLowerCase().trim();
        const itemName = entry.item.name ? entry.item.name.toLowerCase() : "";
        const itemDesc = entry.item.description ? entry.item.description.toLowerCase() : "";
        const resName = entry.restaurantName ? entry.restaurantName.toLowerCase() : "";
        const itemCat = entry.item.category ? entry.item.category.toLowerCase() : "";
        return (
          itemName.includes(query) ||
          itemDesc.includes(query) ||
          resName.includes(query) ||
          itemCat.includes(query)
        );
      }
      return true;
    });
  }, [allFlattenedItems, selectedResId, activeCategory, debouncedSearchQuery]);
  const menuCategories = useMemo(() => {
    const cats = /* @__PURE__ */ new Set();

    // Include categories from actual menu items
    allFlattenedItems.forEach((entry) => {
      if (entry.item.category) {
        cats.add(toSentenceCase(entry.item.category));
      }
    });

    return Array.from(cats);
  }, [allFlattenedItems]);
  const previewRestaurantName = useMemo(() => {
    const matched = restaurantsList.find((r) => r.id === targetRestaurantId);
    return matched ? matched.name : "Select a Brand Outlet";
  }, [restaurantsList, targetRestaurantId]);

  const currentRestaurantTags = useMemo(() => {
    if (!targetRestaurantId) return [];
    const matched = restaurantsList.find((r) => r.id === targetRestaurantId);
    if (!matched) return [];
    const tags = matched.tags || matched.cuisines || [];
    const normalizedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === "string" ? tags.split(",").map(t => t.trim()).filter(Boolean) : []);
    return normalizedTags;
  }, [targetRestaurantId, restaurantsList]);

  const availableOutletCategories = useMemo(() => {
    const catsSet = new Set();

    // 1. Include categories fetched from Category Directory (/v1/categories) matching target outlet
    dbCategories.forEach((cat) => {
      const catOutletId = cat.restaurant?._id || cat.restaurant?.id || (typeof cat.restaurant === "string" ? cat.restaurant : null);
      if (!catOutletId || !targetRestaurantId || String(catOutletId) === String(targetRestaurantId)) {
        if (cat.name) {
          catsSet.add(toSentenceCase(cat.name));
        }
      }
    });

    // 2. Include categories from existing menu items for this restaurant outlet
    allFlattenedItems.forEach((entry) => {
      if (!targetRestaurantId || String(entry.restaurantId) === String(targetRestaurantId)) {
        if (entry.item?.category) {
          catsSet.add(toSentenceCase(entry.item.category));
        }
      }
    });

    // 3. Include restaurant tags/cuisines
    currentRestaurantTags.forEach((t) => {
      if (t) catsSet.add(toSentenceCase(t));
    });

    // 4. Default fallback categories if empty
    if (catsSet.size === 0) {
      CATEGORIES.filter((c) => c.id !== "all" && c.id !== "more").forEach((c) => {
        catsSet.add(toSentenceCase(c.name));
      });
    }

    return Array.from(catsSet);
  }, [dbCategories, allFlattenedItems, targetRestaurantId, currentRestaurantTags]);

  const getFirstTagOfRestaurant = (restaurantId) => {
    const matched = restaurantsList.find((r) => r.id === restaurantId);
    if (matched) {
      const tags = matched.tags || matched.cuisines || [];
      const normalizedTags = Array.isArray(tags)
        ? tags
        : (typeof tags === "string" ? tags.split(",").map(t => t.trim()).filter(Boolean) : []);
      if (normalizedTags.length > 0) {
        return normalizedTags[0];
      }
    }
    return null;
  };
  const handleToggleAvailability = async (restaurantId, itemId, currentStatus) => {
    const nextStatus = !currentStatus;

    if (import.meta.env.VITE_USE_MOCK === "false") {
      try {
        await adminService.toggleAvailability(itemId);
      } catch (error) {
        console.error("Failed to toggle availability:", error);
        triggerToast(error.response?.data?.message || error.message || "Failed to toggle availability on server.");
        return;
      }
    }

    const updated = restaurantsList.map((res) => {
      if (res.id === restaurantId || res._id === restaurantId) {
        const updatedMenu = res.menu.map((dish) => {
          if (dish.id === itemId || dish._id === itemId) {
            triggerToast(
              `"${dish.name}" is now ${nextStatus ? "Available" : "Unavailable"}`,
            );
            return { ...dish, isAvailable: nextStatus };
          }
          return dish;
        });
        return { ...res, menu: updatedMenu };
      }
      return res;
    });
    setRestaurantsList(updated);
    saveRestaurantsToStorage(updated);
  };

  const handleOpenAddMode = () => {
    setEditingItem(null);
    const initialResId = selectedResId !== "all" ? selectedResId : restaurantsList[0]?.id || "";
    setTargetRestaurantId(initialResId);
    setItemName("");
    setItemPrice("");
    setItemBrand("");

    const initialTag = getFirstTagOfRestaurant(initialResId);
    setItemCategory(toSentenceCase(initialTag) || menuCategories[0] || "Indian");

    setItemDescription("");
    setItemImage();
    setItemIsVeg(true);
    setItemIsBestseller(false);
    setItemIsAvailable(true);
    setViewMode("editor");
  };

  const handleOpenEditMode = (restaurantId, item) => {
    setEditingItem(item);
    setTargetRestaurantId(restaurantId);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    const existingBrandId = item.brand ? (typeof item.brand === "object" ? (item.brand._id || item.brand.id) : item.brand) : "";
    setItemBrand(existingBrandId || "");
    setItemCategory(toSentenceCase(item.category));
    setItemDescription(item.description);
    setItemImage(item.image);
    setItemIsVeg(item.isVeg);
    setItemIsBestseller(!!item.isBestseller);
    setItemIsAvailable(item.isAvailable !== false);
    setViewMode("editor");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !targetRestaurantId) {
      triggerToast("Name, price, and kitchen are required.");
      return;
    }
    const priceNum = Number(itemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      triggerToast("Please enter a valid positive price.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const dishId = editingItem._id || editingItem.id;
        let finalItem = null;

        if (import.meta.env.VITE_USE_MOCK === "false") {
          const formDataPayload = new FormData();
          if (itemImageFile) {
            formDataPayload.append("image", itemImageFile);
          } else if (itemImage) {
            formDataPayload.append("image", itemImage);
          }
          if (itemBrand) {
            formDataPayload.append("brand", itemBrand);
          }
          formDataPayload.append("name", itemName);
          formDataPayload.append("description", itemDescription || "");
          formDataPayload.append("category", toSentenceCase(itemCategory));
          formDataPayload.append("price", String(priceNum));
          formDataPayload.append("isVegetarian", String(itemIsVeg));
          formDataPayload.append("isBestSeller", String(itemIsBestseller));
          formDataPayload.append("isAvailable", String(itemIsAvailable));
          formDataPayload.append("isActive", "true");

          const response = await adminService.updateMenu(dishId, formDataPayload);
          const updatedDish = response?.data || response?.menuItem || response || {};
          const dishImg = typeof updatedDish.image === "string" ? updatedDish.image : (updatedDish.image?.secure_url || updatedDish.image?.url || itemImage);

          finalItem = {
            id: updatedDish._id || updatedDish.id || dishId,
            _id: updatedDish._id || updatedDish.id || dishId,
            name: updatedDish.name || itemName,
            price: updatedDish.price !== undefined ? Number(updatedDish.price) : priceNum,
            category: toSentenceCase(updatedDish.category || itemCategory),
            description: updatedDish.description || itemDescription,
            image: dishImg,
            isVeg: updatedDish.isVegetarian !== undefined ? updatedDish.isVegetarian : (updatedDish.isVeg !== undefined ? updatedDish.isVeg : itemIsVeg),
            isBestseller: updatedDish.isBestSeller !== undefined ? updatedDish.isBestSeller : (updatedDish.isBestseller !== undefined ? updatedDish.isBestseller : itemIsBestseller),
            isAvailable: updatedDish.isAvailable !== undefined ? updatedDish.isAvailable : itemIsAvailable,
            brand: itemBrand || updatedDish.brand || editingItem.brand || null,
          };
        } else {
          finalItem = {
            id: editingItem.id,
            name: itemName,
            price: priceNum,
            category: toSentenceCase(itemCategory),
            description: itemDescription,
            image: itemImage,
            isVeg: itemIsVeg,
            isBestseller: itemIsBestseller,
            isAvailable: itemIsAvailable,
            brand: itemBrand || editingItem.brand || null,
          };
        }

        const updated = restaurantsList.map((res) => {
          if (res.id === targetRestaurantId || res._id === targetRestaurantId) {
            const itemExists = res.menu.some((d) => d.id === dishId || d._id === dishId);
            let updatedMenu = [];
            if (itemExists) {
              updatedMenu = res.menu.map((d) => {
                if (d.id === dishId || d._id === dishId) {
                  return finalItem;
                }
                return d;
              });
            } else {
              updatedMenu = [finalItem, ...res.menu];
            }
            return { ...res, menu: updatedMenu };
          } else {
            return {
              ...res,
              menu: res.menu.filter((d) => d.id !== dishId && d._id !== dishId),
            };
          }
        });
        setRestaurantsList(updated);
        saveRestaurantsToStorage(updated);
        triggerToast(`Updated dish "${itemName}" successfully.`);
      } else {
        const matchedRes = restaurantsList.find((r) => r.id === targetRestaurantId || r._id === targetRestaurantId);
        const restaurantDbId = matchedRes ? (matchedRes._id || matchedRes.id) : targetRestaurantId;

        let newDish = null;
        if (import.meta.env.VITE_USE_MOCK === "false") {
          const formDataPayload = new FormData();
          if (itemImageFile) {
            formDataPayload.append("image", itemImageFile);
          } else if (itemImage) {
            formDataPayload.append("image", itemImage);
          }
          if (itemBrand) {
            formDataPayload.append("brand", itemBrand);
          }
          formDataPayload.append("restaurant", restaurantDbId);
          formDataPayload.append("name", itemName);
          formDataPayload.append("description", itemDescription || "");
          formDataPayload.append("category", toSentenceCase(itemCategory));
          formDataPayload.append("price", String(priceNum));
          formDataPayload.append("isVegetarian", String(itemIsVeg));
          formDataPayload.append("isBestSeller", String(itemIsBestseller));
          formDataPayload.append("isAvailable", String(itemIsAvailable));
          formDataPayload.append("isActive", "true");

          const response = await adminService.createMenu(formDataPayload);
          const resData = response;
          const createdDish = resData?.data || resData?.menuItem || resData || {};
          const dishImg = typeof createdDish.image === "string" ? createdDish.image : (createdDish.image?.secure_url || createdDish.image?.url || itemImage);

          newDish = {
            id: createdDish._id || createdDish.id || `dish-${Date.now()}`,
            _id: createdDish._id || createdDish.id,
            name: createdDish.name || itemName,
            price: createdDish.price !== undefined ? Number(createdDish.price) : priceNum,
            category: toSentenceCase(createdDish.category || itemCategory),
            description: createdDish.description || itemDescription,
            image: dishImg,
            isVeg: createdDish.isVegetarian !== undefined ? createdDish.isVegetarian : (createdDish.isVeg !== undefined ? createdDish.isVeg : itemIsVeg),
            isBestseller: createdDish.isBestSeller !== undefined ? createdDish.isBestSeller : (createdDish.isBestseller !== undefined ? createdDish.isBestseller : itemIsBestseller),
            isAvailable: createdDish.isAvailable !== undefined ? createdDish.isAvailable : itemIsAvailable,
            brand: itemBrand || createdDish.brand || null,
          };
        } else {
          newDish = {
            id: `dish-${Date.now()}`,
            name: itemName,
            price: priceNum,
            category: toSentenceCase(itemCategory),
            description: itemDescription,
            image: itemImage,
            isVeg: itemIsVeg,
            isBestseller: itemIsBestseller,
            isAvailable: itemIsAvailable,
            brand: itemBrand || null,
          };
        }

        const updated = restaurantsList.map((res) => {
          if (res.id === targetRestaurantId || res._id === targetRestaurantId) {
            return {
              ...res,
              menu: [newDish, ...res.menu],
            };
          }
          return res;
        });

        setRestaurantsList(updated);
        saveRestaurantsToStorage(updated);
        triggerToast(`Added "${itemName}" to menu recipe list.`);
      }
      setViewMode("list");
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to submit form:", error);
      triggerToast(parseApiError(error, "An error occurred during form submission."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (restaurantId, itemId, itemName2) => {
    if (confirm(`Are you sure you want to delete "${itemName2}"?`)) {
      if (import.meta.env.VITE_USE_MOCK === "false") {
        try {
          await adminService.deleteMenu(itemId);
        } catch (error) {
          console.error("Failed to delete menu item:", error);
          triggerToast(parseApiError(error, "Failed to delete item from server."));
          return;
        }
      }

      const updated = restaurantsList.map((res) => {
        if (res.id === restaurantId || res._id === restaurantId) {
          return {
            ...res,
            menu: res.menu.filter((d) => d.id !== itemId && d._id !== itemId),
          };
        }
        return res;
      });
      setRestaurantsList(updated);
      saveRestaurantsToStorage(updated);
      triggerToast(`"${itemName2}" has been deleted from recipe book.`);
    }
  };
  return (
    <div
      className="bg-white rounded-3xl border border-neutral-150 shadow-soft p-6 space-y-6 animate-fade-in"
      id="menu-management-wrapper"
    >
      {/* 1. CATALOG LIST VIEW */}
      {viewMode === "list" && (
        <>
          {/* SECTION HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-5">
            <div>
              <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-orange-700" />
                <span>Operational Menu Catalog Management</span>
              </h2>
              <p className="text-xs text-neutral-400 font-semibold mt-1">
                Real-time control over dish categories, individual pricing, and
                kitchen availability. Conduct multi-brand bulk transformations
                instantly.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={handleOpenAddMode}
                className="px-5 py-3 bg-brand-orange hover:bg-orange-700 text-white text-xs font-black rounded-2xl transition flex items-center gap-2 shadow-lg shadow-orange-500/10 cursor-pointer justify-center"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add Custom Food Item</span>
              </button>
              <button
                onClick={onAddRestaurantClick}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black rounded-2xl transition flex items-center gap-2 cursor-pointer justify-center"
              >
                <Plus className="h-4.5 w-4.5 text-orange-700" />
                <span>Add Partner Kitchen</span>
              </button>

            </div>
          </div>

          {/* SUB-NAV CATALOG TABS */}
          <div className="flex border-b border-neutral-100 mb-6">
            <button
              onClick={() => setActiveCatalogTab("dishes")}
              className={`pb-3 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition ${activeCatalogTab === "dishes" ? "border-brand-orange text-orange-700" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
            >
              Food Items / Recipes ({allFlattenedItems.length})
            </button>
            <button
              onClick={() => setActiveCatalogTab("kitchens")}
              className={`pb-3 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition ${activeCatalogTab === "kitchens" ? "border-brand-orange text-orange-700" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
            >
              Partner Kitchens ({restaurantsList.length})
            </button>
          </div>

          {activeCatalogTab === "dishes" ? (
            <>
              {/* FILTER & CONTROL PANEL GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Restaurant selector */}
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                    Filter by Kitchen Brand
                  </label>
                  <div className="relative">
                    <select
                      value={selectedResId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedResId(val);
                        setSelectedItemIds([]);
                      }}
                      className="w-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-brand-orange/20 cursor-pointer appearance-none"
                    >
                      <option value="all">🍽️ All Kitchen Outlets</option>
                      {restaurantsList.map((r) => (
                        <option key={r.id} value={r.id}>
                          ⭐ {r.name} ({r.menu.length} items)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                {/* Categories selector */}
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                    Filter Category
                  </label>
                  <div className="relative">
                    <select
                      value={activeCategory}
                      onChange={(e) => {
                        setActiveCategory(e.target.value);
                        setSelectedItemIds([]);
                      }}
                      className="w-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl px-3 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-brand-orange/20 cursor-pointer appearance-none"
                    >
                      <option value="all">📂 All Categories</option>
                      {menuCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                {/* Global Search box */}
                <div className="md:col-span-6">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">
                    Search Food Item, Recipe, or Tags
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter by keyword (e.g. Biryani, Burger, Paneer)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-brand-orange/20 placeholder-neutral-400"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
                  </div>
                </div>
              </div>

              {/* CATEGORY PILLS BAR */}
              <div
                className="flex flex-wrap gap-1.5 border-b border-neutral-100 pb-3"
                id="admin-category-pills"
              >
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition ${activeCategory === "all" ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"}`}
                >
                  All Items ({
                    selectedResId === "all"
                      ? allFlattenedItems.length
                      : allFlattenedItems.filter((e) => String(e.restaurantId) === String(selectedResId) || String(e.restaurantDbId) === String(selectedResId)).length
                  })
                </button>
                {menuCategories.map((cat) => {
                  const count = allFlattenedItems.filter((e) => {
                    const matchesRes = selectedResId === "all" ||
                      String(e.restaurantId) === String(selectedResId) ||
                      String(e.restaurantDbId) === String(selectedResId);
                    const matchesCat = e.item.category && e.item.category.trim().toLowerCase() === cat.trim().toLowerCase();
                    return matchesRes && matchesCat;
                  }).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition ${activeCategory.toLowerCase() === cat.toLowerCase() ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"}`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* CATALOG TABLE */}
              <div
                className="overflow-auto max-h-[480px] rounded-2xl border border-neutral-150 relative scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent"
                id="menu-table-container"
              >
                <table className="min-w-full divide-y divide-neutral-150 text-left border-collapse">
                  <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,229,229,1)]">
                    <tr>
                      <th scope="col" className="px-6 py-4">
                        Recipe / Dish Information
                      </th>
                      <th scope="col" className="px-6 py-4">
                        Brand Outlet
                      </th>
                      <th scope="col" className="px-6 py-4">
                        Virtual Brand
                      </th>
                      <th scope="col" className="px-6 py-4">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-4">
                        Pricing (₹)
                      </th>
                      <th scope="col" className="px-6 py-4">
                        Availability
                      </th>
                      <th scope="col" className="px-6 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-150 bg-white">
                    {showDishesSkeleton ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-neutral-200 rounded-xl" />
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-3.5 w-3.5 bg-neutral-200 rounded-xs" />
                                  <div className="h-4 w-28 bg-neutral-200 rounded" />
                                </div>
                                <div className="h-3 w-48 bg-neutral-200 rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-7 w-24 bg-neutral-200 rounded-xl" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-7 w-20 bg-neutral-200 rounded-xl" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-7 w-16 bg-neutral-200 rounded-xl" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-12 bg-neutral-200 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-7 w-20 bg-neutral-200 rounded-full" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="h-8 w-8 bg-neutral-200 rounded-xl" />
                              <div className="h-8 w-8 bg-neutral-200 rounded-xl" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-16 text-center text-neutral-400"
                        >
                          <div className="max-w-xs mx-auto space-y-2">
                            <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto" />
                            <p className="text-xs font-black uppercase tracking-wider text-neutral-500">
                              No dishes match filters
                            </p>
                            <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">
                              Adjust your search parameters or select a
                              different partner kitchen to manage recipe items.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((entry) => {
                        const dish = entry.item;
                        const isAvailable = dish.isAvailable !== false;
                        return (
                          <tr
                            key={dish.id}
                            className="transition hover:bg-neutral-50/50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={extractImageUrl(dish.image)}
                                  className="h-12 w-12 object-cover rounded-xl border border-neutral-200"
                                  referrerPolicy="no-referrer"
                                  alt=""
                                />
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-xs shrink-0 inline-block border ${dish.isVeg ? "bg-emerald-500 border-emerald-600" : "bg-red-500 border-red-600"}`}
                                      title={dish.isVeg ? "Veg" : "Non-Veg"}
                                    />
                                    <h4 className="font-black text-neutral-900 text-xs">
                                      {dish.name}
                                    </h4>

                                    {dish.isBestseller && (
                                      <span className="text-[8px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                        🔥 Bestseller
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-400 font-semibold line-clamp-1 max-w-[280px] leading-relaxed">
                                    {dish.description ||
                                      "No recipe notes added yet."}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1.5 rounded-xl border border-neutral-200/55 inline-block">
                                {entry.restaurantName}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              {(() => {
                                const brandIdStr = typeof dish.brand === "object" ? (dish.brand?._id || dish.brand?.id) : dish.brand;
                                const brandObj = virtualBrands.find(b => String(b._id || b.id) === String(brandIdStr)) || (typeof dish.brand === "object" ? dish.brand : null);
                                const brandName = brandObj?.name || (typeof dish.brand === "string" && dish.brand ? dish.brand : null);
                                return brandName ? (
                                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-100 inline-block">
                                    ✨ {brandName}
                                  </span>
                                ) : (
                                  <span className="text-xs text-neutral-400 font-medium italic">
                                    —
                                  </span>
                                );
                              })()}
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-100">
                                {dish.category}
                              </span>
                            </td>

                            <td className="px-6 py-4 font-mono font-black text-neutral-900 text-xs">
                              ₹ {dish.price.toFixed(2)}
                            </td>

                            <td className="px-6 py-4">
                              <button
                                onClick={() =>
                                  handleToggleAvailability(
                                    entry.restaurantId,
                                    dish.id,
                                    isAvailable,
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${isAvailable ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                                />
                                <span>
                                  {isAvailable ? "In Stock" : "Out of Stock"}
                                </span>
                              </button>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() =>
                                    handleOpenEditMode(entry.restaurantId, dish)
                                  }
                                  className="p-2 bg-neutral-50 hover:bg-neutral-100 hover:text-orange-700 border border-neutral-200 text-neutral-500 rounded-xl transition cursor-pointer"
                                  title="Edit Recipe"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteItem(
                                      entry.restaurantId,
                                      dish.id,
                                      dish.name,
                                    )
                                  }
                                  className="p-2 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 text-red-500 rounded-xl transition cursor-pointer"
                                  title="Delete Dish"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div
              className="overflow-auto max-h-[480px] rounded-2xl border border-neutral-150 relative scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent"
              id="kitchens-table-container"
            >
              <table className="min-w-full divide-y divide-neutral-150 text-left border-collapse">
                <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(229,229,229,1)]">
                  <tr>
                    <th scope="col" className="px-6 py-4">
                      Kitchen / Outlet Info
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Cuisine Specialties
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Lead Time
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Delivery Fee (₹)
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Rating
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Recipes Count
                    </th>
                    <th scope="col" className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 bg-white">
                  {showKitchensSkeleton ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse border-b border-neutral-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-neutral-200 rounded-xl" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-neutral-200 rounded" />
                              <div className="h-3 w-40 bg-neutral-200 rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            <div className="h-5 w-12 bg-neutral-200 rounded" />
                            <div className="h-5 w-12 bg-neutral-200 rounded" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 bg-neutral-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-12 bg-neutral-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-10 bg-neutral-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-14 bg-neutral-200 rounded" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="h-8 w-8 bg-neutral-200 rounded-xl" />
                            <div className="h-8 w-8 bg-neutral-200 rounded-xl" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : restaurantsList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-neutral-400"
                      >
                        <div className="max-w-xs mx-auto space-y-2">
                          <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto" />
                          <p className="text-xs font-black uppercase tracking-wider text-neutral-500">
                            No partner kitchens registered
                          </p>
                          <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">
                            Add a partner kitchen outlet using the "Add Partner
                            Kitchen" action button.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    restaurantsList.map((res) => (
                      <tr
                        key={res.id}
                        className="hover:bg-neutral-50/50 transition border-b border-neutral-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={res.image}
                              className="h-12 w-12 object-cover rounded-xl border border-neutral-200"
                              referrerPolicy="no-referrer"
                              alt=""
                            />
                            <div className="space-y-0.5">
                              <h4 className="font-black text-neutral-900 text-xs">
                                {res.name}
                              </h4>
                              <p className="text-[10px] text-neutral-400 font-semibold line-clamp-1 max-w-[200px] leading-relaxed">
                                {res.address}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {res.cuisines.map((c, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100/50"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-700">
                          {res.deliveryTime}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-black text-neutral-900">
                          ₹ {res.deliveryFee}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-amber-500 flex items-center gap-0.5">
                            ⭐ {res.rating}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-700">
                          {res.menu?.length || 0} items
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEditRestaurantClick(res)}
                              className="p-2 bg-neutral-50 hover:bg-neutral-100 hover:text-orange-700 border border-neutral-200 text-neutral-500 rounded-xl transition cursor-pointer"
                              title="Edit Kitchen Details"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                onDeleteRestaurantClick(res.id, res.name)
                              }
                              className="p-2 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 text-red-500 rounded-xl transition cursor-pointer"
                              title="Decommission Kitchen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {restaurantPagination && setRestaurantPage && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-neutral-150 pt-4 px-2">
                <div className="text-xs font-semibold text-neutral-500">
                  Showing Page <span className="font-black text-neutral-900">{restaurantPagination.page || restaurantPage}</span> of{" "}
                  <span className="font-black text-neutral-900">{restaurantPagination.totalPages || 1}</span> (Total{" "}
                  <span className="font-black text-orange-700">{restaurantPagination.total || restaurantsList.length}</span> kitchens)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={restaurantPage <= 1}
                    onClick={() => setRestaurantPage((prev) => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-800 text-xs font-black rounded-xl transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-black px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg">
                    {restaurantPage}
                  </span>
                  <button
                    disabled={restaurantPage >= (restaurantPagination.totalPages || 1)}
                    onClick={() => setRestaurantPage((prev) => prev + 1)}
                    className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-800 text-xs font-black rounded-xl transition cursor-pointer"
                  >
                    Next
                  </button>
                  {setRestaurantLimit && (
                    <select
                      value={restaurantLimit}
                      onChange={(e) => {
                        setRestaurantLimit(Number(e.target.value));
                        setRestaurantPage(1);
                      }}
                      className="ml-2 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1 text-xs font-bold text-neutral-800 outline-none cursor-pointer"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        </>
      )}

      {/* 2. DEDICATED RECIPE STUDIO & LIVE PREVIEW PANEL */}
      {viewMode === "editor" && (
        <div className="space-y-6 animate-fade-in" id="add-food-item-studio">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-black text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-neutral-500" />
              <span>Back to Catalog</span>
            </button>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                Studio Mode
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT PANEL (60%): INPUT FORM */}
            <form
              onSubmit={handleFormSubmit}
              className="lg:col-span-7 space-y-6 bg-neutral-50/50 p-6 rounded-2xl border border-neutral-150"
            >
              <div>
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-orange-700" />
                  <span>
                    {editingItem
                      ? "Edit Culinary Recipe"
                      : "Design Custom Food Item"}
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400 font-semibold mt-1">
                  Tune ingredients, tags, classification, and price details.
                  Review live representation on the mobile handset preview.
                </p>
              </div>

              {/* Kitchen Brand Outlet Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span>Target Brand Kitchen Outlet</span>
                  <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={targetRestaurantId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setTargetRestaurantId(newId);
                      const initialTag = getFirstTagOfRestaurant(newId);
                      setItemCategory(initialTag || "Indian");
                    }}
                    className="w-full bg-white border border-neutral-200 focus:border-brand-orange rounded-xl px-3 py-3 text-xs font-bold text-neutral-800 outline-none focus:ring-4 focus:ring-brand-orange/10 cursor-pointer appearance-none"
                  >
                    <option value="" disabled>
                      Select kitchen brand...
                    </option>
                    {restaurantsList.map((r) => (
                      <option key={r.id} value={r.id}>
                        🍳 {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Virtual Brand Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span>Virtual Brand Concept (Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={itemBrand}
                    onChange={(e) => setItemBrand(e.target.value)}
                    className="w-full bg-white border border-neutral-200 focus:border-brand-orange rounded-xl px-3 py-3 text-xs font-bold text-neutral-800 outline-none focus:ring-4 focus:ring-brand-orange/10 cursor-pointer appearance-none"
                  >
                    <option value="">-- No Virtual Brand Assigned --</option>
                    {virtualBrands.map((b) => {
                      const bId = b._id || b.id;
                      return (
                        <option key={bId} value={bId}>
                          ✨ {b.name}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Food Name Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span>Food Item Name / Title</span>
                  <span className="text-red-500 font-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Spicy Butter Chicken, Smash Mushroom Burger"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-white border border-neutral-200 focus:border-brand-orange rounded-xl px-3 py-3 text-xs font-bold text-neutral-800 outline-none focus:ring-4 focus:ring-brand-orange/10"
                />
              </div>

              {/* Price & Category Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <span>Retail Price (₹)</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 45.00"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full bg-white border border-neutral-200 focus:border-brand-orange rounded-xl px-3 py-3 text-xs font-mono font-bold text-neutral-800 outline-none focus:ring-4 focus:ring-brand-orange/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <span>Menu Culinary Category</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full bg-white border border-neutral-200 focus:border-brand-orange rounded-xl px-3 py-3 text-xs font-bold text-neutral-800 outline-none focus:ring-4 focus:ring-brand-orange/10 cursor-pointer appearance-none"
                    >
                      <option value="" disabled>
                        Select a category...
                      </option>
                      {availableOutletCategories.map((catName) => (
                        <option key={catName} value={catName}>
                          📂 {catName}
                        </option>
                      ))}
                      {itemCategory && !availableOutletCategories.includes(toSentenceCase(itemCategory)) && (
                        <option value={toSentenceCase(itemCategory)}>
                          📂 {toSentenceCase(itemCategory)}
                        </option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Description field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Culinary Recipe Description & Ingredients
                </label>
                <textarea
                  placeholder="Describe recipe preparation, portion sizing, ingredients, side options, and allergen declarations..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-neutral-200 focus:border-brand-orange rounded-xl p-3 text-xs font-semibold text-neutral-800 outline-none focus:ring-4 focus:ring-brand-orange/10"
                />
              </div>

              {/* Images Presets & Custom Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-neutral-400" />
                  <span>Recipe Illustration Image Asset</span>
                </label>

                {/* Instant Presets Selector */}
                <div className="space-y-1">
                  <span className="text-[9px] text-neutral-400 font-bold block mb-1">
                    Select a high-resolution preset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {IMAGE_PRESETS.map((p, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => {
                          setItemImage(p.url);
                          triggerToast(
                            `Switched design image template: ${p.name}`,
                          );
                        }}
                        className={`px-2.5 py-1.5 bg-white border rounded-xl text-[10px] font-black tracking-tight transition cursor-pointer ${itemImage === p.url ? "border-brand-orange text-orange-700 bg-orange-50/20" : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Single Image Drag & Drop File Picker + Preview Card */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">
                    Upload Custom Dish Image *
                  </span>

                  {!itemImage ? (
                    <div
                      onDragEnter={handleItemDrag}
                      onDragOver={handleItemDrag}
                      onDragLeave={handleItemDrag}
                      onDrop={handleItemDrop}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${itemDragActive
                          ? "border-brand-orange bg-orange-50/40 text-orange-700 scale-[0.99]"
                          : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-orange-200 text-neutral-400"
                        }`}
                    >
                      <input
                        type="file"
                        id="dish-photo-uploader-tab"
                        accept="image/*"
                        onChange={handleItemPhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="dish-photo-uploader-tab"
                        className="cursor-pointer flex flex-col items-center w-full"
                      >
                        <Upload className="h-5 w-5 text-neutral-400 mb-1 group-hover:text-orange-700 transition" />
                        <p className="text-[10px] font-bold text-neutral-600">
                          Drag & drop food image or{" "}
                          <span className="text-orange-700 underline">
                            browse files
                          </span>
                        </p>
                        <p className="text-[9px] text-neutral-400 font-medium mt-0.5">
                          JPEG, PNG, WebP supported. Uploaded via Cloudinary.
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 group h-32 w-full bg-neutral-100">
                      <img
                        src={itemImage}
                        alt="Dish Cover"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleRemoveItemImage}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Remove Image</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggles (Veg/Non-veg, Bestseller, Availability) */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-neutral-150 shadow-xs">
                {/* Veg / Non veg */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-neutral-800 block">
                      Pure Vegetarian Dish
                    </span>
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      Displays green circle dot badge to identify green diet
                      criteria
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemIsVeg}
                      onChange={(e) => setItemIsVeg(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {/* Bestseller Status */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                  <div>
                    <span className="text-xs font-black text-neutral-800 block">
                      Best-Seller Star Status
                    </span>
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      Flags recipe with "🔥 Bestseller" visual ribbon
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemIsBestseller}
                      onChange={(e) => setItemIsBestseller(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>

                {/* Stock availability */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                  <div>
                    <span className="text-xs font-black text-neutral-800 block">
                      Immediate Operational Stock Status
                    </span>
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      Toggle off to immediately stop taking customer orders
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemIsAvailable}
                      onChange={(e) => setItemIsAvailable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange" />
                  </label>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setViewMode("list")}
                  className="flex-1 bg-neutral-150 hover:bg-neutral-200 text-neutral-750 font-black py-3.5 rounded-xl text-xs transition cursor-pointer text-center disabled:opacity-50"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black py-3.5 rounded-xl text-xs transition cursor-pointer text-center shadow-lg shadow-orange-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    editingItem ? "Saving Updates..." : "Publishing..."
                  ) : (
                    editingItem ? "Save Recipe Updates" : "Publish Dish to App"
                  )}
                </button>
              </div>
            </form>

            {/* RIGHT PANEL (40%): THE LIVE PREVIEW HANDSET PANEL */}
            <div className="lg:col-span-5 space-y-4">
              <div className="px-1 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Interactive Live Preview</span>
                </span>
                <span className="text-[9px] font-black text-neutral-300">
                  Device Simulator
                </span>
              </div>

              {/* Mobile Device Mock Frame */}
              <div className="bg-[#0a0a0a] rounded-[36px] p-3.5 shadow-premium border-4 border-neutral-900 max-w-sm mx-auto overflow-hidden relative">
                {/* Speaker pill notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-28 bg-neutral-900 rounded-full z-20 flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-neutral-800 rounded-full" />
                  <div className="w-10 h-1 bg-neutral-800 rounded-full" />
                </div>

                {/* Handset Canvas */}
                <div className="bg-cream-base rounded-[26px] overflow-hidden min-h-[460px] flex flex-col justify-between p-4 pt-6 space-y-4 select-none relative">
                  {/* Status header preview */}
                  <div className="flex justify-between items-center text-[9px] font-black text-neutral-400">
                    <span>10:45 AM</span>
                    <div className="flex items-center gap-1">
                      <span>LTE</span>
                      <span className="h-2.5 w-4.5 bg-neutral-300 rounded-xs inline-block relative border border-neutral-400/20">
                        <span className="absolute left-0 top-0 bottom-0 right-1.5 bg-neutral-800 rounded-2xs" />
                      </span>
                    </div>
                  </div>

                  {/* Header info */}
                  <div className="border-b border-dashed border-neutral-200 pb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">
                        {previewRestaurantName}
                      </span>
                      <span className="text-[9px] font-black text-neutral-400 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5 text-orange-700" />
                        <span>25 mins</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <h4 className="text-[10px] font-black text-neutral-400">
                        Active Cooking Lane
                      </h4>
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* HIGH-FIDELITY ITEM CARD MOCKUP */}
                  <div className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-soft space-y-3 relative overflow-hidden flex flex-col justify-between grow">
                    {/* Bestseller banner inside handset */}
                    {itemIsBestseller && (
                      <div className="absolute top-3 left-0 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-r-lg z-10 flex items-center gap-0.5 shadow-sm">
                        <Flame className="h-2.5 w-2.5" />
                        <span>BESTSELLER</span>
                      </div>
                    )}

                    {/* Dish Preview Image */}
                    <div className="h-32 w-full rounded-xl overflow-hidden relative bg-neutral-100">
                      <img
                        src={
                          itemImage ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400"
                        }
                        className="w-full h-full object-cover transition duration-300"
                        referrerPolicy="no-referrer"
                        alt=""
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400";
                        }}
                      />

                      {/* Veg indicator badge */}
                      <div className="absolute bottom-2.5 right-2.5 bg-white p-1 rounded-md shadow-sm border border-neutral-150 flex items-center justify-center">
                        <span
                          className={`w-2.5 h-2.5 rounded-xs inline-block border ${itemIsVeg ? "bg-emerald-500 border-emerald-600" : "bg-red-500 border-red-600"}`}
                        />
                      </div>

                      {/* Stock availability banner in preview */}
                      {!itemIsAvailable && (
                        <div className="absolute inset-0 bg-neutral-900/75 backdrop-blur-xs flex items-center justify-center text-center p-2">
                          <span className="text-white text-[10px] font-black uppercase tracking-wider bg-red-600 px-3 py-1.5 rounded-lg border border-red-500 shadow-lg">
                            🚫 Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta category */}
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                      <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                        {itemCategory || "Category"}
                      </span>
                      <span className="text-neutral-400">
                        {itemIsVeg ? "Veg" : "Non-Veg"}
                      </span>
                    </div>

                    {/* Title & Description in preview */}
                    <div className="space-y-1">
                      <h3 className="font-black text-neutral-900 text-xs leading-tight">
                        {itemName || "Untitled Recipe"}
                      </h3>
                      <p className="text-[10px] text-neutral-400 font-semibold line-clamp-2 leading-relaxed">
                        {itemDescription ||
                          "No recipe details specified. Craft an engaging text listing primary fresh ingredients, portion sizes, and preparation techniques."}
                      </p>
                    </div>

                    {/* Bottom row: Price & Mock ADD button */}
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-50">
                      <div>
                        <span className="text-[8px] text-neutral-400 font-bold block leading-none">
                          Price tag
                        </span>
                        <span className="text-xs font-mono font-black text-neutral-900">
                          ₹{" "}
                          {Number(itemPrice)
                            ? Number(itemPrice).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!itemIsAvailable}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 transition ${itemIsAvailable ? "bg-brand-orange hover:bg-orange-600 text-white shadow-md shadow-orange-500/10" : "bg-neutral-100 text-neutral-300 border border-neutral-200 cursor-not-allowed"}`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Mock app checkout bar */}
                  <div className="bg-neutral-900 rounded-xl p-2 px-3 flex justify-between items-center text-[9px] font-black text-white shrink-0">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="h-3 w-3 text-orange-700" />
                      <span>1 item in cart</span>
                    </div>
                    <span className="text-orange-700 font-bold flex items-center">
                      <span>View Cart</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational tips footer */}
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl flex items-start gap-2.5 text-[10px] font-semibold text-neutral-500 leading-normal">
                <Info className="h-4.5 w-4.5 text-orange-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black text-neutral-700">
                    Studio Formatting Advice
                  </p>
                  <p>
                    Keep food names concise. Write descriptions mentioning
                    ingredients (like spices, seasoning, oil) to boost your
                    kitchen's search relevance scores inside user search
                    queries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
