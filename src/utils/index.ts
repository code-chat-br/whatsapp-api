import axios from 'axios';

export async function getBroadcastInfo({ broadcast_id, token }) {
  try {
    return await axios.get(
      `https://shopify-sms-staging.herokuapp.com/whatsapp-broadcasts/${broadcast_id}`,
      {
        headers: {
          token: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    );
  } catch (e) {
    console.log(e);
  }
  return null;
}

export async function updateBroadcastStatus({ broadcast_id, to_phone, token }) {

  try {
    return await axios.put(
      `https://shopify-sms-staging.herokuapp.com/whatsapp-broadcasts/update-status`,
      { broadcast_id, to_phone },
      {
        headers: {
          token: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    );
  } catch (e) {
    console.log(e);
  }
  return null;
}

export async function sendMessageSlack(params) {
  console.log(params, 'sahiparams');

  try {
    return await axios.post(
      'https://hooks.slack.com/services/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',
      {
        type: 'mrkdwn',
        text: `${JSON.stringify(params, null, 2)}`,
      },
    );
  } catch (e) {
    console.log(e);
    return null;
  }
}
export async function sendMessageResponse({ id, campaign_execution_id, status, msg_id }) {
  if (!campaign_execution_id) return;
  try {
    console.log('SENDING MESSAGE CONFIRMATION UPDATE', {
      id,
      campaign_execution_id,
      status,
      msg_id,
    });
    const resp = await axios.post(
      'https://shopify-sms-staging.herokuapp.com/whatsapp-status',
      {
        id,
        campaign_execution_id,
        status,
        msg_id,
      },
    );
    console.log('RESPONSE INFO AFTER WHATSAPP STATUS UPDATE', {
      data: resp?.data,
    });
  } catch (e) {
    console.log(e);
  }
}

export async function getCampaignDetail({ campaign_execution_id }) {
  try {
    return await axios.get(
      `https://shopify-sms-staging.herokuapp.com/campaign-executions/${campaign_execution_id}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );
  } catch (e) {
    console.log(e);
  }
  return null;
}

export async function sendCallback(callback_url, callback_params) {
  if (!callback_params || !callback_url) return;
  try {
    console.log('SENDING CALLBACK', {
      callback_params,
      callback_url,
    });
    const resp = await axios.post(callback_url, callback_params);
    console.log('RESPONSE INFO AFTER CALLBACK', {
      data: resp?.data,
    });
  } catch (e) {
    console.log(e);
  }
}
