import { useEffect, useMemo, useRef, useState } from 'react'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import type { CardInteractionResult } from '../lib/cardInteractions'
import type { DeckCard, Supertype } from '../types/card'

interface UnifiedInteractionGraphProps {
  interactions: CardInteractionResult[]
  cards: DeckCard[]
  onCardClick?: (name: string) => void
}

interface SimNode extends SimulationNodeDatum {
  id: string
  isHub: boolean
  isConnected: boolean
  imageUrl?: string
  supertype?: Supertype
}

type SimLink = SimulationLinkDatum<SimNode>

interface Edge {
  from: string
  to: string
}

const SUPERTYPE_RING_CLASS: Record<Supertype, string> = {
  Pokémon: 'interaction-graph-ring-pokemon',
  Trainer: 'interaction-graph-ring-trainer',
  Energy: 'interaction-graph-ring-energy',
}

const SIZE = 640
const HUB_RADIUS = 30
const HUB_HIT_RADIUS = 40
const NODE_RADIUS = 18
const NODE_HIT_RADIUS = 24
const LINK_DISTANCE = 90
const CHARGE_STRENGTH = -220
const COLLIDE_PADDING = 8
const DRAG_ALPHA_TARGET = 0.3
// Below this many SVG units of movement, a press+release counts as a click
// (show card details) rather than a drag (reposition the node).
const CLICK_MOVE_THRESHOLD = 6
// Without this, nodes with no connections (nothing pulling them back in) can
// drift off the visible canvas under pure repulsion — this is a soft leash,
// not a hard boundary, so it doesn't fight the drag or the clustering.
const CENTERING_STRENGTH = 0.03
// Fraction of the source card's height shown in the icon, anchored to the bottom
// edge of the crop (so shrinking this tightens in on the illustration from the top).
const CROP_VISIBLE_SPAN = 0.4

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Converts a pointer's client coordinates into the SVG's own user-space coordinates, accounting for the viewBox scaling. */
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: clientX, y: clientY }
  const transformed = point.matrixTransform(ctm.inverse())
  return { x: transformed.x, y: transformed.y }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Custom d3-force force: a hard wall at the canvas edge. The forceX/forceY
 * centering forces are only a soft pull, which isn't enough to keep
 * unconnected nodes on-canvas once enough repulsion piles up — this clamps
 * every node's position directly after each tick so nothing can drift out
 * of the visible SVG.
 */
function forceBounds(nodes: SimNode[], width: number, height: number) {
  return () => {
    for (const node of nodes) {
      const radius = node.isHub ? HUB_RADIUS : NODE_RADIUS
      const margin = radius + 10
      if (node.x !== undefined) node.x = clamp(node.x, margin, width - margin)
      if (node.y !== undefined) node.y = clamp(node.y, margin, height - margin)
    }
  }
}

