async function handleTab(tab, discardDups, browseAllWindows) {
  // Get current tab details.
  const { id: currentTabId, url: currentTabUrl } = tab

  // Create a new window to move the tabs there.
  const newWindow = await chrome.windows.create({
    focused: true,
    //
    // NOTE: popup is closed when current tab is (re)moved, and this execution
    //       is interrupted. So we can't move the current tab now.
    // tabId: currentTabId,
    //
    // NOTE: Instead we reload the current URL into the new window, and the
    //       current tab is removed as the latest step.
    url: currentTabUrl,
    // FIXME: This URL reload may result in e.g. form field data loss !!
    //
  })

  // Find other tabs with the same domain as current tab.
  const currentUrl = new URL(currentTabUrl)
  const queryOptions = {
    url: `*://${currentUrl.host}/*`,
  }
  if (!browseAllWindows) {
    queryOptions.currentWindow = true
  }

  var matchedTabs = await chrome.tabs.query(queryOptions)
  matchedTabs = matchedTabs.filter((tab) => tab.id != currentTabId)

  if (discardDups) {
    matchedTabs = matchedTabs.reduce((acc, cur) => {
      const existing = new Set(acc.map((tab) => tab.url))
      if (existing.has(cur.url) || cur.url == currentTabUrl) {
        chrome.tabs.remove(cur.id)
      } else {
        acc.push(cur)
      }
      return acc
    }, [])
  }

  // Move extra tabs at the end of the new window.
  if (matchedTabs.length != 0) {
    await chrome.tabs.move(
      matchedTabs.map((tab) => tab.id),
      { index: -1, windowId: newWindow.id }
    )
  }

  // NOTE: When invoked from the popup, this will close the popup and thus
  //       terminate the execution.
  await chrome.tabs.remove(currentTabId)
}

export { handleTab }
