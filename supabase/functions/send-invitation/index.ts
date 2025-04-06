
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://mhaeypkujysazwnfupml.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invitationId } = await req.json();

    if (!invitationId) {
      throw new Error("Missing invitationId");
    }

    // Get the invitation details
    const { data: emailData, error: emailDataError } = await supabase
      .rpc('send_client_invitation_email', { invite_id: invitationId });

    if (emailDataError) {
      throw emailDataError;
    }

    if (!emailData.success) {
      throw new Error(emailData.message || "Failed to retrieve invitation data");
    }

    // In a production app, you'd send a real email here
    // For now, we'll simulate it with a log
    console.log("Sending email to:", emailData.email);
    console.log("Invite code:", emailData.invite_code);
    console.log("Therapist:", emailData.therapist_name);
    console.log("Client:", emailData.client_name);
    
    const inviteUrl = `${req.headers.get('origin') || 'http://localhost:3000'}/accept-invitation?code=${emailData.invite_code}`;
    console.log("Invitation URL:", inviteUrl);

    // TODO: Implement real email sending here using a service like SendGrid, AWS SES, or Resend

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        inviteUrl // Include the invite URL in the response for testing
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Failed to send invitation"
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
