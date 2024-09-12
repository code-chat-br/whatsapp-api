# CHANGELOG

- version 1.3.3

## Deprecated

- Endpoint: `/instance/connectionState/{instanceName}`

## Added

* [externalAttributes](https://github.com/code-chat-br/whatsapp-api/commit/148d308931a134579c0902cd089a49c47afd5f00)

  The `externalAttributes` attribute is an optional field that can be used to add custom information or metadata to the message being sent. This field is useful for attaching additional data that you want to track or associate with the message throughout the sending and receiving process without affecting the main content of the message.

  ### Details of the `externalAttributes` Attribute

  - **Type:** `string`
  - **Description:** This field can accept various types of values, including simple strings, booleans, numbers, JSON objects, or JSON arrays. Below are the specifications for the accepted data types:
    - `[string]` - A simple text string.
    - `[string[boolean]]` - A string representing a boolean value.
    - `[string[number]]` - A string representing a numeric value.
    - `[string[Json[Object]]]` - A string containing a JSON object.
    - `[string[Json[Array]]]` - A string containing a JSON array.

  ### Usage

  When you create a message and include the `externalAttributes` field, the specified values are transmitted along with the message. These values are then forwarded to the associated webhook, providing a way to "stamp" the message with additional information that can be used for tracking, auditing, or other analytical or processing purposes.

  For example, you could use `externalAttributes` to store a user ID, process status, or any other relevant information you want to associate with the message. When the message is processed by the target system or responded to via webhook, these external attributes are included in the payload of the response, allowing you to use them as needed in your workflow.

  ### Example:

  ```json
  {
    "number": "123@broadcast",
    "options": {
      "externalAttributes": "<any> - optional",
      "delay": 1200,
      "presence": "composing"
    },
    "textMessage": {
      "text": "text"
    }
  }
  ```

* Endpoint: 
  1. [`/instance/fetchInstance/:instanceName`](https://codechat.postman.co/workspace/CodeChat---WhatsApp-API~711de4ae-a523-49de-be87-14db61ee9b68/request/14064846-e46d52a1-d194-4786-8026-890b6e12b531?action=share&source=copy-link&creator=14064846&ctx=documentation)
  2. [`/message/sendList/legacy/:instanceName`](https://codechat.postman.co/workspace/CodeChat---WhatsApp-API~711de4ae-a523-49de-be87-14db61ee9b68/request/14064846-8b1ce807-e83c-4073-92b2-666f96e375f6?action=share&source=copy-link&creator=14064846&ctx=documentation)
