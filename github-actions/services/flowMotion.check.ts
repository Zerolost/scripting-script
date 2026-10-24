import { Script } from 'scripting'
import { flowOpacity, flowPhase } from './flowMotion'

let checks: number = 0
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
  checks += 1
}

check(flowOpacity(0) === 0 && flowOpacity(1) === 0, '端点必须完全透明')
check(flowOpacity(-0.1) === 0 && flowOpacity(1.1) === 0, '尾迹越界必须透明')
check(flowOpacity(0.5) === 1, '中段保持可见')
for (let count: number = 2; count <= 10; count += 1) {
  for (let side: number = -1; side <= 1; side += 2) {
    const phase: number = flowPhase(1.4 + side * 0.00001, 1.4)
    let total: number = 0
    for (let index: number = 0; index < count; index += 1) {
      total += flowOpacity(phase - index * 0.045) * flowOpacity(phase) * (1 - index / count)
    }
    check(total < 0.00001, `循环交界尾迹不透明：${count}/${side}`)
  }
}
check(Math.abs(flowPhase(2.8, 1.4, 0.17) - 0.17) < 0.000001, '错峰周期错误')
check(Number.isFinite(flowPhase(1, 0)), '非法周期应安全回退')
console.log(`PASS ${checks} 项流光边界与尾迹检查`)
Script.exit({ passed: checks })
