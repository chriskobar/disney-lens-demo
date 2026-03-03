# Disney Lens: An AI-Powered Immersive Experience Demo

## Case Study — Draft v1

*Chris Kobar | February 2026*

---

## Tools, Services & Requirements at a Glance

| Category | Item | Cost / Notes |
|----------|------|-------------|
| **Hardware** | iPhone (any recent model) | Existing device; rear camera used for environment capture |
| | AirPods or device speakers | Optional; audio plays through whatever output is active |
| | MacBook (development) | Used for coding, testing, and deployment |
| **Software & Frameworks** | Next.js 14 | Open-source React framework; handles frontend + API routes |
| | Node.js / npm | JavaScript runtime and package manager |
| | Git + GitHub | Version control and code hosting (free public repo) |
| | Safari (iOS) | Browser runtime for the app on iPhone |
| **AI Services** | Anthropic Claude API (Sonnet) | Vision + language model for scene analysis and narration; ~$0.02–0.03 per interaction; requires separate Console account from Claude chat subscription |
| | ElevenLabs | Text-to-speech for character voices; free tier (~10,000 chars/month) sufficient for demos |
| **Infrastructure** | Vercel | Hosting and deployment; free tier; provides shareable HTTPS URL |
| | ngrok | HTTPS tunneling for local phone testing; free tier with account |
| **Development Tool** | Claude (via Cowork) | AI pair-programming assistant used throughout for code generation, debugging, and architecture |

**Estimated total spend for demo development and testing:** $5–10 in API credits.

---

> ### If You're Following Along: Things Nobody Tells You
>
> This project was built using AI-assisted development (Claude in Cowork mode generating code, with the author directing and testing). If you're a designer, strategist, or anyone else who doesn't live in a terminal but wants to build something like this, here are the practical realities that tutorials skip over.
>
> **Your development server has to be running the entire time.** When you run `npm run dev` in Terminal, that starts a local web server that makes the app work on your computer. That terminal window must stay open and running for as long as you're working. If you close it, the app stops. If your laptop sleeps, it may stop. If you accidentally hit Ctrl+C in that window, it stops. This isn't a "set it and forget it" step — it's the engine that keeps the car running while you're driving. You'll get comfortable with it, but the first time the app suddenly stops working and you can't figure out why, check whether your dev server is still running.
>
> **You need multiple terminal windows.** One runs your dev server (`npm run dev`). Another is where you run git commands to save and deploy your work. If you're using ngrok for phone testing, that's a third. On Mac, Terminal supports tabs (Cmd+T), which helps. The mental model: each window is a separate worker doing a separate job, and they all need to stay open.
>
> **API keys are secrets — treat them like passwords.** The `.env.local` file that holds your Anthropic and ElevenLabs keys should never be committed to GitHub. The `.gitignore` file prevents this automatically, but if you ever create a fresh project or copy files around, double-check. If a key leaks to a public repo, anyone can use your account and run up charges. You'll know the keys are working when the app successfully returns narration; you'll know they're missing when you see errors like "API key not set" in the app.
>
> **Vercel deployment is not the same as local development.** Your local app (localhost:3000) reads files and environment variables from your computer. The Vercel-deployed app reads them from Vercel's servers. If you change an API key locally, you also need to update it in Vercel's dashboard (Settings → Environment Variables) and redeploy. If something works locally but fails on Vercel, this mismatch is usually why.
>
> **"Commit and push" is how changes go live.** Vercel watches your GitHub repo. When you push new code, it automatically rebuilds and deploys. The cycle is: edit files → `git add .` → `git commit -m "description"` → `git push` → wait 30–60 seconds → check the live URL. If the build fails, Vercel's dashboard shows the error log. Most build failures during this project were caused by missing files, wrong import paths, or Vercel not knowing the project was a Next.js app.
>
> **Your phone and your laptop are seeing different things.** During development, your phone can see the Vercel-deployed version (the public URL) or your local version (via ngrok). These may be different if you haven't pushed recent changes. When something works on your laptop but not on your phone, first confirm they're pointing at the same version. For phone-specific bugs (like iOS Safari audio quirks), the Vercel-deployed version is what matters.
>
> **JSON files are picky.** The configuration files (`character-config.json`, `story-config.json`) must be valid JSON. A single missing comma, extra comma, or unclosed quote will crash the app. If you edit these files and the app stops working, paste the JSON into a validator (search "JSON validator" — there are dozens of free ones) to find the syntax error. VS Code and Cursor both highlight JSON errors with red squiggly lines.
>
> These aren't obstacles — they're just the texture of building software. Once you've hit each of these once, you won't hit it again.

