# 主页接入

想从自己的主页打开管理器，复制一张启动卡片就够了。想直接在主页里浏览工作流，则需要把完整项目放进宿主。修改管理器的配色和排版，见 [外观自定义](appearance.md)。

## 简单启动卡片

先按 [README 的安装说明](../README.md#安装)安装本脚本，再把项目中的 `integration/GitHubActionsLauncher.tsx` 单独复制到自己的主页脚本目录。它没有本项目内的其他依赖，复制后这样导入：

```tsx
import GitHubActionsLauncher from './GitHubActionsLauncher'

export default function HomeScreen() {
  return <GitHubActionsLauncher />
}
```

已有主页时，把 `<GitHubActionsLauncher />` 放进现有布局即可。点击启动卡片会独立打开管理器，关闭后可回到原主页。卡片在 iOS 26 使用官方 Liquid Glass，在 iOS 17、18 使用官方 Material 回退。账号和小组件设置仍由独立安装的管理器保存，使用的是管理器的脚本身份。

如果安装后重命名了脚本，用 `scriptName` 指定实际名称；卡片标题和外观也可以一起调整：

```tsx
<GitHubActionsLauncher
  scriptName="我的 Actions"
  title="我的自动化"
  appearance={{
    subtitle: '查看工作流与运行状态',
    accentColor: '#AF52DE',
    cornerRadius: 20
  }}
/>
```

`appearance` 还支持 `textColor`、`secondaryColor`、`padding`、`spacing`、`titleSize`、`subtitleSize`、`iconSize`、`icon` 和 `arrowIcon`。图标填写 SF Symbol 名称。启动卡片独立配置外观，不读取管理器的 `visual.config.ts`。

如果只需要文字入口，也可以不复制文件，直接加入链接：

```tsx
import { Link, Script } from 'scripting'

<Link url={Script.createRunSingleURLScheme('Github Action管理')}>
  GitHub Actions
</Link>
```

## 把本脚本作为主页

在 Scripting 设置中开启「显示主页标签」，然后在「更多 → 选择脚本」选择本脚本。

## 在宿主中完整内嵌

如果希望直接在自己的主页里浏览仓库和工作流，把完整的 `github-actions/` 项目目录放入宿主目录，再按实际位置导入主页组件。以下示例使用仓库中的目录名：

```tsx
import GitHubActionsHome from './github-actions/home_screen_default_ui'

export default function HomeScreen() {
  return <GitHubActionsHome />
}
```

这里的 `github-actions` 是宿主中的子目录名，与独立安装时的脚本显示名称无关；若复制时改了目录名，请同步修改导入路径。

管理器默认自带一个 `NavigationStack`，没有底部 `TabView`，可以放进宿主的一个 Tab 或独立页面。设置和刷新位于同一工具栏组，小组件配置在设置页中。如果外层已经提供导航栈，传入 `host={{ navigation: 'inherit' }}`，由宿主管理导航容器。

完整内嵌会以**宿主脚本身份**读写 `github_username`、`github_token`、`widget_repos` 等原有存储键。适配层没有新增命名空间，宿主应避开同名键；没有凭据时会显示登录页。独立安装的管理器账号不会因为复制目录而自动迁入宿主，桌面小组件的脚本身份也不会自动迁移。希望继续使用独立管理器及其配套小组件时，使用前面的启动卡片即可。

## 跟随宿主背景、主题与回调

以下 `host` 配置用于完整内嵌。启动卡片或链接打开的是另一个脚本，不能传入宿主的背景组件或函数。

### 背景与主题

宿主已经铺好背景时，让管理器显示外层背景：

```tsx
<GitHubActionsHome host={{ background: 'inherit' }} />
```

这会关闭管理器各页面自己的背景绘制。如果外层导航容器遮住了宿主背景，可以改为提供 `renderBackground`，让管理器各页面绘制同一个背景组件：

```tsx
import GitHubActionsHome, {
  type GitHubActionsHost
} from './github-actions/home_screen_default_ui'
import { MyBackground } from './MyBackground'

const host: GitHubActionsHost = {
  renderBackground: () => <MyBackground />,
  accentColor: '#AF52DE',
  textColor: 'label',
  secondaryTextColor: 'secondaryLabel',
  rowCornerRadius: 20,
  rowSpacing: 8,
  rowPadding: 10
}

export default function HomeScreen() {
  return <GitHubActionsHome host={host} />
}
```

`MyBackground` 替换为宿主实际的背景组件，由它处理铺满、安全区和触摸穿透。`renderBackground` 优先于 `background`；不传背景选项，或设为 `'default'`，则使用根目录 `visual.config.ts` 中的背景配置。主题状态变化后，重新传入对应的 props 即可更新。

宿主显式提供的主题值优先于文件配置，支持的选项如下：

| 选项 | 用途 |
| --- | --- |
| `background` | `'inherit'` 显示外层背景；`'default'` 使用管理器背景配置 |
| `renderBackground` | 为管理器各页面提供背景组件 |
| `accentColor` | 强调色、登录按钮与选中态；部分品牌图标保留原色 |
| `textColor` / `secondaryTextColor` | 常规主文字与副文字颜色，错误和运行状态保留语义色 |
| `rowCornerRadius` | 列表玻璃与详情卡片圆角 |
| `rowSpacing` / `rowPadding` | 列表行间距与行内上下间距 |
| `navigation` | 默认 `'own'`；外层已有导航栈时使用 `'inherit'` |
| `onEvent` | 接收登录、注销、工作流触发成功和小组件目标变更事件 |
| `refreshWidgets` | 接管小组件刷新；未提供时使用内部 `Widget.reloadAll()` |

### 事件与小组件刷新

通过 `onEvent` 接入宿主已有逻辑，支持同步或异步函数：

```tsx
import type { GitHubActionsHostEvent } from './github-actions/integration/HostAdapter'

<GitHubActionsHome host={{
  background: 'inherit',
  onEvent: async (event: GitHubActionsHostEvent): Promise<void> => {
    if (event.type === 'workflowTriggered') {
      console.log(`已触发 ${event.owner}/${event.repo}`)
    }
  }
}} />
```

事件及其数据为：

- `login`：`username`。
- `logout`：无额外数据。
- `workflowTriggered`：`owner`、`repo`、`workflowId`。
- `widgetTargetsChanged`：`targets`，即目标字符串数组。

事件不包含 Token。`refreshWidgets` 是不接收参数的同步或异步函数；传入后会替代内部刷新逻辑。两类回调的异常都会被捕获并记录日志，不会撤销已成功的 GitHub 操作；刷新回调失败时不会再自动调用默认刷新。

宿主已有的函数需要通过回调传入，管理器不会自动识别它们。账号存储和 GitHub 请求仍由管理器自己的逻辑处理。
