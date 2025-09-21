// services/customerAuthAPI.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

export const customerAuthAPI = {
  // ✅ Register a new customer
  signup: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Signup failed")
    return response.json()
  },

  // ✅ Login customer
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) throw new Error("Login failed")
    return response.json()
  },

  // ✅ Logout customer
  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/api/customer/logout`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Logout failed")
    return response.json()
  },

  // ✅ Update customer profile
  update: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Profile update failed")
    return response.json()
  },

  // ✅ Get current logged-in customer
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/api/customer/me`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch customer")
    return response.json()
  },

  // ✅ Refresh token
  refresh: async () => {
    const response = await fetch(`${API_BASE_URL}/api/customer/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Token refresh failed")
    return response.json()
  },

  // ✅ Send OTP
  sendOtp: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) throw new Error("Failed to send OTP")
    return response.json()
  },

  // ✅ Verify OTP
  verifyOtp: async (email, otp) => {
    const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })
    if (!response.ok) throw new Error("Failed to verify OTP")
    return response.json()
  },
}
