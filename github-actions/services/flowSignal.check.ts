import { Script } from 'scripting'
import { getFlowGeometry, type FlowGeometry, type FlowSegmentGeometry } from './flowGeometry'
import { signalPosition, nodeSweep, arrivalPulse } from './flowSignal'
import { flowArrival } from './flowArrival'

let checks: number = 0
function assert(value: boolean, message: string): void {
  checks += 1
  if (!value) throw new Error(message)
}

try {
  let previous: number = 0
  for (let index: number = 0; index <= 1000; index += 1) {
    const p: number = index / 1000
    const position: number = signalPosition(p)
    assert(position >= previous && position >= 0 && position <= 1, '移动单调且不越界')
    previous = position
    for (const echo of [false, true]) {
      const alpha: number = arrivalPulse(p, echo)
      assert(alpha >= 0 && alpha <= 1, '脉冲透明度范围')
    }
    const timing: ReturnType<typeof flowArrival> = flowArrival(p)
    if (p <= 0.64) assert(timing.arrival === 0, '抵达前无脉冲')
  }
  assert(signalPosition(0) === 0 && signalPosition(1) === 1, '移动端点')
  assert(signalPosition(-0.1) === -0.1 && signalPosition(1.1) === 1.1, '尾迹越界由淡出函数处理')
  for (const echo of [false, true]) {
    assert(arrivalPulse(0, echo) === 0 && arrivalPulse(1, echo) === 0, '周期边界透明')
    assert(arrivalPulse(-0.1, echo) === 0, '负进度透明')
  }
  assert(arrivalPulse(0.2, true) === 0 && arrivalPulse(0.7, true) > 0, '第二脉冲延后')
  for (const width of [240, 320, 420]) {
    const geometry: FlowGeometry = getFlowGeometry(null, width, 144, 4, 0)
    for (let index: number = 0; index < 4; index += 1) {
      const incoming: FlowSegmentGeometry | undefined = index > 0 ? geometry.segments[index - 1] : undefined
      const start: ReturnType<typeof nodeSweep> = nodeSweep(geometry.nodes[index], incoming, 0)
      const end: ReturnType<typeof nodeSweep> = nodeSweep(geometry.nodes[index], incoming, 1)
      assert(start.from.x === start.to.x && start.from.y === start.to.y, '掠光起点无跳跃')
      assert(end.to.y === geometry.nodes[index].y + 2, '掠光沿上沿')
      if (incoming?.dx && incoming.dx < 0) assert(end.to.x < start.to.x, '右侧入口向左掠光')
      if (incoming?.dy && incoming.dy > 0) assert(start.to.x === incoming.to.x, '顶部真实入口接入')
    }
    const solo: FlowGeometry = getFlowGeometry(null, width, 60, 1, 0)
    assert(solo.segments.length === 0 && nodeSweep(solo.nodes[0], undefined, 1).to.x > nodeSweep(solo.nodes[0], undefined, 0).to.x, '独立节点默认方向')
  }
  console.log(`通过 ${checks} 项方向光轨与回声脉冲检查`)
  Script.exit({ passed: true, checks })
} catch (error: unknown) {
  console.error(String(error))
  Script.exit({ passed: false, error: String(error) })
}
