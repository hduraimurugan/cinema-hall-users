import { Outlet } from "react-router-dom"
import { TopBar } from "./TopBar"
import { TopNavbar } from "./TopNavbar"

export function CinemaLayout() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <TopBar />

      {/* Navigation Bar */}
      <TopNavbar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="min-h-full flex flex-col">
          <div className="flex-1 mb-20">
            <Outlet />
          </div>

          {/* Footer */}
          <footer className="border-t bg-secondary/20 mt-auto">
            <div className="flex h-16 items-center justify-center px-4">
              <p className="text-sm text-muted-foreground">
                © 2025 CinemaMax. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </main>

    </div>
  )
}
