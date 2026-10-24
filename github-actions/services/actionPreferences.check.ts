import { Script } from 'scripting'
import { filterActionRuns, type ActionPreferences } from './actionPreferences'
const runs: { status: string; conclusion: string | null; head_branch: string }[] = [
  { status: 'completed', conclusion: 'success', head_branch: 'main' },
  { status: 'completed', conclusion: 'failure', head_branch: 'main' },
  { status: 'in_progress', conclusion: null, head_branch: 'dev' },
  { status: 'queued', conclusion: null, head_branch: 'main' },
]
const preferences: ActionPreferences = { widgetOrder: 'recent', runFilter: 'all', branchScope: 'all' }
const checks: boolean[] = [
  filterActionRuns(runs, preferences, 'main').length === 4,
  filterActionRuns(runs, { ...preferences, runFilter: 'attention' }, 'main').length === 3,
  filterActionRuns(runs, { ...preferences, runFilter: 'active' }, 'main').length === 2,
  filterActionRuns(runs, { ...preferences, runFilter: 'attention', branchScope: 'default' }, 'main').length === 2,
  filterActionRuns(runs, { ...preferences, runFilter: 'active', branchScope: 'default' }, 'main').length === 1,
  runs.length === 4,
]
if (checks.some((passed: boolean) => !passed)) throw new Error('Actions 筛选检查失败')
console.log(`PASS ${checks.length} 项 Actions 筛选检查`)
Script.exit({ passed: checks.length })
