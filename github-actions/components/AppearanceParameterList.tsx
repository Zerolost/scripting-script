import { VStack, Text, Button, useMemo, useState, useEffect, type Color } from 'scripting'
import { visualGroups, visualEntries } from '../services/visualSettings'
import { describeAppearance } from '../services/appearanceDescriptions'
import { useAccentColor } from '../hooks/useAccentColor'
import { GlassCard } from './GlassSurface'
import { AppearanceEditor } from './AppearanceEditor'
import { animateChange } from './Motion'

type Entry = { path: string; title: string; description: string; keywords: string }
const pageSize: number = 8

export function AppearanceParameterList({ group, query }: { group?: string; query: string }) {
  const accent: Color = useAccentColor()
  const [page, setPage] = useState<number>(0)
  useEffect(() => { setPage(0) }, [query, group])
  const entries: Entry[] = useMemo(() => {
    const groups: string[] = group ? [group] : Object.keys(visualGroups)
    return groups.flatMap((key: string) => visualEntries(key).map((entry: { path: string }) => ({ path: entry.path, ...describeAppearance(entry.path) })))
  }, [group])
  const filtered: Entry[] = useMemo(() => {
    const search: string = query.trim().toLocaleLowerCase()
    return search ? entries.filter((entry: Entry) => `${entry.title} ${entry.description} ${entry.keywords}`.toLocaleLowerCase().includes(search)) : entries
  }, [entries, query])
  const pageCount: number = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage: number = Math.min(page, pageCount - 1)
  const visible: Entry[] = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  function turnPage(next: number): void {
    animateChange(() => setPage(next))
  }
  return (
    <VStack spacing={12} toolbar={{ topBarTrailing: pageCount > 1 ? [
      <Button title="上一页" action={() => turnPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} buttonStyle="automatic" tint={accent} />,
      <Button title="下一页" action={() => turnPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage === pageCount - 1} buttonStyle="automatic" tint={accent} />,
    ] : [] }}>
      <Text font="caption" foregroundStyle="secondaryLabel">{`共 ${filtered.length} 项 · 第 ${currentPage + 1} / ${pageCount} 页 · 调整同步到总预览`}</Text>
      <GlassCard>
        {visible.map((entry: Entry) => <VStack key={entry.path} spacing={6}>
          <AppearanceEditor path={entry.path} />
        </VStack>)}
      </GlassCard>
      {filtered.length === 0 ? <Text foregroundStyle="secondaryLabel">没有匹配项，试试「按钮」「圆角」「标题」等用途。</Text> : null}
    </VStack>
  )
}
