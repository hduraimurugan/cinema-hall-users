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
  getMovieDetailsWithShowtimes: async (movieId, district, state) => {
    const queryParams = new URLSearchParams({ district, state })
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
}
