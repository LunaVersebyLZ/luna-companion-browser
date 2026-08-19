# Luna Companion Browser

Build a browser called Luna Browser with a cute, animated AI robot companion that lives inside the browser.

The main goal is to make the browser feel personal and alive, rather than just being another standard browser with an AI chatbot attached.

Core Robot Companion

Add a small, cute robot character that stays in a corner of the browser window. The user can drag it and choose where it sits.

The robot should be animated and feel alive:

When the browser opens, the robot starts asleep, then slowly blinks awake and stretches.

When the browser closes, the robot becomes sleepy, closes its eyes, and falls asleep.

While the user is browsing, the robot can occasionally turn its head/eyes toward the webpage or search bar as if it is looking at what the user is doing.

When the user changes tabs, the robot can subtly look toward the new page.

When the user has been working for a long time, the robot can react subtly, without constantly interrupting.

When the user saves something, the robot can react happily.

The animations should be subtle, cute, smooth, and not distracting.

The robot should feel like a little companion living in the browser, not a traditional chatbot.

AI Assistant

When the user clicks the robot, open a small assistant panel.

The assistant should understand the context of the current webpage and help with what the user is currently doing.

For example, if the user is reading a Wikipedia article and clicks the robot, they can say:

“Explain this to me.”

The robot should be able to use the current page or selected text as context.

The user should also be able to say things like:

“Remember this for tonight.”

“I'll need this tomorrow.”

“Save this for my project.”

“Quiz me on this later.”

“Explain this part.”

“Summarize what I'm reading.”

“Help me understand this.”

Memory / Reminder Feature

This should be one of the main features of the browser.

If the user says:

“Yo, I'll need this later tonight.”

The browser should save the relevant page, selected text, and context, along with the requested reminder time.

Later, the robot can notify the user:

“Hey! Remember this? You asked me to remind you about it tonight 👀”

Clicking the reminder should take the user back to the saved page or content.

The system should support reminders such as:

later today

tonight

tomorrow

this weekend

a specific date/time

before a deadline

The user should have a clear list of everything the robot is remembering for them.

Context Awareness

The assistant should be able to understand the current browsing context when the user explicitly interacts with it.

For example:

User is on a Wikipedia page about quantum mechanics.

User clicks the robot and says:

“I don't understand this part.”

The robot should know what page the user is viewing and, when possible, what text they selected.

Another example:

User has several tabs open for researching a project.

They can ask:

“What were the three websites I was using for this?”

The browser should be able to organize relevant tabs and saved information into a workspace.

Workspaces

Allow users to create workspaces for different activities, such as:

Study

Work

Personal

Research

Projects

Each workspace can contain its own tabs, saved pages, notes, and memories.

The robot can understand which workspace the user is currently working in.

Privacy

Privacy must be a major part of the design.

The robot should NOT silently record everything the user does.

Users should clearly control what the assistant can access and remember.

For example:

Current page access

Selected text access

Tab/context access

Memory

Notifications

Browsing history

Make these permissions transparent and easy to disable.

Visual Style

The browser should feel modern, minimal, soft, and futuristic.

The robot should be the visual identity of the browser.

Do not make the robot look like a generic corporate AI assistant. It should be a small, expressive character with personality.

The overall interface should feel polished enough to eventually become a real browser product, not just a demo.

Important

For the first version, focus on building the browser interface/prototype and the robot companion experience.

The most important things to demonstrate are:

A browser-like interface.

The animated robot in the corner.

Dragging/repositioning the robot.

The robot's sleep/wake animations.

The robot reacting to the current page.

Clicking the robot to open the AI assistant.

Understanding the current webpage/selected text.

Saving something with “Remember this.”

Creating a reminder.

Showing the reminder later.

A simple memory panel showing what the robot has remembered.

The key product idea is:

This is a browser with a little AI companion that lives with you, understands what you're working on when you ask it to, and remembers things for you so you don't have to.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0925ef63-5051-4b50-80c7-39345d79892f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
