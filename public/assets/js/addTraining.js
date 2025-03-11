// Function to update status options based on date
function updateStatusOptions(selectedDate) {
    const trainingStatus = document.getElementById('training_status');
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
    
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(0, 0, 0, 0);

    // Clear existing options
    trainingStatus.innerHTML = '<option value="">Select</option>';

    if (selectedDateTime > currentDate) {
        // Future date - show Scheduled, Postponed, and Cancelled
        trainingStatus.innerHTML += `
            <option value="Scheduled">Scheduled</option>
            <option value="Postponed">Postponed</option>
            <option value="Cancelled">Cancelled</option>
        `;
    } else if (selectedDateTime < currentDate) {
        // Past date - show Scheduled, Postponed, and Completed
        trainingStatus.innerHTML += `
            <option value="Scheduled">Scheduled</option>
            <option value="Postponed">Postponed</option>
            <option value="Completed">Completed</option>
        `;
    } else {
        // Current date - show all options
        trainingStatus.innerHTML += `
            <option value="Scheduled">Scheduled</option>
            <option value="Postponed">Postponed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
        `;
    }
}

// Add event listener to date input
document.getElementById('training_date').addEventListener('change', function(e) {
    updateStatusOptions(e.target.value);
});

// Function to fetch and display company name when page loads
async function fetchAndDisplayCompanyName() {
    const billing_company_field = document.getElementById("billing_company");
    const company_id = billing_company_field.value; // This will be "1"
    console.log('Current billing company ID:', company_id);

    try {
        console.log('Fetching companies from API...');
        const companyResponse = await fetch("https://bni-data-backend.onrender.com/api/company");
        const companies = await companyResponse.json();
        console.log('Fetched companies data:', companies);

        // Find company where company_id matches the input value
        const matchingCompany = companies.find(company => company.company_id === parseInt(company_id));
        console.log('Found matching company:', matchingCompany);

        if (matchingCompany) {
            console.log('Setting company name for display:', matchingCompany.company_name);
            // Store the company ID as a data attribute
            billing_company_field.dataset.companyId = company_id;
            // Display the company name in the input
            billing_company_field.value = matchingCompany.company_name;
        } else {
            console.warn('No matching company found for ID:', company_id);
        }
    } catch (error) {
        console.error('Error fetching company details:', error);
    }
}

// Add this function to fetch and populate hotels
async function fetchAndPopulateHotels() {
    try {
        console.log('🏨 Fetching hotels data...');
        const response = await fetch("https://bni-data-backend.onrender.com/api/getHotels");
        const hotels = await response.json();
        console.log('📍 Fetched hotels:', hotels);

        const hotelDropdown = document.getElementById('hotel-dropdown');
        hotelDropdown.innerHTML = ''; // Clear existing options

        hotels.forEach(hotel => {
            // Only add active hotels
            if (hotel.is_active) {
                const venueText = `${hotel.hotel_name} - ${hotel.hotel_address}`;
                console.log('🏢 Adding hotel option:', venueText);

                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item" href="javascript:void(0);" 
                                 data-hotel-id="${hotel.hotel_id}"
                                 data-hotel-name="${hotel.hotel_name}"
                                 data-hotel-address="${hotel.hotel_address}">
                                 ${venueText}
                              </a>`;
                hotelDropdown.appendChild(li);
            }
        });

        // Add click handlers for the dropdown items
        hotelDropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                const venueInput = document.getElementById('training_venue');
                const selectedVenue = `${this.dataset.hotelName} - ${this.dataset.hotelAddress}`;
                console.log('🎯 Selected venue:', selectedVenue);
                
                venueInput.value = selectedVenue;
                venueInput.dataset.hotelId = this.dataset.hotelId;
            });
        });

    } catch (error) {
        console.error('❌ Error fetching hotels:', error);
    }
}

// Update the DOMContentLoaded event listener to include hotel population
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Page loaded, initializing...');
    fetchAndDisplayCompanyName();
    fetchAndPopulateHotels();
    
    // Initialize status options
    const dateInput = document.getElementById('training_date');
    if (dateInput.value) {
        updateStatusOptions(dateInput.value);
    } else {
        const trainingStatus = document.getElementById('training_status');
        trainingStatus.innerHTML = `
            <option value="">Select</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Postponed">Postponed</option>
            <option value="Completed">Completed</option>
        `;
    }
});

// Submit event listener
document.getElementById("submit-event").addEventListener("click", async () => {
    const training_name = document.getElementById("training_name").value.trim();
    const billing_company_field = document.getElementById("billing_company");
    const billing_company = billing_company_field.dataset.companyId || "1"; // Use stored ID or default to "1"
    const venueInput = document.getElementById("training_venue");
    
    // Get the hotel_id from the venue input's data attribute
    const hotel_id = venueInput.dataset.hotelId;

    // Rest of validation
    if (!training_name) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Training name is required!',
            confirmButtonText: 'OK',
        });
        return;
    }

    const data = {
        training_name: training_name,
        billing_company: billing_company,
        training_venue: hotel_id, // Send the hotel_id instead of venue name
        training_ticket_price: document.getElementById("training_ticket_price").value || null,
        training_date: document.getElementById("training_date").value.trim() || null,
        training_note: document.getElementById("training_note").value.trim() || null,
        training_published_by: document.getElementById("training_published_by").value.trim() || null,
        training_status: document.getElementById("training_status").value.trim() || null
    };

    console.log('📤 Submitting training data:', data);

    try {
        const response = await fetch("https://bni-data-backend.onrender.com/api/training", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
  
        const result = await response.json();
        console.log('API response:', result);

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: result.message,
                confirmButtonText: 'OK',
            });
            // Clear the form fields
            document.getElementById("training_name").value = "";
            document.getElementById("billing_company").value = "";
            document.getElementById("training_venue").value = "";
            document.getElementById("training_ticket_price").value = "";
            document.getElementById("training_date").value = "";
            document.getElementById("training_note").value = "";
            document.getElementById("training_published_by").value = "";
            document.getElementById("training_status").value = "";
            setTimeout(() => {
                window.location.href = '/tr/manage-trainings';  // Redirect to the trainings page
            }, 1200);
        } else {
            // Check specifically for duplicate training error
            if (response.status === 409) {
                Swal.fire({
                    icon: 'error',
                    title: 'Duplicate Training!',
                    text: 'Training with this name and date already exists.',
                    confirmButtonText: 'OK',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: result.message || 'Failed to add training. Please try again.',
                    confirmButtonText: 'Retry',
                });
            }
        }
    } catch (error) {
        console.error('Error details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred. Please try again.',
            confirmButtonText: 'Retry',
        });
    }
});