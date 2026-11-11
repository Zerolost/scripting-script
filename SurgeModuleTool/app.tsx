import { useCallback, useState, ZStack } from "scripting"
import { LibraryProvider } from "./contexts/LibraryContext"
import { loadSettings } from "./services/settingsStore"
import { ToastHost } from "./components/ToastHost"
import type { Navigate, Route } from "./types"
import { HomePage } from "./pages/HomePage"
import { AddModulePage } from "./pages/AddModulePage"
import { ModuleDetailPage } from "./pages/ModuleDetailPage"
import { SettingsPage } from "./pages/SettingsPage"

/** 应用根组件：用内部路由切换页面，保证 Context 始终可用 */
export function App({
  initialUrl,
  initialName,
}: {
  initialUrl?: string
  initialName?: string
}) {
  const [settings] = useState(() => loadSettings())
  const [route, setRoute] = useState<Route>(
    initialUrl ? { name: "add", url: initialUrl, moduleName: initialName } : { name: "home" }
  )

  // 不使用整页 withAnimation：避免子页面返回时 ZStack 短暂重叠出系统材质残影
  const go = useCallback<Navigate>(next => {
    setRoute(next)
  }, [])

  function renderRoute() {
    switch (route.name) {
      case "add":
        return (
          <AddModulePage
            go={go}
            initialUrl={route.url}
            initialName={route.moduleName}
          />
        )
      case "detail":
        return <ModuleDetailPage go={go} path={route.path} />
      case "settings":
        return <SettingsPage go={go} />
      default:
        return <HomePage go={go} />
    }
  }

  return (
    <LibraryProvider initialSettings={settings}>
      <ZStack>
        {renderRoute()}
        <ToastHost />
      </ZStack>
    </LibraryProvider>
  )
}
