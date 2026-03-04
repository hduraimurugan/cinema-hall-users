import { useState, useMemo } from 'react'
import { State, City } from 'country-state-city'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MapPin, Search } from 'lucide-react'
import { useCustomerAuth } from '../context/CustomerAuthContext'

const POPULAR_CITIES = [
  { city: "Mumbai", stateCode: "MH" },
  { city: "Delhi", stateCode: "DL" },
  { city: "Bengaluru", stateCode: "KA" },
  { city: "Chennai", stateCode: "TN" },
  { city: "Hyderabad", stateCode: "TS" },
  { city: "Kolkata", stateCode: "WB" },
  { city: "Pune", stateCode: "MH" },
  { city: "Ahmedabad", stateCode: "GJ" },
]

// Build state ISO code -> state name map once
const stateMap = {}
State.getStatesOfCountry("IN").forEach((s) => {
  stateMap[s.isoCode] = s.name
})

// Pre-build popular cities with full state names
const popularCitiesWithState = POPULAR_CITIES.map((c) => ({
  ...c,
  stateName: stateMap[c.stateCode] || c.stateCode,
}))

// Build full city list (all Indian cities across all states)
const allCities = State.getStatesOfCountry("IN").flatMap((s) =>
  City.getCitiesOfState("IN", s.isoCode).map((c) => ({
    city: c.name,
    stateCode: s.isoCode,
    stateName: s.name,
  }))
)

export function LocationModal({ open, onOpenChange }) {
  const { setLocationManually } = useCustomerAuth()
  const [search, setSearch] = useState('')

  const filteredCities = useMemo(() => {
    if (!search.trim()) return []
    const query = search.toLowerCase()
    return allCities
      .filter((c) => c.city.toLowerCase().includes(query))
      .slice(0, 50)
  }, [search])

  const handleSelect = (city, stateName) => {
    setLocationManually(city, stateName)
    setSearch('')
    onOpenChange(false)
  }

  const handleModalChange = (isOpen) => {
    if (!isOpen) setSearch('')
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleModalChange}>
      <DialogContent className="sm:max-w-[500px] top-[5%] translate-y-0 p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
            </div>
            Select Your City
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose your city to see movies and showtimes near you
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for your city..."
              className="pl-10 bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Popular Cities (shown when no search) */}
        {!search.trim() && (
          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">
              Popular Cities
            </p>
            <div className="grid grid-cols-4 gap-2">
              {popularCitiesWithState.map((c) => (
                <button
                  key={c.city + c.stateCode}
                  onClick={() => handleSelect(c.city, c.stateName)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                >
                  <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-xs font-medium text-foreground">{c.city}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {search.trim() && (
          <ScrollArea className="h-[300px]">
            <div className="px-6 pb-6">
              {filteredCities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No cities found for "{search}"
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredCities.map((c, i) => (
                    <button
                      key={`${c.city}-${c.stateCode}-${i}`}
                      onClick={() => handleSelect(c.city, c.stateName)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors duration-150 cursor-pointer text-left group"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{c.city}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.stateName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
