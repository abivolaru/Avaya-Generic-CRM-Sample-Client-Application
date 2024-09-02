import React from 'react';
import { resizeContainer } from '../lib/helpers';
import { addCRMConnectListeners, removeCRMConnectListeners, processCRMConnectMessageData } from '../integration/crm';
import { IFRAME_PROPS } from '../config/configs';
import { ZENDESK_CLIENT } from '../integration/zendesk';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.setClientIframe = this.setClientIframe.bind(this);
    resizeContainer(ZENDESK_CLIENT);
    addCRMConnectListeners(processCRMConnectMessageData);
  }

  setClientIframe = () => {
    return (
      <iframe {...IFRAME_PROPS} />
    );
  }

  render() {
    return (
      <React.Fragment>
        { this.setClientIframe() }
      </React.Fragment>
    );
  }
}

export default App;
