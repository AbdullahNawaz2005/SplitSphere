import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Avatar from '../components/Avatar'
import { ActivityLogResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { colorFor, initialsFor, shortDate } from '../utils/display'
import { useToast } from '../contexts/ToastContext'

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
}

const typeColors: Record<string, string> = {
  EXPENSE: '#10b981',
  SETTLEMENT: '#a855f7',
  GROUP: '#06b6d4',
  PAYMENT: '#f59e0b',
}

const iconForAction = (action?: string) => {
  const value = action ?? ''
  if (value.includes('EXPENSE')) return '$'
  if (value.includes('SETTLEMENT')) return '✓'
  if (value.includes('GROUP')) return '+'
  return '•'
}

const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const { showToast } = useToast()

  useEffect(() => {
    const loadActivity = async () => {
      setLoading(true)
      try {
        const groups = await groupService.list()
        const pages = await Promise.all(groups.map((group) => groupService.activity(group.id).catch(() => null)))
        setActivities(pages.flatMap((page) => page?.content ?? []))
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to load activity.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadActivity()
  }, [])

  const filtered = useMemo(() => {
    const sorted = [...activities].sort((a, b) => Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? ''))
    if (activeFilter === 'All') return sorted
    return sorted.filter((activity) => (activity.action ?? '').toLowerCase().includes(activeFilter.slice(0, -1).toLowerCase()))
  }, [activeFilter, activities])

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your recent transactions and updates</p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Expenses', 'Payments', 'Settlements', 'Groups'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === filter ? 'bg-gradient-primary text-white' : 'glass-subtle hover:bg-white/40 text-on-surface-variant'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {loading ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">Loading activity...</div>
          ) : filtered.length > 0 ? filtered.map((activity) => {
            const action = activity.action ?? 'GROUP'
            return (
              <motion.div key={activity.id} variants={fadeUp}>
                <div className="glass rounded-2xl p-4 card-hover flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold" style={{ backgroundColor: `${typeColors[action] ?? '#10b981'}10` }}>
                      {iconForAction(action)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
                      <Avatar initials={initialsFor(activity.userName)} color={colorFor(activity.userId)} size="sm" className="!w-4 !h-4 !text-[7px]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{activity.action ?? 'Activity'}</p>
                    <p className="text-xs text-on-surface-variant truncate">{activity.description ?? `${activity.userName ?? 'Someone'} updated this group`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-on-surface-variant">{shortDate(activity.createdAt)}</p>
                  </div>
                </div>
              </motion.div>
            )
          }) : (
            <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">No activity yet.</div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ActivityPage
