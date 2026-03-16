import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Yoga Flow</span>
          </a>
          <nav className="flex items-center gap-6">
            <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
              Admin
            </a>
            <a href="/settings" className="text-sm font-medium hover:text-primary transition-colors">
              Settings
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Yoga Flow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
