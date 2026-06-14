import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useCustomerAuth } from "../context/CustomerAuthContext"
import { Film, Building2, Tag, Gift, Ticket } from "lucide-react"

const leftNavItems = [
  { name: "Movies", href: "/movies", icon: Film },
  { name: "Theatres", href: "/theatres", icon: Building2 },
]

const rightNavItems = [
  { name: "Offers", href: "/offers", icon: Tag },
  { name: "Gift Cards", href: "/gift-cards", icon: Gift },
]

function NavLink({ item, isActive }) {
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 sm:px-4 text-sm font-medium transition-all duration-200 whitespace-nowrap",
        "before:absolute before:inset-x-2 before:bottom-0 before:h-0.5 before:rounded-full before:transition-transform before:duration-200",
        isActive
          ? "text-primary before:bg-primary before:scale-x-100"
          : "text-muted-foreground hover:text-foreground before:bg-foreground/20 hover:before:scale-x-75"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {item.name}
    </Link>
  )
}

export function TopNavbar() {
  const location = useLocation()
  const { customer } = useCustomerAuth()

  const mobileItems = [
    ...leftNavItems,
    ...(customer ? [{ name: "My Bookings", href: "/bookings", icon: Ticket }] : []),
    ...rightNavItems,
  ]

  const desktopRightItems = [
    ...(customer ? [{ name: "My Bookings", href: "/bookings", icon: Ticket }] : []),
    ...rightNavItems,
  ]

  return (
    <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 transition-all duration-300">
      <div className="mx-auto flex h-11 sm:h-12 items-stretch justify-between max-w-7xl px-3 sm:px-6 lg:px-8">

        {/* Mobile: all nav items in a horizontal scrollable strip */}
        <nav
          className="flex sm:hidden items-stretch gap-0.5 overflow-x-auto no-scrollbar"
          role="navigation"
          aria-label="Main navigation"
        >
          {mobileItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return <NavLink key={item.name} item={item} isActive={isActive} />
          })}
        </nav>

        {/* Desktop: left nav */}
        <nav
          className="hidden sm:flex items-stretch gap-0.5"
          aria-label="Main navigation"
        >
          {leftNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return <NavLink key={item.name} item={item} isActive={isActive} />
          })}
        </nav>

        {/* Desktop: right nav */}
        <nav
          className="hidden sm:flex items-stretch gap-0.5"
          aria-label="Secondary navigation"
        >
          {desktopRightItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return <NavLink key={item.name} item={item} isActive={isActive} />
          })}
        </nav>

      </div>
    </div>
  )
}
