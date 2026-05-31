// context/CustomerAuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { customerAuthAPI } from "../services/api.js"

const CustomerAuthContext = createContext()

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [district, setDistrict] = useState("")
  const [state, setState] = useState("")
  const [locationLoading, setLocationLoading] = useState(false)

  // 🌍 Get location and update district/state (available for all users)
  const fetchLocationDetails = useCallback(async () => {
    try {
      setLocationLoading(true)

      // Check localStorage for cached location (valid for 24 hours)
      const cachedLocation = localStorage.getItem('user_location')
      if (cachedLocation) {
        try {
          const { district: cachedDistrict, state: cachedState, timestamp } = JSON.parse(cachedLocation)
          const cacheAge = Date.now() - timestamp
          const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

          // Use cached data if it's less than 24 hours old
          if (cacheAge < TWENTY_FOUR_HOURS && (cachedDistrict || cachedState)) {
            setState(cachedState)
            setDistrict(cachedDistrict)
            setLocationLoading(false)
            console.log("Using cached location:", { district: cachedDistrict, state: cachedState })
            return { success: true, district: cachedDistrict, state: cachedState, cached: true }
          }
        } catch {
          console.log("Invalid cache, fetching fresh location")
        }
      }

      // Request location permission
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords

      // Fetch location details from API
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}`
      )

      if (!response.ok) throw new Error("Failed to fetch location details")

      const locationData = await response.json()

      // Extract district and state
      const detectedState = locationData.principalSubdivision || ""
      const detectedDistrict = locationData.city || ""

      // Update local state and cache (available for all users)
      if (detectedState || detectedDistrict) {
        setState(detectedState)
        setDistrict(detectedDistrict)

        // Cache location data in localStorage
        localStorage.setItem('user_location', JSON.stringify({
          district: detectedDistrict,
          state: detectedState,
          timestamp: Date.now()
        }))

        setLocationLoading(false)
        console.log("Fetched and cached new location:", { district: detectedDistrict, state: detectedState })
        return { success: true, district: detectedDistrict, state: detectedState }
      }

      setLocationLoading(false)
      return { success: false, message: "Could not extract location details" }
    } catch (err) {
      console.error("Location fetch failed:", err)
      setLocationLoading(false)
      return {
        success: false,
        message: err.message === "User denied Geolocation"
          ? "Location permission denied"
          : "Failed to get location"
      }
    }
  }, [])

  // 📍 Manually set location (from LocationModal)
  const setLocationManually = useCallback(async (city, stateName) => {
    setDistrict(city)
    setState(stateName)

    // Cache in localStorage (same format as geolocation cache)
    localStorage.setItem('user_location', JSON.stringify({
      district: city,
      state: stateName,
      timestamp: Date.now()
    }))

    // If logged in, also update backend profile
    if (customer) {
      try {
        const result = await customerAuthAPI.update({ district: city, state: stateName })
        setCustomer(result.customer)
      } catch (err) {
        console.error("Failed to update profile with manual location:", err)
      }
    }
  }, [customer])

  // 🔄 Update profile with current location (only for logged-in users)
  const updateProfileWithLocation = useCallback(async () => {
    if (!customer) return { success: false, message: "User not logged in" }

    try {
      // Use current district and state from context
      if (state || district) {
        const result = await customerAuthAPI.update({ district, state })
        setCustomer(result.customer)
        return { success: true, district, state }
      }

      return { success: false, message: "No location data available" }
    } catch (err) {
      console.error("Profile location update failed:", err)
      return {
        success: false,
        message: "Failed to update profile with location"
      }
    }
  }, [customer, district, state])

  // 🔄 Load session and location on mount
  useEffect(() => {
    const initializeSession = async () => {
      const fetchCustomer = async () => {
        try {
          const res = await customerAuthAPI.getMe()
          setCustomer(res.customer)
          return true
        } catch {
          return false
        }
      }

      const gotCustomer = await fetchCustomer()

      if (!gotCustomer) {
        try {
          const refreshRes = await customerAuthAPI.refresh()
          if (refreshRes.success) {
            const retried = await fetchCustomer()
            if (!retried) setCustomer(null)
          } else {
            setCustomer(null)
          }
        } catch {
          setCustomer(null)
        }
      }

      setLoading(false)

      // 🌍 Fetch location for ALL users (logged in or not)
      fetchLocationDetails()
    }

    initializeSession()
  }, [fetchLocationDetails])

  // ✅ Login
  const login = async (email, password) => {
    try {
      const res = await customerAuthAPI.login(email, password)
      setCustomer(res.customer)
      console.log("Login successful:", res)

      // 🌍 Update profile with current location after successful login
      if (district || state) {
        await updateProfileWithLocation()
      }

      return { success: true, customer: res.customer }
    } catch (err) {
      console.error("Login failed:", err.response || err.message)

      return {
        success: false,
        message: err.message,      // Friendly error
        details: err.response,     // Full backend response
        error: err                 // Full error object
      }
    }
  }


  // ✅ Logout
  const logout = async () => {
    try {
      await customerAuthAPI.logout()
      setCustomer(null)
      // Location state persists even after logout
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  // ✅ Register
  const signup = async (data) => {
    try {
      const res = await customerAuthAPI.signup(data)
      return { success: true, customer: res.customer }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // ✅ Update profile
  const update = async (data) => {
    try {
      const res = await customerAuthAPI.update(data)
      setCustomer(res.customer)
      return { success: true, customer: res.customer }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // ✅ Change password (authenticated)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await customerAuthAPI.changePassword(currentPassword, newPassword)
      return { success: true, message: res.message }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const value = {
    customer,
    isLoggedIn: !!customer,
    loading,
    locationLoading,
    district,
    state,
    login,
    logout,
    signup,
    update,
    changePassword,
    fetchLocationDetails,
    updateProfileWithLocation,
    setLocationManually,
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {!loading && children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => useContext(CustomerAuthContext)
