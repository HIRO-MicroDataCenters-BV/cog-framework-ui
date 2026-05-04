import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToaster } from '~/composables/toaster';

const successMock = vi.fn();
const errorMock = vi.fn();
const warningMock = vi.fn();
const infoMock = vi.fn();

vi.mock('vue-sonner', () => ({
  toast: {
    success: (...args: unknown[]) => successMock(...args),
    error: (...args: unknown[]) => errorMock(...args),
    warning: (...args: unknown[]) => warningMock(...args),
    info: (...args: unknown[]) => infoMock(...args),
  },
}));

describe('useToaster — default i18n behaviour', () => {
  beforeEach(() => {
    successMock.mockReset();
    errorMock.mockReset();
    warningMock.mockReset();
    infoMock.mockReset();
  });

  it('passes the message through t() with the type-prefixed key', () => {
    const { show } = useToaster();
    show('success', 'operation_completed');
    expect(successMock).toHaveBeenCalledWith(
      'message.success.operation_completed',
      expect.objectContaining({ duration: 3000 }),
    );
  });

  it('routes each toast type to the matching vue-sonner method', () => {
    const { show } = useToaster();
    show('success', 'k1');
    show('error', 'k2');
    show('warning', 'k3');
    show('info', 'k4');
    expect(successMock).toHaveBeenCalledWith(
      'message.success.k1',
      expect.any(Object),
    );
    expect(errorMock).toHaveBeenCalledWith(
      'message.error.k2',
      expect.any(Object),
    );
    expect(warningMock).toHaveBeenCalledWith(
      'message.warning.k3',
      expect.any(Object),
    );
    expect(infoMock).toHaveBeenCalledWith(
      'message.info.k4',
      expect.any(Object),
    );
  });

  it('forwards data params for i18n interpolation (the global t mock returns key:name)', () => {
    const { show } = useToaster();
    show('success', 'dataset_added', { name: 'foo' });
    expect(successMock).toHaveBeenCalledWith(
      'message.success.dataset_added:foo',
      expect.objectContaining({ duration: 3000, name: 'foo' }),
    );
  });
});

describe('useToaster — raw mode (opts.raw)', () => {
  beforeEach(() => {
    successMock.mockReset();
    errorMock.mockReset();
  });

  it('uses the message verbatim and skips the i18n key lookup', () => {
    const { show } = useToaster();
    const apiMessage = 'Model serving request initiated successfully.';
    show('success', apiMessage, undefined, { raw: true });
    expect(successMock).toHaveBeenCalledWith(
      apiMessage,
      expect.objectContaining({ duration: 3000 }),
    );
    expect(successMock).not.toHaveBeenCalledWith(
      expect.stringContaining('message.success.'),
      expect.anything(),
    );
  });

  it('also works for error toasts', () => {
    const { show } = useToaster();
    show('error', 'Server-supplied error string', undefined, { raw: true });
    expect(errorMock).toHaveBeenCalledWith(
      'Server-supplied error string',
      expect.objectContaining({ duration: 3000 }),
    );
  });

  it('still passes data through to the toast options when raw', () => {
    const { show } = useToaster();
    show('success', 'My raw message', { traceId: 'abc-123' }, { raw: true });
    expect(successMock).toHaveBeenCalledWith(
      'My raw message',
      expect.objectContaining({ duration: 3000, traceId: 'abc-123' }),
    );
  });

  it('falls back to i18n when raw is not set (backward compatibility)', () => {
    const { show } = useToaster();
    show('success', 'operation_completed', undefined, {});
    expect(successMock).toHaveBeenCalledWith(
      'message.success.operation_completed',
      expect.any(Object),
    );
  });

  it('falls back to i18n when raw is explicitly false', () => {
    const { show } = useToaster();
    show('success', 'operation_completed', undefined, { raw: false });
    expect(successMock).toHaveBeenCalledWith(
      'message.success.operation_completed',
      expect.any(Object),
    );
  });
});
