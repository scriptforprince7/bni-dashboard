const trainingsApiUrl = 'https://bni-data-backend.onrender.com/api/allTrainings';
const trainingsTableBody = document.querySelector('table tbody');
const paginationContainer = document.querySelector('.pagination');
let trainings = []; // To store all fetched events
const trainingPerPage = 15; // Number of events per page
let currentPage = 1; // Current active page

const trainingsDropdown = document.getElementById("trainings-status-filter");
const monthDropdown = document.getElementById("month-filter");

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
        const response = await fetch(trainingsApiUrl);
        if (!response.ok) throw new Error("Error fetching trainings");

        const trainings = await response.json();

        // Extract unique training statuses
        const uniqueTypes = [
            ...new Set(trainings.map((training) => training.training_status)),
        ];

        // Clear existing options
        trainingsDropdown.innerHTML = "";

        // Add default "All" option
        trainingsDropdown.innerHTML = `
            <li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="">
                    All Trainings
                </a>
            </li>`;

        // Add status options
        uniqueTypes.forEach((type) => {
            if (type) {  // Only add if status is not null/empty
                trainingsDropdown.innerHTML += `
                    <li>
                        <a class="dropdown-item" href="javascript:void(0);" data-value="${type}">
                            ${type}
                        </a>
                    </li>`;
            }
        });

        attachDropdownListeners(trainingsDropdown);
    } catch (error) {
        console.error("Error populating training status dropdown:", error);
    } finally {
        hideLoader();
    }
};

// Function to populate month dropdown
const populateMonthDropdown = () => {
    const months = [
        { value: '', text: 'All Months' },
        { value: '01', text: 'January' },
        { value: '02', text: 'February' },
        { value: '03', text: 'March' },
        { value: '04', text: 'April' },
        { value: '05', text: 'May' },
        { value: '06', text: 'June' },
        { value: '07', text: 'July' },
        { value: '08', text: 'August' },
        { value: '09', text: 'September' },
        { value: '10', text: 'October' },
        { value: '11', text: 'November' },
        { value: '12', text: 'December' }
    ];

    monthDropdown.innerHTML = `
        <li><a class="dropdown-item active" href="javascript:void(0);" data-value="">All Months</a></li>
        ${months.slice(1).map(month => 
            `<li><a class="dropdown-item" href="javascript:void(0);" data-value="${month.value}">${month.text}</a></li>`
        ).join('')}
    `;

    attachDropdownListeners(monthDropdown);
};

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
    fetchAndDisplaytrainings();
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

// Function to fetch and filter trainings
async function fetchAndDisplaytrainings() {
    try {
        showLoader();
        const response = await fetch(trainingsApiUrl);
        if (!response.ok) throw new Error('Error fetching trainings data');

        trainings = await response.json();

        // Get selected status and month from dropdowns
        const selectedStatus = trainingsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value');
        const selectedMonth = monthDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value');
        
        // Filter trainings based on status and month
        if (selectedStatus || selectedMonth) {
            trainings = trainings.filter(training => {
                const matchesStatus = !selectedStatus || training.training_status === selectedStatus;
                const matchesMonth = !selectedMonth || (training.training_date && 
                    training.training_date.substring(5, 7) === selectedMonth);
                return matchesStatus && matchesMonth;
            });
        }

        currentPage = 1;
        renderPage(currentPage);
        renderPagination();
    } catch (error) {
        console.error('Error:', error);
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">Error fetching trainings data.</td>
            </tr>`;
    } finally {
        hideLoader();
    }
}

// Call these functions when page loads
document.addEventListener('DOMContentLoaded', () => {
    populateTrainingsStatusDropdown();
    populateMonthDropdown();
    fetchAndDisplaytrainings();
});

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

// Update reset filters function
function resetFilters() {
    // Reset both dropdowns selection to default
    [trainingsDropdown, monthDropdown].forEach(dropdown => {
        const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-value') === '') {
                item.classList.add('active');
            }
        });
    });

    // Reset dropdown toggle texts
    const statusToggle = trainingsDropdown.closest('.dropdown').querySelector('.dropdown-toggle');
    const monthToggle = monthDropdown.closest('.dropdown').querySelector('.dropdown-toggle');
    
    if (statusToggle) statusToggle.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Training Status';
    if (monthToggle) monthToggle.innerHTML = '<i class="ti ti-calendar me-1"></i> Month';

    // Fetch all trainings again
    fetchAndDisplaytrainings();
}



