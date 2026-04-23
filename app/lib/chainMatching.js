import supabase from './supabase'

export async function findExchangeChains(targetItemId) {
  const { data: allItems } = await supabase
    .from('items')
    .select('*')

  if (!allItems) return []

  const target = allItems.find(i => i.id === targetItemId)

  if (!target || !target.looking_for) return []

  const chains = []

  // 🔥 NIVEL 1: CADENA DE 2 PASOS
  allItems.forEach(a => {
    if (
      a.id !== target.id &&
      a.category &&
      a.category.toLowerCase().includes(target.looking_for.toLowerCase())
    ) {
      chains.push({
        type: 'direct',
        steps: [target, a],
      })
    }
  })

  // 🔥 NIVEL 2: CADENA DE 3 PASOS
  allItems.forEach(a => {
    if (!a.looking_for) return

    allItems.forEach(b => {
      if (
        a.id !== b.id &&
        b.category &&
        a.looking_for &&
        b.category.toLowerCase().includes(a.looking_for.toLowerCase())
      ) {
        if (
          target.looking_for &&
          a.category &&
          a.category.toLowerCase().includes(target.looking_for.toLowerCase())
        ) {
          chains.push({
            type: 'chain-3',
            steps: [target, a, b],
          })
        }
      }
    })
  })

  return chains
}