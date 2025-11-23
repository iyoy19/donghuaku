import { Shield, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ModerationSection() {
  // Mock data - replace with actual API call
  const reports = [
    { id: 1, type: "Content", title: "Inappropriate Content", reporter: "User123", status: "pending", date: "2024-03-15" },
    { id: 2, type: "User", title: "Spam Account", reporter: "User456", status: "reviewed", date: "2024-03-14" },
    { id: 3, type: "Comment", title: "Harassment Report", reporter: "User789", status: "resolved", date: "2024-03-13" },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-500/10 text-yellow-500">Pending</span>
      case 'reviewed':
        return <span className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-500">Reviewed</span>
      case 'resolved':
        return <span className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-500">Resolved</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Moderation & Reports</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola laporan dan moderasi konten</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Shield className="h-4 w-4 mr-2" />
          View All Reports
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
                <p className="text-3xl font-bold mt-2">12</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reviewed</p>
                <p className="text-3xl font-bold mt-2">45</p>
              </div>
              <Eye className="h-12 w-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold mt-2">128</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold mt-2">8</p>
              </div>
              <XCircle className="h-12 w-12 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reporter</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                        {report.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{report.title}</td>
                    <td className="p-3 text-sm text-muted-foreground">{report.reporter}</td>
                    <td className="p-3">{getStatusBadge(report.status)}</td>
                    <td className="p-3 text-sm text-muted-foreground">{report.date}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

