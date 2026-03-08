import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export const ProtectedRoute = ({ children }) => {
  const { customer, loading } = useCustomerAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !customer) {
      navigate('/movies', { replace: true, state: { openLogin: true } })
    }
  }, [loading, customer, navigate])

  if (loading || !customer) return null
  return children
}
