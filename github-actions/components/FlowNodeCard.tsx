import { VStack, HStack, Text, Image, type Color } from 'scripting'
import { jobStatusIcon, jobStatusInfo } from '../services/AppModel'
import { flowNodeHeight } from '../services/flowGeometry'
import { visual } from '../visual.config'
import { surface } from '../design/AllPatternDesign'
import { stepElapsed } from './FlowEnergy'

type FlowState = { status: string; conclusion: string | null; started_at?: string | null; completed_at?: string | null }

export function FlowNodeCard({ title, number, state }: { title: string; number?: number; state: FlowState }) {
  const icon: { systemName: string; color: Color } = jobStatusIcon(state)
  const info: ReturnType<typeof jobStatusInfo> = jobStatusInfo(state)
  const elapsed: string = visual.flow.showTiming && state.conclusion !== 'skipped' ? stepElapsed(state) : ''
  return <VStack alignment="leading" spacing={5} padding={8} frame={{ maxWidth: 'infinity', minHeight: flowNodeHeight, maxHeight: flowNodeHeight, alignment: 'leading' }} {...surface('clear', { type: 'rect', cornerRadius: 12 })}>
    <HStack spacing={4} frame={{ maxWidth: 'infinity' }}>
      <Text font={visual.flow.detailFont * 0.85} fontWeight={visual.typography.medium} foregroundStyle={visual.colors.secondaryLabel} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{number === undefined ? 'JOB' : `STEP ${String(number).padStart(2, '0')}`}</Text>
      <Image systemName={icon.systemName} foregroundStyle={icon.color} font={visual.flow.detailFont * 0.85} />
      <Text font={visual.flow.detailFont * 0.85} foregroundStyle={icon.color} lineLimit={1} contentTransition={visual.textTransition}>{`${info.text}${elapsed ? ` · ${elapsed}` : ''}`}</Text>
    </HStack>
    <Text font={visual.flow.titleFont} fontWeight={visual.typography.medium} foregroundStyle={visual.colors.label} lineLimit={2} frame={{ maxWidth: 'infinity', minHeight: 34, alignment: 'leading' }}>{title}</Text>
  </VStack>
}
