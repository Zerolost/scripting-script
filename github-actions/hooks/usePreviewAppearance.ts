import { useColorScheme, useState } from 'scripting'
import { animateChange } from '../components/Motion'

export type PreviewAppearance = 'system' | 'light' | 'dark'

export function usePreviewAppearance() {
  const systemScheme: 'light' | 'dark' = useColorScheme()
  const [mode, setMode] = useState<PreviewAppearance>('system')
  const scheme: 'light' | 'dark' = mode === 'system' ? systemScheme : mode
  function changeMode(next: string): void {
    if (next === 'system' || next === 'light' || next === 'dark') {
      animateChange(() => setMode(next))
    }
  }
  return { mode, scheme, dark: scheme === 'dark', changeMode }
}
