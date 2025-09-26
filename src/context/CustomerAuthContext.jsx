// context/CustomerAuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react"
import { customerAuthAPI } from "../services/api.js"

const CustomerAuthContext = createContext()

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

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
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {!loading && children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => useContext(CustomerAuthContext)
