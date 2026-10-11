'use client'

import React, { useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { DockPanel } from '@cleartab/ui'
import { Switch } from '@/components/ui/switch'
import {
  BetaPresetLayout,
  WidgetId,
  WidgetVisibilityState,
  WIDGET_METADATA,
  LAYOUT_PRESET_METADATA,
  CustomLayoutState,
} from '@/hooks/use-beta-widgets'
import { PanelNode, DropZone, presetToTree, collapseForVisibility } from '@/lib/panel-tree'
import styles from './visual-layout-modal.module.css'

interface VisualLayoutModalProps {
  isOpen: boolean
  onClose: () => void
  presetLayout: BetaPresetLayout
  setPresetLayout: (layout: BetaPresetLayout) => void
  widgets: WidgetVisibilityState
  toggleWidget: (id: WidgetId) => void
  activeCount: number
  totalCount: number
  customLayout: CustomLayoutState
  onMoveWidget: (draggedId: WidgetId, targetId: WidgetId, zone: DropZone) => void
}

// Material Symbols Outlined ligature names, used both for thumbnail tiles that
// don't carry a text label and for the widget-visibility toggle row's icons.
const WIDGET_ICON: Record<WidgetId, string> = {
  notes: 'edit_note',
  tasks: 'checklist',
  schedule: 'calendar_today',
  weather: 'partly_cloudy_day',
  recorder: 'mic',
  countdown: 'timer_5',
}

interface MiniBlockProps {
  id?: WidgetId
  label: string
  isEnabled?: boolean
  className?: string
  isLight?: boolean
  style?: React.CSSProperties
}

function MiniWireframeBlock({
  label,
  isEnabled = true,
  className = '',
  isLight = false,
  style,
}: MiniBlockProps) {
  return (
    <div
      className={`${styles.miniBlock} ${isLight ? styles.miniBlockLight : ''} ${
        !isEnabled ? styles.miniBlockOff : ''
      } ${className}`}
      style={style}
    >
      {isLight && <span className={styles.miniBlockName}>{label}</span>}
    </div>
  )
}

interface DropTarget {
  targetId: WidgetId
  zone: DropZone
  rect: DOMRect
}

/** Shared hit-test: given the dragged widget's current pointer position, find which
 * other tile it's over and whether that's a center (swap) or edge (split) drop.
 * Queries the live DOM at the cursor point rather than a maintained ref map —
 * a map keyed by widget id can go stale the instant two tiles trade ids in the
 * same commit (e.g. right after a swap), since their ref callbacks re-register
 * in the same pass; elementsFromPoint always reflects what's actually rendered.
 *
 * `point` is framer-motion's PanInfo.point, which is page-relative (includes
 * scroll offset) -- elementsFromPoint and getBoundingClientRect are both
 * viewport-relative, so it's converted here before use. Otherwise, with any
 * page scroll, the hit-test silently finds whatever unrelated element happens
 * to sit at the scroll-shifted coordinates (e.g. a rail thumbnail far from
 * the actual cursor position), rather than the tile actually under the drag. */
function computeDropTarget(
  draggedEl: HTMLElement,
  pagePoint: { x: number; y: number },
): DropTarget | null {
  const point = { x: pagePoint.x - window.scrollX, y: pagePoint.y - window.scrollY }
  const stack = document.elementsFromPoint(point.x, point.y)
  const targetEl = stack.find(
    (el): el is HTMLElement => el !== draggedEl && !draggedEl.contains(el) && el instanceof HTMLElement && el.hasAttribute('data-widget-id'),
  )
  if (!targetEl) return null
  const targetId = targetEl.getAttribute('data-widget-id') as WidgetId
  const targetRect = targetEl.getBoundingClientRect()
  const relX = (point.x - targetRect.left) / targetRect.width
  const relY = (point.y - targetRect.top) / targetRect.height
  const inCenter = relX >= 0.25 && relX <= 0.75 && relY >= 0.25 && relY <= 0.75
  let zone: DropZone
  if (inCenter) {
    zone = 'center'
  } else {
    const distances: Record<'left' | 'right' | 'top' | 'bottom', number> = {
      left: relX,
      right: 1 - relX,
      top: relY,
      bottom: 1 - relY,
    }
    zone = (Object.keys(distances) as Array<'left' | 'right' | 'top' | 'bottom'>).reduce((closest, key) =>
      distances[key] < distances[closest] ? key : closest
    , 'left')
  }
  return { targetId, zone, rect: targetRect }
}

/** Rect (viewport coords) the live drop-indicator overlay should cover for a given zone —
 * the whole tile for a center/swap drop, or just the relevant half for an edge/split drop. */
function dropIndicatorRect(target: DropTarget): { left: number; top: number; width: number; height: number } {
  const { rect, zone } = target
  switch (zone) {
    case 'center':
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    case 'left':
      return { left: rect.left, top: rect.top, width: rect.width / 2, height: rect.height }
    case 'right':
      return { left: rect.left + rect.width / 2, top: rect.top, width: rect.width / 2, height: rect.height }
    case 'top':
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height / 2 }
    case 'bottom':
      return { left: rect.left, top: rect.top + rect.height / 2, width: rect.width, height: rect.height / 2 }
  }
}

