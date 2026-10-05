import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  TrendingUp,
  Clock,
  Bell,
  X,
  Award,
  SlidersHorizontal,
  Sparkles,
  Users,
  Image,
  Upload,
  Loader2,
  AlertCircle,
  Grid,
  Ticket,
  HelpCircle,
  Menu,
  LogOut,
  Mail,
  User,
  ShieldCheck,
} from "lucide-react";
import {
  RESTAURANTS,
  saveRestaurantsToStorage,
  DETAILED_OFFERS,
  saveOffersToStorage,
} from "../../data";
import AnalyticsTab from "./AnalyticsTab";
import NotificationsTab from "./NotificationsTab";
import BrandManagementTab from "./BrandManagementTab";
import MenuManagementTab from "./MenuManagementTab";
import OrderManagementTab from "./OrderManagementTab";
import ReportingDashboard from "./ReportingDashboard";
import MarketingTab from "./MarketingTab";
import UsersTab from "./UsersTab";
import DriversTab from "./DriversTab";
import CategoryManagementTab from "./CategoryManagementTab";
import AdminSupportManagementTab from "./AdminSupportManagementTab";
import { adminService } from "../../api/adminService";
import { parseApiError } from "../../api/apiClient";
import {
  normalizeRestaurant,
  dinerService,
  normalizeMenuItem,
  extractImageUrl,
} from "../../api/dinerService";
import { createPortal } from "react-dom";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
export default function AdminDashboard({
  orders,
  setOrders,
  activeOrder,
  setActiveOrder,
  triggerToast,
  setActiveTab,
  notifications,
  setNotifications,
  adminSubTab,
  setAdminSubTab,
  userRole,
  marketingSubTab,
  setMarketingSubTab,
}) {
  const navigate = useNavigate();
  const [localActiveSubTab, setLocalActiveSubTab] = useState(() => {
    return localStorage.getItem("Quikabite_admin_subtab") || "dashboard";
  });
  const activeSubTab = adminSubTab || localActiveSubTab;
  const setActiveSubTab = setAdminSubTab || setLocalActiveSubTab;

  useEffect(() => {
    if (localActiveSubTab) {
      localStorage.setItem("Quikabite_admin_subtab", localActiveSubTab);
    }
  }, [localActiveSubTab]);

  useEffect(() => {
    if (adminSubTab) {
      setLocalActiveSubTab(adminSubTab);
    }
  }, [adminSubTab]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024,
  );
  const { user, logout } = useAuth();
  const adminName = user?.fullName || user?.name || "Executive Admin";
  const adminEmail = user?.email || "admin@quickabite.com";

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    navigate("/home", { replace: true });
    await logout();
    triggerToast("Admin logged out successfully.");
  };
  const [restaurantsList, setRestaurantsList] = useState(() =>
    import.meta.env.VITE_USE_MOCK === "false"
      ? []
      : RESTAURANTS.map(normalizeRestaurant),
  );
  const [isLoadingKitchens, setIsLoadingKitchens] = useState(
    import.meta.env.VITE_USE_MOCK === "false",
  );
  const [couponsList, setCouponsList] = useState(() => [...DETAILED_OFFERS]);
  const [usersCount, setUsersCount] = useState(5);
  const [driversCount, setDriversCount] = useState(4);
  const [couriers, setCouriers] = useState([]);
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const list = await adminService.getDrivers();
        setCouriers(list);
      } catch (e) {
        console.error("Failed to load drivers in AdminDashboard:", e);
      }
    };
    if (activeSubTab === "drivers") {
      loadDrivers();
    }
  }, [activeSubTab]);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const list = await adminService.getAllCoupons();
        if (Array.isArray(list)) {
          setCouponsList(list);
        }
      } catch (e) {
        console.error("Failed to load coupons in AdminDashboard:", e);
      }
    };
    if (activeSubTab === "marketing" || activeSubTab === "offers") {
      loadCoupons();
    }
  }, [activeSubTab]);

  const [restaurantPage, setRestaurantPage] = useState(1);
  const [restaurantLimit, setRestaurantLimit] = useState(10);
  const [restaurantPagination, setRestaurantPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    const loadRestaurants = async () => {
      setIsLoadingKitchens(true);
      try {
        const resData = await dinerService.getRestaurants(null, {
          page: restaurantPage,
          limit: restaurantLimit,
          returnPagination: true,
        });

        let list = [];
        let pag = null;

        if (Array.isArray(resData)) {
          list = resData;
          pag = resData.pagination || {
            total: list.length,
            page: restaurantPage,
            limit: restaurantLimit,
            totalPages: Math.ceil(list.length / restaurantLimit) || 1,
          };
        } else if (resData && Array.isArray(resData.restaurants)) {
          list = resData.restaurants;
          pag = resData.pagination || null;
        }

        if (pag) {
          setRestaurantPagination(pag);
        }

        if (import.meta.env.VITE_USE_MOCK === "false") {
          try {
            const menuData = await dinerService.getAllMenu();
            const allMenus = Array.isArray(menuData)
              ? menuData
              : menuData?.data || menuData?.menu || [];

            const updatedList = list.map((res) => {
              const restaurantMenus = allMenus
                .filter((item) => {
                  const itemResId =
                    item.restaurant?._id ||
                    item.restaurant?.id ||
                    item.restaurant;
                  return (
                    String(itemResId) === String(res._id) ||
                    String(itemResId) === String(res.id) ||
                    (res.slug && String(itemResId) === String(res.slug))
                  );
                })
                .map((item) => normalizeMenuItem(item));
              return {
                ...res,
                menu:
                  restaurantMenus.length > 0 ? restaurantMenus : res.menu || [],
              };
            });
            setRestaurantsList(updatedList);
          } catch (menuErr) {
            console.error("Failed to load menus in AdminDashboard:", menuErr);
            setRestaurantsList(list);
          }
        } else {
          setRestaurantsList(list);
        }
      } catch (e) {
        console.error("Failed to load restaurants in AdminDashboard:", e);
      } finally {
        setIsLoadingKitchens(false);
      }
    };
    if (
      import.meta.env.VITE_USE_MOCK === "false" &&
      (activeSubTab === "restaurants" ||
        activeSubTab === "menu" ||
        activeSubTab === "overview" ||
        !activeSubTab)
    ) {
      loadRestaurants();
    }
  }, [activeSubTab, restaurantPage, restaurantLimit]);
  const [showAddResModal, setShowAddResModal] = useState(false);
  const [editingRes, setEditingRes] = useState(null);
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);
  const [resFormError, setResFormError] = useState("");
  const [newResName, setNewResName] = useState("");
  const [newResCuisines, setNewResCuisines] = useState("");
  const [newResTime, setNewResTime] = useState("20-25 mins");
  const [newResFee, setNewResFee] = useState("0");
  const [newResAddress, setNewResAddress] = useState("");
  const [newResImage, setNewResImage] = useState("");
  const [resImageFile, setResImageFile] = useState(null);
  const [resDragActive, setResDragActive] = useState(false);
  const [newResCity, setNewResCity] = useState("");
  const [newResLandmark, setNewResLandmark] = useState("");
  const [newResContact, setNewResContact] = useState("");
  const [newResRadius, setNewResRadius] = useState(10);
  const [newResIsActive, setNewResIsActive] = useState(true);
  const [newResLongitude, setNewResLongitude] = useState(0);
  const [newResLatitude, setNewResLatitude] = useState(0);
  const [newResMapsUrl, setNewResMapsUrl] = useState("");
  const [newResIsFreeDelivery, setNewResIsFreeDelivery] = useState(true);
  const [newResOperatingHours, setNewResOperatingHours] = useState([
    { day: "Mon", openTime: "09:00", closeTime: "23:00", isClosed: false },
    { day: "Tue", openTime: "09:00", closeTime: "23:00", isClosed: false },
    { day: "Wed", openTime: "09:00", closeTime: "23:00", isClosed: false },
    { day: "Thu", openTime: "09:00", closeTime: "23:00", isClosed: false },
    { day: "Fri", openTime: "09:00", closeTime: "23:00", isClosed: false },
    { day: "Sat", openTime: "09:00", closeTime: "23:00", isClosed: false },
    { day: "Sun", openTime: "09:00", closeTime: "23:00", isClosed: false },
  ]);

  const handleResDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setResDragActive(true);
    } else if (e.type === "dragleave") {
      setResDragActive(false);
    }
  };

  const processSingleResFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setResImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewResImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSingleResFile(e.dataTransfer.files[0]);
    }
  };

  const handleResPhotoUpload = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processSingleResFile(files[0]);
    }
  };

  const handleRemoveResImage = () => {
    setResImageFile(null);
    setNewResImage("");
  };

  const handleMapsUrlChange = (url) => {
    setNewResMapsUrl(url);
    if (!url) {
      setNewResLatitude(0);
      setNewResLongitude(0);
      return;
    }

    // 1. Try to extract from !3dLat!4dLng parameter (highest accuracy for exact place pins)
    const placeMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (placeMatch) {
      const lat = Number(placeMatch[1]);
      const lng = Number(placeMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setNewResLatitude(lat);
        setNewResLongitude(lng);
        triggerToast("Coordinates parsed from Maps URL successfully!");
        return;
      }
    }

    // 2. Try to extract any general lat,lng pair in the URL (e.g. @lat,lng, q=lat,lng, or /lat,lng)
    // We match any pattern like: latitude,longitude (both decimal numbers)
    const generalMatches = [...url.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)];
    for (const match of generalMatches) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      // Verify if they are within valid latitude & longitude bounds
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setNewResLatitude(lat);
        setNewResLongitude(lng);
        triggerToast("Coordinates parsed from Maps URL successfully!");
        return;
      }
    }

    // 3. Check if it's a known shortener link
    if (
      url.includes("share.google") ||
      url.includes("maps.app.goo.gl") ||
      url.includes("goo.gl/maps")
    ) {
      triggerToast(
        "Shortened links do not contain coordinates. Please open it in a browser first, wait for the redirect, and copy the resolved full URL.",
      );
      return;
    }
  };

  const handleOpenEditResModal = async (restaurant) => {
    const initialNorm = normalizeRestaurant(restaurant);
    setEditingRes(initialNorm);
    setIsSubmittingRes(false);
    setResFormError("");
    setNewResName(initialNorm.name);
    setNewResCuisines(initialNorm.cuisines.join(", "));
    setNewResTime(initialNorm.deliveryTime);
    setNewResFee(String(initialNorm.deliveryFee ?? 0));
    setNewResAddress(initialNorm.address);
    setNewResLandmark(
      initialNorm.addressObj?.landmark || initialNorm.landmark || "",
    );
    setNewResImage(initialNorm.image);
    setNewResCity(initialNorm.city || "");
    setNewResContact(initialNorm.contactNumber || "");
    setNewResRadius(initialNorm.deliveryRadiusKm ?? 10);
    setNewResIsActive(initialNorm.isActive ?? true);
    setNewResLongitude(initialNorm.coordinates?.x || 0);
    setNewResLatitude(initialNorm.coordinates?.y || 0);
    setNewResMapsUrl("");
    setNewResIsFreeDelivery(
      initialNorm.isFreeDelivery ?? Number(initialNorm.deliveryFee) === 0,
    );
    setNewResOperatingHours(
      Array.isArray(initialNorm.operatingHours) &&
        initialNorm.operatingHours.length > 0
        ? initialNorm.operatingHours.map((oh) => ({
          day: oh.day,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
          isClosed: !!oh.isClosed,
          _id: oh._id,
        }))
        : [
          {
            day: "Mon",
            openTime: "09:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            day: "Tue",
            openTime: "09:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            day: "Wed",
            openTime: "09:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            day: "Thu",
            openTime: "09:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            day: "Fri",
            openTime: "09:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            day: "Sat",
            openTime: "09:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            day: "Sun",
            openTime: "09:00",
            closeTime: "23:00",
            isClosed: false,
          },
        ],
    );
    setShowAddResModal(true);
  };

  const closeAddResModal = () => {
    setShowAddResModal(false);
    setEditingRes(null);
    setIsSubmittingRes(false);
    setResFormError("");
    setNewResName("");
    setNewResCuisines("");
    setNewResTime("20-25 mins");
    setNewResFee("0");
    setNewResAddress("");
    setNewResLandmark("");
    setNewResImage("");
    setResImageFile(null);
    setResDragActive(false);
    setNewResCity("");
    setNewResContact("");
    setNewResRadius(10);
    setNewResIsActive(true);
    setNewResLongitude(0);
    setNewResLatitude(0);
    setNewResMapsUrl("");
    setNewResIsFreeDelivery(true);
    setNewResOperatingHours([
      { day: "Mon", openTime: "09:00", closeTime: "23:00", isClosed: false },
      { day: "Tue", openTime: "09:00", closeTime: "23:00", isClosed: false },
      { day: "Wed", openTime: "09:00", closeTime: "23:00", isClosed: false },
      { day: "Thu", openTime: "09:00", closeTime: "23:00", isClosed: false },
      { day: "Fri", openTime: "09:00", closeTime: "23:00", isClosed: false },
      { day: "Sat", openTime: "09:00", closeTime: "23:00", isClosed: false },
      { day: "Sun", openTime: "09:00", closeTime: "23:00", isClosed: false },
    ]);
  };

  const [selectedResIdForMenu, setSelectedResIdForMenu] = useState(null);
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [newDishDesc, setNewDishDesc] = useState("");
  const [newDishCategory, setNewDishCategory] = useState("");
  const [newDishIsVeg, setNewDishIsVeg] = useState(false);
  const [newDishIsBestseller, setNewDishIsBestseller] = useState(false);
  const [newDishImage, setNewDishImage] = useState("");
  const [newDishImageFile, setNewDishImageFile] = useState(null);
  const [dishDragActive, setDishDragActive] = useState(false);

  const handleDishDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDishDragActive(true);
    } else if (e.type === "dragleave") {
      setDishDragActive(false);
    }
  };

  const processSingleDishFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setNewDishImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewDishImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDishDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDishDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSingleDishFile(e.dataTransfer.files[0]);
    }
  };

  const handleDishPhotoUpload = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processSingleDishFile(files[0]);
    }
  };

  const handleRemoveDishImage = () => {
    setNewDishImageFile(null);
    setNewDishImage("");
  };
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponTitle, setNewCouponTitle] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("");
  const [newCouponDesc, setNewCouponDesc] = useState("");
  const [newCouponMinOrder, setNewCouponMinOrder] = useState("");
  const [newCouponCategory, setNewCouponCategory] = useState("wallet");
  const [selectedResIdForOffer, setSelectedResIdForOffer] = useState(null);
  const [newOfferText, setNewOfferText] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const activeKitchen = restaurantsList.find(
    (r) => r.id === selectedResIdForMenu,
  );
  const handleAddRestaurantSubmit = async (e) => {
    e.preventDefault();
    setResFormError("");

    if (!newResName || !newResCuisines || !newResAddress) {
      const msg = "Please fill out all required fields (Name, Cuisines, Address).";
      setResFormError(msg);
      triggerToast(msg);
      return;
    }

    // Validation for Fee: max character length <= 3, digits only
    const feeStr = String(newResFee).trim();
    if (!/^\d{1,3}$/.test(feeStr)) {
      const msg = "Delivery fee must be a number up to 3 digits.";
      setResFormError(msg);
      triggerToast(msg);
      return;
    }

    // Validation for Operating Hours time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const oh of newResOperatingHours) {
      if (!oh.isClosed) {
        if (!oh.openTime || !oh.closeTime) {
          const msg = `Please enter open and close times for ${oh.day}.`;
          setResFormError(msg);
          triggerToast(msg);
          return;
        }
        if (!timeRegex.test(oh.openTime) || !timeRegex.test(oh.closeTime)) {
          const msg = `Invalid time format for ${oh.day}. Please use HH:MM format.`;
          setResFormError(msg);
          triggerToast(msg);
          return;
        }
      }
    }

    if (!editingRes && !resImageFile && !newResImage) {
      const msg = "Image is required. Please select or upload a kitchen cover image.";
      setResFormError(msg);
      triggerToast(msg);
      return;
    }

    const cuisinesArr = newResCuisines
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const targetResData = {
      name: newResName,
      slug: editingRes?.slug || newResName.toLowerCase().replace(/\s+/g, "-"),
      image:
        newResImage ||
        "https://images.unsplash.com/photo-1526779259212-939e64788e3c?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZnJlZSUyMGltYWdlc3xlbnwwfHwwfHx8MA%3D%3D",
      tags: cuisinesArr,
      cuisines: cuisinesArr,
      cookingLeadTime: newResTime,
      deliveryTime: newResTime,
      deliveryFee: Number(newResFee) || 0,
      isFreeDelivery: !!newResIsFreeDelivery,
      city: newResCity || "Jaipur",
      address: {
        fullAddress: newResAddress,
        landmark: newResLandmark,
      },
      location: {
        type: "Point",
        coordinates: [
          Number(newResLongitude) || 0,
          Number(newResLatitude) || 0,
        ],
      },
      coordinates: {
        x: Number(newResLongitude) || 0,
        y: Number(newResLatitude) || 0,
      },
      contactNumber: newResContact,
      averageRating: editingRes?.rating || 4.5,
      rating: editingRes?.rating || 4.5,
      totalReviews: editingRes
        ? editingRes.totalReviews || editingRes.reviewsCount || 0
        : Math.floor(Math.random() * 200) + 15,
      reviewsCount: editingRes
        ? editingRes.reviewsCount || editingRes.totalReviews || 0
        : Math.floor(Math.random() * 200) + 15,
      deliveryRadiusKm: Number(newResRadius) || 10,
      isActive: newResIsActive,
      operatingHours: newResOperatingHours,
    };

    setIsSubmittingRes(true);

    try {
      if (editingRes) {
        // EDIT MODE
        const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
        if (USE_MOCK) {
          const updated = restaurantsList.map((r) => {
            if (r.id === editingRes.id || r._id === editingRes._id) {
              return normalizeRestaurant({
                ...r,
                ...targetResData,
              });
            }
            return r;
          });
          setRestaurantsList(updated);
          saveRestaurantsToStorage(updated);
          triggerToast(`Restaurant "${newResName}" updated successfully!`);
          closeAddResModal();
        } else {
          const formDataPayload = new FormData();
          if (resImageFile) {
            formDataPayload.append("image", resImageFile);
          } else if (newResImage) {
            formDataPayload.append("image", newResImage);
          }
          formDataPayload.append("name", targetResData.name);
          formDataPayload.append("city", targetResData.city);
          formDataPayload.append(
            "address",
            JSON.stringify({
              fullAddress: targetResData.address.fullAddress,
              landmark: targetResData.address.landmark || "",
            }),
          );
          formDataPayload.append(
            "contactNumber",
            targetResData.contactNumber || "",
          );
          formDataPayload.append(
            "deliveryFee",
            String(targetResData.deliveryFee),
          );
          formDataPayload.append(
            "isFreeDelivery",
            String(targetResData.isFreeDelivery),
          );
          formDataPayload.append(
            "cookingLeadTime",
            targetResData.cookingLeadTime,
          );
          formDataPayload.append(
            "deliveryRadiusKm",
            String(targetResData.deliveryRadiusKm),
          );
          formDataPayload.append(
            "location",
            JSON.stringify(targetResData.location),
          );
          formDataPayload.append(
            "operatingHours",
            JSON.stringify(
              targetResData.operatingHours.map((oh) => ({
                day: oh.day,
                openTime: oh.openTime,
                closeTime: oh.closeTime,
                isClosed: !!oh.isClosed,
              })),
            ),
          );
          formDataPayload.append("tags", JSON.stringify(targetResData.tags));
          formDataPayload.append("isActive", String(targetResData.isActive));

          const resId = editingRes._id || editingRes.id;
          const responseData = await adminService.updateRestaurant(
            resId,
            formDataPayload,
          );

          if (responseData && responseData.success === false) {
            const errMsg = parseApiError(responseData, "Failed to update restaurant on server.");
            setResFormError(errMsg);
            triggerToast(errMsg);
            return;
          }

          let apiRes = responseData;
          if (responseData && responseData.data) {
            apiRes = responseData.data;
          } else if (responseData && responseData.restaurant) {
            apiRes = responseData.restaurant;
          }

          const updatedRes = normalizeRestaurant({
            ...targetResData,
            ...apiRes,
            id: apiRes.id || apiRes.slug || apiRes._id || targetResData.slug,
            _id: apiRes._id || apiRes.id || targetResData._id,
          });

          const updated = restaurantsList.map((r) => {
            if (r.id === editingRes.id || r._id === editingRes._id) {
              return updatedRes;
            }
            return r;
          });

          setRestaurantsList(updated);
          saveRestaurantsToStorage(updated);
          triggerToast(
            `Restaurant "${newResName}" updated successfully on server!`,
          );
          closeAddResModal();
        }
      } else {
        // ADD MODE
        const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
        if (USE_MOCK) {
          const newRes = normalizeRestaurant({
            id: targetResData.slug,
            _id: `res-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin",
            menu: [],
            discount: "No discount",
            ...targetResData,
          });
          const updated = [newRes, ...restaurantsList];
          setRestaurantsList(updated);
          saveRestaurantsToStorage(updated);
          triggerToast(`Restaurant "${newResName}" registered live!`);
          closeAddResModal();
        } else {
          const formDataPayload = new FormData();
          if (resImageFile) {
            formDataPayload.append("image", resImageFile);
          } else if (newResImage) {
            formDataPayload.append("image", newResImage);
          }
          formDataPayload.append("name", targetResData.name);
          formDataPayload.append("city", targetResData.city);
          formDataPayload.append(
            "address",
            JSON.stringify({
              fullAddress: targetResData.address.fullAddress,
              landmark: targetResData.address.landmark || "",
            }),
          );
          formDataPayload.append(
            "contactNumber",
            targetResData.contactNumber || "",
          );
          formDataPayload.append(
            "deliveryFee",
            String(targetResData.deliveryFee),
          );
          formDataPayload.append(
            "isFreeDelivery",
            String(targetResData.isFreeDelivery),
          );
          formDataPayload.append(
            "cookingLeadTime",
            targetResData.cookingLeadTime,
          );
          formDataPayload.append(
            "deliveryRadiusKm",
            String(targetResData.deliveryRadiusKm),
          );
          formDataPayload.append(
            "location",
            JSON.stringify(targetResData.location),
          );
          formDataPayload.append(
            "operatingHours",
            JSON.stringify(
              targetResData.operatingHours.map((oh) => ({
                day: oh.day,
                openTime: oh.openTime,
                closeTime: oh.closeTime,
                isClosed: !!oh.isClosed,
              })),
            ),
          );
          formDataPayload.append("tags", JSON.stringify(targetResData.tags));
          formDataPayload.append("isActive", String(targetResData.isActive));

          const responseData =
            await adminService.addRestaurant(formDataPayload);

          if (responseData && responseData.success === false) {
            const errMsg = parseApiError(responseData, "Failed to register restaurant on server.");
            setResFormError(errMsg);
            triggerToast(errMsg);
            return;
          }

          let apiRes = responseData;
          if (responseData && responseData.data) {
            apiRes = responseData.data;
          } else if (responseData && responseData.restaurant) {
            apiRes = responseData.restaurant;
          }

          const newRes = normalizeRestaurant({
            ...targetResData,
            ...apiRes,
            id: apiRes.id || apiRes.slug || apiRes._id || targetResData.slug,
            _id: apiRes._id || apiRes.id || targetResData._id,
          });

          const updated = [newRes, ...restaurantsList];
          setRestaurantsList(updated);
          saveRestaurantsToStorage(updated);
          triggerToast(`Restaurant "${newResName}" registered live on server!`);
          closeAddResModal();
        }
      }
    } catch (error) {
      console.error("Failed to register/update restaurant via API:", error);
      const errMsg = parseApiError(error, "Failed to register restaurant on server.");
      setResFormError(errMsg);
      triggerToast(errMsg);
    } finally {
      setIsSubmittingRes(false);
    }
  };
  const handleDeleteRestaurant = (id, name) => {
    if (
      confirm(
        `Are you sure you want to decommission the partner kitchen "${name}"? This will remove all its menu items.`,
      )
    ) {
      const updated = restaurantsList.filter((r) => r.id !== id);
      setRestaurantsList(updated);
      saveRestaurantsToStorage(updated);
      if (selectedResIdForMenu === id) setSelectedResIdForMenu(null);
      if (selectedResIdForOffer === id) setSelectedResIdForOffer(null);
      triggerToast(`Restaurant "${name}" decommissioned.`);
    }
  };
  const handleAddDishSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResIdForMenu) return;
    if (!newDishName || !newDishPrice || !newDishCategory) {
      triggerToast("Please fill out all required fields.");
      return;
    }
    const priceNum = Number(newDishPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      triggerToast("Please enter a valid price.");
      return;
    }

    const matchedRes = restaurantsList.find(
      (r) => r.id === selectedResIdForMenu || r._id === selectedResIdForMenu,
    );
    const restaurantDbId = matchedRes
      ? matchedRes._id || matchedRes.id
      : selectedResIdForMenu;

    let newDish = null;
    if (import.meta.env.VITE_USE_MOCK === "false") {
      const formDataPayload = new FormData();
      if (newDishImageFile) {
        formDataPayload.append("image", newDishImageFile);
      } else if (newDishImage) {
        formDataPayload.append("image", newDishImage);
      }
      formDataPayload.append("restaurant", restaurantDbId);
      formDataPayload.append("name", newDishName);
      formDataPayload.append("description", newDishDesc || "");
      formDataPayload.append("category", newDishCategory);
      formDataPayload.append("price", String(priceNum));
      formDataPayload.append("isVegetarian", String(newDishIsVeg));
      formDataPayload.append("isBestSeller", String(newDishIsBestseller));
      formDataPayload.append("isAvailable", "true");
      formDataPayload.append("isActive", "true");

      try {
        const response = await adminService.createMenu(formDataPayload);
        const createdDish =
          response?.data || response?.menuItem || response || {};
        const dishImg =
          typeof createdDish.image === "string"
            ? createdDish.image
            : createdDish.image?.secure_url ||
            createdDish.image?.url ||
            newDishImage;
        newDish = {
          id: createdDish._id || createdDish.id || `dish-${Date.now()}`,
          _id: createdDish._id || createdDish.id,
          name: createdDish.name || newDishName,
          price:
            createdDish.price !== undefined
              ? Number(createdDish.price)
              : priceNum,
          category: createdDish.category || newDishCategory,
          description: createdDish.description || newDishDesc,
          image: dishImg,
          isVeg:
            createdDish.isVegetarian !== undefined
              ? createdDish.isVegetarian
              : newDishIsVeg,
          isBestseller:
            createdDish.isBestSeller !== undefined
              ? createdDish.isBestSeller
              : newDishIsBestseller,
          isAvailable: true,
        };
      } catch (err) {
        console.error("Failed to add dish recipe via API:", err);
        triggerToast(
          "Failed to add dish recipe to server: " +
          (err.response?.data?.message || err.message),
        );
        return;
      }
    } else {
      newDish = {
        id: `dish-${Date.now()}`,
        name: newDishName,
        price: priceNum,
        description: newDishDesc,
        image:
          newDishImage ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
        isVeg: newDishIsVeg,
        isBestseller: newDishIsBestseller,
        category: newDishCategory,
      };
    }

    const updated = restaurantsList.map((r) => {
      if (r.id === selectedResIdForMenu || r._id === selectedResIdForMenu) {
        return { ...r, menu: [newDish, ...r.menu] };
      }
      return r;
    });
    setRestaurantsList(updated);
    saveRestaurantsToStorage(updated);
    triggerToast(`Added "${newDishName}" to menu.`);
    setNewDishName("");
    setNewDishPrice("");
    setNewDishDesc("");
    setNewDishCategory("");
    setNewDishImage("");
    setNewDishImageFile(null);
    setDishDragActive(false);
    setNewDishIsVeg(false);
    setNewDishIsBestseller(false);
    setShowAddDishModal(false);
  };
  const handleDeleteDish = (dishId, dishName) => {
    if (!selectedResIdForMenu) return;
    const updated = restaurantsList.map((r) => {
      if (r.id === selectedResIdForMenu) {
        return { ...r, menu: r.menu.filter((d) => d.id !== dishId) };
      }
      return r;
    });
    setRestaurantsList(updated);
    saveRestaurantsToStorage(updated);
    triggerToast(`Dish "${dishName}" deleted from menu.`);
  };
  const handleUpdateRestaurantOffer = async (e) => {
    e.preventDefault();
    if (!selectedResIdForOffer || !newOfferText) {
      triggerToast("Select a kitchen and enter offer text.");
      return;
    }
    const targetRes = restaurantsList?.find((r) => String(r.id) === String(selectedResIdForOffer) || String(r._id) === String(selectedResIdForOffer));
    const resName = targetRes?.name || "Kitchen";
    const cleanCode = (resName.replace(/[^a-zA-Z]/g, "").slice(0, 5) + "OFF").toUpperCase();

    const couponPayload = {
      code: cleanCode,
      campaignCategory: "RESTAURANT",
      bannerTitle: `${resName} - ${newOfferText}`,
      discountLabel: newOfferText,
      discountType: newOfferText.includes("%") ? "percentage" : "flat",
      discountValue: parseFloat(newOfferText.replace(/\D/g, "")) || 20,
      maximumDiscount: 100,
      minimumOrderAmount: 150,
      policyText: `Special promotion for ${resName}: ${newOfferText}`,
      usageLimit: 100,
      usageLimitPerUser: 1,
      validFrom: new Date().toISOString(),
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      restaurant: selectedResIdForOffer,
    };

    try {
      await adminService.createCoupon(couponPayload);
    } catch (err) {
      console.warn("Notice: Failed to push restaurant coupon to /v1/coupons:", err?.message || err);
    }

    const updated = restaurantsList.map((r) => {
      if (String(r.id) === String(selectedResIdForOffer) || String(r._id) === String(selectedResIdForOffer)) {
        return { ...r, discount: newOfferText };
      }
      return r;
    });
    setRestaurantsList(updated);
    saveRestaurantsToStorage(updated);
    triggerToast(
      `Updated offer badge & published promo coupon for "${resName}" to "${newOfferText}"`,
    );
    setNewOfferText("");
  };
  const handleAddCouponSubmit = async (e) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponTitle || !newCouponDiscount) {
      triggerToast("Please fill out all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("code", newCouponCode.toUpperCase().replace(/\s+/g, ""));
    formData.append("campaignCategory", newCouponCategory === "bank" ? "BANK" : newCouponCategory === "festival" ? "FESTIVAL" : "STANDARD");
    formData.append("bannerTitle", newCouponTitle);
    formData.append("discountLabel", newCouponDiscount);
    formData.append("discountType", newCouponDiscount.includes("%") ? "percentage" : "flat");
    formData.append("discountValue", String(parseFloat(newCouponDiscount.replace(/\D/g, "")) || 50));
    formData.append("maximumDiscount", "100");
    formData.append("minimumOrderAmount", String(Number(newCouponMinOrder) || 200));
    if (newCouponDesc) formData.append("policyText", newCouponDesc);
    formData.append("usageLimit", "100");
    formData.append("usageLimitPerUser", "1");
    formData.append("validFrom", new Date().toISOString());
    formData.append("validTill", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
    formData.append("isActive", "true");

    try {
      const created = await adminService.createCoupon(formData);
      const updated = [created, ...couponsList];
      setCouponsList(updated);
      saveOffersToStorage(updated);
      triggerToast(`Promo Code "${newCouponCode.toUpperCase()}" published live via api/v1/coupons!`);
      setNewCouponCode("");
      setNewCouponTitle("");
      setNewCouponDiscount("");
      setNewCouponDesc("");
      setNewCouponMinOrder("");
      setShowAddCouponModal(false);
    } catch (err) {
      console.error("Failed to create coupon:", err);
      triggerToast(err.response?.data?.message || "Failed to publish promo code.");
    }
  };
  const handleDeleteCoupon = (id, code) => {
    const updated = couponsList.filter((c) => c.id !== id);
    setCouponsList(updated);
    saveOffersToStorage(updated);
    triggerToast(`Coupon Code "${code}" suspended.`);
  };
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    setOrders(updated);
    triggerToast(
      `Order #${orderId.slice(-6).toUpperCase()} status updated to "${newStatus.replace(/_/g, " ").toUpperCase()}"`,
    );
  };
  const handleAssignCourier = (orderId, courierId) => {
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier) return;
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        triggerToast(
          `Assigned courier ${courier.name} to Order #${orderId.slice(-6).toUpperCase()}`,
        );
        return {
          ...o,
          status: "out_for_delivery",
          driverName: courier.name,
          driverPhone: courier.phone,
        };
      }
      return o;
    });
    setOrders(updated);
  };
  const filteredOrders = orders.filter(
    (o) => orderFilter === "all" || o.status === orderFilter,
  );
  return (
    <>
      <div
        className="min-h-[calc(100vh-4rem)] w-full bg-cream-base flex font-sans relative overflow-x-hidden"
        id="admin-workspace-pane"
      >
        {/* MOBILE BACKDROP OVERLAY */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] lg:hidden cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ADMIN SIDEBAR SLIDER DRAWER */}
        <aside
          className={`fixed lg:sticky top-0 h-screen z-[100] bg-white text-neutral-900 border-r border-neutral-200/80 flex flex-col transition-all duration-300 ease-in-out shrink-0 shadow-2xl lg:shadow-none ${
            isSidebarOpen
              ? "w-72 translate-x-0"
              : "-translate-x-full lg:translate-x-0 lg:w-20"
          }`}
          id="admin-sidebar-drawer"
        >
          {/* Sidebar Header & Brand Badge */}
          <div className="p-4 border-b border-neutral-150 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-brand-orange to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-orange-500/20 shrink-0">
                <ChefHat className="w-5 h-5 text-white animate-pulse" />
              </div>
              {isSidebarOpen && (
                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-display font-black text-base text-neutral-900 tracking-tight leading-none truncate">
                    Quickaa Bite
                  </h3>
                  <span className="text-[9px] font-mono font-black text-orange-700 uppercase tracking-widest block">
                    Admin Portal
                  </span>
                </div>
              )}
            </div>

            {/* TOGGLE BUTTON INSIDE SLIDER HEADER */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition cursor-pointer shrink-0"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* SIDEBAR NAVIGATION ITEMS SLIDER LIST */}
          <div className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
            {[
              {
                id: "dashboard",
                route: "/admin/dashboard",
                label: "Dashboard",
                icon: TrendingUp,
              },
              {
                id: "BIreporting",
                route: "/admin/BIreporting",
                label: "BI & Reporting",
                icon: Sparkles,
              },
              {
                id: "support-tickets",
                route: "/admin/support-tickets",
                label: "Support Tickets",
                icon: HelpCircle,
              },
              {
                id: "brands",
                route: "/admin/brands",
                label: "Virtual Brands",
                icon: Award,
              },
              {
                id: "marketing",
                route: "/admin/marketing",
                label: "Marketing Hub",
                icon: Ticket,
              },
              {
                id: "orders",
                route: "/admin/orders",
                label: "Orders",
                icon: Clock,
              },
              {
                id: "categories",
                route: "/admin/categories",
                label: "Categories",
                icon: Grid,
              },
              {
                id: "restaurants",
                route: "/admin/restaurants",
                label: "Menu Management",
                icon: SlidersHorizontal,
              },
              { id: "users", route: "/admin/users", label: "Users Directory", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected =
                activeSubTab === tab.id ||
                (tab.id === "dashboard" && activeSubTab === "overview") ||
                (tab.id === "BIreporting" && activeSubTab === "reports");
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "marketing" && setMarketingSubTab) {
                      setMarketingSubTab("coupons");
                    }
                    setActiveSubTab(tab.id);
                    navigate(tab.route);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full px-3.5 py-3 rounded-2xl font-bold text-xs transition-all duration-200 flex items-center gap-3 cursor-pointer select-none active:scale-[0.98] ${
                    isSelected
                      ? "bg-brand-orange text-white shadow-md shadow-orange-500/20 font-black"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  } ${!isSidebarOpen ? "justify-center px-0" : ""}`}
                  title={tab.label}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-white" : "text-neutral-500"}`} />
                  {isSidebarOpen && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </div>

          {/* SIDEBAR FOOTER (LOGOUT) */}
          <div className="p-3 border-t border-neutral-150 shrink-0 bg-white">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs ${
                !isSidebarOpen ? "px-0" : ""
              }`}
              title="Logout Securely"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-600" />
              {isSidebarOpen && <span>Logout Securely</span>}
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE VIEWPORT AREA */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6 space-y-6">
          {/* WORKSPACE TOP CONTROL BAR */}
          <div className="sticky top-2 z-20 bg-white p-3.5 sm:p-4 rounded-3xl shadow-xs border border-neutral-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer flex items-center justify-center border border-neutral-200 shrink-0"
                title="Toggle Sidebar Menu"
              >
                <Menu className="w-5 h-5 text-neutral-900" />
              </button>
              <div className="min-w-0">
                <h2 className="font-display font-black text-sm sm:text-base text-neutral-900 tracking-tight flex items-center gap-2 truncate">
                  <span>Quickaa Bite administration</span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium truncate">
                  Active View: <span className="font-bold text-orange-700 uppercase">{activeSubTab}</span>
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-900 block">{adminName}</span>
                <span className="text-[10px] text-neutral-400 font-mono">{adminEmail}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-brand-orange flex items-center justify-center font-black text-xs border border-neutral-800">
                {adminName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* VIEWPORT AREA WITH ANIMATION */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* 1. OPERATIONAL ANALYTICS / DASHBOARD */}
              {(activeSubTab === "dashboard" || activeSubTab === "overview") && (
                <AnalyticsTab
                  orders={orders}
                  restaurantsCount={restaurantsList.length}
                  usersCount={usersCount}
                  driversCount={driversCount}
                  setOrders={setOrders}
                  triggerToast={triggerToast}
                  onNavigateSubTab={(targetTabId) => {
                    setActiveSubTab(targetTabId);
                    navigate(`/admin/${targetTabId}`);
                  }}
                />
              )}

              {/* BI & REPORTING DASHBOARD */}
              {(activeSubTab === "BIreporting" || activeSubTab === "reports") && (
                <ReportingDashboard
                  orders={orders}
                  triggerToast={triggerToast}
                />
              )}

              {/* GLOBAL SUPPORT TICKETS & USER AUDIT */}
              {activeSubTab === "support-tickets" && (
                <AdminSupportManagementTab triggerToast={triggerToast} />
              )}

              {/* CATEGORIES MANAGEMENT TAB */}
              {activeSubTab === "categories" && (
                <CategoryManagementTab triggerToast={triggerToast} />
              )}

              {/* 1.5 VIRTUAL KITCHEN BRANDS */}
              {activeSubTab === "brands" && (
                <BrandManagementTab
                  orders={orders}
                  triggerToast={triggerToast}
                />
              )}

              {/* 2. ORDERS DISPATCHER */}
              {activeSubTab === "orders" && (
                <OrderManagementTab
                  orders={orders}
                  setOrders={setOrders}
                  couriers={couriers}
                  setCouriers={setCouriers}
                  restaurantsList={restaurantsList}
                  triggerToast={triggerToast}
                />
              )}

              {/* 3. MENU & KITCHENS MANAGEMENT */}
              {activeSubTab === "restaurants" && (
                <MenuManagementTab
                  restaurantsList={restaurantsList}
                  setRestaurantsList={setRestaurantsList}
                  saveRestaurantsToStorage={saveRestaurantsToStorage}
                  triggerToast={triggerToast}
                  isLoadingKitchens={isLoadingKitchens}
                  onAddRestaurantClick={() => {
                    setEditingRes(null);
                    setIsSubmittingRes(false);
                    setResFormError("");
                    setNewResName("");
                    setNewResCuisines("");
                    setNewResTime("20-25 mins");
                    setNewResFee("0");
                    setNewResAddress("");
                    setNewResLandmark("");
                    setNewResImage();
                    setNewResCity("Jaipur");
                    setNewResContact("");
                    setNewResRadius(10);
                    setNewResIsActive(true);
                    setNewResLongitude(0);
                    setNewResLatitude(0);
                    setNewResMapsUrl("");
                    setShowAddResModal(true);
                  }}
                  onEditRestaurantClick={handleOpenEditResModal}
                  onDeleteRestaurantClick={handleDeleteRestaurant}
                  restaurantPagination={restaurantPagination}
                  restaurantPage={restaurantPage}
                  setRestaurantPage={setRestaurantPage}
                  restaurantLimit={restaurantLimit}
                  setRestaurantLimit={setRestaurantLimit}
                />
              )}

              {/* 4. MARKETING HUB */}
              {activeSubTab === "marketing" && (
                <MarketingTab
                  triggerToast={triggerToast}
                  activeSubTab={marketingSubTab}
                  setActiveSubTab={setMarketingSubTab}
                  restaurantsList={restaurantsList}
                  setRestaurantsList={setRestaurantsList}
                  saveRestaurantsToStorage={saveRestaurantsToStorage}
                  couponsList={couponsList}
                  setCouponsList={setCouponsList}
                  saveOffersToStorage={saveOffersToStorage}
                />
              )}

              {/* 5. USERS DIRECTORY */}
              {activeSubTab === "users" && (
                <UsersTab
                  onUsersChange={setUsersCount}
                  triggerToast={triggerToast}
                />
              )}

              {/* 9. PUSH CENTER */}
              {activeSubTab === "notifications" && (
                <NotificationsTab
                  notifications={notifications}
                  setNotifications={setNotifications}
                  triggerToast={triggerToast}
                />
              )}

              {(activeSubTab === "issues" || activeSubTab === "support") && (
                <AdminSupportManagementTab triggerToast={triggerToast} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

          {/* MODAL: ADD/EDIT KITCHEN OUTLET */}
          <Modal isOpen={showAddResModal} onClose={closeAddResModal} maxWidth="max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950">
                {editingRes ? "Edit Partner Kitchen" : "Register Partner Kitchen"}
              </h3>
              <button onClick={closeAddResModal} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {resFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn shrink-0">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-semibold leading-tight">{resFormError}</div>
              </div>
            )}

            <form
              onSubmit={handleAddRestaurantSubmit}
              className="flex flex-col h-full overflow-hidden"
            >
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 pb-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                    Kitchen Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newResName}
                    onChange={(e) => setNewResName(e.target.value)}
                    placeholder="e.g. ZAM ZAM Jaipur"
                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                    Cuisine tags (comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newResCuisines}
                    onChange={(e) => setNewResCuisines(e.target.value)}
                    placeholder="Mandi, Arabic, Biryani, Grill"
                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Cooking Lead Time *
                    </label>
                    <input
                      type="text"
                      required
                      value={newResTime}
                      onChange={(e) => setNewResTime(e.target.value)}
                      placeholder="25-30 mins"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Fee (₹)
                    </label>
                    <input
                      type="text"
                      required
                      disabled={newResIsFreeDelivery}
                      value={newResIsFreeDelivery ? "0" : newResFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanVal = val.replace(/\D/g, "");
                        if (cleanVal.length <= 3) {
                          setNewResFee(cleanVal);
                          if (Number(cleanVal) > 0) {
                            setNewResIsFreeDelivery(false);
                          } else {
                            setNewResIsFreeDelivery(true);
                          }
                        }
                      }}
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-1">
                  <input
                    type="checkbox"
                    id="isFreeDeliveryOutlet"
                    checked={newResIsFreeDelivery}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNewResIsFreeDelivery(checked);
                      if (checked) {
                        setNewResFee("0");
                      }
                    }}
                    className="h-4 w-4 text-orange-700 focus:ring-brand-orange border-neutral-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="isFreeDeliveryOutlet"
                    className="text-xs font-bold text-neutral-700 cursor-pointer select-none"
                  >
                    Free Delivery Outlet
                  </label>
                </div>

                <div className="space-y-1 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                  <label className="text-[8px] font-black uppercase tracking-wider text-orange-600 block">
                    Google Maps URL (Auto-Coordinates Extractor)
                  </label>
                  <input
                    type="url"
                    value={newResMapsUrl}
                    onChange={(e) => handleMapsUrlChange(e.target.value)}
                    placeholder="Paste maps link e.g. https://google.com/maps..."
                    className="w-full bg-white border border-neutral-150 rounded-lg p-2 text-xs font-semibold outline-none focus:border-brand-orange"
                  />
                  <p className="text-[8px] text-neutral-400 font-semibold mt-0.5 leading-normal">
                    * Note: Shortened links (e.g. share.google/...,
                    maps.app.goo.gl/...) do not contain coordinates text.
                    Please open them in a browser first, wait for the
                    redirect, and paste the resolved long URL from the
                    address bar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="0.0000001"
                      required
                      value={newResLatitude}
                      onChange={(e) =>
                        setNewResLatitude(Number(e.target.value))
                      }
                      placeholder="e.g. 26.8851"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="0.0000001"
                      required
                      value={newResLongitude}
                      onChange={(e) =>
                        setNewResLongitude(Number(e.target.value))
                      }
                      placeholder="e.g. 75.6560"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={newResCity}
                      onChange={(e) => setNewResCity(e.target.value)}
                      placeholder="e.g. Jaipur"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={newResLandmark}
                      onChange={(e) => setNewResLandmark(e.target.value)}
                      placeholder="e.g. Near metro station"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={newResContact}
                      onChange={(e) => setNewResContact(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Radius (km) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newResRadius}
                      onChange={(e) =>
                        setNewResRadius(Number(e.target.value))
                      }
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                    Outlet Address (India Locale) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newResAddress}
                    onChange={(e) => setNewResAddress(e.target.value)}
                    placeholder="e.g. Mansarovar, Jaipur"
                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Restaurant Image File Uploader (Single File Drag & Drop + Preview) */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">
                    Restaurant Cover Image *
                  </label>

                  {!newResImage ? (
                    <div
                      onDragEnter={handleResDrag}
                      onDragOver={handleResDrag}
                      onDragLeave={handleResDrag}
                      onDrop={handleResDrop}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${resDragActive
                        ? "border-brand-orange bg-orange-50/40 text-orange-700 scale-[0.99]"
                        : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-orange-200 text-neutral-400"
                        }`}
                    >
                      <input
                        type="file"
                        id="restaurant-photo-uploader"
                        accept="image/*"
                        onChange={handleResPhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="restaurant-photo-uploader"
                        className="cursor-pointer flex flex-col items-center w-full"
                      >
                        <Upload className="h-5 w-5 text-neutral-400 mb-1 group-hover:text-orange-700 transition" />
                        <p className="text-[10px] font-bold text-neutral-600">
                          Drag & drop restaurant image or{" "}
                          <span className="text-orange-700 underline">
                            browse files
                          </span>
                        </p>
                        <p className="text-[9px] text-neutral-400 font-medium mt-0.5">
                          JPEG, PNG, WebP supported. Uploaded via
                          Cloudinary.
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 group h-32 w-full bg-neutral-100">
                      <img
                        src={newResImage}
                        alt="Restaurant Cover"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleRemoveResImage}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Remove Image</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-neutral-100 pt-3">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                    Operating Hours
                  </label>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {newResOperatingHours.map((oh, index) => (
                      <div
                        key={oh.day}
                        className="flex items-center justify-between gap-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100 text-xs"
                      >
                        <span className="font-bold text-neutral-700 w-10">
                          {oh.day}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            disabled={oh.isClosed}
                            value={oh.openTime}
                            onChange={(e) => {
                              const updated = [...newResOperatingHours];
                              updated[index].openTime = e.target.value;
                              setNewResOperatingHours(updated);
                            }}
                            className="w-24 bg-white border border-neutral-150 rounded-lg p-1 text-[11px] font-semibold text-center outline-none focus:border-brand-orange disabled:opacity-50"
                          />
                          <span className="text-neutral-400 font-semibold text-[10px]">
                            to
                          </span>
                          <input
                            type="time"
                            disabled={oh.isClosed}
                            value={oh.closeTime}
                            onChange={(e) => {
                              const updated = [...newResOperatingHours];
                              updated[index].closeTime = e.target.value;
                              setNewResOperatingHours(updated);
                            }}
                            className="w-24 bg-white border border-neutral-150 rounded-lg p-1 text-[11px] font-semibold text-center outline-none focus:border-brand-orange disabled:opacity-50"
                          />
                        </div>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={oh.isClosed}
                            onChange={(e) => {
                              const updated = [...newResOperatingHours];
                              updated[index].isClosed = e.target.checked;
                              setNewResOperatingHours(updated);
                            }}
                            className="h-3 w-3 text-orange-700 focus:ring-brand-orange border-neutral-300 rounded"
                          />
                          <span className="text-[10px] font-bold text-neutral-500">
                            Closed
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-1">
                  <input
                    type="checkbox"
                    id="isActiveOutlet"
                    checked={newResIsActive}
                    onChange={(e) => setNewResIsActive(e.target.checked)}
                    className="h-4 w-4 text-orange-700 focus:ring-brand-orange border-neutral-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="isActiveOutlet"
                    className="text-xs font-bold text-neutral-700 cursor-pointer select-none"
                  >
                    Active Outlet (Show in catalog & take orders)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRes}
                className={`w-full bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs transition mt-4 shadow-md shadow-orange-600/10 shrink-0 flex items-center justify-center gap-2 ${isSubmittingRes ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                  }`}
              >
                {isSubmittingRes ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>
                      {editingRes ? "Saving Changes..." : "Registering Kitchen Outlet..."}
                    </span>
                  </>
                ) : (
                  <span>
                    {editingRes ? "Save Changes" : "Register Kitchen Outlet"}
                  </span>
                )}
              </button>
            </form>
          </Modal>

          {/* MODAL: ADD DISH RECIPE */}
          <Modal isOpen={showAddDishModal} onClose={() => setShowAddDishModal(false)} maxWidth="max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950">
                Add Menu Recipe Dish
              </h3>
              <button onClick={() => setShowAddDishModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDishSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Mutton Handi Biryani"
                  className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    placeholder="45"
                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                    Recipe Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    placeholder="Biryani / Mains / Starters"
                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Single Image Drag & Drop File Picker + Preview Card */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 block">
                  Upload Dish Image *
                </label>

                {!newDishImage ? (
                  <div
                    onDragEnter={handleDishDrag}
                    onDragOver={handleDishDrag}
                    onDragLeave={handleDishDrag}
                    onDrop={handleDishDrop}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${dishDragActive
                      ? "border-brand-orange bg-orange-50/40 text-orange-700 scale-[0.99]"
                      : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-orange-200 text-neutral-400"
                      }`}
                  >
                    <input
                      type="file"
                      id="dish-photo-uploader-modal"
                      accept="image/*"
                      onChange={handleDishPhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="dish-photo-uploader-modal"
                      className="cursor-pointer flex flex-col items-center w-full"
                    >
                      <Upload className="h-5 w-5 text-neutral-400 mb-1 group-hover:text-orange-700 transition" />
                      <p className="text-[10px] font-bold text-neutral-600">
                        Drag & drop image or{" "}
                        <span className="text-orange-700 underline">
                          browse files
                        </span>
                      </p>
                      <p className="text-[9px] text-neutral-400 font-medium mt-0.5">
                        JPEG, PNG, WebP supported.
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-200 group h-28 w-full bg-neutral-100">
                    <img
                      src={newDishImage}
                      alt="Dish Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleRemoveDishImage}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Remove Image</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                  Dish Description *
                </label>
                <textarea
                  required
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  placeholder="Explain ingredients, spices, and allergens."
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <label className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 flex items-center gap-2.5 cursor-pointer hover:bg-neutral-100 select-none">
                  <input
                    type="checkbox"
                    checked={newDishIsVeg}
                    onChange={(e) => setNewDishIsVeg(e.target.checked)}
                    className="accent-brand-orange"
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                    Pure Veggie
                  </span>
                </label>

                <label className="bg-neutral-50 border border-neutral-150 rounded-xl p-3 flex items-center gap-2.5 cursor-pointer hover:bg-neutral-100 select-none">
                  <input
                    type="checkbox"
                    checked={newDishIsBestseller}
                    onChange={(e) =>
                      setNewDishIsBestseller(e.target.checked)
                    }
                    className="accent-brand-orange"
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                    Best Seller
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs transition mt-2 cursor-pointer shadow-md"
              >
                Publish Recipe Dish
              </button>
            </form>
          </Modal>

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
                  onClick={handleLogout}
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
