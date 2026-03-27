const apiKey = "7286b668e31a4aebb3a92629232009";
const weatherForm = document.getElementById("weather-form");
const locationInput = document.getElementById("location");
const weatherInfo = document.getElementById("weatherInfo");
const weatherDetails = document.getElementById("weather-details");
const statusMessage = document.getElementById("statusMessage");

function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#b02714" : "#7b4b19";
}

function renderWeatherCard(data) {
    return `
        <div class="city-name">${data.location.name}, ${data.location.country}</div>
        <img class="weather-icon" src="https:${data.current.condition.icon}" alt="${data.current.condition.text}">
        <p class="stat"><i class="fas fa-thermometer-half"></i> Temperature: ${data.current.temp_c}°C</p>
        <p class="stat"><i class="fas fa-cloud-sun"></i> Condition: ${data.current.condition.text}</p>
        <p class="stat"><i class="fas fa-tint"></i> Humidity: ${data.current.humidity}%</p>
        <p class="stat"><i class="fas fa-wind"></i> Wind Speed: ${data.current.wind_kph} km/h</p>
        <p class="stat"><i class="fas fa-clock"></i> Last Updated: ${data.current.last_updated}</p>
    `;
}

async function fetchCurrentWeather(query) {
    const endpoint = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}&aqi=no`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error("Unable to fetch weather data right now.");
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message || "Location not found.");
    }

    return data;
}

async function handleSearchWeather(event) {
    event.preventDefault();

    const location = locationInput.value.trim();
    if (!location) {
        setStatus("Please enter a city name.", true);
        return;
    }

    setStatus("Fetching weather...");

    try {
        const data = await fetchCurrentWeather(location);
        weatherInfo.innerHTML = renderWeatherCard(data);
        weatherInfo.classList.remove("muted-text");
        setStatus(`Showing weather for ${data.location.name}.`);
    } catch (error) {
        weatherInfo.innerHTML = "Could not load weather for this location.";
        weatherInfo.classList.add("muted-text");
        setStatus(error.message, true);
    }
}

async function fetchWeatherByLocation(latitude, longitude) {
    try {
        setStatus("Detecting your location weather...");
        const data = await fetchCurrentWeather(`${latitude},${longitude}`);
        weatherDetails.innerHTML = renderWeatherCard(data);
        weatherDetails.classList.remove("muted-text");
        setStatus("Location weather loaded.");
    } catch (error) {
        weatherDetails.innerHTML = "Location weather is unavailable right now.";
        weatherDetails.classList.add("muted-text");
        setStatus(error.message, true);
    }
}

function initGeolocation() {
    if (!("geolocation" in navigator)) {
        weatherDetails.textContent = "Geolocation is not supported in this browser.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByLocation(latitude, longitude);
        },
        () => {
            weatherDetails.textContent = "Location permission denied. You can still search by city name.";
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

weatherForm.addEventListener("submit", handleSearchWeather);
initGeolocation();