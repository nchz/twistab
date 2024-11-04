import { findMatchingTabs, twist } from "./core.js"

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

const getFlagDiscardDups = () => document.getElementById("flag-discard-dups").checked
const getFlagBrowseAllWindows = () => document.getElementById("flag-browse-all-windows").checked

// Get context details

const currentTab = await getCurrentTab()
const { url: currentUrl, favIconUrl: currentFavIconUrl } = currentTab
const { host: currentDomain } = new URL(currentUrl)

const tabList = await chrome.tabs.query({ currentWindow: true })
const tabDomainList = tabList.reduce(
  (acc, cur) => {
    const { host } = new URL(cur.url)
    const iconUrl = cur.favIconUrl
    if (acc.filter((t) => t[0] == host).length == 0) {
      acc.push([host, iconUrl])
    }
    return acc
  },
  [[currentDomain, currentFavIconUrl]]
)

// Main button

const buttonMoveTabs = document.getElementById("button-move-tabs")

const setButtonText = async () => {
  const discardDups = getFlagDiscardDups()
  const browseAllWindows = getFlagBrowseAllWindows()
  const tabs = await findMatchingTabs(currentTab, browseAllWindows)

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

await setButtonText()

buttonMoveTabs.addEventListener("click", () => {
  const browseAllWindows = getFlagBrowseAllWindows()
  const discardDups = getFlagDiscardDups()
  twist(currentTab, browseAllWindows, discardDups)
})

// Settings panel

const flagDiscardDups = document.getElementById("flag-discard-dups")
const flagBrowseAllWindows = document.getElementById("flag-browse-all-windows")
flagDiscardDups.addEventListener("change", setButtonText)
flagBrowseAllWindows.addEventListener("change", setButtonText)

// Select buttons

const buttonSelectAll = document.getElementById("button-select-all")
const buttonInvertSelection = document.getElementById("button-invert-selection")
buttonSelectAll.addEventListener("click", () => {
  domainList.querySelectorAll("input[type='checkbox']").forEach((c) => {
    c.checked = true
  })
})
buttonInvertSelection.addEventListener("click", () => {
  domainList.querySelectorAll("input[type='checkbox']").forEach((c) => {
    c.checked = !c.checked
  })
})

// Domain list

const domainList = document.getElementById("domain-list")

tabDomainList.forEach(([host, iconUrl]) => {
  const row = document.createElement("tr")

  // Checkbox cell
  const checkboxCell = document.createElement("th")
  checkboxCell.scope = "row"
  const checkbox = document.createElement("input")
  checkbox.id = host
  checkbox.className = "form-check"
  checkbox.type = "checkbox"
  checkbox.checked = host == currentDomain

  checkboxCell.appendChild(checkbox)

  // Domain cell
  const domainCell = document.createElement("td")
  // Favicon
  const icon = document.createElement("img")
  icon.src = iconUrl
  // icon.className = "favicon"
  icon.style.width = "16px"
  icon.style.height = "16px"
  icon.style.marginRight = "8px"

  domainCell.appendChild(icon)
  domainCell.appendChild(document.createTextNode(host))

  row.appendChild(checkboxCell)
  row.appendChild(domainCell)
  domainList.appendChild(row)

  // Toggle checkbox when row is clicked.
  row.addEventListener("click", () => {
    checkbox.checked = !checkbox.checked
  })
  // Prevent event propagation to avoid double toggling when clicking directly on the checkbox.
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation()
  })
})
