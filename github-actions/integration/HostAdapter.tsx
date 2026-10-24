import { useVisualSettings } from '../hooks/useVisualSettings'
import { createContext, useContext, type Color, type VirtualNode } from 'scripting'

export type GitHubActionsHostEvent =
  | { type: 'login'; username: string }
  | { type: 'logout' }
  | { type: 'workflowTriggered'; owner: string; repo: string; workflowId: number }
  | { type: 'widgetTargetsChanged'; targets: string[] }

export type GitHubActionsHost = {
  background?: 'inherit' | 'default'
  renderBackground?: () => VirtualNode
  accentColor?: Color
  textColor?: Color
  secondaryTextColor?: Color
  rowCornerRadius?: number
  rowSpacing?: number
  rowPadding?: number
  navigation?: 'own' | 'inherit'
  onEvent?: (event: GitHubActionsHostEvent) => void | Promise<void>
  refreshWidgets?: () => void | Promise<void>
}

export const HostContext = createContext<GitHubActionsHost | undefined>()

export function useHost(): GitHubActionsHost | undefined {
  useVisualSettings()
  return useContext(HostContext)
}

export function notifyHost(host: GitHubActionsHost | undefined, event: GitHubActionsHostEvent): void {
  if (!host?.onEvent) return
  void Promise.resolve().then(() => host.onEvent?.(event)).catch(() => {
    console.warn('宿主事件回调执行失败')
  })
}

export function refreshHostWidgets(host: GitHubActionsHost | undefined, fallback: () => void): void {
  if (!host?.refreshWidgets) {
    fallback()
    return
  }
  void Promise.resolve().then(() => host.refreshWidgets?.()).catch(() => {
    console.warn('宿主小组件刷新回调执行失败')
  })
}
