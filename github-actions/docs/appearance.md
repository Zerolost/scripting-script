# 外观自定义

管理器的主要外观集中在项目根目录的 `visual.config.ts`，包括背景、颜色、字号、玻璃材质、动画和桌面小组件排版。通常只需修改 `visual` 中对应字段的值，无需改动页面代码。

修改后重新运行脚本；作为主页使用时长按主页图标执行「Reload」，桌面小组件则需要刷新时间线。完整内嵌的宿主配置见 [主页接入](home-screen.md)。

## 在设置中直接调试

打开「设置 → 外观调试」后选择分组。首页列出分组入口；各分组页面顶部始终显示整体实时预览，例如颜色页比较配色、字号页比较字号、小组件页比较对应尺寸的排版。预览没有收起开关或内部滚动区域，按内容高度完整展开，调整即时联动。参数直接在当前页编辑，无需进入单项详情页；同页参数共用一个材质容器，具体材质随系统版本切换。

参数按颜色、背景、玻璃、动画、字号、间距、图标、文案、小组件等分组，每页最多显示 8 项，附有中文用途和影响范围。上一页与下一页按钮位于顶部工具栏右侧，采用系统自动按钮样式，避免在工具栏玻璃中叠加独立玻璃；页码状态仅在参数区内维护，翻页不会重新挂载总预览，预览中的明暗、动画和小组件尺寸选择会保留。可以在搜索栏输入「按钮」「标题」「背景」等用途；首页搜索覆盖全部分组，分组内搜索只查当前分组。选项较多的参数使用系统菜单。

参数区通过分组顶部的整体预览比较效果。效果区默认跟随系统浅深色，并提供「跟随系统／浅色／深色」三种选择；手动覆盖同时作用于背景、语义文字、阴影和官方玻璃，仅影响示例，选择「跟随系统」即可恢复自动更新。固定自定义颜色仍保持所设颜色。数字映射属于共享规则，实际影响范围以说明为准。背景绘制函数仍需在文件中编写。

调整立即影响当前界面，点击「保存外观」后持久保存，并请求刷新桌面小组件。未保存的调整在当前运行期间有效，退出后使用上次保存值。「恢复默认」清除覆盖值，回到启动时 `visual.config.ts` 中的默认值。保存失败会在页面提示。

设置存储在当前脚本的私有域；完整内嵌时使用宿主的存储域。保存值优先于文件默认值，宿主显式传入的主题和布局优先级最高。手动改文件却看不到变化时，先恢复默认再重新运行。文件内的额外赋值应放在 `hydrateVisual(visual)` 之前，保证恢复默认与保存覆盖顺序正确。

## 系统兼容

