import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Mail, Moon, User, Globe, ShieldCheck } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { useAppearance } from '../contexts/AppearanceContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { groupService } from '../services/groupService'
import { settlementService } from '../services/settlementService'
import { colorFor, initialsFor, money } from '../utils/display'
import { CurrencyCode, currencyOptions } from '../utils/preferences'

const ProfilePage: React.FC = () => {
  const [groupCount, setGroupCount] = useState(0)
  const [totalShared, setTotalShared] = useState(0)
  const [expenseCount, setExpenseCount] = useState(0)
  const [pendingConfirmations, setPendingConfirmations] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)
  const { user, logout } = useAuth()
  const { currency, darkMode, setCurrency, setDarkMode } = useAppearance()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const initials = initialsFor(user?.name)
  const color = colorFor(user?.id ?? user?.email)

  useEffect(() => {
    const loadProfileStats = async () => {
      setLoadingStats(true)
      try {
        const groups = await groupService.list()
        const [analytics, settlementPages] = await Promise.all([
          Promise.all(groups.map((group) => groupService.analytics(group.id).catch(() => null))),
          Promise.all(groups.map((group) => settlementService.listByGroup(group.id).catch(() => null))),
        ])
        setGroupCount(groups.length)
        setTotalShared(analytics.reduce((sum, item) => sum + (item?.totalExpenses ?? 0), 0))
        setExpenseCount(analytics.reduce((sum, item) => sum + (item?.expenseCount ?? 0), 0))
        setPendingConfirmations(
          settlementPages
            .flatMap((page) => page?.content ?? [])
            .filter((settlement) =>
              (settlement.status === 'PENDING' || settlement.status === 'PENDING_CONFIRMATION') &&
              settlement.receiverId === user?.id
            ).length
        )
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to load profile summary.', 'error')
      } finally {
        setLoadingStats(false)
      }
    }
    loadProfileStats()
  }, [])

  const signOut = () => {
    logout()
    navigate('/', { replace: true })
  }

  const changeCurrency = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(event.target.value as CurrencyCode)
  }

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <GlassCard hover={false} delay={0.1}>
          <div className="flex items-center gap-5">
            <Avatar initials={initials} color={color} size="xl" ring />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate">{user?.name ?? 'SplitSphere User'}</h1>
              <p className="text-sm text-on-surface-variant truncate">{user?.email ?? 'Email not available'}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="chip chip-emerald">Authenticated</span>
                {user?.role && <span className="chip chip-cyan">{user.role}</span>}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} delay={0.15}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Profile Information</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="glass-subtle rounded-2xl p-4">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                <User className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-widest">Name</p>
              </div>
              <p className="text-sm font-semibold">{user?.name ?? 'Not available'}</p>
            </div>
            <div className="glass-subtle rounded-2xl p-4">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                <Mail className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-widest">Email</p>
              </div>
              <p className="text-sm font-semibold break-all">{user?.email ?? 'Not available'}</p>
            </div>
            <div className="glass-subtle rounded-2xl p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                <ShieldCheck className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-widest">Login Method</p>
              </div>
              <p className="text-sm font-semibold">Managed by backend session</p>
            </div>
          </div>
        </GlassCard>

        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard hover={false} delay={0.2}>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Groups</p>
            <p className="text-2xl font-bold mt-1">{loadingStats ? '...' : groupCount}</p>
          </GlassCard>
          <GlassCard hover={false} delay={0.25}>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Shared Expenses</p>
            {loadingStats ? (
              <p className="text-2xl font-bold mt-1">...</p>
            ) : expenseCount > 0 ? (
              <p className="text-2xl font-bold mt-1 text-gradient">{money(totalShared)}</p>
            ) : (
              <p className="text-sm font-semibold mt-2">No expenses yet. Add your first expense to see insights.</p>
            )}
          </GlassCard>
          <GlassCard hover={false} delay={0.28} className="md:col-span-2">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Pending Settlement Confirmations</p>
            <p className="text-2xl font-bold mt-1">{loadingStats ? '...' : pendingConfirmations}</p>
          </GlassCard>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 ml-1">Preferences</h3>
          <GlassCard hover={false} delay={0.3} className="!p-0 overflow-hidden">
            <div className="w-full flex items-center gap-4 px-6 py-4 border-b border-on-surface/5">
              <Moon className="w-5 h-5 text-on-surface-variant" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-on-surface-variant">Applies globally and persists on this device</p>
              </div>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-container' : 'bg-outline-variant'} flex items-center px-0.5`}
                aria-label="Toggle dark mode"
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{ x: darkMode ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              </button>
            </div>
            <div className="w-full flex items-center gap-4 px-6 py-4">
              <Globe className="w-5 h-5 text-on-surface-variant" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Currency</p>
                <p className="text-xs text-on-surface-variant">{currencyOptions[currency].label}</p>
              </div>
              <select value={currency} onChange={changeCurrency} className="px-3 py-2 glass-input rounded-xl text-sm outline-none">
                {(Object.keys(currencyOptions) as CurrencyCode[]).map((option) => (
                  <option key={option} value={option}>{currencyOptions[option].label}</option>
                ))}
              </select>
            </div>
          </GlassCard>
        </div>

        <GlassCard hover className="!p-0" delay={0.35}>
          <button onClick={signOut} className="w-full flex items-center gap-4 px-6 py-4 text-error">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </GlassCard>
      </div>
    </div>
  )
}

export default ProfilePage
