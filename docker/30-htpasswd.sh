#!/bin/sh
# Generates /etc/nginx/.htpasswd from AUTH_USER / AUTH_PASSWORD env vars.
# Runs automatically via the nginx image's /docker-entrypoint.d hook.
set -eu

AUTH_USER="${AUTH_USER:-rider}"

if [ -z "${AUTH_PASSWORD:-}" ]; then
  AUTH_PASSWORD="$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | cut -c1-16)"
  echo >&2 "[auth] AUTH_PASSWORD not set; generated one-off password for user '${AUTH_USER}': ${AUTH_PASSWORD}"
  echo >&2 "[auth] set AUTH_USER/AUTH_PASSWORD env vars to use fixed credentials"
fi

printf '%s:%s\n' "$AUTH_USER" "$(openssl passwd -apr1 "$AUTH_PASSWORD")" > /etc/nginx/.htpasswd
chmod 640 /etc/nginx/.htpasswd
echo >&2 "[auth] basic auth enabled for user '${AUTH_USER}'"