iOS 26 及以上且玻璃组件可用时使用官方 Liquid Glass；iOS 17、18 使用官方 `ultraThinMaterial` / `regularMaterial` 和 `bordered` / `borderedProminent` 按钮。玻璃容器在旧系统使用普通布局容器，保留原有布局、颜色、导航和动画，材质是兼容近似，不模拟折射或玻璃形态合并。小组件与主页启动卡片采用相同版本策略；旧系统运行按钮使用绿色图标保持可读性。系统版本判断和共享回退集中在 `design/AllPatternDesign.ts`。运行环境仍需提供本项目使用的 Scripting API。最低系统要求、官方参考与验证范围见 [README 的系统兼容说明](../README.md#系统兼容)。

## 常用修改

下面的示例都按字段修改，保留其他配置键。可以把这些赋值写在 `visual.config.ts` 的 `visual` 对象定义之后、`hydrateVisual(visual)` 之前，也可以直接修改对象中对应项右侧的值。

### 放大文字、调整间距和圆角

```ts
visual.fontSizes[16] = 18
visual.spacing[6] = 8
visual.radii[18] = 20
```

数字键表示原始设计值，右侧表示实际显示值。例如 `fontSizes[16] = 18` 会把使用原始 16 号字号的文字统一改为 18。`spacing` 用于间距与内边距，`sizes` 用于图标及容器宽高，`radii` 用于圆角；它们各自独立。保留原来的键，只调整需要的值即可。

### 修改浅深色背景

```ts
visual.background.light = ['#F3F7FF', '#E7EEFF', '#F5EAFE']
visual.background.dark = ['#101827', '#202B46', '#342846']
```

默认渐变从左上到右下。需要自行绘制背景时，可以为 `background.render` 提供返回背景组件的函数；只想关闭默认背景绘制，则设置：

```ts
visual.background.enabled = false
```

内嵌时，宿主的 `renderBackground` 优先；宿主设置 `background: 'inherit'` 时显示外层背景。未指定宿主背景时才使用这里的配置。

### 调整配色、标题与图标

```ts
visual.colors['#0A84FF'] = '#AF52DE'
visual.colors['#0a84ff'] = '#AF52DE'
visual.login.subtitle = '查看仓库、工作流和运行记录'
visual.icons.gearshape = 'gearshape.fill'
```

`colors` 的左侧是原颜色键，右侧是替换色；键区分大小写，所以不同写法需要分别修改。`label` 和 `secondaryLabel` 默认跟随系统明暗，保留它们通常更容易保证可读性。错误色、成功色等应继续表达各自含义。

登录页文案在 `login` 中；其他静态文案通过 `text` 映射修改，例如 `visual.text['刷新'] = '重新加载'`。图标填写有效的 SF Symbol 名称。登录品牌图像由 `brand.imageURL` 指定，留空使用 `script.json` 图标，`brand.visible` 控制是否显示；图片自身颜色由图片内容决定。

### 调整玻璃与动画

```ts
visual.glass.row = 'regular'
visual.glass.rowInteractive = true
visual.animation.duration = 0.3
visual.animation.extraBounce = 0.04
```

玻璃材质支持 `'clear'` 和 `'regular'`，前者更通透，后者更有存在感。列表、详情卡片、登录输入框、品牌区域和小组件可以分别配置；详情卡片始终不可按压。

`animation.duration` 单位为秒，`extraBounce` 控制弹性。`animation.enabled = false` 可关闭自定义动画，系统导航和按钮反馈仍会保留。系统工具栏布局、原生导航转场和玻璃内部光学效果由 iOS 控制。

### 调整桌面小组件

小组件有独立的三种尺寸布局，数值直接生效，不经过全局 `spacing`、`sizes` 等尺寸映射。例如放宽大号布局、减少历史记录：

```ts
visual.widget.large.outerPad = 16
visual.widget.large.rowSpacing = 10
visual.widget.history.largeFew = 2
visual.widget.history.largeThree = 1
```

`history.compact` 用于小号和中号；大号在目标不超过两个、恰好三个、四个及以上时，分别使用 `largeFew`、`largeThree`、`largeMany`。默认大号最多三个目标时显示下次运行时间，这个阈值由 `nextVisibleMaxLargeTargets` 控制。

`showHistory`、`showNext` 分别控制是否显示历史和下次运行时间；大号的下次运行时间还受上述阈值限制。增加字号、间距或历史数量时，应给多个工作流留出空间。小组件标题用 `widget.title` 修改，运行按钮颜色用 `widget.runColor` 修改。

## 配置参考

| 配置 | 可调整内容 |
| --- | --- |
| `colors` | 文字、强调色、状态色、图标与分隔线颜色映射 |
| `fontSizes` / `spacing` / `sizes` / `radii` | 原始设计值到实际字号、间距、尺寸和圆角的映射 |
| `background` | `enabled` 开关、`render` 自绘背景、`light` / `dark` 渐变色；当前类型固定为左上到右下方向 |
| `glass` | `row`、`card`、`input`、`brand`、`widget` 材质；`rowInteractive` 列表交互、`containerSpacing` 容器间隔 |
| `glass.transition` | `'identity'`、`'materialize'` 或 `'matchedGeometry'` 玻璃过渡 |
| `animation` | `enabled`、`duration`、`extraBounce`，以及 `transitionScale`、`rowOpacity`、`rowScale` 入场参数 |
| `lineLimits` | 原始行数到实际截断行数的映射，增加行数会增加行高 |
| `navigationTitleMode` | `'inline'`、`'large'` 或 `'automatic'` 导航标题模式 |
| `shadow` | 登录输入框阴影的 `radius` 与垂直偏移 `y` |
| `brand` / `login` | 品牌图像与显示开关；登录标题、副标题、帮助和权限提示 |
| `icons` / `text` | SF Symbol 与静态文案映射 |
| `typography` / `textTransition` | 常用字重与文字过渡；当前类型分别限定为既有字重和 `'opacity'` |
| `widget` | 标题、按钮颜色、显示开关、三种尺寸布局、历史数量与大号下次时间阈值 |

`widget.small`、`medium`、`large` 的字段一致：

- `outerPad`、`outerSpacing`：外边距与整体内容间距。
- `itemSpacing`、`rowSpacing`：每个目标内部的间距与行间距。
- `headerIcon`、`runIcon`：标题图标与运行图标尺寸。
- `titleFont`、`bodyFont`、`historyFont`：标题、正文与历史记录字体。
- `runPad.horizontal`、`runPad.vertical`：运行按钮内边距。

宿主显式传入的主题值优先于这里的对应设置。可单独复制的启动卡片位于 `integration/GitHubActionsLauncher.tsx`，它通过 `appearance` 参数设置外观，不导入 `visual.config.ts`；复制到宿主同目录后仍使用 `import GitHubActionsLauncher from './GitHubActionsLauncher'`。

动态仓库名、任务数据、网络错误和业务流程由业务逻辑提供，不属于外观配置。
