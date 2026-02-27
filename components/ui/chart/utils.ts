import { isClient } from '@vueuse/core';
import { useId } from 'reka-ui';
import { h, render } from 'vue';
import type { ChartConfig } from '.';

// Simple cache using a Map to store serialized object keys
const cache = new Map<string, string>();

// Convert object to a consistent string key
function serializeKey(key: Record<string, unknown>): string {
  return JSON.stringify(key, Object.keys(key).sort());
}

interface Constructor<P = unknown> {
  __isFragment?: never;
  __isTeleport?: never;
  __isSuspense?: never;
  new (...args: unknown[]): {
    $props: P;
  };
}

export function componentToString<P>(
  config: ChartConfig,
  component: Constructor<P>,
  props?: P,
) {
  if (!isClient) return;

  // This function will be called once during mount lifecycle
  const id = useId();

  // https://unovis.dev/docs/auxiliary/Crosshair#component-props
  return (_data: unknown, x: number | Date) => {
    const rawData: Record<string, unknown> =
      typeof _data === 'object' && _data !== null && 'data' in _data
        ? ((
            _data as {
              data: Record<string, unknown>;
            }
          ).data as Record<string, unknown>)
        : {};

    const serializedKey = `${id}-${serializeKey(rawData)}`;
    const cachedContent = cache.get(serializedKey);
    if (cachedContent) return cachedContent;

    const vnode = h<unknown>(component, {
      ...props,
      payload: rawData,
      config,
      x,
    });
    const div = document.createElement('div');
    render(vnode, div);
    cache.set(serializedKey, div.innerHTML);
    return div.innerHTML;
  };
}
