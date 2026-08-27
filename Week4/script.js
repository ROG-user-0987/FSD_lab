async function getWeather() {

    const city = document.getElementById("cityInput").value;

    if (city === "") {
        alert("Please enter a city name");
        return;
    }

    try {

        // Get city coordinates
        const locationResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
        );

        const locationData = await locationResponse.json();

        if (!locationData.results) {
            document.getElementById("weather").innerHTML =
                "<h2>City not found</h2>";
            return;
        }

        const latitude = locationData.results[0].latitude;
        const longitude = locationData.results[0].longitude;
        const cityName = locationData.results[0].name;

        // Get weather using coordinates
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
        );

        const weatherData = await weatherResponse.json();

        const temperature = weatherData.current.temperature_2m;
        const humidity = weatherData.current.relative_humidity_2m;
        const windSpeed = weatherData.current.wind_speed_10m;

        document.getElementById("weather").innerHTML = `
            <h2>${cityName}</h2>

            <div class="weather-info">
                <div>
                    <h3>🌡️ Temperature</h3>
                    <p>${temperature} °C</p>
                </div>

                <div>
                    <h3>💧 Humidity</h3>
                    <p>${humidity}%</p>
                </div>

                <div>
                    <h3>💨 Wind Speed</h3>
                    <p>${windSpeed} km/h</p>
                </div>
            </div>
        `;

    } catch (error) {

        document.getElementById("weather").innerHTML =
            "<h2>Error</h2><p>Unable to fetch weather data.</p>";

        console.log(error);
    }
}