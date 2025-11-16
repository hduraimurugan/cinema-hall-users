// context/CustomerAuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { customerAuthAPI } from "../services/api.js"

const CustomerAuthContext = createContext()

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationUpdated, setLocationUpdated] = useState(false)

  // 🌍 Get location and update district/state
  const updateLocationDetails = useCallback(async () => {
    try {
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
      const state = locationData.principalSubdivision || ""
      const district = locationData.city || ""

      // Update customer profile with district and state
      if (state || district) {
        const result = await customerAuthAPI.update({ district, state })
        setCustomer(result.customer)
        return { success: true, district, state }
      }

      return { success: false, message: "Could not extract location details" }
    } catch (err) {
      console.error("Location update failed:", err)
      return {
        success: false,
        message: err.message === "User denied Geolocation"
          ? "Location permission denied"
          : "Failed to get location"
      }
    }
  }, [])

  // 🔄 Load session on mount
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
    }

    initializeSession()
  }, [])

  // 🌍 Update location on customer login/load
  useEffect(() => {
    if (customer && !loading && !locationUpdated) {
      updateLocationDetails().then(() => {
        setLocationUpdated(true)
      })
    }
  }, [customer, loading, locationUpdated, updateLocationDetails])

  // ✅ Login
  const login = async (email, password) => {
    try {
      const res = await customerAuthAPI.login(email, password)
      setCustomer(res.customer)
      console.log("Login successful:", res)

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
      setLocationUpdated(false)
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

  const value = {
    customer,
    isLoggedIn: !!customer,
    loading,
    login,
    logout,
    signup,
    update,
    updateLocationDetails,
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {!loading && children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => useContext(CustomerAuthContext)
