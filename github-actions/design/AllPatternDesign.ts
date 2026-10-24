import type { ButtonStyle, Color, CommonViewProps, Shape } from 'scripting'
import { glassMaterial } from '../services/glassMaterialCache'

export function supportsLiquidGlass(version: string, available: boolean): boolean {
  const major: number = Number.parseInt(version.split('.')[0], 10)
  return Number.isFinite(major) && major >= 26 && available
}

export const liquidGlassAvailable: boolean = supportsLiquidGlass(Device.systemVersion, typeof UIGlass !== 'undefined')

export function glassButtonStyle(prominent: boolean = false): ButtonStyle {
  return liquidGlassAvailable ? (prominent ? 'glassProminent' : 'glass') : (prominent ? 'borderedProminent' : 'bordered')
}

export function surface(kind: 'clear' | 'regular', shape: Shape, interactive: boolean = false, tint?: Color): CommonViewProps {
  if (!liquidGlassAvailable) {
    return { background: { style: kind === 'clear' ? 'ultraThinMaterial' : 'regularMaterial', shape } }
  }
  const glass: UIGlass = glassMaterial(kind, interactive)
  return { glassEffect: { glass: tint ? glass.tint(tint) : glass, shape } }
}

export function glassTransition(value: 'identity' | 'materialize' | 'matchedGeometry'): CommonViewProps {
  return liquidGlassAvailable ? { glassEffectTransition: value } : {}
}
