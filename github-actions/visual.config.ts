import type { Color, Font, FontWeight, VirtualNode } from 'scripting'
import { glassMaterial } from './services/glassMaterialCache'
import { hydrateVisual } from './services/visualSettings'

type GradientPoint = 'topLeading' | 'top' | 'topTrailing' | 'leading' | 'center' | 'trailing' | 'bottomLeading' | 'bottom' | 'bottomTrailing'

type VisualConfig = {
  lineLimits: Record<number, number>
  navigationTitleMode: 'inline' | 'large' | 'automatic'
  shadow: { radius: number; y: number }
  colors: Record<string, Color>
  fontSizes: Record<number, number>
  spacing: Record<number, number>
  sizes: Record<number, number>
  radii: Record<number, number>
  icons: Record<string, string>
  text: Record<string, string>
  background: { enabled: boolean; render?: () => VirtualNode; light: Color[]; dark: Color[]; startPoint: GradientPoint; endPoint: GradientPoint }
  glass: { row: 'clear' | 'regular'; rowInteractive: boolean; card: 'clear' | 'regular'; input: 'clear' | 'regular'; brand: 'clear' | 'regular'; widget: 'clear' | 'regular'; transition: 'identity' | 'materialize' | 'matchedGeometry'; containerSpacing: number }
  animation: { enabled: boolean; duration: number; extraBounce: number; transitionScale: number; rowOpacity: number; rowScale: number }
  typography: { normal: FontWeight; medium: FontWeight; semibold: FontWeight; bold: FontWeight }
  textTransition: 'opacity'
  brand: { imageURL: string; visible: boolean }
  login: { title: string; subtitle: string; help: string; permission: string }
  flow: { dockTransfer: boolean; edgeTrail: boolean; compactQuietSteps: boolean; quietSummary: boolean; relayMotion: boolean; focusBorder: boolean; animate: boolean; cycleDuration: number; nodeSpacing: number; lineWidth: number; glowStrength: number; energyStrength: number; arrivalStart: number; smoothTravel: boolean; showDirection: boolean; failureEcho: boolean; statusColors: boolean; trailLength: number; showGrid: boolean; showTiming: boolean; iconSize: number; titleFont: number; detailFont: number; showLegend: boolean }
  detail: { titleLines: number; commitLines: number; showCommit: boolean; showFocus: boolean }
  settings: { showGuide: boolean }
  account: { avatarSize: number; nameFont: number; detailFont: number; spacing: number; showBio: boolean; showStats: boolean }
  widget: { showHistory: boolean; showNext: boolean; title: string; runColor: Color; small: WidgetLayout; medium: WidgetLayout; large: WidgetLayout; extraLarge: WidgetLayout; extraLargePortrait: WidgetLayout; history: { compact: number; largeFew: number; largeThree: number; largeMany: number; extraLargeFew: number; extraLargeMany: number; portraitFew: number; portraitMany: number }; nextVisibleMaxLargeTargets: number; nextVisibleMaxExtraLargeTargets: number }
}

type WidgetLayout = { outerPad: number; outerSpacing: number; itemSpacing: number; rowSpacing: number; headerIcon: number; titleFont: Font; bodyFont: Font; historyFont: Font; runIcon: number; runPad: { horizontal: number; vertical: number } }

