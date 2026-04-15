#!/bin/sh

set -e

# Normalize URL prefix so both Nuxt and Nginx agree.
URL_PREFIX="${URL_PREFIX:-/uidev/}"
case "$URL_PREFIX" in
  /*) ;;
  *) URL_PREFIX="/$URL_PREFIX" ;;
esac
case "$URL_PREFIX" in
  */) ;;
  *) URL_PREFIX="$URL_PREFIX/" ;;
esac

URL_PREFIX_NO_TRAIL="${URL_PREFIX%/}"
URL_PREFIX_DIR="${URL_PREFIX#/}"
URL_PREFIX_DIR="${URL_PREFIX_DIR%/}"

# Build output is copied to /uidev at image build-time.
# If URL_PREFIX changes (for example /uiprod/), expose the same files under that path.
if [ -n "$URL_PREFIX_DIR" ] && [ "$URL_PREFIX_DIR" != "uidev" ]; then
    rm -rf "/usr/share/nginx/html/$URL_PREFIX_DIR"
    ln -s /usr/share/nginx/html/uidev "/usr/share/nginx/html/$URL_PREFIX_DIR"
fi

export URL_PREFIX
export URL_PREFIX_NO_TRAIL

if [ -z "$API_URL" ]; then
    # If API_URL is not set, generate the configuration without proxy_pass
    envsubst '${URL_PREFIX} ${URL_PREFIX_NO_TRAIL}' < /etc/nginx/templates/no_proxy.conf.template > /etc/nginx/conf.d/default.conf
else
    # If API_URL is set, generate the configuration with proxy_pass
    envsubst '${API_URL} ${URL_PREFIX} ${URL_PREFIX_NO_TRAIL}' < /etc/nginx/templates/proxy.conf.template > /etc/nginx/conf.d/default.conf
fi

# Start Nginx
nginx -g 'daemon off;'
