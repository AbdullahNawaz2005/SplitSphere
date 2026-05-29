import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import GlassCard from '../components/GlassCard'
import { monthlySpending, categoryBreakdown, spendingTrends } from '../data/mockData'
import { GroupAnalyticsResponse, GroupResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { useToast } from '../contexts/ToastContext'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl px-3 py-2 text-xs space-y-1">
        <p className="font-semibold">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: ${p.value}</p>
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

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groupList = await groupService.list()
        setGroups(groupList)
        setSelectedGroupId(groupList[0]?.id ?? '')
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to load groups.', 'error')
      }
    }
    loadGroups()
  }, [])

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedGroupId) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        setAnalytics(await groupService.analytics(selectedGroupId))
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to load analytics.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [selectedGroupId])

  const liveCategoryBreakdown = useMemo(() => {
    const entries = Object.entries(analytics?.spendingByCategory ?? {})
    if (!entries.length) return categoryBreakdown
    return entries.map(([name, value], index) => ({
      name,
      value,
      color: ['#10b981', '#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#8b5cf6'][index % 6],
    }))
  }, [analytics])

  const totalMonthly = analytics?.totalExpenses ?? liveCategoryBreakdown.reduce((s, c) => s + c.value, 0)
  const topCategory = [...liveCategoryBreakdown].sort((a, b) => b.value - a.value)[0]?.name ?? 'None'

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Spending Insights</h1>
          <p className="text-sm text-on-surface-variant mt-1">Visualize your shared expenses and optimize your budget.</p>
        </motion.div>

        {groups.length > 0 && (
          <select value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)} className="px-4 py-3 glass-input rounded-xl outline-none text-sm">
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Shared', value: loading ? '...' : `$${totalMonthly.toLocaleString()}`, color: '#10b981' },
            { label: 'Avg / Day', value: `$${(totalMonthly / 30).toFixed(0)}`, color: '#06b6d4' },
            { label: 'Top Category', value: topCategory, color: '#a855f7' },
            { label: 'Groups Active', value: String(groups.length), color: '#f59e0b' },
          ].map((stat, i) => (
            <GlassCard key={i} hover={false} delay={i * 0.05}>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Spending Bar Chart */}
          <GlassCard hover={false} delay={0.1}>
            <h3 className="text-lg font-bold tracking-tight mb-1">Monthly Breakdown</h3>
            <p className="text-xs text-on-surface-variant mb-4">Spending by category over 6 months</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpending} barCategoryGap="20%">
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7a71' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="food" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Food" />
                  <Bar dataKey="transport" stackId="a" fill="#a855f7" name="Transport" />
                  <Bar dataKey="entertainment" stackId="a" fill="#f59e0b" name="Entertainment" />
                  <Bar dataKey="utilities" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Utilities" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Category Pie Chart */}
          <GlassCard hover={false} delay={0.15}>
            <h3 className="text-lg font-bold tracking-tight mb-1">Category Split</h3>
            <p className="text-xs text-on-surface-variant mb-4">Where your money goes this month</p>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={liveCategoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {liveCategoryBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {liveCategoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-on-surface-variant">{cat.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Weekly Trend */}
        <GlassCard hover={false} delay={0.2}>
          <h3 className="text-lg font-bold tracking-tight mb-1">Weekly Trend</h3>
          <p className="text-xs text-on-surface-variant mb-4">Your spending pattern this week</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrends}>
                <defs>
                  <linearGradient id="colorInsight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6c7a71' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2.5} fill="url(#colorInsight)" name="Spent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

export default InsightsPage
