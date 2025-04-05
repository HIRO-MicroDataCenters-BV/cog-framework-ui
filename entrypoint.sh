#!/bin/sh

set -e

if [ -z "$API_URL" ]; then
    # If API_URL is not set, copy the configuration without proxy_pass
    cp /etc/nginx/templates/no_proxy.conf /etc/nginx/conf.d/default.conf
else
    # If API_URL is set, generate the configuration with proxy_pass
    envsubst '${API_URL}' < /etc/nginx/templates/proxy.conf.template > /etc/nginx/conf.d/default.conf
fi

# Start Nginx
nginx -g 'daemon off;'
