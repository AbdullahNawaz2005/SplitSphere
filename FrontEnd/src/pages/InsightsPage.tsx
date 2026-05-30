import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from '../components/GlassCard'
import { useAppearance } from '../contexts/AppearanceContext'
import { useToast } from '../contexts/ToastContext'
import { GroupAnalyticsResponse, GroupResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { money } from '../utils/display'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
}

const chartColors = ['#10b981', '#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#8b5cf6']

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl px-3 py-2 text-xs space-y-1">
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.payload.color }}>{p.name}: {money(p.value)}</p>
        ))}
      </div>
    )
  }
  return null
}

const InsightsPage: React.FC = () => {
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [analytics, setAnalytics] = useState<GroupAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  useAppearance()

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true)
      try {
        const groupList = await groupService.list()
        setGroups(groupList)
        setSelectedGroupId(groupList[0]?.id ?? '')
        if (!groupList.length) setLoading(false)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to load groups.', 'error')
        setLoading(false)
      }
    }
    loadGroups()
  }, [])

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedGroupId) return
      setLoading(true)
      try {
        setAnalytics(await groupService.analytics(selectedGroupId))
      } catch (error) {
        setAnalytics(null)
        showToast(error instanceof Error ? error.message : 'Unable to load analytics.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [selectedGroupId])

  const categoryData = useMemo(() => {
    return Object.entries(analytics?.spendingByCategory ?? {})
      .filter(([, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value,
        color: chartColors[index % chartColors.length],
      }))
  }, [analytics])

  const hasExpenses = Boolean((analytics?.expenseCount ?? 0) > 0 || (analytics?.totalExpenses ?? 0) > 0 || categoryData.length)
  const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0]?.name ?? 'None'

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Spending Insights</h1>
          <p className="text-sm text-on-surface-variant mt-1">Live analytics from your groups.</p>
        </motion.div>

        {groups.length > 0 && (
          <select value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)} className="px-4 py-3 glass-input rounded-xl outline-none text-sm">
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        )}

        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant">Loading insights...</div>
        ) : !hasExpenses ? (
          <GlassCard hover={false}>
            <div className="py-12 text-center">
              <p className="text-base font-semibold">No expenses yet. Add your first expense to see insights.</p>
              <p className="text-sm text-on-surface-variant mt-2">Monthly, weekly, and fallback demo charts have been removed.</p>
            </div>
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Shared', value: money(analytics?.totalExpenses), color: '#10b981' },
                { label: 'Expenses', value: String(analytics?.expenseCount ?? 0), color: '#06b6d4' },
                { label: 'Top Category', value: topCategory, color: '#a855f7' },
                { label: 'Settled', value: money(analytics?.totalSettled), color: '#f59e0b' },
              ].map((stat, i) => (
                <GlassCard key={stat.label} hover={false} delay={i * 0.05}>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                </GlassCard>
              ))}
            </div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <GlassCard hover={false} delay={0.1}>
                <h3 className="text-lg font-bold tracking-tight mb-1">Category Split</h3>
                <p className="text-xs text-on-surface-variant mb-4">Backed by the selected group's analytics endpoint</p>
                {categoryData.length > 0 ? (
                  <>
                    <div className="h-72 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {categoryData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categoryData.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-on-surface-variant">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="glass-subtle rounded-2xl p-8 text-center text-sm text-on-surface-variant">
                    No category totals returned by the backend for this group yet.
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

export default InsightsPage
