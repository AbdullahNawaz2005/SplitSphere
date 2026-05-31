import { CurrencyCode, PKR_CONVERSION_RATES, currencyOptions, readCurrencyPreference } from './preferences'

export const groupIcons = ['🏠', '🚗', '🍽️', '📚', '🎉', '🧾']

export const initialsFor = (name?: string, max = 3) =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

export const colorFor = (value?: string) => {
  const source = value ?? ''
  const sum = source.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  const hue = sum % 360
  return `hsl(${hue} 62% 42%)`
}

export const iconFor = (value?: string) => {
  const source = value ?? ''
  const sum = source.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return groupIcons[sum % groupIcons.length]
}

export const toDisplayCurrencyAmount = (basePkrAmount?: number, currency: CurrencyCode = readCurrencyPreference()) =>
  Number(basePkrAmount ?? 0) / PKR_CONVERSION_RATES[currency]

// Temporary input conversion: only call this at the UI-to-backend boundary.
// Backend values passed to money() are already PKR and must not be converted first.
export const toBasePkrAmount = (displayAmount?: number, currency: CurrencyCode = readCurrencyPreference()) =>
  Number(displayAmount ?? 0) * PKR_CONVERSION_RATES[currency]

export const formatCurrencyAmount = (value?: number, currency: CurrencyCode = readCurrencyPreference()) => {
  const displayValue = Number(value ?? 0)
  const symbol = currencyOptions[currency].symbol
  return currency === 'PKR' ? `${symbol} ${displayValue.toFixed(2)}` : `${symbol}${displayValue.toFixed(2)}`
}

export const money = (basePkrAmount?: number, currency: CurrencyCode = readCurrencyPreference()) =>
  formatCurrencyAmount(toDisplayCurrencyAmount(basePkrAmount, currency), currency)

const categoryNameMap: Record<string, string> = {
  food: 'Food & Dining',
  fooddrink: 'Food & Dining',
  foodanddrink: 'Food & Dining',
  fooddining: 'Food & Dining',
  foodanddining: 'Food & Dining',
  utensils: 'Food & Dining',
  groceries: 'Groceries',
  shoppingcart: 'Groceries',
  transport: 'Transport',
  car: 'Transport',
  fuel: 'Fuel',
  rent: 'Rent',
  housing: 'Rent',
  home: 'Home Supplies',
  utilities: 'Utilities',
  bolt: 'Utilities',
  shopping: 'Shopping',
  shoppingbag: 'Shopping',
  travel: 'Travel',
  entertainment: 'Entertainment',
  medical: 'Medical',
  education: 'Education',
  subscriptions: 'Subscriptions',
  gifts: 'Gifts',
  homesupplies: 'Home Supplies',
  maintenance: 'Maintenance',
  fitness: 'Fitness',
  pets: 'Pets',
  events: 'Events',
  partypopper: 'Events',
  circle: 'Other',
  other: 'Other',
}

export const normalizeDisplayKey = (value?: string | null) =>
  (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')

export const categoryLabel = (value?: string | null, fallback = 'Shared') => {
  const key = normalizeDisplayKey(value)
  if (!key) return fallback
  return categoryNameMap[key] ?? value ?? fallback
}

export const shortDate = (value?: string) => {
  if (!value) return 'Today'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const dateGroupLabel = (value?: string) => {
  if (!value) return 'Today'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent'
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export const relativeTime = (value?: string) => {
  if (!value) return 'No activity yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return shortDate(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return shortDate(value)
}
