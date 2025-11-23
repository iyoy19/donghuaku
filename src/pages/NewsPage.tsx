import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar, User } from "lucide-react"

interface NewsItem {
  id: number
  title: string
  content: string
  date: string
  author: string
  image?: string
}

export function NewsPage() {
  // Dummy news data - in real app, this would come from API
  const newsItems: NewsItem[] = [
    {
      id: 1,
      title: "New Donghua Releases This Month",
      content: "Discover the latest donghua releases that are making waves in the animation community. From action-packed adventures to heartwarming stories, there's something for everyone.",
      date: "2024-01-15",
      author: "Admin",
    },
    {
      id: 2,
      title: "Top 10 Donghua of 2024",
      content: "We've compiled a list of the most popular and highly-rated donghua series of 2024. Check out which shows made it to the top!",
      date: "2024-01-10",
      author: "Editor",
    },
    {
      id: 3,
      title: "Upcoming Donghua Announcements",
      content: "Get the latest updates on upcoming donghua series. New seasons, spin-offs, and original content coming soon!",
      date: "2024-01-05",
      author: "Admin",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">News & Updates</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.map((news, index) => (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                {news.image && (
                  <div className="aspect-video bg-muted">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{news.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {news.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(news.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{news.author}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

