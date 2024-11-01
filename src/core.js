async function handleTab(tab) {
  // Get current tab details.
  const { id, url, index, title, favIconUrl } = tab

  // Find other tabs in current window with the same domain as current tab.
  const urlStruct = new URL(url)
  // console.log({ urlStruct });
  const tabs = await chrome.tabs.query({
    // url: `${urlStruct.origin}/*`,
    url: `*://${urlStruct.host}/*`,
    currentWindow: true,
    active: false,
  })
  // console.log(tabs);

  // Move current tab to a newly created window.
  const window = await chrome.windows.create({
    focused: true,
    tabId: id,
  })

  // Move tabs (if any) to the window we just created.
  if (tabs.length != 0) {
    const tabIds = tabs.map((t) => t.id)
    await chrome.tabs.move(tabIds, { index: -1, windowId: window.id })
  }
}

export { handleTab }
