import { CreditCard, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function PaymentsSection() {
  // Mock data - replace with actual API call
  const payments = [
    { id: 1, user: "John Doe", amount: 9.99, plan: "Premium", status: "completed", date: "2024-03-15" },
    { id: 2, user: "Jane Smith", amount: 19.99, plan: "Pro", status: "pending", date: "2024-03-14" },
    { id: 3, user: "Bob Wilson", amount: 9.99, plan: "Premium", status: "failed", date: "2024-03-13" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Subscription & Payments</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola langganan dan pembayaran</p>
        </div>
        <Button className="w-full sm:w-auto">
          <DollarSign className="h-4 w-4 mr-2" />
          Tambah Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">$12,450</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-3xl font-bold mt-2">342</p>
              </div>
              <CreditCard className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold mt-2">12</p>
              </div>
              <Clock className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{payment.user}</td>
                    <td className="p-3">${payment.amount}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                        {payment.plan}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-sm">
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{payment.date}</td>
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

