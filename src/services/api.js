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
  createOrder: async (show_id, seats) => {
    const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ show_id, seats })
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

