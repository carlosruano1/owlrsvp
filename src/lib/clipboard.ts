'use client'

interface ClipboardSupportOptions {
  clipboard?: Pick<Navigator['clipboard'], 'write'> | null
  clipboardItemAvailable?: boolean
  isSecureContext?: boolean
}

export function supportsClipboardImageCopy(options: ClipboardSupportOptions = {}): boolean {
  const clipboard = options.clipboard ?? (typeof navigator !== 'undefined' ? navigator.clipboard : undefined)
  const hasClipboardWrite = !!(clipboard && typeof clipboard.write === 'function')

  const clipboardItemAvailable =
    options.clipboardItemAvailable ??
    (typeof window !== 'undefined' ? typeof (window as Window & typeof globalThis & { ClipboardItem?: unknown }).ClipboardItem !== 'undefined' : false)

  const secureContext =
    options.isSecureContext ?? (typeof window !== 'undefined' ? window.isSecureContext : false)

  return Boolean(hasClipboardWrite && clipboardItemAvailable && secureContext)
}

export async function copyImageUsingSelection(imageSrc: string): Promise<void> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    throw new Error('Clipboard not available in this environment')
  }

  const selection = window.getSelection()

  if (!selection) {
    throw new Error('Selection API not available')
  }

  if (typeof document.execCommand !== 'function') {
    throw new Error('Legacy copy command is not supported')
  }

  const tempContainer = document.createElement('div')
  tempContainer.contentEditable = 'true'
  tempContainer.style.position = 'fixed'
  tempContainer.style.left = '-9999px'
  tempContainer.style.opacity = '0'
  tempContainer.style.pointerEvents = 'none'

  const img = document.createElement('img')
  img.src = imageSrc
  img.alt = 'QR code'
  tempContainer.appendChild(img)

  document.body.appendChild(tempContainer)

  const range = document.createRange()
  range.selectNodeContents(tempContainer)
  selection.removeAllRanges()
  selection.addRange(range)

  const successful = document.execCommand('copy')

  selection.removeAllRanges()
  document.body.removeChild(tempContainer)

  if (!successful) {
    throw new Error('Legacy copy command failed')
  }
}

