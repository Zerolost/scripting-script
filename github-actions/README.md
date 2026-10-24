# GitHub Actions 管理

在 Scripting 中查看工作流、运行记录和任务步骤，手动触发运行，也可以用桌面小组件关注常用工作流。

## 安装

在 Scripting 的脚本导入功能中填写下面的项目地址：

```text
https://github.com/Zerolost/scripting-script/tree/main/github-actions
```

或者点击[安装](https://www.scripting.fun/import_scripts/?urls=%5B%22https%3A%2F%2Fgithub.com%2FZerolost%2Fscripting-script%2Ftree%2Fmain%2Fgithub-actions%22%5D)直接导入到scripting

这个地址指向集合仓库中的单个脚本目录。也可以下载仓库，将 `github-actions/` 内的全部文件复制到本地脚本目录，保留子目录结构。项目根目录应直接包含 `script.json` 和 `index.tsx`。

## 开始使用

运行脚本，填写 GitHub 用户名和 Token。私有仓库需要授予对应仓库的访问权限；手动运行还需要 Actions 写入权限，并要求工作流支持 `workflow_dispatch`。

首页只显示有 Actions 工作流的仓库。选择仓库、工作流后，可以查看运行记录；点开记录查看任务、步骤和耗时。运行记录页右上角的「运行」使用仓库默认分支触发工作流。

设置入口位于刷新按钮左侧。在「设置 → 小组件设置」选择工作流，再将脚本的小组件添加到桌面。大号最多显示八个目标，中号和小号显示最近触发的目标；大号会随目标数量调整历史记录条数。

下次运行时间按 GitHub cron 的 UTC 时间计算，再转换成本地时间。小组件约十分钟请求一次时间线刷新，实际刷新时间由系统安排。

## 外观与系统支持

iOS 26 使用官方 Liquid Glass；iOS 17、18 使用官方 Material 与系统按钮回退。版本分流已经过逻辑检查，旧系统的实际显示仍需实机验证。

在「设置 → 外观调试」中可以调整颜色、字号、玻璃、动画和小组件排版。每个分组都有常开的总预览，默认跟随系统深浅色，也能手动切换。参数分批显示，右上角翻页只切换参数区。

默认配置集中在 [visual.config.ts](visual.config.ts)。调试值保存后会覆盖默认配置，恢复默认会清除这些覆盖。

- [外观说明](docs/appearance.md)
- [接入自己的主页](docs/home-screen.md)

## 更新来源

在 Scripting 的脚本设置中，将远程资源设为(由“安装”导入的这不需要配置)：

```text
https://github.com/Zerolost/scripting-script/tree/main/github-actions
```

可将检查间隔设为 3600 秒。是否自动应用更新，由 Scripting 的全局自动更新开关控制。更新前如有修改默认配置，建议先留一份副本。

## 文件结构

```text
index.tsx                   运行入口
home_screen_default_ui.tsx  主页入口
widget.tsx                  桌面小组件
app_intents.tsx             小组件动作
script.json                 脚本信息
visual.config.ts            默认外观
pages/                      页面
components/                 公共组件与动画
hooks/                      状态与主题
services/                   GitHub 请求与业务逻辑
design/                     材质与版本兼容
integration/                主页接入与宿主适配
docs/                       使用说明
```
