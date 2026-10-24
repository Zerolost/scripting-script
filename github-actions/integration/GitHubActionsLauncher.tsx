import { Link, Script, HStack, VStack, Image, Text, type Color, type Shape, type CommonViewProps } from 'scripting'

export type GitHubActionsLauncherProps = {
  scriptName?: string
  title?: string
  appearance?: {
    subtitle?: string
    accentColor?: Color
    textColor?: Color
    secondaryColor?: Color
    cornerRadius?: number
    padding?: number
    spacing?: number
    titleSize?: number
    subtitleSize?: number
    iconSize?: number
    icon?: string
    arrowIcon?: string
  }
}

export default function GitHubActionsLauncher({
  scriptName = 'Github Action管理',
  title = 'GitHub Actions',
  appearance = {}
}: GitHubActionsLauncherProps) {
  const shape: Shape = { type: 'rect', cornerRadius: appearance.cornerRadius ?? 18, style: 'continuous' }
  // 保持单文件可复制，不依赖管理器内部模块。
  const material: CommonViewProps = Number.parseInt(Device.systemVersion, 10) >= 26 && typeof UIGlass !== 'undefined'
    ? { glassEffect: { glass: UIGlass.clear().interactive(true), shape } }
    : { background: { style: 'ultraThinMaterial', shape } }
  return (
    <Link url={Script.createRunSingleURLScheme(scriptName)}>
      <HStack
        spacing={appearance.spacing ?? 10}
        padding={appearance.padding ?? { horizontal: 14, vertical: 12 }}
        frame={{ maxWidth: 'infinity', alignment: 'leading' }}
        {...material}
      >
        <Image systemName={appearance.icon ?? 'point.3.connected.trianglepath.dotted'} font={appearance.iconSize ?? 24} foregroundStyle={appearance.accentColor ?? '#2088ff'} />
        <VStack alignment="leading" spacing={appearance.spacing ?? 4} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <Text font={appearance.titleSize ?? 16} fontWeight="semibold" foregroundStyle={appearance.textColor ?? 'label'}>{title}</Text>
          <Text font={appearance.subtitleSize ?? 12} foregroundStyle={appearance.secondaryColor ?? 'secondaryLabel'}>{appearance.subtitle ?? '仓库、工作流与运行记录'}</Text>
        </VStack>
        <Image systemName={appearance.arrowIcon ?? 'arrow.up.forward.app'} font={appearance.titleSize ?? 16} foregroundStyle={appearance.secondaryColor ?? 'secondaryLabel'} />
      </HStack>
    </Link>
  )
}
