async function findTabsForHostnames(hostnames, browseAllWindows) {
  if (hostnames.length == 0) {
    return []
  }
  const queryOptions = {
    url: hostnames.map((host) => `*://${host}/*` ),
  }
  if (!browseAllWindows) {
    queryOptions.currentWindow = true
  }
  return await chrome.tabs.query(queryOptions)
}

// Main

async function twist(tabs, discardDups) {
  if (tabs.length == 0) {
    throw new Error("Can't twist an empty list of tabs")
  } else {
    var [tab, ...extraTabs] = tabs
    // console.log({ tab, extraTabs })

    // TODO: Move deduplication logic outside `twist`. Remember that dedup may
    //       need to run before, since `twist` may terminate the execution when
    //       called from the popup.
    if (discardDups) {
      extraTabs = extraTabs.reduce((acc, cur) => {
        const existing = new Set(acc.map((tab) => tab.url))
        if (existing.has(cur.url) || cur.url == tab.url) {
          // Destroy duplicated tabs.
          chrome.tabs.remove(cur.id)
        } else {
          // Collect tabs for unique URLs.
          acc.push(cur)
        }
        return acc
      }, [])
      // console.log({ extraTabs })
    }

    if (extraTabs.length == 0) {
      // If `tab` is the current tab, and this is being called from the popup,
      // this call will terminate the execution.
      await chrome.windows.create({
        focused: true,
        tabId: tab.id,
      })
    } else {
      // Create a new window to move the tabs there.
      // FIXME: Seems in Firefox this call closes the popup and terminates the execution.
      const newWindow = await chrome.windows.create({
        focused: false,
      })
      // Default new tab to be removed.
      const newTabId = newWindow.tabs[0].id

      // Move tabs to the new window.
      await chrome.tabs.move(
        extraTabs.map((tab) => tab.id),
        { index: 0, windowId: newWindow.id }
      )
      await chrome.tabs.remove(newTabId)

      // If `tab` is the current tab, and this is being called from the popup,
      // this call will terminate the execution.
      await chrome.tabs.move(tab.id, { index: 0, windowId: newWindow.id })
    }
  }
}

export { findTabsForHostnames, twist }
