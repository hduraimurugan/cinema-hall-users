import { useState } from 'react'
import AdBanner from '../components/AdBanner'
import MoviesList from '../components/MoviesList'
import { useCustomerAuth } from '../context/CustomerAuthContext'

const MoviesPage = () => {
  const { customer } = useCustomerAuth()

  // Optional: State for additional filters
  const [filters] = useState({
    status: 'now_showing',
    limit: 20
  })

  // Extract district and state from customer
  const customerDistrict = customer?.district
  const customerState = customer?.state

  return (
    <>
      {/* Display customer location if available */}
      {(customerDistrict || customerState) && (
        <div className="mx-auto container px-4 sm:px-6 lg:px-14 py-7">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-muted-foreground">
                Showing movies near: <span className="font-semibold text-foreground">
                  {customerDistrict && customerState
                    ? `${customerDistrict}, ${customerState}`
                    : customerDistrict || customerState}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      <AdBanner />

      <MoviesList
        title="Now Showing"
        filters={filters}
      // district={customerDistrict}
      // state={customerState}
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