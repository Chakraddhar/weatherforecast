const apiKey = '71c750572e335e93fa4d21328b1bc5ed'; // Replace with your OpenWeatherMap API Key
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const locateBtn = document.getElementById('locateBtn');
    const weatherDisplay = document.getElementById('weatherDisplay');
    const forecastDisplay = document.getElementById('forecastDisplay');
    const recentSearches = document.getElementById('recentSearches');
    const errorMsg = document.getElementById('errorMsg');

    function showError(msg) {
      errorMsg.textContent = msg;
      errorMsg.classList.remove('hidden');
    }

    function clearError() {
      errorMsg.textContent = '';
      errorMsg.classList.add('hidden');
    }

    function updateRecentSearches(city) {
      let searches = JSON.parse(localStorage.getItem('recentCities')) || [];
      if (!searches.includes(city)) {
        searches.unshift(city);
        if (searches.length > 5) searches.pop();
        localStorage.setItem('recentCities', JSON.stringify(searches));
      }
      renderRecentSearches();
    }

    function renderRecentSearches() {
      let searches = JSON.parse(localStorage.getItem('recentCities')) || [];
      recentSearches.innerHTML = '<option disabled selected>Recent Searches</option>';
      searches.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        recentSearches.appendChild(option);
      });
      recentSearches.classList.toggle('hidden', searches.length === 0);
    }

    async function fetchWeather(city) {
      try {
        clearError();
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        if (!res.ok) throw new Error('City not found');
        const data = await res.json();
        displayCurrentWeather(data);
        updateRecentSearches(city);
        fetchForecast(data.coord.lat, data.coord.lon);
      } catch (error) {
        showError(error.message);
      }
    }

    async function fetchWeatherByCoords(lat, lon) {
      try {
        clearError();
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const data = await res.json();
        displayCurrentWeather(data);
        updateRecentSearches(data.name);
        fetchForecast(lat, lon);
      } catch (error) {
        showError('Failed to fetch location weather.');
      }
    }

    async function fetchForecast(lat, lon) {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
      const data = await res.json();
      displayForecast(data);
    }

    function displayCurrentWeather(data) {
      const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
      weatherDisplay.innerHTML = `
        <h2 class="text-xl font-bold mb-2">${data.name}, ${data.sys.country}</h2>
        <div class="flex items-center gap-4">
          <img src="${icon}" alt="Weather icon" />
          <div>
            <p>🌡️ Temp: ${data.main.temp}°C</p>
            <p>💧 Humidity: ${data.main.humidity}%</p>
            <p>💨 Wind: ${data.wind.speed} m/s</p>
            <p>☁️ Condition: ${data.weather[0].description}</p>
          </div>
        </div>`;
    }

    function displayForecast(data) {
      const daily = {};
      data.list.forEach(entry => {
        const date = entry.dt_txt.split(' ')[0];
        if (!daily[date]) daily[date] = entry;
      });

      forecastDisplay.innerHTML = Object.entries(daily).slice(0, 5).map(([date, entry]) => {
        const icon = `https://openweathermap.org/img/wn/${entry.weather[0].icon}.png`;
        return `
          <div class="bg-white rounded shadow p-4 text-center">
            <h3 class="font-semibold">${date}</h3>
            <img src="${icon}" class="mx-auto" />
            <p>🌡️ ${entry.main.temp}°C</p>
            <p>💧 ${entry.main.humidity}%</p>
            <p>💨 ${entry.wind.speed} m/s</p>
          </div>`;
      }).join('');
    }

    searchBtn.addEventListener('click', () => {
      const city = cityInput.value.trim();
      if (city) fetchWeather(city);
      else showError('Please enter a city name.');
    });

    locateBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
          () => showError('Location access denied.')
        );
      } else {
        showError('Geolocation is not supported.');
      }
    });

    recentSearches.addEventListener('change', e => {
      if (e.target.value) fetchWeather(e.target.value);
    });

    renderRecentSearches();