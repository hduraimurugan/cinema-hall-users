// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RxLockClosed } from 'react-icons/rx'
import { FiEye, FiEyeOff, FiUser, FiMail } from 'react-icons/fi'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
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

export const ProfilePage = () => {
  const { customer, changePassword } = useCustomerAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    const allPassed = PASSWORD_POLICY_CHECKS.every(c => c.test(newPassword))
    if (!allPassed) {
      setError('New password does not meet all requirements.')
      return
    }

    setLoading(true)
    const result = await changePassword(currentPassword, newPassword)
    setLoading(false)

    if (result.success) {
      toast.success('Password changed successfully!')
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setError(result.message || 'Failed to change password.')
      toast.error('Password change failed')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* Profile info */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Your Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <FiUser className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Full Name</p>
              <p className="font-medium">{customer?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FiMail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Email Address</p>
              <p className="font-medium">{customer?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Change Password</h2>
          <p className="text-sm text-muted-foreground mt-1">
            After changing your password, all other devices will be signed out.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Password changed successfully. Other sessions have been signed out.
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <RxLockClosed className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrent ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <RxLockClosed className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordPolicyChecklist password={newPassword} />
          </div>

          {/* Confirm new password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <div className="relative">
              <RxLockClosed className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-new-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !currentPassword ||
              !newPassword ||
              newPassword !== confirmPassword ||
              !PASSWORD_POLICY_CHECKS.every(c => c.test(newPassword))
            }
          >
            {loading ? 'Updating…' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
