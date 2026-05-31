import React from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  delay?: number
  onClick?: () => void
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = true, delay = 0, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -1, boxShadow: '0px 12px 28px rgba(30, 41, 59, 0.08)' } : undefined}
      className={`glass rounded-2xl p-5 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard
