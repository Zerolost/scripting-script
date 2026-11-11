// @ts-nocheck
// ==UserScript==
// @name         Scriptable → Scripting 链接跳转
// @namespace    surge-module-tool
// @version      1.1.0
// @description  把网页中的 scriptable:// 链接改写为 scripting://，点一下直接交给 Scripting 打开
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// 该文件由 Scripting 项目直接构建为 Safari 浏览器脚本，无需再导入 .user.js。
(function () {
  "use strict"

  // 先处理更具体的路径，再做兜底替换
  var RULES = [
    ["scriptable:///run_single/", "scripting://run_single/"],
    ["scriptable:///run/", "scripting://run/"],
    ["scriptable:///", "scripting://"],
    ["scriptable://", "scripting://"]
  ]

  function convert(value) {
    if (!value || typeof value !== "string" || value.indexOf("scriptable:") === -1) {
      return value
    }
    var result = value
    for (var i = 0; i < RULES.length; i++) {
      result = result.split(RULES[i][0]).join(RULES[i][1])
    }
    return result
  }

  // 捕获阶段拦截点击，直接跳到 scripting://
  function onClick(event) {
    var node = event.target
    while (node && node !== document) {
      if (node.tagName === "A" && node.href && String(node.href).indexOf("scriptable:") !== -1) {
        event.preventDefault()
        event.stopPropagation()
        try {
          window.location.href = convert(node.getAttribute("href"))
        } catch (error) {
          console.log("[Scriptable→Scripting] 跳转失败", error)
        }
        return
      }
      node = node.parentNode
    }
  }

  // 改写页面里已有的链接，右键复制 / 新标签打开也能拿到 scripting://
  function rewrite(root) {
    if (!root || !root.querySelectorAll) {
      return
    }
    var list = root.querySelectorAll('a[href*="scriptable:"], area[href*="scriptable:"]')
    for (var i = 0; i < list.length; i++) {
      var raw = list[i].getAttribute("href")
      var next = convert(raw)
      if (next !== raw) {
        list[i].setAttribute("href", next)
      }
    }
  }

  var observer = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var added = records[i].addedNodes
      for (var j = 0; j < added.length; j++) {
        var node = added[j]
        if (node.nodeType === 1) {
          rewrite(node)
        }
      }
    }
  })

  function start() {
    rewrite(document)
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true })
    }
    document.addEventListener("click", onClick, true)
  }

  // window.open 也走同一套转换
  var rawOpen = window.open
  window.open = function (url) {
    var args = Array.prototype.slice.call(arguments)
    if (typeof url === "string") {
      args[0] = convert(url)
    }
    return rawOpen.apply(window, args)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true })
  } else {
    start()
  }
})()
