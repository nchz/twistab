import { getCurrentTab, findMatchingTabs, twist } from "./core.js"

const currentTab = await getCurrentTab()

const getFlagDiscardDups = () => document.getElementById("flag-discard-dups").checked
const getFlagBrowseAllWindows = () => document.getElementById("flag-browse-all-windows").checked

const buttonMoveTabs = document.getElementById("btn-move-tabs")

const setButtonText = async () => {
  const browseAllWindows = getFlagBrowseAllWindows()
  const tabs = await findMatchingTabs(currentTab, browseAllWindows)

  const discardDups = getFlagDiscardDups()
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

const flagDiscardDups = document.getElementById("flag-discard-dups")
const flagBrowseAllWindows = document.getElementById("flag-browse-all-windows")
flagDiscardDups.addEventListener("change", setButtonText)
flagBrowseAllWindows.addEventListener("change", setButtonText)
