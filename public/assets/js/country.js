document.addEventListener('DOMContentLoaded', () => {
    fetch('https://restcountries.com/v3.1/all')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const selectElement = document.getElementById('country');

            // Populate the select element with country options
            data.forEach(country => {
                const option = document.createElement('option');
                option.value = country.cca2; // Use country code as value
                option.innerHTML = `${country.name.common}`; // Display country name

                // Append option to select
                selectElement.appendChild(option);
            });

            // Set India as the default selected option
            selectElement.value = 'IN'; // 'IN' is the country code for India
        })
        .catch(error => console.error('Error fetching data:', error));
});
