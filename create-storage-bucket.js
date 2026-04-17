import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.test
config({ path: '.env.test' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
console.log('Supabase Key:', supabaseKey ? '✓ Set (first 10 chars): ' + supabaseKey.substring(0, 10) + '...' : '✗ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndCreateBucket() {
  try {
    console.log('\n1. Checking if "policy-documents" bucket exists...')
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError.message)
      console.error('Full error:', listError)
      return
    }
    
    console.log(`Found ${buckets.length} buckets:`)
    buckets.forEach(bucket => console.log(`  - ${bucket.name} (public: ${bucket.public}, id: ${bucket.id})`))
    
    // Check if our bucket exists
    const policyBucket = buckets.find(b => b.name === 'policy-documents')
    
    if (policyBucket) {
      console.log('\n✅ "policy-documents" bucket already exists!')
      console.log(`   ID: ${policyBucket.id}`)
      console.log(`   Public: ${policyBucket.public}`)
      console.log(`   Created: ${policyBucket.created_at}`)
    } else {
      console.log('\n❌ "policy-documents" bucket does not exist')
      console.log('Creating bucket...')
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('policy-documents', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
      })
      
      if (createError) {
        console.error('Error creating bucket:', createError.message)
        console.error('Full error:', createError)
        
        // Try without optional parameters
        console.log('\nTrying without optional parameters...')
        const { data: newBucket2, error: createError2 } = await supabase.storage.createBucket('policy-documents', {
          public: false
        })
        
        if (createError2) {
          console.error('Still failed:', createError2.message)
        } else {
          console.log('✅ Bucket created successfully (simple version):', newBucket2)
        }
      } else {
        console.log('✅ Bucket created successfully:', newBucket)
      }
    }
    
    // Test if we can upload a file
    console.log('\n2. Testing bucket access...')
    const testFileName = 'test-access.txt'
    const testContent = 'Test file to verify bucket access'
    
    const { error: uploadError } = await supabase.storage
      .from('policy-documents')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload test failed:', uploadError.message)
    } else {
      console.log('✅ Upload test successful')
      
      // Clean up test file
      await supabase.storage
        .from('policy-documents')
        .remove([testFileName])
      console.log('✅ Test file cleaned up')
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

checkAndCreateBucket()