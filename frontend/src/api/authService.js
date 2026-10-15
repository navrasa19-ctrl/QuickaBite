// src/api/authService.js
import apiClient from "./apiClient";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// ---------------------------------------------------------------------------
// Helper: build a minimal mock profile from phone + name + role
// ---------------------------------------------------------------------------
function buildMockProfile(phone, name, role) {
  return {
    name: name || `User ${phone}`,
    phone,
    email: phone.replace(/[^0-9+]/g, "") + "@Quikabite.ae", // compat field
    tier:
      role === "admin"
        ? "Global Executive"
        : role === "manager"
          ? "Operations Executive"
          : "Gourmet Master",
    avatarUrl: "",
    joined: "July 2026",
  };
}

export const authService = {
  // -------------------------------------------------------------------------
  // LOGIN FLOW — Step 1
  // Send an OTP to an existing user's phone number.
  //
  // Payload (real): POST /auth/otp/send  →  { phone, channel, role }
  //   phone   : string  — e.g. "+91 9876543210"
  //   channel : string  — "sms" | "whatsapp" | "call"
  //   role    : string  — "user" | "manager" | "admin"
  //
  // Response (real): { success: true, expiresIn: 60 }
  // -------------------------------------------------------------------------
  async sendLoginOtp(phone, channel, role) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Mock: always succeeds
      return { success: true, expiresIn: 60, data: { sessionId: "mock-session-id" } };
    } else {
      const cleanedPhone = phone.replace(/[^0-9]/g, "").slice(-10);
      const response = await apiClient.post("/v1/auth/login", {
        phone: cleanedPhone,
      });
      return response.data;
    }
  },

  // -------------------------------------------------------------------------
  // LOGIN FLOW — Step 2
  // Verify the OTP the user entered and exchange for a session token.
  //
  // Payload (real): POST /v1/auth/verify-otp  →  { phone, sessionId, otp }
  //   phone     : string  — same number used in sendLoginOtp
  //   sessionId : string  — UUID returned from sendLoginOtp
  //   otp       : string  — 6-digit code entered by user
  //
  // Response (real): { success: true, data: { token: string, user: UserProfile } }
  // -------------------------------------------------------------------------
  async verifyLoginOtp(phone, otp, role, sessionId) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const cachedUsersStr = localStorage.getItem("globaleats_users");
      if (cachedUsersStr) {
        try {
          const cachedUsers = JSON.parse(cachedUsersStr);
          const existingUser = cachedUsers.find((u) => u.phone === phone);
          if (existingUser && existingUser.role !== role) {
            const dbRoleLabel = existingUser.role === "admin" ? "Admin" : existingUser.role === "manager" ? "Manager" : "Diner";
            throw new Error(`This phone number is registered as an ${dbRoleLabel}. Please use the ${dbRoleLabel} tab to login.`);
          }
        } catch (e) {
          if (e.message.includes("registered as")) {
            throw e;
          }
        }
      }

      const profile = buildMockProfile(phone, null, role);

      localStorage.setItem("globaleats_is_logged_in", "true");
      localStorage.setItem("globaleats_user_role", role);
      localStorage.setItem("globaleats_profile_info", JSON.stringify(profile));

      // Seed admin users cache if not present
      if (!localStorage.getItem("globaleats_users")) {
        const defaultUsers = [
          { id: "u-1", name: profile.name, phone: profile.phone, role, status: "Active", joined: "Just Now" },
          { id: "u-2", name: "Vedanshi Bhabhra", phone: "9876543210", role: "user", status: "Active", joined: "June 2026" },
          { id: "u-3", name: "Chef Sanjay", phone: "+91 88800 12345", role: "manager", status: "Active", joined: "May 2026" },
        ];
        localStorage.setItem("globaleats_users", JSON.stringify(defaultUsers));
      }

      return { isLoggedIn: true, role, profile };
    } else {
      const cleanedPhone = phone.replace(/[^0-9]/g, "").slice(-10);
      const response = await apiClient.post("/v1/auth/login/verify", {
        phone: cleanedPhone,
        sessionId,
        otp,
      });
      const resData = response.data;
      const token = resData.token || resData.data?.token;
      const rawUser = resData.profile || resData.user || resData.data?.user || resData.data?.profile;

      if (!token) {
        throw new Error("Token not received from server");
      }

      const dbRoleRaw = rawUser?.role || "user";
      const dbRole = (dbRoleRaw === "diner" || dbRoleRaw === "customer") ? "user" : dbRoleRaw;
      if (dbRole !== role) {
        const dbRoleLabel = dbRole === "admin" ? "Admin" : dbRole === "manager" ? "Manager" : "Diner";
        throw new Error(`This phone number is registered as an ${dbRoleLabel}. Please use the ${dbRoleLabel} tab to login.`);
      }

      const resObj = typeof rawUser?.restaurant === "object" ? rawUser.restaurant : null;
      const restaurantId = String(
        rawUser?.restaurantId ||
        resObj?._id ||
        resObj?.id ||
        rawUser?.managedRestaurant ||
        (typeof rawUser?.restaurant === "string" ? rawUser.restaurant : "") ||
        ""
      );
      const restaurantName = String(
        rawUser?.restaurantName ||
        resObj?.name ||
        rawUser?.managedRestaurantName ||
        ""
      );

      const userProfile = {
        id: String(rawUser?.id || rawUser?._id || ""),
        name: rawUser?.name || rawUser?.fullName || `User ${phone}`,
        phone: rawUser?.phone || phone,
        email: rawUser?.email || "",
        role: dbRole,
        restaurantId,
        restaurantName,
        restaurant: resObj || rawUser?.restaurant || null,
        tier: rawUser?.tier || (dbRole === "admin" ? "Global Executive" : dbRole === "manager" ? "Operations Executive" : "Gourmet Master"),
        avatarUrl: rawUser?.avatarUrl || "",
        joined: rawUser?.joined || "July 2026",
      };

      localStorage.setItem("globaleats_token", token);
      localStorage.setItem("globaleats_is_logged_in", "true");
      localStorage.setItem("globaleats_user_role", userProfile.role);
      localStorage.setItem("globaleats_profile_info", JSON.stringify(userProfile));
      return { isLoggedIn: true, role: userProfile.role, profile: userProfile };
    }
  },

  // -------------------------------------------------------------------------
  // SIGNUP FLOW — Step 1
  // Register a new user's details and send a verification OTP.
  //
  // Payload (real): POST /v1/auth/send-otp  →  { phone }
  //
  // Response (real): { success: true, data: { sessionId: string } }
  // -------------------------------------------------------------------------
  async sendSignupOtp(name, phone, channel) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true, expiresIn: 60, data: { sessionId: "mock-session-id" } };
    } else {
      const cleanedPhone = phone.replace(/[^0-9]/g, "").slice(-10);
      const response = await apiClient.post("/v1/auth/signup", {
        fullName: name,
        phone: cleanedPhone,
      });
      return response.data;
    }
  },

  // -------------------------------------------------------------------------
  // SIGNUP FLOW — Step 2
  // Verify the OTP, complete registration, and return a session token.
  //
  // Payload (real): POST /v1/auth/verify-otp  →  { phone, sessionId, otp }
  //
  // Response (real): { success: true, data: { token: string, user: UserProfile } }
  // -------------------------------------------------------------------------
  async verifySignupOtp(name, phone, otp, sessionId) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const role = "user";
      const profile = buildMockProfile(phone, name, role);

      localStorage.setItem("globaleats_is_logged_in", "true");
      localStorage.setItem("globaleats_user_role", role);
      localStorage.setItem("globaleats_profile_info", JSON.stringify(profile));

      // Seed users cache
      if (!localStorage.getItem("globaleats_users")) {
        const defaultUsers = [
          { id: "u-1", name: profile.name, phone: profile.phone, role, status: "Active", joined: "Just Now" },
          { id: "u-2", name: "Vedanshi Bhabhra", phone: "9876543210", role: "user", status: "Active", joined: "June 2026" },
          { id: "u-3", name: "Chef Sanjay", phone: "8880012345", role: "manager", status: "Active", joined: "May 2026" },
        ];
        localStorage.setItem("globaleats_users", JSON.stringify(defaultUsers));
      }

      return { isLoggedIn: true, role, profile };
    } else {
      const cleanedPhone = phone.replace(/[^0-9]/g, "").slice(-10);
      const response = await apiClient.post("/v1/auth/signup/verify", {
        phone: cleanedPhone,
        sessionId,
        otp,
      });
      const resData = response.data;
      const token = resData.token || resData.data?.token;
      const rawUser = resData.profile || resData.user || resData.data?.user || resData.data?.profile;

      if (!token) {
        throw new Error("Token not received from server");
      }

      const dbRoleRaw = rawUser?.role || "user";
      const dbRole = (dbRoleRaw === "diner" || dbRoleRaw === "customer") ? "user" : dbRoleRaw;

      const userProfile = {
        id: rawUser?.id || rawUser?._id || "",
        name: name || rawUser?.name || rawUser?.fullName || `User ${phone}`,
        phone: rawUser?.phone || phone,
        email: rawUser?.email || "",
        role: dbRole,
        tier: rawUser?.tier || "Gourmet Master",
        avatarUrl: rawUser?.avatarUrl || "",
        joined: rawUser?.joined || "July 2026",
      };

      localStorage.setItem("globaleats_token", token);
      localStorage.setItem("globaleats_is_logged_in", "true");
      localStorage.setItem("globaleats_user_role", userProfile.role);

      // Attempt to save user name to profile
      try {
        await apiClient.patch("/v1/auth/profile", { fullName: userProfile.name });
      } catch (e) {
        console.warn("Failed to update profile name on backend:", e);
      }

      return { isLoggedIn: true, role: userProfile.role, profile: userProfile };
    }
  },

  // -------------------------------------------------------------------------
  // RESEND OTP
  // Re-trigger an OTP for either login or signup flows.
  //
  // Payload (real): POST /v1/auth/send-otp  →  { phone }
  // -------------------------------------------------------------------------
  async resendOtp(phone, channel, context = "login", name = "") {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true, expiresIn: 60, data: { sessionId: "mock-session-id" } };
    } else {
      const cleanedPhone = phone.replace(/[^0-9]/g, "").slice(-10);
      if (context === "signup") {
        const response = await apiClient.post("/v1/auth/signup", {
          fullName: name,
          phone: cleanedPhone,
        });
        return response.data;
      } else {
        const response = await apiClient.post("/v1/auth/login", {
          phone: cleanedPhone,
        });
        return response.data;
      }
    }
  },

  // -------------------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------------------
  async logout() {
    if (!USE_MOCK) {
      try {
        await apiClient.post("/auth/logout");
      } catch (e) {
        // ignore logout connection errors
      }
    }
    localStorage.removeItem("globaleats_token");
    localStorage.removeItem("globaleats_is_logged_in");
    localStorage.removeItem("globaleats_user_role");
    localStorage.removeItem("globaleats_orders");
    localStorage.removeItem("globaleats_profile_info");
    localStorage.removeItem("globaleats_addresses");
    localStorage.removeItem("globaleats_payments");
    localStorage.removeItem("globaleats_notif_prefs");
  },

  // -------------------------------------------------------------------------
  // GET CURRENT USER (from localStorage — synchronous, no network call)
  // -------------------------------------------------------------------------
  getCurrentUser() {
    const isLoggedIn = localStorage.getItem("globaleats_is_logged_in") === "true";
    const role = localStorage.getItem("globaleats_user_role") || "user";
    let profile = null;
    try {
      const cached = localStorage.getItem("globaleats_profile_info");
      profile = cached ? JSON.parse(cached) : null;
    } catch (e) {
      // ignore
    }
    return { isLoggedIn, role, profile };
  },

  // -------------------------------------------------------------------------
  // GET PROFILE FROM SERVER
  // Payload (real): GET /v1/auth/me
  // -------------------------------------------------------------------------
  async getProfile() {
    if (USE_MOCK) {
      const { isLoggedIn, role, profile } = this.getCurrentUser();
      if (profile || !isLoggedIn) return profile;
      // Logged in but the profile cache is missing (older session): rebuild a basic one
      const fallback = { ...buildMockProfile("", "Guest user", role), email: "" };
      try {
        localStorage.setItem("globaleats_profile_info", JSON.stringify(fallback));
      } catch (e) {
        // ignore storage errors
      }
      return fallback;
    }

    try {
      const response = await apiClient.get("/v1/auth/me");
      const resData = response.data;
      const rawUser =
        resData.profile ||
        resData.user ||
        resData.data?.user ||
        resData.data?.profile ||
        resData.data ||
        resData;

      if (!rawUser) {
        return null;
      }

      const resObj = typeof rawUser?.restaurant === "object" ? rawUser.restaurant : null;
      const restaurantId = String(
        rawUser?.restaurantId ||
        resObj?._id ||
        resObj?.id ||
        rawUser?.managedRestaurant ||
        (typeof rawUser?.restaurant === "string" ? rawUser.restaurant : "") ||
        ""
      );
      const restaurantName = String(
        rawUser?.restaurantName ||
        resObj?.name ||
        rawUser?.managedRestaurantName ||
        ""
      );

      const profile = {
        id: String(rawUser?.id || rawUser?._id || ""),
        name: rawUser?.name || rawUser?.fullName || rawUser?.username || "",
        phone: rawUser?.phone || "",
        email: rawUser?.email || rawUser?.userName || "",
        role: rawUser?.role || "user",
        restaurantId,
        restaurantName,
        restaurant: resObj || rawUser?.restaurant || null,
        tier:
          rawUser?.tier ||
          (rawUser?.role === "admin"
            ? "Global Executive"
            : rawUser?.role === "manager"
              ? "Operations Executive"
              : "Gourmet Master"),
        avatarUrl: rawUser?.avatarUrl || rawUser?.avatar || "",
        joined: rawUser?.joined || rawUser?.createdAt || "July 2026",
      };

      try {
        localStorage.setItem("globaleats_profile_info", JSON.stringify(profile));
      } catch (e) {
        console.error("Error setting local profile info:", e);
      }
      return profile;
    } catch (error) {
      console.error("Failed to fetch profile from /v1/auth/me:", error);
      return null;
    }
  },

  // -------------------------------------------------------------------------
  // UPDATE PROFILE
  // Payload (real): PATCH /v1/auth/profile  →  { fullName, email, phone? }
  // -------------------------------------------------------------------------
  async updateProfile(profile) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      try {
        localStorage.setItem("globaleats_profile_info", JSON.stringify(profile));
      } catch (e) {
        // ignore storage errors
      }
      return profile;
    } else {
      const payload = {
        ...(profile.name ? { fullName: profile.name } : {}),
        ...(profile.email ? { email: profile.email } : {}),
      };
      const response = await apiClient.patch("/v1/auth/profile", payload);
      const updatedRaw = response.data?.data || response.data || {};
      return {
        id: updatedRaw?.id || updatedRaw?._id || profile.id || "",
        name: updatedRaw?.name || updatedRaw?.fullName || profile.name || "",
        phone: updatedRaw?.phone || profile.phone || "",
        email: updatedRaw?.email || updatedRaw?.userName || profile.email || "",
        role: updatedRaw?.role || profile.role || "user",
        tier:
          updatedRaw?.tier ||
          (updatedRaw?.role === "admin"
            ? "Global Executive"
            : updatedRaw?.role === "manager"
              ? "Operations Executive"
              : "Gourmet Master") ||
          profile.tier || "Gourmet Master",
        avatarUrl: updatedRaw?.avatarUrl || updatedRaw?.avatar || profile.avatarUrl || "",
        joined: updatedRaw?.joined || updatedRaw?.createdAt || profile.joined || "",
      };
    }
  },

  // -------------------------------------------------------------------------
  // ADDRESSES
  // -------------------------------------------------------------------------
  async getAddresses() {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const cached = localStorage.getItem("globaleats_addresses");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore JSON errors
        }
      }
      return [
        {
          id: "addr-1",
          label: "Home",
          detail: "Flat 402, Prestige Skyline Towers, Indiranagar, Bengaluru, Karnataka 560038",
          contact: "9876543210",
          lat: 12.9716,
          lng: 77.6099,
          isDefault: true,
        },
        {
          id: "addr-2",
          label: "Work",
          detail: "Floor 14, Google India, Embassy Golf Links Business Park, Bengaluru, Karnataka 560071",
          contact: "9876543210",
          lat: 12.9542,
          lng: 77.6942,
          isDefault: false,
        },
      ];
    } else {
      const response = await apiClient.get("/v1/address");
      const list = response.data?.data || response.data || [];
      return list.map(addr => ({
        id: addr._id || addr.id,
        label: addr.label || "Home",
        detail: addr.fullAddress || "",
        contact: addr.phone || "",
        lat: addr.location?.coordinates?.[1] || 12.9716,
        lng: addr.location?.coordinates?.[0] || 77.6099,
        isDefault: addr.isDefault || false,
        tagName: addr.tagName || ""
      }));
    }
  },

  async createAddress(addressData) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const cached = await this.getAddresses();
      const nextIsDefault = addressData.isDefault || cached.length === 0;
      let updated = cached;
      if (nextIsDefault) {
        updated = updated.map(a => ({ ...a, isDefault: false }));
      }
      const newAddr = {
        ...addressData,
        id: `addr-${Date.now()}`,
        isDefault: nextIsDefault
      };
      updated.push(newAddr);
      localStorage.setItem("globaleats_addresses", JSON.stringify(updated));
      return newAddr;
    } else {
      const payload = {
        label: addressData.label,
        fullAddress: addressData.detail,
        phone: addressData.contact,
        location: {
          type: "Point",
          coordinates: [Number(addressData.lng) || 77.6099, Number(addressData.lat) || 12.9716]
        },
        isDefault: !!addressData.isDefault,
        ...(addressData.label === "Other" && addressData.tagName ? { tagName: addressData.tagName } : {})
      };
      const response = await apiClient.post("/v1/address", payload);
      const created = response.data?.data || response.data;
      return {
        id: created._id || created.id,
        label: created.label,
        detail: created.fullAddress,
        contact: created.phone,
        lat: created.location?.coordinates?.[1] || 12.9716,
        lng: created.location?.coordinates?.[0] || 77.6099,
        isDefault: created.isDefault || false,
        tagName: created.tagName || ""
      };
    }
  },

  async updateAddress(id, addressData) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const cached = await this.getAddresses();
      const nextIsDefault = addressData.isDefault;
      let updated = cached;
      if (nextIsDefault) {
        updated = updated.map(a => ({ ...a, isDefault: false }));
      }
      let updatedAddr = null;
      updated = updated.map(a => {
        if (a.id === id) {
          updatedAddr = { ...a, ...addressData };
          if (nextIsDefault) {
            updatedAddr.isDefault = true;
          }
          return updatedAddr;
        }
        return a;
      });
      localStorage.setItem("globaleats_addresses", JSON.stringify(updated));
      return updatedAddr;
    } else {
      const payload = {};
      if (addressData.label !== undefined) payload.label = addressData.label;
      if (addressData.detail !== undefined) payload.fullAddress = addressData.detail;
      if (addressData.contact !== undefined) payload.phone = addressData.contact;
      if (addressData.lat !== undefined && addressData.lng !== undefined) {
        payload.location = {
          type: "Point",
          coordinates: [Number(addressData.lng), Number(addressData.lat)]
        };
      }
      if (addressData.isDefault !== undefined) payload.isDefault = !!addressData.isDefault;
      if (addressData.label === "Other" && addressData.tagName !== undefined) {
        payload.tagName = addressData.tagName;
      }

      const response = await apiClient.patch(`/v1/address/${id}`, payload);
      const updated = response.data?.data || response.data;
      return {
        id: updated._id || updated.id,
        label: updated.label,
        detail: updated.fullAddress,
        contact: updated.phone,
        lat: updated.location?.coordinates?.[1] || 12.9716,
        lng: updated.location?.coordinates?.[0] || 77.6099,
        isDefault: updated.isDefault || false,
        tagName: updated.tagName || ""
      };
    }
  },

  async deleteAddress(id) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const cached = await this.getAddresses();
      let updated = cached.filter(a => a.id !== id);
      if (updated.length > 0 && !updated.some(a => a.isDefault)) {
        updated[0].isDefault = true;
      }
      localStorage.setItem("globaleats_addresses", JSON.stringify(updated));
      return { success: true };
    } else {
      const response = await apiClient.delete(`/v1/address/${id}`);
      return response.data;
    }
  },

  async getAddressById(id) {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const cached = await this.getAddresses();
      return cached.find(a => a.id === id) || null;
    } else {
      const response = await apiClient.get(`/v1/address/${id}`);
      const addr = response.data?.data || response.data;
      return {
        id: addr._id || addr.id,
        label: addr.label,
        detail: addr.fullAddress,
        contact: addr.phone,
        lat: addr.location?.coordinates?.[1] || 12.9716,
        lng: addr.location?.coordinates?.[0] || 77.6099,
        isDefault: addr.isDefault || false,
        tagName: addr.tagName || ""
      };
    }
  },

  async saveAddresses(addresses) {
    if (USE_MOCK) {
      localStorage.setItem("globaleats_addresses", JSON.stringify(addresses));
      return addresses;
    } else {
      // Retained for compatibility.
      const response = await apiClient.post("/auth/addresses", { addresses });
      return response.data;
    }
  },

  // -------------------------------------------------------------------------
  // PAYMENTS
  // -------------------------------------------------------------------------


  async savePayments(payments) {
    if (USE_MOCK) {
      localStorage.setItem("globaleats_payments", JSON.stringify(payments));
      return payments;
    } else {
      try {
        const response = await apiClient.post("/auth/payments", { payments });
        return response.data;
      } catch (err) {
        console.warn("savePayments endpoint unavailable:", err?.message);
        localStorage.setItem("globaleats_payments", JSON.stringify(payments));
        return payments;
      }
    }
  },

  // -------------------------------------------------------------------------
  // NOTIFICATION PREFERENCES
  // -------------------------------------------------------------------------

  async saveNotificationPrefs(prefs) {
    if (USE_MOCK) {
      localStorage.setItem("globaleats_notif_prefs", JSON.stringify(prefs));
      return prefs;
    } else {
      const response = await apiClient.post("/auth/notifications/preferences", prefs);
      return response.data;
    }
  },
};
