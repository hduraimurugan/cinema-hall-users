// src/pages/ProfilePage.jsx
import { useCustomerAuth } from '../context/CustomerAuthContext'

export const ProfilePage = () => {
  const { customer } = useCustomerAuth()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
      <p>Name: <strong>{customer?.name}</strong></p>
      <p>Email: <strong>{customer?.email}</strong></p>
    </div>
  )
}