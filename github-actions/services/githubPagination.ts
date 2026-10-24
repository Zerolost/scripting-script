export type GitHubPage<T> = { items: T[]; total?: number }

export async function collectGitHubPages<T extends { id: number }>(load: (page: number, perPage: number) => Promise<GitHubPage<T>>): Promise<T[]> {
  const perPage: number = 100
  const items: T[] = []
  const seen: Set<number> = new Set()
  for (let page: number = 1; ; page += 1) {
    const result: GitHubPage<T> = await load(page, perPage)
    let added: number = 0
    for (const item of result.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      items.push(item)
      added += 1
    }
    if (result.items.length < perPage || (result.total !== undefined && items.length >= result.total)) return items
    // 翻页期间列表可能变化；重复整页不能当作完整结果返回。
    if (!added) throw new Error('GitHub 分页数据重复，请刷新后重试')
  }
}
