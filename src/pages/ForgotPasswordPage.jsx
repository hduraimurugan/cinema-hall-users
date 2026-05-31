// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { MdMailOutline } from 'react-icons/md'
import { RxLockClosed } from 'react-icons/rx'
import { FiEye, FiEyeOff, FiShield } from 'react-icons/fi'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { customerAuthAPI } from '../services/api'
import { PASSWORD_POLICY_CHECKS } from '../utils/passwordPolicy'

/** Real-time password policy checklist */
function PasswordPolicyChecklist({ password }) {
  if (!password) return null
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_POLICY_CHECKS.map((check) => {
        const passed = check.test(password)
        return (
          <li
            key={check.label}
            className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-500' : 'text-muted-foreground'}`}
          >
            <span>{passed ? '✓' : '○'}</span>
            {check.label}
          </li>
        )
      })}
    </ul>
  )
}

// Steps: 'email' → 'reset' → 'success'
export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Count down resend timer
  const startTimer = () => {
    setOtpTimer(60)
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email address.'); return }

    setLoading(true)
    try {
      await customerAuthAPI.forgotPassword(email)
      toast.success('OTP sent! Check your inbox.')
      setStep('reset')
      startTimer()
    } catch (err) {
      setError(err.message || 'Failed to send OTP.')
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP (from step 2)
  const handleResendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      await customerAuthAPI.forgotPassword(email)
      setOtp('')
      startTimer()
      toast.success('New OTP sent!')
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP + set new password
  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    if (!otp || otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return }
    if (!newPassword || !confirmPassword) { setError('Please fill in both password fields.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }

    const allPassed = PASSWORD_POLICY_CHECKS.every(c => c.test(newPassword))
    if (!allPassed) { setError('Please make sure your new password meets all requirements.'); return }

    setLoading(true)
    try {
      await customerAuthAPI.resetPassword(email, otp, newPassword)
      toast.success('Password reset successfully!')
      setStep('success')
    } catch (err) {
      const code = err.code
      if (code === 'OTP_EXPIRED') {
        setError('OTP has expired. Please request a new one.')
        setOtp('')
      } else if (code === 'OTP_ATTEMPTS_EXCEEDED') {
        setError('Too many incorrect attempts. Please request a new OTP.')
        setOtp('')
      } else {
        setError(err.message || 'Failed to reset password.')
      }
      toast.error('Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-xl p-8 space-y-6">

          {/* ── Step: email ─────────────────────────── */}
          {step === 'email' && (
            <>
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <RxLockClosed className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a one-time code to reset your password.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Email Address</Label>
                  <div className="relative">
                    <MdMailOutline className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </Button>
              </form>

              <div className="text-center">
                <Button variant="link" className="text-sm" onClick={() => navigate(-1)}>
                  Back to Sign In
                </Button>
              </div>
            </>
          )}

          {/* ── Step: reset ─────────────────────────── */}
          {step === 'reset' && (
            <>
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <FiShield className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the OTP sent to <span className="font-medium text-foreground">{email}</span> and choose a new password.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                {/* OTP */}
                <div className="space-y-2">
                  <Label className="block text-center">Enter OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="text-center mt-1">
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs"
                      onClick={handleResendOtp}
                      disabled={otpTimer > 0 || loading}
                    >
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP'}
                    </Button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-2">
                  <Label htmlFor="fp-new-password">New Password</Label>
                  <div className="relative">
                    <RxLockClosed className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fp-new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordPolicyChecklist password={newPassword} />
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <Label htmlFor="fp-confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <RxLockClosed className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fp-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
                >
                  {loading ? 'Resetting…' : 'Reset Password'}
                </Button>
              </form>

              <div className="text-center">
                <Button variant="link" className="text-sm" onClick={() => { setStep('email'); setOtp(''); setError('') }}>
                  Use a different email
                </Button>
              </div>
            </>
          )}

          {/* ── Step: success ─────────────────────────── */}
          {step === 'success' && (
            <div className="text-center space-y-5 py-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-500/10 p-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Password reset!</h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated successfully. All other active sessions have been signed out for your security.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate('/movies', { state: { openLogin: true } })}>
                Sign In
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
