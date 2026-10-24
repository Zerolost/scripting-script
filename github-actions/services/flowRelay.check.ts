import { Script } from 'scripting'
import { flowRelayPhase } from './flowRelay'
import { flowArrival } from './flowArrival'
import { flowStatusVisual } from './flowStatusVisual'

let checks: number = 0
function assert(value: boolean, message: string): void {
  checks += 1
  if (!value) throw new Error(message)
}

try {
  for (const count of [1, 2, 5, 12]) {
    for (const duration of [0.4, 1.4, 5]) {
      for (const start of [0.45, 0.64, 0.8]) {
        const slot: number = duration * 0.72
        const period: number = count * slot + duration * 0.4
        const samples: number[] = []
        for (let frame: number = 0; frame <= 200; frame += 1) samples.push(period * frame / 200)
        for (let index: number = 0; index <= count; index += 1) {
          for (const delta of [-1e-7, 0, 1e-7]) samples.push(index * slot + delta)
        }
        for (const time of samples) {
          let active: number = 0
          for (let index: number = 0; index < count; index += 1) {
            const phase: number = flowRelayPhase(time, duration, index, count, 0, start)
            assert(phase === -1 || (phase >= 0 && phase < 1), '相位范围')
            if (phase >= 0) active += 1
          }
          assert(active <= 1, '同一任务最多一个活跃步骤')
        }
        for (let index: number = 0; index < count; index += 1) {
          const phase: number = flowRelayPhase(index * slot + slot / 2, duration, index, count, 0, start)
          assert(Math.abs(phase - (index === 0 ? start + (1 - start) / 2 : 0.5)) < 1e-8, '步骤按顺序激活')
        }
        assert(flowArrival(flowRelayPhase(slot / 2, duration, 0, count, 0, start), start).arrival > 0.99, '首节点直接进入反馈阶段')
        for (let index: number = 0; index < count; index += 1) {
          assert(flowRelayPhase(count * slot + duration * 0.2, duration, index, count, 0, start) === -1, '轮末全部休息')
        }
        assert(flowRelayPhase(period + slot / 2, duration, 0, count, 0, start) >= start, '下轮重新从首节点淡入')
      }
    }
  }
  const results: (string | null)[] = ['success', 'skipped', null, 'failure', 'success']
  const visible: number[] = []
  for (let index: number = 0; index < results.length; index += 1) {
    const state: { status: string; conclusion: string | null } = { status: index === 2 ? 'queued' : 'completed', conclusion: results[index] }
    const phase: number = flowRelayPhase(index * 0.72 + 0.36, 1, index, results.length)
    if (phase >= 0 && flowStatusVisual(state).motion !== 'none') visible.push(index)
  }
  assert(visible.join(',') === '0,3,4', '跳过与等待不发光，失败后的清理仍播放')
  assert(flowRelayPhase(NaN, 1, 0, 1) === -1 && flowRelayPhase(1, Infinity, 0, 1) === -1, '无效时间安全退出')
  assert(flowRelayPhase(0, 1, -1, 1) === -1 && flowRelayPhase(0, 1, 1, 1) === -1 && flowRelayPhase(0, 1, 0, 0) === -1, '无效索引安全退出')
  console.log(`通过 ${checks} 项接力互斥、顺序与循环边界检查`)
  Script.exit({ passed: true, checks })
} catch (error: unknown) {
  console.error(String(error))
  Script.exit({ passed: false, error: String(error) })
}
