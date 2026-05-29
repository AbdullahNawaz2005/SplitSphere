import React from 'react'

interface AvatarProps {
  initials: string
  color: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const Avatar: React.FC<AvatarProps> = ({ initials, color, size = 'md', ring = false, className = '' }) => {
  const avatar = (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )

  if (ring) {
    return <div className="avatar-ring">{avatar}</div>
  }

  return avatar
}

export const AvatarStack: React.FC<{ users: { initials: string; color: string }[]; max?: number }> = ({
  users,
  max = 4,
}) => {
  const shown = users.slice(0, max)
  const remaining = users.length - max

  return (
    <div className="flex -space-x-2">
      {shown.map((user, i) => (
        <div key={i} className="ring-2 ring-white rounded-full">
          <Avatar initials={user.initials} color={user.color} size="sm" />
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant ring-2 ring-white">
          +{remaining}
        </div>
      )}
    </div>
  )
}

export default Avatar
