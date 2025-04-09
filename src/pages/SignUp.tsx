
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CheckCircle2, Mail, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const signUpSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  confirmPassword: z.string(),
  role: z.enum(['therapist', 'client'], {
    required_error: 'Please select an account type.',
  }),
  inviteCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const { signUp, loading } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse invite code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteCode = params.get('invite');
    
    if (inviteCode) {
      verifyInviteCode(inviteCode);
      form.setValue('inviteCode', inviteCode);
      form.setValue('role', 'client');
    }
  }, [location]);

  const verifyInviteCode = async (inviteCode: string) => {
    if (!inviteCode) return;
    
    setIsVerifyingInvite(true);
    try {
      const { data, error } = await supabase
        .rpc('verify_invite_code', {
          invite_code_param: inviteCode
        });
      
      if (error || !data.valid) {
        toast({
          title: "Invalid invitation code",
          description: error?.message || "This invitation is invalid or expired",
          variant: "destructive"
        });
        return;
      }

      // Set the email from the invitation
      if (data.email) {
        form.setValue('email', data.email);
        setInviteInfo(data);
        
        toast({
          title: "Invitation code verified",
          description: "You've been invited to join as a client.",
        });
      }
    } catch (error) {
      console.error('Error verifying invite code:', error);
      toast({
        title: "Error verifying invitation",
        description: "There was a problem verifying your invitation code.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingInvite(false);
    }
  };

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'client',
      inviteCode: '',
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    try {
      await signUp(values.email, values.password, values.fullName, values.role);
      setUserEmail(values.email);
      setIsSuccess(true);
      
      // If there's an invite code, automatically accept it after signup
      if (values.inviteCode && inviteInfo) {
        // The invitation will be automatically accepted when the user verifies their email and logs in
        toast({
          title: "Account will be linked",
          description: "Your account will be linked to your therapist after you verify your email and login.",
        });
      }
    } catch (error) {
      // Error is handled by the AuthContext
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold">Account Created</h1>
              <p className="mt-4 text-gray-600">
                Please check your email to verify your account.
              </p>
            </div>
            
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-6 mt-8">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-sky-600" />
                <h2 className="text-lg font-medium text-sky-900">Verification email sent</h2>
              </div>
              <p className="text-sky-700 text-left">
                We've sent a verification email to <strong>{userEmail}</strong>. Please click the link in that email to activate your account.
              </p>
            </div>
            
            {inviteInfo && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-6 mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="h-6 w-6 text-purple-600" />
                  <h2 className="text-lg font-medium text-purple-900">You've been invited!</h2>
                </div>
                <p className="text-purple-700 text-left">
                  After verifying your email and logging in, your account will be automatically linked to your therapist.
                </p>
              </div>
            )}
            
            <div className="mt-8">
              <p className="text-sm text-gray-600 mb-4">
                Once verified, you can log in to access your account.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="mt-2 text-gray-600">
              Join Goldfish and experience better therapy management
            </p>
            
            {inviteInfo && (
              <div className="mt-4 bg-purple-50 rounded-lg p-4 text-left">
                <p className="text-sm text-purple-800">
                  You've been invited to join as a client. Your account will be linked to your therapist automatically.
                </p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
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
                      <Input 
                        type="email" 
                        placeholder="jane@example.com" 
                        {...field} 
                        disabled={!!inviteInfo}
                      />
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
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        value={field.value}
                        className="flex flex-col space-y-1"
                        disabled={!!inviteInfo}
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="client" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Client seeking therapy
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="therapist" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Therapist or healthcare provider
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!inviteInfo && (
                <FormField
                  control={form.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invite Code (Optional)</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input 
                            placeholder="Enter invite code if you have one" 
                            {...field} 
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => verifyInviteCode(field.value)}
                          disabled={!field.value || isVerifyingInvite}
                        >
                          Verify
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div>
                <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center text-sm">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-therapy-purple font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