function renderTreeWireframe(node: PanelNode, className: string = styles.wireframeFlex1): React.ReactNode {
  if (node.type === 'widget') {
    return (
      <MiniWireframeBlock
        id={node.id}
        label={WIDGET_METADATA[node.id].name}
        isLight={node.id === 'notes' || node.id === 'tasks'}
        className={className}
      />
    )
  }
  return (
    <div className={`${node.direction === 'row' ? styles.wireframeRow : styles.wireframeCol} ${className}`}>
      {renderTreeWireframe(node.children[0], styles.wireframeFlex1)}
      {renderTreeWireframe(node.children[1], styles.wireframeFlex1)}
    </div>
  )
}

function DraggableTreeWireframe({
  node,
  onDrag,
  onDragEnd,
}: {
  node: PanelNode
  onDrag: (draggedEl: HTMLElement, point: { x: number; y: number }) => void
  onDragEnd: (draggedId: WidgetId, draggedEl: HTMLElement, point: { x: number; y: number }) => void
}) {
  // A ref owned by this component instance, not event.currentTarget: framer-motion
  // replays/reuses the underlying event object across pan samples outside normal
  // DOM dispatch, where currentTarget is only valid momentarily -- reading it from
  // onDrag can see it already nulled out, crashing computeDropTarget. Called
  // unconditionally (before the branch below) so it's safe regardless of whether
  // this position renders as a widget leaf or a split on a given render.
  const elRef = useRef<HTMLDivElement>(null)

  if (node.type === 'widget') {
    const meta = WIDGET_METADATA[node.id]
    const isLight = node.id === 'notes' || node.id === 'tasks'
    return (
      <motion.div
        key={node.id}
        ref={elRef}
        data-widget-id={node.id}
        layoutId={node.id}
        className={`${styles.miniBlock} ${isLight ? styles.miniBlockLight : ''} ${styles.wireframeFlex1} ${styles.draggableBlock}`}
        drag
        dragSnapToOrigin
        dragElastic={0.2}
        whileDrag={{ zIndex: 10, boxShadow: '0 12px 28px -6px rgba(0,0,0,0.6)' }}
        onDrag={(_event, info) => { if (elRef.current) onDrag(elRef.current, info.point) }}
        onDragEnd={(_event, info) => { if (elRef.current) onDragEnd(node.id, elRef.current, info.point) }}
      >
        <span className={styles.miniBlockName}>{meta.name}</span>
        <span className={styles.miniGripDots}>:::</span>
      </motion.div>
    )
  }
  return (
    <div className={`${node.direction === 'row' ? styles.wireframeRow : styles.wireframeCol} ${styles.wireframeFlex1}`}>
      <DraggableTreeWireframe node={node.children[0]} onDrag={onDrag} onDragEnd={onDragEnd} />
      <DraggableTreeWireframe node={node.children[1]} onDrag={onDrag} onDragEnd={onDragEnd} />
    </div>
  )
}

