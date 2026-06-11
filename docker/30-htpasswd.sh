#!/bin/sh
# Writes /etc/nginx/auth-gate.conf at container start.
#
# Default: the blog is PUBLIC (empty auth-gate.conf).
# Set AUTH_PASSWORD (and optionally AUTH_USER, default "rider") to gate the
# whole site behind HTTP Basic Auth.
#
# Runs automatically via the nginx image's /docker-entrypoint.d hook.
set -eu

GATE=/etc/nginx/auth-gate.conf

if [ -z "${AUTH_PASSWORD:-}" ]; then
  printf '# public site: AUTH_PASSWORD not set\n' > "$GATE"
  echo >&2 "[auth] AUTH_PASSWORD not set; serving the blog publicly"
  exit 0
fi

AUTH_USER="${AUTH_USER:-rider}"

printf '%s:%s\n' "$AUTH_USER" "$(openssl passwd -apr1 "$AUTH_PASSWORD")" > /etc/nginx/.htpasswd
chmod 640 /etc/nginx/.htpasswd

cat > "$GATE" <<'CONF'
auth_basic "Hiep Lam Rides";
auth_basic_user_file /etc/nginx/.htpasswd;
CONF

echo >&2 "[auth] basic auth enabled for user '${AUTH_USER}'"
