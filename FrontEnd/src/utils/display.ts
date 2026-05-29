export const palette = ['#10b981', '#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#8b5cf6']
export const groupIcons = ['🏠', '🚗', '🍽️', '📚', '🎉', '🧾']

export const initialsFor = (name?: string) =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

export const colorFor = (value?: string) => {
  const source = value ?? ''
  const sum = source.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return palette[sum % palette.length]
}

export const iconFor = (value?: string) => {
  const source = value ?? ''
  const sum = source.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return groupIcons[sum % groupIcons.length]
}

export const money = (value?: number) => `$${Number(value ?? 0).toFixed(2)}`

export const shortDate = (value?: string) => {
  if (!value) return 'Today'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
