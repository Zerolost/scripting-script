import { SVG, Image, VStack, useEffect, useState, fetch, AbortController } from 'scripting'
import { surface } from '../design/AllPatternDesign'
import { visual } from '../visual.config'
import metadata from '../script.json'
import { animateChange, motion, motionTransition } from './Motion'

const svgCache: Map<string, string> = new Map<string, string>()

export function BrandIcon() {
  const url: string = visual.brand.imageURL.trim() || (typeof metadata.iconImage === 'string' ? metadata.iconImage.trim() : '')
  const isSVG: boolean = /\.svg(?:[?#]|$)/i.test(url)
  const [code, setCode] = useState<string>(() => svgCache.get(url) ?? '')
  const [failed, setFailed] = useState<boolean>(false)

  useEffect(() => {
    setFailed(false)
    const cached: string | undefined = svgCache.get(url)
    setCode(cached ?? '')
    if (!visual.brand.visible || !isSVG || !url || cached) return
    let active: boolean = true
    const controller: AbortController = new AbortController()
    const timeout: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), 10000)
    const load = async (): Promise<void> => {
      try {
        const response: Awaited<ReturnType<typeof fetch>> = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error('图标加载失败')
        const svg: string = await response.text()
        if (!/<svg[\s>]/i.test(svg)) throw new Error('图标格式不正确')
        svgCache.set(url, svg)
        if (active) animateChange(() => { if (active) setCode(svg) })
      } catch {
        if (active) animateChange(() => { if (active) setFailed(true) })
      } finally {
        clearTimeout(timeout)
      }
    }
    void load()
    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [url, isSVG, visual.brand.visible])

  if (!visual.brand.visible) return null

  return (
    <VStack
      spacing={visual.spacing[0]}
      padding={visual.spacing[16]}
      frame={{ width: visual.sizes[96], height: visual.sizes[96] }}
      {...surface(visual.glass.brand, { type: 'rect', cornerRadius: visual.radii[28], style: 'continuous' })}
      animation={{ animation: motion, value: `${Boolean(code)}|${failed}` }}
    >
      {isSVG && code ? (
        <SVG code={code} resizable frame={{ width: visual.sizes[64], height: visual.sizes[64] }} transition={motionTransition} />
      ) : !isSVG && url && !failed ? (
        <Image imageUrl={url} resizable frame={{ width: visual.sizes[64], height: visual.sizes[64] }}
          onError={() => animateChange(() => setFailed(true))}
          placeholder={<Image systemName={visual.icons['point.3.connected.trianglepath.dotted']} font={visual.fontSizes[40]} foregroundStyle={visual.colors['#2088ff']} />}
          transition={motionTransition} />
      ) : (
        <Image systemName={visual.icons['point.3.connected.trianglepath.dotted']} font={visual.fontSizes[40]} foregroundStyle={visual.colors['#2088ff']} transition={motionTransition} />
      )}
    </VStack>
  )
}
