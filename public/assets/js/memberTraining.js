const trainingsApiUrl = 'https://bni-data-backend.onrender.com/api/allTrainings';
const trainingsTableBody = document.querySelector('table tbody');
const paginationContainer = document.querySelector('.pagination');
let trainings = []; // To store all fetched events
const trainingPerPage = 15; // Number of events per page
let currentPage = 1; // Current active page

const trainingsDropdown = document.getElementById("trainings-status-filter");

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Function to populate a dropdown
const populateDropdown = (
    dropdown,
    data,
    valueField,
    textField,
    defaultText
  ) => {
    // Clear the dropdown
    dropdown.innerHTML = "";
  
    // Add a default option
    dropdown.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="">
            ${defaultText}
          </a>
        </li>
      `;
  
    // Add options dynamically
    data.forEach((item) => {
      dropdown.innerHTML += `
            <li>
              <a class="dropdown-item" href="javascript:void(0);" data-value="${item[valueField]}">
                ${item[textField]}
              </a>
            </li>
          `;
    });
  
    // Attach event listeners
    attachDropdownListeners(dropdown);
  };
  
  
  // Function to attach event listeners to dropdown items
  const attachDropdownListeners = (dropdown) => {
    const dropdownToggle = dropdown
      .closest(".dropdown")
      .querySelector(".dropdown-toggle");
  
    dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        dropdown.querySelectorAll(".dropdown-item.active").forEach((activeItem) => {
          activeItem.classList.remove("active");
        });
  
        item.classList.add("active");
        const selectedValue = item.getAttribute("data-value");
        const selectedText = item.textContent.trim();
  
        if (dropdownToggle) {
          dropdownToggle.textContent = selectedText;
        }
  
        console.log(`Selected Value from ${dropdown.id}:`, selectedValue);
      });
    });
  };

  // Populate chapter type dropdown
const populateTrainingsStatusDropdown = async () => {
    try {
      showLoader();
      // Fetch event data
      const response = await fetch(trainingsApiUrl);
      if (!response.ok) throw new Error("Error fetching events");
  
      const trainings = await response.json(); // Assume the API returns an array of event objects
  
      // Extract unique event
      const uniqueTypes = [
        ...new Set(trainings.map((training) => training.training_status)),
      ];
  
      // Clear existing options
      trainingsDropdown.innerHTML = "";
  
      // Populate dropdown with unique chapter types
      uniqueTypes.forEach((type) => {
        trainingsDropdown.innerHTML += `<li>
                  <a class="dropdown-item" href="javascript:void(0);" data-value="${type.toUpperCase()}">
                      ${type}
                  </a>
              </li>`;
      });
  
      // Attach listeners after populating
      attachDropdownListeners(trainingsDropdown);
    } catch (error) {
      console.error("Error populating chapter type dropdown:", error);
    } finally {
      hideLoader();
    }
  };
  // Call the function to populate the chapter type dropdown
  populateTrainingsStatusDropdown();

  // Function to check if there are any filters in the query parameters
function checkFiltersAndToggleResetButton() {
    const urlParams = new URLSearchParams(window.location.search);
  
    // Check if any query parameters exist (indicating filters are applied)
    if (urlParams.toString()) {
      // Show the Reset Filter button if filters are applied
      document.getElementById("reset-filters-btn").style.display = "inline-block";
    } else {
      // Hide the Reset Filter button if no filters are applied
      document.getElementById("reset-filters-btn").style.display = "none";
    }
  }
  
  // Call this function on page load to check the filters
  window.addEventListener("load", checkFiltersAndToggleResetButton);
  
  // Update the dropdown text and mark the item as active
  const updateDropdownText = (dropdown, selectedValue) => {
    const selectedItem = dropdown.querySelector(`.dropdown-item[data-value="${selectedValue}"]`);
    const dropdownToggle = dropdown.closest('.dropdown').querySelector('.dropdown-toggle');
  
    if (selectedItem && dropdownToggle) {
      console.log(`Updating dropdown: ${dropdown.id}, selectedValue: ${selectedValue}`);  // Debugging line
      dropdownToggle.textContent = selectedItem.textContent.trim();
  
      dropdown.querySelectorAll('.dropdown-item').forEach((item) => {
        item.classList.remove('active');
      });
      selectedItem.classList.add('active');
    }
  };

  // Attach event listener to a "Filter" button or trigger
document.getElementById("apply-filters-btn").addEventListener("click", () => {
    const trainingID = trainingsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
    const queryParams = new URLSearchParams();
  
    if (trainingID) queryParams.append('training_status', trainingID);
  
    const filterUrl = `/tr/manage-trainings?${queryParams.toString()}`;
    window.location.href = filterUrl;
  });


  // On page load, check for any applied filters in the URL params
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
  
    // Get the filter values from URL params
    const trainingID = urlParams.get("event_status");
  
    // Update the dropdowns with the selected filter values
    if (trainingID) updateDropdownText(trainingsDropdown, trainingID);
  
    checkFiltersAndToggleResetButton();
  });


  // Attach event listener to "Reset Filter" button to clear query params
document.getElementById("reset-filters-btn").addEventListener("click", () => {
    // Clear all query parameters from the URL
    const url = new URL(window.location);
    url.search = ''; // Remove query parameters
  
    // Reload the page without filters (cleared query string)
    window.location.href = url.toString();
  });
  
  // Check for filters on page load
  checkFiltersAndToggleResetButton();

// Function to render the current page of events
function renderPage(page) {
    const startIndex = (page - 1) * trainingPerPage;
    const endIndex = startIndex + trainingPerPage;
    const pageData = trainings.slice(startIndex, endIndex);

    trainingsTableBody.innerHTML = ''; // Clear the table

    if (pageData.length === 0) {
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">No data available.</td>
            </tr>`;
        return;
    }

    pageData.forEach((training, index) => {
        let availabilityStatus, badgeClass;
    
        // Determine availability status and corresponding badge class
        switch (training.training_status) {
            case 'Scheduled':
                availabilityStatus = 'Scheduled';
                badgeClass = 'warning'; // Yellow
                break;
            case 'Completed':
                availabilityStatus = 'Completed';
                badgeClass = 'success'; // Green
                break;
            case 'Postponed':
                availabilityStatus = 'Postponed';
                badgeClass = 'info'; // Blue or any other color
                break;
            case 'Cancelled':
                availabilityStatus = 'Cancelled';
                badgeClass = 'danger'; // Red
                break;
            default:
                availabilityStatus = 'unknown';
                badgeClass = 'secondary'; // Grey
        }
    
        trainingsTableBody.innerHTML += `
            <tr class="order-list">
                <td>${startIndex + index + 1}</td>
                <td>
                  <a href="#"><b>${training.training_name}</b></a>  
                </td>
                <td>${training.training_venue || 'N/A'}</td>
                <td><b>${new Date(training.training_date).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              }) || 'N/A'}</b></td>
                <td class="text-center"><b>${training.training_price}</b></td>
                
                <td>
                    <span class="badge bg-${badgeClass}">${availabilityStatus}</span>
                </td>
                <td>
    <span class="badge bg-${(training.training_status || '').toLowerCase() === 'scheduled' || (training.training_status || '').toLowerCase() === 'postponed' ? 'success' : 'danger'}">
      ${(training.training_status || '').toLowerCase() === 'scheduled' || (training.training_status || '').toLowerCase() === 'postponed' 
        ? `<a href="https://bninewdelhi.com/training-payments/3/bdbe4592-738e-42b1-ad02-beea957a3f9d/1" style="color: white; text-decoration: none;">Register Now</a>` 
        : 'Registration Closed'}
    </span>
</td>



            </tr>`;
    });
    
}

