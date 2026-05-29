import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Receipt, User, Plus, TrendingUp, Zap, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { colorFor, initialsFor } from '../utils/display'

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/groups', label: 'Groups', icon: Users },
  { path: '/activity', label: 'Activity', icon: Receipt },
  { path: '/profile', label: 'Profile', icon: User },
]

/* ── Floating Desktop Top Nav ── */
export const TopNav: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = initialsFor(user?.name)
  const color = colorFor(user?.id ?? user?.email)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
    >
      <nav className="mx-auto max-w-6xl glass-strong rounded-2xl px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-on-surface">
            Split<span className="text-gradient">Sphere</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/30'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="topnav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right side - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/settlements" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-white/30 transition-all">
            <TrendingUp className="w-4 h-4" />
            Settlements
          </Link>
          <Link to="/insights" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-white/30 transition-all">
            <TrendingUp className="w-4 h-4" />
            Insights
          </Link>
          <Link to="/profile" className="avatar-ring">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
              {initials}
            </div>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-white/30 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-auto max-w-6xl mt-2 glass-strong rounded-2xl p-4 space-y-1"
          >
            {[...navItems, { path: '/settlements', label: 'Settlements', icon: TrendingUp }, { path: '/insights', label: 'Insights', icon: TrendingUp }].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === item.path ? 'bg-primary-container/10 text-primary-container' : 'text-on-surface-variant hover:bg-white/30'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

/* ── Mobile Bottom Navigation ── */
export const BottomNav: React.FC = () => {
  const location = useLocation()

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-bottom"
    >
      <div className="glass-strong rounded-2xl px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive ? 'text-primary-container' : 'text-on-surface-variant'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-medium relative z-10 tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
