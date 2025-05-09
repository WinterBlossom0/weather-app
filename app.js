// Weather API Key
const API_KEY = '8c1d48a6ee77421680e175118252004';
const BASE_URL = 'https://api.weatherapi.com/v1';

// DOM Elements
const cityName = document.getElementById('city-name');
const themeToggle = document.getElementById('theme-toggle');
const temperature = document.getElementById('temperature');
const tempNext = document.getElementById('temp-next');
const humidity = document.getElementById('humidity');
const humidityNext = document.getElementById('humidity-next');
const windSpeed = document.getElementById('wind-speed');
const windNext = document.getElementById('wind-next');
const pressure = document.getElementById('pressure');
const pressureNext = document.getElementById('pressure-next');
const predictionDesc = document.getElementById('prediction-desc');
const predictionIcon = document.querySelector('.prediction-icon i');
const forecastItems = document.getElementById('forecast-items');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const aqiValue = document.getElementById('aqi-value');
const aqiDesc = document.getElementById('aqi-desc');

// Location input elements
const locationInput = document.getElementById('location-input');
const locationSubmit = document.getElementById('location-submit');
const currentLocationBtn = document.getElementById('current-location');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get weather data for current location on page load
    getCurrentLocationWeather();
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    // Toggle icon
    const icon = themeToggle.querySelector('i');
    if (icon.classList.contains('fa-sun')) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
});

// Location input functionality
locationSubmit.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        getWeatherData(location);
    }
});

locationInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const location = locationInput.value.trim();
        if (location) {
            getWeatherData(location);
        }
    }
});

currentLocationBtn.addEventListener('click', getCurrentLocationWeather);

// Functions
async function getCurrentLocationWeather() {
    try {
        // Show loading state
        showLoading();
        
        // Get weather data for auto:ip
        await getWeatherData('auto:ip');
    } catch (error) {
        console.error('Error getting current location weather:', error);
        showError('Unable to get your current location weather. Please try searching for a location instead.');
    }
}

async function getWeatherData(location) {
    try {
        // Show loading state
        showLoading();
        
        // Fetch current weather, forecast, and air quality data
        const [currentData, forecastData, airQualityData] = await Promise.all([
            fetchCurrentWeather(location),
            fetchForecast(location, 7),
            fetchAirQuality(location)
        ]);
        
        // Update UI with fetched data
        updateCurrentWeather(currentData, forecastData);
        updateForecast(forecastData);
        updateAirQuality(airQualityData);
        updateNextHourPrediction(forecastData);
        
        // Remove loading state
        removeLoading();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Unable to fetch weather data. Please check the location and try again.');
    }
}

// API fetch functions
async function fetchCurrentWeather(location) {
    const response = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${location}&aqi=yes`);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

async function fetchForecast(location, days) {
    const response = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${location}&days=${days}&aqi=yes&alerts=yes`);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

