import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Database, Key, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { api } from "@/services/api"

interface SystemSettings {
  siteName: string
  siteDescription: string
  tmdbApiKey: string
  databaseUrl: string
  maintenanceMode: boolean
  allowRegistration: boolean
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "DonghuaKu",
    siteDescription: "Streaming Website for Donghua",
    tmdbApiKey: "",
    databaseUrl: "",
    maintenanceMode: false,
    allowRegistration: false,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem("systemSettings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Error loading settings:", e)
      }
    }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save to localStorage (in real app, this would be saved to database)
      localStorage.setItem("systemSettings", JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestDatabase = async () => {
    try {
      const result = await api.testDatabase()
      if (result.success) {
        alert("Database connection successful!")
      } else {
        alert("Database connection failed: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      alert("Database connection failed: " + (error instanceof Error ? error.message : "Unknown error"))
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
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Site Name
                </label>
                <Input
                  value={settings.siteName}
                  onChange={(e) =>
                    setSettings({ ...settings, siteName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Site Description
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.siteDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, siteDescription: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="maintenanceMode" className="text-sm font-medium">
                  Maintenance Mode
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={(e) =>
                    setSettings({ ...settings, allowRegistration: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="allowRegistration" className="text-sm font-medium">
                  Allow User Registration
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  TMDB API Key
                </label>
                <Input
                  type="password"
                  value={settings.tmdbApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, tmdbApiKey: e.target.value })
                  }
                  placeholder="Enter TMDB API Key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for fetching movie/TV data from TMDB
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Database Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Database URL
                </label>
                <Input
                  type="password"
                  value={settings.databaseUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, databaseUrl: e.target.value })
                  }
                  placeholder="postgresql://user:password@host:port/database"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Database connection string (hidden for security)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleTestDatabase}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Test Database Connection
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Save className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Save className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

