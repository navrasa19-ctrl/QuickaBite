import { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../common/Modal";
import {
  Users,
  Plus,
  Search,
  UserCheck,
  Shield,
  AlertCircle,
  UserMinus,
  ChefHat,
  Eye,
  Edit,
  Loader2,
  RefreshCw,
  Building2,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import { dinerService } from "../../api/dinerService";
import { parseApiError } from "../../api/apiClient";

const DEFAULT_USERS = [
  {
    id: "usr-1",
    name: "Vedanshi Bhabhra",
    fullName: "Vedanshi Bhabhra",
    email: "bhabhravedanshi@gmail.com",
    phone: "+91 9876543210",
    role: "admin",
    status: "active",
    isBlocked: false,
    joinDate: "2026-01-15",
  },
  {
    id: "usr-2",
    name: "Priya Sharma",
    fullName: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    phone: "+91 87654 32109",
    role: "customer",
    status: "active",
    isBlocked: false,
    joinDate: "2026-03-22",
  },
  {
    id: "usr-3",
    name: "Rahul Verma",
    fullName: "Rahul Verma",
    email: "rahul.verma@gmail.com",
    phone: "+91 76543 21098",
    role: "customer",
    status: "suspended",
    isBlocked: true,
    joinDate: "2026-04-10",
  },
  {
    id: "usr-4",
    name: "Anjali Mehta",
    fullName: "Anjali Mehta",
    email: "anjali.mehta@outlook.com",
    phone: "+91 65432 10987",
    role: "customer",
    status: "active",
    isBlocked: false,
    joinDate: "2026-05-01",
  },
  {
    id: "usr-5",
    name: "Arjun Nair",
    fullName: "Arjun Nair",
    email: "arjun.nair@gmail.com",
    phone: "+91 54321 09876",
    role: "customer",
    status: "active",
    isBlocked: false,
    joinDate: "2026-06-12",
  },
  {
    id: "usr-6",
    name: "Chef Sanjay",
    fullName: "Chef Sanjay",
    email: "sanjay@Quikabite.ae",
    phone: "+91 88800 12345",
    role: "manager",
    status: "active",
    isBlocked: false,
    joinDate: "2026-05-18",
  },
];

export default function UsersTab({ onUsersChange, triggerToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Add User Modal State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [restaurants, setRestaurants] = useState([]);
  const [managerRestaurantId, setManagerRestaurantId] = useState("");

  // Inspect Single User Modal State (GetOneUser API)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingSingleUser, setLoadingSingleUser] = useState(false);

  // Manager Role / Restaurant Change Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [selectedRoleRestaurantId, setSelectedRoleRestaurantId] = useState("");

  // Edit User Modal State (EditUsersDetail API)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "customer",
    restaurant: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const getRestaurantName = (restaurantIdOrObj) => {
    if (!restaurantIdOrObj) return "";
    if (typeof restaurantIdOrObj === "object" && restaurantIdOrObj.name) {
      return restaurantIdOrObj.name;
    }
    const idStr = String(restaurantIdOrObj);
    const found = restaurants.find(
      (r) => String(r.id) === idStr || String(r._id) === idStr,
    );
    return found ? found.name : restaurantIdOrObj;
  };

  // GetAllUsers API Integration
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const uList = await adminService.getUsers();
      if (uList && uList.length > 0) {
        setUsers(uList);
        if (onUsersChange) onUsersChange(uList.length);
      } else {
        setUsers(DEFAULT_USERS);
        if (onUsersChange) onUsersChange(DEFAULT_USERS.length);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      if (triggerToast)
        triggerToast(parseApiError(err, "Failed to load users list"));
      setUsers(DEFAULT_USERS);
      if (onUsersChange) onUsersChange(DEFAULT_USERS.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const loadRestaurants = async () => {
      try {
        const list = await dinerService.getRestaurants();
        setRestaurants(list || []);
        if (list && list.length > 0)
          setManagerRestaurantId(list[0].id || list[0]._id || "");
      } catch (err) {
        setRestaurants([]);
      }
    };
    loadRestaurants();
  }, []);

  // CreateCustomer / CreateManager / CreateAdmin API Integration
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      triggerToast("Please fill out all required fields.");
      return;
    }
    const payload = {
      fullName: name,
      email,
      phone,
      role, // "customer", "manager", or "admin"
      ...(role === "manager" && managerRestaurantId
        ? { restaurant: managerRestaurantId }
        : {}),
    };

    try {
      const createdUser = await adminService.createUser(payload);
      triggerToast(
        `Account created for "${createdUser?.name || name}" successfully!`,
      );
      await fetchUsers();
      setName("");
      setEmail("");
      setPhone("");
      setRole("customer");
      setManagerRestaurantId("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to create user:", err);
      triggerToast(parseApiError(err, "Failed to create user account"));
    }
  };

  // ChangeRole & Change Manager Restaurant API Integration
  const executeRoleChange = async (userId, nextRole, restaurantId) => {
    try {
      const updatedUser = await adminService.updateUserRole(
        userId,
        nextRole,
        restaurantId,
      );
      const toastMsg =
        nextRole === "manager"
          ? `"${updatedUser?.name || "User"}" assigned to restaurant successfully`
          : `"${updatedUser?.name || "User"}" role updated to ${nextRole.toUpperCase()}`;
      triggerToast(toastMsg);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u._id === userId
            ? {
              ...u,
              role: nextRole,
              ...(restaurantId ? { restaurant: restaurantId } : {}),
            }
            : u,
        ),
      );
      setShowRoleModal(false);
      setRoleChangeTarget(null);
      setSelectedRoleRestaurantId("");
    } catch (err) {
      console.error("Failed to update user role:", err);
      triggerToast(parseApiError(err, "Failed to update user role"));
    }
  };

  const handleRoleChange = (user, nextRole) => {
    const userId = user.id || user._id;
    if (nextRole === "manager") {
      setRoleChangeTarget({ user, nextRole });
      setSelectedRoleRestaurantId(
        user.restaurant ||
        (restaurants.length > 0
          ? restaurants[0].id || restaurants[0]._id || ""
          : ""),
      );
      setShowRoleModal(true);
    } else {
      executeRoleChange(userId, nextRole);
    }
  };

  // Open Manager Restaurant modal directly for existing managers
  const handleOpenRestaurantModal = (user) => {
    setRoleChangeTarget({ user, nextRole: "manager" });
    setSelectedRoleRestaurantId(
      user.restaurant ||
      (restaurants.length > 0
        ? restaurants[0].id || restaurants[0]._id || ""
        : ""),
    );
    setShowRoleModal(true);
  };

  // EditUsersDetail API Integration (PATCH /v1/users/:id)
  const handleOpenEditModal = (user) => {
    setEditUserData({
      id: user.id || user._id,
      name: user.name || user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "customer",
      restaurant:
        user.restaurant ||
        (restaurants.length > 0
          ? restaurants[0].id || restaurants[0]._id || ""
          : ""),
    });
    setShowEditModal(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editUserData.name || !editUserData.email) {
      triggerToast("Name and email are required.");
      return;
    }
    setSavingEdit(true);
    const userId = editUserData.id;
    const payload = {
      fullName: editUserData.name,
      email: editUserData.email,
      phone: editUserData.phone,
      ...(editUserData.role === "manager" && editUserData.restaurant
        ? { restaurant: editUserData.restaurant }
        : {}),
    };

    try {
      const updatedUser = await adminService.updateUser(userId, payload);
      if (
        editUserData.role !== updatedUser.role ||
        (editUserData.role === "manager" && editUserData.restaurant)
      ) {
        await adminService.updateUserRole(
          userId,
          editUserData.role,
          editUserData.restaurant,
        );
      }
      triggerToast(
        `User account "${updatedUser?.name || editUserData.name}" updated successfully!`,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u._id === userId
            ? {
              ...u,
              ...updatedUser,
              role: editUserData.role,
              ...(editUserData.role === "manager"
                ? { restaurant: editUserData.restaurant }
                : {}),
            }
            : u,
        ),
      );
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to edit user:", err);
      triggerToast(parseApiError(err, "Failed to update user details"));
    } finally {
      setSavingEdit(false);
    }
  };

  // BlockUser & UnblockUser API Integration
  const handleToggleStatus = async (user) => {
    const userId = user.id || user._id;
    const nextIsBlocked = !user.isBlocked;
    try {
      await adminService.toggleUserStatus(userId, nextIsBlocked);
      const actionLabel = nextIsBlocked ? "SUSPENDED" : "ACTIVATED";
      triggerToast(
        `Account status updated for "${user.name}" to ${actionLabel}`,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u._id === userId
            ? {
              ...u,
              isBlocked: nextIsBlocked,
              status: nextIsBlocked ? "suspended" : "active",
            }
            : u,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      triggerToast(parseApiError(err, "Failed to update account status"));
    }
  };

  // GetOneUser API Integration
  const handleInspectUser = async (userId) => {
    setLoadingSingleUser(true);
    setSelectedUser(null);
    setShowDetailModal(true);
    try {
      const userDetail = await adminService.getUserById(userId);
      setSelectedUser(userDetail);
    } catch (err) {
      console.error("Failed to fetch user detail:", err);
      triggerToast(parseApiError(err, "Failed to fetch user details"));
    } finally {
      setLoadingSingleUser(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (u.phone || "").includes(debouncedSearch),
  );

  return (
    <div className="space-y-6 animate-fade-in" id="users-tab-viewport">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
            User Directory
          </h3>
          <p className="text-[10px] text-neutral-400 font-semibold">
            Verify profiles, toggle permissions, edit account details, assign
            manager restaurants, and register user accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2 flex items-center gap-2 max-w-xs shrink-0">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search name/email/phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-900 outline-none w-48"
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition cursor-pointer"
            title="Refresh Users List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-brand-orange hover:bg-orange-700 text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-3xl border border-neutral-150 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                <th className="p-4 pl-6">Profile / Diner Details</th>
                <th className="p-4">Mobile Contacts</th>
                <th className="p-4">System Role / Restaurant</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Diner Since</th>
                <th className="p-4 pr-12 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-400">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 text-orange-700 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Loading user accounts...
                    </p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-400">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      No matching user accounts found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id || u._id}
                    className="hover:bg-neutral-50/50 transition"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-black text-neutral-600 uppercase">
                          {(u.name || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-black text-neutral-900">
                            {u.name}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-semibold font-mono">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-neutral-500">
                      {u.phone}
                    </td>
                    <td className="p-4">
                      {u.role === "admin" ? (
                        <span className="text-[9px] font-black bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" />
                          <span>Admin</span>
                        </span>
                      ) : u.role === "manager" ? (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                            <ChefHat className="h-3 w-3" />
                            <span>Manager</span>
                          </span>
                          {u.restaurant && (
                            <button
                              onClick={() => handleOpenRestaurantModal(u)}
                              className="text-[10px] font-bold text-neutral-700 hover:text-orange-700 flex items-center gap-1.5 transition cursor-pointer bg-neutral-50 hover:bg-orange-50 border border-neutral-200 px-2 py-0.5 rounded-md"
                              title="Click to Change Assigned Restaurant"
                            >
                              <Building2 className="h-3 w-3 text-orange-700 shrink-0" />
                              <span>{getRestaurantName(u.restaurant)}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] font-black bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                          <Users className="h-3 w-3" />
                          <span>Diner</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {!u.isBlocked && u.status !== "suspended" ? (
                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-black bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-neutral-400 font-mono font-bold">
                      {u.joinDate}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* GetOneUser API Trigger */}
                        <button
                          onClick={() => handleInspectUser(u.id || u._id)}
                          className="p-1.5 hover:bg-neutral-100 text-neutral-500 rounded-lg transition cursor-pointer"
                          title="View Single User Details (GetOneUser)"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>

                        {/* EditUsersDetail API Trigger */}
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 hover:bg-neutral-100 text-blue-600 rounded-lg transition cursor-pointer"
                          title="Edit User Details (EditUsersDetail)"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>

                        {/* ChangeRole API Trigger */}
                        <select
                          value={u.role === "user" ? "customer" : u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="h-7 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg px-2 text-[10px] font-black uppercase tracking-wider text-neutral-600 outline-none focus:border-brand-orange cursor-pointer transition-all duration-200"
                        >
                          <option value="customer">Diner</option>
                          <option value="manager">Manager</option>
                        </select>

                        {/* BlockUser & UnblockUser API Trigger */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${!u.isBlocked && u.status !== "suspended"
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                          title={
                            !u.isBlocked && u.status !== "suspended"
                              ? "Suspend Account (BlockUser)"
                              : "Activate Account (UnblockUser)"
                          }
                        >
                          {!u.isBlocked && u.status !== "suspended" ? (
                            <UserMinus className="h-4.5 w-4.5" />
                          ) : (
                            <UserCheck className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL (CreateManager, CreateCustomer, CreateAdmin APIs) */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 mb-1">
          Add User Account
        </h3>
        <p className="text-[10px] font-semibold text-neutral-400 mb-4">
          Register a new user profile manually inside the system directory.
        </p>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@outlook.com"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Mobile Phone *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              System Role Permission
            </label>
            <select
              value={role}
              onChange={(e) => {
                const v = e.target.value;
                setRole(v);
                if (v !== "manager") setManagerRestaurantId("");
                else if (!managerRestaurantId && restaurants.length > 0)
                  setManagerRestaurantId(
                    restaurants[0].id || restaurants[0]._id || "",
                  );
              }}
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            >
              <option value="customer">Customer (Standard diner access)</option>
              <option value="manager">
                Manager (Kitchen & Operations access)
              </option>
              <option value="admin">
                Administrator (Full panel dispatch rights)
              </option>
            </select>
          </div>

          {role === "manager" && (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                Assign Restaurant Outlet *
              </label>
              <select
                value={managerRestaurantId}
                onChange={(e) => setManagerRestaurantId(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
              >
                <option value="">Select restaurant...</option>
                {restaurants.map((r) => (
                  <option key={r.id || r._id} value={r.id || r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL (EditUsersDetail API: PATCH /v1/users/:id) */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 mb-1">
          Edit User Profile
        </h3>
        <p className="text-[10px] font-semibold text-neutral-400 mb-4">
          Update account information and system role for this user profile.
        </p>

        <form onSubmit={handleSaveEditUser} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editUserData.name}
              onChange={(e) =>
                setEditUserData({ ...editUserData, name: e.target.value })
              }
              placeholder="e.g. Pratik Kumar"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={editUserData.email}
              onChange={(e) =>
                setEditUserData({ ...editUserData, email: e.target.value })
              }
              placeholder="pratik1234@gmail.com"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Mobile Phone
            </label>
            <input
              type="tel"
              value={editUserData.phone}
              onChange={(e) =>
                setEditUserData({ ...editUserData, phone: e.target.value })
              }
              placeholder="+91 9876543210"
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              System Role
            </label>
            <select
              value={editUserData.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setEditUserData({
                  ...editUserData,
                  role: newRole,
                  ...(newRole === "manager" &&
                    !editUserData.restaurant &&
                    restaurants.length > 0
                    ? {
                      restaurant:
                        restaurants[0].id || restaurants[0]._id || "",
                    }
                    : {}),
                });
              }}
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
            >
              <option value="customer">Customer (Standard diner access)</option>
              <option value="manager">
                Manager (Kitchen & Operations access)
              </option>
              <option value="admin">
                Administrator (Full panel dispatch rights)
              </option>
            </select>
          </div>

          {editUserData.role === "manager" && (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                Assigned Restaurant Outlet *
              </label>
              <select
                value={editUserData.restaurant}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    restaurant: e.target.value,
                  })
                }
                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
                required
              >
                <option value="">Select restaurant...</option>
                {restaurants.map((r) => (
                  <option key={r.id || r._id} value={r.id || r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN RESTAURANT MODAL FOR MANAGER ROLE / RESTAURANT CHANGE */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)}>
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 mb-1">
          Assign / Change Manager Restaurant
        </h3>
        <p className="text-[10px] font-semibold text-neutral-400 mb-4">
          Select or update restaurant outlet for{" "}
          <span className="font-bold text-neutral-800">
            {roleChangeTarget?.user?.name}
          </span>{" "}
          as Manager.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedRoleRestaurantId) {
              triggerToast("Please select a restaurant.");
              return;
            }
            executeRoleChange(
              roleChangeTarget.user.id || roleChangeTarget.user._id,
              "manager",
              selectedRoleRestaurantId,
            );
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
              Select Restaurant Outlet *
            </label>
            <select
              value={selectedRoleRestaurantId}
              onChange={(e) => setSelectedRoleRestaurantId(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-150 rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-orange"
              required
            >
              <option value="">Select restaurant...</option>
              {restaurants.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowRoleModal(false)}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              Assign & Update
            </button>
          </div>
        </form>
      </Modal>

      {/* INSPECT USER MODAL (GetOneUser API) */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-950 mb-1">
          User Profile Details (GetOneUser)
        </h3>
        <p className="text-[10px] font-semibold text-neutral-400 mb-4">
          Direct user payload fetched from system API.
        </p>

        {loadingSingleUser ? (
          <div className="p-8 text-center text-neutral-400">
            <Loader2 className="h-6 w-6 mx-auto mb-2 text-orange-700 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Fetching user data...
            </p>
          </div>
        ) : selectedUser ? (
          <div className="space-y-3 text-xs">
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-150 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  User ID
                </span>
                <span className="font-mono text-neutral-800 font-bold">
                  {selectedUser.id || selectedUser._id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Full Name
                </span>
                <span className="font-bold text-neutral-900">
                  {selectedUser.name || selectedUser.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Email
                </span>
                <span className="font-mono text-neutral-700">
                  {selectedUser.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Phone
                </span>
                <span className="font-mono text-neutral-700">
                  {selectedUser.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Role
                </span>
                <span className="font-bold uppercase text-orange-700">
                  {selectedUser.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Status
                </span>
                <span
                  className={`font-bold uppercase ${selectedUser.isBlocked ? "text-red-600" : "text-emerald-600"}`}
                >
                  {selectedUser.isBlocked ? "Blocked / Suspended" : "Active"}
                </span>
              </div>
              {selectedUser.restaurant && (
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-neutral-400 uppercase">
                    Assigned Restaurant
                  </span>
                  <span className="font-bold text-neutral-800">
                    {getRestaurantName(selectedUser.restaurant)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Joined Date
                </span>
                <span className="font-mono text-neutral-700">
                  {selectedUser.joinDate}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-400 text-center py-4">
            Unable to load user details.
          </p>
        )}
      </Modal>
    </div>
  );
}
