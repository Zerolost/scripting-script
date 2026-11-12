# 模块坞 ModuleDock

Scripting 版的本地模块管理器，支持 **Surge / Loon / Stash / Shadowrocket** 四种目标：

- 批量更新带 `#SUBSCRIBED` 的本地模块
- 从链接安装，自动识别目标 App 与文件后缀
- 四份反劫持模块，把 Script-Hub 的 `scriptable://` 链接改写成 `scripting://`
- 内置 Safari 浏览器脚本，给 Loon / Stash / Shadowrocket 追加「本地模块」按钮

## 导入

```text
https://github.com/Zerolost/scripting-script/tree/main/ModuleDock
```

## 支持的目标

| App | 叫法 | 后缀 | Script-Hub target | 远程导入 Scheme |
| --- | --- | --- | --- | --- |
| Surge | 模块 | `.sgmodule` | `surge-module` | `surge:///install-module?url=` |
| Loon | 插件 | `.plugin` | `loon-plugin` | `loon://import?plugin=` |
| Stash | 覆写 | `.stoverride` | `stash-stoverride` | `stash://install-override?url=` |
| Shadowrocket | 模块 | `.sgmodule` | `shadowrocket-module` | `shadowrocket://install?module=` |

`target` 取值与后缀来自 Script-Hub 页面源码。转换结果形如：

```text
http://script.hub/file/_start_/<源链接>/_end_/<文件名><后缀>?target=<target>
```

因此可以从 `target` 参数、路径后缀或文件内容识别目标。

## 功能

- **更新全部**：扫描目录，逐个读取 `#SUBSCRIBED` 并回写
- **更新单个**：详情页更新、远程导入、分享本地文件、复制链接、删除
- **从链接安装**：保存为对应目标的文件；同名不同源自动另存 `-1`
- **目标识别**：`target` 参数 → 路径后缀 → 文件内容（`# @target` / YAML）
- **直接粘贴导入链接**：支持 `surge://`、`loon://`、`stash://`、`shadowrocket://` 与 Script-Hub 的包装链接
- **URL Scheme**：`scripting://run/ModuleDock?url=&name=&target=`
- **目录书签**：选一次目录，重启仍可读写
- **重载 Surge**：请求 `http://script.hub/reload`

> `script.json` 的 `name` 必须与脚本目录名一致（两者都是 `ModuleDock`）。不一致时 `scripting://run/...` 可能只打开 App 而不运行脚本。

## 本地文件的订阅标记

四端共三类文件格式，都能安全携带订阅信息：

- Surge / Loon / Shadowrocket：在最后一条 `#!` 指令后写 `#SUBSCRIBED`、`# @target`
- Stash：YAML 不能乱改字段，只在文件顶部写同样的注释

更新时先移除旧标记再重新写入，反复更新不会堆叠。

## 反劫持模块

| App | 文件 |
| --- | --- |
| Surge / Egern | `Scriptable2Scripting.sgmodule` |
| Shadowrocket | `Scriptable2Scripting.shadowrocket.sgmodule` |
| Loon | `Scriptable2Scripting.plugin` |
| Stash | `Scriptable2Scripting.stoverride` |

四份实现的共同功能：

1. 把 `scriptable://` 安装链接改写为 `scripting://`
2. 去掉 `target="_blank"`，避免 iOS Safari 在新标签页里打开自定义协议时报「网址无效」
3. **追加** Loon / Stash / Shadowrocket 的「本地模块」按钮，原有远程导入按钮保持不变

> 文件名沿用历史命名 `Scriptable2Scripting.*`，与 Scriptable App 无关。

## 内置浏览器脚本

`browser.tsx` 由 Scripting 构建为 Safari 浏览器脚本，`@match` 覆盖所有站点，但只在本地改写 `<a href>`，不发起网络请求：

- 捕获阶段改写点击
- 改写已有链接
- 去掉三个远程导入按钮的 `target="_blank"`
- `MutationObserver` 处理动态插入
- 为三个远程导入按钮注入「本地模块」兄弟节点（保留原按钮；响应脚本已注入时自动跳过）
- 重写 `window.open`

## 结构

```text
index.tsx                入口（解析 url / name / target）
app.tsx                  NavigationStack 路由 + 图标/状态 Provider
browser.tsx              内置 Safari 浏览器脚本
local-module.js          反劫持模块的响应脚本（追加本地模块按钮）
Scriptable2Scripting.sgmodule              Surge / Egern
Scriptable2Scripting.shadowrocket.sgmodule Shadowrocket
Scriptable2Scripting.plugin                Loon
Scriptable2Scripting.stoverride            Stash
pages/                   首页 / 添加 / 详情 / 设置
components/              GlassCard、GlassText、ModuleRow、TargetBadge、StatTile、TopToolbar、ToastHost
contexts/                LibraryContext、IconContext、Toast
services/                moduleService、settingsStore、iconStore
utils/                   moduleContent、targets
design/AllPatternDesign  Liquid Glass、动效与 frame 令牌
constants/               index、targets、appIcons
types/index.ts           数据类型
```

## 校验

- TypeScript 诊断 0 项
- Script-Hub 线上转换结果：四种目标的后缀、`#!name` / YAML `name`、`#SUBSCRIBED` 回写、目标标记往返全部通过
- 线上页面 HTML 跑 `local-module.js`：三个本地按钮各注入 1 次，均紧跟对应远程按钮