import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Check } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { VideoServer } from "@/types"

interface VideoServerSwitcherProps {
  servers: VideoServer[]
  currentIndex: number
  onServerChange: (index: number) => void
}

export function VideoServerSwitcher({
  servers,
  currentIndex,
  onServerChange,
}: VideoServerSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Settings className="h-4 w-4" />
        {servers[currentIndex]?.name || "Server"}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 z-50 min-w-[200px]"
            >
              <Card className="p-2">
                <div className="space-y-1">
                  {servers.map((server, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onServerChange(index)
                        setIsOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                        index === currentIndex
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <span>{server.name}</span>
                      {index === currentIndex && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

