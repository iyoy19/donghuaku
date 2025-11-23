import { useState, useEffect } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { 
  LogOut, Settings, BarChart3, Film, Users, CreditCard, 
  Bell, Shield, FileText, LayoutDashboard, Menu, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { AdminSearchBar } from "@/components/AdminSearchBar"
import { api } from "@/services/api"
import { UserManagement } from "@/components/admin/UserManagement"
import { ContentManagement } from "@/components/admin/ContentManagement"
import { AnalyticsSection } from "@/components/admin/AnalyticsSection"
import { PaymentsSection } from "@/components/admin/PaymentsSection"
import { NotificationsSection } from "@/components/admin/NotificationsSection"
import { ModerationSection } from "@/components/admin/ModerationSection"
import { SystemLogsSection } from "@/components/admin/SystemLogsSection"

interface Statistics {
  totalDonghua: number
  totalEpisodes: number
  donghuaByStatus: Record<string, number>
  donghuaByType: Record<string, number>
  totalGenres: number
}

type MenuItem = 
  | "dashboard"
  | "user-management"
  | "content-management"
  | "analytics"
  | "payments"
  | "notifications"
  | "moderation"
  | "system-logs"
  | "settings"

const menuItems: { id: MenuItem; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "user-management", label: "User Management", icon: Users },
  { id: "content-management", label: "Content Management", icon: Film },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "payments", label: "Subscription & Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "moderation", label: "Moderation & Reports", icon: Shield },
  { id: "system-logs", label: "System & Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get active menu from URL params, default to "dashboard"
  const getMenuFromUrl = (): MenuItem => {
    const menuParam = searchParams.get('menu')
    if (menuParam && menuItems.some(item => item.id === menuParam)) {
      return menuParam as MenuItem
    }
    return "dashboard"
  }
  
  const [activeMenu, setActiveMenu] = useState<MenuItem>(getMenuFromUrl())
  const [menuOpen, setMenuOpen] = useState(false)

  // Sync activeMenu with URL params on mount and when URL changes
  useEffect(() => {
    const menuFromUrl = getMenuFromUrl()
    if (menuFromUrl !== activeMenu) {
      setActiveMenu(menuFromUrl)
    }
  }, [location.search]) // Only depend on location.search to avoid loops

  // Set default menu in URL if not present (only on mount)
  useEffect(() => {
    if (!searchParams.get('menu')) {
      setSearchParams({ menu: 'dashboard' }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const stats = await api.getStatistics()
        setStatistics(stats)
      } catch (error) {
        console.error("Error fetching statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  // Update URL when menu changes
  const handleMenuChange = (menu: MenuItem) => {
    setActiveMenu(menu)
    setSearchParams({ menu })
    setMenuOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    navigate("/admin/login")
  }

  const handleSearchSelect = (result: any) => {
    if (result.type === 'content') {
      navigate(`/admin/edit-donghua/${result.id}`)
    } else if (result.type === 'user') {
      handleMenuChange('user-management')
    } else if (result.type === 'report') {
      handleMenuChange('moderation')
    }
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 md:p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : statistics && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Total Donghua</p>
                          <p className="text-2xl md:text-3xl font-bold mt-2">{statistics.totalDonghua}</p>
                        </div>
                        <Film className="h-8 w-8 md:h-12 md:w-12 text-primary opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Total Episodes</p>
                          <p className="text-2xl md:text-3xl font-bold mt-2">{statistics.totalEpisodes}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 md:h-12 md:w-12 text-primary opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Total Genres</p>
                          <p className="text-2xl md:text-3xl font-bold mt-2">{statistics.totalGenres}</p>
                        </div>
                        <FileText className="h-8 w-8 md:h-12 md:w-12 text-primary opacity-50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Movies</p>
                          <p className="text-2xl md:text-3xl font-bold mt-2">{statistics.donghuaByType.movie || 0}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            TV: {statistics.donghuaByType.tv || 0}
                          </p>
                        </div>
                        <Film className="h-8 w-8 md:h-12 md:w-12 text-primary opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mb-6 md:mb-8">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs md:text-sm text-muted-foreground">Ongoing</p>
                        <p className="text-xl md:text-2xl font-bold">{statistics.donghuaByStatus.ongoing || 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
                        <p className="text-xl md:text-2xl font-bold">{statistics.donghuaByStatus.completed || 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs md:text-sm text-muted-foreground">Upcoming</p>
                        <p className="text-xl md:text-2xl font-bold">{statistics.donghuaByStatus.upcoming || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )
      case "user-management":
        return <UserManagement />
      case "content-management":
        return <ContentManagement />
      case "analytics":
        return <AnalyticsSection />
      case "payments":
        return <PaymentsSection />
      case "notifications":
        return <NotificationsSection />
      case "moderation":
        return <ModerationSection />
      case "system-logs":
        return <SystemLogsSection />
      case "settings":
        navigate("/admin/settings")
        return null
      default:
        return null
    }
  }

  const activeMenuItem = menuItems.find(item => item.id === activeMenu)

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Topbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Menu Dropdown & Title */}
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <DropdownMenu
                trigger={
                  <Button 
                    variant="outline" 
                    className="gap-2 flex-shrink-0"
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">Menu</span>
                    <ChevronDown className="h-3 w-3 hidden sm:inline" />
                  </Button>
                }
              >
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleMenuChange(item.id)}
                      className={activeMenu === item.id ? "bg-accent" : ""}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenu>
              
              <div className="flex-1 md:flex-none">
                <h1 className="text-xl md:text-2xl font-bold">
                  {activeMenuItem?.label || "Admin Dashboard"}
                </h1>
              </div>
            </div>

            {/* Right: Search Bar & Logout */}
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none md:min-w-[300px] lg:min-w-[400px]">
                <AdminSearchBar onSelect={handleSearchSelect} />
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="gap-2 flex-shrink-0"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <motion.div
          key={activeMenu}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  )
}
