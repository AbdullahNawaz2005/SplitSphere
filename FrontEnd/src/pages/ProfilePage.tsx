import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Bell, Shield, Palette, LogOut, ChevronRight, Moon, Globe, CreditCard, HelpCircle } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import { colorFor, initialsFor } from '../utils/display'

const ProfilePage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = initialsFor(user?.name)
  const color = colorFor(user?.id ?? user?.email)

  const signOut = () => {
    logout()
    navigate('/', { replace: true })
  }

  const settingSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', desc: 'Name, photo, username', action: 'arrow' },
        { icon: Mail, label: 'Email', desc: user?.email ?? 'Signed in', action: 'arrow' },
        { icon: CreditCard, label: 'Payment Methods', desc: '2 cards linked', action: 'arrow' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', desc: 'Push, email, reminders', action: 'arrow' },
        { icon: Moon, label: 'Dark Mode', desc: 'Coming soon', action: 'toggle' },
        { icon: Globe, label: 'Currency', desc: 'USD ($)', action: 'arrow' },
        { icon: Palette, label: 'Theme', desc: 'Emerald', action: 'arrow' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', desc: 'FAQs and guides', action: 'arrow' },
        { icon: Shield, label: 'Privacy & Security', desc: 'Password, 2FA', action: 'arrow' },
      ],
    },
  ]

  return (
    <div className="relative z-10 pt-24 pb-28 md:pb-10 px-5 md:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile header */}
        <GlassCard hover={false} delay={0.1}>
          <div className="flex items-center gap-5">
            <Avatar initials={initials} color={color} size="xl" ring />
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{user?.name ?? 'SplitSphere User'}</h1>
              <p className="text-sm text-on-surface-variant">{user?.email}</p>
              <div className="flex gap-2 mt-3">
                <span className="chip chip-emerald">Premium</span>
                <span className="chip chip-cyan">4 Groups</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <GlassCard hover={false} delay={0.15} className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Total Shared</p>
            <p className="text-xl font-bold text-gradient">$7,038</p>
          </GlassCard>
          <GlassCard hover={false} delay={0.2} className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Settlements</p>
            <p className="text-xl font-bold">23</p>
          </GlassCard>
          <GlassCard hover={false} delay={0.25} className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Friends</p>
            <p className="text-xl font-bold">5</p>
          </GlassCard>
        </div>

        {/* Settings sections */}
        {settingSections.map((section, si) => (
          <div key={section.title}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 ml-1">{section.title}</h3>
            <GlassCard hover={false} delay={0.1 + si * 0.05} className="!p-0 overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-white/20 transition-colors ${
                    i < section.items.length - 1 ? 'border-b border-on-surface/5' : ''
                  }`}
                >
                  <item.icon className="w-5 h-5 text-on-surface-variant" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-on-surface-variant">{item.desc}</p>
                  </div>
                  {item.action === 'arrow' && <ChevronRight className="w-4 h-4 text-outline-variant" />}
                  {item.action === 'toggle' && (
                    <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-container' : 'bg-outline-variant'} flex items-center px-0.5`}>
                      <motion.div
                        className="w-5 h-5 rounded-full bg-white shadow-sm"
                        animate={{ x: darkMode ? 16 : 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={(e) => { e.stopPropagation(); setDarkMode(!darkMode) }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </GlassCard>
          </div>
        ))}

        {/* Sign out */}
        <GlassCard hover className="!p-0" delay={0.3}>
          <button onClick={signOut} className="w-full flex items-center gap-4 px-6 py-4 text-error">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </GlassCard>
      </div>
    </div>
  )
}

export default ProfilePage
