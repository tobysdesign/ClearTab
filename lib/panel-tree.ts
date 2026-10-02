import type { WidgetId } from '@/hooks/use-beta-widgets'
export type { WidgetId } from '@/hooks/use-beta-widgets'

export type PanelDirection = 'row' | 'column'

export type PanelNode =
  | { type: 'widget'; id: WidgetId }
  | { type: 'split'; direction: PanelDirection; sizes: [number, number]; children: [PanelNode, PanelNode] }

export type DropZone = 'center' | 'top' | 'bottom' | 'left' | 'right'

function widgetNode(id: WidgetId): PanelNode {
  return { type: 'widget', id }
}

function splitNode(direction: PanelDirection, sizes: [number, number], children: [PanelNode, PanelNode]): PanelNode {
  return { type: 'split', direction, sizes, children }
}

function utilityGrid(): PanelNode {
  return splitNode('column', [50, 50], [
    splitNode('row', [50, 50], [widgetNode('schedule'), widgetNode('weather')]),
    splitNode('row', [50, 50], [widgetNode('countdown'), widgetNode('recorder')]),
  ])
}

export function notetakerToTree(): PanelNode {
  return splitNode('row', [48, 52], [
    widgetNode('notes'),
    splitNode('column', [34, 66], [widgetNode('tasks'), utilityGrid()]),
  ])
}

export function taskmasterToTree(): PanelNode {
  return splitNode('row', [48, 52], [
    widgetNode('tasks'),
    splitNode('column', [34, 66], [widgetNode('notes'), utilityGrid()]),
  ])
}

export function evenToTree(): PanelNode {
  return splitNode('column', [60, 40], [
    splitNode('row', [50, 50], [widgetNode('notes'), widgetNode('tasks')]),
    splitNode('row', [50, 50], [
      splitNode('row', [50, 50], [widgetNode('schedule'), widgetNode('weather')]),
      splitNode('row', [50, 50], [widgetNode('countdown'), widgetNode('recorder')]),
    ]),
  ])
}

export function minimalToTree(): PanelNode {
  return splitNode('column', [75, 25], [
    splitNode('row', [50, 50], [widgetNode('notes'), widgetNode('tasks')]),
    splitNode('row', [50, 50], [
      splitNode('row', [50, 50], [widgetNode('schedule'), widgetNode('weather')]),
      splitNode('row', [50, 50], [widgetNode('countdown'), widgetNode('recorder')]),
    ]),
  ])
}

export function presetToTree(preset: 'notetaker' | 'even' | 'taskmaster' | 'minimal'): PanelNode {
  switch (preset) {
    case 'notetaker': return notetakerToTree()
    case 'taskmaster': return taskmasterToTree()
    case 'even': return evenToTree()
    case 'minimal': return minimalToTree()
  }
}

export function findPath(tree: PanelNode, id: WidgetId): number[] | null {
  if (tree.type === 'widget') {
    return tree.id === id ? [] : null
  }
  const leftPath = findPath(tree.children[0], id)
  if (leftPath) return [0, ...leftPath]
  const rightPath = findPath(tree.children[1], id)
  if (rightPath) return [1, ...rightPath]
  return null
}

function getNodeAtPath(tree: PanelNode, path: number[]): PanelNode {
  let node = tree
  for (const step of path) {
    if (node.type !== 'split') throw new Error('Invalid path into panel tree')
    node = node.children[step]
  }
  return node
}

function setNodeAtPath(tree: PanelNode, path: number[], replacement: PanelNode): PanelNode {
  if (path.length === 0) return replacement
  if (tree.type !== 'split') throw new Error('Invalid path into panel tree')
  const [step, ...rest] = path
  const children = [...tree.children] as [PanelNode, PanelNode]
  children[step] = setNodeAtPath(children[step], rest, replacement)
  return { ...tree, children }
}

export function swapWidgets(tree: PanelNode, draggedId: WidgetId, targetId: WidgetId): PanelNode {
  const draggedPath = findPath(tree, draggedId)
  const targetPath = findPath(tree, targetId)
  if (!draggedPath || !targetPath) return tree
  let next = setNodeAtPath(tree, draggedPath, widgetNode(targetId))
  next = setNodeAtPath(next, targetPath, widgetNode(draggedId))
  return next
}

function removeAtPath(tree: PanelNode, path: number[]): PanelNode {
  if (path.length === 0) throw new Error('Cannot remove the root node')
  const parentPath = path.slice(0, -1)
  const removedIndex = path[path.length - 1]
  const siblingIndex = removedIndex === 0 ? 1 : 0
  const parent = getNodeAtPath(tree, parentPath)
  if (parent.type !== 'split') throw new Error('Invalid path into panel tree')
  const sibling = parent.children[siblingIndex]
  return setNodeAtPath(tree, parentPath, sibling)
}

function insertAsSplit(
  tree: PanelNode,
  targetPath: number[],
  draggedNode: PanelNode,
  edge: 'top' | 'bottom' | 'left' | 'right',
): PanelNode {
  const targetNode = getNodeAtPath(tree, targetPath)
  const direction: PanelDirection = edge === 'top' || edge === 'bottom' ? 'column' : 'row'
  const draggedFirst = edge === 'top' || edge === 'left'
  const children: [PanelNode, PanelNode] = draggedFirst ? [draggedNode, targetNode] : [targetNode, draggedNode]
  return setNodeAtPath(tree, targetPath, splitNode(direction, [50, 50], children))
}

export function splitWidgetIn(
  tree: PanelNode,
  draggedId: WidgetId,
  targetId: WidgetId,
  edge: 'top' | 'bottom' | 'left' | 'right',
): PanelNode {
  const draggedPath = findPath(tree, draggedId)
  if (!draggedPath) return tree
  const afterRemoval = removeAtPath(tree, draggedPath)
  const targetPath = findPath(afterRemoval, targetId)
  if (!targetPath) return tree
  return insertAsSplit(afterRemoval, targetPath, widgetNode(draggedId), edge)
}

export function moveWidget(tree: PanelNode, draggedId: WidgetId, targetId: WidgetId, zone: DropZone): PanelNode {
  if (draggedId === targetId) return tree
  if (zone === 'center') return swapWidgets(tree, draggedId, targetId)
  return splitWidgetIn(tree, draggedId, targetId, zone)
}

export function collapseForVisibility(
  node: PanelNode,
  isVisible: (id: WidgetId) => boolean,
): PanelNode | null {
  if (node.type === 'widget') {
    return isVisible(node.id) ? node : null
  }
  const left = collapseForVisibility(node.children[0], isVisible)
  const right = collapseForVisibility(node.children[1], isVisible)
  if (left && right) return { ...node, children: [left, right] }
  if (left) return left
  if (right) return right
  return null
}
