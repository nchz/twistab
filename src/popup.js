import { findTabsForHostnames, twist } from "./core.js"

// TODO: Move to "popup/utils.js" or so.

async function getCurrentTab() {
  // `chrome.tabs.getCurrent()` will return undefined in popup:
  // https://developer.chrome.com/docs/extensions/reference/api/tabs#method-getCurrent
  const [tab] = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  })
  return tab
}

async function getCurrentWindowTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  // NOTE: Keep only "http" and "https" URLs.
  return tabs.filter((t) => ["http:", "https:"].includes(new URL(t.url).protocol))
}

const getFlagDiscardDups = () => document.getElementById("flag-discard-dups").checked
const getFlagBrowseAllWindows = () => document.getElementById("flag-browse-all-windows").checked

// Get context details

const currentTab = await getCurrentTab()
const { url: currentUrl, favIconUrl: currentFavIconUrl } = currentTab
const { host: currentTabHost, origin: currentTabOrigin } = new URL(currentUrl)

const curWindowTabs = await getCurrentWindowTabs()
const curWindowTabHosts = curWindowTabs.reduce(
  (acc, cur) => {
    const { host: curHostname } = new URL(cur.url)
    const { favIconUrl: iconUrl } = cur
    if (!acc.map(([host, _]) => host).includes(curHostname)) {
      acc.push([curHostname, iconUrl])
    }
    return acc
  },
  [[currentTabHost, currentFavIconUrl]]
)

// Error messages panel

const errorMessagesPanel = document.getElementById("error-messages-panel")
const errorMessage = document.getElementById("error-message")

// Main button

const buttonMoveTabs = document.getElementById("button-move-tabs")

async function setButtonText(selectedHostnames) {
  const discardDups = getFlagDiscardDups()
  const browseAllWindows = getFlagBrowseAllWindows()

  const hostnames = selectedHostnames != undefined ? selectedHostnames : getSelectedHosts()
  const tabs = await findTabsForHostnames(hostnames, browseAllWindows)

  var tabCount
  if (discardDups) {
    tabCount = new Set(tabs.map((tab) => tab.url)).size
  } else {
    tabCount = tabs.length
  }

  if (browseAllWindows) {
    const windowCount = new Set(tabs.map((tab) => tab.windowId)).size
    buttonMoveTabs.textContent = `Move ${tabCount} tabs from ${windowCount} windows`
  } else {
    buttonMoveTabs.textContent = `Move ${tabCount} tabs`
  }
}

await setButtonText([currentTabHost])

async function main() {
  const discardDups = getFlagDiscardDups()
  const browseAllWindows = getFlagBrowseAllWindows()

  const selectedHostnames = getSelectedHosts()
  const tabs = await findTabsForHostnames(selectedHostnames, browseAllWindows)
  const tabIds = tabs.map((tab) => tab.id)

  var orderedTabs
  if (tabIds.includes(currentTab.id)) {
    orderedTabs = [currentTab, ...tabs.filter((tab) => tab.id != currentTab.id)]
  } else {
    orderedTabs = tabs
  }

  await twist(orderedTabs, discardDups)
}

buttonMoveTabs.addEventListener("click", async () => {
  try {
    await main()
  } catch (err) {
    errorMessage.textContent = err.message
    errorMessagesPanel.classList.remove("d-none")
  }
})

// Settings panel

const flagDiscardDups = document.getElementById("flag-discard-dups")
const flagBrowseAllWindows = document.getElementById("flag-browse-all-windows")
flagDiscardDups.addEventListener("change", () => {
  setButtonText()
})
flagBrowseAllWindows.addEventListener("change", () => {
  setButtonText()
})

// Select buttons

const buttonSelectAll = document.getElementById("button-select-all")
const buttonInvertSelection = document.getElementById("button-invert-selection")
buttonSelectAll.addEventListener("click", () => {
  hostnameList.querySelectorAll("input[type='checkbox']").forEach((c) => {
    c.checked = true
  })
  setButtonText()
})
buttonInvertSelection.addEventListener("click", () => {
  hostnameList.querySelectorAll("input[type='checkbox']").forEach((c) => {
    c.checked = !c.checked
  })
  setButtonText()
})

function getSelectedHosts() {
  const checkboxes = Array.from(hostnameList.querySelectorAll("input[type='checkbox']"))
  const checkedRows = checkboxes.filter((c) => c.checked)
  const selectedHostnames = checkedRows.map((c) => {
    const th = c.parentElement
    const td = th.nextElementSibling
    return td.textContent
  })
  return selectedHostnames
}

// Hostname list

const hostnameList = document.getElementById("hostname-list")

curWindowTabHosts.forEach(([host, iconUrl]) => {
  const row = document.createElement("tr")

  // Checkbox cell
  const checkboxCell = document.createElement("th")
  checkboxCell.scope = "row"
  const checkbox = document.createElement("input")
  checkbox.id = host
  checkbox.className = "form-check"
  checkbox.type = "checkbox"
  checkbox.checked = host == currentTabHost

  checkboxCell.appendChild(checkbox)

  // Hostname cell
  const hostnameCell = document.createElement("td")
  // Favicon
  const icon = document.createElement("img")
  icon.src = iconUrl
  icon.style.width = "16px"
  icon.style.height = "16px"
  icon.style.marginRight = "8px"

  hostnameCell.appendChild(icon)
  hostnameCell.appendChild(document.createTextNode(host))

  row.appendChild(checkboxCell)
  row.appendChild(hostnameCell)
  hostnameList.appendChild(row)

  // Toggle checkbox when row is clicked.
  row.addEventListener("click", () => {
    checkbox.checked = !checkbox.checked
    setButtonText()
  })
  // Prevent event propagation to avoid double toggling when clicking directly on the checkbox.
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation()
  })
})