async function fetchAirQuality(location) {
    const response = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${location}&aqi=yes`);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

// UI update functions
function updateCurrentWeather(data, forecastData) {
    // Location
    const locationData = data.location;
    const currentData = data.current;
    
    cityName.textContent = `${locationData.name}, ${locationData.region}, ${locationData.country}`;
    
    // Current weather metrics
    temperature.textContent = `${Math.round(currentData.temp_c)}°C`;
    humidity.textContent = `${currentData.humidity}%`;
    windSpeed.textContent = `${currentData.wind_kph} km/h`;
    pressure.textContent = `${currentData.pressure_mb} mb`;
    
    // Next hour forecast
    if (forecastData && forecastData.forecast && forecastData.forecast.forecastday && forecastData.forecast.forecastday[0]) {
        const hourlyData = forecastData.forecast.forecastday[0].hour;
        const currentHour = new Date().getHours();
        const nextHourIndex = (currentHour + 1) % 24;
        
        if (hourlyData[nextHourIndex]) {
            const nextHourData = hourlyData[nextHourIndex];
            
            // Set next hour forecasts
            tempNext.innerHTML = `Next: ${Math.round(nextHourData.temp_c)}°C <span class="trend ${nextHourData.temp_c < currentData.temp_c ? 'falling' : 'rising'}">${nextHourData.temp_c < currentData.temp_c ? 'FALLING' : 'RISING'}</span>`;
            
            humidityNext.innerHTML = `Next: ${nextHourData.humidity}% <span class="trend ${nextHourData.humidity < currentData.humidity ? 'falling' : 'rising'}">${nextHourData.humidity < currentData.humidity ? 'FALLING' : 'RISING'}</span>`;
            
            windNext.innerHTML = `Next: ${nextHourData.wind_kph} km/h <span class="trend ${nextHourData.wind_kph < currentData.wind_kph ? 'falling' : 'rising'}">${nextHourData.wind_kph < currentData.wind_kph ? 'FALLING' : 'RISING'}</span>`;
            
            pressureNext.innerHTML = `Next: ${nextHourData.pressure_mb} mb <span class="trend ${nextHourData.pressure_mb < currentData.pressure_mb ? 'falling' : 'rising'}">${nextHourData.pressure_mb < currentData.pressure_mb ? 'FALLING' : 'RISING'}</span>`;
        }
    }
    
    // Update sunrise and sunset times
    if (forecastData && forecastData.forecast && forecastData.forecast.forecastday && forecastData.forecast.forecastday[0]) {
        const astro = forecastData.forecast.forecastday[0].astro;
        sunrise.textContent = astro.sunrise;
        sunset.textContent = astro.sunset;
    }
}

function updateForecast(data) {
    // Clear previous forecast items
    forecastItems.innerHTML = '';
    
    // Create new forecast items
    const forecastDays = data.forecast.forecastday;
    forecastDays.forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img class="forecast-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
            <div class="forecast-temps">
                <span class="high">${Math.round(day.day.maxtemp_c)}°</span>
                <span class="low">${Math.round(day.day.mintemp_c)}°</span>
            </div>
            <div class="forecast-condition">${day.day.condition.text}</div>
        `;
        
        forecastItems.appendChild(forecastItem);
    });
}

function updateAirQuality(data) {
    if (data.current.air_quality) {
        const aqi = Math.round(data.current.air_quality.pm10);
        aqiValue.textContent = aqi;
        
        // Update AQI description and color based on value
        if (aqi <= 50) {
            aqiValue.style.backgroundColor = '#4CAF50';
            aqiDesc.textContent = 'Good - Air quality is satisfactory';
        } else if (aqi <= 100) {
            aqiValue.style.backgroundColor = '#FF9800';
            aqiDesc.textContent = 'Moderate - Acceptable air quality';
        } else if (aqi <= 150) {
            aqiValue.style.backgroundColor = '#F44336';
            aqiDesc.textContent = 'Poor - May cause breathing discomfort';
        } else {
            aqiValue.style.backgroundColor = '#9C27B0';
            aqiDesc.textContent = 'Very Poor - Health warning of emergency conditions';
        }
    } else {
        aqiValue.textContent = 'N/A';
        aqiDesc.textContent = 'Air quality data not available';
        aqiValue.style.backgroundColor = '#9E9E9E';
    }
}

function updateNextHourPrediction(data) {
    if (data && data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
        const hourlyData = data.forecast.forecastday[0].hour;
        const currentHour = new Date().getHours();
        const nextHourIndex = (currentHour + 1) % 24;
        
        if (hourlyData[nextHourIndex]) {
            const nextHourData = hourlyData[nextHourIndex];
            
            // Update prediction text and icon
            const willRain = nextHourData.chance_of_rain > 30;
            predictionDesc.textContent = willRain ? `Rain Expected (${nextHourData.chance_of_rain}% chance)` : 'No Rain Expected';
            
            // Update icon based on condition
            if (willRain) {
                predictionIcon.className = 'fas fa-cloud-rain';
            } else if (nextHourData.condition.text.toLowerCase().includes('cloud')) {
                predictionIcon.className = 'fas fa-cloud';
            } else if (nextHourData.condition.text.toLowerCase().includes('sun') || 
                       nextHourData.condition.text.toLowerCase().includes('clear')) {
                predictionIcon.className = 'fas fa-sun';
            } else {
                predictionIcon.className = 'fas fa-cloud-sun';
            }
        }
    }
}

function showLoading() {
    cityName.textContent = 'Loading...';
    temperature.textContent = '--°C';
    humidity.textContent = '--%';
    windSpeed.textContent = '-- km/h';
    pressure.textContent = '-- mb';
}

function removeLoading() {
    // Nothing specific to do here, UI is updated with actual data
}

function showError(message) {
    cityName.textContent = 'Error';
    temperature.textContent = '--°C';
    humidity.textContent = '--%';
    windSpeed.textContent = '-- km/h';
    pressure.textContent = '-- mb';
    
    console.error(message);
}