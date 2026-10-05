import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderPlus,
  Edit,
  Trash2,
  Plus,
  X,
  Save,
  Grid,
  Layers,
  CheckCircle2,
  XCircle,
  ImageIcon,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import { dinerService } from "../../api/dinerService";
import Modal from "../common/Modal";

export default function CategoryManagementTab({ triggerToast }) {
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurant, setRestaurant] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedOutletFilter, setSelectedOutletFilter] = useState("all");
  const [actionError, setActionError] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await adminService.getCategories({ includeInactive: true, all: true });
      const list = Array.isArray(data) ? data : (data?.categories || data?.data || []);
      setCategories(list);
    } catch (err) {
      console.error("Failed to load categories:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to load categories from server.";
      setActionError(errMsg);
      triggerToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const list = await dinerService.getRestaurants();
      setRestaurants(list || []);
      if (list && list.length > 0) {
        setRestaurant((prev) => prev || list[0]._id || list[0].id || "");
      }
    } catch (err) {
      console.warn("Could not load restaurants:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchRestaurants();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setActionError(null);
    setName("");
    setImage("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600");
    setDescription("");
    setDisplayOrder(1);
    setIsActive(true);
    if (restaurants.length > 0) {
      setRestaurant(restaurants[0]._id || restaurants[0].id || "");
    }
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setActionError(null);
    setName(cat.name || "");
    setImage(cat.image || "");
    setDescription(cat.description || "");
    setDisplayOrder(cat.displayOrder ?? 1);
    setIsActive(cat.isActive !== undefined ? Boolean(cat.isActive) : true);
    const restId = cat.restaurant?._id || cat.restaurant?.id || (typeof cat.restaurant === "string" ? cat.restaurant : "") || (restaurants[0]?._id || restaurants[0]?.id || "");
    setRestaurant(restId);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerToast("Category name is required.", "error");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    const payload = {
      name: name.trim(),
      restaurant: restaurant || (restaurants[0]?._id || restaurants[0]?.id || ""),
      description: description.trim(),
      image: image.trim(),
      displayOrder: Number(displayOrder) || 1,
      isActive: Boolean(isActive),
    };

    try {
      if (editingCategory) {
        const catId = editingCategory._id || editingCategory.id;
        await adminService.updateCategory(catId, payload);
        triggerToast(`Category "${name}" updated successfully!`);
      } else {
        await adminService.createCategory(payload);
        triggerToast(`Category "${name}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error("Failed to save category:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to save category. Please check server connectivity.";
      setActionError(errMsg);
      triggerToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!confirm(`Are you sure you want to delete the category "${catName}"?`)) return;
    setDeletingId(id);
    setActionError(null);
    try {
      await adminService.deleteCategory(id);
      triggerToast(`Category "${catName}" deleted successfully.`);
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to delete category.";
      setActionError(errMsg);
      triggerToast(errMsg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6" id="category-management-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-neutral-900 text-white p-6 rounded-3xl border border-neutral-800 shadow-xl relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-10"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800")',
          }}
        />
        <div className="z-10 space-y-1">
          <h3 className="font-display font-black text-lg sm:text-xl uppercase tracking-wider flex items-center gap-2">
            <Grid className="h-6 w-6 text-orange-400" />
            <span>Category Directory Studio</span>
          </h3>
          <p className="text-[11px] text-neutral-300 max-w-2xl font-medium">
            Manage culinary menu categories, configure display sort orders, toggle active status, and maintain standard catalog taxonomies across all cloud kitchens.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/20 hover:scale-102"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT BANNER */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-xs text-red-700 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-red-100 rounded-lg transition cursor-pointer text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-soft flex items-center gap-4">
          <div className="h-10 w-10 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Total Categories
            </span>
            <h4 className="text-lg font-black text-gray-900">
              {categories.length} Categories
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-soft flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Active Status
            </span>
            <h4 className="text-lg font-black text-emerald-600">
              {categories.filter((c) => c.isActive !== false).length} Active
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-soft flex items-center gap-4">
          <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Inactive / Hidden
            </span>
            <h4 className="text-lg font-black text-red-600">
              {categories.filter((c) => c.isActive === false).length} Inactive
            </h4>
          </div>
        </div>
      </div>

      {/* OUTLET FILTER & SELECTOR BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-700">
          <Grid className="h-4 w-4 text-orange-700" />
          <span>Filter by Partner Outlet:</span>
        </div>
        <div className="relative w-full sm:w-72">
          <select
            value={selectedOutletFilter}
            onChange={(e) => setSelectedOutletFilter(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:border-brand-orange cursor-pointer appearance-none pr-8"
          >
            <option value="all">🍽️ All Cloud Kitchen Outlets ({categories.length})</option>
            {restaurants.map((r) => {
              const rId = r._id || r.id;
              const count = categories.filter((c) => {
                const cRestId = c.restaurant?._id || c.restaurant?.id || (typeof c.restaurant === "string" ? c.restaurant : null);
                return !cRestId || String(cRestId) === String(rId);
              }).length;
              return (
                <option key={rId} value={rId}>
                  {r.name || "Kitchen"} ({count} categories)
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* CATEGORIES GRID */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-neutral-100 shadow-xs">
          <RefreshCw className="animate-spin h-8 w-8 text-orange-700 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading categories studio...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-neutral-100 shadow-xs space-y-3">
          <Grid className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-xs font-black uppercase text-gray-500 tracking-wider">No Categories Found</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
          >
            Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories
            .filter((cat) => {
              if (selectedOutletFilter === "all") return true;
              const catRestId = cat.restaurant?._id || cat.restaurant?.id || (typeof cat.restaurant === "string" ? cat.restaurant : null);
              return !catRestId || String(catRestId) === String(selectedOutletFilter);
            })
            .map((cat) => {
            const catId = cat._id || cat.id;
            const isDeletingThis = deletingId === catId;
            return (
              <motion.div
                layout
                key={catId}
                onClick={() => openEditModal(cat)}
                className={`bg-white rounded-3xl border border-neutral-100 shadow-soft hover:shadow-lg transition relative overflow-hidden flex flex-col justify-between group cursor-pointer ${!cat.isActive ? "opacity-70 bg-neutral-50/50" : ""}`}
              >
                <div>
                  {/* Banner / Image */}
                  <div className="h-36 w-full bg-gray-100 relative">
                    <img
                      src={cat.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600"}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Order badge */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-white/20">
                      Order: {cat.displayOrder ?? 0}
                    </div>

                    {/* Active badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border backdrop-blur-md ${cat.isActive !== false ? "bg-emerald-500/80 border-emerald-400 text-white" : "bg-red-500/80 border-red-400 text-white"}`}>
                        {cat.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h4 className="font-display font-black text-base text-white truncate">
                        {cat.name}
                      </h4>
                      <p className="text-[10px] text-white/80 font-semibold truncate">
                        {cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                      {cat.description || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Footer Action Bar (Single Delete Button with Loading) */}
                <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-gray-400">
                    ID: <span className="text-gray-700 font-mono">{String(catId).slice(-6)}</span>
                  </span>

                  <button
                    disabled={isDeletingThis}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(catId, cat.name);
                    }}
                    className={`p-1.5 bg-white text-neutral-400 hover:text-red-600 hover:bg-red-50 border border-neutral-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold ${isDeletingThis ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Delete Category"
                  >
                    {isDeletingThis ? (
                      <RefreshCw className="h-3.5 w-3.5 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className="text-red-600 font-extrabold">{isDeletingThis ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CATEGORY MODAL (ADD / EDIT) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-display font-black text-base text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                {editingCategory ? (
                  <Edit className="h-5 w-5 text-orange-700" />
                ) : (
                  <FolderPlus className="h-5 w-5 text-orange-700" />
                )}
                <span>
                  {editingCategory ? "Edit Category Details" : "Create New Category"}
                </span>
              </h4>
              <p className="text-[10px] text-gray-400 font-semibold">
                Configure taxonomy parameters for menu filtering
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="h-8 w-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Category Name */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chinese Starters"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
                required
              />
            </div>

            {/* Target Restaurant / Outlet */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                Host Restaurant / Outlet *
              </label>
              <select
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange bg-white"
                required
              >
                {restaurants.length === 0 ? (
                  <option value="">Loading outlets...</option>
                ) : (
                  restaurants.map((r) => {
                    const rId = r._id || r.id;
                    return (
                      <option key={rId} value={rId}>
                        {r.name || r.title || "Outlet"} ({String(rId).slice(-6)})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Image URL (Optional)</span>
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Juicy handcrafted burgers and golden crispy fries"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Display Order & Active Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Active Status
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`w-full py-2 rounded-xl text-xs font-black uppercase transition border ${isActive ? "bg-emerald-500 border-emerald-500 text-white" : "bg-neutral-100 border-neutral-300 text-gray-700"}`}
                >
                  {isActive ? "Active (Visible)" : "Inactive (Hidden)"}
                </button>
              </div>
            </div>

            {/* Actions */}
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
                disabled={isSubmitting}
                className={`px-5 py-2 ${
                  isSubmitting
                    ? "bg-neutral-400 cursor-not-allowed opacity-80"
                    : "bg-orange-500 hover:bg-orange-600 cursor-pointer shadow-md shadow-orange-500/20"
                } text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{editingCategory ? "Updating Category..." : "Creating Category..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
