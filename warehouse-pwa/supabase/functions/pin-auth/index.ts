import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pin } = await req.json()

    if (!pin || pin.length < 4) {
      throw new Error('Invalid PIN')
    }

    // Create admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find user with matching PIN
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'warehouse_worker')

    if (userError) throw userError

    // Check PIN against each worker
    let matchedUser = null
    for (const user of users) {
      if (user.pin_hash && await bcrypt.compare(pin, user.pin_hash)) {
        matchedUser = user
        break
      }
    }

    if (!matchedUser) {
      throw new Error('Invalid PIN')
    }

    // Generate session for the user
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: matchedUser.email || `worker-${matchedUser.id}@warehouse.local`,
    })

    if (authError) throw authError

    return new Response(
      JSON.stringify({
        success: true,
        user: matchedUser,
        session: authData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
