import { NavigationStack, useMemo, type Color } from 'scripting'
import { useAccentColor } from '../hooks/useAccentColor'
import { GitHubAPI } from '../services/AppModel'
import { RepoListPage } from './RepoListPage'
import { useHost, type GitHubActionsHost } from '../integration/HostAdapter'

export function RootPage({ auth, onLogout }: { auth: { token: string; username: string }; onLogout: () => void }) {
  const host: GitHubActionsHost | undefined = useHost()
  const accentColor: Color = useAccentColor()
  const api: GitHubAPI = useMemo(() => new GitHubAPI(auth), [auth.token, auth.username])
  if (host?.navigation === 'inherit') return <RepoListPage api={api} onLogout={onLogout} />
  return (
    <NavigationStack tint={accentColor}>
      <RepoListPage api={api} onLogout={onLogout} />
    </NavigationStack>
  )
}
