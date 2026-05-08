import { describe, it, expect, vi, beforeAll } from 'vitest';

// `defineI18nConfig` is a Nuxt auto-imported helper that just returns the
// loader factory. Stub it so we can import the config file outside of Nuxt.
beforeAll(() => {
  vi.stubGlobal(
    'defineI18nConfig',
    (loader: () => unknown) => loader as unknown,
  );
});

describe('i18n zod error templates', () => {
  it("too_small.string.inclusive uses {minimum} (Zod's actual param name) so the count renders", async () => {
    const factory = (await import('~/i18n/i18n.config'))
      .default as unknown as () => {
      messages: {
        en: {
          zodI18n: {
            errors: {
              too_small: { string: { inclusive: string } };
            };
          };
        };
      };
    };
    const config = factory();
    const template =
      config.messages.en.zodI18n.errors.too_small.string.inclusive;

    // Zod's `too_small` issue exposes the threshold as `minimum`, not `min`.
    // Using the wrong placeholder leaves the literal "characters" with no number.
    expect(template).toContain('{minimum}');
    expect(template).not.toContain('{min}');
  });
});
