import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, Search, X } from 'lucide-react'
import { AvatarStack } from '../components/Avatar'
import { useAppearance } from '../contexts/AppearanceContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { GroupMemberResponse, GroupResponse } from '../services/api'
import { groupService } from '../services/groupService'
import { colorFor, iconFor, initialsFor, money } from '../utils/display'

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
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
          const [groupMembers, balance, analytics] = await Promise.all([
            groupService.members(group.id).catch(() => []),
            groupService.balances(group.id).catch(() => null),
            groupService.analytics(group.id).catch(() => null),
          ])
          return { group, groupMembers, balance, analytics }
        })
      )
      setMembers(Object.fromEntries(details.map((item) => [item.group.id, normalizeMembers(item.groupMembers)])))
      setBalances(Object.fromEntries(details.map((item) => [item.group.id, item.balance?.balances.find((balance) => balance.userId === user?.id)?.netBalance ?? 0])))
      setTotals(Object.fromEntries(details.map((item) => [item.group.id, item.analytics?.totalExpenses ?? 0])))
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load groups.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const filteredGroups = useMemo(
    () => groups.filter((group) => group.name.toLowerCase().includes(search.toLowerCase())),
    [groups, search]
  )

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
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Groups</h1>
            <p className="text-sm text-on-surface-variant mt-1">{groups.length} active groups</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search groups..." className="w-full pl-11 pr-4 py-3 glass-input rounded-xl outline-none text-sm" />
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-4">
          {loading ? (
            <div className="glass rounded-3xl p-8 text-center text-sm text-on-surface-variant md:col-span-2">Loading groups...</div>
          ) : filteredGroups.length > 0 ? filteredGroups.map((group) => (
            <motion.div key={group.id} variants={fadeUp}>
              <Link to={`/groups/${group.id}`}>
                <div className="glass rounded-3xl p-6 card-hover space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${colorFor(group.id)}15` }}>
                      {iconFor(group.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg tracking-tight">{group.name}</h3>
                      <p className="text-xs text-on-surface-variant">{group.description ?? group.inviteCode ?? 'Shared expense group'}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-outline-variant" />
                  </div>
                  <div className="h-px bg-on-surface/5" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Total Expenses</p>
                      <p className="text-lg font-bold">{money(totals[group.id])}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Your Balance</p>
                      <p className={`text-lg font-bold ${(balances[group.id] ?? 0) >= 0 ? 'text-primary-container' : 'text-error'}`}>
                        {(balances[group.id] ?? 0) >= 0 ? '+' : ''}{money(Math.abs(balances[group.id] ?? 0))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <AvatarStack users={members[group.id] ?? []} max={4} />
                    <span className="text-xs text-on-surface-variant">Invite {group.inviteCode ?? 'available'}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )) : (
            <div className="glass rounded-3xl p-8 text-center text-sm text-on-surface-variant md:col-span-2">No groups found. Create one or join with an invite code.</div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} className="relative w-full max-w-xl glass-strong rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Create or Join</h2>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-white/30 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={createGroup} className="glass-subtle rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">New Group</p>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" className="w-full px-4 py-3 glass-input rounded-xl outline-none text-sm" />
                <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full px-4 py-3 glass-input rounded-xl outline-none text-sm" />
                <button disabled={saving} className="btn-primary w-full text-sm disabled:opacity-60">Create Group</button>
              </form>
              <form onSubmit={joinGroup} className="glass-subtle rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Join Existing</p>
                <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Invite code" className="w-full px-4 py-3 glass-input rounded-xl outline-none text-sm uppercase" />
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
