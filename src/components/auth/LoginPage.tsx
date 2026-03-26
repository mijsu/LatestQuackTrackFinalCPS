'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Users, Calendar, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '@/components/layout/Footer';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'checking' | 'seeded' | 'needs-seed'>('idle');

  // Check seed status on mount
  useEffect(() => {
    const checkSeedStatus = async () => {
      try {
        const res = await fetch('/api/seed');
        const data = await res.json();
        setSeedStatus(data.seeded ? 'seeded' : 'needs-seed');
      } catch {
        setSeedStatus('needs-seed');
      }
    };
    checkSeedStatus();
  }, []);

  // Handle seed database
  const handleSeed = async () => {
    setSeedLoading(true);
    setError('');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedStatus('seeded');
        setSuccess('Database seeded! Demo accounts are now available.');
      } else {
        setError(data.error || 'Failed to seed database');
      }
    } catch {
      setError('Failed to seed database');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid institutional email or password');
      } else {
        window.location.reload();
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Image */}
          <Image 
            src="/ptc-bg.png" 
            alt="PTC Background" 
            fill
            className="object-cover"
            priority
          />
          {/* Subtle dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <Image 
                  src="/logo-ptc.png" 
                  alt="PTC Logo" 
                  width={48} 
                  height={48}
                  className="rounded-xl bg-white/20 backdrop-blur-sm p-1"
                />
                <div>
                  <h1 className="text-2xl font-bold">QuackTrack</h1>
                  <p className="text-white/80 text-sm">Pateros Technological College</p>
                </div>
              </div>

              <h2 className="text-4xl font-bold mb-4">
                Academic Scheduling System
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-md">
                Manage faculty schedules, track teaching loads, and organize academic 
                resources for Pateros Technological College.
              </p>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Schedule Management</h3>
                    <p className="text-sm text-white/70">Organize classes, rooms, and time slots</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Faculty & Student Records</h3>
                    <p className="text-sm text-white/70">Track teaching loads and assignments</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Admin & Faculty Access</h3>
                    <p className="text-sm text-white/70">Role-based dashboard and permissions</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Courses & Departments</h3>
                    <p className="text-sm text-white/70">Manage subjects, sections, and rooms</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background relative overflow-hidden">
          {/* Background Image - Light mode only */}
          <Image 
            src="/ptc-bg-right.png" 
            alt="PTC Background" 
            fill
            className="object-cover dark:opacity-0 transition-opacity duration-300"
            priority
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo-ptc.png" 
                  alt="PTC Logo" 
                  width={48} 
                  height={48}
                  className="rounded-xl"
                />
                <div>
                  <h1 className="text-xl font-bold">QuackTrack</h1>
                  <p className="text-muted-foreground text-sm">Pateros Technological College</p>
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                  Sign in with your institutional email to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        {success}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Institutional Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="lastname.firstname@ptc.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>

                  {/* Seed Button (only show if needs seeding) */}
                  {seedStatus === 'needs-seed' && (
                    <div className="pt-4 border-t">
                      <Alert className="border-amber-500/50 bg-amber-500/10 mb-3">
                        <Database className="h-4 w-4 text-amber-500" />
                        <AlertDescription className="text-amber-700 dark:text-amber-400">
                          Database needs to be seeded with demo data.
                        </AlertDescription>
                      </Alert>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleSeed}
                        disabled={seedLoading}
                      >
                        {seedLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Seeding Database...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Seed Demo Data
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Demo Credentials */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground text-center mb-3">Demo Credentials:</p>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setEmail('admin@ptc.edu.ph');
                          setPassword('password123');
                        }}
                      >
                        <span className="font-medium mr-2">Admin:</span>
                        admin@ptc.edu.ph
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setEmail('faculty1@ptc.edu.ph');
                          setPassword('password123');
                        }}
                      >
                        <span className="font-medium mr-2">Faculty:</span>
                        faculty1@ptc.edu.ph
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Registration notice */}
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Need an account? Contact your department administrator.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
