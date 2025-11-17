/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { copyImageUsingSelection, supportsClipboardImageCopy } from '../clipboard'

const ensureExecCommand = () => {
  if (typeof document.execCommand !== 'function') {
    Object.defineProperty(document, 'execCommand', {
      value: () => false,
      writable: true,
    })
  }
}

ensureExecCommand()

describe('supportsClipboardImageCopy', () => {
  it('returns true when clipboard APIs and secure context are available', () => {
    const clipboard = { write: vi.fn() }
    const result = supportsClipboardImageCopy({
      clipboard: clipboard as any,
      clipboardItemAvailable: true,
      isSecureContext: true,
    })

    expect(result).toBe(true)
  })

  it('returns false when clipboard write is missing', () => {
    const result = supportsClipboardImageCopy({
      clipboard: null,
      clipboardItemAvailable: true,
      isSecureContext: true,
    })

    expect(result).toBe(false)
  })
})

describe('copyImageUsingSelection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves when execCommand succeeds', async () => {
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    await expect(copyImageUsingSelection('data:image/png;base64,AAAA')).resolves.toBeUndefined()
    expect(execSpy).toHaveBeenCalledWith('copy')
  })

  it('rejects when execCommand fails', async () => {
    vi.spyOn(document, 'execCommand').mockReturnValue(false)
    await expect(copyImageUsingSelection('data:image/png;base64,AAAA')).rejects.toThrow('Legacy copy command failed')
  })
})

