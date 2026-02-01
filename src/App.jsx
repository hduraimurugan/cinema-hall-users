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
import SeatSelectionPage from './pages/SeatSelectionPage.jsx';
import BookingSuccessPage from './pages/BookingSuccessPage.jsx';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route element={
            <CinemaLayout />
          }>

            {/* <Route path="/" element={<HomePage />} /> */}
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movie/:movieId" element={<MovieDetailsPage />} />
            <Route path="/show/:showId" element={<SeatSelectionPage />} />
            <Route path="/booking/success" element={<BookingSuccessPage />} />
            <Route path="/theatres" element={<TheatresPage />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

          </Route>

          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/movies" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  )
}

export default App