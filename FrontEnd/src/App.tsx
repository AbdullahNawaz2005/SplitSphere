import React from 'react'
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TopNav, BottomNav } from './components/Navigation'
import AnimatedBackground from './components/AnimatedBackground'
import { useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import SettlementsPage from './pages/SettlementsPage'
import InsightsPage from './pages/InsightsPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'

const authPaths = ['/', '/login', '/signup']

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-2xl px-5 py-4 text-sm font-semibold">Loading SplitSphere...</div>
      </div>
    )
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

const App: React.FC = () => {
  const location = useLocation()
  const isAuthPage = authPaths.includes(location.pathname)

  return (
    <div className="min-h-screen relative">
      {/* Global animated background for app pages */}
      {!isAuthPage && <AnimatedBackground />}

      {/* Navigation - only on app pages */}
      {!isAuthPage && <TopNav />}
      {!isAuthPage && <BottomNav />}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/settlements" element={<SettlementsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
