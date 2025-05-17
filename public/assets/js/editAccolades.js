const urlParams = new URLSearchParams(window.location.search);
const accoladeId = urlParams.get('accolade_id'); // Get the accolade ID from the URL

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex'; // Show loader
}
  
// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none'; // Hide loader
}

// DOM elements for the form fields
const accoladeNameInput = document.getElementById('accolade_name');
const accoladePublishedByInput = document.getElementById('accolade_publish_by');
const stockAvailableInput = document.getElementById('stock_available');
const stockInDateInput = document.getElementById('stock_in_date');
const stockAvailabilitySelect = document.getElementById('stock_availability');
const stockStatusSelect = document.getElementById('stock_status');
const itemType = document.getElementById('item_type');
const accoladeType = document.getElementById('accolade_type');
const termCondition = document.getElementById('ec');
const accoladePriceInput = document.getElementById('accolade_price'); // Price input element

// Function to format date to YYYY-MM-DD for input[type="date"]
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return ''; // If the date is invalid, return an empty string
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// Function to fetch accolade details and populate the form
async function fetchAccoladeDetails() {
    try {
        showLoader();
        const response = await fetch(`http://localhost:5000/api/getAccolade/${accoladeId}`);
        if (!response.ok) throw new Error('Failed to fetch accolade details');
        
        const accoladeData = await response.json();

        // Populate the form fields with the fetched data
        accoladeNameInput.value = accoladeData.accolade_name || '';
        accoladePublishedByInput.value = accoladeData.accolade_published_by || '';
        stockAvailableInput.value = accoladeData.stock_available || '';
        stockInDateInput.value = formatDateForInput(accoladeData.accolade_publish_date) || '';
        stockAvailabilitySelect.value = accoladeData.accolade_availability || '';
        stockStatusSelect.value = accoladeData.accolade_status || '';
        itemType.value = accoladeData.item_type || '';
        accoladeType.value = accoladeData.accolade_type || '';
        termCondition.value = accoladeData.eligibility_and_condition || '';
        
        // Set the price value, ensuring it's formatted correctly
        accoladePriceInput.value = accoladeData.accolade_price ? parseFloat(accoladeData.accolade_price).toFixed(2) : '';

    } catch (error) {
        console.error('Error fetching accolade details:', error);
        Swal.fire('Error!', 'Failed to fetch accolade details. Please try again.', 'error');
    } finally {
        hideLoader();
    }
}

// Function to collect form data and prepare it for the update
const collectFormData = () => {
    const accoladeData = {
        accolade_name: document.querySelector("#accolade_name").value,
        accolade_publish_by: document.querySelector("#accolade_publish_by").value,
        stock_available: document.querySelector("#stock_available").value,
        stock_in_date: document.querySelector("#stock_in_date").value,
        stock_availability: document.querySelector("#stock_availability").value,
        stock_status: document.querySelector("#stock_status").value,
        item_type: document.querySelector("#item_type").value,
        accolade_type: document.querySelector("#accolade_type").value,
        eligibility_and_condition: document.querySelector("#ec").value,
        accolade_price: parseFloat(document.querySelector("#accolade_price").value || 0).toFixed(2) // Ensure price is formatted correctly
    };

    return accoladeData;
};

// Function to validate the form data
const validateFormData = (data) => {
    if (!data.accolade_price || isNaN(data.accolade_price)) {
        Swal.fire('Error!', 'Please enter a valid price.', 'error');
        return false;
    }
    // Add other validations as needed
    return true;
};

// Function to send the updated data to the backend after confirmation
const updateAccoladeData = async () => {
    // Ask for confirmation using SweetAlert
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to edit the accolade details!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
        const accoladeData = collectFormData();
        
        // Validate the form data
        if (!validateFormData(accoladeData)) {
            return;
        }

        console.log('Updating accolade with data:', accoladeData); // Debug log

        try {
            showLoader();
            const response = await fetch(`http://localhost:5000/api/updateAccolade/${accoladeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(accoladeData),
            });

            if (response.ok) {
                const updatedAccolade = await response.json();
                console.log('Accolade updated successfully:', updatedAccolade);
                Swal.fire('Updated!', 'The Accolade details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/acc/manage-accolades';
                }, 1200);
            } else {
                const errorResponse = await response.json();
                console.error('Failed to update accolade:', errorResponse);
                Swal.fire('Error!', `Failed to update accolade: ${errorResponse.message}`, 'error');
            }
        } catch (error) {
            console.error('Error updating accolade:', error);
            Swal.fire('Error!', 'Failed to update accolade. Please try again.', 'error');
        } finally {
            hideLoader();
        }
    } else {
        console.log('Update canceled');
    }
};

// Event listeners
document.getElementById("updateRegionBtn").addEventListener("click", updateAccoladeData);
window.addEventListener('load', fetchAccoladeDetails);

// Add this function to handle price formatting
function formatPrice(input) {
    if (input.value) {
        input.value = parseFloat(input.value).toFixed(2);
    }
}

// Update the price input event listener to allow direct entry
accoladePriceInput.addEventListener('input', (e) => {
    // Remove the previous event listener that was formatting on every input
    // Now it will only format when the input loses focus or when enter is pressed
});

// Format the price when the input loses focus
accoladePriceInput.addEventListener('blur', (e) => {
    if (e.target.value) {
        e.target.value = parseFloat(e.target.value).toFixed(2);
    }
});
