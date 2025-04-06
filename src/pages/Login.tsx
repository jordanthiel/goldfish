
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import RootLayout from '@/components/layout/RootLayout';
import { UserCircle2, Users } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
  role: z.enum(['therapist', 'client'], {
    required_error: 'Please select a role.',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'therapist',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    try {
      await signIn(data.email, data.password, data.role);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  return (
    <RootLayout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-gray-600">
              Log in to your Goldfish account
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I am a:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6"
                      >
                        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-muted transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                          <FormControl>
                            <RadioGroupItem value="therapist" id="therapist" className="sr-only" />
                          </FormControl>
                          <UserCircle2 className="h-5 w-5 text-primary" />
                          <label htmlFor="therapist" className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            Therapist
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-muted transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                          <FormControl>
                            <RadioGroupItem value="client" id="client" className="sr-only" />
                          </FormControl>
                          <Users className="h-5 w-5 text-primary" />
                          <label htmlFor="client" className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            Client
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {authError && (
                <div className="text-sm font-medium text-destructive">
                  {authError}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-therapy-purple hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              </div>
              
              <div>
                <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log In'}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center text-sm">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="text-therapy-purple font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </RootLayout>
  );
};

export default Login;
