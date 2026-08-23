// services/api.js
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

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.log("Login error response data:", data) // Debug log

      // Create an error object but also attach response data
      const error = new Error(data?.error || data?.message || "Login failed")
      error.response = data
      throw error
    }

    return data
  }
  ,

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

  // ✅ Send OTP (type: 'signup' | 'password_reset')
  sendOtp: async (email, type = 'signup') => {
    const response = await fetch(`${API_BASE_URL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Failed to send OTP')
    }
    return response.json()
  },

  // ✅ Verify OTP (type: 'signup' | 'password_reset')
  verifyOtp: async (email, otp, type = 'signup') => {
    const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Failed to verify OTP')
    }
    return response.json()
  },

  // ✅ Forgot password — sends reset OTP
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Request failed')
    }
    return response.json()
  },

  // ✅ Reset password — verify OTP + set new password
  resetPassword: async (email, otp, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const err = new Error(data?.error || 'Password reset failed')
      err.code = data?.code
      throw err
    }
    return response.json()
  },

  // ✅ Change password (authenticated)
  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Failed to change password')
    }
    return response.json()
  },

  // ✅ Google OAuth Login
  googleLogin: async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/google-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const error = new Error(data?.error || "Google login failed")
      error.response = data
      throw error
    }
    return data
  },

  // ✅ Link OAuth provider
  linkProvider: async (provider, { idToken } = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/link-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider, idToken }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || "Failed to link provider")
    return data
  },

  // ✅ Unlink OAuth provider
  unlinkProvider: async (provider) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/unlink-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || "Failed to unlink provider")
    return data
  },

  // ✅ Set password (for OAuth-only accounts)
  setPassword: async (newPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/customer/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ newPassword }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || "Failed to set password")
    return data
  },
}

export const customerMoviesAPI = {
  // ✅ Get all movies (with optional filters)
  // Query params: page, limit, genre, language, status, search
  getAllMovies: async (params = {}) => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.genre) {
      if (Array.isArray(params.genre)) {
        params.genre.forEach(g => queryParams.append('genre', g))
      } else {
        queryParams.append('genre', params.genre)
      }
    }
    if (params.language) {
      if (Array.isArray(params.language)) {
        params.language.forEach(l => queryParams.append('language', l))
      } else {
        queryParams.append('language', params.language)
      }
    }
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)

    const queryString = queryParams.toString()
    const url = `${API_BASE_URL}/api/user/movies${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch movies")
    return response.json()
  },

  // ✅ Get single movie by ID
  getMovieById: async (movieId) => {
    const response = await fetch(`${API_BASE_URL}/api/user/movies/${movieId}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch movie details")
    return response.json()
  },

  // ✅ Get movies showing in a specific district and state
  getMoviesByLocation: async (district, state) => {
    const queryParams = new URLSearchParams({ district, state })
    const response = await fetch(`${API_BASE_URL}/api/user/movies/location/movies?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch movies by location")
    return response.json()
  },

  // ✅ Get movies showing in a state (all districts)
  getMoviesByState: async (state) => {
    const queryParams = new URLSearchParams({ state })
    const response = await fetch(`${API_BASE_URL}/api/user/movies/state/movies?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch movies by state")
    return response.json()
  },

  // ✅ Get movie details with cinema halls and showtimes for a location
  getMovieDetailsWithShowtimes: async (movieId, district, state, date) => {
    const params = { district, state }
    if (date) params.date = date
    const queryParams = new URLSearchParams(params)
    const response = await fetch(`${API_BASE_URL}/api/user/movies/${movieId}/showtimes?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch movie showtimes")
    return response.json()
  },

  // ✅ Get all districts in a state where movies are showing
  getDistrictsInState: async (state) => {
    const queryParams = new URLSearchParams({ state })
    const response = await fetch(`${API_BASE_URL}/api/user/movies/location/districts?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch districts")
    return response.json()
  },

  // ✅ Get all cinema halls in a location
  getCinemaHallsByLocation: async (district, state) => {
    const queryParams = new URLSearchParams({ district, state })
    const response = await fetch(`${API_BASE_URL}/api/user/movies/location/cinema-halls?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch cinema halls")
    return response.json()
  },

  // ✅ Get cinema halls with movies and shows for a location and date
  getTheatresWithShows: async (district, state, date) => {
    const params = { district, state }
    if (date) params.date = date
    const queryParams = new URLSearchParams(params)
    const response = await fetch(`${API_BASE_URL}/api/user/movies/location/theatres?${queryParams}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) throw new Error("Failed to fetch theatres")
    return response.json()
  },
}

// ✅ Booking API (Concurrency-safe seat booking)
export const bookingAPI = {
  // Hold seats (start booking process)
  holdSeats: async (show_id, seats) => {
    const response = await fetch(`${API_BASE_URL}/api/booking/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ show_id, seats })
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  // Confirm booking (after payment)
  confirmBooking: async (show_id, seats, total_amount) => {
    const response = await fetch(`${API_BASE_URL}/api/booking/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ show_id, seats, total_amount })
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  // Release seats (cancel)
  releaseSeats: async (show_id, seats) => {
    const response = await fetch(`${API_BASE_URL}/api/booking/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ show_id, seats })
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  getBookingByPaymentId: async (paymentId) => {
    const response = await fetch(`${API_BASE_URL}/api/booking/by-payment/${paymentId}`, {
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  getMyBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/api/booking/my-bookings`, {
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  getBookingById: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/api/booking/${bookingId}`, {
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  }
};

// ✅ Settings API (public)
export const settingsAPI = {
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/api/settings`);
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  }
};

// ✅ Payment API (Razorpay integration)
export const paymentAPI = {
  // Create Razorpay order - amount is calculated server-side
  createOrder: async (show_id, seats, offer_code) => {
    const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ show_id, seats, ...(offer_code ? { offer_code } : {}) })
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  // Verify payment after Razorpay checkout
  verifyPayment: async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) throw await response.json();
    return response.json();
  }
};

// ✅ Ads API (Get active ads + record clicks)
export const adsAPI = {
  getActive: async (placement) => {
    const response = await fetch(`${API_BASE_URL}/api/ads/active?placement=${placement}`, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to fetch ads')
    return response.json()
  },

  recordClick: async (adId) => {
    const response = await fetch(`${API_BASE_URL}/api/ads/click/${adId}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to record click')
    return response.json()
  },
}

// ✅ Offers API
export const offersAPI = {
  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/api/offers/active`, {
      credentials: 'include',
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  validateOffer: async ({ offer_code, show_id, total_amount }) => {
    const response = await fetch(`${API_BASE_URL}/api/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ offer_code, show_id, total_amount }),
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },
};

// ✅ Shows API (Get show details with seat layout)
export const showsAPI = {
  // Get show details with seat layout
  getShowById: async (showId) => {
    const response = await fetch(`${API_BASE_URL}/api/shows/get/${showId}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch show details");
    return response.json();
  }
};

// ✅ Notifications API (in-app notification center)
export const notificationAPI = {
  list: async (page = 1, limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/api/notifications?page=${page}&limit=${limit}`, {
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  getUnreadCount: async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  markAsRead: async (notificationId) => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  markAllRead: async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: "PATCH",
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  getPreferences: async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      credentials: "include",
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  updatePreferences: async (patch) => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ patch }),
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },
};

