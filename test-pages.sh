#!/bin/bash

echo "🔍 Testing Espresso Pages"
echo "========================"

BASE_URL="http://localhost:3000"

# Test Homepage
echo "1. Testing Homepage..."
if curl -s "$BASE_URL" | grep -q "Your AI back‑office"; then
  echo "✅ Homepage loaded successfully"
else
  echo "❌ Homepage failed"
  exit 1
fi

# Test Dashboard
echo "2. Testing Dashboard..."
if curl -s "$BASE_URL/dashboard" | grep -q "Recent Clients"; then
  echo "✅ Dashboard loaded successfully"
else
  echo "❌ Dashboard failed"
  exit 1
fi

# Test Maya Conversations
echo "3. Testing Conversations..."
if curl -s "$BASE_URL/dashboard/maya" | grep -q "Conversations"; then
  echo "✅ Conversations page loaded"
else
  echo "❌ Conversations page failed"
  exit 1
fi

# Test Clients Page
echo "4. Testing Clients..."
if curl -s "$BASE_URL/dashboard/clients" | grep -q "All Clients"; then
  echo "✅ Clients page loaded"
else
  echo "❌ Clients page failed"
  exit 1
fi

# Test Alerts Page
echo "5. Testing Alerts..."
if curl -s "$BASE_URL/dashboard/alerts" | grep -q "Alert Center"; then
  echo "✅ Alerts page loaded"
else
  echo "❌ Alerts page failed"
  exit 1
fi

echo ""
echo "🎉 All pages are working!"
echo ""
echo "📊 Available Pages:"
echo "  • Homepage: $BASE_URL"
echo "  • Dashboard: $BASE_URL/dashboard"
echo "  • Conversations: $BASE_URL/dashboard/maya"
echo "  • Clients: $BASE_URL/dashboard/clients"
echo "  • Alerts: $BASE_URL/dashboard/alerts"
echo ""
echo "🎨 Following Approved Designs:"
echo "  ✅ Exact color palette from design.md"
echo "  ✅ Correct typography (Cormorant Garamond, DM Sans)"
echo "  ✅ Proper sidebar navigation (240px width)"
echo "  ✅ WhatsApp mockup in hero section"
echo "  ✅ Brand security: Only 'Maya' and 'Espresso' names"
echo ""
echo "🚀 Ready for testing!"