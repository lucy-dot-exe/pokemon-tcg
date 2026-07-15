import { useState } from 'react'
import { useDeck } from './hooks/useDeck'
import { CardSearch } from './components/CardSearch'
import { DeckPanel } from './components/DeckPanel'
import { StatisticsPanel } from './components/StatisticsPanel'
import { ReviewPanel } from './components/ReviewPanel'
import type { Card } from './types/card'

type View = 'builder' | 'statistics' | 'review'

function App() {
  const deck = useDeck()
  const [view, setView] = useState<View>('builder')

  const handleAddCard = (card: Card) => {
    const result = deck.addCard(card)
    if (!result.ok && result.reason) {
      alert(result.reason)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pokemon TCG Deck Builder</h1>
        <nav className="app-nav">
          <button
            type="button"
            className={view === 'builder' ? 'app-nav-active' : ''}
            onClick={() => setView('builder')}
          >
            Deck Builder
          </button>
          <button
            type="button"
            className={view === 'statistics' ? 'app-nav-active' : ''}
            onClick={() => setView('statistics')}
          >
            Statistics
          </button>
          <button
            type="button"
            className={view === 'review' ? 'app-nav-active' : ''}
            onClick={() => setView('review')}
          >
            Review
          </button>
        </nav>
      </header>
      {view === 'builder' && (
        <main className="app-main">
          <CardSearch onAddCard={handleAddCard} copiesOf={deck.copiesOf} />
          <DeckPanel
            cards={deck.cards}
            totalCount={deck.totalCount}
            deckSize={deck.deckSize}
            onAdd={handleAddCard}
            onRemove={deck.removeCard}
            onClear={deck.clearDeck}
            onImport={deck.importDeck}
          />
        </main>
      )}
      {view === 'statistics' && (
        <main className="app-main app-main-single">
          <StatisticsPanel cards={deck.cards} />
        </main>
      )}
      {view === 'review' && (
        <main className="app-main app-main-single">
          <ReviewPanel cards={deck.cards} />
        </main>
      )}
    </div>
  )
}

export default App
