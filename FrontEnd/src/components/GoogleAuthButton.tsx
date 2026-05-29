import React from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

interface GoogleAuthButtonProps {
  mode: 'signin' | 'signup'
  onCredential: (idToken: string) => Promise<void> | void
  onError: (message: string) => void
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ mode, onCredential, onError }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError('Google did not return an ID token.')
      return
    }
    void onCredential(credentialResponse.credential)
  }

  if (!clientId) {
    return (
      <button
        type="button"
        onClick={() => onError('Set VITE_GOOGLE_CLIENT_ID in the frontend environment to enable Google sign-in.')}
        className="w-full flex items-center justify-center gap-3 py-3.5 glass-subtle rounded-xl hover:bg-white/40 transition-all text-sm font-medium"
      >
        Continue with Google
      </button>
    )
  }

  return (
    <div className="w-full flex justify-center py-1 glass-subtle rounded-xl">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError('Google sign-in failed. Please try again.')}
        theme="outline"
        size="large"
        text={mode === 'signup' ? 'signup_with' : 'continue_with'}
        shape="rectangular"
        width="360"
      />
    </div>
  )
}

export default GoogleAuthButton
