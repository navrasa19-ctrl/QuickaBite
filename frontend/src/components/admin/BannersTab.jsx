import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { Plus, Trash2, Sparkles, Edit } from "lucide-react";
import { adminService } from "../../api/adminService";

const DEFAULT_SLIDES = [
  {
    title: "UP TO 50% OFF",
    subtitle: "ON YOUR FIRST ORDER",
    code: "WELCOME50",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
    foodName: "Signature Dum Biryani",
    color: "from-orange-600 to-amber-500",
  },
  {
    title: "FLAT 40% OFF",
    subtitle: "ON PREMIUM FEASTS",
    code: "FOOD40",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    foodName: "Melted Cheese Pizzas",
    color: "from-rose-600 to-orange-500",
  },
  {
    title: "BUY 1 GET 1 FREE",
    subtitle: "ON LEBANESE SHAWARMAS",
    code: "YALLABOGO",
    image:
      "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=800",
    foodName: "Authentic Arabic Bowls",
    color: "from-emerald-600 to-teal-500",
  },
];

export default function BannersTab({ triggerToast }) {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const cached = await adminService.getBanners();
        if (cached && cached.length > 0) {
          setBanners(cached);
        } else {
          setBanners(DEFAULT_SLIDES);
        }
      } catch (e) {
        console.error("Failed to load banners:", e);
        setBanners(DEFAULT_SLIDES);
      }
    };
    loadBanners();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [code, setCode] = useState("");
  const [image, setImage] = useState("");
  const [foodName, setFoodName] = useState("");
  const [colorTheme, setColorTheme] = useState("orange");
  const [editingIndex, setEditingIndex] = useState(null);

  const saveBanners = async (updated) => {
    setBanners(updated);
    await adminService.saveBanners(updated);
    window.dispatchEvent(new Event("storage"));
  };

  const handleSaveBanner = (e) => {
    e.preventDefault();
    if (!title || !subtitle || !code || !image || !foodName) {
      triggerToast("Please fill out all required fields.");
      return;
    }
    let gradientColor = "from-orange-600 to-amber-500";
    if (colorTheme === "rose") gradientColor = "from-rose-600 to-orange-500";
    if (colorTheme === "emerald") gradientColor = "from-emerald-600 to-teal-500";
    if (colorTheme === "purple") gradientColor = "from-purple-600 to-indigo-500";
    const updatedBanner = {
      title: title.toUpperCase(),
      subtitle: subtitle.toUpperCase(),
      code: code.toUpperCase().replace(/\s+/g, ""),
      image,
      foodName,
      color: gradientColor,
    };
    let updated;
    if (editingIndex !== null) {
      updated = [...banners];
      updated[editingIndex] = updatedBanner;
      saveBanners(updated);
      triggerToast(`Banner slider "${title}" updated successfully!`);
    } else {
      updated = [...banners, updatedBanner];
      saveBanners(updated);
      triggerToast(`New banner slider "${title}" published live!`);
    }
    setTitle("");
    setSubtitle("");
    setCode("");
    setImage("");
    setFoodName("");
    setColorTheme("orange");
    setShowAddModal(false);
    setEditingIndex(null);
  };

  const handleStartEdit = (index) => {
    const banner = banners[index];
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setCode(banner.code);
    setImage(banner.image);
    setFoodName(banner.foodName);
    let theme = "orange";
    if (banner.color?.includes("rose-600")) theme = "rose";
    else if (banner.color?.includes("emerald-600")) theme = "emerald";
    else if (banner.color?.includes("purple-600")) theme = "purple";
    setColorTheme(theme);
    setEditingIndex(index);
    setShowAddModal(true);
  };

  const handleDeleteBanner = (index) => {
    if (banners.length <= 1) {
      triggerToast("Must have at least one banner slide on the storefront.");
      return;
    }
    const filtered = banners.filter((_, idx) => idx !== index);
    saveBanners(filtered);
    triggerToast("Banner removed from diner storefront carousel.");
  };

  const colorThemes = [
    {
      val: "orange",
      label: "Sunset Orange",
      class: "bg-gradient-to-r from-orange-500 to-amber-500",
    },
    {
      val: "rose",
      label: "Rose Gold",
      class: "bg-gradient-to-r from-rose-500 to-orange-500",
    },
    {
      val: "emerald",
      label: "Emerald Mint",
      class: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
    {
      val: "purple",
      label: "Neon Velvet",
      class: "bg-gradient-to-r from-purple-500 to-indigo-500",
    },
  ];

  return (
    <div className="space-y-6" id="banners-tab-viewport">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
            Storefront Hero Sliders
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold">
            Manage the sliding banners at the top of the diner home view.
          </p>
        </div>
        <button
          onClick={() => {
            setTitle("");
            setSubtitle("");
            setCode("");
            setImage("");
            setFoodName("");
            setColorTheme("orange");
            setEditingIndex(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-brand-orange hover:bg-orange-700 text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Publish New Slide</span>
        </button>
      </div>

      {/* BANNER PREVIEW CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {banners.map((b, idx) => (
          <div
            key={idx}
            className="bg-white border border-neutral-150 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between"
          >
            {/* Mock slider visual */}
            <div
              className={`p-6 bg-gradient-to-br ${b.color} text-white flex flex-col justify-between min-h-[160px] relative overflow-hidden`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30"
                style={{ backgroundImage: `url(${b.image})` }}
              />
              <div className="z-10">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full inline-block">
                  SLIDE #{idx + 1}
                </span>
                <h4 className="text-base font-black tracking-tight leading-tight mt-2">
                  {b.title}
                </h4>
                <p className="text-[10px] text-white/90 font-bold tracking-wide">
                  {b.subtitle}
                </p>
              </div>
              <div className="flex justify-between items-end z-10 mt-4">
                <span className="font-mono text-[9px] bg-neutral-950/45 px-2 py-1 rounded-md text-orange-300 font-bold border border-orange-500/20">
                  CODE: {b.code}
                </span>
                <span className="text-[9px] font-semibold text-white/80">
                  {b.foodName}
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-150 flex justify-between items-center">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider truncate max-w-[120px]">
                {b.foodName}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartEdit(idx)}
                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition cursor-pointer"
                  title="Edit Slide"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteBanner(idx)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition cursor-pointer"
                  title="Delete Slide"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingIndex(null); }}
        maxWidth="max-w-md"
      >
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 mb-1 flex items-center gap-1.5">
          <Sparkles className="h-4.5 w-4.5 text-orange-700" />
          <span>
            {editingIndex !== null ? "Edit Promo Slide" : "Configure Promo Slide"}
          </span>
        </h3>
        <p className="text-[10px] font-semibold text-neutral-400 mb-4">
          {editingIndex !== null
            ? "Modify the details of the selected storefront banner."
            : "Adds a high-impact advertising slide to the home carousel."}
        </p>

        <form onSubmit={handleSaveBanner} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Main Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GET FLAT 30% OFF"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Subtext Label *
            </label>
            <input
              type="text"
              required
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. ON ALL LUNCH COMBOS"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. LUNCH30"
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                Food Highlight *
              </label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Spicy Chicken Curry"
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Slide Image URL *
            </label>
            <input
              type="url"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Gradient Palette Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorThemes.map((theme) => (
                <button
                  key={theme.val}
                  type="button"
                  onClick={() => setColorTheme(theme.val)}
                  className={`p-2 rounded-xl text-[8px] font-black text-white text-center transition cursor-pointer ${theme.class} ${
                    colorTheme === theme.val
                      ? "ring-2 ring-offset-2 ring-neutral-950 scale-105"
                      : "opacity-85"
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); setEditingIndex(null); }}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              {editingIndex !== null ? "Save Changes" : "Publish Slide"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
