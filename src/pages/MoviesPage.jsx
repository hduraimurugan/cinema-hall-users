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
      {/* Location context strip */}
      {(customerDistrict || customerState) && (
        <div className="border-0 border-border backdrop-blur-sm">
          <div className="mx-auto container px-4 sm:px-6 lg:px-14">
            <div className="flex items-center gap-2.5 py-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 shrink-0">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span className="text-xs text-muted-foreground">Showing results near</span>
              <span className="text-xs font-semibold text-foreground tracking-wide">
                {customerDistrict && customerState
                  ? `${customerDistrict}, ${customerState}`
                  : customerDistrict || customerState}
              </span>
              {/* <span className="ml-auto flex items-center gap-1 text-xs text-primary font-medium cursor-pointer hover:text-primary/80 transition-colors select-none">
                Change
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span> */}
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
      <MoviesList
        title="Upcoming"
        filters={{ status: 'upcoming', limit: 20 }}
      />
    </>
  )
}

export default MoviesPage