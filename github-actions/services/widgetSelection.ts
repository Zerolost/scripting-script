export function resolveWidgetTargets(selected: string[], parameter: string, recent: string | null): string[] {
  const saved: string[] = Array.from(new Set(selected.map((value: string) => value.trim()).filter(Boolean)))
  const legacy: string = parameter.trim()
  const targets: string[] = saved.length ? saved : /^[^/\s]+\/[^/\s]+(?:\/[^\s]+)?$/.test(legacy) ? [legacy] : []
  const index: number = recent ? targets.indexOf(recent) : -1
  if (index > 0) targets.unshift(...targets.splice(index, 1))
  return targets.slice(0, 8)
}

export function widgetTargetName(target: string): string {
  const names: Record<string, string> | null = Storage.get<Record<string, string>>('github_widget_target_names_v1')
  const name: unknown = names?.[target]
  const parts: string[] = target.split('/')
  return typeof name === 'string' && name.trim() ? `${parts[0]}/${parts[1]} · ${name}` : target
}
