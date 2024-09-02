import axiosInstance from '../api/axiosConfig';
import { getDirectoryNumbers } from '../utils/utils';
import { clickToDialListener } from './crm';

export const CLICK_TO_DIAL_EVENT = 'voice.dialout';
export const ZENDESK_CLIENT = ZAFClient.init();

let isListenerRegistered = false;

export const loadUserInfo = async () => {
  const user = await ZENDESK_CLIENT.get('currentUser');
  return {
    attributes: {
      type: user.currentUser.role
    },
    Name: user.currentUser.name,
    Username: user.currentUser.email,
    Id: user.currentUser.id,
    LanguageLocaleKey: user.currentUser.locale
  };
}

export const getSettingsMetadata = async () => {
  const res = await ZENDESK_CLIENT.metadata();
  if(!res.settings) {
    return;
  }
  return res.settings;
}

export const loadCrmConfiguration = async () => {
  const user = await loadUserInfo();
  const ccdef = await getSettingsMetadata();
  
  const result = {
    callCenterSettings: ccdef,
    currentUser: user,
    capabilities: {
      directoryAvailable: true,
      name: 'Zendesk',
      reloadsOnNavigation: true,
      lightningComponentsAvailable: false,
    }
  }
  return result;
}

export const getCustomFieldsValues = async (object) => {
  const voiceCustomFields = object.voice.map(element => element.toLowerCase()).filter(value => value !== '');
  const digitalCustomFields = object.digital.map(element => element.toLowerCase()).filter(value => value !== '');
  const customFields = {
    digital: await getCustomFieldAttributes(digitalCustomFields),
    voice: await getCustomFieldAttributes(voiceCustomFields)
  };
  return JSON.stringify(customFields);
}

export const getCustomFieldAttributes = async (fieldNames) => {
  const returnedCustomFieldResult = {};
  const response = await axiosInstance.get('/custom_objects/interaction_log/fields');

  if (response.status !== 200) {
    console.error('No custom fields found in the Zendesk system');
    return;
  }

  const customFields = response.data.custom_object_fields;
  if (!customFields.length) {
    return;
  }

  for (const field of customFields) {
    if (fieldNames.includes(field.key.toLowerCase())) {
      returnedCustomFieldResult[field.key] = parseCustomFieldAttributes(field);
    }
  }
  return returnedCustomFieldResult;
}

export const parseCustomFieldAttributes = (customField) => {
  if (!customField) {
    return;
  }
  return {
    customFieldInfo: {
      customFieldType: customField.type === 'text' ? 'STRING' : 'PICKLIST',
      customFieldLabel: customField.title
    }
  }
}

export const loadCrmUsers = async () => {
  const response = await axiosInstance.get('/users.json');

  if (response.status !== 200 || !response.data.users) {
    console.error('No users found in the Zendesk system');
    return;
  }

  const directoryNumbers = getDirectoryNumbers(response.data.users);
  if (!directoryNumbers.length) {
    return;
  }
  
  return {
    count: directoryNumbers.length.toString(),
    results: directoryNumbers
  }
}

export const destroyCTDListener = () => {
  ZENDESK_CLIENT.off(CLICK_TO_DIAL_EVENT, clickToDialListener);
  isListenerRegistered = false;
}

export const registerCTDListener = () => {
  ZENDESK_CLIENT.on(CLICK_TO_DIAL_EVENT, clickToDialListener);
  isListenerRegistered = true;
}

export const enableClickToDial = (isEnabled) => {
  if (isEnabled && !isListenerRegistered) {
    registerCTDListener();
  } else if (!isEnabled) {
    destroyCTDListener();
  }
};

export const findUser = async (userId) => {
  const response = await axiosInstance.get(`/users/${userId}.json`);
  const user = response.data.user;

  if (response.status !== 200 || !user) {
    console.error('No user found with the given id: ', userId);
  }

  return user;
}

export const findUserByPhoneNumber = async (phoneNumber) => {
  const response = await axiosInstance.get(`/search.json?query=phone:${phoneNumber}`);
  const users = response.data.results;

  if (response.status !== 200 || users.length === 0) {
    console.error('No user found with the given phone number: ', phoneNumber);
    return;
  }

  return users[0];
};

export const screenPopUserByPhone = async (phoneNumber) => {
  const user = await findUserByPhoneNumber(phoneNumber);
  await screenPopUser(user);
}

export const screenPopUserById = async (userId) => {
  const user = await findUser(userId);
  await screenPopUser(user);
}

export const screenPopUser = async (user) => {
  if (!user) {
    return;
  }

  await invokeZendeskClient('routeTo', 'user', user.id);
}

export const saveInteractionLog = async (interactionData) => {
  if (!interactionData) {
    return;
  }

  try {
    const response = await axiosInstance.post(`/custom_objects/interaction_log/records`, interactionData);

    if (!response || !response.data) {
      throw new Error('Invalid response received from server.');
    }

  } catch (error) {
    console.error('Error while saving interaction log:', error.message);
  }
};

// VIEW CRM REPORTS TO BE FIXED !
// export const openInteractionReports = async () => {
//   window.parent.location.href = '/agent/custom-objects';
// }

const invokeZendeskClient = async (routeType, ...args) => {
  ZENDESK_CLIENT.invoke(routeType, ...args);
};
