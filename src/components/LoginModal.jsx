// components/LoginModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
import { RxLockClosed } from "react-icons/rx";
import { MdMailOutline } from "react-icons/md";
import { toast } from "sonner";

export function LoginModal({ open, onOpenChange }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (email === 'admin@example.com' && password === 'admin123') {
      login({ name: 'Admin User', email, role: "Cinema Manager" });
      toast.success("Logged in successfully");
      onOpenChange(false); // Close modal after login
    } else {
      setError('Invalid email or password');
      toast.error("Invalid email or password", {
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-primary/10 p-3">
                <RxLockClosed className="h-6 w-6 text-primary" />
              </div>
            </div>
            CineMax
          </DialogTitle>
          <CardDescription className="text-center">
            Sign in to proceed
          </CardDescription>
        </DialogHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <MdMailOutline className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <RxLockClosed className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <a href="#" className="text-primary underline-offset-4 hover:underline">
              Contact Support
            </a>
          </p>
        </CardFooter>
      </DialogContent>
    </Dialog>
  );
}
