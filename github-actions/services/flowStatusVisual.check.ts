import { Script } from 'scripting'
import { flowStatusVisual, type FlowStatus, type FlowStatusVisual } from './flowStatusVisual'

const cases: { state: FlowStatus; expected: FlowStatusVisual }[] = [
  { state: { status: 'completed', conclusion: 'success' }, expected: { tone: 'success', motion: 'travel', dashed: false } },
  ...['failure', 'timed_out', 'action_required', 'startup_failure'].map((conclusion: string) => ({ state: { status: 'completed', conclusion }, expected: { tone: 'failure', motion: 'pulse', dashed: false } as FlowStatusVisual })),
  ...['skipped', 'cancelled', 'neutral', 'stale', 'unknown', null].map((conclusion: string | null) => ({ state: { status: 'completed', conclusion }, expected: { tone: 'inactive', motion: 'none', dashed: true } as FlowStatusVisual })),
  { state: { status: 'in_progress', conclusion: null }, expected: { tone: 'running', motion: 'travel', dashed: false } },
  { state: { status: 'queued', conclusion: null }, expected: { tone: 'waiting', motion: 'none', dashed: true } },
  { state: { status: 'waiting', conclusion: null }, expected: { tone: 'waiting', motion: 'none', dashed: true } },
]
for (const entry of cases) {
  const actual: FlowStatusVisual = flowStatusVisual(entry.state)
  if (JSON.stringify(actual) !== JSON.stringify(entry.expected)) throw new Error(`状态策略错误: ${JSON.stringify(entry.state)}`)
}
const sequence: string[] = ['success', 'failure', 'skipped', 'success'].map((conclusion: string) => flowStatusVisual({ status: 'completed', conclusion }).motion)
if (sequence.join(',') !== 'travel,pulse,none,travel') throw new Error('失败后的清理成功不应被截断')
console.log(`通过 ${cases.length + 1} 项状态策略检查，包含失败后清理成功`)
Script.exit()