---

## The Premise

What if your phone could see the world the way a Disney storyteller does?

Disney's Imagineering division has spent decades perfecting the art of transforming ordinary spaces into immersive narrative experiences — through architecture, lighting, sound design, and environmental storytelling. But these experiences are locked inside theme parks. They require billions in infrastructure and can only be experienced by people who physically travel to them.

This project asks a different question: **What if AI could bring that same storytelling instinct to any environment, in real time, through a device you already carry?**

Disney Lens is a proof-of-concept that demonstrates this idea. It's a web app that uses your phone's camera to see your surroundings, an AI vision model to understand what it's seeing, and a cast of Disney-inspired characters who narrate, react to, and reimagine your environment — complete with animated character sprites, particle effects, and spoken dialogue.

It was designed and built in a single collaborative session with AI assistance, and it runs entirely in a mobile browser. No app store. No special hardware. Just a URL.

---

## The Design Thinking

The core insight behind Disney Lens isn't technical — it's experiential. Disney's best environments work because they feel *authored*. Every detail serves a story. A park bench isn't just a bench; it's where a character might sit. A garden path isn't just a path; it's the road to adventure.

Disney Lens applies that same philosophy to AI: instead of building an AI that simply labels objects ("chair, bookshelf, window"), it builds one that *interprets* them through the lens of character and narrative. The AI sees a cozy room with afternoon light and worn books, and a Storyteller narrator says: *"In a room where afternoon light painted golden stripes across well-loved books, something extraordinary was about to begin."*

This distinction — **classification vs. interpretation** — is what separates a technical demo from an experience design demo.

### The Character System

Rather than a single AI voice, Disney Lens features four character archetypes, each with a distinct personality, narrative style, and visual signature:

- **The Storyteller** — A classic Disney storybook narrator. Warm, poetic, sees the opening scene of a grand adventure in every mundane moment. Accompanied by golden fireflies and a floating, glowing storybook.

- **The Conscience** — A Jiminy Cricket-style companion. Quippy, observant, notices the small details everyone else misses. Accompanied by floating thought bubbles and a little animated cricket with a top hat.

- **The Fairy Godmother** — Warm, encouraging, sees transformation potential in everything. Every space could be magical with a touch of reimagining. Accompanied by rising sparkles and a wand-wielding figure with a purple aura.

- **The Wayfinder** — A Moana-inspired explorer spirit. Bold, curious, frames every path as a journey and every door as a portal. Accompanied by directional motes and a spinning compass rose.

The AI automatically selects which character responds based on what it sees — indoor scenes with desks and books trigger the Conscience; outdoor paths trigger the Wayfinder; scenic vistas trigger the Storyteller. Users can also manually pin a character for a consistent experience.

### Why Multiple Characters Matter

This isn't just a creative flourish. It demonstrates a key principle of immersive experience design: **context-adaptive narration**. In a theme park, you don't hear the same guide voice in Adventureland and Fantasyland. The environment shapes the storytelling voice. Disney Lens brings that principle to AI by matching character personality to environmental context.

---

## The Technical Architecture

The app is deliberately simple — intentionally so. The goal was to demonstrate that compelling AI-driven immersive experiences don't require massive infrastructure. The entire system is seven files and three API integrations.

### The Interaction Loop

1. **Camera captures a frame** from the phone's rear camera via the browser's `getUserMedia` API
2. **Frame is sent to Claude's vision model**, which first classifies the scene (keywords: indoor, bookshelf, warm lighting, afternoon) and then generates a character-appropriate narration
3. **Narration text is sent to ElevenLabs**, which returns spoken audio in a voice matched to the active character
4. **Audio plays through the device** (speakers or AirPods) while the narration text is available via an optional toggle
5. **Canvas-based visual effects** — character-specific particle systems and an animated character sprite — overlay the camera feed throughout

The entire round-trip takes 3–5 seconds: vision analysis, character selection, narration generation, and voice synthesis.

