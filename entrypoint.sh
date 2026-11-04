#!/bin/sh

set -e

HTML_ROOT=/usr/share/nginx/html

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
    rm -rf "$HTML_ROOT/$URL_PREFIX_DIR"
    ln -s "$HTML_ROOT/uidev" "$HTML_ROOT/$URL_PREFIX_DIR"
fi

# ---------------------------------------------------------------------------
# Runtime API config.
#
# The bundle is a static Nuxt build: runtimeConfig.public.apiBase is baked in
# at build time (NUXT_PUBLIC_API_BASE, default /apidev). API_BASE overrides it
# per container: it is written to <URL_PREFIX>config.js, which index.html loads
# before the app entry (see nuxt.config.ts and utils/apiConfig.ts). Only keys
# that are set are emitted, so an absent key means "use the build-time value".
#
# A value must be a same-origin path (/cogapi) or an absolute http(s) URL,
# reachable from the browser. Trailing slashes are stripped because the client
# concatenates "${apiBase}/models". Anything else is reported and ignored.
#
# API_RUNS (Kubeflow Pipelines v2beta1 base) is plumbed the same way and may be
# a same-origin path (/pipeline/apis/v2beta1, the build default) or an
# absolute http(s) URL.
# ---------------------------------------------------------------------------

# normalise_url NAME VALUE -> prints the canonical value, or nothing if invalid.
normalise_url() {
    _name="$1"
    _value=$(printf '%s' "$2" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's,/*$,,')
    if [ -z "$_value" ]; then
        return 0
    fi
    # Reject characters that would break the JSON/JS we emit or the URL itself.
    # grep sees a newline as a record separator, not a character, so embedded
    # line breaks are checked separately: one would end the JS string literal.
    if [ "$(printf '%s' "$_value" | wc -l)" -ne 0 ] \
        || printf '%s' "$_value" | grep -q '["\\[:space:][:cntrl:]]'; then
        echo "WARNING: $_name contains invalid characters; ignoring it" >&2
        return 0
    fi
    case "$_value" in
        /*|http://*|https://*)
            printf '%s' "$_value"
            ;;
        *)
            echo "WARNING: $_name must be a path starting with '/' or an http(s) URL (got '$2'); ignoring it" >&2
            ;;
    esac
}

if [ -n "$API_URL" ]; then
    # Pre-runtime-config charms pass the cluster-internal API URL here. It was
    # never reachable from the browser, so it is not honoured; use API_BASE.
    echo "WARNING: API_URL is not supported and is ignored; set API_BASE to the browser-facing API path" >&2
fi

API_BASE=$(normalise_url API_BASE "${API_BASE:-}")
API_RUNS=$(normalise_url API_RUNS "${API_RUNS:-}")

CONFIG_JSON=""
if [ -n "$API_BASE" ]; then
    CONFIG_JSON="\"apiBase\":\"$API_BASE\""
fi
if [ -n "$API_RUNS" ]; then
    CONFIG_JSON="${CONFIG_JSON:+$CONFIG_JSON,}\"apiRuns\":\"$API_RUNS\""
fi

# Always written, so a stale file from an earlier start can never survive.
printf 'window.__COGUI_CONFIG__ = {%s};\n' "$CONFIG_JSON" > "$HTML_ROOT/uidev/config.js"
echo "Runtime API config: $(cat "$HTML_ROOT/uidev/config.js")"

export URL_PREFIX
export URL_PREFIX_NO_TRAIL

# Only these two placeholders are substituted; nginx's own $variables stay intact.
envsubst '${URL_PREFIX} ${URL_PREFIX_NO_TRAIL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g 'daemon off;'
