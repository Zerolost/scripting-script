import type { Color } from 'scripting'
import { visual, visualGlass } from '../visual.config'

type RoundedRect = { type: 'rect'; cornerRadius: number; style: 'continuous' }

export const glassTokens = {
  get tint(): Color { return visual.colors['#0a84ff'] },
  get accent(): Color { return visual.colors['#0a84ff'] },
  get success(): Color { return visual.colors['#34c759'] },
  get warning(): Color { return visual.colors['#ff9f0a'] },
  get danger(): Color { return visual.colors['#ff3b30'] },
  get primaryText(): Color { return visual.colors.label },
  get secondaryText(): Color { return visual.colors.secondaryLabel },
  get tertiaryText(): Color { return visual.colors.secondaryLabel },
  get sectionText(): Color { return visual.colors.label },
  get glass(): UIGlass { return visualGlass('regular', true) },
  get glassClear(): UIGlass { return visualGlass(visual.glass.row, visual.glass.rowInteractive) },
  get glassTinted(): UIGlass { return visualGlass('regular', true).tint(visual.colors['#0a84ff']) },
  get glassSuccess(): UIGlass { return visualGlass('regular', true).tint(visual.colors['#34c759']) },
  get cardShape(): RoundedRect { return { type: 'rect', cornerRadius: visual.radii[22], style: 'continuous' } },
  get rowShape(): RoundedRect { return { type: 'rect', cornerRadius: visual.radii[18], style: 'continuous' } },
  pillShape: { type: 'capsule', style: 'continuous' } as const,
} as const
