import { BarChart3, TrendingUp, Users, Film, Eye, DollarSign } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function AnalyticsSection() {
  // Mock data - replace with actual API call
  const stats = {
    totalViews: 125000,
    activeUsers: 3420,
    revenue: 12500,
    contentViews: 89000,
    growth: 12.5
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Analytics & Reports</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Statistik dan analitik platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-3xl font-bold mt-2">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-500 mt-1">+{stats.growth}% dari bulan lalu</p>
              </div>
              <Eye className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold mt-2">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-green-500 mt-1">+8.2% dari bulan lalu</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-3xl font-bold mt-2">${stats.revenue.toLocaleString()}</p>
                <p className="text-xs text-green-500 mt-1">+15.3% dari bulan lalu</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Views</p>
                <p className="text-3xl font-bold mt-2">{stats.contentViews.toLocaleString()}</p>
                <p className="text-xs text-green-500 mt-1">+5.7% dari bulan lalu</p>
              </div>
              <Film className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Traffic Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart akan ditampilkan di sini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart akan ditampilkan di sini</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

