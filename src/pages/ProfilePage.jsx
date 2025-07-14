// src/pages/ProfilePage.jsx
import { useAuth } from '../context/AuthContext'

export const ProfilePage = () => {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
      <p>Name: <strong>{user?.name}</strong></p>
      <p>Email: <strong>{user?.email}</strong></p>
    </div>
  )
}