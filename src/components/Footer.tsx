import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t bg-background mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">DonghuaKu</h3>
            <p className="text-sm text-muted-foreground">
              Your ultimate destination for watching donghua online. Discover the best Chinese animations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-muted-foreground hover:text-primary transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link to="/search?status=ongoing" className="text-muted-foreground hover:text-primary transition-colors">
                  Ongoing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search?genre=16" className="text-muted-foreground hover:text-primary transition-colors">
                  Animation
                </Link>
              </li>
              <li>
                <Link to="/search?genre=10759" className="text-muted-foreground hover:text-primary transition-colors">
                  Action & Adventure
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DonghuaKu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

