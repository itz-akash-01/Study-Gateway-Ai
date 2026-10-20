# Study_Gateway AI — HTML/CSS/JS prototype (fixed)

Open `index.html` directly, or use VS Code Live Server. No build step.

Files: `index.html`, `styles.css`, `app.js`, `assets/panda.webp` + `assets/panda.jpg` (login panda).

## What is real and what is still a demo
- **Real (works in the browser, saved on this device only):** screens and navigation, AI Studio preview, History (save / open / delete / clear), Study Planner, Focus Timer, light/dark theme, mobile layout.
- **Not connected (needs a backend):** real login, Google sign-in, account creation, password recovery, real AI generation, file/ZIP processing, PPT download. Those buttons say so honestly. The login form never pretends to sign anyone in; use **Explore the demo workspace** to open the app.
- Never put API keys in this JavaScript. When you connect a backend, use the secured Flask project (Supabase Google sign-in, server-side checks).

## Bugs fixed
1. **Critical:** the login form could never open the app, so every screen was unreachable. Added a clearly labelled demo entry (no fake login).
2. Focus Timer was missing from the mobile menu (unreachable on phones). Added.
3. Timer used `setInterval` counting, so it drifted or froze when the tab slept; it also re-alerted forever after finishing. Now uses the real clock, resets cleanly, and shows a message instead of a blocking `alert`.
4. History and tasks vanished on refresh. Now saved in this browser (`localStorage`), validated when loaded so corrupted data is ignored.
5. History stored and re-injected raw HTML. Now stores plain text and rebuilds the preview safely (all user text escaped).
6. No output type was highlighted when opening AI Studio. Fixed.
7. Planner showed "n / 3" even with more tasks, and ids could collide. Now "x of y tasks completed", with a correct progress bar and unique ids.
8. "Save" could create duplicates; now it saves once per result. Workflow output ignored your topic; now it includes it.
9. Accessibility: labels now linked to inputs, real checkbox + label for tasks, delete buttons have names, `aria-current` on navigation, progress bar roles, visible inline errors instead of a flashing validation bubble, and every button has an explicit type.
10. Layout: icon sizing on tool tiles (`:first-letter` never worked on grid buttons), long task text wraps, dark-mode form controls, phone-height (`dvh`) fix, Google Fonts now load through `<link>` instead of a blocking `@import`.
11. WhatsApp: the placeholder popup is gone; the link stays hidden until you set `CONFIG.whatsappUrl` at the top of `app.js`.

## Login panda
The two dogs are replaced by your panda photo, cropped and optimised (13 KB WebP, JPG fallback). It sways left and right while small hearts drift up from the heart it holds, moving to and fro. Because the photo is flat, the heart itself can't move separately; the whole panda and the floating hearts animate. Edges fade softly into the glass card. Animation stops when the device asks for reduced motion. The panda scales down on small screens.

The dog emoji still appear on Home, Profile and the header Profile button, because you only asked for the login page. Tell me if you want the panda there too.

## Tested
86 automated checks in a simulated browser, all passing: login messages and honesty, demo entry, all six screens from sidebar and mobile menu, all six output types (including HTML escaping), save / open / delete / clear history, planner add / check / delete / progress, timer (including a 10-minute tab sleep and completion), theme (saved, restored, follows device), refresh persistence, corrupted storage, logout, duplicate ids, no inline scripts or styles.

**Not tested (no real browser here):** how it looks on screen, animation smoothness, and real phone layouts. Please open it on your phone and laptop and report anything off.
