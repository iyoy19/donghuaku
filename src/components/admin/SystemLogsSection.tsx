import { FileText, AlertCircle, Info, CheckCircle, XCircle, Filter } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SystemLogsSection() {
  // Mock data - replace with actual API call
  const logs = [
    { id: 1, level: "info", message: "System backup completed successfully", timestamp: "2024-03-15 10:30:00", source: "Backup Service" },
    { id: 2, level: "warning", message: "High memory usage detected", timestamp: "2024-03-15 09:15:00", source: "System Monitor" },
    { id: 3, level: "error", message: "Database connection timeout", timestamp: "2024-03-15 08:45:00", source: "Database" },
    { id: 4, level: "success", message: "User authentication successful", timestamp: "2024-03-15 08:30:00", source: "Auth Service" },
  ]

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'border-l-blue-500 bg-blue-500/5'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-500/5'
      case 'error':
        return 'border-l-red-500 bg-red-500/5'
      case 'success':
        return 'border-l-green-500 bg-green-500/5'
      default:
        return 'border-l-muted'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">System & Logs</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Monitor sistem dan log aktivitas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            Export Logs
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold mt-2 text-green-500">Online</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold mt-2">99.9%</p>
              </div>
              <Info className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold mt-2">1,234</p>
              </div>
              <FileText className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors (24h)</p>
                <p className="text-2xl font-bold mt-2">3</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border-l-4 ${getLogColor(log.level)} flex items-start gap-3`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{log.message}</p>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Source: {log.source}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

