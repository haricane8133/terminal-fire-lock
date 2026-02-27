# terminal-fire-lock

A fun way to lock your terminal with mesmerizing animations. Requires a passphrase to unlock — perfect for pranking friends, keeping pranksters at bay, or CTF challenges.

```
         ^*x#$##xs^..
       :*S$$$$$$$$$S*:
      .x$$$$$$$$$$$$$x.   !! ACCESS DENIED !!
     ^S$$$$$$$$$$$$$$$S^
    :S$$$$$$$$$$$$$$$$$S:
```

## Features

- 5 animation themes: fire, matrix, stars, static, rain
- Passphrase unlock (type the words anywhere — order doesn't matter)
- Time, day, and date-based activation windows
- Blocks CTRL+C / CTRL+Z escape attempts
- Optional auto-exit timeout
- Sound effects via terminal bell
- Zero dependencies — Node.js built-ins only
- Works on macOS, Linux, and Windows

## Installation

```bash
npm install -g terminal-fire-lock
```

Or run without installing:

```bash
npx terminal-fire-lock
```

## Usage

```bash
# Default passphrase is "please" and "sorry"
tfl

# Custom passphrase (all words must be typed to unlock)
tfl -p "secret,word"

# Different theme
tfl --theme matrix

# Pick a random theme each time
tfl --random-theme

# Custom banner with a hint
tfl -b "WHO GOES THERE?" --hint "Think about what you did"

# Only active on weekdays between 9am–5pm
tfl -s "09:00" -e "17:00" --days "mon,tue,wed,thu,fri"

# Only active on specific dates
tfl --dates "2026-03-01,2026-03-02" -s "10:30" -e "15:30"

# Auto-exit after 60 seconds if not unlocked
tfl --timeout 60

# Allow CTRL+C to exit (disables signal blocking)
tfl --no-block-signals
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-d, --delay <ms>` | Animation frame delay in ms | `30` |
| `-p, --passphrase <words>` | Comma-separated unlock words | `please,sorry` |
| `-b, --banner <text>` | Banner text | `!! ACCESS DENIED !!` |
| `--hint <text>` | Hint shown below the banner | — |
| `-t, --theme <name>` | Animation theme | `fire` |
| `-r, --random-theme` | Pick a random theme on start | — |
| `-s, --start-time <HH:MM>` | Active window start (24h) | Always |
| `-e, --end-time <HH:MM>` | Active window end (24h) | Always |
| `--days <days>` | Active days — numbers (0=Mon) or names | All days |
| `--dates <dates>` | Active dates, comma-separated `YYYY-MM-DD` | All dates |
| `--timeout <seconds>` | Auto-exit after N seconds | — |
| `-m, --messages <msgs>` | Pipe-separated exit messages | Default messages |
| `--message-delay <ms>` | Delay between exit messages | `1000` |
| `--sound` | Enable terminal bell on keypress | Off |
| `--no-block-signals` | Allow CTRL+C to exit | Blocked |
| `-v, --version` | Show version | — |
| `-h, --help` | Show help | — |

## Themes

| Theme | Description |
|-------|-------------|
| `fire` | ASCII fire rising from the bottom (default) |
| `matrix` | Falling Katakana/alphanumeric characters in green |
| `stars` | Twinkling starfield |
| `static` | TV static noise |
| `rain` | Falling rain drops |

## How Unlocking Works

Type the passphrase words anywhere into the terminal — they don't need to be in order or contiguous. With the default passphrase (`please,sorry`), typing something like _"I'm sorry, please let me in"_ unlocks it because the input contains both words.

## Examples

**Prank a friend:**
```bash
tfl -p "im,sorry" -b "SAY THE MAGIC WORDS" --hint "Apologies work wonders" --sound

# Add to ~/.zshrc (I won't tell you how) :)
```

**AFK screen:**
```bash
tfl -p "mypassword" -b "AFK — BACK SOON" --theme stars
```

**CTF challenge:**
```bash
tfl -p "flag,captured" --theme matrix -b "FIND THE FLAG"
```

**Auto-lock from `.zshrc`:**
```bash
# Only activate in new terminals during work hours, not in VS Code (If you want)
if [ "$TERM_PROGRAM" != "vscode" ]; then
  tfl -s "09:00" -e "17:00" --days "mon,tue,wed,thu,fri"
fi
```

## Development

```bash
git clone https://github.com/haricane8133/terminal-fire-lock.git
cd terminal-fire-lock
node tfl.js
```

## License

[WTFPL](./LICENSE)
