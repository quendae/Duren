# Dureń / Durak

**A classic Durak card game that runs entirely offline in your browser.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

No installation, server or account is required. The whole game lives in a single `durniak.html` file — download it, open it in a modern browser and play.

## What is included

- Classic 36-card Durak deck, from 6 to Ace
- One human player and **1–3 computer opponents**
- Separate difficulty for every bot: **Easy, Normal, Hard, Expert**
- Optional **transfer / perevodnoy** rule
- Optional six-card attack limit
- Option to allow everyone, or only the attacker, to throw in cards
- Beginner mode with legal-card highlighting and contextual hints
- Step-by-step tutorial with a guided practice round
- Round history and an in-game rules reference
- Card animations and simple table sounds
- Three bot-speed settings
- Automatic local save and resume
- Responsive interface for smaller screens
- Interface languages: **Polish, English, German and Russian**

## Play

1. Download [`durniak.html`](durniak.html).
2. Open it in a modern web browser.
3. Choose **New game** or start with **How to play** if you do not know Durak yet.

That is all. The game has no external runtime dependencies and does not need an internet connection after the file is downloaded.

## Rules in short

Every player starts with six cards. One card is placed face up under the talon and determines the trump suit for the round.

The attacker plays a card. The defender must beat it with a higher card of the same suit or with a trump. A trump can only be beaten by a higher trump. Additional attack cards may match any rank already present on the table.

If the defender cannot or does not want to beat the attack, they take the cards. After each bout, players draw back up to six cards while the talon still contains cards. Once the talon is empty, players who get rid of their entire hand leave the game.

The last player still holding cards is the **Durak — the Fool**.

## Bot difficulty

The difficulty levels are not just different delays. Higher-level bots use progressively stronger decision-making.

- **Easy** — intentionally loose and partly random play.
- **Normal** — prefers inexpensive attacks and sensible defence.
- **Hard** — takes card value, repeated ranks and the state of the talon into account.
- **Expert** — also estimates unseen cards, defence risk and end-game tempo.

Each opponent can use a different level in the same game.

## Optional rules

You can change several common Durak variants before starting a game or from the options screen:

- **Everyone may throw in** — when disabled, only the original attacker can add cards.
- **Transfer (perevodnoy)** — before beating anything, the defender may pass the attack to the next player by playing a card of the same rank.
- **Six-card limit** — can be disabled for a less restrictive attack limit.

## Saving and privacy

Game settings, statistics and — when enabled — the current session are stored locally in the browser using `localStorage`.

Nothing needs to be sent to a server. Clearing the browser's site data may also remove the saved game.

## Technical notes

The project is deliberately simple to run and distribute:

- one self-contained HTML file
- plain HTML, CSS and JavaScript
- no build step
- no framework
- no external assets required at runtime

This makes it easy to keep a copy on a computer, USB drive or any other place where a fully offline game is useful.
