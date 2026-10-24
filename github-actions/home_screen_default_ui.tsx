import { App } from './pages/App'
import type { GitHubActionsHost } from './integration/HostAdapter'

export type { GitHubActionsHost, GitHubActionsHostEvent } from './integration/HostAdapter'

export default function GitHubActionsHome({ host }: { host?: GitHubActionsHost } = {}) {
  return <App host={host} />
}
