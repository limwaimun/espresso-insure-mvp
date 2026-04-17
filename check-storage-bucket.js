import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndCreateBucket() {
  try {
    console.log('Checking if "policy-documents" bucket exists...')
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError.message)
      return
    }
    
    console.log(`Found ${buckets.length} buckets:`)
    buckets.forEach(bucket => console.log(`  - ${bucket.name} (public: ${bucket.public})`))
    
    // Check if our bucket exists
    const policyBucket = buckets.find(b => b.name === 'policy-documents')
    
    if (policyBucket) {
      console.log('✅ "policy-documents" bucket already exists')
      console.log(`   ID: ${policyBucket.id}, Public: ${policyBucket.public}`)
    } else {
      console.log('❌ "policy-documents" bucket does not exist')
      console.log('Creating bucket...')
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('policy-documents', {
        public: false
      })
      
      if (createError) {
        console.error('Error creating bucket:', createError.message)
      } else {
        console.log('✅ Bucket created successfully:', newBucket)
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkAndCreateBucket()