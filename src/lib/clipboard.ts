/**
 * Proactively checks clipboard permission where the browser supports querying
 * it (Chrome/Edge), so a blocked permission surfaces a clear message instead
 * of a generic failure. Browsers without 'clipboard-read'/'clipboard-write'
 * as a queryable permission (Firefox, Safari) fall through silently — the
 * clipboard call itself still prompts or fails there.
 */
async function ensureClipboardPermission(name: 'clipboard-read' | 'clipboard-write'): Promise<void> {
  if (!navigator.permissions?.query) return

  let status: PermissionStatus
  try {
    status = await navigator.permissions.query({ name } as unknown as PermissionDescriptor)
  } catch {
    return
  }

  if (status.state === 'denied') {
    throw new Error(
      `Clipboard access is blocked. Allow clipboard permissions for this site in your browser settings and try again.`,
    )
  }
}

export async function readClipboardText(): Promise<string> {
  await ensureClipboardPermission('clipboard-read')
  return navigator.clipboard.readText()
}

export async function writeClipboardText(text: string): Promise<void> {
  await ensureClipboardPermission('clipboard-write')
  return navigator.clipboard.writeText(text)
}
