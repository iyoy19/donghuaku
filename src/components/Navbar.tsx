import { Link } from "react-router-dom"
import { Menu } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import { ThemeSwitcher } from "./ThemeSwitcher"
import { Button } from "./ui/button"
import { Sheet, SheetHeader, SheetTitle, SheetClose } from "./ui/sheet"
import { SearchBar } from "./SearchBar"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/category", label: "Category" },
    { to: "/news", label: "News" },
    { to: "/watchlist", label: "Watchlist" },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md glassmorphism"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              DonghuaKu
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <SearchBar />
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetClose onClose={() => setMobileMenuOpen(false)} />
        </SheetHeader>
        <div className="flex flex-col space-y-4 p-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </Sheet>
    </motion.nav>
  )
}

