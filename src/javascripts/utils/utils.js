export const publishMessage = (src, dest, type, action, data = {}) => {
  const msg = { type, action, data };
  src.contentWindow.postMessage(msg, dest);
}

export const validateContactMethods = (user) => Boolean(user && (user.email || user.phone));

export const getDirectoryNumbers = (users) => users
  .filter(validateContactMethods)
  .map(({ id, name, phone, email }) => ({ id, name, phone, email }));

export const createCTDMessage = (result) => ({
  onClickToDialResponse: result,
  clickToDialLogDetails: {
    id: result.recordId,
    name: result.recordName,
    personAccount: true,
    type: result.objectType
  },
  softphoneItems: [],
  doNotCall: false,
  crmEmails: result.email,
  crmPhones: [result.number],
  nameObjects: null,
  relatedToObjects: [{
    isName: false,
    isRelatedTo: true,
    pageInfo: {
      recordId: result.recordId,
      url: result.url,
      recordName: result.recordName,
      objectType: 'End User',
    }
  }],
  pageInfo: result
});

export const createUserResult = (user) => ({
  number: user.phone,
  objectType: 'End User',
  recordId: user.id,
  recordName: user.name,
  email: user.email,
  url: user.url.replace('.json', ''),
});

export const composeInteractionLog = (data) => {
  if (!data) {
    return;
  }

  if (!data.interactionId) {
    return;
  }

  if (!data.interactionData) {
    return;
  }
  const externalInteractionId = data.interactionId;
  const interactionDetails = data.interactionData;
  const durationInSeconds = retrieveDurationInSeconds(interactionDetails.interaction.intrinsics?.START_TIME);

  const customFieldValues = data.interactionData.logDetails?.customFields.map(customFieldDetails => (
    { name: customFieldDetails.logFieldName, value: customFieldDetails.currentValue }));

  const interactionDataPackage = {
    custom_object_record: {
      name: externalInteractionId,
      external_id: externalInteractionId,
      custom_object_fields: {
        interaction_type: interactionDetails.logDetails?.subject,
        caller: interactionDetails.updatedOriginatingAddress,
        called: interactionDetails.updatedDestinationAddress,
        start_time: interactionDetails.interaction.intrinsics?.START_TIME,
        start_date: interactionDetails.interaction.intrinsics?.START_DATE,
        duration: durationInSeconds + '-',
        topic: interactionDetails.interaction?.topic,
        comments: interactionDetails.logDetails?.comments,
      }
    }
  };

  customFieldValues.forEach(customField => {
    interactionDataPackage.custom_object_record.custom_object_fields[customField.name] = customField.value
  });

  return interactionDataPackage;
}

export const retrieveDurationInSeconds = (startTime) => {
  if (!startTime) {
    return;
  }
  const timeParts = startTime.split(/[():]/);

  if (!timeParts.length) {
    return;
  }

  const [startHour, startMinute, startSecond] = timeParts.map(part => parseInt(part, 10));

  if ([startHour, startMinute, startSecond].some(isNaN)) {
    return;
  }
  
  const endTime = new Date();
  const durationInSeconds = ((endTime.getHours() - startHour) * 3600) + ((endTime.getMinutes() - startMinute) * 60) + (endTime.getSeconds() - startSecond);

  if (isNaN(durationInSeconds)) {
    return;
  }
  
  return durationInSeconds;
};