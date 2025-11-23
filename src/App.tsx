import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import { Navbar } from "./components/Navbar"
import { Footer } from "./components/Footer"
import { HomePage } from "./pages/HomePage"
import { DetailPage } from "./pages/DetailPage"
import { WatchPage } from "./pages/WatchPage"
import { SearchPage } from "./pages/SearchPage"
import { CategoryPage } from "./pages/CategoryPage"
import { NewsPage } from "./pages/NewsPage"
import { WatchlistPage } from "./pages/WatchlistPage"
import { AdminLoginPage } from "./pages/admin/AdminLoginPage"
import { AdminDashboard } from "./pages/admin/AdminDashboard"
import { ManageDonghuaPage } from "./pages/admin/ManageDonghuaPage"
import { AddDonghuaPage } from "./pages/admin/AddDonghuaPage"
import { EditDonghuaPage } from "./pages/admin/EditDonghuaPage"
import { AddEpisodePage } from "./pages/admin/AddEpisodePage"
import { SettingsPage } from "./pages/admin/SettingsPage"
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/category" element={<CategoryPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/detail/:id" element={<DetailPage />} />
              <Route path="/watch/:id/:episode" element={<WatchPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/manage"
                element={
                  <ProtectedRoute>
                    <ManageDonghuaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/add-donghua"
                element={
                  <ProtectedRoute>
                    <AddDonghuaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/edit-donghua/:id"
                element={
                  <ProtectedRoute>
                    <EditDonghuaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/add-episode"
                element={
                  <ProtectedRoute>
                    <AddEpisodePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App

