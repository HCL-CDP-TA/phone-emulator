#!/bin/bash

# Remote SMS Test Script
# Tests sending SMS to a phone number from external system

set -e

BASE_URL="${1:-http://localhost:3000}"
PHONE_NUMBER="${2:-+12345678901}"

echo "🧪 Testing Remote SMS Delivery"
echo "================================"
echo "Target: $BASE_URL"
echo "Phone: $PHONE_NUMBER"
echo ""

# Test 1: Send simple message
echo "📤 Test 1: Simple message"
curl -s -X POST "$BASE_URL/api/sms" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE_NUMBER\",\"sender\":\"Test System\",\"message\":\"Hello from remote test!\"}" | jq

echo ""
echo "✅ Message sent! Check the phone emulator."
echo ""

# Test 2: Send message with link
echo "📤 Test 2: Message with link"
curl -s -X POST "$BASE_URL/api/sms" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE_NUMBER\",\"sender\":\"Acme Corp\",\"message\":\"Check out our offer: https://example.com/promo?utm_source=sms\"}" | jq

echo ""
echo "✅ Message with link sent!"
echo ""

# Test 3: Send marketing message
echo "📤 Test 3: Marketing message"
curl -s -X POST "$BASE_URL/api/sms" \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$PHONE_NUMBER\",\"sender\":\"YourBrand\",\"message\":\"🎉 Flash Sale! 50% off everything. Shop now: https://store.example.com/sale\"}" | jq

echo ""
echo "✅ Marketing message sent!"
echo ""

# Test 4: Poll for messages (simulating what phone does)
echo "📥 Test 4: Polling for messages"
curl -s "$BASE_URL/api/sms/poll?phoneNumber=$PHONE_NUMBER&since=0" | jq

echo ""
echo "✅ Poll successful!"
echo ""

echo "================================"
echo "🎉 All tests complete!"
echo ""
echo "Usage: $0 [BASE_URL] [PHONE_NUMBER]"
echo "Example: $0 http://localhost:3000 +12345678901"
