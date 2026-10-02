import { describe, it, expect } from 'vitest'
import { notetakerToTree, taskmasterToTree, evenToTree, minimalToTree, presetToTree } from './panel-tree'
import { findPath, swapWidgets } from './panel-tree'
import { splitWidgetIn, moveWidget } from './panel-tree'

describe('preset to tree converters', () => {
  it('notetakerToTree puts notes on the left and a 2x2 utility grid on the right', () => {
    const tree = notetakerToTree()
    expect(tree).toEqual({
      type: 'split', direction: 'row', sizes: [48, 52],
      children: [
        { type: 'widget', id: 'notes' },
        {
          type: 'split', direction: 'column', sizes: [34, 66],
          children: [
            { type: 'widget', id: 'tasks' },
            {
              type: 'split', direction: 'column', sizes: [50, 50],
              children: [
                { type: 'split', direction: 'row', sizes: [50, 50], children: [{ type: 'widget', id: 'schedule' }, { type: 'widget', id: 'weather' }] },
                { type: 'split', direction: 'row', sizes: [50, 50], children: [{ type: 'widget', id: 'countdown' }, { type: 'widget', id: 'recorder' }] },
              ],
            },
          ],
        },
      ],
    })
  })

  it('taskmasterToTree puts tasks on the left where notetaker puts notes', () => {
    const tree = taskmasterToTree()
    if (tree.type !== 'split') throw new Error('expected split')
    expect(tree.children[0]).toEqual({ type: 'widget', id: 'tasks' })
  })

  it('evenToTree puts notes and tasks side by side on top, 60/40 over the utility row', () => {
    const tree = evenToTree()
    if (tree.type !== 'split') throw new Error('expected split')
    expect(tree.direction).toBe('column')
    expect(tree.sizes).toEqual([60, 40])
    expect(tree.children[0]).toEqual({
      type: 'split', direction: 'row', sizes: [50, 50],
      children: [{ type: 'widget', id: 'notes' }, { type: 'widget', id: 'tasks' }],
    })
  })

  it("minimalToTree uses a 75/25 top/bottom split instead of evenToTree's 60/40", () => {
    const tree = minimalToTree()
    if (tree.type !== 'split') throw new Error('expected split')
    expect(tree.sizes).toEqual([75, 25])
  })

  it('presetToTree dispatches to the matching converter', () => {
    expect(presetToTree('notetaker')).toEqual(notetakerToTree())
    expect(presetToTree('even')).toEqual(evenToTree())
  })
})

describe('findPath', () => {
  it('finds the path to a leaf nested inside the utility grid', () => {
    const tree = notetakerToTree()
    expect(findPath(tree, 'weather')).toEqual([1, 1, 0, 1])
  })

  it('returns null for a widget not present in the tree', () => {
    expect(findPath({ type: 'widget', id: 'notes' }, 'tasks')).toBeNull()
  })
})

describe('swapWidgets', () => {
  it('swaps two leaves, leaving the tree shape unchanged', () => {
    const tree = notetakerToTree()
    const result = swapWidgets(tree, 'schedule', 'weather')
    expect(findPath(result, 'weather')).toEqual(findPath(tree, 'schedule'))
    expect(findPath(result, 'schedule')).toEqual(findPath(tree, 'weather'))
  })

  it('swapping notes and tasks moves notes into the tall left slot', () => {
    const tree = notetakerToTree()
    const result = swapWidgets(tree, 'notes', 'tasks')
    expect(findPath(result, 'tasks')).toEqual([0])
    expect(findPath(result, 'notes')).toEqual([1, 0])
  })

  it('is a no-op when swapping a widget with itself', () => {
    const tree = notetakerToTree()
    expect(swapWidgets(tree, 'notes', 'notes')).toEqual(tree)
  })
})

describe('splitWidgetIn', () => {
  it('dropping on the left edge of weather inserts the dragged widget to its left', () => {
    const tree = notetakerToTree()
    const result = splitWidgetIn(tree, 'recorder', 'weather', 'left')
    const weatherParentPath = findPath(result, 'weather')!.slice(0, -1)
    expect(findPath(result, 'recorder')).toEqual([...weatherParentPath, 0])
    expect(findPath(result, 'weather')).toEqual([...weatherParentPath, 1])
  })

  it('removing the dragged widget collapses its old parent split to the remaining sibling', () => {
    const tree = notetakerToTree()
    const result = splitWidgetIn(tree, 'schedule', 'notes', 'top')
    expect(findPath(result, 'weather')).toEqual([1, 1, 0])
  })
})

describe('moveWidget', () => {
  it('dispatches center drops to swapWidgets', () => {
    const tree = notetakerToTree()
    expect(moveWidget(tree, 'schedule', 'weather', 'center')).toEqual(swapWidgets(tree, 'schedule', 'weather'))
  })

  it('dispatches edge drops to splitWidgetIn', () => {
    const tree = notetakerToTree()
    expect(moveWidget(tree, 'recorder', 'weather', 'left')).toEqual(splitWidgetIn(tree, 'recorder', 'weather', 'left'))
  })

  it('is a no-op when dragging a widget onto itself', () => {
    const tree = notetakerToTree()
    expect(moveWidget(tree, 'notes', 'notes', 'center')).toEqual(tree)
  })
})
