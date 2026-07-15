import { useState } from 'react'
import type { Card, DeckCard } from '../types/card'
import { formatDeckList, parseDeckList } from '../lib/deckList'
import { resolveDeckList, type ImportIssue } from '../lib/deckImport'
import { readClipboardText, writeClipboardText } from '../lib/clipboard'
import { CardTile } from './CardTile'

interface DeckPanelProps {
  cards: DeckCard[]
  totalCount: number
  deckSize: number
  onAdd: (card: Card) => void
  onRemove: (cardId: string) => void
  onClear: () => void
  onImport: (cards: DeckCard[]) => void
}

const GROUP_ORDER = ['Pokémon', 'Trainer', 'Energy'] as const

function groupBySupertype(cards: DeckCard[]) {
  const groups = new Map<string, DeckCard[]>()
  for (const dc of cards) {
    const key = dc.card.supertype
    const list = groups.get(key) ?? []
    list.push(dc)
    groups.set(key, list)
  }
  return groups
}

export function DeckPanel({ cards, totalCount, deckSize, onAdd, onRemove, onClear, onImport }: DeckPanelProps) {
  const groups = groupBySupertype(cards)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{ completed: number; total: number } | null>(null)
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [exportFallbackText, setExportFallbackText] = useState<string | null>(null)

  const handleExport = async () => {
    const text = formatDeckList(cards)
    setExportFallbackText(null)
    try {
      await writeClipboardText(text)
      setExportStatus('Deck list copied to clipboard.')
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : 'Failed to copy deck list to clipboard.')
      setExportFallbackText(text)
    }
  }

  const runImport = async () => {
    setConfirmingImport(false)
    setImporting(true)
    setImportIssues([])
    setImportError(null)
    try {
      const text = await readClipboardText()
      const { lines, unparsedLines } = parseDeckList(text)
      setImportProgress({ completed: 0, total: lines.length })
      const { cards: resolvedCards, issues } = await resolveDeckList(lines, {
        onProgress: (completed, total) => setImportProgress({ completed, total }),
      })
      onImport(resolvedCards)
      setImportIssues([
        ...unparsedLines.map((raw) => ({ raw, reason: "Couldn't parse this line." })),
        ...issues,
      ])
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import a deck list from the clipboard.')
    } finally {
      setImporting(false)
      setImportProgress(null)
    }
  }

  const handleImportClick = () => {
    if (cards.length > 0) {
      setConfirmingImport(true)
      return
    }
    void runImport()
  }

  return (
    <section className="deck-panel">
      <div className="deck-panel-header">
        <h2>
          Your deck ({totalCount}/{deckSize})
        </h2>
        <div className="deck-panel-actions">
          <button type="button" onClick={handleImportClick} disabled={importing}>
            {importing
              ? importProgress
                ? `Importing ${importProgress.completed}/${importProgress.total}…`
                : 'Importing…'
              : 'Import'}
          </button>
          <button type="button" onClick={handleExport} disabled={cards.length === 0}>
            Copy list
          </button>
          <button type="button" onClick={onClear} disabled={cards.length === 0}>
            Clear
          </button>
        </div>
      </div>

      {confirmingImport && (
        <div className="inline-confirm">
          <span>Importing will replace your current deck.</span>
          <div className="inline-confirm-actions">
            <button type="button" onClick={() => void runImport()}>
              Replace deck
            </button>
            <button type="button" onClick={() => setConfirmingImport(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {exportStatus && (
        <p className={exportFallbackText ? 'status-text status-error' : 'status-text'}>
          {exportStatus}
          <button type="button" className="dismiss-inline" onClick={() => setExportStatus(null)} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}

      {exportFallbackText && (
        <textarea
          className="export-fallback"
          readOnly
          value={exportFallbackText}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Deck list text to copy manually"
        />
      )}

      {importError && (
        <p className="status-text status-error">
          {importError}
          <button type="button" className="dismiss-inline" onClick={() => setImportError(null)} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}

      {importProgress && (
        <div
          className="import-progress-track"
          role="progressbar"
          aria-valuenow={importProgress.completed}
          aria-valuemin={0}
          aria-valuemax={importProgress.total}
        >
          <div
            className="import-progress-fill"
            style={{ width: `${(importProgress.completed / Math.max(importProgress.total, 1)) * 100}%` }}
          />
        </div>
      )}

      {importIssues.length > 0 && (
        <div className="import-issues">
          <div className="import-issues-header">
            <span>
              {importIssues.length} line{importIssues.length === 1 ? '' : 's'} couldn't be imported
            </span>
            <button type="button" onClick={() => setImportIssues([])} aria-label="Dismiss import issues">
              ×
            </button>
          </div>
          <ul>
            {importIssues.map((issue) => (
              <li key={issue.raw}>
                <code>{issue.raw}</code> — {issue.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cards.length === 0 && <p className="status-text">Search for cards and add them to your deck.</p>}

      {GROUP_ORDER.map((supertype) => {
        const group = groups.get(supertype)
        if (!group || group.length === 0) return null
        const groupCount = group.reduce((sum, dc) => sum + dc.count, 0)
        return (
          <div key={supertype} className="deck-group">
            <h3>
              {supertype} ({groupCount})
            </h3>
            <div className="card-grid">
              {group.map((dc) => (
                <CardTile
                  key={dc.card.id}
                  card={dc.card}
                  count={dc.count}
                  onAdd={onAdd}
                  onRemove={() => onRemove(dc.card.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
