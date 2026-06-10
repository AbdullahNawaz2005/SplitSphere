import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, Search, X, Users, ReceiptText, TrendingUp } from 'lucide-react'
import { AvatarStack } from '../components/Avatar'
import { useAppearance } from '../contexts/AppearanceContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { ActivityLogResponse, GroupMemberResponse, GroupResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { colorFor, iconFor, initialsFor, money, relativeTime } from '../utils/display'

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' as const } },
}

const normalizeMembers = (members: GroupMemberResponse[]) =>
  members.map((member) => {
    const id = member.userId ?? member.id ?? ''
    const name = member.userName ?? member.name ?? 'Member'
    return { id, name, initials: initialsFor(name), color: colorFor(id) }
  }).filter((member) => member.id)

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [members, setMembers] = useState<Record<string, ReturnType<typeof normalizeMembers>>>({})
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [expenseCounts, setExpenseCounts] = useState<Record<string, number>>({})
  const [latestActivity, setLatestActivity] = useState<Record<string, ActivityLogResponse | null>>({})
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { showToast } = useToast()
  useAppearance()

  const loadGroups = async () => {
    setLoading(true)
    try {
      const groupList = await groupService.list()
      setGroups(groupList)
      const details = await Promise.all(
        groupList.map(async (group) => {
          const [groupMembers, balance, analytics, activity] = await Promise.all([
            groupService.members(group.id).catch(() => []),
            groupService.balances(group.id).catch(() => null),
            groupService.analytics(group.id).catch(() => null),
            groupService.activity(group.id).catch(() => null),
          ])
          return { group, groupMembers, balance, analytics, activity }
        })
      )
      setMembers(Object.fromEntries(details.map((item) => [item.group.id, normalizeMembers(item.groupMembers)])))
      setBalances(Object.fromEntries(details.map((item) => [item.group.id, item.balance?.balances.find((balance) => balance.userId === user?.id)?.netBalance ?? 0])))
      setTotals(Object.fromEntries(details.map((item) => [item.group.id, item.analytics?.totalExpenses ?? 0])))
      setExpenseCounts(Object.fromEntries(details.map((item) => [item.group.id, item.analytics?.expenseCount ?? 0])))
      setLatestActivity(Object.fromEntries(details.map((item) => [
        item.group.id,
        [...(item.activity?.content ?? [])].sort((a, b) => Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? ''))[0] ?? null,
      ])))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load groups.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const focusFrame = window.requestAnimationFrame(() => nameInputRef.current?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalOpen])

  const filteredGroups = useMemo(
    () => groups.filter((group) => group.name.toLowerCase().includes(search.toLowerCase())),
    [groups, search]
  )
  const netBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0)
  const totalOwed = Object.values(balances).filter((balance) => balance > 0).reduce((sum, balance) => sum + balance, 0)
  const totalOwe = Math.abs(Object.values(balances).filter((balance) => balance < 0).reduce((sum, balance) => sum + balance, 0))

  const createGroup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await groupService.create({ name: name.trim(), description: description.trim() || undefined })
      setName('')
      setDescription('')
      setModalOpen(false)
      showToast('Group created.', 'success')
      await loadGroups()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create group.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const joinGroup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!inviteCode.trim()) return
    setSaving(true)
    try {
      await groupService.join(inviteCode.trim())
      setInviteCode('')
      setModalOpen(false)
      showToast('Joined group.', 'success')
      await loadGroups()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to join group.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-4 sm:px-5 md:px-10 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-5 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Groups</h1>
            <p className="text-sm text-on-surface-variant mt-1">Track shared expenses with friends and roommates.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm shrink-0 px-4 sm:px-6">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>

        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Groups', value: String(groups.length), icon: Users, tone: 'text-primary-container' },
            { label: 'Owed to You', value: money(totalOwed), icon: TrendingUp, tone: 'text-primary-container' },
            { label: 'You Owe', value: money(totalOwe), icon: ReceiptText, tone: 'text-error' },
            { label: 'Net Balance', value: money(Math.abs(netBalance)), icon: TrendingUp, tone: netBalance >= 0 ? 'text-primary-container' : 'text-error', prefix: netBalance >= 0 ? '+' : '-' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4 flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary-container/10 flex items-center justify-center shrink-0">
                <stat.icon className="w-4 h-4 text-primary-container" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                <p className={`text-base sm:text-lg font-bold break-words ${stat.tone}`}>{stat.prefix ?? ''}{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <label htmlFor="group-search" className="sr-only">Search groups</label>
          <input id="group-search" value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search groups..." className="w-full pl-11 pr-4 py-3 glass-input rounded-xl outline-none text-sm" />
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-4 min-w-0">
          {loading ? (
            <div className="glass rounded-2xl p-8 text-center text-sm text-on-surface-variant md:col-span-2">Loading groups...</div>
          ) : filteredGroups.length > 0 ? filteredGroups.map((group) => (
            <motion.div key={group.id} variants={fadeUp}>
              <Link to={`/groups/${group.id}`}>
                <div className="glass rounded-2xl p-5 card-hover space-y-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${colorFor(group.id)}15` }}>
                      {iconFor(group.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg tracking-tight truncate">{group.name}</h3>
                      <p className="text-xs text-on-surface-variant">
                        {(members[group.id]?.length ?? 0)} Members · {(expenseCounts[group.id] ?? 0)} Expenses
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-outline-variant shrink-0 hidden sm:block" />
                  </div>
                  <div className="glass-subtle rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Last activity</p>
                    <p className="text-sm font-medium break-words mt-1">
                      {latestActivity[group.id]?.description ?? latestActivity[group.id]?.action ?? 'No activity yet'}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">{relativeTime(latestActivity[group.id]?.createdAt)}</p>
                  </div>
                  <div className="h-px bg-on-surface/5" />
                  <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Total Expenses</p>
                      <p className="text-lg font-bold break-words">{money(totals[group.id])}</p>
                    </div>
                    <div className="min-[420px]:text-right min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Your Balance</p>
                      <p className={`text-lg font-bold break-words ${(balances[group.id] ?? 0) >= 0 ? 'text-primary-container' : 'text-error'}`}>
                        {(balances[group.id] ?? 0) >= 0 ? '+' : ''}{money(Math.abs(balances[group.id] ?? 0))}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <AvatarStack users={(members[group.id] ?? []).map((member) => ({ ...member, name: member.name }))} max={4} />
                    <span className="text-xs text-on-surface-variant">Invite {group.inviteCode ?? 'available'}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )) : (
            <div className="glass rounded-2xl p-8 text-center md:col-span-2">
              <p className="text-base font-semibold">No groups yet</p>
              <p className="text-sm text-on-surface-variant mt-2">Create your first group to start tracking shared expenses.</p>
              <button onClick={() => setModalOpen(true)} className="btn-primary mt-5 inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Create Group
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModalOpen(false)} aria-label="Close create or join group dialog" />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="relative w-full max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto glass-strong rounded-3xl p-6 space-y-5"
              role="dialog"
              aria-modal="true"
              aria-labelledby="group-modal-title"
              ref={modalRef}
            >
              <div className="flex items-center justify-between">
                <h2 id="group-modal-title" className="text-xl font-bold tracking-tight">Create or Join</h2>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-white/30 transition-colors" aria-label="Close create or join group dialog"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={createGroup} className="glass-subtle rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">New Group</p>
                <label htmlFor="new-group-name" className="sr-only">Group name</label>
                <input id="new-group-name" ref={nameInputRef} value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" className="w-full px-4 py-3 glass-input rounded-xl outline-none text-sm" />
                <label htmlFor="new-group-description" className="sr-only">Group description</label>
                <input id="new-group-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full px-4 py-3 glass-input rounded-xl outline-none text-sm" />
                <button disabled={saving} className="btn-primary w-full text-sm disabled:opacity-60">Create Group</button>
              </form>
              <form onSubmit={joinGroup} className="glass-subtle rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Join Existing</p>
                <label htmlFor="join-group-invite" className="sr-only">Invite code</label>
                <input id="join-group-invite" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Invite code" className="w-full px-4 py-3 glass-input rounded-xl outline-none text-sm uppercase" />
                <button disabled={saving} className="btn-secondary w-full text-sm disabled:opacity-60">Join Group</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GroupsPage
