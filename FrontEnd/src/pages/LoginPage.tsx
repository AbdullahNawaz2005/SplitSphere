import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import GoogleAuthButton from '../components/GoogleAuthButton'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, googleLogin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await login({ email, password })
      showToast('Signed in successfully.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to sign in.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (idToken: string) => {
    setLoading(true)
    try {
      await googleLogin(idToken)
      showToast('Signed in with Google.', 'success')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to sign in with Google.', 'error')
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto"
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">
              Split<span className="text-gradient">Sphere</span>
            </h1>
            <p className="text-sm text-on-surface-variant">Premium Finance for the Modern Socialite</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input required type="email" placeholder="alex@splitsphere.io" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input required type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-12 py-3.5 glass-input rounded-xl outline-none text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full block text-center py-3.5 text-sm disabled:opacity-60">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-on-surface/10" />
              <span className="text-xs text-on-surface-variant">or continue with</span>
              <div className="flex-1 h-px bg-on-surface/10" />
            </div>
            <GoogleAuthButton mode="signin" onCredential={handleGoogleCredential} onError={(message) => showToast(message, 'error')} />
          </form>
          <p className="text-center text-sm text-on-surface-variant">
            New to SplitSphere? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
        <div className="flex justify-center gap-6 mt-6 text-xs text-on-surface-variant">
          <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
