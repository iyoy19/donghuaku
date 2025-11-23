import { Bell, Send } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NotificationsSection() {
  // Mock data - replace with actual API call
  const notifications = [
    { id: 1, title: "New Episode Added", message: "Episode 12 of 'Demon Slayer' has been added", time: "2 hours ago", read: false },
    { id: 2, title: "System Update", message: "System maintenance scheduled for tonight", time: "5 hours ago", read: false },
    { id: 3, title: "User Report", message: "New user report received", time: "1 day ago", read: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Notifications & Communication</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola notifikasi dan komunikasi dengan pengguna</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          Kirim Notifikasi
        </Button>
      </div>

      {/* Send Notification */}
      <Card>
        <CardHeader>
          <CardTitle>Kirim Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Judul</label>
            <Input placeholder="Masukkan judul notifikasi" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Pesan</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Masukkan pesan notifikasi"
            />
          </div>
          <div className="flex gap-2">
            <Button>Kirim ke Semua</Button>
            <Button variant="outline">Kirim ke Grup Tertentu</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

