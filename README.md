*Use of this software is subject to important terms and conditions as set forth in the License file*

# Custom Client Application Scaffold

## Description
This repo contains a scaffold to help developers build a React custom client application which uses the Generic CRM Connector Framework to communicate with the Avaya Workspaces for CRM.

## Getting Started

### Dependencies
- [Node.js](https://nodejs.org/en/) >= 18.12.1

### Setup
1. Clone or fork this repo
2. Run `npm i`

To run your app locally in Zendesk, you need the latest [Zendesk CLI](https://github.com/zendesk/zcli).

### Running locally

To serve the app to your Zendesk instance with `?zcli_apps=true`, open a new terminal and run

```
npm run watch
```
and then open a new terminal and run
```
npm run start
```

## Folder structure

The folder and file structure of the App Scaffold is as follows:

| Name                                    | Description                                                                                  |
|:----------------------------------------|:---------------------------------------------------------------------------------------------|
| [`.github/`](#.github)                  | The folder to store PULL_REQUEST_TEMPLATE.md, ISSUE_TEMPLATE.md and CONTRIBUTING.md, etc     |
| [`dist/`](#dist)                        | The folder in which webpack packages the built version of your app                           |
| [`spec/`](#spec)                        | The folder in which all of your test files live                                              |
| [`src/`](#src)                          | The folder in which all of your source JavaScript, CSS, templates and translation files live |
| [`webpack/`](#src)                      | translations-loader and translations-plugin to support i18n in the application               |                                           
| [`jest.config.js`](#packagejson)        | Configuration file for Jest                                                                  |
| [`package.json`](#packagejson)          | Configuration file for Project metadata, dependencies and build scripts                      |
| [`postcss.config.js`](#packagejson)     | Configuration file for PostCSS                                                               |
| [`webpack.config.js`](#webpackconfigjs) | Configuration file that webpack uses to build your app                                       |

## How to configure your CCDef (Contact Center Definition)
1. Navigate to the src folder (`cd /src`) and create a config file named `zcli.apps.config.json` where you have to input your CCDef in JSON format. (If it not provided in the repo make sure to also check the documentation page for the example)
2. Open the `webpack.config.js` file and under the `plugins` section add the following plugin at the end of the `CopyWebpackPlugin` constructor
```js
new CopyWebpackPlugin({
  patterns: [
    { from: 'src/manifest.json', to: '../[name][ext]' },
    { from: 'src/images/*', to: './[name][ext]' },
    { from: 'src/zcli.apps.config.json', to: '../[name][ext]' }, // This one
  ]
}),
```

## How to see the CRMConnector iFrame and its properties
1. Navigate to `app.js` file and check out the `setClientIframe` method. This method returns the associated HTML iframe object with the required properties already set. The properties are as follows
```js
setClientIframe = () => {
  return (
    <iframe {...IFRAME_PROPS} />
  );
}

export const IFRAME_PROPS = {
  id: "crmConnectIframeId", // Mandatory with this id
  src: "", // <your own Avaya integration URL>
  style: IFRAME_STYLE, // your own styling object 
  frameBorder: "0", // remove the iframe border
  allow: "camera; microphone; geolocation" // mandatory permissions
}
```
2. The `render` method will make sure this iframe will be displayed whenever the application gets launched from the Zendesk UI
```js
render() {
  return (
    <React.Fragment>
      { this.setClientIframe() }
    </React.Fragment>
  );
}
```
## How does the communication between the client app and CRMConnector work?

### Prerequisites
1. Knowledge about the 2-way handshake mechanism
2. Knowledge about the [postMessage web API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

### Mechanism
1. When the application is launched and the iFrame is loaded, the `CRMConnector` will send a `ready` event to the client application.
2. The client application sends a `ready` event back to the `CRMConnector`
3. `CRMConnector` will send a `requestCrmData` event
4. `ClientApp` will fetch the data using the *Zendesk's CRM API* (or the desired CRM's) and send it back to the `CRMConnector` which will activate the agent's session.
5. Repeat for each of the `CRMConnector` and `ClientApp` events (check the documentation for more in-depth information)

### Basic implementation
1. Navigate to the `crm.js` file and study the `addCRMConnectListeners` & `processCRMConnectMessageData` methods
```js
export const addCRMConnectListeners = (callback) => {
  window.addEventListener('message', callback);
};

export const processCRMConnectMessageData = async (event) => {
  // Check the origin of the event to match the CRMConnect origin
  if (event.origin !== CRM_CONNECT_ORIGIN) { 
    return; 
  }

  // Fetch the required data from the CRMConnect event
  // Fetch the crmConnectIframe in order to use the postMessage API
  const { action, data } = event.data;
  clientIframe = document.getElementById('crmConnectIframeId');

  // Catch and process each of the CRMConnect events
  if (action === 'ready') {
    sendReadyPing();
  } else if (action === 'requestCrmData') {
    sendCRMData();
  } else if (action === 'requestGetCrmDirectory') {
    processGetCRMDirectory();
  } else if (action === 'requestEnableClickToDial') {
    enableClickToDial(data.isEnabled)
  } else if (action === 'requestNavigateToClickToDialResult') {
    navigateToClickToDial(data);
  } else if (action === 'requestPerformInteractionScreenPop') {
    processInteractionScreenPop(data);
  } else if (action === 'requestOpenReports') {
    processOpenReports();
  } else if (action === 'requestSaveInteractionLog') {
    processSaveInteractionLog(data);
  } else if (action === 'requestCustomFieldsValues') {
    processRequestCustomFieldsValues(data);
  }
};
```

2. Navigate to `utils.js` and study the `publishMessage` method in order to see how to utilize the `postMessage` API

```js
export const publishMessage = (src, dest, type, action, data = {}) => {
  const msg = { type, action, data };
  src.contentWindow.postMessage(msg, dest);
}
```

3. Check the documentation for further information regarding the required/received message bodies, how to implement the `processEvent` methods and how to pass the response to the `CRMConnect` application.