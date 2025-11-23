import { useState } from "react"
import { User, Search, Filter, MoreVertical, Ban, CheckCircle, XCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data - replace with actual API call
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "User", status: "active", joinDate: "2024-01-15" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Premium", status: "active", joinDate: "2024-02-20" },
    { id: 3, name: "Admin User", email: "admin@example.com", role: "Admin", status: "active", joinDate: "2024-01-01" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola pengguna dan akses mereka</p>
        </div>
        <Button className="w-full sm:w-auto">
          <User className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari user berdasarkan nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground">Nama</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground hidden lg:table-cell">Bergabung</th>
                    <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-2 sm:p-3">
                        <div className="font-medium text-sm sm:text-base">{user.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden mt-1">{user.email}</div>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground hidden md:table-cell">{user.email}</td>
                      <td className="p-2 sm:p-3">
                        <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3">
                        <span className={`flex items-center gap-1 text-xs ${
                          user.status === 'active' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {user.status === 'active' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">{user.joinDate}</td>
                      <td className="p-2 sm:p-3">
                        <div className="flex justify-end">
                          <DropdownMenu
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          >
                            <DropdownMenuItem>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aktifkan
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Ban className="h-4 w-4 mr-2" />
                              Nonaktifkan
                            </DropdownMenuItem>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

