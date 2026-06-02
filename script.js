// Weather API Configuration
const API_KEY = 'd8185dd3c61b0d5752dbe524bf7ae401'; // OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherSection = document.getElementById('weatherSection');
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const welcomeMessage = document.getElementById('welcomeMessage');
const themeToggle = document.getElementById('themeToggle');

// State
let currentUnit = 'metric'; // metric for Celsius, imperial for Fahrenheit

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleLocationSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    themeToggle.addEventListener('click', toggleTheme);
}

// Handle Search
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
        searchInput.value = '';
    } else {
        showError('Please enter a city name');
    }
}

// Handle Location Search
function handleLocationSearch() {
    if (navigator.geolocation) {
        showSpinner();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                hideSpinner();
                showError('Unable to get your location. Please enable location access.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

// Fetch Weather by City
async function fetchWeatherByCity(city) {
    try {
        showSpinner();
        hideError();

        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`
        );
        const forecastData = await forecastResponse.json();

        displayWeather(data);
        displayForecast(forecastData.list);
        hideSpinner();
    } catch (error) {
        hideSpinner();
        showError(error.message || 'Failed to fetch weather data');
        console.error('Error:', error);
    }
}

// Fetch Weather by Coordinates
async function fetchWeatherByCoordinates(lat, lon) {
    try {
        showSpinner();
        hideError();

        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch weather');
        }

        const data = await response.json();
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );
        const forecastData = await forecastResponse.json();

        displayWeather(data);
        displayForecast(forecastData.list);
        hideSpinner();
    } catch (error) {
        hideSpinner();
        showError(error.message || 'Failed to fetch weather data');
        console.error('Error:', error);
    }
}

// Display Weather Data
function displayWeather(data) {
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const speedUnit = currentUnit === 'metric' ? 'm/s' : 'mph';

    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = Math.round(data.main.temp) + tempUnit;
    document.getElementById('weatherDescription').textContent = data.weather[0].main;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    document.getElementById('humidity').textContent = data.main.humidity + '%';
    document.getElementById('windSpeed').textContent = data.wind.speed + ' ' + speedUnit;
    document.getElementById('visibility').textContent = (data.visibility / 1000).toFixed(1) + ' km';
    document.getElementById('pressure').textContent = data.main.pressure + ' hPa';
    document.getElementById('feelsLike').textContent = Math.round(data.main.feels_like) + tempUnit;
    document.getElementById('rainChance').textContent = (data.clouds.all || 0) + '%';

    // Update date and time
    const now = new Date();
    document.getElementById('dateTime').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Show weather section, hide welcome
    weatherSection.style.display = 'block';
    welcomeMessage.style.display = 'none';
}

// Display 5-Day Forecast
function displayForecast(forecastList) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const dailyForecasts = {};

    // Group forecast by day
    forecastList.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        if (!dailyForecasts[day]) {
            dailyForecasts[day] = [];
        }
        dailyForecasts[day].push(item);
    });

    // Create forecast cards (one per day, max 5 days)
    let dayCount = 0;
    for (const day in dailyForecasts) {
        if (dayCount >= 5) break;

        const dayForecasts = dailyForecasts[day];
        const avgTemp = Math.round(
            dayForecasts.reduce((sum, f) => sum + f.main.temp, 0) / dayForecasts.length
        );
        const weatherMain = dayForecasts[0].weather[0];

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-date">${day}</div>
            <img src="https://openweathermap.org/img/wn/${weatherMain.icon}@2x.png" alt="weather" class="forecast-icon">
            <div class="forecast-temp">${avgTemp}${tempUnit}</div>
            <div class="forecast-desc">${weatherMain.main}</div>
        `;
        forecastContainer.appendChild(forecastCard);
        dayCount++;
    }
}

// Show/Hide Spinner
function showSpinner() {
    spinner.style.display = 'flex';
}

function hideSpinner() {
    spinner.style.display = 'none';
}

// Show/Hide Error
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    weatherSection.style.display = 'none';
    welcomeMessage.style.display = 'none';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Theme Toggle
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeIcon(isDarkMode);
}

function updateThemeIcon(isDarkMode) {
    const icon = themeToggle.querySelector('i');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

// Auto-load weather for current location on page load
window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoordinates(latitude, longitude);
            },
            () => {
                // Silently fail if geolocation is not available
                console.log('Geolocation not available');
            }
        );
    }
});
