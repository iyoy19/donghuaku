import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { api } from "@/services/api"
import { Episode } from "@/types"

export function AddEpisodePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Partial<Episode & { donghuaId: number }>>({
    donghuaId: 0,
    episodeNumber: 1,
    title: "",
    thumbnail: "",
    duration: 24,
    servers: [{ name: "Streamwish", url: "" }],
    subtitles: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [donghuaList, setDonghuaList] = useState<any[]>([])

  useEffect(() => {
    const fetchDonghua = async () => {
      try {
        const allDonghua = await api.getAllDonghua()
        setDonghuaList(allDonghua)
      } catch (error) {
        console.error("Error fetching donghua:", error)
      }
    }
    fetchDonghua()
  }, [])

  const handleAddServer = () => {
    setFormData({
      ...formData,
      servers: [...(formData.servers || []), { name: "", url: "" }],
    })
  }

  const handleServerChange = (index: number, field: "name" | "url", value: string) => {
    const newServers = [...(formData.servers || [])]
    newServers[index] = { ...newServers[index], [field]: value }
    setFormData({ ...formData, servers: newServers })
  }

  const handleRemoveServer = (index: number) => {
    const newServers = formData.servers?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, servers: newServers })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.donghuaId || !formData.title || !formData.servers || formData.servers.length === 0) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.createEpisode({
        donghuaId: formData.donghuaId,
        episodeNumber: formData.episodeNumber,
        title: formData.title,
        thumbnail: formData.thumbnail,
        duration: formData.duration,
        airDate: null,
        servers: formData.servers,
        subtitles: formData.subtitles || [],
      })
      navigate("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add episode')
      console.error('Error adding episode:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add Episode</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Episode Information</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Donghua *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.donghuaId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        donghuaId: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  >
                    <option value="">Select Donghua</option>
                    {donghuaList.map((donghua) => (
                      <option key={donghua.id} value={donghua.id}>
                        {donghua.title} {donghua.chineseTitle ? `(${donghua.chineseTitle})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Episode Number *
                  </label>
                  <Input
                    type="number"
                    value={formData.episodeNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        episodeNumber: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 24,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">
                    Thumbnail URL
                  </label>
                  <Input
                    value={formData.thumbnail}
                    onChange={(e) =>
                      setFormData({ ...formData, thumbnail: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium">Video Servers *</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddServer}
                  >
                    Add Server
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.servers?.map((server, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Server name (e.g., Streamwish)"
                        value={server.name}
                        onChange={(e) =>
                          handleServerChange(index, "name", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Server URL"
                        value={server.url}
                        onChange={(e) =>
                          handleServerChange(index, "url", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveServer(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Link to="/admin">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Episode'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

