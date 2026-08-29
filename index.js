// Configuration
const openWeatherApiKey = "c2b261571e40c8b78293ea96aaec9b09";
const geminiApiKey = ""; // regenerate before going public
const geminiModel = "gemini-3.5-flash";
const typewriterIntervalMs = 22; // ms per character 

// DOM Element References
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const locateBtn = document.getElementById("locate-btn");
const loadingOverlayEl = document.getElementById("loading-overlay");

const cityNameEl = document.getElementById("city-name");
const weatherDescEl = document.getElementById("weather-desc");
const weatherIconEl = document.getElementById("weather-icon");
const temperatureEl = document.getElementById("temperature");
const degreeSymbolEl = document.querySelector(".degree-symbol");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const taglineEl = document.getElementById("tagline");
const unitCBtn = document.getElementById("unit-c");
const unitFBtn = document.getElementById("unit-f");

// State
let currentRequestId = 0;
let currentUnit = "C";
let lastWeather = null;
let typewriterTimer = null;

// Event Listeners 

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  const weatherPromise = fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${openWeatherApiKey}`
  );
  performSearch(weatherPromise);
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation isn't supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const weatherPromise = fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${openWeatherApiKey}`
      );
      performSearch(weatherPromise);
    },
    (error) => {
      console.warn("Geolocation error:", error);
      alert("Couldn't get your location. Please allow location access or search manually.");
    }
  );
});

unitCBtn.addEventListener("click", () => setUnit("C"));
unitFBtn.addEventListener("click", () => setUnit("F"));

// Core Search Flow 
// Weather renders as soon as it's back (fast). The tagline handles its
// own thinking-indicator; typewriter-stream animation independently,
// with no time limit; it waits as long as it takes.

async function performSearch(weatherFetchPromise) {
  const requestId = ++currentRequestId;
  showLoading();

  try {
    const response = await weatherFetchPromise;
    if (!response.ok) throw new Error("Location not found");

    const data = await response.json();
    if (requestId !== currentRequestId) return;

    renderWeather(data);
    hideLoading();

    streamTagline(
      data.name,
      data.weather[0].description,
      Math.round(data.main.temp),
      data.timezone,
      requestId
    );
  } catch (error) {
    if (requestId !== currentRequestId) return;
    hideLoading();
    alert("Could not fetch weather data. Please check the city name and try again.");
    console.error(error);
  }
}

function showLoading() {
  loadingOverlayEl.style.display = "flex";
}

function hideLoading() {
  loadingOverlayEl.style.display = "none";
}

// Rendering 

function renderWeather(data) {
  lastWeather = {
    tempC: data.main.temp,
    feelsLikeC: data.main.feels_like,
    humidity: data.main.humidity,
    windKmh: data.wind.speed * 3.6,
    name: data.name,
    country: data.sys.country
  };

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  weatherDescEl.textContent = data.weather[0].description;
  humidityEl.textContent = `${Math.round(lastWeather.humidity)}%`;
  windSpeedEl.textContent = `${Math.round(lastWeather.windKmh)} km/h`;

  setWeatherIcon(data.weather[0].id, data.weather[0].icon);

  applyTemperatureDisplay();
}

function applyTemperatureDisplay() {
  if (!lastWeather) return;

  if (currentUnit === "C") {
    temperatureEl.textContent = Math.round(lastWeather.tempC);
    feelsLikeEl.textContent = `${Math.round(lastWeather.feelsLikeC)}°C`;
    degreeSymbolEl.textContent = "°C";
  } else {
    temperatureEl.textContent = Math.round(celsiusToFahrenheit(lastWeather.tempC));
    feelsLikeEl.textContent = `${Math.round(celsiusToFahrenheit(lastWeather.feelsLikeC))}°F`;
    degreeSymbolEl.textContent = "°F";
  }
}

function setUnit(unit) {
  currentUnit = unit;
  unitCBtn.classList.toggle("active", unit === "C");
  unitFBtn.classList.toggle("active", unit === "F");
  applyTemperatureDisplay();
}

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

// Weather Icon

