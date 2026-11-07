#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3001}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/mvg-supabase-auth-cookies.txt}"
EMAIL="mvg-auth-$(date +%s)@gmail.com"
PASSWORD='StrongPass123!'

cleanup() {
  local sql="DELETE FROM public.users WHERE email = '${EMAIL}'; DELETE FROM auth.users WHERE email = '${EMAIL}';"
  printf '%s\n' "$sql" | npx prisma db execute --stdin --schema backend/prisma/schema.prisma >/dev/null 2>&1 || true
}
trap cleanup EXIT

register_status=$(curl -sS -o /tmp/mvg-auth-register.json -w '%{http_code}' -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Supabase Auth Smoke\"}" \
  "$BASE_URL/api/auth/register")
printf 'REGISTER_STATUS=%s BODY=' "$register_status"
cat /tmp/mvg-auth-register.json
printf '\n'

# The project intentionally requires email confirmation. Confirm only this disposable test user directly.
printf "UPDATE auth.users SET email_confirmed_at = now() WHERE email = '%s';\n" "$EMAIL" | npx prisma db execute --stdin --schema backend/prisma/schema.prisma >/dev/null

login_status=$(curl -sS -o /tmp/mvg-auth-login.json -w '%{http_code}' -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/login")
printf 'LOGIN_STATUS=%s BODY=' "$login_status"
cat /tmp/mvg-auth-login.json
printf '\n'

me=$(curl -fsS -b "$COOKIE_JAR" "$BASE_URL/api/auth/me")
printf 'ME=%s\n' "$me"

logout=$(curl -fsS -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/logout")
printf 'LOGOUT=%s\n' "$logout"

status_after_logout=$(curl -sS -o /tmp/mvg-auth-me-after-logout.json -w '%{http_code}' -b "$COOKIE_JAR" "$BASE_URL/api/auth/me")
printf 'ME_AFTER_LOGOUT_STATUS=%s BODY=' "$status_after_logout"
cat /tmp/mvg-auth-me-after-logout.json
printf '\n'

[[ "$register_status" == "202" || "$register_status" == "201" ]]
[[ "$login_status" == "200" ]]
[[ "$status_after_logout" == "401" ]]
