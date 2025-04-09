
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { patientService } from '@/services/patientService';

const ClaimAccount = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  useEffect(() => {
    const verifyInviteCode = async () => {
      if (!inviteCode) {
        setError('No invitation code provided');
        setLoading(false);
        return;
      }

      try {
        // Verify the invite code
        const { data, error: verifyError } = await supabase
          .rpc('verify_invite_code', {
            invite_code_param: inviteCode
          });
        
        if (verifyError) {
          throw new Error(verifyError.message);
        }
        
        // Check if data is an object and has valid property set to true
        const isValid = data && 
                       typeof data === 'object' && 
                       'valid' in data && 
                       data.valid === true;
        
        if (!isValid) {
          throw new Error('Invalid or expired invitation code');
        }

        setInviteDetails(data);
        setLoading(false);
      } catch (error: any) {
        console.error('Error verifying invite code:', error);
        setError(error.message || 'Failed to verify invitation code');
        setLoading(false);
      }
    };

    verifyInviteCode();
  }, [inviteCode]);

  useEffect(() => {
    // If user is already logged in, attempt to claim the account
    const claimAccountIfLoggedIn = async () => {
      if (user && inviteDetails && !claimSuccess && !error) {
        try {
          setLoading(true);
          const result = await patientService.claimPatientAccount(inviteCode!);
          
          if (result.success) {
            setClaimSuccess(true);
            toast({
              title: "Account claimed successfully",
              description: "Your account has been linked to your therapist."
            });

            // Slight delay before redirecting
            setTimeout(() => {
              navigate('/patient/dashboard');
            }, 1500);
          }
        } catch (error: any) {
          console.error('Error claiming account:', error);
          setError(error.message || 'Failed to claim your account');
        } finally {
          setLoading(false);
        }
      }
    };

    claimAccountIfLoggedIn();
  }, [user, inviteDetails, inviteCode, claimSuccess, error, toast, navigate]);

  const handleLogin = async () => {
    if (!inviteDetails || !inviteDetails.email) {
      setError('No email associated with this invitation');
      return;
    }

    navigate(`/login?email=${encodeURIComponent(inviteDetails.email)}&invite=${inviteCode}`);
  };

  const handleSignUp = async () => {
    if (!inviteDetails || !inviteDetails.email) {
      setError('No email associated with this invitation');
      return;
    }

    navigate(`/signup?email=${encodeURIComponent(inviteDetails.email)}&invite=${inviteCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-therapy-purple mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verifying your invitation</h2>
          <p className="text-muted-foreground">Please wait while we verify your invitation code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center">Invitation Error</CardTitle>
            <CardDescription className="text-center">
              We couldn't verify your invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (claimSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-center">Account Claimed Successfully</CardTitle>
            <CardDescription className="text-center">
              Your account has been linked to your therapist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              You'll be redirected to your dashboard shortly.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/patient/dashboard')}>Go to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Claim Your Account</CardTitle>
          <CardDescription className="text-center">
            Your therapist has invited you to claim your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteDetails && inviteDetails.email && (
            <p className="text-center mb-6">
              This invitation is for <strong>{inviteDetails.email}</strong>
            </p>
          )}
          
          <div className="space-y-4">
            <p className="text-center">
              {user ? (
                "We're linking your account to your therapist..."
              ) : (
                "You need to log in or create an account to continue."
              )}
            </p>
            
            {!user && (
              <div className="flex flex-col gap-3 mt-6">
                <Button onClick={handleLogin} className="w-full">
                  Log In
                </Button>
                <Button onClick={handleSignUp} variant="outline" className="w-full">
                  Create Account
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaimAccount;
