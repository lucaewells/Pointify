# Pointify

Pointify is a small browser app for tracking daily points across eating, exercise, and study habits. The idea is simple: give meaningful activities a point value, log them when they are done, and watch the pattern over time.

## Features

- Create reusable activities with a category and point value.
- Log activities against any date.
- See today's total, a seven-day average, a goal streak, and a personal best.
- Compare points across eating, exercising, and studying.
- View daily fluctuation charts and recent history.
- Data stays in the browser through `localStorage`.

## Running it locally

Open `index.html` in a browser. No build step or package install is needed.

For a local server, run:

```powershell
py -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Installing on a phone

Pointify is also set up as a progressive web app. Once GitHub Pages has deployed, open the live site on your phone and add it to your home screen.

On iPhone:

1. Open the live Pointify URL in Safari.
2. Tap the Share button.
3. Tap Add to Home Screen.
4. Tap Add.

On Android:

1. Open the live Pointify URL in Chrome.
2. Tap the menu button.
3. Tap Install app or Add to Home screen.
4. Confirm the install.

Your points are stored locally on the device using browser storage, so they stay on the installed app for that phone.

## Project notes

This is intentionally written as a plain HTML/CSS/JavaScript project. That keeps the code easy to read and makes the behavior visible without relying on a framework or generated setup.
