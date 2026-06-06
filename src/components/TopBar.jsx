import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Film, Bell, Search, MapPin, User, LogOut, Settings, Sun, Moon, Menu, X, Ticket } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCustomerAuth } from "../context/CustomerAuthContext"
import { useTheme } from "../context/ThemeContext"
import { LoginModal } from "./LoginModal"
import { LocationModal } from "./LocationModal"
import SearchMovies from "./SearchMovies"

const mockNotifications = [
    { id: 1, title: "Booking confirmed — Thaai Kizhavi", time: "2 min ago", unread: true },
    { id: 2, title: "Upcoming show reminder in 2 hours", time: "1 hour ago", unread: true },
    { id: 3, title: "Special offer: 20% off on weekdays", time: "3 hours ago", unread: false },
]

export function TopBar() {
    const [searchValue, setSearchValue] = useState("")
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const [locationOpen, setLocationOpen] = useState(false)

    const { customer, logout, district, state, locationLoading } = useCustomerAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (location.state?.openLogin) {
            setLoginOpen(true)
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location.state?.openLogin])

    useEffect(() => {
        if (!locationLoading && !district && !state) {
            setLocationOpen(true)
        }
    }, [locationLoading, district, state])

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
            setMobileSearchOpen(false)
        }
    }

    const unreadCount = mockNotifications.filter(n => n.unread).length

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
                <div className="mx-auto container flex h-14 sm:h-16 items-center px-3 sm:px-6 lg:px-8">

                    {/* Mobile search overlay */}
                    {mobileSearchOpen && (
                        <div className="flex sm:hidden items-center gap-2 w-full">
                            <form onSubmit={handleSearch} className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                                <Input
                                    type="search"
                                    placeholder="Search movies, events..."
                                    className="pl-9 h-9 rounded-full bg-secondary/60 border-primary/20 focus-visible:ring-primary/30 text-sm"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    autoFocus
                                />
                            </form>
                            <Button
                                variant="ghost" size="icon"
                                className="h-9 w-9 shrink-0 rounded-full"
                                onClick={() => { setMobileSearchOpen(false); setSearchValue("") }}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    )}

                    {/* Main bar — hidden on mobile when search is open */}
                    <div className={`${mobileSearchOpen ? "hidden sm:flex" : "flex"} items-center justify-between flex-1 gap-2`}>

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                                <Film className="h-4 w-4" />
                            </div>
                            <span className="hidden sm:block font-bold text-primary text-lg tracking-tight">CineMax</span>
                        </Link>

                        {/* Desktop search bar */}
                        <SearchMovies />

                        {/* Right controls */}
                        <div className="flex items-center gap-0.5 sm:gap-1">

                            {/* Mobile: search icon */}
                            <Button
                                variant="ghost" size="icon"
                                className="sm:hidden h-9 w-9 rounded-full hover:bg-primary/10"
                                onClick={() => setMobileSearchOpen(true)}
                            >
                                <Search className="h-[18px] w-[18px]" />
                            </Button>

                            {/* Mobile: location icon with dot if set */}
                            <Button
                                variant="ghost" size="icon"
                                className="sm:hidden h-9 w-9 rounded-full hover:bg-primary/10 relative"
                                onClick={() => setLocationOpen(true)}
                            >
                                <MapPin className="h-[18px] w-[18px]" />
                                {district && (
                                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                                )}
                            </Button>

                            {/* Desktop: theme toggle */}
                            <Button
                                variant="ghost" size="icon"
                                onClick={toggleTheme}
                                className="hidden sm:inline-flex h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
                            >
                                {theme === "dark"
                                    ? <Sun className="h-[18px] w-[18px]" />
                                    : <Moon className="h-[18px] w-[18px]" />
                                }
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            {/* Desktop: location pill */}
                            <Button
                                variant="ghost"
                                onClick={() => setLocationOpen(true)}
                                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full text-sm hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all duration-200"
                            >
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="font-medium">{district || "Select city"}</span>
                                {district && state && (
                                    <span className="text-muted-foreground text-xs shrink-0">· {state}</span>
                                )}
                            </Button>

                            {/* Notifications */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost" size="icon"
                                        className="relative h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
                                    >
                                        <Bell className="h-[18px] w-[18px]" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel className="flex items-center justify-between py-3">
                                        <span className="font-semibold text-sm">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="text-xs text-primary font-medium">{unreadCount} unread</span>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="max-h-64 overflow-y-auto">
                                        {mockNotifications.map((n) => (
                                            <DropdownMenuItem key={n.id} className="flex items-start gap-3 p-3 cursor-pointer">
                                                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.unread ? "bg-primary" : "bg-transparent"}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm leading-snug ${n.unread ? "font-medium" : "text-muted-foreground"}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="justify-center text-primary text-sm font-medium py-2.5" asChild>
                                        <Link to="/notifications">View all notifications</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* User avatar / Sign In */}
                            {customer ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 p-0 ml-0.5">
                                            <Avatar className="h-8 w-8 border-2 border-primary/30">
                                                {customer?.avatar && <AvatarImage src={customer.avatar} alt={customer?.name} className="object-cover" />}
                                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold">
                                                    {customer?.name?.charAt(0).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="font-normal py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-primary/20">
                                                    {customer?.avatar && <AvatarImage src={customer.avatar} alt={customer?.name} className="object-cover" />}
                                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold">
                                                        {customer?.name?.charAt(0).toUpperCase() || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold leading-none whitespace-nowrap">{customer.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 truncate">{customer.email}</p>
                                                </div>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                                                <User className="h-4 w-4" /> Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/bookings" className="flex items-center gap-2 cursor-pointer">
                                                <Ticket className="h-4 w-4" /> My Bookings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                                                <Settings className="h-4 w-4" /> Settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                            onClick={logout}
                                        >
                                            <LogOut className="h-4 w-4" /> Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    size="sm"
                                    className="h-8 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-full shadow-sm ml-0.5"
                                    onClick={() => setLoginOpen(true)}
                                >
                                    Sign in
                                </Button>
                            )}

                            {/* Mobile: hamburger for theme + location details */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost" size="icon"
                                        className="sm:hidden h-9 w-9 rounded-full hover:bg-primary/10 ml-0.5"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem onClick={toggleTheme} className="gap-2">
                                        {theme === "dark"
                                            ? <><Sun className="h-4 w-4" /> Light Mode</>
                                            : <><Moon className="h-4 w-4" /> Dark Mode</>
                                        }
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setTimeout(() => setLocationOpen(true), 0)}
                                        className="gap-2"
                                    >
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="truncate">
                                            {district ? `${district}${state ? ", " + state : ""}` : "Select Location"}
                                        </span>
                                    </DropdownMenuItem>
                                    {customer && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link to="/bookings" className="flex items-center gap-2">
                                                    <Ticket className="h-4 w-4" /> My Bookings
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </div>
                    </div>

                </div>
            </header>

            <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
            <LocationModal open={locationOpen} onOpenChange={setLocationOpen} />
        </>
    )
}
