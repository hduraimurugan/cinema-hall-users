// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { customerAuthAPI } from '../services/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RxLockClosed } from 'react-icons/rx'
import { FiEye, FiEyeOff, FiUser, FiMail } from 'react-icons/fi'
import { CheckCircle2, Link2, Unlink, Loader2, RefreshCw } from 'lucide-react'
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
  const { customer, changePassword, refreshCustomer } = useCustomerAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Set password state (for OAuth-only accounts)
  const [setPasswordValue, setSetPasswordValue] = useState('')
  const [confirmSetPassword, setConfirmSetPassword] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)

  // Provider linking
  const [linkingProvider, setLinkingProvider] = useState(null)
  const [unlinkingProvider, setUnlinkingProvider] = useState(null)

  const authProviders = customer?.auth_providers || ['local']
  const hasPassword = customer?.has_password !== false

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

  // Google link handler
  const handleLinkGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLinkingProvider('google')
      try {
        await customerAuthAPI.linkProvider('google', { idToken: tokenResponse.access_token })
        toast.success("Google account linked successfully!")
        refreshCustomer()
      } catch (err) {
        toast.error(err.message || "Failed to link Google account.")
      } finally {
        setLinkingProvider(null)
      }
    },
    onError: () => {
      toast.error("Google linking was cancelled.")
      setLinkingProvider(null)
    },
  })

  const handleUnlinkGoogle = async () => {
    setUnlinkingProvider('google')
    try {
      await customerAuthAPI.unlinkProvider('google')
      toast.success("Google account unlinked.")
      refreshCustomer()
    } catch (err) {
      toast.error(err.message || "Failed to unlink Google.")
    } finally {
      setUnlinkingProvider(null)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    const allPassed = PASSWORD_POLICY_CHECKS.every(c => c.test(setPasswordValue))
    if (!allPassed) { toast.error("Password does not meet the policy."); return }
    if (setPasswordValue !== confirmSetPassword) { toast.error("Passwords do not match."); return }

    setSettingPassword(true)
    try {
      await customerAuthAPI.setPassword(setPasswordValue)
      toast.success("Password set successfully!")
      setSetPasswordValue('')
      setConfirmSetPassword('')
      refreshCustomer()
    } catch (err) {
      toast.error(err.message || "Failed to set password.")
    } finally {
      setSettingPassword(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* Profile info */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Your Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            {customer?.avatar ? (
              <img src={customer.avatar} alt={customer.name} className="h-8 w-8 rounded-full object-cover border border-border" />
            ) : (
              <FiUser className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
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

      {/* Connected Login Methods */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold">Connected Login Methods</h2>
        </div>
        <Separator />
        <div className="space-y-3">
          {/* Email & Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <FiMail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Email & Password</p>
                <p className="text-xs text-muted-foreground">{customer?.email}</p>
              </div>
            </div>
            {hasPassword ? (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">Not set</Badge>
            )}
          </div>

          {/* Google */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-muted-foreground">{authProviders.includes('google') ? 'Linked' : 'Not linked'}</p>
              </div>
            </div>
            {authProviders.includes('google') ? (
              <Button
                variant="outline" size="sm" className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleUnlinkGoogle}
                disabled={unlinkingProvider === 'google'}
              >
                {unlinkingProvider === 'google' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Unlink className="w-3 h-3 mr-1" />}
                Disconnect
              </Button>
            ) : (
              <Button
                variant="outline" size="sm" className="text-xs h-8"
                onClick={() => handleLinkGoogle()}
                disabled={linkingProvider === 'google'}
              >
                {linkingProvider === 'google' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Change Password / Set Password */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold">{hasPassword ? 'Change Password' : 'Set Password'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hasPassword
              ? 'After changing your password, all other devices will be signed out.'
              : 'Set a password to also login with email and password.'}
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

        {hasPassword ? (
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
        ) : (
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-password">New Password</Label>
            <div className="relative">
              <RxLockClosed className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="set-password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={setPasswordValue}
                onChange={(e) => setSetPasswordValue(e.target.value)}
                disabled={settingPassword}
              />
            </div>
            <PasswordPolicyChecklist password={setPasswordValue} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-set-password">Confirm Password</Label>
            <div className="relative">
              <RxLockClosed className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-set-password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={confirmSetPassword}
                onChange={(e) => setConfirmSetPassword(e.target.value)}
                disabled={settingPassword}
              />
            </div>
            {confirmSetPassword && setPasswordValue !== confirmSetPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              settingPassword ||
              !setPasswordValue ||
              setPasswordValue !== confirmSetPassword ||
              !PASSWORD_POLICY_CHECKS.every(c => c.test(setPasswordValue))
            }
          >
            {settingPassword ? 'Setting…' : 'Set Password'}
          </Button>
        </form>
        )}
      </div>
    </div>
  )
}
