
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";

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
    // Parse the request body
    const { record, type } = await req.json();
    
    // Get Supabase client with admin permissions using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );
    
    console.log(`Managing ${type} cascade for record:`, record);
    
    if (type === 'client_delete') {
      // When a client is deleted, clean up related records
      if (!record || !record.id) {
        throw new Error('Client ID is required for deletion cascade');
      }
      
      const clientId = record.id;
      
      // 1. Delete appointments associated with this client
      const { error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .delete()
        .eq('client_id', clientId);
        
      if (appointmentsError) {
        console.error('Error deleting client appointments:', appointmentsError);
      }
      
      // 2. Delete therapist-client relationships
      const { error: relationshipError } = await supabaseAdmin
        .from('therapist_clients')
        .delete()
        .eq('client_id', clientId);
        
      if (relationshipError) {
        console.error('Error deleting therapist-client relationships:', relationshipError);
      }
      
      // 3. Delete session notes for this client
      const { error: notesError } = await supabaseAdmin
        .from('session_notes')
        .delete()
        .eq('client_id', clientId);
        
      if (notesError) {
        console.error('Error deleting client session notes:', notesError);
      }
      
      // 4. Delete billing records for this client
      const { error: billingError } = await supabaseAdmin
        .from('billing')
        .delete()
        .eq('client_id', clientId);
        
      if (billingError) {
        console.error('Error deleting client billing records:', billingError);
      }
      
      // 5. If client has a user_id, we might want to handle user data too
      if (record.user_id) {
        // Be careful about deleting actual users
        // Instead, you might clear certain roles or update user status
        console.log(`Client had user_id ${record.user_id}, consider handling user data`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Client and related records deleted successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    else if (type === 'therapist_delete') {
      // When a therapist is deleted, handle their clients appropriately
      // Implementation depends on business logic - reassign clients, archive, etc.
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Therapist deletion cascade not fully implemented yet' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Unknown cascade type: ${type}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error in manage-delete-cascade:', error);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
