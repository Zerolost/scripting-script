import { HStack, Image } from 'scripting'
import { MotionText as Text } from './Motion'
import { visual } from '../visual.config'
import { jobStatusInfo, jobStatusIcon, durationText, type Job } from '../services/AppModel'

type Step = NonNullable<Job['steps']>[number]

export function RunStepRow({ step, numberWidth }: { step: Step; numberWidth: number }) {
  const status: ReturnType<typeof jobStatusInfo> = jobStatusInfo(step)
  const icon: ReturnType<typeof jobStatusIcon> = jobStatusIcon(step)
  const duration: string | null = durationText(step.started_at, step.completed_at || undefined)
  return (
    <HStack spacing={visual.spacing[6]} alignment="center" frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
      <Text font={visual.fontSizes[11]} foregroundStyle={visual.colors.secondaryLabel} frame={{ width: numberWidth, alignment: 'trailing' }}>{`${step.number}.`}</Text>
      <Image systemName={icon.systemName} frame={{ width: visual.sizes[12], height: visual.sizes[12] }} foregroundStyle={icon.color} />
      <Text font={visual.fontSizes[12]} foregroundStyle={visual.colors.label} lineLimit={visual.lineLimits[1]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>{step.name}</Text>
      <Text font={visual.fontSizes[11]} foregroundStyle={visual.colors.secondaryLabel} lineLimit={1} frame={{ width: visual.fontSizes[11] * 3.5, alignment: 'trailing' }}>{status.text}</Text>
      <Text font={visual.fontSizes[11]} foregroundStyle={visual.colors.secondaryLabel} lineLimit={1} frame={{ width: visual.fontSizes[11] * 5, alignment: 'trailing' }}>{duration || '—'}</Text>
    </HStack>
  )
}
