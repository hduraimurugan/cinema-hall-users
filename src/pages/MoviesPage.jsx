import { useState } from 'react'
import AdBanner from '../components/AdBanner'
import MoviesList from '../components/MoviesList'

const MoviesPage = () => {
  // Optional: State for location-based filtering
  // You can uncomment and use these if you want to add location filtering UI
  // const [selectedDistrict, setSelectedDistrict] = useState(null)
  // const [selectedState, setSelectedState] = useState(null)

  // Optional: State for additional filters
  const [filters] = useState({
    status: 'now_showing',
    limit: 20
  })

  return (
    <>
      <AdBanner />

      {/* Optional: Add filter UI here in the future */}
      {/* Example:
      <div className="max-w-[1400px] mx-auto px-3 md:px-6 lg:px-8 py-4">
        <LocationFilter
          onDistrictChange={setSelectedDistrict}
          onStateChange={setSelectedState}
        />
      </div>
      */}

      <MoviesList
        title="Now Showing"
        filters={filters}
        // district={selectedDistrict}
        // state={selectedState}
      />

      {/* You can add multiple MoviesList components with different filters */}
      {/* Example:
      <MoviesList
        title="Coming Soon"
        filters={{ status: 'coming_soon', limit: 20 }}
      />
      */}
    </>
  )
}

export default MoviesPage