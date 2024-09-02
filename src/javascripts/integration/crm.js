import { loadCrmConfiguration, loadCrmUsers,
  openInteractionReports, screenPopUserByPhone, findUser, screenPopUserById, 
  enableClickToDial, saveInteractionLog, getCustomFieldsValues } from '../integration/zendesk';
import { createCTDMessage, publishMessage, createUserResult, composeInteractionLog } from '../utils/utils';

let clientIframe = {}

export const CRM_CONNECT_ORIGIN = 'https://eus2-01.dev.ws-nonprod.avayacloud.com';

export const addCRMConnectListeners = (callback) => {
  window.addEventListener('message', callback);
};

export const removeCRMConnectListeners = (callback) => {
  window.removeEventListener('message', callback);
};

export const processCRMConnectMessageData = async (event) => {
  if (event.origin !== CRM_CONNECT_ORIGIN) { 
      return; 
  }

  const { action, data } = event.data;
  clientIframe = document.getElementById('crmConnectIframeId');

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

const processSaveInteractionLog = (data) => {
  const composedInteractionData = composeInteractionLog(data.message.body);
  saveInteractionLog(composedInteractionData);
  const msgData = {
    message: data.message,
    header: data.header
  }
  data.logParameters = composedInteractionData.custom_object_record.custom_object_fields;
  data.msgData = msgData;
  const returnedResponse = {
    taskId: composedInteractionData.custom_object_record.external_id,
    data: data,
  }
  sendCreateHistoryRequest(returnedResponse);
};

const sendCreateHistoryRequest = (data) => {
  publishMessage(clientIframe, CRM_CONNECT_ORIGIN, 'ClientAppMessage', 'createHistoryItem', data);
}

const processRequestCustomFieldsValues = async (data) => {
  const customFields = await getCustomFieldsValues(data.object);
  publishMessage(clientIframe, CRM_CONNECT_ORIGIN, 'ClientAppMessage', 'customFieldsDataResponse', customFields);
}

const sendReadyPing = () => {
  publishMessage(clientIframe, CRM_CONNECT_ORIGIN, 'ClientAppMessage', 'ready');
}

const sendCRMData = () => {
  loadCrmConfiguration().then(data => {
    if (!data) {
      return;
    }
    publishMessage(clientIframe, CRM_CONNECT_ORIGIN, 'ClientAppMessage', 'crmData', data);
  });
}

const processGetCRMDirectory = async () => {
  loadCrmUsers().then(crmUsers => {
    if (!crmUsers) {
      return;
    }
    publishMessage(clientIframe, CRM_CONNECT_ORIGIN, 'ClientAppMessage', 'crmDirectory', crmUsers);
  });
}

export const handleErrors = (error) => {
  if (!error) {
    return;
  }
  publishMessage(clientIframe, CRM_CONNECT_ORIGIN, 'ClientAppMessage', 'displayErrorNotification', error);
}

export const clickToDialListener = async (event) => {
  const user = await findUser(event.userId);
  const result = createUserResult(user);
  const body = createCTDMessage(result);
  publishMessage(clientIframe, CRM_CONNECT_ORIGIN, 'ClientAppMessage', 'clickToDialResponse', body);
}

const navigateToClickToDial = (data) => {
  screenPopUserById(data.recordId);
}

const processInteractionScreenPop = (data) => {
  if (!data) {
    return;

  }
  if (!data.aniValues) {
    return;
  }

  const screenPopValue = data.aniValues[0] || data.aniValues[1];
  screenPopUserByPhone(screenPopValue);
};

const processOpenReports = () => {
  openInteractionReports();
};
