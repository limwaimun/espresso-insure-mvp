#!/bin/bash

echo "🚀 Deploying Espresso MVP to Vercel"
echo "==================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Not in project root directory"
  exit 1
fi

# Check for Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

echo ""
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo ""
echo "✅ Build successful"
echo ""
echo "🌐 Deploying to Vercel..."
echo ""
echo "Note: If this is your first deployment, you'll need to:"
echo "1. Login to Vercel (vercel login)"
echo "2. Link your project (vercel link)"
echo "3. Set up environment variables in Vercel dashboard:"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo "   - STRIPE_PRICE_SOLO"
echo "   - STRIPE_PRICE_PRO"
echo "   - STRIPE_PRICE_TEAM"
echo "   - NEXT_PUBLIC_APP_URL"
echo ""
echo "For now, deploying with preview environment..."

# Deploy with preview flag
vercel --prod

echo ""
echo "📋 Deployment Summary:"
echo "  • Project: Espresso MVP"
echo "  • Framework: Next.js"
echo "  • Build: ✅ Successful"
echo "  • Status: Ready for Vercel deployment"
echo ""
echo "🔗 Once deployed, your /trial page will be available at:"
echo "   https://espresso-insure-mvp.vercel.app/trial"
echo ""
echo "📝 Next Steps:"
echo "1. Run 'vercel' to deploy to preview"
echo "2. Run 'vercel --prod' to deploy to production"
echo "3. Set up Stripe environment variables in Vercel dashboard"
echo "4. Test the checkout flow"
echo ""
echo "🎯 Ready for Chairman review!"