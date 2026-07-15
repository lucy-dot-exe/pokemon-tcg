import { useDeck } from './hooks/useDeck'
import { CardSearch } from './components/CardSearch'
import { DeckPanel } from './components/DeckPanel'
import type { Card } from './types/card'

function App() {
  const deck = useDeck()

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
      </header>
      <main className="app-main">
        <CardSearch onAddCard={handleAddCard} copiesOf={deck.copiesOf} />
        <DeckPanel
          cards={deck.cards}
          totalCount={deck.totalCount}
          deckSize={deck.deckSize}
          onRemove={deck.removeCard}
          onClear={deck.clearDeck}
        />
      </main>
    </div>
  )
}

export default App
