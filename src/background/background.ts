// Background script for handling sidebar
chrome.action.onClicked.addListener(async (tab) => {
  // Open sidebar when extension icon is clicked
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (error) {
      console.error('Error opening sidebar:', error)
    }
  }
})

// Enable sidebar for Twitter/X pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('x.com') || tab.url.includes('twitter.com')) {
      try {
        await chrome.sidePanel.setOptions({
          tabId,
          path: 'sidebar.html',
          enabled: true
        })
      } catch (error) {
        console.error('Error setting sidebar options:', error)
      }
    }
  }
})