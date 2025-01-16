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
    const response = await fetch(`https://bni-data-backend.onrender.com/api/getAccolade/${accoladeId}`);
    if (!response.ok) throw new Error('Failed to fetch accolade details');
    
    const accoladeData = await response.json();

    // Populate the form fields with the fetched data
    accoladeNameInput.value = accoladeData.accolade_name || '';
    accoladePublishedByInput.value = accoladeData.accolade_published_by || '';
    stockAvailableInput.value = accoladeData.stock_available || '';
    stockInDateInput.value = formatDateForInput(accoladeData.accolade_publish_date) || '';
    
    // Set the "availability" dropdown
    stockAvailabilitySelect.value = accoladeData.accolade_availability || '';
    
    // Set the "status" dropdown
    stockStatusSelect.value = accoladeData.accolade_status || '';

    itemType.value = accoladeData.item_type || '';

    accoladeType.value = accoladeData.accolade_type || '';

    termCondition.value = accoladeData.eligibility_and_condition || '';

  } catch (error) {
    console.error('Error fetching accolade details:', error);
  } finally {
    hideLoader();
  }
}

// Call the fetchAccoladeDetails function on page load
window.addEventListener('load', fetchAccoladeDetails);



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
    };

    return accoladeData;
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
        console.log(accoladeData); // Verify the data before sending it

        try {
            showLoader(); // Show the loader when sending data
            const response = await fetch(`https://bni-data-backend.onrender.com/api/updateAccolade/${accoladeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(accoladeData),
            });

            if (response.ok) {
                const updatedAccolade = await response.json();
                console.log('Universal Link updated successfully:', updatedAccolade);
                Swal.fire('Updated!', 'The Accolade details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/acc/manage-accolades';  // Redirect to the region page
                }, 1200);
            } else {
                const errorResponse = await response.json();
                console.error('Failed to update accolde:', errorResponse);
                Swal.fire('Error!', `Failed to update accolde: ${errorResponse.message}`, 'error');
            }
        } catch (error) {
            console.error('Error updating accolade:', error);
            Swal.fire('Error!', 'Failed to update accolade. Please try again.', 'error');
        } finally {
            hideLoader(); // Hide the loader once the request is complete
        }
    } else {
        console.log('Update canceled');
    }
};

document.getElementById("updateRegionBtn").addEventListener("click", updateAccoladeData);
