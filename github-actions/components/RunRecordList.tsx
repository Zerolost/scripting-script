import { ForEach, HStack, VStack, Image, NavigationLink, useEffect, useMemo, useObservable, useRef, type Color, type VirtualNode } from 'scripting'
import { visual } from '../visual.config'
import { MotionText as Text, MotionRow, animateChange } from './Motion'
import { AccentNavigationDestination } from './AccentNavigationDestination'
import { RunDetailPage } from '../pages/RunDetailPage'
import { runStatusIcon, formatShortTime, timeAgoText, type GitHubAPI, type Run } from '../services/AppModel'

type RecordItem = { id: string; run: Run }
type RecordProps = { api: GitHubAPI; owner: string; repo: string; accentColor: Color }

export function RunRecordList({ runs, ...props }: RecordProps & { runs: Run[] }): VirtualNode {
  const items: RecordItem[] = useMemo(() => runs.map((run: Run): RecordItem => ({ id: String(run.id), run })), [runs])
  const data: Observable<RecordItem[]> = useObservable<RecordItem[]>(items)
  const previous = useRef<RecordItem[]>(items)
  const appeared = useRef<Set<string>>(new Set<string>())
  useEffect((): void => {
    if (previous.current === items) return
    previous.current = items
    animateChange(() => data.setValue(items))
  }, [items, data])
  return <ForEach data={data} builder={(item: RecordItem): VirtualNode => <RunRecordRow key={item.id} {...props} run={item.run} appeared={appeared.current} />} />
}

function RunRecordRow({ api, owner, repo, accentColor, run, appeared }: RecordProps & { run: Run; appeared: Set<string> }): VirtualNode {
  const icon: ReturnType<typeof runStatusIcon> = runStatusIcon(run)
  const time: string = useMemo(() => timeAgoText(run.updated_at) || formatShortTime(run.updated_at), [run.updated_at])
  return (
    <NavigationLink tint={accentColor} buttonStyle="plain" destination={<AccentNavigationDestination><RunDetailPage tint={accentColor} api={api} owner={owner} repo={repo} run={run} /></AccentNavigationDestination>}>
      <MotionRow appearanceID={String(run.id)} appeared={appeared} spacing={visual.spacing[8]} alignment="center">
        <VStack alignment="center" spacing={visual.spacing[0]} frame={{ width: visual.sizes[32], height: visual.sizes[32] }} clipShape={{ type: 'rect', cornerRadius: visual.radii[16], style: 'continuous' }}>
          <Image systemName={icon.systemName} frame={{ width: visual.sizes[19], height: visual.sizes[19] }} foregroundStyle={icon.color} />
        </VStack>
        <VStack spacing={visual.spacing[5]} alignment="leading" frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <HStack spacing={visual.spacing[8]} alignment="center">
            <Text style={{ fontSize: visual.fontSizes[16], fontWeight: '700', color: visual.colors.label }}>#{run.run_number}</Text>
            <Text lineLimit={visual.lineLimits[2]} style={{ fontSize: visual.fontSizes[13], color: visual.colors.label }}>{run.display_title || run.head_branch}</Text>
          </HStack>
          <HStack spacing={visual.spacing[7]}>
            <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors.secondaryLabel }}>{run.event}</Text>
            <Text style={{ fontSize: visual.fontSizes[12], color: visual.colors.secondaryLabel }}>· {time}</Text>
          </HStack>
        </VStack>
      </MotionRow>
    </NavigationLink>
  )
}