### What Makes It Feel Immersive

Several design choices elevate this beyond a standard "AI describes a photo" demo:

- **Session memory**: The AI accumulates context across interactions. If you keep returning to the same room, the Storyteller might say *"I notice you keep returning to this place — perhaps this is your enchanted grove."*
- **Environmental awareness**: The AI references lighting conditions, time of day, color palette, and spatial arrangement — not just object labels.
- **Visual enchantment**: Character-matched particle effects (fireflies, sparkles, compass motes) create a persistent sense of magic overlaying the real world.
- **Character sprites**: Animated figures drawn directly on the camera canvas — a bobbing storybook, a cricket with swaying legs, a fairy godmother with a sparkling wand — give the AI a visible presence in the environment.
- **Spoken narration**: Hearing a character's voice through AirPods while walking through a space creates a fundamentally different experience than reading text on screen.
- **Conversational interaction**: Users can speak to the characters via the microphone and receive contextual responses that reference both what the AI sees and what the user said.

---

## What This Demonstrates for Disney

This project is not a product. It's a **proof of concept for a design philosophy**: that AI can be a medium for immersive storytelling, not just a utility.

Specifically, it demonstrates:

1. **AI as narrative layer** — Transforming passive environments into story-rich experiences using vision + language models, without any physical modifications to the space.

2. **Context-adaptive character systems** — Dynamically selecting the right storytelling voice for the right moment, the way a well-designed theme park transitions between lands.

3. **Multimodal immersion on commodity hardware** — Camera, voice, visual effects, and spoken narration all running in a mobile browser. No app install. No AR glasses. No special hardware.

4. **The speed of prototyping** — This entire experience was designed, built, deployed, and iterated in a single working session using AI-assisted development. The barrier to testing immersive AI experiences is now hours, not months.

### Imagined Applications

- **In-park companion**: A personalized AI character that narrates a guest's journey through a Disney park differently based on what they've seen, where they've been, and what they respond to.
- **At-home experiences**: Turning a child's bedroom into Neverland or the Hundred Acre Wood through camera-based narration and AR-lite overlays.
- **Location-based storytelling**: Disney properties (hotels, cruise ships, retail) enriched with AI characters that respond to the specific environment.
- **Accessible experiences**: Bringing the *feeling* of a Disney park to people who can't travel to one — through a phone, a voice, and a story.

---

## What Broke (And What That Taught Us)

Building in the real world — not a simulator, not a demo video, but actually walking around outdoors with the app running on a phone — surfaced problems that no amount of desk-based testing would have caught. These are worth documenting because they represent the kind of practical experience design knowledge that only comes from shipping something and using it.

**Voice disappeared mid-session.** During an outdoor test, the app's spoken narration suddenly stopped working. The transcript was still generating — the AI was analyzing scenes and writing narration correctly — but no voice came out, even after restarting Safari and relaunching the app. The cause turned out to be ElevenLabs' free-tier character limit (10,000 characters/month). Once exhausted, the API returns errors silently and the audio pipeline fails. The fix was twofold: upgrade the ElevenLabs plan for production use, and build a much more robust browser-based TTS fallback that activates automatically when ElevenLabs fails, with character-specific voice tuning (pitch, rate) so the fallback doesn't feel like a completely different experience. The lesson: any dependency on a metered third-party API needs a graceful degradation path, especially for a demo you need to work reliably on the day it matters.

**Two API calls meant noticeable latency.** The original architecture made two separate calls to Claude per interaction — one to classify the scene, one to generate narration. Each call included the full camera frame. This meant every interaction cost 3–5 seconds of round-trip time, which is perceptible and breaks the conversational rhythm. Consolidating into a single unified call (where Claude both picks the character and generates narration) cut the latency meaningfully and halved the API cost per interaction. The lesson: for real-time experiences, every network round-trip is a design choice.

**Character selection confused users.** The initial UI showed a row of character buttons (AI, 📖, 🦗, ✨, 🧭) at the bottom of the screen at all times. In testing, users instinctively tapped them thinking they were required interaction points, when the intended experience was fully AI-driven character selection. The fix was hiding the character override behind a single 🎭 button that most users never need to touch. The lesson: in immersive experiences, visible controls invite interaction whether you intend it or not. If something is an edge case, hide it.

