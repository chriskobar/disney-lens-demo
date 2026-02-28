# Disney Lens Demo — Setup & Deployment Guide

## What You're Building

A phone-based AI experience that uses your camera to see your environment, then responds with Disney-inspired characters who narrate, comment on, and visually enchant what they see — with particle effects, adaptive character selection, and spoken narration through your AirPods.

---

## Step 1: Get Your API Keys (5 minutes)

### Anthropic (Claude Vision)
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **API Keys** in the left sidebar
4. Click **Create Key**, name it "disney-lens"
5. Copy the key (starts with `sk-ant-`)

### ElevenLabs (Character Voices)
1. Go to https://elevenlabs.io
2. Sign up for a free account
3. Click your profile icon → **Profile + API key**
4. Copy the API key

---

## Step 2: Set Up the Project (5 minutes)

Open your terminal (on Mac: Cmd+Space → type "Terminal" → Enter).

```bash
# 1. Navigate to the project folder
cd ~/path/to/disney-lens

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.local.example .env.local
```

Now open `.env.local` in any text editor and paste your keys:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
ELEVENLABS_API_KEY=your-elevenlabs-key-here
```

Save and close the file.

---

## Step 3: Run It Locally (1 minute)

```bash
npm run dev
```

You'll see output like:
```
▲ Next.js 14.2.0
- Local: http://localhost:3000
```

### On Your Phone (same WiFi network)
1. On your Mac, run: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Note your local IP (like `192.168.1.42`)
3. On your phone browser, go to: `https://192.168.1.42:3000`

**Note:** Camera access requires HTTPS. For local testing:
- On iPhone Safari, `localhost` works if testing on the same machine
- For phone-to-computer, you may need to use a tunnel (see Step 4)

---

## Step 4: Make It Accessible from Your Phone (2 minutes)

The easiest way to get HTTPS for phone testing:

```bash
# Install ngrok (one time)
brew install ngrok    # Mac
# or: npm install -g ngrok

# Create a tunnel
ngrok http 3000
```

ngrok gives you a URL like `https://abc123.ngrok.io` — open this on your phone and it works with camera permissions.

---

## Step 5: Deploy to Vercel (5 minutes)

This gives you a permanent, shareable URL.

```bash
# 1. Install Vercel CLI (one time)
npm install -g vercel

# 2. Deploy
vercel

# First time: it will ask you to log in and link to a project
# Say "yes" to the defaults
```

Vercel will ask:
- **Set up and deploy?** → Y
- **Which scope?** → Pick your account
- **Link to existing project?** → N
- **Project name?** → disney-lens
- **Directory?** → ./
- **Override settings?** → N

### Add Your API Keys to Vercel
1. Go to https://vercel.com → your project → **Settings** → **Environment Variables**
2. Add:
   - `ANTHROPIC_API_KEY` = your key
   - `ELEVENLABS_API_KEY` = your key
3. Click **Save**
4. Redeploy: `vercel --prod`

You'll get a URL like `https://disney-lens.vercel.app` — this is your demo link!

---

## How to Use It

1. **Open on your phone** (put AirPods in for the full experience)
2. **Tap "Enter the Story"** — grants camera access
3. **Tap the 👁 eye button** to analyze your current scene
4. A character will narrate what they see, with particle effects and voice
5. **Tap 🎤** to speak to the character — ask questions, make comments
6. **Toggle "Auto"** for continuous scanning every 12 seconds
7. **Pick a character** manually, or leave on "AI" for auto-selection

### Characters
- 📖 **The Storyteller** — poetic narrator (great for scenic/outdoor views)
- 🦗 **The Conscience** — Jiminy Cricket-style quips (great for desks/rooms)
- ✨ **The Fairy Godmother** — sees transformation potential (great for homes)
- 🧭 **The Wayfinder** — adventure spirit (great for paths/outdoors)

---

## Customization Ideas

### Change character voices
Browse https://elevenlabs.io/app/voice-library for different voices.
Update the voice IDs in `app/api/speak/route.js` → `DEFAULT_VOICES`.

### Adjust auto-scan timing
In `app/page.js`, find `12000` in the `setInterval` call and change it (milliseconds).

### Add new characters
Edit `lib/characters.js` — copy an existing character block, change the prompt and triggers.

### Adjust particle intensity
Edit `lib/effects.js` — change `particleCount`, colors, speed, etc.

---

## Estimated Costs

- **Claude API**: ~$0.01-0.03 per scene analysis (two calls: classify + narrate)
- **ElevenLabs**: Free tier = ~10,000 characters/month (~30-50 narrations)
- **Vercel**: Free tier covers this easily

For a demo day, expect to spend $1-3 total on API calls.

---

## Troubleshooting

**Camera not working?**
→ Must be HTTPS (use ngrok or Vercel deployment)
→ Check browser permissions

**No voice output?**
→ Check ElevenLabs key in .env.local
→ Falls back to browser TTS automatically

**"Analysis failed"?**
→ Check Anthropic key in .env.local
→ Check browser console (F12) for detailed errors

**Slow responses?**
→ Each analysis makes 2 API calls (~3-5 sec total)
→ Normal for vision + TTS pipeline
