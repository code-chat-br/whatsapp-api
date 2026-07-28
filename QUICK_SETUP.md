# WhatsApp API Quick Setup Guide

## Truncate all

PGPASSWORD=whatsapp123 psql -U postgres -h localhost -d whatsapp -c 'TRUNCATE TABLE "Instance","Auth","Message","Media","MessageUpdate","Chat","Contact","Webhook","ActivityLogs" RESTART IDENTITY CASCADE;' 2>&1

## Prerequisites Check

```bash
# Check Node.js (need v20+)
node --version

# Check npm
npm --version
```

## Step 1: Install Dependencies

```bash
cd /Volumes/server-ssd/social-medias/whatsapp-api
npm install
```

## Step 2: Configure Database

The WhatsApp API requires PostgreSQL. You have two options:

### Option A: Use Docker (Easiest)

```bash
# Start PostgreSQL in Docker
docker run --name whatsapp-postgres \
  -e POSTGRES_PASSWORD=whatsapp123 \
  -e POSTGRES_DB=whatsapp \
  -p 5432:5432 \
  -d postgres:15

# Update .env DATABASE_URL
DATABASE_URL=postgres://postgres:whatsapp123@localhost:5432/whatsapp
```

### Option B: Use Existing PostgreSQL

If you already have PostgreSQL installed:

```bash
# Create database
createdb whatsapp

# Update .env with your credentials
DATABASE_URL=postgres://yourusername:yourpassword@localhost:5432/whatsapp
```

## Step 3: Run Database Migrations

```bash
cd /Volumes/server-ssd/social-medias/whatsapp-api

# Deploy database schema
bash deploy_db.sh

# Or manually
npx prisma migrate deploy
```

## Step 4: Start the Server

```bash
# Development mode (with auto-reload)
npm run start:dev
```

The server will start on: `http://localhost:8084`

You should see output like:
```
🔥 Server started successfully
📡 Listening on: http://localhost:8084
📚 Swagger docs: http://localhost:8084/docs
```

## Step 5: Create a WhatsApp Instance

Open a new terminal and create an instance:

```bash
curl -X POST http://localhost:8084/instance/create \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "default"
  }'
```

**Expected response:**
```json
{
  "instance": {
    "instanceName": "default",
    "status": "created"
  },
  "hash": {
    "apikey": "..."
  }
}
```

## Step 6: Connect to WhatsApp

### Get QR Code:

```bash
curl http://localhost:8084/instance/connect/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"
```

### Scan with WhatsApp:

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code from the terminal or open the `base64` image

**Wait for connection (usually 10-30 seconds)**

## Step 7: Verify Connection

```bash
curl http://localhost:8084/instance/connectionState/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"
```

**Expected response when connected:**
```json
{
  "state": "open",
  "statusReason": 200
}
```

## Step 8: Set Up Webhook

Configure the webhook to send events to the WhatsApp coordinator:

```bash
curl -X POST http://localhost:8084/webhook/set/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "url": "http://localhost:3003/webhook",
    "events": {
      "messagesUpsert": true
    }
  }'
```

**Expected response:**
```json
{
  "webhook": {
    "enabled": true,
    "url": "http://localhost:3003/webhook",
    "events": {
      "messagesUpsert": true
    }
  }
}
```

## Step 9: Start WhatsApp Coordinator

Open a **new terminal**:

```bash
cd /Volumes/server-ssd/social-medias/content-factory
npm run whatsapp-coordinator
```

You should see:
```
🚀 WhatsApp Coordinator started!
📡 Webhook listening on port 3003
🔗 Webhook URL: http://localhost:3003/webhook
📱 WhatsApp API: http://localhost:8084
```

## Step 10: Test the Integration! 🎉

### Send a test video:

1. **From another phone**, send a video to your WhatsApp number
2. **Watch the coordinator logs** - you should see:
   ```
   📱 Received WhatsApp message from 5511999999999@s.whatsapp.net
   🎥 Video message detected!
   📥 Video received! Creating session session-1234567890...
   🔄 Converting video to WebM format...
   🎞️  Extracting frames...
   🎤 Extracting subtitles using Whisper AI...
   ✅ Subtitles extracted!
   ```

3. **You'll receive WhatsApp messages** with status updates

4. **Reply with `render`** to get the video with subtitles

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -U postgres -h localhost -d whatsapp -c "SELECT 1;"
```

### Server Won't Start

```bash
# Check if port 8084 is already in use
lsof -i :8084

# Kill process if needed
kill -9 $(lsof -t -i:8084)
```

### QR Code Expired

```bash
# Reconnect to get a new QR code
curl http://localhost:8084/instance/connect/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"
```

### Webhook Not Working

```bash
# 1. Verify webhook is configured
curl http://localhost:8084/webhook/find/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"

# 2. Check coordinator is running
curl http://localhost:3003/health

# 3. Test webhook manually
curl -X POST http://localhost:3003/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "data": {
      "messageType": "conversation",
      "content": {"text": "test"},
      "keyRemoteJid": "test@s.whatsapp.net"
    }
  }'
```

### Instance Disconnected

```bash
# Check connection status
curl http://localhost:8084/instance/connectionState/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"

# Reconnect if needed
curl http://localhost:8084/instance/connect/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"
```

## API Documentation

**Swagger UI:** http://localhost:8084/docs

Here you can explore all available endpoints and test them interactively.

## Useful API Endpoints

### Send a test message:

```bash
curl -X POST http://localhost:8084/message/sendText/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "textMessage": {
      "text": "Hello from WhatsApp API!"
    }
  }'
```

### Get all messages:

```bash
curl "http://localhost:8084/chat/fetchMessages/default?remoteJid=5511999999999@s.whatsapp.net" \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"
```

### Logout instance:

```bash
curl -X DELETE http://localhost:8084/instance/logout/default \
  -H "apikey: zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu"
```

## Architecture Overview

```
WhatsApp Phone
      ↓
WhatsApp API (port 8084)
      ↓ (webhook)
WhatsApp Coordinator (port 3003)
      ↓
Content Factory API (port 3002)
      ↓
Datalake (video processing + subtitle extraction)
      ↓
Rendered video back to WhatsApp
```

## Files and Directories

- **Instances**: `/Volumes/server-ssd/social-medias/whatsapp-api/instances/`
- **Sessions**: `/Volumes/server-ssd/social-medias/datalake/session-*/`
- **Logs**: Check terminal output or PM2 logs
- **Database**: PostgreSQL database stores all messages, contacts, chats

## Next Steps

1. ✅ WhatsApp API running on port 8084
2. ✅ Instance created and connected
3. ✅ Webhook configured
4. ✅ Coordinator listening on port 3003
5. 🎬 **Test by sending a video!**

## Production Tips

For production deployment:

1. **Use PM2** to keep services running:
   ```bash
   pm2 start npm --name "whatsapp-api" -- run start:prod
   pm2 start npm --name "whatsapp-coordinator" -- run whatsapp-coordinator
   pm2 save
   pm2 startup
   ```

2. **Use environment-specific configs**
3. **Enable HTTPS** for webhook endpoint
4. **Set up monitoring** (PM2 dashboard, log aggregation)
5. **Regular database backups**
6. **Configure firewall rules**

## Support

- **WhatsApp API Docs**: http://localhost:8084/docs
- **GitHub**: https://github.com/code-chat-br/whatsapp-api
- **Telegram Group**: https://t.me/codechatBR
