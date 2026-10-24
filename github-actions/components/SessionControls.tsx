import { Button, Script, VStack, Image, useRef, useState, type Color } from 'scripting'
import { visual } from '../visual.config'
import { useAccentColor } from '../hooks/useAccentColor'
import { MotionRow, MotionText as Text, animateChange } from './Motion'

export function ExitScriptButton({ preview = false }: { preview?: boolean } = {}) {
  const accent: Color = useAccentColor()
  const [exited, setExited] = useState<boolean>(false)
  return <Button title={exited ? '已演示退出' : '退出脚本'} systemImage={visual.icons['xmark']} tint={accent} action={() => {
    if (preview) animateChange(() => setExited(true))
    else Script.exit()
  }} />
}

export function LogoutButton({ onLogout, preview = false }: { onLogout?: () => void; preview?: boolean }) {
  const pending = useRef<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const confirmLogout = async (): Promise<void> => {
    if (pending.current) return
    pending.current = true
    try {
      const confirmed: boolean = await Dialog.confirm({
        title: '退出 GitHub 登录？',
        message: preview ? '这是确认框预览，不会退出真实账户。' : '将清除本脚本保存的登录凭据。下次需要重新登录，小组件选择和外观设置会保留。',
        cancelLabel: '取消',
        confirmLabel: '退出登录',
      })
      if (!confirmed) return
      if (preview) animateChange(() => setMessage('已演示确认退出，真实账户保持登录。'))
      else onLogout?.()
    } catch {
      animateChange(() => setMessage('退出登录未完成，请重试。'))
    } finally {
      pending.current = false
    }
  }
  return <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
    <Button buttonStyle="plain" tint={visual.colors['#ff3b30']} action={confirmLogout}>
      <MotionRow spacing={visual.spacing[10]}>
        <Image systemName={visual.icons['rectangle.portrait.and.arrow.right']} font={visual.fontSizes[20]} foregroundStyle={visual.colors['#ff3b30']} frame={{ width: visual.sizes[32], height: visual.sizes[32] }} />
        <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <Text style={{ fontSize: visual.fontSizes[16], fontWeight: visual.typography.semibold }} foregroundStyle={visual.colors['#ff3b30']}>退出登录</Text>
          <Text style={{ fontSize: visual.fontSizes[12] }} foregroundStyle={visual.colors.secondaryLabel}>清除登录凭据，保留工作流选择与外观</Text>
        </VStack>
      </MotionRow>
    </Button>
    {message ? <Text style={{ fontSize: visual.fontSizes[12] }} foregroundStyle={visual.colors.secondaryLabel} contentTransition={visual.textTransition}>{message}</Text> : null}
  </VStack>
}
