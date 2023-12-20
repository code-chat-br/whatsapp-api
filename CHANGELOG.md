# Changelog

<a name="1.3.0"></a>

For full details, visit the official API documentation: [Official Documentation 1.3.0](https://docs.codechat.dev/api/v1.3.0), [Tags](https://docs.codechat.dev/change-log/tags/v-1)

## Version 1.3.0 (2023-12-20)

### Added
- 🚀🔧📈 Addition of Prisma Migrations. [[15b94f4](https://github.com/code-chat-br/whatsapp-api/commit/15b94f4)]

### Changed
- 📚✍️🔍 Improved README Instructions. [[9f5a987](https://github.com/code-chat-br/whatsapp-api/commit/9f5a987)]
- 🖋️🔗💾 Text Formatting and Session ID Linking. [[3a58e9c](https://github.com/code-chat-br/whatsapp-api/commit/3a58e9c)]

## Version 1.3.0 (2023-12-09)
This version features significant improvements, including migration to the PostgreSQL database, integration with Prisma ORM, and new storage and interaction features.

### Added
- 🆕💾 **Migration to PostgreSQL:** Replacement of MongoDB with PostgreSQL for more robust and efficient data management. Check out the detailed instructions and benefits of this change in commits [[9b574ec](https://github.com/code-chat-br/whatsapp-api/commit/9b574ec)], [[7b2389f](https://github. com/code-chat-br/whatsapp-api/commit/7b2389f)].
- 🆕🔷 **Prisma ORM:** Introduction of Prisma ORM, offering an additional layer of abstraction and security for database operations. More details at [[a2474ed](https://github.com/code-chat-br/whatsapp-api/commit/a2474ed)].
- 🆕🔗 **Integration with MinIO:** Implementation of media storage with MinIO, providing a scalable and efficient solution. See [[e71a9f9](https://github.com/code-chat-br/whatsapp-api/commit/e71a9f9)].
- 🆕🔗 **Integration with Typebot:** New endpoints and services for interaction with Typebot, expanding the API's capabilities. Details at [[88f2d1b](https://github.com/code-chat-br/whatsapp-api/commit/88f2d1b)].

### Changed
- 🐛💥 **Redis Reconfiguration:** Improvement in the code that saves instances in Redis, increasing reliability and efficiency. See [[0b16a32](https://github.com/code-chat-br/whatsapp-api/commit/0b16a32)].
- 🔄💻🛠️ **General Code Refactoring:** Optimizations and code improvements to increase performance and maintainability. Details at [[ba667a9](https://github.com/code-chat-br/whatsapp-api/commit/ba667a9)].

### Migrating from 1.2 to 1.3
#### Migration Steps:
1. **Test Environment:** It is recommended to create a test environment to validate new features. Compare versions [1.2.8](https://github.com/code-chat-br/whatsapp-api/tree/v-1.2.8) and [1.3.0](https://github.com/ code-chat-br/whatsapp-api).
2. **PostgreSQL Database:** Required for the new version. Configuration and migration instructions available in the documentation.
3. **Saving Logs to the Database:** All logs are now saved to the database for better analysis and traceability.
4. **.env file:** Replacement of the YAML environment variables file with a `.env` file to simplify configuration.
5. **Redis Save Refactoring:** The code was restructured to avoid bugs and improve performance.
6. **Improved Request Responses:** Responses now provide more detailed information from the bank.
7. **Webhook Sending Detailed Data:** The data sent by the webhook is more complete and informative.

#### Detailed Integrations:
- [MinIO](https://docs.codechat.dev/s3-bucket): Detailed settings and usage in the [.env.dev](./.env.dev) file.
- [Typebot](https://www.typebot.io/): Environment variables and application-specific interactions for the scope of the bot:
  ```json
  {
    "messageId": 1325, // unique message id in the database
    "keyRemoteJid": "123@s.whatsapp.net", // WhatsApp phone number
    "keyId": "KDFKJRGLGR51VR5", // WhatsApp message id
    "messageType": "conversation", // message source type
    "pushName": "Name", // WhatsApp account name
    "instanceId": 12 // id of the WhatsApp instance linked to the API
  }
  ```

### Feedback and Support
We encourage feedback on this release. For support or suggestions, contact us through our official channels.