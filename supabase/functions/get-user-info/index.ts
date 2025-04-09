
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

    // Get request parameters
    let userId;
    
    // Check if this is a GET or POST request
    if (req.method === 'POST') {
      const { userId: reqUserId } = await req.json();
      userId = reqUserId;
    } else {
      // For GET requests, check URL parameters
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
      
      // Also support the new params format in v2.0+
      if (!userId) {
        try {
          const requestUrl = new URL(req.url);
          const paramsMatch = requestUrl.pathname.match(/\/params\/(.+)/);
          if (paramsMatch && paramsMatch[1]) {
            userId = paramsMatch[1];
          }
        } catch (e) {
          console.error("Error parsing URL params:", e);
        }
      }
    }

    // If a userId is provided, check if current user is an admin
    if (userId) {
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'therapist')
        .maybeSingle()

      // Only therapists can request other users' data
      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Not authorized to access other users\' data' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      // Use the service_role to get the requested user
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      const { data, error } = await adminClient.auth.admin.getUserById(userId)
      
      if (error) {
        return new Response(
          JSON.stringify({ error: 'Error fetching user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      return new Response(
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.first_name,
          lastName: data.user.user_metadata?.last_name,
          fullName: data.user.user_metadata?.full_name || 
                  `${data.user.user_metadata?.first_name || ''} ${data.user.user_metadata?.last_name || ''}`.trim(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return the current user's info
    return new Response(
      JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
        fullName: user.user_metadata?.full_name || 
                `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
