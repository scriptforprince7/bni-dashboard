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

// Call the function when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing company name fetch...');
    fetchAndDisplayCompanyName();
    
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
    console.log('Using billing company ID for submission:', billing_company);

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
        billing_company: billing_company, // Using the ID value
        training_venue: document.getElementById("training_venue").value.trim() || null,
        training_ticket_price: document.getElementById("training_ticket_price").value || null,
        training_date: document.getElementById("training_date").value.trim() || null,
        training_note: document.getElementById("training_note").value.trim() || null,
        training_published_by: document.getElementById("training_published_by").value.trim() || null,
        training_status: document.getElementById("training_status").value.trim() || null,
    };

    console.log('Submitting training data:', data);

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