**The model string changed.** After initial deployment worked, a Claude API update changed the model identifier, causing a 404 error. A one-line fix, but a reminder that building on top of rapidly-evolving AI APIs means version pinning and monitoring are part of the job.

---

## The Next Layer: From Demo to Experience

After the core pipeline was working — camera, AI vision, character narration, voice, visual effects — the project shifted from "does it work?" to "does it feel like something?" This is where the interesting design questions live, and where the gap between a tech demo and an immersive experience becomes apparent.

Four design explorations emerged from real-world testing:

### Authoring Character Personality Outside of Code

In the first build, character personalities were defined as JavaScript strings embedded in application code. This meant that every personality adjustment — "make the Storyteller less flowery," "give Cricket more humor" — required editing source code, committing, and redeploying. That's fine for a developer, but it's a terrible workflow for experience design, where the right tone is discovered through rapid iteration and gut feel, not through pull requests.

The planned solution: externalize all character personality, voice tuning, and behavioral instructions into a standalone configuration file. This turns character design into an editorial workflow — open a file, adjust the Fairy Godmother's warmth, save, redeploy. The distinction matters because it reflects how immersive experiences are actually authored at companies like Disney: the storytellers and the engineers work from different artifacts.

### A Shared Narrative Layer

The most ambitious and most uncertain exploration. Without a story layer, the app's character responses are individually charming but collectively disconnected. Each one describes the scene well, but there's no sense that they're all part of the same world. A shared narrative premise — injected into every character's prompt — would give all four characters a reason to reference the same themes, the same sense of hidden wonder, the same gentle invitation to explore.

This is the closest analog to what Disney Imagineering calls "placemaking": the idea that every element in an environment should feel like it belongs to the same story. A bench in Adventureland isn't just a bench — it's a place where a pirate might have rested. Disney Lens aims for the same principle with AI: every narration, regardless of which character delivers it, should feel like it belongs to the same enchanted world.

The risk is overreach. A heavy-handed story layer could make responses feel templated rather than spontaneous. For the demo, a light-touch premise — "this neighborhood holds hidden magic" — is being tested. If it constrains the AI's responsiveness to actual scene content, it gets shelved. And that decision itself is a valuable design insight: knowing where authored narrative enhances AI experience and where it fights against it.

### Making Characters Feel Present

The animated sprites — a floating storybook, a little cricket, a fairy godmother with a sparkling wand — are the app's most visually distinctive feature. But in the first version, they're all the same scale and in fixed positions. Making these individually configurable (Cricket larger and lower on screen, the Compass in the upper corner) is straightforward technically, but it represents an important design principle: each character should occupy space differently, the way real characters carry themselves differently.

### The Conversation Has to Feel Real

The most critical finding from user testing: when a user speaks to the app and the current narration keeps playing, the illusion breaks completely. In a real conversation — and certainly in a Disney character interaction — the character stops talking and listens when you address them. The current behavior of playing through stale narration while processing new input makes the experience feel like a recording rather than an interaction.

The fix is straightforward (immediately interrupt audio when the microphone activates, cancel in-flight API calls, show a listening state), but the insight is important: **responsiveness is more critical to immersion than quality.** A slightly delayed but contextually responsive reply feels more magical than a beautifully crafted response that arrives while the user has already moved on.

---

## Process Notes

This project was built collaboratively with Claude (Anthropic's AI assistant) running in Cowork mode, which provided real-time code generation, debugging, and architectural guidance. The development process itself is part of the story: it demonstrates that a single designer with AI assistance can prototype immersive experiences at a pace that was previously impossible.

The design explorations described above were identified through real-world testing — walking outdoors with the app, observing where the experience broke down, and reasoning about what was missing. Not all of them may make it into the final demo. Some may be shelved because the added complexity doesn't justify the experience improvement within the demo's scope. Documenting those decisions — what was tried, what worked, what didn't, and why — is as valuable as the working code. It demonstrates the kind of iterative, experience-first design thinking that separates a feature list from a product vision.

The full development chronology, including all issues encountered, solutions applied, and design decisions made, is maintained in a companion document.

---

*This case study is a living document. It will be updated as the project evolves — with demo video documentation, user testing observations, and refined character behaviors.*
