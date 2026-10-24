type Material = 'clear' | 'regular'
const materials: Map<string, UIGlass> = new Map<string, UIGlass>()

export function glassMaterial(kind: Material, interactive: boolean): UIGlass {
  const key: string = `${kind}:${interactive}`
  const cached: UIGlass | undefined = materials.get(key)
  if (cached) return cached
  // 官方修饰方法返回新实例，因此基础材质可安全共享。
  const glass: UIGlass = (kind === 'clear' ? UIGlass.clear() : UIGlass.regular()).interactive(interactive)
  materials.set(key, glass)
  return glass
}
