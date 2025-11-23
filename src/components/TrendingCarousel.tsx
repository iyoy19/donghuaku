import { useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { CardPoster } from "./CardPoster"
import { Donghua } from "@/types"
import { SkeletonCard } from "./SkeletonCard"

interface TrendingCarouselProps {
  items: Donghua[]
  title: string
  loading?: boolean
}

export function TrendingCarousel({ items, title, loading }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const scrollAmount = 400
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (!items || items.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <p className="text-muted-foreground">No items available</p>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="hidden md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="hidden md:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-[140px] md:w-[180px]"
          >
            <CardPoster item={item} index={index} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

