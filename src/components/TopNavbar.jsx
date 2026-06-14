import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useCustomerAuth } from "../context/CustomerAuthContext"

const leftNavItems = [
    { name: "Movies", href: "/movies" },
    { name: "Theatres", href: "/theatres" },
]

const rightNavItems = [
    { name: "Offers", href: "/offers" },
    { name: "Gift Cards", href: "/gift-cards" },
]

export function TopNavbar() {
    const location = useLocation()
    const { customer } = useCustomerAuth()

    return (
        <div className="border-b border-border/60 bg-background transition-all duration-300">
            <div className="mx-auto container flex h-11 items-stretch justify-between px-3 sm:px-6 lg:px-8">

                {/* Left nav */}
                <nav className="flex items-stretch gap-0.5">
                    {leftNavItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center px-3 sm:px-4 text-sm font-medium transition-colors border-b-2 -mb-px",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Right nav */}
                <nav className="hidden sm:flex items-stretch gap-0.5">
                    {customer && (
                        <Link
                            to="/bookings"
                            className={cn(
                                "flex items-center px-3 sm:px-4 text-sm font-medium transition-colors border-b-2 -mb-px",
                                location.pathname.startsWith("/bookings")
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            My Bookings
                        </Link>
                    )}
                    {rightNavItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center px-3 sm:px-4 text-sm font-medium transition-colors border-b-2 -mb-px",
                                location.pathname.startsWith(item.href)
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

            </div>
        </div>
    )
}
