import { handleTab } from "./core.js"

const buttonMoveTabs = document.getElementById("btn-move-tabs")

buttonMoveTabs.addEventListener("click", async () => {
  // TODO: Logic to pick current tab shouldn't be here.
  const [tab] = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  })

  const { checked: discardDups } = document.getElementById("flag-discard-dups")
  const { checked: browseAllWindows } = document.getElementById("flag-browse-all-windows")

  handleTab(tab, discardDups, browseAllWindows)
})
