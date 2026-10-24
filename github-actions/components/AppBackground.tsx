import { visual } from '../visual.config'
import { Rectangle } from 'scripting'
import { useHost, type GitHubActionsHost } from '../integration/HostAdapter'

export function AppBackground() {
  const host: GitHubActionsHost | undefined = useHost()
  if (host?.renderBackground) return host.renderBackground()
  if (host?.background === 'inherit') return null
  if (visual.background.render) return visual.background.render()
  if (!visual.background.enabled) return null
  return (
    <Rectangle
      fill={{
        light: {
          colors: visual.background.light,
          startPoint: visual.background.startPoint,
          endPoint: visual.background.endPoint,
        },
        dark: {
          colors: visual.background.dark,
          startPoint: visual.background.startPoint,
          endPoint: visual.background.endPoint,
        },
      }}
      frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}
      ignoresSafeArea={true}
      allowsHitTesting={false}
    />
  )
}
