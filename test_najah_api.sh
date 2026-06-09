#!/bin/bash

# ============================================================
# Najah News API Test Script
# سكريبت اختبار API موقع النجاح
# ============================================================

echo "🧪 Testing Najah News API (nn.najah.edu)"
echo "========================================"
echo ""

# API Configuration
API_URL="https://nn.najah.edu/api/v1/news/article/"
TOKEN="<NAJAH_API_TOKEN>"  # ضع التوكن الحقيقي هنا (لا ترفعه على git)

# Test Article Data
TITLE="اختبار من نظام إدارة الأخبار"
CATEGORY_ID="12"
CONTENT="<p>هذا خبر تجريبي من نظام إدارة المركز الإعلامي. يتم اختبار API موقع النجاح.</p>"
KEYWORDS="اختبار,تطوير,api"

echo "📡 Sending test article..."
echo "Title: $TITLE"
echo "Category: $CATEGORY_ID"
echo ""

# Send POST request
response=$(curl -s -X POST \
  -H "Authorization: Token $TOKEN" \
  -H "Accept: application/json" \
  -F "title=$TITLE" \
  -F "category_id=$CATEGORY_ID" \
  -F "content=$CONTENT" \
  -F "keywords=$KEYWORDS" \
  -F "auto_publish=false" \
  -F "pin=0" \
  "$API_URL")

# Parse response
echo "📋 Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Check if successful
if echo "$response" | grep -q '"id"'; then
  echo "✅ Test SUCCESSFUL!"
  echo "Article created as draft (auto_publish=false)"
  
  # Extract article ID
  article_id=$(echo "$response" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
  if [ -n "$article_id" ]; then
    echo "📝 Article ID: $article_id"
    echo "🔗 View at: https://nn.najah.edu/admin (if you have access)"
  fi
else
  echo "❌ Test FAILED!"
  echo "Check the response above for errors"
fi

echo ""
echo "========================================"
echo "💡 Tip: To test with auto_publish=true, change the parameter in the script"
