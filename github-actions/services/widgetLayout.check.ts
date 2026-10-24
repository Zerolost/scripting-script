import { Script, type WidgetFamily } from 'scripting'
import { resolveWidgetLayout, type WidgetConfig } from './widgetLayout'

const layout: WidgetConfig['large'] = { outerPad: 14, outerSpacing: 12, itemSpacing: 8, rowSpacing: 8, headerIcon: 14, titleFont: 'headline', bodyFont: 'subheadline', historyFont: 'footnote', runIcon: 12, runPad: { horizontal: 9, vertical: 5 } }
const config: WidgetConfig = {
  showHistory: true, showNext: true, title: '检查', runColor: '#34C759',
  small: layout, medium: layout, large: layout, extraLarge: layout, extraLargePortrait: layout,
  history: { compact: 2, largeFew: 3, largeThree: 1, largeMany: 0, extraLargeFew: 5, extraLargeMany: 2, portraitFew: 5, portraitMany: 1 },
  nextVisibleMaxLargeTargets: 3, nextVisibleMaxExtraLargeTargets: 8,
}
let checks: number = 0
function check(result: boolean, name: string): void {
  checks += 1
  if (!result) throw new Error(name)
}
const before: string = JSON.stringify(config)
const families: WidgetFamily[] = ['systemSmall', 'systemMedium', 'systemLarge', 'systemExtraLarge', 'systemExtraLargePortrait']
for (const family of families) {
  for (let count: number = 0; count <= 10; count += 1) {
    const plan: ReturnType<typeof resolveWidgetLayout> = resolveWidgetLayout(family, count, config, { width: 700, height: family === 'systemExtraLargePortrait' ? 764 : 364 })
    check(plan.itemCount === Math.min(count, family === 'systemSmall' || family === 'systemMedium' ? 1 : 8), `${family} 数量 ${count}`)
    check(plan.columns === (family === 'systemExtraLarge' ? 2 : 1), '列数')
    check(plan.rows * plan.columns >= plan.itemCount && plan.historyCount >= 0, '容量')
    check(plan.layout.runPad.horizontal === 9 && plan.layout.runPad.vertical === 5, '实际内边距')
  }
}
check(JSON.stringify(config) === before, '纯函数不可修改配置')
check(resolveWidgetLayout('systemExtraLarge', 2, config, { width: 700, height: 900 }).historyCount === 5, '横向充足空间五条历史')
check(resolveWidgetLayout('systemExtraLargePortrait', 2, config, { width: 350, height: 900 }).historyCount === 5, '竖向充足空间五条历史')
check(resolveWidgetLayout('systemLarge', 8, config, { width: 350, height: 364 }).compact, '八目标紧凑')
console.log(`PASS ${checks} 项布局与背景策略检查`)
Script.exit({ passed: checks })