export function UnifiedInteractionGraph({ interactions, cards, onCardClick }: UnifiedInteractionGraphProps) {
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [, bumpTick] = useState(0)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null)
  const nodesByIdRef = useRef<Map<string, SimNode>>(new Map())
  const draggingIdRef = useRef<string | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)

  const imageByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const { card } of cards) {
      if (!map.has(card.name)) map.set(card.name, card.images.small)
    }
    return map
  }, [cards])

  const supertypeByName = useMemo(() => {
    const map = new Map<string, Supertype>()
    for (const { card } of cards) {
      if (!map.has(card.name)) map.set(card.name, card.supertype)
    }
    return map
  }, [cards])

  const { hubNames, outerNames, connectedNames, edges } = useMemo(() => {
    const hubSet = new Set<string>()
    const connectedSet = new Set<string>()
    const edgeList: Edge[] = []

    for (const interaction of interactions) {
      hubSet.add(interaction.triggerCardName)
      for (const match of interaction.matchingCards) {
        connectedSet.add(interaction.triggerCardName)
        connectedSet.add(match.name)
        edgeList.push({ from: interaction.triggerCardName, to: match.name })
      }
    }

    // Every unique card in the deck gets a dot — not just the ones tied to an
    // interaction — so the graph reads as a map of the whole deck with the
    // actual interactions highlighted on top.
    const allNames = new Set(cards.map((dc) => dc.card.name))
    for (const hub of hubSet) allNames.delete(hub)

    return {
      hubNames: Array.from(hubSet),
      outerNames: Array.from(allNames).sort((a, b) => a.localeCompare(b)),
      connectedNames: connectedSet,
      edges: edgeList,
    }
  }, [interactions, cards])

  useEffect(() => {
    const hubSet = new Set(hubNames)
    const allNames = [...hubNames, ...outerNames]
    const previousNodes = nodesByIdRef.current

    // Carry over position/velocity/pin state for cards that persist across a
    // rebuild, so editing the deck elsewhere doesn't reset the whole layout.
    const nextNodes = new Map<string, SimNode>()
    for (const name of allNames) {
      const existing = previousNodes.get(name)
      nextNodes.set(name, {
        id: name,
        isHub: hubSet.has(name),
        isConnected: hubSet.has(name) || connectedNames.has(name),
        imageUrl: imageByName.get(name),
        supertype: supertypeByName.get(name),
        x: existing?.x,
        y: existing?.y,
        vx: existing?.vx,
        vy: existing?.vy,
        fx: existing?.fx,
        fy: existing?.fy,
      })
    }
    nodesByIdRef.current = nextNodes

    const nodeList = Array.from(nextNodes.values())
    const linkList: SimLink[] = edges.map((edge) => ({ source: edge.from, target: edge.to }))

    const simulation = forceSimulation(nodeList)
      .force('charge', forceManyBody().strength(CHARGE_STRENGTH))
      .force(
        'link',
        forceLink<SimNode, SimLink>(linkList)
          .id((node) => node.id)
          .distance(LINK_DISTANCE),
      )
      .force('center', forceCenter(SIZE / 2, SIZE / 2))
      .force('x', forceX(SIZE / 2).strength(CENTERING_STRENGTH))
      .force('y', forceY(SIZE / 2).strength(CENTERING_STRENGTH))
      .force(
        'collide',
        forceCollide<SimNode>((node) => (node.isHub ? HUB_RADIUS : NODE_RADIUS) + COLLIDE_PADDING).iterations(2),
      )
      .force('bounds', forceBounds(nodeList, SIZE, SIZE))
      .on('tick', () => bumpTick((v) => v + 1))

    simulationRef.current = simulation

    return () => {
      simulation.stop()
      simulationRef.current = null
    }
  }, [hubNames, outerNames, connectedNames, edges, imageByName, supertypeByName])

  if (hubNames.length === 0) return null

  const nodes = Array.from(nodesByIdRef.current.values())
  const positionByName = new Map(nodes.map((node) => [node.id, node]))

  function handlePointerDown(event: React.PointerEvent<SVGGElement>, id: string) {
    const svg = svgRef.current
    const node = nodesByIdRef.current.get(id)
    if (!svg || !node) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const margin = (node.isHub ? HUB_RADIUS : NODE_RADIUS) + 10
    const point = toSvgPoint(svg, event.clientX, event.clientY)
    pressStartRef.current = point
    node.fx = clamp(point.x, margin, SIZE - margin)
    node.fy = clamp(point.y, margin, SIZE - margin)
    draggingIdRef.current = id
    simulationRef.current?.alphaTarget(DRAG_ALPHA_TARGET).restart()
  }

  function handlePointerMove(event: React.PointerEvent<SVGGElement>) {
    const id = draggingIdRef.current
    const svg = svgRef.current
    if (!id || !svg) return
    const node = nodesByIdRef.current.get(id)
    if (!node) return
    const margin = (node.isHub ? HUB_RADIUS : NODE_RADIUS) + 10
    const point = toSvgPoint(svg, event.clientX, event.clientY)
    node.fx = clamp(point.x, margin, SIZE - margin)
    node.fy = clamp(point.y, margin, SIZE - margin)
  }

  function handlePointerUp(event: React.PointerEvent<SVGGElement>) {
    const id = draggingIdRef.current
    if (id) {
      const node = nodesByIdRef.current.get(id)
      if (node) {
        node.fx = null
        node.fy = null
      }

      const svg = svgRef.current
      const start = pressStartRef.current
      if (svg && start && onCardClick) {
        const end = toSvgPoint(svg, event.clientX, event.clientY)
        const moved = Math.hypot(end.x - start.x, end.y - start.y)
        if (moved < CLICK_MOVE_THRESHOLD) onCardClick(id)
      }
    }
    pressStartRef.current = null
    draggingIdRef.current = null
    simulationRef.current?.alphaTarget(0)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function renderNode(node: SimNode) {
    const radius = node.isHub ? HUB_RADIUS : NODE_RADIUS
    const clipId = node.isHub ? 'interaction-graph-clip-hub' : 'interaction-graph-clip-node'
    const isHovered = hoveredName === node.id
    const isDragging = draggingIdRef.current === node.id
    const cropHeight = (radius * 2) / CROP_VISIBLE_SPAN
    const cropY = radius - cropHeight / 2
    const x = node.x ?? SIZE / 2
    const y = node.y ?? SIZE / 2

    return (
      <g
        key={node.id}
        transform={`translate(${x}, ${y})`}
        tabIndex={0}
        role="button"
        aria-label={node.id}
        className={`interaction-graph-node${isDragging ? ' interaction-graph-node-dragging' : ''}`}
        onMouseEnter={() => setHoveredName(node.id)}
        onMouseLeave={() => setHoveredName(null)}
        onFocus={() => setHoveredName(node.id)}
        onBlur={() => setHoveredName(null)}
        onPointerDown={(event) => handlePointerDown(event, node.id)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onCardClick?.(node.id)
          }
        }}
      >
        <circle r={node.isHub ? HUB_HIT_RADIUS : NODE_HIT_RADIUS} className="interaction-graph-node-hit" />

        <g className="interaction-graph-node-visual">
          {node.imageUrl ? (
            <image
              href={node.imageUrl}
              x={-radius}
              y={cropY}
              width={radius * 2}
              height={cropHeight}
              preserveAspectRatio="xMidYMin slice"
              clipPath={`url(#${clipId})`}
              className={`interaction-graph-node-image${node.isConnected ? '' : ' interaction-graph-node-image-muted'}`}
            />
          ) : (
            <circle
              r={radius}
              className={
                node.isHub
                  ? 'interaction-graph-hub'
                  : `interaction-graph-node-dot${node.isConnected ? '' : ' interaction-graph-node-dot-muted'}`
              }
            />
          )}
          <circle
            r={radius}
            className={`interaction-graph-node-ring${node.isHub ? ' interaction-graph-hub-ring' : ''}${node.supertype ? ` ${SUPERTYPE_RING_CLASS[node.supertype]}` : ''}`}
          />
        </g>

        {isHovered && (
          <text y={-radius - 10} className="interaction-graph-node-hover-label" textAnchor="middle">
            {truncate(node.id, 22)}
          </text>
        )}
        <title>{node.id}</title>
      </g>
    )
  }

  return (
    <div className="interaction-graph-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="interaction-graph interaction-graph-unified"
        role="img"
        aria-label="Unified card interactions graph"
      >
        <defs>
          <clipPath id="interaction-graph-clip-hub">
            <circle r={HUB_RADIUS} />
          </clipPath>
          <clipPath id="interaction-graph-clip-node">
            <circle r={NODE_RADIUS} />
          </clipPath>
        </defs>

        {edges.map((edge) => {
          const from = positionByName.get(edge.from)
          const to = positionByName.get(edge.to)
          if (!from || !to) return null
          const isActive = hoveredName !== null && (edge.from === hoveredName || edge.to === hoveredName)
          return (
            <line
              key={`${edge.from}->${edge.to}`}
              x1={from.x ?? SIZE / 2}
              y1={from.y ?? SIZE / 2}
              x2={to.x ?? SIZE / 2}
              y2={to.y ?? SIZE / 2}
              className={`interaction-graph-edge${isActive ? ' interaction-graph-edge-active' : ''}`}
            />
          )
        })}

        {nodes.map((node) => renderNode(node))}
      </svg>

      <p className="interaction-graph-tooltip status-text">
        {hoveredName ? <strong>{hoveredName}</strong> : 'Hover or focus a card for details, or drag it around.'}
      </p>
    </div>
  )
}
