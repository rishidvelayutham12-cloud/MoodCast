# MoodCast
Every weather app shows the temperature. This one aims to show you the feel of the moment.

Type in any city and MoodCast fetches the current weather, then prompts Gemini to generate a unique little line that sums up the mood of that place at this very second – taking into account the current weather, the time of day, and something genuine about the culture/rhythm of that particular place. Search Tokyo at night during the rain and Lisbon in the afternoon sunshine and you'll get two totally different moods.

## Why I built this

Because I wanted a weather app that was a little more personable than just "72°F, partly cloudy". Every weather app is just pure data. This one is trying to be a little bit of both – practical and a little atmospheric.

## What it does

- **Current weather** for any city – temperature, condition, humidity, wind, and the feels-like – powered by [OpenWeatherMap API](https://openweathermap.org/api)
- **AI-generated mood lines** by Gemini, streamed into the app via a typewriter effect so you see it generated in front of you instead of watching a spinning circle load
- **Use my location** – one tap and no typing
- **Instant °C / °F switch** — no re-fetching needed, just recalculated on-the-fly
- **Weather condition matching icons** — simple line icons, ones that match the weather condition (sun, rain, storm, snow, fog, clear night), not some universal cloudy-day icon
- Minimalist, warm and uncluttered interface — no distracting photos, no clutter, just four weather metrics and one dynamic content metric

## Live demo

moodcast-sigma.vercel.app

## Technology

Pure HTML, CSS, and JavaScript — no framework, no build process, no tooling needed to look at the code. I wanted the core logic to be clear in the code itself, without relying on some tools' magic behind it.

- **Weather data**: [OpenWeatherMap API](https://openweathermap.org/api)
- **Mood generation**: [Gemini API](https://ai.google.dev/), proxied through my small serverless function (see below) and streamed in the browser
- **Hosting**: [Vercel](https://vercel.com)

### Why there is a proxy

I can't put the Gemini API key directly into the frontend JS code, because anyone could grab it with DevTools. Instead, the app calls my own serverless function (`api/tagline.js`) hosted on Vercel. That function keeps the key as a secret environment variable, calls Gemini on the app's behalf, and streams the response straight back to the browser. The key never reaches the client.

## To run it locally

1. Clone this repo
2. Obtain a free API key from [OpenWeatherMap](https://openweathermap.org/appid) and put it in `openWeatherApiKey` in `index.js`
3. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
4. Install the [Vercel CLI](https://vercel.com/docs/cli) and run `vercel dev` in the directory of this project with `GEMINI_API_KEY` as a local environment variable to have some input for the proxy
5. Use the URL given to you by Vercel — geolocation requires HTTPS or `localhost` to work, so loading `index.html` as a local file will not let you use this feature

## A few things I learned making this

- Hosted AI models get retired quickly. The model I built with was deprecated within a few months and my mood line just hung. Now the app uses Google's auto-updating "latest" model alias, and I moved to the lighter Flash-Lite tier, which writes the line in a few seconds instead of a minute or two with the quality holding up.
- Streaming the response and making the browser display it as a typewriter effect turned a lengthy waiting time into an actually entertaining experience rather than spinning loading animation
- Don’t believe in “the first result” from a data source – the first try to get city photos from Wikipedia returned only the locator map of the city and not the photos itself – that made me switch from including images in the app and focus fully on the AI-written mood line as an app’s personality
- GitHub's push protection caught a hard-coded API key in the middle of push – a good reminder why mixing API keys and public repositories is a bad idea

## What's next

Some things I will be interested to return to:
- A weekly forecast instead of current conditions
- Favourite cities list
- Adaptive mood line according to season rather than current weather

---

Developed by Rishi Velayutham – don’t hesitate to fork it, play with it and let me know about issues.
