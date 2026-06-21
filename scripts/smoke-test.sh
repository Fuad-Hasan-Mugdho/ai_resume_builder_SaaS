#!/usr/bin/env sh
set -eu

API="${API_URL:-http://localhost:4000/api}"
EMAIL="smoke-$(date +%s)@resumeai.local"
PASSWORD="SmokePass123!"

echo "Checking health..."
curl -fsS "$API/health" >/dev/null

echo "Registering test user..."
REGISTER=$(curl -fsS -H 'Content-Type: application/json' -d "{\"name\":\"Smoke User\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "$API/auth/register")
TOKEN=$(printf '%s' "$REGISTER" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
test -n "$TOKEN"

AUTH="Authorization: Bearer $TOKEN"
echo "Checking dashboard and templates..."
curl -fsS -H "$AUTH" "$API/dashboard" >/dev/null
curl -fsS "$API/templates" >/dev/null

echo "Creating resume..."
RESUME=$(curl -fsS -H "$AUTH" -H 'Content-Type: application/json' -d '{"title":"Smoke Resume","resumeDataJson":{"summary":"Engineer","skills":["TypeScript"]}}' "$API/resumes")
RESUME_ID=$(printf '%s' "$RESUME" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
test -n "$RESUME_ID"

echo "Submitting manual ৳20 payment..."
TRX="SMOKE$(date +%s)"
PAYMENT=$(curl -fsS -H "$AUTH" -H 'Content-Type: application/json' -d "{\"resumeId\":\"$RESUME_ID\",\"provider\":\"BKASH\",\"senderNumber\":\"01700000000\",\"transactionId\":\"$TRX\"}" "$API/payments/manual")
PAYMENT_ID=$(printf '%s' "$PAYMENT" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
test -n "$PAYMENT_ID"

echo "Approving payment as admin..."
ADMIN=$(curl -fsS -H 'Content-Type: application/json' -d '{"email":"admin@resumeai.local","password":"ResumeAI-Admin-2026"}' "$API/auth/login")
ADMIN_TOKEN=$(printf '%s' "$ADMIN" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
test -n "$ADMIN_TOKEN"
curl -fsS -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d '{"status":"APPROVED"}' "$API/admin/manual-payments/$PAYMENT_ID" >/dev/null

echo "Authorizing paid PDF export..."
curl -fsS -X POST -H "$AUTH" "$API/resumes/$RESUME_ID/export-authorize" >/dev/null
echo "Confirming repeat download during active access..."
curl -fsS -X POST -H "$AUTH" "$API/resumes/$RESUME_ID/export-authorize" >/dev/null

echo "Checking local ATS engine..."
curl -fsS -H "$AUTH" -H 'Content-Type: application/json' -d '{"resumeText":"Summary skills TypeScript experience education projects","jobDescription":"TypeScript NestJS PostgreSQL API development"}' "$API/ai/ats-check" >/dev/null

echo "Deleting test resume..."
curl -fsS -X DELETE -H "$AUTH" "$API/resumes/$RESUME_ID" >/dev/null
echo "Smoke test passed."
