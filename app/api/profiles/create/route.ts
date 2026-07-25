import { NextRequest, NextResponse } from 'next/server'
import { adminClient, requireUser } from '@/app/lib/apiAuth'

export async function POST(req: NextRequest) {
  try {
    const { id, username, name, city, interests, avatar_url } = await req.json()

    if (!id || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = adminClient()

    /* Caso 1: sesión activa (usuario ya confirmado completando su perfil) */
    const authedUser = await requireUser(req)

    if (authedUser) {
      if (authedUser.id !== id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    } else {
      /* Caso 2: signUp() recién hecho, correo aún sin confirmar — todavía no hay token.
         Verificar que `id` sea un usuario real de Supabase Auth y que su perfil no haya
         sido reclamado ya, para nunca sobrescribir un perfil existente. */
      const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(id)
      if (authUserError || !authUser?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const { data: currentProfile } = await admin
        .from('profiles')
        .select('username')
        .eq('id', id)
        .maybeSingle()

      if (currentProfile?.username) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'USERNAME_TAKEN' }, { status: 409 })
    }

    const { error } = await admin
      .from('profiles')
      .upsert({ id, username, name, city, interests, avatar_url: avatar_url || null })

    if (error) {
      console.error('[profiles/create] Upsert error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[profiles/create] CRASH:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
