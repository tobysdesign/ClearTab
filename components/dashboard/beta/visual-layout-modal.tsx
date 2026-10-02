'use client'

import React, { useEffect } from 'react'
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

interface MiniBlockProps {
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
      <span className={styles.miniBlockName}>{label}</span>
      <span className={styles.miniGripDots}>:::</span>
    </div>
  )
}

function renderTreeWireframe(node: PanelNode): React.ReactNode {
  if (node.type === 'widget') {
    return (
      <MiniWireframeBlock
        label={WIDGET_METADATA[node.id].name}
        isLight={node.id === 'notes' || node.id === 'tasks'}
        className={styles.wireframeFlex1}
      />
    )
  }
  return (
    <div className={node.direction === 'row' ? styles.wireframeRow : styles.wireframeCol}>
      <div className={styles.wireframeFlex1}>{renderTreeWireframe(node.children[0])}</div>
      <div className={styles.wireframeFlex1}>{renderTreeWireframe(node.children[1])}</div>
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
      {hasNotes && <MiniWireframeBlock label="Notes" isLight className={styles.wireframeFlex1} />}
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
      {hasTasks && <MiniWireframeBlock label="Tasks" isLight className={styles.wireframeFlex1} />}
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
  onMoveWidget: _onMoveWidget,
}: VisualLayoutModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widgetKeys: WidgetId[] = ['notes', 'tasks', 'schedule', 'weather', 'recorder', 'countdown']

  const isVisible = (id: WidgetId) => widgets[id] ?? false
  const rawActiveTree: PanelNode | null = presetLayout === 'custom' ? customLayout.tree : presetToTree(presetLayout)
  const activeTree = rawActiveTree ? collapseForVisibility(rawActiveTree, isVisible) : null
  const customCollapsedTree = customLayout.tree ? collapseForVisibility(customLayout.tree, isVisible) : null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleRow}>
            <h2 className={styles.modalTitle}>Choose Dashboard Layout</h2>
            <span className={styles.activeCountBadge}>
              {activeCount}/{totalCount} Active Widgets
            </span>
          </div>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            <span>Done</span>
            <kbd className={styles.escKey}>Esc</kbd>
          </button>
        </div>

        <div className={styles.sectionHeader}><span>1. Select Layout Structure</span></div>
        <div className={styles.layoutBuilder}>
          <div className={styles.bigPreviewFrame}>
            {activeTree
              ? renderTreeWireframe(activeTree)
              : <div className={styles.emptyCustomHint}>Drag a widget to start customizing</div>}
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

        <div className={styles.togglesSection}>
          <div className={styles.sectionHeader}>
            <span>2. Toggle Widget Visibility</span>
            <span className={styles.sectionSubtitle}>Turn widgets on or off — previews update live</span>
          </div>
          <div className={styles.togglesGrid}>
            {widgetKeys.map((id) => {
              const meta = WIDGET_METADATA[id]
              const isChecked = widgets[id] ?? false
              return (
                <div key={id} className={`${styles.toggleRow} ${isChecked ? styles.toggleRowActive : ''}`} onClick={() => toggleWidget(id)}>
                  <div className={styles.toggleLabelGroup}>
                    <span className={styles.toggleIcon}>{meta.icon}</span>
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
    </div>
  )
}
