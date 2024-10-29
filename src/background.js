import { handleTab } from "./core.js"

function main() {
  // Run when the extension icon is clicked.
  chrome.action.onClicked.addListener(handleTab)
}

main()
