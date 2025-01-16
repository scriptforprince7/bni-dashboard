const urlParams = new URLSearchParams(window.location.search);
const event_id = urlParams.get('event_id'); // Get the accolade ID from the URL

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex'; // Show loader
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById('loader').style.display = 'none'; // Hide loader
  }


// DOM elements for the form fields
const event_name = document.getElementById('event_name');
const event_venue = document.getElementById('event_venue');
const event_ticket_price = document.getElementById('event_ticket_price');
const event_date = document.getElementById('event_date');
const event_status = document.getElementById('event_status');

// Function to format date to YYYY-MM-DD for input[type="date"]
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return ''; // If the date is invalid, return an empty string
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

// Function to fetch event details and populate the form
async function fetchEventDetails() {
  try {
    showLoader();
    const response = await fetch(`https://bni-data-backend.onrender.com/api/getEvent/${event_id}`);
    if (!response.ok) throw new Error('Failed to fetch event details');
    
    const eventData = await response.json();

    // Populate the form fields with the fetched data
    event_name.value = eventData.event_name || '';
    event_venue.value = eventData.event_venue || '';
    event_ticket_price.value = eventData.event_price || '';
    event_date.value = formatDateForInput(eventData.event_date) || '';
    
    // Set the "availability" dropdown
    event_status.value = eventData.event_status || '';

  } catch (error) {
    console.error('Error fetching event details:', error);
  } finally {
    hideLoader();
  }
}

// Call the fetchEventDetails function on page load
window.addEventListener('load', fetchEventDetails);



// Function to collect form data and prepare it for the update
const collectFormData = () => {
    const eventData = {
        event_name: document.querySelector("#event_name").value,
        event_venue: document.querySelector("#event_venue").value,
        event_price: document.querySelector("#event_ticket_price").value,
        event_date: document.querySelector("#event_date").value,
        event_status: document.querySelector("#event_status").value,
    };

    return eventData;
};

// Function to send the updated data to the backend after confirmation
const updateeventData = async () => {
    // Ask for confirmation using SweetAlert
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to edit the event details!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
        const eventData = collectFormData();
        console.log(eventData); // Verify the data before sending it

        try {
            showLoader(); // Show the loader when sending data
            const response = await fetch(`https://bni-data-backend.onrender.com/api/updateEvent/${event_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                const updatedEvent = await response.json();
                console.log('Event updated successfully:', updatedEvent);
                Swal.fire('Updated!', 'The Event details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/e/manage-events';  // Redirect to the region page
                }, 1200);
            } else {
                const errorResponse = await response.json();
                console.error('Failed to update event:', errorResponse);
                Swal.fire('Error!', `Failed to update event: ${errorResponse.message}`, 'error');
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

document.getElementById("updateRegionBtn").addEventListener("click", updateeventData);
