import { describe, it, expect } from 'vitest'
import { computeZone } from './panel-drag'

const rect = { left: 0, top: 0, width: 100, height: 100 }

describe('computeZone', () => {
  it('center region swaps', () => {
    expect(computeZone(rect, { x: 50, y: 50 })).toBe('center')
  })
  it('left edge', () => {
    expect(computeZone(rect, { x: 5, y: 50 })).toBe('left')
  })
  it('right edge', () => {
    expect(computeZone(rect, { x: 95, y: 50 })).toBe('right')
  })
  it('top edge', () => {
    expect(computeZone(rect, { x: 50, y: 5 })).toBe('top')
  })
  it('bottom edge', () => {
    expect(computeZone(rect, { x: 50, y: 95 })).toBe('bottom')
  })
  it('corner resolves to the nearest edge', () => {
    // relX=0.05 (left=0.05) vs relY=0.10 (top=0.10) -> left is closer
    expect(computeZone(rect, { x: 5, y: 10 })).toBe('left')
  })
})
