export type ActionPreferences = {
  widgetOrder: 'recent' | 'selection'
  runFilter: 'all' | 'attention' | 'active'
  branchScope: 'all' | 'default'
}

const key: string = 'github_actions_preferences_v1'
export function getActionPreferences(): ActionPreferences {
  const saved: Partial<ActionPreferences> | null = Storage.get<Partial<ActionPreferences>>(key)
  return {
    widgetOrder: saved?.widgetOrder === 'selection' ? 'selection' : 'recent',
    runFilter: saved?.runFilter === 'attention' || saved?.runFilter === 'active' ? saved.runFilter : 'all',
    branchScope: saved?.branchScope === 'default' ? 'default' : 'all',
  }
}
export function saveActionPreferences(value: ActionPreferences): boolean {
  return Storage.set(key, value)
}
export function filterActionRuns<T extends { status: string; conclusion?: string | null; head_branch?: string }>(runs: T[], preferences: ActionPreferences, branch: string): T[] {
  return runs.filter((run: T): boolean => {
    if (preferences.branchScope === 'default' && run.head_branch !== branch) return false
    if (preferences.runFilter === 'active') return run.status !== 'completed'
    if (preferences.runFilter === 'attention') return run.status !== 'completed' || ['failure', 'timed_out', 'action_required', 'startup_failure', 'stale'].includes(run.conclusion ?? '')
    return true
  })
}
