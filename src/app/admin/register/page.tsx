'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationStep, setVerificationStep] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const router = useRouter()

  // Password validation function
  const validatePassword = (password: string) => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('At least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('One number')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('One special character')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    // Validate password requirements
    const errors = validatePassword(formData.password)
    if (errors.length > 0) {
      setError(`Password doesn't meet requirements: ${errors.join(', ')}`)
      setLoading(false)
      return
    }

    try {
      console.log('Submitting registration form...');
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()
      console.log('Registration response:', response.status);

      if (!response.ok) {
        // Handle specific error cases
        if (data.error && data.error.includes('Database connection not configured')) {
          throw new Error('The registration system is currently unavailable. Please try again later or contact support.')
        } else if (data.error && data.error.includes('Username or email already exists')) {
          throw new Error('This username or email is already registered. Please try another or sign in.')
        } else {
          throw new Error(data.error || 'Registration failed')
        }
      }

      // Handle warning but successful registration
      if (data.warning) {
        console.warn('Registration warning:', data.warning);
      }

      // If we got a verification code, store it and move to verification step
      if (data.verification_code) {
        setVerificationCode(data.verification_code)
        setVerificationStep(true)
        setLoading(false)
      } else {
        // Account created successfully - redirect to create event page
        router.push('/create?accountCreated=true')
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again later.')
      setLoading(false)
    }
  }

  // Handle verification code submission
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setVerifying(true)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: verifyCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Verification successful - redirect to create event page
      router.push('/create?accountCreated=true')
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Validate password in real-time
    if (name === 'password') {
      const errors = validatePassword(value)
      setPasswordErrors(errors)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl text-center text-white">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-light mb-4">Check Your Email</h1>
            <p className="text-white/80 mb-6">
              We've sent a verification link to <strong>{formData.email}</strong>. 
              Please click the link to activate your account.
            </p>
            <p className="text-white/60 text-sm mb-6">
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                onClick={() => setSuccess(false)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                try again
              </button>
            </p>
            <Link 
              href="/admin/login"
              className="inline-block px-6 py-3 bg-white text-black font-light rounded-xl hover:bg-white/90 transition-all"
            >
              Back to Login
            </Link>
          </div>
        </div>
        <Footer showDonate={false} />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 text-white text-glow">
            <h1 className="text-4xl font-light mb-2 tracking-tight">Create Account</h1>
            <p className="text-white/80 text-lg font-light">Join OwlRSVP as an admin</p>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3"
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`modern-input w-full px-4 py-3 ${
                    formData.password && passwordErrors.length > 0 ? 'border-red-400' : 
                    formData.password && passwordErrors.length === 0 ? 'border-green-400' : ''
                  }`}
                  placeholder="Create a strong password"
                  required
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="text-xs text-white/60 mb-2">Password requirements:</div>
                    <div className="space-y-1">
                      {[
                        { text: 'At least 8 characters', valid: formData.password.length >= 8 },
                        { text: 'One uppercase letter', valid: /[A-Z]/.test(formData.password) },
                        { text: 'One lowercase letter', valid: /[a-z]/.test(formData.password) },
                        { text: 'One number', valid: /\d/.test(formData.password) },
                        { text: 'One special character', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) }
                      ].map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                            req.valid ? 'bg-green-500' : 'bg-white/20'
                          }`}>
                            {req.valid && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={req.valid ? 'text-green-400' : 'text-white/60'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`modern-input w-full px-4 py-3 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-400' : 
                    formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-400' : ''
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                {formData.confirmPassword && (
                  <div className="mt-1 text-xs">
                    {formData.password === formData.confirmPassword ? (
                      <span className="text-green-400">✓ Passwords match</span>
                    ) : (
                      <span className="text-red-400">✗ Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || passwordErrors.length > 0 || formData.password !== formData.confirmPassword}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/70 text-sm">
                Already have an account?{' '}
                <Link href="/admin/login" className="text-white hover:text-white/80 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-white/60 hover:text-white/80 text-sm"
            >
              ← Back to OwlRSVP
            </Link>
          </div>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}
