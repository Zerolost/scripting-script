import type { Font, WidgetFamily } from 'scripting'
import type { visual } from '../visual.config'

export type WidgetConfig = typeof visual.widget
export type WidgetLayout = WidgetConfig['large']
export type WidgetSize = 'small' | 'medium' | 'large' | 'extraLarge' | 'extraLargePortrait'
export type WidgetDisplaySize = { width: number; height: number }
export type WidgetLayoutPlan = {
  size: WidgetSize
  layout: WidgetLayout
  isSmall: boolean
  isLarge: boolean
  columns: number
  itemCount: number
  rows: number
  historyCount: number
  showNext: boolean
  titleLineLimit: number
  compact: boolean
}

function fontHeight(font: Font): number {
  const heights: Record<string, number> = { largeTitle: 41, title: 34, title2: 28, title3: 25, headline: 22, subheadline: 20, body: 22, callout: 21, footnote: 18, caption: 16, caption2: 14 }
  return typeof font === 'string' ? (heights[font] ?? 22) : 22
}

export function resolveWidgetLayout(family: WidgetFamily, totalCount: number, config: WidgetConfig, displaySize?: WidgetDisplaySize): WidgetLayoutPlan {
  const size: WidgetSize = family === 'systemSmall' ? 'small' : family === 'systemLarge' ? 'large' : family === 'systemExtraLarge' ? 'extraLarge' : family === 'systemExtraLargePortrait' ? 'extraLargePortrait' : 'medium'
  const isLarge: boolean = size === 'large' || size === 'extraLarge' || size === 'extraLargePortrait'
  const itemCount: number = Math.min(isLarge ? 8 : 1, Math.max(0, Number.isFinite(totalCount) ? Math.floor(totalCount) : 0))
  const columns: number = size === 'extraLarge' ? 2 : 1
  const rows: number = Math.ceil(itemCount / columns)
  const source: WidgetLayout = config[size]
  const layout: WidgetLayout = { ...source, runPad: { ...source.runPad } }
  const extra: boolean = size === 'extraLarge' || size === 'extraLargePortrait'
  let historyCount: number = size === 'extraLarge'
    ? (rows <= 2 ? config.history.extraLargeFew : config.history.extraLargeMany)
    : size === 'extraLargePortrait'
      ? (itemCount <= 3 ? config.history.portraitFew : config.history.portraitMany)
      : size === 'large'
        ? (itemCount <= 2 ? config.history.largeFew : itemCount === 3 ? config.history.largeThree : config.history.largeMany)
        : config.history.compact
  historyCount = config.showHistory ? Math.max(0, Math.floor(historyCount)) : 0
  let showNext: boolean = config.showNext && (!isLarge || itemCount <= (extra ? config.nextVisibleMaxExtraLargeTargets : config.nextVisibleMaxLargeTargets))
  if (isLarge && rows >= 4) {
    layout.itemSpacing = Math.min(layout.itemSpacing, 3)
    layout.outerSpacing = Math.min(layout.outerSpacing, 6)
    layout.titleFont = 'footnote'
    layout.bodyFont = 'caption'
    layout.historyFont = 'caption2'
  }
  let compact: boolean = false
  if (isLarge && rows > 0) {
    const height: number = displaySize && Number.isFinite(displaySize.height) && displaySize.height > 0 ? displaySize.height : size === 'extraLargePortrait' ? 764 : 364
    const available: number = Math.max(0, height - layout.outerPad * 2 - 32 - Math.max(fontHeight(layout.titleFont), layout.headerIcon) - layout.outerSpacing)
    const perItem: number = Math.max(0, (available - (rows - 1) * (layout.outerSpacing + 1)) / rows)
    const title: number = Math.max(fontHeight(layout.titleFont), layout.runIcon + layout.runPad.vertical * 2)
    const status: number = Math.max(fontHeight(layout.bodyFont), layout.runIcon + 8)
    const base: number = title + status + layout.itemSpacing
    const next: number = status + layout.itemSpacing
    compact = base > perItem
    if (compact) {
      layout.titleFont = 'caption'
      layout.itemSpacing = Math.min(layout.itemSpacing, 2)
      layout.outerSpacing = Math.min(layout.outerSpacing, 4)
      showNext = false
      historyCount = 0
    } else {
      if (base + next > perItem) showNext = false
      const historyHeight: number = Math.max(fontHeight(layout.historyFont), layout.runIcon + 8) + layout.itemSpacing
      historyCount = Math.min(historyCount, Math.max(0, Math.floor((perItem - base - (showNext ? next : 0)) / historyHeight)))
    }
  }
  return { size, layout, isSmall: size === 'small', isLarge, columns, itemCount, rows, historyCount, showNext, titleLineLimit: isLarge ? 1 : 2, compact }
}


