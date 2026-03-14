import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Film, Bell, Search, MapPin, User, LogOut, Settings, Sun, Moon, Menu } from 'lucide-react'
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useCustomerAuth } from "../context/CustomerAuthContext"
import { useTheme } from "../context/ThemeContext"
import { LoginModal } from "./LoginModal"
import { LocationModal } from "./LocationModal"

// Mock notifications
const mockNotifications = [
    { id: 1, title: "New booking received", time: "2 min ago", type: "booking" },
    { id: 2, title: "Screen 3 maintenance due", time: "1 hour ago", type: "maintenance" },
    { id: 3, title: "Revenue target achieved", time: "3 hours ago", type: "success" },
]

export function TopBar() {
    const [searchValue, setSearchValue] = useState("")
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const [locationOpen, setLocationOpen] = useState(false)

    const { customer, logout, district, state, locationLoading } = useCustomerAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()

    // Auto-open login modal when redirected from a protected route
    useEffect(() => {
        if (location.state?.openLogin) {
            setLoginOpen(true)
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location.state?.openLogin])

    // Auto-open location modal when no location is available
    useEffect(() => {
        if (!locationLoading && !district && !state) {
            setLocationOpen(true)
        }
    }, [locationLoading, district, state])

    const handleSearch = (e) => {
        e.preventDefault()
        console.log("Searching for:", searchValue)
    }

    return (
        <>
            <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto container h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Left: Logo */}
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Film className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold text-primary hidden sm:inline">
                            CineMax
                        </span>
                    </Link>

                    {/* Center: Search Bar */}
                    <div className="hidden sm:flex flex-1 max-w-2xl mx-4">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${isSearchFocused ? "text-primary" : "text-muted-foreground"}`} />
                            <Input
                                type="search"
                                placeholder="Search for Movies, Events, Plays, Sports and Activities"
                                className={`pl-10 bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${isSearchFocused ? "shadow-md" : ""}`}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </form>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Mobile Search Icon */}
                        <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => alert("Mobile search to be implemented")}>
                            <Search className="h-5 w-5" />
                        </Button>

                        {/* Desktop Theme Toggle */}
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:inline-flex rounded-full hover:bg-primary/10">
                            {theme === "dark" ? <Sun className="h-5 w-5 hover:rotate-45" /> : <Moon className="h-5 w-5 hover:-rotate-45" />}
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* Desktop Location Selector */}
                        <Button
                            variant="ghost"
                            className="hidden sm:flex items-center gap-2 text-sm rounded-full px-4 py-2 hover:bg-primary/10 transition-all duration-200 group border border-border/50 hover:border-primary/30"
                            onClick={() => setLocationOpen(true)}
                        >
                            <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-200" />
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">{district || "Select"}</span>
                                {district && state && (
                                    <>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground text-xs">{state}</span>
                                    </>
                                )}
                            </div>
                        </Button>

                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative rounded-full hover:bg-primary/10 transition-all duration-200"
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse">
                                        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></span>
                                    </span>
                                    <span className="sr-only">Notifications</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">Notifications</p>
                                        <p className="text-xs text-muted-foreground">
                                            You have {mockNotifications.length} unread notifications
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-64 overflow-y-auto">
                                    {mockNotifications.map((notification) => (
                                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                                            <div className="flex w-full items-start justify-between">
                                                <p className="text-sm font-medium">{notification.title}</p>
                                                <span className="text-xs text-muted-foreground">{notification.time}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/notifications" className="w-full text-center">
                                        View all notifications
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* customer or Sign In */}
                        {customer ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200"
                                    >
                                        <Avatar className="h-9 w-9 border-2 border-primary/20">
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                                                {customer?.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">{customer.name}</p>
                                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile" className="flex cursor-pointer items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings" className="flex cursor-pointer items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                                        onClick={logout}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button size="sm" className="sm:inline-flex bg-primary text-primary-foreground" onClick={() => setLoginOpen(true)}>
                                Sign in
                            </Button>
                        )}

                        {/* Mobile Dropdown for Theme, Location, and Login */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <Menu className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={toggleTheme}>
                                    {theme === "dark" ? (
                                        <>
                                            <Sun className="mr-2 h-4 w-4" />
                                            Light Mode
                                        </>
                                    ) : (
                                        <>
                                            <Moon className="mr-2 h-4 w-4" />
                                            Dark Mode
                                        </>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTimeout(() => setLocationOpen(true), 0)}>
                                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium">{district || "Select Location"}</span>
                                        {district && state && (
                                            <>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="text-muted-foreground text-xs">{state}</span>
                                            </>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                                {!customer && (
                                    <DropdownMenuItem onClick={() => setTimeout(() => setLoginOpen(true), 0)}>
                                        <User className="mr-2 h-4 w-4" />
                                        Sign In
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Login Modal */}
            <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

            {/* Location Modal */}
            <LocationModal open={locationOpen} onOpenChange={setLocationOpen} />
        </>
    )
}