// Function to render pagination controls
function renderPagination() {
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(trainings.length / trainingPerPage);

    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    paginationContainer.innerHTML += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>`;

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationContainer.innerHTML += `
            <li class="page-item ${activeClass}">
                <a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
            </li>`;
    }

    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    paginationContainer.innerHTML += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage + 1})">Next</a>
        </li>`;
}

// Function to change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(trainings.length / trainingPerPage)) return;

    currentPage = page;
    renderPage(currentPage);
    renderPagination();
}

// Function to fetch trainings data
async function fetchAndDisplaytrainings() {
    try {
        showLoader();

        const response = await fetch(trainingsApiUrl);
        if (!response.ok) throw new Error('Error fetching trainings data');

        trainings = await response.json();

        // Apply filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {
        trainingID: urlParams.get("event_status"),
    };

    console.log("Filters from URL params:", filters);

    // Filter chapters based on the filters
    trainings = trainings.filter((event) => {
        return (
            (!filters.trainingID || event.event_status.toLowerCase() === filters.trainingID.toLowerCase())
        );
      });
  
        currentPage = 1; // Reset to first page after fetching new data
        renderPage(currentPage);
        renderPagination();
    } catch (error) {
        console.error('Error fetching trainings data:', error);
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">Error fetching trainings data.</td>
            </tr>`;
    } finally {
        hideLoader();
    }
}

// Load trainings data on page load
window.addEventListener('load', fetchAndDisplaytrainings);

const deleteTraining = async (training_id) => {
    // Show confirmation using SweetAlert
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This action will mark the training as deleted.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel'
    });
  
    if (result.isConfirmed) {
        try {
            showLoader();  // Show loading indicator
            const response = await fetch(`https://bni-data-backend.onrender.com/api/deleteTraining/${training_id}`, {
                method: 'PUT',
            });
  
            if (response.ok) {
                const data = await response.json();
                Swal.fire('Deleted!', data.message, 'success');
                // After deletion, remove the training from the table
                document.querySelector(`[data-training-id="${training_id}"]`).closest('tr').remove();
            } else {
                const errorResponse = await response.json();
                Swal.fire('Failed!', errorResponse.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting training:', error);
            Swal.fire('Error!', 'Failed to delete training. Please try again.', 'error');
        } finally {
            hideLoader();  // Hide loading indicator
        }
    }
  };
  
  // Add event listener for delete buttons dynamically
  document.getElementById('chaptersTableBody').addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-btn')) {
      const training_id = event.target.getAttribute('data-training-id');
      deleteTraining(training_id);
    }
  });



