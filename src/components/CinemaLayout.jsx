import { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { TopBar } from "./TopBar"
import { TopNavbar } from "./TopNavbar"

export function CinemaLayout() {
  const mainRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [pathname])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <TopBar />

      {/* Navigation Bar */}
      <TopNavbar />

      {/* Main Content */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto min-h-0 scroll-smooth"
        id="main-content"
        role="main"
        aria-label="Main content"
      >
        <div className="min-h-full flex flex-col">
          <div className="flex-1">
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
              <div key={pathname} className="page-enter">
                <Outlet />
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-border/40 bg-secondary/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  &copy; 2026 CinemaMax. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>

    </div>
  )
}
