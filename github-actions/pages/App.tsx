import { VisualRevisionContext, useVisualRevision } from '../hooks/useVisualSettings'
import { visual } from '../visual.config'
import { Widget, VStack, useState, useEffect } from 'scripting'
import { HostContext, useHost, notifyHost, refreshHostWidgets, type GitHubActionsHost } from '../integration/HostAdapter'
import { storageGet, storageRemove } from '../services/AppModel'
import { LoginPage } from './LoginPage'
import { RootPage } from './RootPage'
import { MotionText as Text, animateChange } from '../components/Motion'

type Auth = { token: string; username: string }

export function App({ host }: { host?: GitHubActionsHost } = {}) {
  const revision: number = useVisualRevision()
  return (
    <VisualRevisionContext.Provider value={revision}>
      <HostContext.Provider value={host}>
        <VStack spacing={visual.spacing[0]} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }} tint={host?.accentColor ?? visual.colors['#0a84ff']}>
          <AppContent />
        </VStack>
      </HostContext.Provider>
    </VisualRevisionContext.Provider>
  )
}

function AppContent() {
  const host: GitHubActionsHost | undefined = useHost()
  const [auth, setAuth] = useState<Auth | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    refreshHostWidgets(host, () => Widget.reloadAll())
    function loadAuth(): void {
      try {
        const username: string | null = storageGet('github_username')
        const token: string | null = storageGet('github_token')
        if (username && token) {
          setAuth({ username, token })
        }
      } catch (_) { }
      setLoading(false)
    }
    loadAuth()
  }, [])

  const handleLogin: (authData: Auth) => void = (authData: Auth) => {
    animateChange(() => setAuth(authData))
    notifyHost(host, { type: 'login', username: authData.username })
  }

  const handleLogout: () => void = () => {
    storageRemove('github_username')
    storageRemove('github_token')
    animateChange(() => setAuth(null))
    notifyHost(host, { type: 'logout' })
  }

  if (loading) return <Text>{visual.text['加载中...']}</Text>
  if (!auth) return <LoginPage onLogin={handleLogin} />

  return <RootPage auth={auth} onLogout={handleLogout} />
}
