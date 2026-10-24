import { Script } from 'scripting'
import { flowArrival, type FlowArrival } from './flowArrival'

let checks: number = 0
for (const start of [0.45, 0.64, 0.8]) {
  for (let index: number = 0; index <= 1000; index += 1) {
    const phase: number = index / 1000
    const value: FlowArrival = flowArrival(phase, start)
    if (phase <= start && value.arrival !== 0) throw new Error('光点抵达前不得出现入口光晕')
    if (value.arrival < 0 || value.arrival > 1) throw new Error('光晕透明度越界')
    if ((phase === 0 || phase === 1) && value.arrival !== 0) throw new Error('循环边界必须无光晕')
    checks += 1
  }
  if (flowArrival(start, start).travel !== 1) throw new Error('抵达时光点必须位于目标端口')
  if (flowArrival((start + 1) / 2, start).arrival < 0.99) throw new Error('抵达后应有完整扩散脉冲')
  checks += 2
}
console.log(`通过 ${checks} 项抵达时序检查`)
Script.exit()
