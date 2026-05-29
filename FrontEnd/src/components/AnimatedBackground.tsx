import React from 'react'
import { motion } from 'framer-motion'

interface AnimatedBackgroundProps {
  variant?: 'default' | 'hero' | 'auth'
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ variant = 'default' }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Noise overlay */}
      <div className="noise-overlay absolute inset-0" />
      
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-mesh" />

      {/* Animated blobs */}
      <motion.div
        className="blob blob-emerald"
        style={{ top: variant === 'hero' ? '10%' : '20%', left: '15%' }}
        animate={{
          x: [0, 60, -30, 40, 0],
          y: [0, -40, 30, -20, 0],
          scale: [1, 1.08, 0.95, 1.03, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob blob-cyan"
        style={{ top: '50%', right: '10%' }}
        animate={{
          x: [0, -50, 30, -40, 0],
          y: [0, 30, -50, 20, 0],
          scale: [1, 0.95, 1.05, 0.98, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob blob-purple"
        style={{ bottom: variant === 'auth' ? '20%' : '10%', left: '40%' }}
        animate={{
          x: [0, 40, -20, 30, 0],
          y: [0, -30, 40, -10, 0],
          scale: [1, 1.03, 0.97, 1.05, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
      {variant === 'hero' && (
        <motion.div
          className="blob"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            width: 250,
            height: 250,
            filter: 'blur(60px)',
            top: '60%',
            left: '70%',
          }}
          animate={{
            x: [0, -40, 20, -30, 0],
            y: [0, 20, -30, 15, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

export default AnimatedBackground
