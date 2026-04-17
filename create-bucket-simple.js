// Simple script to create Supabase storage bucket
const { createClient } = require('@supabase/supabase-js')

// Read from .env.test file
const fs = require('fs')
const envContent = fs.readFileSync('.env.test', 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.+?)"?$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SECRET_KEY

console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
console.log('Supabase Key:', supabaseKey ? '✓ Set (first 10 chars): ' + supabaseKey.substring(0, 10) + '...' : '✗ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  try {
    console.log('\n1. Checking existing buckets...')
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError.message)
      return
    }
    
    console.log(`Found ${buckets.length} buckets:`)
    buckets.forEach(bucket => console.log(`  - ${bucket.name} (public: ${bucket.public})`))
    
    const policyBucket = buckets.find(b => b.name === 'policy-documents')
    
    if (policyBucket) {
      console.log('\n✅ "policy-documents" bucket already exists!')
      console.log(`   ID: ${policyBucket.id}, Public: ${policyBucket.public}`)
      return
    }
    
    console.log('\n❌ "policy-documents" bucket does not exist')
    console.log('Creating bucket...')
    
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('policy-documents', {
      public: false
    })
    
    if (createError) {
      console.error('Error creating bucket:', createError.message)
      
      // Check if it's a permission error
      if (createError.message.includes('permission') || createError.message.includes('Forbidden')) {
        console.error('\n⚠️  Permission denied! You need to:')
        console.error('   1. Go to: https://supabase.com/dashboard/project/zcqejeroailcmbltpzix/storage/buckets')
        console.error('   2. Click "New bucket"')
        console.error('   3. Name: policy-documents')
        console.error('   4. Public bucket: OFF (unchecked)')
        console.error('   5. Click Save')
      }
    } else {
      console.log('✅ Bucket created successfully!')
      console.log('Bucket details:', newBucket)
    }
    
  } catch (err) {
    console.error('Unexpected error:', err.message || err)
  }
}

main()