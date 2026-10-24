import { Script } from 'scripting'
import { drawFlowBase, getFlowGeometry, type FlowBaseContext, type FlowGeometry, type FlowNodeGeometry } from './flowGeometry'
import { flowOpacity, flowPhase } from './flowMotion'

type Command = (string | number)[]

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function recorder(commands: Command[]): FlowBaseContext {
  return {
    save: (): void => { commands.push(['save']) },
    restore: (): void => { commands.push(['restore']) },
    set lineCap(value: 'butt' | 'round' | 'square') { commands.push(['lineCap', value]) },
    set globalAlpha(value: number) { commands.push(['globalAlpha', value]) },
    beginPath: (): void => { commands.push(['beginPath']) },
    moveTo: (x: number, y: number): void => { commands.push(['moveTo', x, y]) },
    lineTo: (x: number, y: number): void => { commands.push(['lineTo', x, y]) },
    stroke: (): void => { commands.push(['stroke']) },
    arc: (x: number, y: number, radius: number, start: number, end: number): void => { commands.push(['arc', x, y, radius, start, end]) },
    fill: (): void => { commands.push(['fill']) }
  }
}

function originalBase(ctx: FlowBaseContext, width: number, count: number): void {
  const half: number = width / 2
  for (let index: number = 1; index < count; index += 1) {
    const row: number = Math.floor(index / 2)
    const previousRow: number = Math.floor((index - 1) / 2)
    const y: number = previousRow * 84 + 30
    const forward: boolean = row % 2 === 0
    const x: number = row % 2 === 1 ? half * 1.5 + 6 : half * 0.5 - 6
    const from: { x: number; y: number } = row === previousRow ? { x: half + (forward ? -12 : 12), y } : { x, y: previousRow * 84 + 60 }
    const to: { x: number; y: number } = row === previousRow ? { x: half + (forward ? 12 : -12), y } : { x, y: row * 84 }
    ctx.save()
    ctx.lineCap = 'round'
    ctx.globalAlpha = 0.2
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    for (const point of [from, to]) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

let cases: number = 0
for (const width of [160, 320, 393, 768]) {
  for (let count: number = 0; count <= 64; count += 1) {
    for (const lane of [0, 1, 7]) {
      const height: number = Math.max(1, Math.ceil(count / 2)) * 84 - 24
      const geometry: FlowGeometry = getFlowGeometry(null, width, height, count, lane)
      assert(geometry.nodes.length === count && geometry.segments.length === Math.max(0, count - 1), '节点或连线数量错误')
      assert(getFlowGeometry(geometry, width, height, count, lane) === geometry, '相同尺寸未复用缓存')
      assert(getFlowGeometry(geometry, width + 1, height, count, lane) !== geometry, '宽度改变未失效')
      assert(getFlowGeometry(geometry, width, height + 1, count, lane) !== geometry, '高度改变未失效')
      assert(getFlowGeometry(geometry, width, height, count + 1, lane) !== geometry, '步骤数量改变未失效')
      assert(getFlowGeometry(geometry, width, height, count, lane + 1) !== geometry, '泳道改变未失效')
      for (let index: number = 0; index < count; index += 1) {
        const node: FlowNodeGeometry = geometry.nodes[index]
        const row: number = Math.floor(index / 2)
        const column: number = row % 2 === 0 ? index % 2 : 1 - index % 2
        assert(node.x === column * (width / 2 + 12) && node.y === row * 84, '蛇形节点位置改变')
        assert(node.width === (count === 1 ? width : width / 2 - 12), '单节点或双列宽度改变')
        assert(node.offset === index * 0.17 + lane * 0.23, '相位偏移改变')
      }
      for (const segment of geometry.segments) {
        const from: FlowNodeGeometry = geometry.nodes[segment.nodeIndex - 1]
        const to: FlowNodeGeometry = geometry.nodes[segment.nodeIndex]
        if (from.y === to.y) {
          assert(segment.from.y === from.y + 30 && segment.to.y === to.y + 30, '横线未对齐节点中心')
          assert(segment.dx === (from.x < to.x ? 24 : -24) && segment.dy === 0, '横线方向改变')
        } else {
          assert(segment.from.x === from.x + from.width / 2 && segment.to.x === to.x + to.width / 2, '竖线未对齐列中心')
          assert(segment.from.y === from.y + 60 && segment.to.y === to.y && segment.dy === 24, '竖线端点改变')
        }
      }
      const previous: Command[] = []
      const current: Command[] = []
      originalBase(recorder(previous), width, count)
      drawFlowBase(recorder(current), geometry.segments)
      assert(JSON.stringify(previous) === JSON.stringify(current), '静态命令或参数与原版不一致')
      assert(current.length === 14 * Math.max(0, count - 1), '静态命令数量错误')
      cases += 1
    }
  }
}

let opacityCases: number = 0
for (const time of [0, 0.000001, 1.5, 3.999999, 4, 4.000001, 36000]) {
  for (const offset of [0, 0.17, 1.38]) {
    const phase: number = flowPhase(time, 4, offset)
    const phaseOpacity: number = flowOpacity(phase)
    for (let index: number = 0; index < 24; index += 1) {
      const position: number = phase - index * 0.045
      assert(flowOpacity(position) * phaseOpacity * (1 - index / 24) === flowOpacity(position) * flowOpacity(phase) * (1 - index / 24), '尾迹透明度改变')
      opacityCases += 1
    }
  }
}
assert(flowOpacity(0) === 0 && flowOpacity(1) === 0, '循环端点未归零')
assert(flowOpacity(0.000001) < 0.000001 && flowOpacity(0.999999) < 0.000001, '循环衔接不平滑')
const sample: FlowGeometry = getFlowGeometry(null, 393, 480, 12, 0)
const commands: Command[] = []
drawFlowBase(recorder(commands), sample.segments)
Script.exit({ geometryCases: cases, opacityCases, sampleSteps: 12, staticCommandsMovedPerFrame: commands.length, staticPrimitivesMovedPerFrame: sample.segments.length * 3 })
