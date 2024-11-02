async function handleTab(tab) {
  // Get current tab details.
  const { id: currentTabId, url: currentTabUrl } = tab

  // Create a new window to move the tabs there.
  const newWindow = await chrome.windows.create({
    focused: false,
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

  // Find other tabs in current window with the same domain as current tab.
  const currentUrl = new URL(currentTabUrl)
  const matchedTabs = await chrome.tabs.query({
    url: `*://${currentUrl.host}/*`,
    active: false,
    // TODO: Validate which one to use.
    // lastFocusedWindow: true,
    currentWindow: true,
  })

  // Move extra tabs at the end of the new window.
  if (matchedTabs.length != 0) {
    await chrome.tabs.move(
      matchedTabs.map((tab) => tab.id),
      { index: -1, windowId: newWindow.id }
    )
  }

  // NOTE: When invoked from the popup, this will close the popup and thus end
  //       the main script execution.
  await chrome.tabs.remove(currentTabId)
}

export { handleTab }
