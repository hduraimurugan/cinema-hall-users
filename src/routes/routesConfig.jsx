// src/routes/routesConfig.jsx
import { Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import {
  DashboardPage,
  LoginPage,
  ProfilePage,
  SettingsPage,
  HomePage
} from '../pages'

export const routes = (
  <Route path="/" element={<HomePage />}>
    <Route path="login" element={<LoginPage />} />

    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Route>
)