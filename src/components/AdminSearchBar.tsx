import { useState, useEffect, useRef } from "react";
import { Search, X, User, Film, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { api } from "@/services/api";
import { getImageUrl } from "@/utils/image";

interface SearchResult {
  type: "user" | "content" | "report";
  id: string | number;
  title: string;
  subtitle?: string;
  image?: string;
  metadata?: string;
}

export function AdminSearchBar({
  onSelect,
}: {
  onSelect?: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "user" | "content" | "report"
  >("all");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const allResults: SearchResult[] = [];

        // Search content (donghua)
        if (activeFilter === "all" || activeFilter === "content") {
          try {
            const contentResults = await api.searchDonghua({ q: query });
            const contentItems: SearchResult[] = contentResults
              .slice(0, 5)
              .map((donghua: any) => ({
                type: "content" as const,
                id: donghua.id,
                title: donghua.title,
                subtitle: donghua.chineseTitle,
                image: donghua.posterPath,
                metadata: `${donghua.mediaType || "tv"} • ${
                  donghua.status || "ongoing"
                }`,
              }));
            allResults.push(...contentItems);
          } catch (error) {
            console.error("Error searching content:", error);
          }
        }

        // Search users (placeholder - would need user API)
        if (activeFilter === "all" || activeFilter === "user") {
          // Mock user search - replace with actual API call when available
          const mockUsers: SearchResult[] = [];
          if (
            query.toLowerCase().includes("user") ||
            query.toLowerCase().includes("admin")
          ) {
            mockUsers.push({
              type: "user",
              id: "1",
              title: "Admin User",
              subtitle: "admin@example.com",
              metadata: "Administrator",
            });
          }
          allResults.push(...mockUsers);
        }

        // Search reports (placeholder - would need reports API)
        if (activeFilter === "all" || activeFilter === "report") {
          // Mock reports search - replace with actual API call when available
          const mockReports: SearchResult[] = [];
          if (
            query.toLowerCase().includes("report") ||
            query.toLowerCase().includes("log")
          ) {
            mockReports.push({
              type: "report",
              id: "1",
              title: "System Report",
              subtitle: "Generated today",
              metadata: "System Log",
            });
          }
          allResults.push(...mockReports);
        }

        setResults(allResults);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query, activeFilter]);

  const handleSelect = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    }
    setQuery("");
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "content":
        return <Film className="h-4 w-4" />;
      case "report":
        return <FileText className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari user, konten, atau laporan..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10 h-11 bg-background/50 backdrop-blur-sm border-border/50"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full rounded-lg border bg-popover shadow-lg z-50 max-h-[500px] overflow-hidden flex flex-col"
          >
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
              {(["all", "user", "content", "report"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {filter === "all"
                    ? "Semua"
                    : filter === "user"
                    ? "User"
                    : filter === "content"
                    ? "Konten"
                    : "Laporan"}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="overflow-y-auto max-h-[400px]">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Mencari...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Tidak ada hasil ditemukan
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelect(result)}
                      className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                        {getIcon(result.type)}
                      </div>
                      {result.image && (
                        <img
                          src={getImageUrl(result.image, "w92")}
                          alt={result.title}
                          className="w-12 h-16 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                        {result.metadata && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {result.metadata}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            result.type === "user"
                              ? "bg-blue-500/10 text-blue-500"
                              : result.type === "content"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-orange-500/10 text-orange-500"
                          }`}
                        >
                          {result.type === "user"
                            ? "User"
                            : result.type === "content"
                            ? "Konten"
                            : "Laporan"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
