# Surge 模块工具（Scripting 版）

Surge 本地模块批量更新器，附带把 `scriptable://` 链接交给 `scripting://` 的 Surge 模块与内置 Safari 浏览器脚本。

## 导入

在 Scripting 中导入项目目录：

```text
https://github.com/Zerolost/scripting-script/tree/main/SurgeModuleTool
```

## 功能

| 功能 | 说明 |
| --- | --- |
| 更新全部 | 扫描模块目录，逐个读取 `#SUBSCRIBED` 并回写最新内容 |
| 更新单个 | 模块详情页单独更新，可分享到 Surge |
| 从链接安装 | 下载远端模块并保存为本地 `.sgmodule` |
| URL Scheme | `scripting://run/SurgeModuleTool?url=&name=` 直接安装 |
| Scheme 反劫持 | 生成 Surge 模块；Safari 侧由内置 `browser.tsx` 完成 |
| 目录书签 | 选一次目录，之后跨启动可读写 |
| 重载 Surge | 请求 `http://script.hub/reload` |

更新算法与 Script-Hub 的 `SurgeModuleTool.js` 一致：

1. 读取 `#SUBSCRIBED <url>`
2. 下载远端内容并校验 `#!name`
3. 移除旧的 `#SUBSCRIBED` 与 `# 🔗 模块链接` 区块
4. 在最后一条 `#!` 指令后插入新的链接区块
5. `#!desc` 写入 `🔗 [时间] 原描述`
6. 回写文件；扫描跳过 `.conf / .txt / .js / .list`

## 反劫持

### 直接安装

Surge 模块已随仓库发布，可直接用 URL 安装：

```text
https://raw.githubusercontent.com/Zerolost/scripting-script/main/SurgeModuleTool/Scriptable2Scripting.sgmodule
```

工具页的「从 GitHub 直接安装」会调用 `surge:///install-module?url=...` 一键打开 Surge。

### Surge 模块

工具页可生成 `Scriptable2Scripting.sgmodule`，关键是纯声明式规则：

```ini
[Body Rewrite]
http-response ^https?:// scriptable:///run_single/ scripting://run_single/ scriptable:///run/ scripting://run/ scriptable:/// scripting:// scriptable:// scripting://

[Header Rewrite]
http-response ^https?:// header-replace-regex Location scriptable:///run_single/ scripting://run_single/
http-response ^https?:// header-replace-regex Location scriptable:///run/ scripting://run/
http-response ^https?:// header-replace-regex Location scriptable:/// scripting://

[MITM]
hostname = %APPEND% -*.apple.com, -*.icloud.com, -*.mzstatic.com, -*.crashlytics.com, {{{hostname}}}
```

- `hostname` 是模块参数，启用时可改；默认 `*`
- 需要 Surge iOS 5.10+（Body Rewrite）与 MITM 证书
- iOS 上响应体上限 1 MB，超出会跳过改写

### 内置浏览器脚本

项目自带 `browser.tsx`，Scripting 会把它构建为 Safari 浏览器脚本。在 Safari 扩展里启用即可，无需再导入 `.user.js`：

- 捕获阶段拦截 `scriptable://` 点击并改写
- 改写页面内已有链接，右键复制也是 `scripting://`
- `MutationObserver` 处理动态插入
- 重写 `window.open`

### 边界

- 网页 / WebView / HTTP 响应可以改写
- 原生 App 直接调用 `UIApplication.open("scriptable://")` 无法拦截（非越狱限制）

## 结构

```
index.tsx                入口：解析 queryParameters
app.tsx                  内部路由 + 页面转场
browser.tsx              内置 Safari 浏览器脚本
pages/                   首页 / 添加 / 详情 / 设置 / 工具
components/              GlassCard、ModuleRow、StatusBadge、StatTile、ToastHost
contexts/                全局状态 + Toast 独立上下文
services/                更新、目录、设置、Scheme 生成
utils/                   模块解析与格式化（纯函数）
design/AllPatternDesign  Liquid Glass 与动效令牌
tests/                   逻辑回归与产物生成
```

## 设计

- iOS 26 Liquid Glass（`UIGlass.regular()` + `glassEffect`），实例已缓存
- 全屏渐变背景，导航栏背景隐藏，避免顶部/底部出现割裂的材质条
- 统计数字 `numericText`、文本 `opacity`、图标 `symbolEffect`、页面与卡片转场
- 列表 `LazyVStack`、目录扫描 4 路并发、Toast 独立 Context

## 校验

- TypeScript 诊断：0 项
- `scripting-ts run tests/logic.test.ts`：33 项通过
