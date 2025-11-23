import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Genre } from "@/types"

interface GenreSectionProps {
  genres: Genre[]
}

export function GenreSection({ genres }: GenreSectionProps) {
  const animeGenres = genres.filter((g) =>
    [16, 10759, 10762, 10765].includes(g.id)
  )

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Browse by Genre</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {animeGenres.map((genre, index) => (
          <motion.div
            key={genre.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Link
              to={`/search?genre=${genre.id}`}
              className="block p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg"
            >
              <h3 className="font-semibold text-center">{genre.name}</h3>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

