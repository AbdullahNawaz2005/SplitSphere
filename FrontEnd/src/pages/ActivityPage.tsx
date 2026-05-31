import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Avatar from '../components/Avatar'
import { ActivityLogResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { colorFor, dateGroupLabel, initialsFor, relativeTime } from '../utils/display'
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

const titleForActivity = (activity: ActivityLogResponse) => {
  if (activity.description) return activity.description
  const actor = activity.userName ?? 'Someone'
  const action = activity.action ?? 'updated this group'
  return `${actor} ${action.toLowerCase().replace(/_/g, ' ')}`
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

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ActivityLogResponse[]>>((groups, activity) => {
      const label = dateGroupLabel(activity.createdAt)
      groups[label] = [...(groups[label] ?? []), activity]
      return groups
    }, {})
  }, [filtered])

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-4xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your recent transactions and group updates.</p>
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

        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
          {loading ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">Loading activity...</div>
          ) : filtered.length > 0 ? Object.entries(grouped).map(([date, items]) => (
            <section key={date} className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">{date}</p>
              <div className="relative space-y-3 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/50">
                {items.map((activity) => {
                  const action = activity.action ?? 'GROUP'
                  return (
                    <motion.div key={activity.id} variants={fadeUp} className="relative pl-14">
                      <div className="absolute left-0 top-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ring-4 ring-surface" style={{ backgroundColor: `${typeColors[action] ?? '#10b981'}18`, color: typeColors[action] ?? '#10b981' }}>
                          {iconForAction(action)}
                        </div>
                      </div>
                      <div className="glass rounded-2xl p-4 card-hover flex items-center gap-4">
                        <Avatar initials={initialsFor(activity.userName)} color={colorFor(activity.userId)} name={activity.userName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{titleForActivity(activity)}</p>
                          <p className="text-xs text-on-surface-variant truncate">{activity.userName ?? 'System'} · {relativeTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          )) : (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-base font-semibold">No recent activity</p>
              <p className="text-sm text-on-surface-variant mt-2">Expense, settlement, and membership updates will appear here.</p>
              <Link to="/groups" className="btn-primary inline-flex mt-5 text-sm">View Groups</Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ActivityPage
