import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import GoogleAuthButton from '../components/GoogleAuthButton'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, googleLogin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await register({ name, email, password })
      showToast('Account created successfully.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create account.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (idToken: string) => {
    setLoading(true)
    try {
      await googleLogin(idToken)
      showToast('Account connected with Google.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to continue with Google.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-5">
      <AnimatedBackground variant="auth" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 md:p-10 space-y-8">
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto"
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Create your <span className="text-gradient">account</span></h1>
            <p className="text-sm text-on-surface-variant">Create groups and track real shared expenses</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input required type="text" placeholder="Alex Morgan" value={name} onChange={(event) => setName(event.target.value)} className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input required type="email" placeholder="alex@university.edu" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input required minLength={6} type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-11 pr-12 py-3.5 glass-input rounded-xl outline-none text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full block text-center py-3.5 text-sm disabled:opacity-60">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-on-surface/10" />
              <span className="text-xs text-on-surface-variant">or</span>
              <div className="flex-1 h-px bg-on-surface/10" />
            </div>
            <GoogleAuthButton mode="signup" onCredential={handleGoogleCredential} onError={(message) => showToast(message, 'error')} />
          </form>
          <p className="text-center text-sm text-on-surface-variant">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SignupPage
