import { supabase } from './supabase.js'

async function testConnection() {
  const { data, error } = await supabase
    .from('products')
    .select('*')

  console.log('DATA:', data)
  console.log('ERROR:', error)
}

testConnection()