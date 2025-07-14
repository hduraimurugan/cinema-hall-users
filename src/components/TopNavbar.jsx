import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navigationItems = [
  { name: "Movies", href: "/movies", current: false },
  { name: "Theatres", href: "/theatres", current: false },
]

const rightNavItems = [
  { name: "My Bookings", href: "/bookings" },
  { name: "Offers", href: "/offers" },
  { name: "Gift Cards", href: "/gift-cards" },
]

export function TopNavbar() {
  const location = useLocation()

  return (
    <div className="border-b bg-background">
      <div className="flex mx-auto container h-12 items-center justify-between px-4 lg:px-6">
        {/* Main Navigation */}
        <nav className="flex items-center space-x-8">
          {navigationItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive
                    ? "text-primary border-b-2 border-primary pb-3"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Right Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          {rightNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
