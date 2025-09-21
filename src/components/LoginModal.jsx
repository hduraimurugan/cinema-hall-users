import React, { useEffect, useState } from 'react';
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
import { RxLockClosed } from "react-icons/rx";
import { MdMailOutline } from "react-icons/md";
import { FiUser, FiPhone, FiShield } from "react-icons/fi";
import { HiOutlineKey } from "react-icons/hi";
import { toast } from "sonner";
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { customerAuthAPI } from '../services/api';

export function LoginModal({ open, onOpenChange }) {
  const { login, signup } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

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
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      toast.success("Welcome back!");
      onOpenChange(false);
      resetForms();
    } catch (err) {
      // Check if error is 403 (unverified account)
      if (err.status === 403 || err.response?.status === 403) {
        // Store email for OTP verification
        setSignupData(prev => ({
          ...prev,
          email: loginData.email
        }));

        // Switch to signup tab and send OTP
        setActiveTab('signup');

        try {
          await customerAuthAPI.sendOtp(loginData.email);
          setOtpSent(true);
          setOtpTimer(60);
          toast.info("Account not verified. OTP sent to your email!");
          setError('');
        } catch (otpErr) {
          setError(otpErr.message || 'Failed to send OTP');
          toast.error("Failed to send OTP");
        }
      } else {
        setError(err.message || 'Invalid credentials');
        toast.error("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this new function after handleLogin
  const handleSignup = async () => {
    setError('');

    // Validate signup form first
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

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
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

      handleSendOtp();

      return true;
    } catch (err) {
      setError(err.message || 'Signup failed');
      toast.error("Signup failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Replace handleSendOtp with this
  const handleSendOtp = async () => {
    // First signup the user
    // const signupSuccess = await handleSignup();
    // if (!signupSuccess) return;

    // Then send OTP
    setLoading(true);
    try {
      await customerAuthAPI.sendOtp(signupData.email);
      setOtpSent(true);
      setOtpTimer(60); // 60 second cooldown
      toast.success("OTP sent to your email!");
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP and Signup
  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!signupData.otp || signupData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // First verify OTP
      await customerAuthAPI.verifyOtp(signupData.email, signupData.otp);

      // const response = await customerAuthAPI.signup({
      //   name: signupData.name,
      //   email: signupData.email,
      //   phone: signupData.phone,
      //   password: signupData.password
      // });

      // login(response.user);
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

  // Reset forms
  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setSignupData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
    setOtpSent(false);
    setOtpTimer(0);
    setError('');
  };

  // Handle modal close
  const handleModalChange = (open) => {
    if (!open) {
      resetForms();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalChange}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-6 mb-4" style={{ width: 'calc(100% - 3rem)' }}>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {error && (
            <div className="px-6">
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="link" className="px-0 text-sm text-primary">
                    Forgot password?
                  </Button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </CardContent>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" className="mt-0">
            <form onSubmit={otpSent ? handleVerifyAndSignup : (e) => { e.preventDefault(); handleSignup(); }}>
              <CardContent className="space-y-4 px-6">
                {!otpSent ? (
                  <>
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
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <HiOutlineKey className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </>
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
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        className="text-center text-lg tracking-widest font-mono"
                        maxLength={6}
                        value={signupData.otp}
                        onChange={(e) => setSignupData({ ...signupData, otp: e.target.value.replace(/\D/g, '') })}
                        required
                        disabled={loading}
                      />
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Please wait...' : (otpSent ? 'Verify & Sign Up' : 'Sign Up')}
                </Button>

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