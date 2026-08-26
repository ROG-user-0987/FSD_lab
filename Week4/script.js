const form = document.getElementById("weatherForm");

const API_KEY = "YOUR_API_KEY";

form.addEventListener("submit", getWeather);

async function getWeather(event) {

    event.preventDefault();

    let city = document.getElementById("city").value;

    let url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`;

    try {

        let response = await fetch(url);

        let data = await response.json();

        if (!response.ok) {
            throw new Error("City not found");
        }

        document.getElementById("weather").style.display = "block";

        document.getElementById("cityName").textContent =
            "📍 " + data.location.name;

        document.getElementById("temperature").textContent =
            data.current.temp_c + "°C";

        document.getElementById("condition").textContent =
            data.current.condition.text;

        document.getElementById("humidity").textContent =
            data.current.humidity + "%";

        document.getElementById("wind").textContent =
            data.current.wind_kph + " km/h";

        document.getElementById("error").textContent = "";

    }

    catch (error) {

        document.getElementById("weather").style.display = "none";

        document.getElementById("error").textContent =
            "City not found. Please try again.";

    }
}