const weatherIcons = {
  clearDay: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"></circle><line x1="12" y1="2" x2="12" y2="4.5"></line><line x1="12" y1="19.5" x2="12" y2="22"></line><line x1="2" y1="12" x2="4.5" y2="12"></line><line x1="19.5" y1="12" x2="22" y2="12"></line><line x1="4.9" y1="4.9" x2="6.6" y2="6.6"></line><line x1="17.4" y1="17.4" x2="19.1" y2="19.1"></line><line x1="4.9" y1="19.1" x2="6.6" y2="17.4"></line><line x1="17.4" y1="6.6" x2="19.1" y2="4.9"></line></svg>`,
  clearNight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1110.5 4a6.8 6.8 0 009.5 10.5z"></path></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 17a4 4 0 010-8 5.5 5.5 0 0110.6-1.5A4.2 4.2 0 0117.5 17h-11z"></path></svg>`,
  rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 13a4 4 0 010-8 5.5 5.5 0 0110.6-1.5A4.2 4.2 0 0117.5 13h-11z"></path><line x1="8" y1="16" x2="7" y2="19"></line><line x1="12" y1="16" x2="11" y2="19"></line><line x1="16" y1="16" x2="15" y2="19"></line></svg>`,
  drizzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 13a4 4 0 010-8 5.5 5.5 0 0110.6-1.5A4.2 4.2 0 0117.5 13h-11z"></path><line x1="9" y1="16.5" x2="8.3" y2="18.5"></line><line x1="14.5" y1="16.5" x2="13.8" y2="18.5"></line></svg>`,
  thunderstorm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 13a4 4 0 010-8 5.5 5.5 0 0110.6-1.5A4.2 4.2 0 0117.5 13h-11z"></path><polyline points="12,15 9.5,19.5 12.5,19.5 10,23"></polyline></svg>`,
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 13a4 4 0 010-8 5.5 5.5 0 0110.6-1.5A4.2 4.2 0 0117.5 13h-11z"></path><line x1="8" y1="17" x2="8" y2="20.5"></line><line x1="6.3" y1="18.75" x2="9.7" y2="18.75"></line><line x1="16" y1="17" x2="16" y2="20.5"></line><line x1="14.3" y1="18.75" x2="17.7" y2="18.75"></line></svg>`,
  mist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="13" x2="20" y2="13"></line><line x1="4" y1="17" x2="16" y2="17"></line></svg>`
};

function setWeatherIcon(id, iconCode) {
  const isNight = typeof iconCode === "string" && iconCode.endsWith("n");
  let key = "cloud";

  if (id >= 200 && id < 300) key = "thunderstorm";
  else if (id >= 300 && id < 400) key = "drizzle";
  else if (id >= 500 && id < 600) key = "rain";
  else if (id >= 600 && id < 700) key = "snow";
  else if (id >= 700 && id < 800) key = "mist";
  else if (id === 800) key = isNight ? "clearNight" : "clearDay";
  else if (id > 800) key = "cloud";

  weatherIconEl.innerHTML = weatherIcons[key];
}

// Gemini Tagline: thinking indicator; streamed typewriter 
// One silent automatic retry on a 429 rate-limit before showing an error.

function showThinkingIndicator() {
  taglineEl.textContent = "Creating the mood";
  taglineEl.classList.remove("tagline-error");
  taglineEl.classList.add("tagline-loading");
}

function showTaglineError(message) {
  stopTypewriter();
  taglineEl.classList.remove("tagline-loading");
  taglineEl.classList.add("tagline-error");
  taglineEl.textContent = message;
}

function stopTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
}

async function streamTagline(cityName, weatherDesc, temp, timezoneOffsetSeconds, requestId, isRetry = false) {
  if (!geminiApiKey) {
    showTaglineError("Add a Gemini API key to enable cozy messages.");
    return;
  }

  if (!isRetry) showThinkingIndicator();

  const timeOfDay = getTimeOfDayLabel(timezoneOffsetSeconds);
  const promptText = `Write one short, cozy, atmospheric sentence (under 18 words) capturing the current mood in ${cityName}. It's currently ${timeOfDay} there, ${temp}°C, and ${weatherDesc}. Weave in one specific, real detail about ${cityName}'s culture, cuisine, or daily rhythm — not a generic weather description.

Example of the tone and specificity wanted: "Kyoto's temple bells fade into a soft evening drizzle, matcha steam curling from tiny stalls."

No quotation marks, no hashtags, don't repeat the city name more than once.`;

  const pendingChars = [];
  let streamEnded = false;
  let gotFirstChunk = false;
  let closingQuoteAppended = false;

  function beginTypewriter() {
    if (typewriterTimer) return;
    typewriterTimer = setInterval(() => {
      if (requestId !== currentRequestId) {
        stopTypewriter();
        return;
      }
      if (pendingChars.length > 0) {
        taglineEl.textContent += pendingChars.shift();
      } else if (streamEnded && !closingQuoteAppended) {
        closingQuoteAppended = true;
        taglineEl.textContent += '"';
        stopTypewriter();
      }
    }, typewriterIntervalMs);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 1.0 }
        })
      }
    );

    if (!response.ok || !response.body) {
      const errorBody = response.body ? await response.text() : "no response body";
      console.error(`Gemini stream failed (${response.status}):`, errorBody);

      // One silent automatic retry on rate limit, after a short wait.
      if (response.status === 429 && !isRetry) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (requestId === currentRequestId) {
          streamTagline(cityName, weatherDesc, temp, timezoneOffsetSeconds, requestId, true);
        }
        return;
      }

      if (requestId === currentRequestId) {
        const message = response.status === 429
          ? "Too many requests right now — wait a moment and try again."
          : "Couldn't generate a vibe for this place. Try searching again.";
        showTaglineError(message);
      }
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (requestId !== currentRequestId) {
        reader.cancel();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep any incomplete trailing line for next chunk

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;

        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const part = parsed.candidates?.[0]?.content?.parts?.[0];

          // Skip internal reasoning chunks; only type out the real answer.
          if (part && part.thought) continue;

          const piece = part?.text;
          if (piece) {
            if (!gotFirstChunk) {
              gotFirstChunk = true;
              taglineEl.classList.remove("tagline-loading");
              taglineEl.textContent = '"';
              beginTypewriter();
            }
            pendingChars.push(...piece.split(""));
          }
        } catch (parseErr) {
          console.warn("Failed to parse Gemini stream chunk:", parseErr, jsonStr);
        }
      }
    }

    streamEnded = true;

    if (!gotFirstChunk) {
      showTaglineError("Couldn't generate a vibe for this place. Try searching again.");
    }
  } catch (error) {
    if (requestId !== currentRequestId) return;
    console.error("Gemini stream request threw an error:", error);
    showTaglineError("Couldn't reach Gemini. Check your connection and try again.");
  }
}

function getTimeOfDayLabel(timezoneOffsetSeconds) {
  const localMs = Date.now() + timezoneOffsetSeconds * 1000;
  const localHour = new Date(localMs).getUTCHours();

  if (localHour >= 5 && localHour < 12) return "morning";
  if (localHour >= 12 && localHour < 17) return "afternoon";
  if (localHour >= 17 && localHour < 21) return "evening";
  return "late night";
}