import type { Color } from 'scripting'
import { useHost } from '../integration/HostAdapter'
import { visual } from '../visual.config'

export function useAccentColor(): Color {
  return useHost()?.accentColor ?? visual.colors['#0a84ff']
}
