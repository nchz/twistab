async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  })
  return tab
}

async function findMatchingTabs(forTab, browseAllWindows) {
  // Find other tabs with the same domain as current tab.
  const { host } = new URL(forTab.url)
  const queryOptions = {
    url: `*://${host}/*`,
  }
  if (!browseAllWindows) {
    queryOptions.currentWindow = true
  }
  return await chrome.tabs.query(queryOptions)
}

async function twist(currentTab, browseAllWindows, discardDups) {
  // Create a new window to move the tabs there.
  const newWindow = await chrome.windows.create({
    focused: true,
    //
    // NOTE: popup is closed when current tab is (re)moved, and this execution
    //       is interrupted. So we can't move the current tab now.
    // tabId: currentTab.id,
    //
    // NOTE: Instead we reload the current URL into the new window, and the
    //       current tab is removed as the latest step.
    url: currentTab.url,
    // FIXME: This URL reload may result in e.g. form field data loss !!
    //
  })

  // Find other tabs with the same domain as current tab.
  var matchedTabs = await findMatchingTabs(currentTab, browseAllWindows)
  matchedTabs = matchedTabs.filter((tab) => tab.id != currentTab.id)
  if (discardDups) {
    matchedTabs = matchedTabs.reduce((acc, cur) => {
      const existing = new Set(acc.map((tab) => tab.url))
      if (existing.has(cur.url) || cur.url == currentTab.url) {
        // Destroy duplicated tabs.
        chrome.tabs.remove(cur.id)
      } else {
        // Collect tabs for unique URLs.
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
  await chrome.tabs.remove(currentTab.id)
}

export { getCurrentTab, findMatchingTabs, twist }
