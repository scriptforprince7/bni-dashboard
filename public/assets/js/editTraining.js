const urlParams = new URLSearchParams(window.location.search);
const training_id = urlParams.get('training_id'); // Get the accolade ID from the URL

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex'; // Show loader
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById('loader').style.display = 'none'; // Hide loader
  }


// DOM elements for the form fields
const training_name = document.getElementById('training_name');
const training_venue = document.getElementById('training_venue');
const training_ticket_price = document.getElementById('training_ticket_price');
const training_date = document.getElementById('training_date');
const training_note = document.getElementById('training_note');
const training_published_by = document.getElementById('training_published_by');
const training_status = document.getElementById('training_status');

// Function to format date to YYYY-MM-DD for input[type="date"]
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return ''; // If the date is invalid, return an empty string
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

// Function to update status options based on date
function updateStatusOptions(selectedDate, currentStatus) {
    const trainingStatus = document.getElementById('training_status');
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
    
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(0, 0, 0, 0);

    // Clear existing options
    trainingStatus.innerHTML = '<option value="">Select</option>';

    if (selectedDateTime > currentDate) {
        // Future date - show Scheduled, Postponed, and Completed
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

    // Set the current status as selected
    if (currentStatus) {
        trainingStatus.value = currentStatus;
    }
}

// Add event listener to date input
document.getElementById('training_date').addEventListener('change', function(e) {
    const currentStatus = document.getElementById('training_status').value;
    updateStatusOptions(e.target.value, currentStatus);
});

// Function to fetch event details and populate the form
async function fetchTrainingDetails() {
  try {
    showLoader();
    const response = await fetch(`https://bni-data-backend.onrender.com/api/getTraining/${training_id}`);
    if (!response.ok) throw new Error('Failed to fetch event details');
    
    const trainingData = await response.json();

    // Populate the form fields with the fetched data
    training_name.value = trainingData.training_name || '';
    training_venue.value = trainingData.training_venue || '';
    training_ticket_price.value = trainingData.training_price || '';
    training_date.value = formatDateForInput(trainingData.training_date) || '';
    training_note.value = trainingData.training_note || '';
    training_published_by.value = trainingData.training_published_by || '';
    
    // Update status options based on the fetched date and set the current status
    updateStatusOptions(trainingData.training_date, trainingData.training_status);

  } catch (error) {
    console.error('Error fetching training details:', error);
  } finally {
    hideLoader();
  }
}

// Call the fetchTrainingDetails function on page load
window.addEventListener('load', fetchTrainingDetails);



// Function to collect form data and prepare it for the update
const collectFormData = () => {
    const trainingData = {
        training_name: document.querySelector("#training_name").value,
        training_venue: document.querySelector("#training_venue").value,
        training_price: document.querySelector("#training_ticket_price").value,
        training_date: document.querySelector("#training_date").value,
        training_note: document.querySelector("#training_note").value,
        training_published_by: document.querySelector("#training_published_by").value,
        training_status: document.querySelector("#training_status").value,
    };

    return trainingData;
};

// Function to send the updated data to the backend after confirmation
const updatetrainingData = async () => {
    // Ask for confirmation using SweetAlert
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to edit the training details!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
        const trainingData = collectFormData();
        console.log(trainingData); // Verify the data before sending it

        try {
            showLoader(); // Show the loader when sending data
            const response = await fetch(`https://bni-data-backend.onrender.com/api/updateTraining/${training_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trainingData),
            });

            if (response.ok) {
                const updatedEvent = await response.json();
                console.log('Training updated successfully:', updatedEvent);
                Swal.fire('Updated!', 'The Training details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/tr/manage-trainings';  // Redirect to the region page
                }, 1200);
            } else {
                const errorResponse = await response.json();
                console.error('Failed to update Training:', errorResponse);
                Swal.fire('Error!', `Failed to update Training: ${errorResponse.message}`, 'error');
            }
        } catch (error) {
            console.error('Error updating training:', error);
            Swal.fire('Error!', 'Failed to update training. Please try again.', 'error');
        } finally {
            hideLoader(); // Hide the loader once the request is complete
        }
    } else {
        console.log('Update canceled');
    }
};

document.getElementById("updateRegionBtn").addEventListener("click", updatetrainingData);
