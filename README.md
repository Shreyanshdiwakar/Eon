# Eon Discord Bot

Eon is a Discord bot that syncs your mood with Instagram profile pictures and provides various utility commands. This bot runs on Hack Club's Nest Server and features automated deployments, robust error handling, and a mood-based status system.

## Features

### 1. Mood-Based Profile Sync
- Updates Discord status and Instagram profile picture based on mood.
- Supports multiple mood types (e.g., happy, tired, working, etc.).
- Implements rate limits to prevent automation detection.

### 2. Automated Deployment System
- GitHub webhook integration for continuous deployment.
- Runs on PM2 for process management.
- Secure webhook validation and update automation.

### 3. Mood Statistics Tracking
- Tracks mood history, frequency, and daily patterns.
- Provides insights on most-used moods and activity trends.

### 4. Webhook Security & Process Management
- Secure webhook validation using signatures.
- Automated process recovery with PM2.
- Session handling for Instagram updates.

### 5. Image-Based Mood Representation
- Supports custom mood images.
- Stores uploaded mood-based profile pictures.
- Uses uploaded images for better mood visualization.

## System Architecture

### 1. Hosting Infrastructure
- **Platform:** Hack Club's Nest Server
- **Domain:** `shreyansh.hackclub.app`
- **Process Manager:** PM2
- **Continuous Deployment:** GitHub Webhooks

### 2. Core Components

#### Discord Bot (`mood-bot`)
- Runs continuously using PM2.
- Handles Discord interactions and mood updates.
- Syncs user statistics and mood history.

#### GitHub Webhook Server
- **Port:** 12345
- Automatically pulls updates from GitHub.
- Validates webhook signatures for security.
- Restarts the bot upon updates.

#### Image Storage
- Stores mood-based profile pictures.
- Uploaded images used for different moods.

## Deployment Setup

### 1. SSH Access
```bash
ssh shreyansh@hackclub.app
```

### 2. Directory Structure
```
~/bot/
├── src/
│   ├── index.js
│   ├── commands/
│   │   ├── mood.js
│   │   ├── stats.js
│   ├── services/
│   │   ├── InstagramManager.js
│   │   ├── MoodManager.js
│   │   ├── StatsManager.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validators.js
├── assets/
│   ├── moods/
│   │   ├── happy.png
│   │   ├── [other moods]
│   │   ├── uploaded-moods/
│   │   │   ├── image1.png
│   │   │   ├── image2.png
├── webhook.js
├── update.sh
```

### 3. Process Management

#### Starting the Bot
```bash
npx pm2 start src/index.js --name "mood-bot"
```

#### Checking Status
```bash
npx pm2 list
```

#### Viewing Logs
```bash
npx pm2 logs mood-bot
```

#### Managing the Webhook Process
```bash
npx pm2 start webhook.js --name "github-webhook"
npx pm2 logs github-webhook
```

## Automatic Updates

1. Push triggers GitHub webhook.
2. Webhook server validates request.
3. Pulls the latest changes.
4. Restarts the bot with updates.

#### Manual Update
```bash
cd ~/bot
./update.sh
```

## Commands

| Command        | Description                      |
|---------------|--------------------------------|
| `/mood [type]` | Update your mood & Instagram profile. |
| `/moodstats`  | View your mood history.        |
| `/currentmood` | Check current mood.           |

### Available Moods
- `normal` - Default state
- `happy` - Cheerful expression
- `working` - Work/study mode
- `tired` - Low energy state
- `sleeping` - Rest mode
- `eating` - Food/meal time
- `confused` - Puzzled state
- `celebration` - Special occasions
- `birthday` - Birthday celebrations
- `with-girlfriend` - Relationship status
- `awkward` - Uncomfortable situations
- `custom` - Uses uploaded mood images

## Security Features

- GitHub webhook secret validation.
- SSH key authentication.
- Rate limiting for Instagram updates.
- Error handling and logging.

## Environment Variables
Create a `.env` file with the following:
```
DISCORD_TOKEN=your_discord_token
IG_USERNAME=your_instagram_username
IG_PASSWORD=your_instagram_password
WEBHOOK_SECRET=your_webhook_secret
```

## Troubleshooting

### Checking Bot Status
```bash
npx pm2 list
npx pm2 logs mood-bot
```

### Checking Webhook Status
```bash
npx pm2 logs github-webhook
```

### Restarting Services
```bash
npx pm2 restart mood-bot
npx pm2 restart github-webhook
```

### Common Issues & Fixes

1. **Update Failed**
   - Check Instagram session status.
   - Verify rate limits.
   - Check file permissions.

2. **Webhook Issues**
   - Verify GitHub webhook settings.
   - Check port availability.
   - Validate webhook secret key.

3. **Process Crashes**
   - Check PM2 logs.
   - Verify memory usage.
   - Check error stack traces.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to your branch.
5. Create a Pull Request.

## License
MIT License

## Support
For issues and feature requests, open a GitHub issue or contact shreyanshdiwakar18@gmail.com.
For issues and feature requests, open a GitHub issue 

