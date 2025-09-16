import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import HomePage from './pages/HomePage.jsx'
import HallManagement from './pages/HallManagement.jsx';
import Bookings from './pages/Bookings.jsx';
import { ProfilePage } from './pages/ProfilePage'
import { CinemaLayout } from './components/CinemaLayout.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import TheatresPage from './pages/TheatresPage.jsx';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route element={
            <CinemaLayout />
          }>
            
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<HallManagement />} />
            <Route path="/theatres" element={<TheatresPage />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
              
          </Route>

          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  )
}

export default App