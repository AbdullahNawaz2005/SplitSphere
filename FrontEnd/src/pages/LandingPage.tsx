import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Users, ScanLine, Shield, TrendingUp, ArrowRight, ChevronRight, Star } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import { copyrightText } from '../utils/appMeta'

const features = [
  {
    icon: Users,
    title: 'Social Group Logic',
    description: 'Create groups for your flatmates, trip buddies, or recurring dinner mates. SplitSphere handles the math automatically.',
    color: '#10b981',
  },
  {
    icon: ScanLine,
    title: 'Expense Entry',
    description: 'Add shared expenses to real groups, choose members, and let SplitSphere calculate equal splits.',
    color: '#06b6d4',
  },
  {
    icon: Shield,
    title: 'Recorded Settlements',
    description: 'Mark settlements complete in SplitSphere without pretending to process external payments.',
    color: '#a855f7',
  },
  {
    icon: TrendingUp,
    title: 'Spending Insights',
    description: 'Review live backend totals and category splits when your group has real expenses.',
    color: '#f59e0b',
  },
]

const floatingHighlights = [
  { label: 'Create groups', detail: 'Invite code ready', x: '8%', y: '15%', delay: 0 },
  { label: 'Add expenses', detail: 'Backend synced', x: '72%', y: '10%', delay: 0.5 },
  { label: 'Track balances', detail: 'Live totals only', x: '5%', y: '60%', delay: 1 },
  { label: 'Record settlements', detail: 'No payment processing', x: '72%', y: '55%', delay: 1.5 },
  { label: 'View insights', detail: 'Appears after expenses', x: '42%', y: '75%', delay: 2 },
]

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' as const } },
}

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground variant="hero" />

      {/* Top nav for landing */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
      >
        <nav className="mx-auto max-w-6xl glass-strong rounded-2xl px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Split<span className="text-gradient">Sphere</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm flex items-center gap-1">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 md:pt-40 pb-20 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Copy */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={fadeUp} className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle text-xs font-medium tracking-wide text-primary">
                  <Star className="w-3 h-3 fill-primary-container text-primary-container" />
                  PREMIUM FINTECH FOR STUDENTS
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Split bills,{' '}
                  <span className="text-gradient">not friendships.</span>
                </h1>
              </motion.div>
              <motion.p variants={fadeUp} className="text-lg text-on-surface-variant leading-relaxed max-w-xl">
                The premium fintech experience designed for modern students. Organize expenses, settle debts with a tap, and maintain financial clarity without the awkwardness.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                <Link to="/signup" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
                  Start Splitting <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn-secondary text-base px-8 py-4">
                  Sign In
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="flex items-center gap-6 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-container" />
                  Free forever
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary-container" />
                  No hidden fees
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-tertiary-container" />
                  JWT-secured accounts
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Floating app capability cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block h-[500px]"
            >
              {floatingHighlights.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: item.delay * 0.3 + 0.5 }}
                  className="absolute glass-strong rounded-2xl px-5 py-3"
                  style={{ left: item.x, top: item.y }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <p className="text-xs text-on-surface-variant">{item.label}</p>
                    <p className="text-lg font-bold tracking-tight">{item.detail}</p>
                  </motion.div>
                </motion.div>
              ))}
              {/* Central app preview card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64"
              >
                <div className="glass-strong rounded-3xl p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">Total Balance</p>
                    <p className="text-3xl font-bold text-gradient">Live</p>
                  </div>
                  <div className="flex justify-center gap-1">
                    {['#10b981', '#06b6d4', '#a855f7', '#f59e0b'].map((color, i) => (
                      <div key={i} className="w-8 h-8 rounded-full ring-2 ring-white -ml-1 first:ml-0" style={{ backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="text-[10px] text-white font-bold">
                          {['AM', 'SC', 'MJ', 'PP'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <span className="chip chip-emerald">Backend connected</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Simplified Settlement Banner */}
      <section className="relative z-10 py-16 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Simplified <span className="text-gradient">settlement.</span>
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              SplitSphere turns group balances into clear settlement suggestions you can record when friends settle up.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-20 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="glass rounded-3xl p-8 card-hover h-full">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: `${feature.color}15` }}>
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-3">{feature.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-5 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to simplify your <span className="text-gradient">finances?</span>
            </h2>
            <Link to="/signup" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-5 md:px-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
          <p>{copyrightText}</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
