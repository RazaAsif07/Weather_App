document.getElementById('city').addEventListener('input', function () {
    var city = this.value;
    getWeather(city);
});

async function getWeather(city) {
    try {
        if (!city) {
            const location = await getCurrentLocation();
            if (location) {
                city = location.city;
            } else {
                console.error('Error: Could not get current location.');
                return;
            }
        }

        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                q: city,
                appid: '54a57bc234ad752a4f59e59cd372201d',
                units: 'metric'
            },
        });
        const currentTemperature = response.data.list[0].main.temp;

        // Store the current temperature data in the #main-temp element
        document.getElementById('main-temp').textContent = Math.round(currentTemperature) + '°C';
        document.getElementById('main-temp').dataset.temperature = currentTemperature; // Store the temperature data for conversion

        const forecastData = response.data.list;

        const dailyForecast = {};
        forecastData.forEach((data) => {
            const day = new Date(data.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    minTemp: data.main.temp_min,
                    maxTemp: data.main.temp_max,
                    description: data.weather[0].description,
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed,
                    icon: data.weather[0].icon,
                };
            } else {
                dailyForecast[day].minTemp = Math.min(dailyForecast[day].minTemp, data.main.temp_min);
                dailyForecast[day].maxTemp = Math.max(dailyForecast[day].maxTemp, data.main.temp_max);
            }
        });

        const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const currentWeatherIconCode = dailyForecast[currentDay].icon;

        document.querySelector('.location').textContent = response.data.city.name;
        document.querySelector('.weather-desc').textContent = dailyForecast[currentDay].description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        document.querySelector('.humidity .value').textContent = dailyForecast[currentDay].humidity + ' %';
        document.querySelector('.wind .value').textContent = dailyForecast[currentDay].windSpeed + ' m/s';

        const dayElements = document.querySelectorAll('.day-name');
        const tempElements = document.querySelectorAll('.day-temp');
        const iconElements = document.querySelectorAll('.day-icon');

        dayElements.forEach((dayElement, index) => {
            const day = Object.keys(dailyForecast)[index];
            const data = dailyForecast[day];
            dayElement.textContent = day;
            tempElements[index].textContent = `${Math.round(data.minTemp)}º / ${Math.round(data.maxTemp)}º`;
            iconElements[index].innerHTML = getWeatherIcon(data.icon);
        });

        document.querySelector('.weather-icon').innerHTML = getWeatherIcon(currentWeatherIconCode);

    } catch (error) {
        console.error('Error while fetching weather:', error);
    }
}

function getWeatherIcon(iconCode) {
    const iconBaseUrl = 'https://openweathermap.org/img/wn/';
    const iconSize = '@2x.png';
    return `<img src="${iconBaseUrl}${iconCode}${iconSize}" alt="Weather Icon">`;
}

document.addEventListener("DOMContentLoaded", function () {
    getWeather();
    setInterval(getWeather, 900000); // Refresh every 15 minutes
});

// Add event listener to main temperature element for toggling temperature unit
document.getElementById('main-temp').addEventListener('click', toggleTemperatureUnit);

// Add event listeners to temperature elements
document.querySelectorAll('.day-temp').forEach(element => {
    element.addEventListener('click', toggleTemperatureUnit);
});

// Function to toggle between Celsius and Fahrenheit
async function toggleTemperatureUnit() {
    const mainTempElement = document.getElementById('main-temp');
    let temperature = parseFloat(mainTempElement.dataset.temperature); // Get temperature value from 'data-temperature' attribute

    // Toggle temperature unit flag
    isCelsius = !isCelsius;

    // Convert temperature to the appropriate unit
    temperature = isCelsius ? convertToCelsius(temperature) : convertToFahrenheit(temperature);

    // Update temperature display
    mainTempElement.textContent = Math.round(temperature) + (isCelsius ? '°C' : '°F');
    mainTempElement.dataset.temperature = temperature; // Update the stored temperature data for further conversions
}

// Flag to track current temperature unit
let isCelsius = true;

// Function to convert Celsius to Fahrenheit
function convertToFahrenheit(celsius) {
    return celsius * 9 / 5 + 32;
}

// Function to convert Fahrenheit to Celsius
function convertToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5 / 9;
}

// Function to get user's current location
async function getCurrentLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = position.coords;

        const response = await axios.get(`https://us1.locationiq.com/v1/reverse.php?key=pk.e1ba30021ee0d694a54263603d66e06a&lat=${latitude}&lon=${longitude}&format=json`);
        const city = response.data.address.city;

        return { city };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
}