// 1. Notetaker Preview
function NotetakerPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const hasNotes = widgets.notes
  const row1 = (['schedule', 'weather'] as WidgetId[]).filter((id) => widgets[id])
  const row2 = (['countdown', 'recorder'] as WidgetId[]).filter((id) => widgets[id])
  const hasGrid = row1.length > 0 || row2.length > 0
  const hasRight = widgets.tasks || hasGrid

  const renderRight = () => (
    <div className={styles.wireframeColFlex}>
      {widgets.tasks && (
        <MiniWireframeBlock
          id="tasks"
          label="Tasks"
          isLight
          className={hasGrid ? styles.wireframeTop34 : styles.wireframeTop100}
        />
      )}
      {hasGrid && (
        <div className={styles.wireframeGrid2x2}>
          <div className={styles.wireframeGridRow}>
            {row1.map(id => (
              <MiniWireframeBlock
                key={id}
                id={id}
                label={WIDGET_METADATA[id].name}
                isEnabled={widgets[id]}
                className={styles.wireframeFlex1}
              />
            ))}
          </div>
          <div className={styles.wireframeGridRow}>
            {row2.map(id => (
              <MiniWireframeBlock
                key={id}
                id={id}
                label={WIDGET_METADATA[id].name}
                isEnabled={widgets[id]}
                className={styles.wireframeFlex1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.wireframeRow}>
      {hasNotes && <MiniWireframeBlock id="notes" label="Notes" isLight className={styles.wireframeFlex1} />}
      {hasRight && renderRight()}
    </div>
  )
}

// 2. Taskmaster Preview
function TaskmasterPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const hasTasks = widgets.tasks
  const row1 = (['schedule', 'weather'] as WidgetId[]).filter((id) => widgets[id])
  const row2 = (['countdown', 'recorder'] as WidgetId[]).filter((id) => widgets[id])
  const hasGrid = row1.length > 0 || row2.length > 0
  const hasRight = widgets.notes || hasGrid

  const renderRight = () => (
    <div className={styles.wireframeColFlex}>
      {widgets.notes && (
        <MiniWireframeBlock
          id="notes"
          label="Notes"
          isLight
          className={hasGrid ? styles.wireframeTop34 : styles.wireframeTop100}
        />
      )}
      {hasGrid && (
        <div className={styles.wireframeGrid2x2}>
          <div className={styles.wireframeGridRow}>
            {row1.map(id => (
              <MiniWireframeBlock
                key={id}
                id={id}
                label={WIDGET_METADATA[id].name}
                isEnabled={widgets[id]}
                className={styles.wireframeFlex1}
              />
            ))}
          </div>
          <div className={styles.wireframeGridRow}>
            {row2.map(id => (
              <MiniWireframeBlock
                key={id}
                id={id}
                label={WIDGET_METADATA[id].name}
                isEnabled={widgets[id]}
                className={styles.wireframeFlex1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.wireframeRow}>
      {hasTasks && <MiniWireframeBlock id="tasks" label="Tasks" isLight className={styles.wireframeFlex1} />}
      {hasRight && renderRight()}
    </div>
  )
}

// 3. Even Preview
function EvenPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const top = (['notes', 'tasks'] as WidgetId[]).filter(id => widgets[id])
  const bottom = (['schedule', 'weather', 'countdown', 'recorder'] as WidgetId[]).filter(id => widgets[id])
  return (
    <div className={styles.wireframeCol}>
      {top.length > 0 && (
        <div className={styles.wireframeFlex1_5}>
          {top.map(id => (
            <MiniWireframeBlock
              key={id}
              id={id}
              label={WIDGET_METADATA[id].name}
              isLight
              className={styles.wireframeFlex1}
            />
          ))}
        </div>
      )}
      {bottom.length > 0 && (
        <div className={styles.wireframeGridRow}>
          {bottom.map(id => (
            <MiniWireframeBlock
              key={id}
              id={id}
              label={WIDGET_METADATA[id].name}
              className={styles.wireframeFlex1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 4. Minimal Preview
function MinimalPreview({ widgets }: { widgets: WidgetVisibilityState }) {
  const top = (['notes', 'tasks'] as WidgetId[]).filter(id => widgets[id])
  const bottom = (['schedule', 'weather', 'countdown', 'recorder'] as WidgetId[]).filter(id => widgets[id])
  return (
    <div className={styles.wireframeCol}>
      {top.length > 0 && (
        <div className={styles.wireframeFlex3}>
          {top.map(id => (
            <MiniWireframeBlock
              key={id}
              id={id}
              label={WIDGET_METADATA[id].name}
              isLight
              className={styles.wireframeFlex1}
            />
          ))}
        </div>
      )}
      {bottom.length > 0 && (
        <div className={styles.wireframeGridRow}>
          {bottom.map(id => (
            <MiniWireframeBlock
              key={id}
              id={id}
              label={WIDGET_METADATA[id].name}
              className={styles.wireframeFlex1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function VisualLayoutModal({
  isOpen,
  onClose,
  presetLayout = 'notetaker',
  setPresetLayout,
  widgets,
  toggleWidget,
  activeCount,
  totalCount,
  customLayout,
  onMoveWidget,
}: VisualLayoutModalProps) {
  // Imperative, not React state: updating this via setState on every pointermove
  // would re-render the whole modal (and recompute the entire tree) mid-drag,
  // fighting framer-motion's own transform updates on the dragged element and
  // making it appear to freeze. The indicator div is updated directly instead.
  const dropIndicatorRef = useRef<HTMLDivElement>(null)

  const handleDrag = useCallback((draggedEl: HTMLElement, point: { x: number; y: number }) => {
    const el = dropIndicatorRef.current
    if (!el) return
    const target = computeDropTarget(draggedEl, point)
    if (!target) {
      el.style.opacity = '0'
      return
    }
    const r = dropIndicatorRect(target)
    el.className = `${styles.dropIndicator} ${target.zone === 'center' ? styles.dropIndicatorCenter : styles.dropIndicatorEdge}`
    el.style.opacity = '1'
    el.style.left = `${r.left}px`
    el.style.top = `${r.top}px`
    el.style.width = `${r.width}px`
    el.style.height = `${r.height}px`
  }, [])

  const handleDragEnd = useCallback((draggedId: WidgetId, draggedEl: HTMLElement, point: { x: number; y: number }) => {
    if (dropIndicatorRef.current) dropIndicatorRef.current.style.opacity = '0'
    const target = computeDropTarget(draggedEl, point)
    if (!target) return
    onMoveWidget(draggedId, target.targetId, target.zone)
  }, [onMoveWidget])

  const widgetKeys: WidgetId[] = ['notes', 'tasks', 'schedule', 'weather', 'recorder', 'countdown']

  const isVisible = (id: WidgetId) => widgets[id] ?? false
  const rawActiveTree: PanelNode | null = presetLayout === 'custom' ? customLayout.tree : presetToTree(presetLayout)
  const activeTree = rawActiveTree ? collapseForVisibility(rawActiveTree, isVisible) : null
  const customCollapsedTree = customLayout.tree ? collapseForVisibility(customLayout.tree, isVisible) : null

  return (
    <DockPanel isOpen={isOpen} onClose={onClose} anchorSelector='[data-testid="layout-trigger"]' className={styles.panelContent}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.modalTitle}>Choose Dashboard Layout</h2>

          </div>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            <span>Done</span>
            <kbd className={styles.escKey}>Esc</kbd>
          </button>
        </div>

        <div className={styles.layoutBuilder}>
          <div className={styles.leftColumn}>
            <div className={styles.bigPreviewFrame}>
              {activeTree
                ? <DraggableTreeWireframe node={activeTree} onDrag={handleDrag} onDragEnd={handleDragEnd} />
                : <div className={styles.emptyCustomHint}>Drag a widget to start customizing</div>}
            </div>
            {/* Portaled straight to document.body, not just rendered inline: this tree
                sits inside DockPanel's transform: translateX(-50%) positioning wrapper,
                and position: fixed on a descendant of a transformed ancestor anchors to
                that ancestor's box instead of the true viewport (a CSS behavior, not a
                bug in the fixed positioning itself) -- so without the portal, this
                indicator's computed left/top would render offset by wherever the panel
                itself sits, not at the actual cursor/target location. */}
            {typeof document !== 'undefined' && createPortal(
              <div ref={dropIndicatorRef} className={styles.dropIndicator} style={{ opacity: 0 }}>
                <span className={styles.dropIndicatorSwapLabel}>⇄ Swap</span>
                <span className={styles.dropIndicatorSplitLabel}>⊞ Split</span>
              </div>,
              document.body,
            )}

            <div className={styles.togglesSection}>
              <div className={styles.togglesGrid}>
                {widgetKeys.map((id) => {
                  const meta = WIDGET_METADATA[id]
                  const isChecked = widgets[id] ?? false
                  return (
                    <div key={id} className={`${styles.toggleRow} ${isChecked ? styles.toggleRowActive : ''}`} onClick={() => toggleWidget(id)}>
                      <div className={styles.toggleLabelGroup}>
                        <span className={styles.toggleIcon}>
                          <span className="material-symbols-outlined">{WIDGET_ICON[id]}</span>
                        </span>
                        <span className={styles.toggleName}>{meta.name}</span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={isChecked}
                          onCheckedChange={() => toggleWidget(id)}
                          aria-label={`Toggle ${meta.name}`}
                          className={styles.widgetSwitch}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className={styles.layoutRail}>
            <div className={`${styles.railCard} ${presetLayout === 'notetaker' ? styles.railCardActive : ''}`} onClick={() => setPresetLayout('notetaker')}>
              <div className={styles.railCardTitleRow}>
                <span className={styles.layoutName}>Notetaker</span>
                {presetLayout === 'notetaker' && <span className={styles.activeBadge}>Active</span>}
              </div>
              <div className={styles.railCardFrame}><NotetakerPreview widgets={widgets} /></div>
            </div>
            <div className={`${styles.railCard} ${presetLayout === 'even' ? styles.railCardActive : ''}`} onClick={() => setPresetLayout('even')}>
              <div className={styles.railCardTitleRow}>
                <span className={styles.layoutName}>Even</span>
                {presetLayout === 'even' && <span className={styles.activeBadge}>Active</span>}
              </div>
              <div className={styles.railCardFrame}><EvenPreview widgets={widgets} /></div>
            </div>
            <div className={`${styles.railCard} ${presetLayout === 'taskmaster' ? styles.railCardActive : ''}`} onClick={() => setPresetLayout('taskmaster')}>
              <div className={styles.railCardTitleRow}>
                <span className={styles.layoutName}>Taskmaster</span>
                {presetLayout === 'taskmaster' && <span className={styles.activeBadge}>Active</span>}
              </div>
              <div className={styles.railCardFrame}><TaskmasterPreview widgets={widgets} /></div>
            </div>
            <div className={`${styles.railCard} ${presetLayout === 'minimal' ? styles.railCardActive : ''}`} onClick={() => setPresetLayout('minimal')}>
              <div className={styles.railCardTitleRow}>
                <span className={styles.layoutName}>Minimal</span>
                {presetLayout === 'minimal' && <span className={styles.activeBadge}>Active</span>}
              </div>
              <div className={styles.railCardFrame}><MinimalPreview widgets={widgets} /></div>
            </div>
            <div className={`${styles.railCard} ${styles.railCardCustom} ${presetLayout === 'custom' ? styles.railCardActive : ''}`} onClick={() => setPresetLayout('custom')}>
              <div className={styles.railCardTitleRow}>
                <span className={styles.layoutName}>Custom</span>
                {presetLayout === 'custom' && <span className={styles.activeBadge}>Active</span>}
              </div>
              <div className={styles.railCardFrame}>
                {customCollapsedTree ? renderTreeWireframe(customCollapsedTree) : <span className={styles.customPlusIcon}>+</span>}
              </div>
            </div>
          </div>
        </div>
    </DockPanel>
  )
}
