import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import HomePage from './pages/HomePage.jsx'
import HallManagement from './pages/HallManagement.jsx';
import Bookings from './pages/Bookings.jsx';
import { ProfilePage } from './pages/ProfilePage'
import { CinemaLayout } from './components/CinemaLayout.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import TheatresPage from './pages/TheatresPage.jsx';
import MoviesPage from './pages/MoviesPage.jsx';
import MovieDetailsPage from './pages/MovieDetailsPage.jsx';
import MovieInfoPage from './pages/MovieInfoPage.jsx';
import SeatSelectionPage from './pages/SeatSelectionPage.jsx';
import BookingSuccessPage from './pages/BookingSuccessPage.jsx';
import BookingFailurePage from './pages/BookingFailurePage.jsx';
import OrderSummaryPage from './pages/OrderSummaryPage.jsx';
import { ProtectedRoute } from './routes/ProtectedRoutes.jsx';
import OffersPage from './pages/OffersPage.jsx';
import BookingDetailPage from './pages/BookingDetailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import Notifications from './pages/Notifications.jsx';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route element={<CinemaLayout />}>
            {/* Public */}
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movie/:movieId" element={<MovieInfoPage />} />
            <Route path="/movie/shows/:movieId" element={<MovieDetailsPage />} />
            <Route path="/show/:showId" element={<SeatSelectionPage />} />
            <Route path="/order-summary" element={<OrderSummaryPage />} />
            <Route path="/booking/success" element={<BookingSuccessPage />} />
            <Route path="/booking/failure" element={<BookingFailurePage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/theatres" element={<TheatresPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            {/* Protected */}
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/movies" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  )
}

export default App