// 只修改下方配置即可调整外观。宿主显式传入的主题优先。
// 设置 → 外观调试可实时调整并保存覆盖值；恢复默认会重新使用此文件。
// 手动修改文件后重新运行脚本；主页需要 Reload，小组件需要刷新时间线。
export const visual: VisualConfig = {
  // 标题模式与文字截断行数；增大行数会增加每行高度。
  navigationTitleMode: 'inline',
  lineLimits: { 1: 1, 2: 2 },
  shadow: { radius: 18, y: 7 },
  // 背景渐变支持浅深色；render 可换成自绘组件，enabled 可关闭默认背景。
  background: { enabled: true, render: undefined, light: ['#EDF6FF', '#D9E5FB', '#E9E0F5'], dark: ['#081522', '#172D48', '#302543'], startPoint: 'topLeading', endPoint: 'bottomTrailing' },
  // 使用官方玻璃；详情始终不可按压。clear 更通透，regular 更有存在感。
  glass: { row: 'clear', rowInteractive: true, card: 'clear', input: 'clear', brand: 'clear', widget: 'regular', transition: 'materialize', containerSpacing: 4 },
  // duration 为秒，extraBounce 控制弹性；关闭后保留系统导航与按钮反馈。
  animation: { enabled: true, duration: 0.36, extraBounce: 0.06, transitionScale: 0.98, rowOpacity: 0.88, rowScale: 0.985 },
  typography: { normal: 'regular', medium: 'medium', semibold: 'semibold', bold: 'bold' },
  textTransition: 'opacity',
  // imageURL 留空时使用 script.json 图标；visible 控制登录品牌图标。
  brand: { imageURL: '', visible: true },
  login: { title: 'GitHub Actions', subtitle: '随时随地管理您的工作流', help: '如何获取 Token？', permission: 'Token 需要 repo 和 workflow 权限' },
  // 流程图的流动周期、节点间距和字号；可在外观调试实时修改。
  flow: { dockTransfer: true, edgeTrail: true, compactQuietSteps: true, quietSummary: true, relayMotion: true, focusBorder: true, animate: true, cycleDuration: 1.4, nodeSpacing: 8, lineWidth: 2, glowStrength: 0.55, energyStrength: 0.65, arrivalStart: 0.64, smoothTravel: true, showDirection: true, failureEcho: true, statusColors: true, trailLength: 6, showGrid: true, showTiming: true, iconSize: 18, titleFont: 14, detailFont: 12, showLegend: true },
  // 详情摘要的标题、提交正文行数及关键步骤提示。
  detail: { titleLines: 2, commitLines: 3, showCommit: true, showFocus: true },
  settings: { showGuide: true },
  account: { avatarSize: 52, nameFont: 18, detailFont: 12, spacing: 10, showBio: true, showStats: true },
  // 五种尺寸独立排版；超大号沿用大号能力，并利用额外空间显示历史。
  widget: {
    showHistory: true, showNext: true, title: 'GitHub 自动化', runColor: '#34C759',
    small: { outerPad: 10, outerSpacing: 8, itemSpacing: 6, rowSpacing: 6, headerIcon: 12, titleFont: 'subheadline', bodyFont: 'footnote', historyFont: 'caption', runIcon: 11, runPad: { horizontal: 6, vertical: 3 } },
    medium: { outerPad: 12, outerSpacing: 8, itemSpacing: 5, rowSpacing: 6, headerIcon: 13, titleFont: 'subheadline', bodyFont: 'footnote', historyFont: 'caption', runIcon: 11, runPad: { horizontal: 6, vertical: 3 } },
    large: { outerPad: 14, outerSpacing: 12, itemSpacing: 8, rowSpacing: 8, headerIcon: 14, titleFont: 'headline', bodyFont: 'subheadline', historyFont: 'footnote', runIcon: 12, runPad: { horizontal: 7, vertical: 4 } },
    extraLarge: { outerPad: 16, outerSpacing: 12, itemSpacing: 8, rowSpacing: 8, headerIcon: 16, titleFont: 'headline', bodyFont: 'subheadline', historyFont: 'footnote', runIcon: 12, runPad: { horizontal: 7, vertical: 4 } },
    extraLargePortrait: { outerPad: 16, outerSpacing: 14, itemSpacing: 8, rowSpacing: 8, headerIcon: 16, titleFont: 'headline', bodyFont: 'subheadline', historyFont: 'footnote', runIcon: 12, runPad: { horizontal: 7, vertical: 4 } },
    history: { compact: 2, largeFew: 3, largeThree: 1, largeMany: 0, extraLargeFew: 5, extraLargeMany: 2, portraitFew: 5, portraitMany: 1 }, nextVisibleMaxLargeTargets: 3, nextVisibleMaxExtraLargeTargets: 8,
  },
  // 左侧为原颜色，右侧为替换色。label / secondaryLabel 跟随系统明暗。
  colors: {
    '#0A84FF': '#0A84FF', '#2088ff': '#2088ff', '#34C759': '#34C759', '#FF3B30': '#FF3B30', '#FF9F0A': '#FF9F0A', '#ff9f0a': '#ff9f0a', '#FFFFFF': '#FFFFFF',
    '#f5f5f7': '#f5f5f7', '#1c1c1e': '#1c1c1e', '#a7a9b2': '#a7a9b2', '#6e7480': '#6e7480', clear: 'clear',
    'rgba(120,120,128,0.24)': 'rgba(120,120,128,0.24)', 'rgba(0,0,0,0.42)': 'rgba(0,0,0,0.42)', 'rgba(72,88,120,0.18)': 'rgba(72,88,120,0.18)',
    '#175cd3': '#175cd3',
    '#b54708': '#b54708',
    '#0a84ff': '#0a84ff',
    '#8e8e93': '#8e8e93',
    '#ff3b30': '#ff3b30',
    '#34c759': '#34c759',
    '#ff9500': '#ff9500',
    '#1a7f37': '#1a7f37',
    '#d9f2e0': '#d9f2e0',
    '#b42318': '#b42318',
    '#fde3e1': '#fde3e1',
    '#fde9d2': '#fde9d2',
    '#6b7280': '#6b7280',
    '#eef0f3': '#eef0f3',
    '#d7e8fd': '#d7e8fd',
    '#e5e7eb': '#e5e7eb',
    label: 'label',
    secondaryLabel: 'secondaryLabel',
    red: 'red',
  },
  // 左侧是原字号，右侧是实际字号，例如 16: 18 放大原为16的文字。
  fontSizes: {
    18: 18, 19: 19, 20: 20, 24: 24, 28: 28, 40: 40,
    11: 11,
    12: 12,
    13: 13,
    14: 14,
    15: 15,
    16: 16,
    22: 22,
  },
  // 间距与内边距；0通常用于无间隔容器，建议保留。
  spacing: {
    1: 1, 14: 14, 16: 16, 18: 18, 20: 20, 40: 40,
    0: 0,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    10: 10,
    12: 12,
    28: 28,
  },
  // 图标及容器宽高。
  sizes: {
    11: 11, 24: 24, 52: 52, 64: 64, 96: 96,
    1: 1,
    12: 12,
    13: 13,
    14: 14,
    16: 16,
    18: 18,
    19: 19,
    20: 20,
    22: 22,
    32: 32,
  },
  // 圆角半径；越大越圆润。
  radii: {
    18: 18, 22: 22, 28: 28,
    16: 16,
    23: 23,
  },
  // 右侧可以替换为其他有效的 SF Symbol 名称。
  icons: {
    'arrow.up.forward.app': 'arrow.up.forward.app', 'arrow.up.right': 'arrow.up.right', 'bolt.heart.fill': 'bolt.heart.fill', calendar: 'calendar', 'exclamationmark.triangle.fill': 'exclamationmark.triangle.fill', 'point.3.connected.trianglepath.dotted': 'point.3.connected.trianglepath.dotted',
    'rectangle.portrait.and.arrow.right': 'rectangle.portrait.and.arrow.right',
    gearshape: 'gearshape',
    'arrow.clockwise': 'arrow.clockwise',
    'lock.fill': 'lock.fill',
    'globe.americas.fill': 'globe.americas.fill',
    'bolt.fill': 'bolt.fill',
    hourglass: 'hourglass',
    'play.fill': 'play.fill',
    'arrow.triangle.branch': 'arrow.triangle.branch',
    'person.crop.circle': 'person.crop.circle',
    'info.circle.fill': 'info.circle.fill',
    'clock.fill': 'clock.fill',
    'list.bullet.rectangle.fill': 'list.bullet.rectangle.fill',
    'widget.small': 'widget.small',
    'checkmark.circle.fill': 'checkmark.circle.fill',
    trash: 'trash',
    'chevron.left': 'chevron.left',
    'xmark': 'xmark',
    'xmark.circle.fill': 'xmark.circle.fill',
    'questionmark.circle': 'questionmark.circle',
    'arrow.triangle.2.circlepath': 'arrow.triangle.2.circlepath',
    'circle.dashed': 'circle.dashed',
  },
  // 界面静态文案；动态仓库名、任务数据与网络错误由业务提供。
  text: {
    '用户名': '用户名', Token: 'Token', '绑定账号': '绑定账号', '验证中...': '验证中...',
    'GitHub 自动化': 'GitHub 自动化', '仓库、工作流与运行记录': '仓库、工作流与运行记录',
    '仓库': '仓库',
    '退出': '退出',
    '设置': '设置',
    '刷新': '刷新',
    '加载中...': '加载中...',
    '没有可读取的 GitHub Actions 工作流仓库': '没有可读取的 GitHub Actions 工作流仓库',
    '有工作流的仓库': '有工作流的仓库',
    '默认分支: ': '默认分支: ',
    '工作流': '工作流',
    '运行记录': '运行记录',
    '提交中': '提交中',
    '运行': '运行',
    '最近运行 · ': '最近运行 · ',
    '运行详情': '运行详情',
    '进行中': '进行中',
    '排队中': '排队中',
    '已运行 ': '已运行 ',
    '—': '—',
    '运行 #': '运行 #',
    '未知分支': '未知分支',
    '· 第 ': '· 第 ',
    ' 次尝试': ' 次尝试',
    '概览': '概览',
    '默认分支': '默认分支',
    '文件': '文件',
    '触发者': '触发者',
    '实际触发': '实际触发',
    'Check Suite': 'Check Suite',
    '关联 PR': '关联 PR',
    '时间': '时间',
    '创建': '创建',
    '开始': '开始',
    '完成': '完成',
    '耗时': '耗时',
    '更新': '更新',
    '任务': '任务',
    '暂无任务': '暂无任务',
    '桌面小组件': '桌面小组件',
    '小组件设置': '小组件设置',
    '选择需要在桌面显示的工作流': '选择需要在桌面显示的工作流',
    '已清除，桌面小组件显示未指定状态': '已清除，桌面小组件显示未指定状态',
    '已选 ': '已选 ',
    ' 个工作流': ' 个工作流',
    '清除设置': '清除设置',
    '不指定工作流，小组件显示默认状态': '不指定工作流，小组件显示默认状态',
    '已更新：小组件将显示 ': '已更新：小组件将显示 ',
    '选择显示在小组件的工作流（可多选）': '选择显示在小组件的工作流（可多选）',
  },
}

hydrateVisual(visual)

export function visualGlass(kind: 'clear' | 'regular', interactive: boolean = false): UIGlass {
  return glassMaterial(kind, interactive)
}
