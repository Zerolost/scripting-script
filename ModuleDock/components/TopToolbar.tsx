import { Button, Toolbar, ToolbarItem, type VirtualNode } from "scripting"

/** Toolbar */
export function rootToolbar(dismiss: () => void, refresh: () => void, busy = false): VirtualNode {
  return (
    <Toolbar>
      <ToolbarItem placement="topBarLeading">
        <Button title="" systemImage="xmark" role="close" action={dismiss} buttonStyle="plain" />
      </ToolbarItem>
      <ToolbarItem placement="topBarTrailing">
        <Button title="" systemImage="arrow.clockwise" action={refresh} buttonStyle="plain" disabled={busy} />
      </ToolbarItem>
    </Toolbar>
  )
}

export function childToolbar(refresh: () => void, busy = false): VirtualNode {
  return (
    <Toolbar>
      <ToolbarItem placement="topBarTrailing">
        <Button title="" systemImage="arrow.clockwise" action={refresh} buttonStyle="plain" disabled={busy} />
      </ToolbarItem>
    </Toolbar>
  )
}
