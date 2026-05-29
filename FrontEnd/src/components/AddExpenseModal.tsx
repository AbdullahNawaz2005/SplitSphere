import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Tag, Users, Check, ChevronRight } from 'lucide-react'
import { categories as fallbackCategories } from '../data/mockData'
import { colorFor, initialsFor } from '../utils/display'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  groups?: { id: string; name: string }[]
  defaultGroupId?: string
  currentUserId?: string
  currentUserName?: string
  members?: ModalUser[]
  categories?: ModalCategory[]
  isSubmitting?: boolean
  onSubmit?: (payload: AddExpensePayload) => Promise<void> | void
}

export interface ModalUser {
  id: string
  name: string
  email?: string
  initials?: string
  color?: string
}

export interface ModalCategory {
  id: string
  name: string
  icon?: string | null
  color?: string | null
}

export interface AddExpensePayload {
  groupId: string
  payerId: string
  title: string
  amount: number
  categoryId?: string
  splitUserIds: string[]
}

const steps = ['amount', 'category', 'people', 'summary'] as const
type Step = typeof steps[number]

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  groups = [],
  defaultGroupId,
  currentUserId,
  currentUserName = 'You',
  members = [],
  categories,
  isSubmitting = false,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? '')

  const stepIndex = steps.indexOf(currentStep)
  const visibleCategories = categories?.length ? categories : fallbackCategories
  const activePayerId = currentUserId ?? members[0]?.id ?? ''
  const visibleMembers = useMemo(
    () => members.filter((member) => member.id !== activePayerId),
    [activePayerId, members]
  )

  useEffect(() => {
    if (isOpen) {
      setSelectedGroupId(defaultGroupId ?? groups[0]?.id ?? '')
    }
  }, [defaultGroupId, groups, isOpen])

  const resetAndClose = () => {
    setCurrentStep('amount')
    setAmount('')
    setTitle('')
    setSelectedCategory('')
    setSelectedPeople([])
    setSelectedGroupId(defaultGroupId ?? groups[0]?.id ?? '')
    onClose()
  }

  const nextStep = () => {
    const idx = steps.indexOf(currentStep)
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1])
  }

  const prevStep = () => {
    const idx = steps.indexOf(currentStep)
    if (idx > 0) setCurrentStep(steps[idx - 1])
  }

  const togglePerson = (id: string) => {
    setSelectedPeople((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const selectedCategoryData = visibleCategories.find((c) => c.id === selectedCategory)
  const splitAmount = parseFloat(amount || '0') / (selectedPeople.length + 1)
  const selectedPeopleData = selectedPeople
    .map((id) => members.find((member) => member.id === id))
    .filter(Boolean) as ModalUser[]

  const submitExpense = async () => {
    const parsedAmount = Number(amount)
    if (!selectedGroupId || !activePayerId || !title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return
    const backendCategory = categories?.some((category) => category.id === selectedCategory)
    await onSubmit?.({
      groupId: selectedGroupId,
      payerId: activePayerId,
      title: title.trim(),
      amount: parsedAmount,
      categoryId: backendCategory ? selectedCategory : undefined,
      splitUserIds: [activePayerId, ...selectedPeople],
    })
    resetAndClose()
  }

  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const modal = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={resetAndClose}
          />

          {/* Modal */}
          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg glass-strong rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Add Expense</h2>
                <p className="text-sm text-on-surface-variant mt-1">Step {stepIndex + 1} of {steps.length}</p>
              </div>
              <button onClick={resetAndClose} className="p-2 rounded-xl hover:bg-white/30 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-6">
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-primary rounded-full"
                  animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 min-h-[320px]">
              <AnimatePresence mode="wait">
                {currentStep === 'amount' && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">How much was it?</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Enter the total bill amount</p>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary-container" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 text-3xl font-bold glass-input rounded-2xl outline-none text-on-surface placeholder:text-outline-variant"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-2 block">Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Dinner at Sunset Grill"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 glass-input rounded-xl outline-none text-on-surface placeholder:text-outline-variant text-sm"
                      />
                    </div>
                    {groups.length > 1 && !defaultGroupId && (
                      <div>
                        <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-2 block">Group</label>
                        <select
                          value={selectedGroupId}
                          onChange={(event) => setSelectedGroupId(event.target.value)}
                          className="w-full px-4 py-3 glass-input rounded-xl outline-none text-on-surface text-sm"
                        >
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}

                {currentStep === 'category' && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">What's it for?</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Select a category for better tracking</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {visibleCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                            selectedCategory === cat.id
                              ? 'glass-strong ring-2 ring-primary-container shadow-lg'
                              : 'glass-subtle hover:bg-white/40'
                          }`}
                        >
                          <span className="text-2xl">{cat.icon ?? <Tag className="w-5 h-5" />}</span>
                          <span className="text-sm font-medium">{cat.name}</span>
                          {selectedCategory === cat.id && (
                            <Check className="w-4 h-4 text-primary-container ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 'people' && (
                  <motion.div
                    key="people"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">Who's involved?</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Select people to split the bill with</p>
                    </div>
                    <div className="space-y-2">
                      {visibleMembers.length > 0 ? visibleMembers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => togglePerson(user.id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                            selectedPeople.includes(user.id)
                              ? 'glass-strong ring-2 ring-primary-container'
                              : 'glass-subtle hover:bg-white/40'
                          }`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: user.color ?? colorFor(user.id) }}
                          >
                            {user.initials ?? initialsFor(user.name)}
                          </div>
                          <div className="text-left flex-1">
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-on-surface-variant">{user.email}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedPeople.includes(user.id) ? 'bg-primary-container border-primary-container' : 'border-outline-variant'
                          }`}>
                            {selectedPeople.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      )) : (
                        <div className="glass-subtle rounded-2xl p-5 text-center text-sm text-on-surface-variant">
                          Add members to this group before splitting with others.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">Split Summary</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Review the details before splitting</p>
                    </div>
                    <div className="glass-subtle rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{title || 'Dinner at Sunset Grill'}</p>
                          <p className="text-xs text-on-surface-variant">
                            {selectedCategoryData?.name || 'Food & Drink'} • Today
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-gradient">${parseFloat(amount || '0').toFixed(2)}</p>
                      </div>
                      <div className="h-px bg-on-surface/5" />
                      <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Split Between</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white text-xs font-bold">{initialsFor(currentUserName)}</div>
                              <span className="text-sm font-medium">{currentUserName}</span>
                            </div>
                            <span className="text-sm font-bold text-primary-container">${splitAmount.toFixed(2)}</span>
                          </div>
                          {selectedPeopleData.map((user) => (
                              <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: user.color ?? colorFor(user.id) }}>
                                    {user.initials ?? initialsFor(user.name)}
                                  </div>
                                  <span className="text-sm font-medium">{user.name}</span>
                                </div>
                                <span className="text-sm font-bold">${splitAmount.toFixed(2)}</span>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 pt-0">
              <button
                onClick={stepIndex === 0 ? resetAndClose : prevStep}
                className="btn-ghost text-sm"
              >
                {stepIndex === 0 ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={stepIndex === steps.length - 1 ? submitExpense : nextStep}
                disabled={isSubmitting || (stepIndex === steps.length - 1 && (!selectedGroupId || !activePayerId || !title.trim() || Number(amount) <= 0))}
                className="btn-primary flex items-center gap-2"
              >
                {stepIndex === steps.length - 1 ? (isSubmitting ? 'Splitting...' : 'Split Expense') : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddExpenseModal
