import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CardContent,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { RxLockClosed } from "react-icons/rx";
import { MdMailOutline } from "react-icons/md";
import { FiUser, FiPhone, FiShield, FiEye, FiEyeOff } from "react-icons/fi";
import { HiOutlineKey } from "react-icons/hi";
import { ShieldAlert, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { customerAuthAPI } from '../services/api';
import { PASSWORD_POLICY_CHECKS } from '../utils/passwordPolicy';

/** Inline password-policy checklist — turns green as user types */
function PasswordPolicyChecklist({ password }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_POLICY_CHECKS.map((check) => {
        const passed = check.test(password);
        return (
          <li key={check.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
            <span>{passed ? '✓' : '○'}</span>
            {check.label}
          </li>
        );
      })}
    </ul>
  );
}

export function LoginModal({ open, onOpenChange }) {
  const { login, signup, googleLogin } = useCustomerAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lockHint, setLockHint] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  // Timer for OTP resend
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setLockedUntil(null);
    setLockHint('');
    setLoading(true);

    try {
      const result = await login(loginData.email, loginData.password);

      if (result.success) {
        toast.success("Welcome back!");
        onOpenChange(false);
        resetForms();
      } else {
        const data = result.details || {};
        const code = data?.code || '';
        setErrorCode(code);

        if (code === 'ACCOUNT_LOCKED') {
          setLockedUntil(data.lockedUntil ? new Date(data.lockedUntil) : null);
          setError(data.error || 'Account is temporarily locked.');
          toast.error("Account locked");
          return;
        }

        if (data?.hint) setLockHint(data.hint);

        const errorMessage = result.message || 'Login failed';

        if (errorMessage.includes('not verified') || errorMessage.includes('unverified')) {
          setSignupData(prev => ({ ...prev, email: loginData.email }));
          setActiveTab('signup');
          try {
            await customerAuthAPI.sendOtp(loginData.email, 'signup');
            setOtpSent(true);
            setOtpTimer(60);
            toast.info("Account not verified. OTP sent to your email!");
            setError('');
          } catch (otpErr) {
            setError(otpErr.message || 'Failed to send OTP');
            toast.error("Failed to send OTP");
          }
        } else if (errorMessage.includes('not found')) {
          setError('Account not found. Please sign up first.');
          toast.error("Account not found");
        } else {
          setError(errorMessage);
          toast.error("Login failed");
        }
      }
    } catch {
      setError('Network error. Please try again.');
      toast.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');

    if (!signupData.name || !signupData.email || !signupData.phone) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!signupData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    // Check all policy rules client-side for instant feedback
    const allPassed = PASSWORD_POLICY_CHECKS.every(c => c.test(signupData.password));
    if (!allPassed) {
      setError('Please make sure your password meets all the requirements below.');
      return false;
    }

    setLoading(true);
    try {
      const result = await signup({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password
      });

      if (!result.success) {
        setError(result.message || 'Signup failed');
        toast.error("Signup failed");
        return false;
      }

      await handleSendOtp();
      return true;
    } catch (err) {
      setError(err.message || 'Signup failed');
      toast.error("Signup failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await customerAuthAPI.sendOtp(signupData.email, 'signup');
      setOtpSent(true);
      setOtpTimer(60);
      toast.success("OTP sent to your email!");
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!signupData.otp || signupData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await customerAuthAPI.verifyOtp(signupData.email, signupData.otp, 'signup');
      toast.success("Account created successfully!");
      onOpenChange(false);
      resetForms();
    } catch (err) {
      setError(err.message || 'Verification failed');
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setSignupData({ name: '', email: '', phone: '', password: '', confirmPassword: '', otp: '' });
    setOtpSent(false);
    setOtpTimer(0);
    setError('');
    setErrorCode('');
    setLockedUntil(null);
    setLockHint('');
  };

  const handleModalChange = (isOpen) => {
    if (!isOpen) resetForms();
    onOpenChange(isOpen);
  };

  const handleForgotPassword = () => {
    onOpenChange(false);
    resetForms();
    navigate('/forgot-password');
  };

  // Google OAuth login
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading(true);
      setError('');
      setErrorCode('');
      try {
        const result = await googleLogin(tokenResponse.access_token);
        if (result.success) {
          toast.success("Welcome!");
          onOpenChange(false);
          resetForms();
        } else {
          setError(result.message || 'Google login failed');
          toast.error(result.message || 'Google login failed');
        }
      } catch {
        setError('Google login failed. Please try again.');
        toast.error('Google login failed. Please try again.');
      } finally {
        setOauthLoading(false);
      }
    },
    onError: () => {
      toast.error('Google login was cancelled.');
      setOauthLoading(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={handleModalChange}>
      <DialogContent className="sm:max-w-[525px] p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-primary/10 p-3">
                <RxLockClosed className="h-6 w-6 text-primary" />
              </div>
            </div>
            Welcome to CineMax
          </DialogTitle>
          <CardDescription className="text-center">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create your account'}
          </CardDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(''); setErrorCode(''); setLockedUntil(null); setLockHint(''); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-6 mb-4" style={{ width: 'calc(100% - 3rem)' }}>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Account locked banner */}
          {errorCode === 'ACCOUNT_LOCKED' && (
            <div className="px-6 mb-2">
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                  <ShieldAlert className="h-4 w-4" />
                  Account temporarily locked
                </div>
                {lockedUntil && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Unlocks at {lockedUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {lockedUntil.toLocaleDateString()}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  To regain immediate access,{' '}
                  <button onClick={handleForgotPassword} className="text-primary underline">reset your password</button>.
                </p>
              </div>
            </div>
          )}

          {/* General error */}
          {error && errorCode !== 'ACCOUNT_LOCKED' && (
            <div className="px-6">
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Remaining attempts hint */}
          {lockHint && !error.includes('locked') && (
            <div className="px-6 mb-2">
              <p className="text-xs text-amber-500 text-center">{lockHint}</p>
            </div>
          )}

          {/* Login Tab */}
          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 px-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <div className="relative">
                    <MdMailOutline className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <RxLockClosed className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(v => !v)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="link" className="px-0 text-sm text-primary" onClick={handleForgotPassword}>
                    Forgot password?
                  </Button>
                </div>

                <Button type="submit" className="w-full" disabled={loading || oauthLoading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                {/* OAuth Separator */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Google Login Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleGoogleLogin()}
                  disabled={loading || oauthLoading}
                >
                  {oauthLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </Button>
              </CardContent>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" className="mt-0">
            <form onSubmit={otpSent ? handleVerifyAndSignup : (e) => { e.preventDefault(); handleSignup(); }}>
              <CardContent className="space-y-4 px-6">
                {!otpSent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email Address</Label>
                      <div className="relative">
                        <MdMailOutline className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number</Label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          className="pl-10"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <RxLockClosed className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(v => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showSignupPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                      <PasswordPolicyChecklist password={signupData.password} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <HiOutlineKey className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                        <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-secondary/20 p-3">
                          <FiShield className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Verify Your Email</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We've sent a 6-digit code to<br />
                        <span className="font-medium text-foreground">{signupData.email}</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-center block">Enter OTP</Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={signupData.otp}
                          onChange={(value) => setSignupData({ ...signupData, otp: value })}
                          disabled={loading}
                        >
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
                    </div>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm"
                        onClick={handleSendOtp}
                        disabled={otpTimer > 0 || loading}
                      >
                        {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP'}
                      </Button>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading || oauthLoading}>
                  {loading ? 'Please wait...' : (otpSent ? 'Verify & Sign Up' : 'Sign Up')}
                </Button>

                {/* Google signup — only show before OTP stage */}
                {!otpSent && (
                  <>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleGoogleLogin()}
                      disabled={loading || oauthLoading}
                    >
                      {oauthLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      Continue with Google
                    </Button>
                  </>
                )}

                {otpSent && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setOtpSent(false);
                      setSignupData({ ...signupData, otp: '' });
                    }}
                    disabled={loading}
                  >
                    Back to Details
                  </Button>
                )}
              </CardContent>
            </form>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-center px-6 pb-6 pt-2">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary underline-offset-4 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </a>
          </p>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
}
