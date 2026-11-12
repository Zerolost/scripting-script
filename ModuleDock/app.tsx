import { NavigationDestination, NavigationStack, VStack, ZStack, useCallback, useObservable, useState } from "scripting"
import { LibraryProvider } from "./contexts/LibraryContext"
import { IconProvider } from "./contexts/IconContext"
import { loadSettings } from "./services/settingsStore"
import { ToastHost } from "./components/ToastHost"
import { fullFillFrame } from "./design/AllPatternDesign"
import type { Navigate, Route, TargetId } from "./types"
import { HomePage } from "./pages/HomePage"
import { AddModulePage } from "./pages/AddModulePage"
import { ModuleDetailPage } from "./pages/ModuleDetailPage"
import { SettingsPage } from "./pages/SettingsPage"

/** 路由编码成字符串 */
function encodeRoute(route: Route): string {
  return JSON.stringify(route)
}

function decodeRoute(raw: string): Route | null {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as Route
    if (parsed && typeof parsed.name === "string") {
      return parsed
    }
  } catch (error) {
    console.log("解析路由失败", error)
  }
  return null
}

export function App({
  initialUrl,
  initialName,
  initialTarget,
}: {
  initialUrl?: string
  initialName?: string
  initialTarget?: TargetId
}) {
  const [settings] = useState(() => loadSettings())
  const path = useObservable<string[]>(
    initialUrl
      ? [encodeRoute({ name: "add", url: initialUrl, moduleName: initialName, target: initialTarget })]
      : []
  )

  // 系统滑入动画与返回手势
  const go = useCallback<Navigate>(
    next => {
      if (next.name === "home") {
        path.setValue([])
        return
      }
      path.setValue([...path.value, encodeRoute(next)])
    },
    [path]
  )

  function renderRoute(raw: string) {
    const route = decodeRoute(raw)
    if (!route) {
      return <VStack />
    }
    switch (route.name) {
      case "add":
        return <AddModulePage go={go} initialUrl={route.url} initialName={route.moduleName} initialTarget={route.target} />
      case "detail":
        return <ModuleDetailPage go={go} path={route.path} />
      case "settings":
        return <SettingsPage go={go} />
      default:
        return <VStack />
    }
  }

  return (
    <IconProvider>
      <LibraryProvider initialSettings={settings}>
        <ZStack>
          <NavigationStack path={path}>
            <VStack
              frame={fullFillFrame}
              navigationDestination={<NavigationDestination>{renderRoute}</NavigationDestination>}
            >
              <HomePage go={go} />
            </VStack>
          </NavigationStack>
          <ToastHost />
        </ZStack>
      </LibraryProvider>
    </IconProvider>
  )
}
