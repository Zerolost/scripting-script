import { Script } from 'scripting'
import { createTransferPlan, transferFrame, dockedSignal, type TransferPlan } from './flowTransfer'
import { flowEdgePoint } from './flowEdgeTrail'
import { getFlowGeometry, flowNodeHeight, type FlowGeometry, type FlowPoint } from './flowGeometry'

let checks: number = 0
function assert(value: boolean, message: string): void {
  checks += 1
  if (!value) throw new Error(message)
}

try {
  for (const compact of [false, true]) {
    for (const moving of [[true], [false], [true, false, false, true], [false, true, true]]) {
      const plan: TransferPlan = createTransferPlan(moving, 1.4, compact)
      assert(plan.period > 0, '全静态计划仍有正周期')
      for (const slot of plan.slots) {
        const frame: ReturnType<typeof transferFrame> = transferFrame(plan, (slot.start + slot.end) / 2, 0.64)
        assert(frame.index === slot.index && frame.phase >= 0 && frame.phase < 1, '变长时隙保持原始顺序')
        for (const delta of [-1e-7, 0, 1e-7]) {
          const time: number = slot.end + delta
          const frame: ReturnType<typeof transferFrame> = transferFrame(plan, time, 0.64)
          const normalized: number = ((time % plan.period) + plan.period) % plan.period
          const matches: number = plan.slots.filter((item: typeof slot): boolean => normalized >= item.start && normalized < item.end).length
          assert(matches <= 1 && (frame.index >= 0 ? matches === 1 : matches === 0), '累计边界单焦点')
        }
      }
      assert(transferFrame(plan, plan.period - 0.01, 0.64).index === -1, '轮末休息')
      assert(transferFrame(plan, plan.period + 0.01, 0.64).index === 0, '下轮首节点')
    }
  }
  assert(createTransferPlan([true, false, true], 1, true).period < createTransferPlan([true, false, true], 1, false).period, '静态压缩缩短空等')
  for (const start of [0.45, 0.64, 0.8]) {
    for (const count of [2, 6, 10]) {
      const settle: number = (1 / start - 1) * 0.4
      const spacing: number = Math.min(0.045, settle / (count - 1))
      for (const smooth of [false, true]) {
        const head: ReturnType<typeof dockedSignal> = dockedSignal(1, smooth, settle)
        assert(head.position === 1 && head.opacity === 1, '入口头点可见而不提前消失')
        for (let frame: number = 0; frame <= 400; frame += 1) {
          const progress: number = frame / 400 / start
          for (let sample: number = 0; sample < count; sample += 1) {
            const signal: ReturnType<typeof dockedSignal> = dockedSignal(progress - sample * spacing, smooth, settle)
            assert(signal.position >= 0 && signal.position <= 1 && signal.opacity >= 0 && signal.opacity <= 1, '尾迹留在连线范围且透明度合法')
          }
        }
        for (let sample: number = 0; sample < count; sample += 1) assert(dockedSignal(1 / start - sample * spacing, smooth, settle).opacity === 0, '反馈结束前全部尾迹退场')
      }
    }
  }
  for (const width of [240, 320, 420]) {
    const geometry: FlowGeometry = getFlowGeometry(null, width, 168, 4, 0)
    for (let index: number = 0; index < 4; index += 1) {
      const node: typeof geometry.nodes[number] = geometry.nodes[index]
      const incoming: typeof geometry.segments[number] | undefined = geometry.segments[index - 1]
      let previous: FlowPoint = flowEdgePoint(node.x, node.y, node.width, flowNodeHeight, 0, incoming)
      if (incoming) assert(Math.hypot(previous.x - incoming.to.x, previous.y - incoming.to.y) <= 1.51, '掠光从真实入口内侧开始')
      for (let frame: number = 1; frame <= 300; frame += 1) {
        const point: FlowPoint = flowEdgePoint(node.x, node.y, node.width, flowNodeHeight, frame / 300, incoming)
        assert(point.x >= node.x && point.x <= node.x + node.width && point.y >= node.y && point.y <= node.y + flowNodeHeight, '光轨位于节点边界范围')
        assert(Math.hypot(point.x - previous.x, point.y - previous.y) < 2, '侧边、圆角和顶边连续无坐标跳跃')
        previous = point
      }
    }
  }
  console.log(`通过 ${checks} 项入口收束、接力计划与圆角光轨检查`)
  Script.exit({ passed: true, checks })
} catch (error: unknown) {
  console.error(String(error))
  Script.exit({ passed: false, error: String(error) })
}
