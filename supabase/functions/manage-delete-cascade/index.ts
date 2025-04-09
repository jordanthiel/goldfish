
// Follow this setup guide to integrate the Deno runtime and the Supabase JS library
// https://deno.com/blog/supabase-deno-integration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if user is a therapist
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'therapist')
      .maybeSingle()

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Only therapists can delete clients' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Get request body
    const { clientId } = await req.json()

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the client to make sure it exists and belongs to this therapist
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('therapist_id', user.id)
      .single()

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Client not found or you do not have permission to delete it' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Create a service role client for admin operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // First, create the audit log entry
    const { error: auditError } = await serviceClient
      .from('audit_logs')
      .insert({
        user_id: user.id, // Use the current user's ID
        action: 'DELETE',
        table_name: 'clients',
        record_id: clientId,
        old_data: client
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
      return new Response(
        JSON.stringify({ error: 'Failed to log deletion: ' + auditError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Delete client - this will cascade delete related records
    const { error: deleteError } = await serviceClient
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (deleteError) {
      console.error('Error deleting client:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete client: ' + deleteError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // If client had a user_id, remove the 'client' role from that user
    if (client.user_id) {
      const { error: roleDeleteError } = await serviceClient
        .from('user_roles')
        .delete()
        .eq('user_id', client.user_id)
        .eq('role', 'client')

      if (roleDeleteError) {
        console.error('Error removing client role:', roleDeleteError)
        // Continue anyway since the main operation succeeded
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Client and all related records deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in manage-delete-cascade function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
