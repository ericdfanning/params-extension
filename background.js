// Copyright 2022 Google LLC

//

// Licensed under the Apache License, Version 2.0 (the "License");

// you may not use this file except in compliance with the License.

// You may obtain a copy of the License at

//

//     https://www.apache.org/licenses/LICENSE-2.0

//

// Unless required by applicable law or agreed to in writing, software

// distributed under the License is distributed on an "AS IS" BASIS,

// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

// See the License for the specific language governing permissions and

// limitations under the License.

 

chrome.runtime.onInstalled.addListener(async ({ tabId, url }) => {

  const { idKey } = await chrome.storage.local.get([`badgeState-${tabId}`]);

  let badgeState = 'OFF';

  if (idKey) {

      badgeState = idKey;

  }

  chrome.action.setBadgeText({

      text: badgeState

  });

});



const main = 'homedepot.com';

const qa = 'homedepotdev.com';



// When the user clicks on the extension action

chrome.action.onClicked.addListener(async (tab) => {

  if (tab.url.includes(main) || tab.url.startsWith(qa)) {

    // We retrieve the action badge to check if the extension is 'ON' or 'OFF'

    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });

    // Next state will always be the opposite

    const nextState = prevState === 'ON' ? 'OFF' : 'ON';



    // Set the action badge to the next state

    await chrome.action.setBadgeText({

      tabId: tab.id,

      text: nextState

    });



    if (nextState === 'ON') {



      console.log('ON', tab.id)

         

      chrome.scripting.executeScript({

          target: { tabId: tab.id },

          files: ['content-script.js']

      });



    } else if (nextState === 'OFF') {



      chrome.storage.local.set({ [`pageUrlForParamFowarding-${tab.id}`]: '' }).then(async () => {

          console.log('------- set pageUrlForParamFowarding to empty string --------');

 

      });

      console.log('OFF')

    }



    chrome.storage.local.set({ [`badgeState-${tab.id}`]: nextState }).then(() => {

      console.log("Updated Badge State in Local Storage");

    });

  } else {

      await chrome.action.setBadgeText({

          tabId: tab.id,

          text: 'OFF'

        });

  }

});



chrome.webNavigation.onBeforeNavigate.addListener(

  async function({ tabId, url }) {

      if (url?.includes(main) || url?.startsWith(qa)) {

          const storage = await chrome.storage.local.get([`badgeState-${tabId}`, `pageUrlForParamFowarding-${tabId}`]);



          let pageUrlForParamFowarding = storage[`pageUrlForParamFowarding-${tabId}`]

          let badgeState = 'OFF';

          if (storage[`badgeState-${tabId}`]) {

              badgeState = storage[`badgeState-${tabId}`];

          }

 

          chrome.action.setBadgeText({

              text: badgeState

          });

 

  

          if (badgeState == 'ON' && pageUrlForParamFowarding) {

 

              const newSearchParams = pageUrlForParamFowarding.split('?')?.[1];

              if (!newSearchParams) {

                  console.log('NO PARAMS TO ADD')

                  return

              };

             

              const [baseUrl, currentSearchParams] = url.split('?');

     

              let newUrlToUse = ''

              if (currentSearchParams) {

                  const filterDuplicateParams = currentSearchParams.split('&').filter(param => {

                      const currentKey = param.split('=')[0];

                      return !newSearchParams.includes(`${currentKey}=`)

                  });

                  const filteredParams = filterDuplicateParams.join('&');

                  newUrlToUse = `${baseUrl}?${filteredParams}${filteredParams !== '' ? '&':''}${newSearchParams}`

                  // console.log('what is the newUrlToUse when current page DOES HAVE params', newUrlToUse, 'filtered prams', filteredParams)

              } else {

                  newUrlToUse += `${baseUrl}?${newSearchParams}`

                  // console.log('what is the newUrlToUse when current page has now params', newUrlToUse)

              }

 

              if (url !== newUrlToUse) {

                  chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {

                      chrome.tabs.update( tabId, { url: newUrlToUse } );

                    });   

              } else {

                  console.log('URLS ARE THE SAME', url, newUrlToUse)

              }

          }

 

      }



  },

 {url: []}

);



chrome.webNavigation.onDOMContentLoaded.addListener(async ({ tabId, url }) => {

  if (url?.includes(main) || url?.startsWith(qa)) {

      chrome.scripting.executeScript({

          target: { tabId },

          files: ['content-script.js']

      });

  }

});



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {



  if (request?.currentUrl?.includes(main) || request?.currentUrl?.includes(qa)) {

      console.log('receiving in background',`pageUrlForParamFowarding-${sender.tab.id}`, request, sender.tab.id)

      // console.log('SETTING THE PAGE URL IN LOCAL STORAGE', request.currentUrl)

      chrome.storage.local.set({ [`pageUrlForParamFowarding-${sender.tab.id}`]: request.currentUrl }).then(async () => {

          console.log("Value is set in local storage", request.currentUrl);

 

      });

  }

  sendResponse({ thanks: "thank"})

});

