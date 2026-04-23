import supabase from './supabase'

export async function getSuggestions(itemId) {
  // 🔍 obtener item actual
  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (!item) return []

  // 🔍 buscar coincidencias por category y looking_for
  const { data: matches } = await supabase
    .from('items')
    .select('*')
    .ilike('category', `%${item.looking_for || ''}%`)
    .limit(20)

  return matches || []
}