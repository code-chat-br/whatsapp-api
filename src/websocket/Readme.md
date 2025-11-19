## Websocket

### 1. Inicialização da Conexão WebSocket

O processo começa com a criação de uma nova instância do objeto `WebSocket`. O URL para a conexão inclui o caminho para o servidor WebSocket, um parâmetro de evento que especifica o tipo de evento ao qual o cliente está se inscrevendo e um token de autenticação. Este token será usado pelo servidor para verificar se o cliente tem permissão para conectar e receber esses eventos.

```javascript
const ws = new WebSocket(`${url}?event=${encodeURIComponent(eventName)}&token=${encodeURIComponent(instanceToken)}`);
```

A URL é construída para incluir:

- **`event`**: um parâmetro que especifica o tipo de evento de interesse, facilitando ao servidor rotear ou filtrar as mensagens de acordo com o tipo de dado ou comando desejado.
- **`token`**: um parâmetro de segurança que provavelmente é usado pelo servidor para autenticar e autorizar a conexão.

### 2. Manipuladores de Eventos

**`onopen`**:
- Este evento é disparado quando a conexão WebSocket é estabelecida com sucesso.
- No manipulador de `onopen`, uma mensagem de teste é enviada imediatamente ao servidor. Isso pode ser usado para confirmar que a via de comunicação está funcionando ou para informar ao servidor sobre o estado inicial desejado do cliente.

```javascript
ws.onopen = () => {
  console.log('Connected to the server');
  ws.send(JSON.stringify({ message: "test data" }));
};
```

**`onmessage`**:
- Este evento é acionado sempre que uma mensagem é recebida do servidor.
- As mensagens recebidas são tratadas convertendo o conteúdo de `event.data` de uma string JSON para um objeto JavaScript, que é então passado para a função `callback` fornecida pelo usuário do script.

```javascript
ws.onmessage = (event) => {
  if (callback) {
    const data = JSON.parse(event.data)
    callback(data, event)
  }
};
```

**`onerror`**:
- Acionado quando ocorre um erro na conexão WebSocket.
- Pode ser usado para logar ou tratar erros de rede, falhas de transmissão, etc.

```javascript
ws.onerror = (error) => {
  console.log('Error:', error);
};
```

**`onclose`**:
- Este evento é acionado quando a conexão WebSocket é fechada, seja por iniciativa do cliente, do servidor, ou devido a falhas de rede.
- O manipulador de eventos `onclose` tenta automaticamente reconectar-se ao servidor após um intervalo definido. Importante corrigir aqui, o `setTimeout` deve chamar `socket(eventName, callback)` ao invés de `socket(event)`, para garantir que a reconexão seja feita corretamente.

```javascript
ws.onclose = (event) => {
  console.log(`Connection closed with code ${event.code} and reason ${event.reason}, attempting to reconnect...`);
  setTimeout(() => socket(eventName, callback), reconnectInterval);
};
```

### 3. Reconexão Automática

- Após a conexão ser fechada, o cliente tenta se reconectar usando um intervalo de tempo definido (`reconnectInterval`). Este comportamento garante que o cliente tente manter uma conexão persistente mesmo em face de problemas de rede ou reinícios do servidor.

### 4. Exemplo completo

```javascript
const url = "ws://localhost:8084/ws/events";
const token = ""
const reconnectInterval = 5000;

function socket(eventName, callback) {
  const ws = new WebSocket(`${url}?event=${encodeURIComponent(eventName)}&token=${encodeURIComponent(token)}`);

  ws.onopen = () => {
    console.log("Connected to the server");
  };

  ws.onmessage = (event) => {
    if (callback) {
      const data = JSON.parse(event.data)
      callback(data, event)
    }
  };

  ws.onerror = (error) => {
    console.log('Error:', error);
  };

  ws.onclose = (event) => {
    console.log(`Connection closed with code ${event.code} and reason ${event.reason}, attempting to reconnect...`);
    setTimeout(() => socket(event), reconnectInterval);
  };
}

// Será criado uma instância da função para cada evento
// Os eventos são os mesmos disparados pela webhook
// exceto o evento "messaging-history.set"

socket("connection.update", (msg, event) => {
    console.log(msg)
})

socket("messages.upsert", (msg, event) => {
    console.log(msg)
})

socket("qrcode.updated", (msg, event) => {
    console.log(msg)
})
```

---

## Tipos de evento

| Name                        | Event                       | TypeData | Description                                                                           |
| --------------------------- | --------------------------- | -------- | ------------------------------------------------------------------------------------- | 
| QRCODE\_UPDATED             | `qrcode.updated`            | JSON     | Sends the base64 of the QR code for reading                                           |
| CONNECTION\_UPDATE          | `connection.update`         | JSON     | Informs the status of the connection with WhatsApp                                    |
| MESSAGES\_UPSERT            | `messages.upsert`           | JSON     | Notifies you when a message is received                                               |
| MESSAGES\_UPDATE            | `messages.update`           | JSON     | Tells you when a message is updated                                                   |
| SEND\_MESSAGE               | `send.message`              | JSON     | Notifies when a message is sent                                                       |
| CONTACTS\_UPSERT            | `contacts.upsert`           | JSON     | Reloads all contacts with additional information<br>This event occurs only once       |
| CONTACTS\_UPDATE            | `contacts.update`           | JSON     | Informs you when a contact is updated                                                 |
| PRESENCE\_UPDATE            | `presence.update`           | JSON     | Informs if the user is online, typing, recording, or last seen<br>`unavailable` `available` `composing` `recording` `paused`|
| CHATS\_UPDATE               | `chats.update`              | JSON     | Informs you when the chat is updated                                                  |
| CHATS\_UPSERT               | `chats.upsert`              | JSON     | Sends any new chat information                                                        |
| GROUPS\_UPSERT              | `groups.upsert`             | JSON     | Notifies when a group is created                                                      |
| GROUPS\_UPDATE              | `groups.update`             | JSON     | Notifies when a group has its information updated                                     |
| GROUP\_PARTICIPANTS\_UPDATE | `group-participants.update` | JSON     | Notifies when an action occurs involving a participant<br>`add` `remove` `promote` `demote`|
| CALL\_UPSERT                | `call.upsert`               | JSON     | Notifies when there is a new call event                                               |
