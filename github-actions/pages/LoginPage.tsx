import { useAccentColor } from '../hooks/useAccentColor'
import type { Color } from 'scripting'
import { surface, glassButtonStyle } from '../design/AllPatternDesign'
import { visual } from '../visual.config'
import { TextField, SecureField, Button, HStack, VStack, Image, Link, ScrollView, useState, useCallback, useColorScheme, ColorScheme } from "scripting"
import { MotionText as Text, animateChange, motion, motionTransition } from "../components/Motion"
import { AppBackground } from "../components/AppBackground"
import { BrandIcon } from "../components/BrandIcon"
import { useHost, type GitHubActionsHost } from '../integration/HostAdapter'
import { storageSet, errorMessage, GitHubAPI } from "../services/AppModel"

export function LoginPage({ onLogin }: { onLogin: (auth: { token: string; username: string }) => void }) {
  const [username, setUsername] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const colorScheme: ColorScheme = useColorScheme()
  const accentColor: Color = useAccentColor()
  const host: GitHubActionsHost | undefined = useHost()

  const handleLogin: () => Promise<void> = useCallback(async (): Promise<void> => {
    if (!username.trim() || !token.trim()) {
      animateChange(() => setError('请填写用户名和 Token'))
      return
    }
    animateChange(() => {
      setLoading(true)
      setError('')
    })
    try {
      const api: GitHubAPI = new GitHubAPI({ token: token.trim(), username: username.trim() })
      await api.getRepos()
      storageSet('github_username', username.trim())
      storageSet('github_token', token.trim())
      onLogin({ token: token.trim(), username: username.trim() })
    } catch (err: any) {
      animateChange(() => setError(errorMessage(err, '登录失败，请检查 Token 权限')))
    } finally {
      animateChange(() => setLoading(false))
    }
  }, [username, token, onLogin])

  return (
    <ScrollView transition={motionTransition} background={<AppBackground />}>
      <VStack padding={visual.spacing[20]} spacing={visual.spacing[20]} alignment="center" animation={{ animation: motion, value: `${loading}|${error}` }}>
        <VStack spacing={visual.spacing[20]} alignment="center" frame={{ maxWidth: 'infinity' }}>
          <VStack alignment="center" spacing={visual.spacing[14]} padding={{ top: visual.spacing[40], bottom: visual.spacing[4] }}>
            <BrandIcon />
            <Text style={{ fontSize: visual.fontSizes[28], fontWeight: visual.typography.bold, color: host?.textColor ?? (colorScheme === 'dark' ? visual.colors['#f5f5f7'] : visual.colors['#1c1c1e']) }}>{visual.login.title}</Text>
            <Text style={{ fontSize: visual.fontSizes[15], color: host?.secondaryTextColor ?? (colorScheme === 'dark' ? visual.colors['#a7a9b2'] : visual.colors['#6e7480']) }}>{visual.login.subtitle}</Text>
          </VStack>

          <VStack spacing={visual.spacing[16]} frame={{ maxWidth: 'infinity' }}>
            <VStack alignment="leading" spacing={visual.spacing[7]} frame={{ maxWidth: 'infinity' }}>
              <Text style={{ fontSize: visual.fontSizes[15], color: host?.secondaryTextColor ?? (colorScheme === 'dark' ? visual.colors['#a7a9b2'] : visual.colors['#6e7480']) }}>{visual.text['用户名']}</Text>
              <HStack
                padding={{ horizontal: visual.spacing[16], vertical: visual.spacing[10] }}
                frame={{ maxWidth: 'infinity', minHeight: visual.sizes[52], alignment: 'leading' }}
                clipShape={{ type: 'rect', cornerRadius: visual.radii[18], style: 'continuous' }}
                {...surface(visual.glass.input, { type: 'rect', cornerRadius: visual.radii[18], style: 'continuous' }, true)}
                shadow={{ color: colorScheme === 'dark' ? visual.colors['rgba(0,0,0,0.42)'] : visual.colors['rgba(72,88,120,0.18)'], radius: visual.shadow.radius, y: visual.shadow.y }}
              >
                <TextField
                  title=""
                  value={username}
                  onChanged={setUsername}
                  prompt="your-username"
                  textFieldStyle="plain"
                  textInputAutocapitalization="never"
                />
              </HStack>
            </VStack>

            <VStack alignment="leading" spacing={visual.spacing[7]} frame={{ maxWidth: 'infinity' }}>
              <Text style={{ fontSize: visual.fontSizes[15], color: host?.secondaryTextColor ?? (colorScheme === 'dark' ? visual.colors['#a7a9b2'] : visual.colors['#6e7480']) }}>{visual.text.Token}</Text>
              <HStack
                padding={{ horizontal: visual.spacing[16], vertical: visual.spacing[10] }}
                frame={{ maxWidth: 'infinity', minHeight: visual.sizes[52], alignment: 'leading' }}
                clipShape={{ type: 'rect', cornerRadius: visual.radii[18], style: 'continuous' }}
                {...surface(visual.glass.input, { type: 'rect', cornerRadius: visual.radii[18], style: 'continuous' }, true)}
                shadow={{ color: colorScheme === 'dark' ? visual.colors['rgba(0,0,0,0.42)'] : visual.colors['rgba(72,88,120,0.18)'], radius: visual.shadow.radius, y: visual.shadow.y }}
              >
                <SecureField
                  title=""
                  value={token}
                  onChanged={setToken}
                  prompt="ghp_xxxxxxxx"
                />
              </HStack>
            </VStack>

            {error ? <Text style={{ color: visual.colors['#ff3b30'], textAlign: 'center', fontSize: visual.fontSizes[13] }}>{error}</Text> : null}
            <Button
              title={loading ? visual.text['验证中...'] : visual.text['绑定账号']}
              action={handleLogin}
              disabled={loading}
              buttonStyle={glassButtonStyle(true)}
              tint={accentColor}
              padding={{ vertical: visual.spacing[12] }}
              frame={{ maxWidth: 'infinity' }}
              font={visual.fontSizes[16]}
              fontWeight={visual.typography.bold}
            />
          </VStack>

          <VStack alignment="center" spacing={visual.spacing[10]} padding={{ top: visual.spacing[8] }}>
            <Text style={{ fontSize: visual.fontSizes[12], color: host?.secondaryTextColor ?? (colorScheme === 'dark' ? visual.colors['#a7a9b2'] : visual.colors['#6e7480']), textAlign: 'center' }}>
              {visual.login.permission}
            </Text>
            <Link tint={accentColor} url="https://github.com/settings/tokens">
              <HStack spacing={visual.spacing[4]} alignment="center">
                <Text style={{ fontSize: visual.fontSizes[12], color: accentColor, textAlign: 'center', fontWeight: visual.typography.medium }}>
                  {visual.login.help}
                </Text>
                <Image systemName={visual.icons['arrow.up.right']} frame={{ width: visual.sizes[11], height: visual.sizes[11] }} foregroundStyle={accentColor} />
              </HStack>
            </Link>
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
  )
}
