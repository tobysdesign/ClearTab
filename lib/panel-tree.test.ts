import { describe, it, expect } from 'vitest'
import { notetakerToTree, taskmasterToTree, evenToTree, minimalToTree, presetToTree } from './panel-tree'

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
