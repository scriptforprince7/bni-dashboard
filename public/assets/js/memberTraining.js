const trainingsApiUrl = 'https://bni-data-backend.onrender.com/api/allTrainings';
const trainingsTableBody = document.querySelector('table tbody');
const paginationContainer = document.querySelector('.pagination');
let trainings = []; // To store all fetched events
const trainingPerPage = 15; // Number of events per page
let currentPage = 1; // Current active page
let filteredTrainings = [];
let selectedStatus = '';
let searchQuery = '';

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

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
        ? `<a href="<%= base_url %>/training-payments/3/bdbe4592-738e-42b1-ad02-beea957a3f9d/1" style="color: white; text-decoration: none;">Register Now</a>` 
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

// Main function to fetch and display trainings
async function fetchAndDisplaytrainings() {
    try {
        showLoader();
        const response = await fetch(trainingsApiUrl);
        if (!response.ok) throw new Error('Error fetching trainings data');

        trainings = await response.json();
        filteredTrainings = [...trainings];
        currentPage = 1;
        renderFilteredPage(currentPage);
        renderFilteredPagination();
        populateStatusFilter();
        setupFilterButtons();
        setupSearch();
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

// Populate the status filter dropdown
function populateStatusFilter() {
    const statusFilter = document.getElementById('trainings-status-filter');
    const statuses = ['Scheduled', 'Completed', 'Postponed', 'Cancelled'];
    
    statusFilter.innerHTML = statuses.map(status => `
        <li>
            <a class="dropdown-item" href="javascript:void(0)" data-status="${status}">
                ${status}
            </a>
        </li>
    `).join('');

    // Add click event listeners to status options
    statusFilter.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            selectedStatus = e.target.dataset.status;
            // Update dropdown button text
            const dropdownButton = document.querySelector('.dropdown-toggle');
            dropdownButton.textContent = selectedStatus || 'Training Status';
        });
    });
}

// Add event listeners for filter buttons
function setupFilterButtons() {
    document.getElementById('apply-filters-btn').addEventListener('click', filterTrainings);

    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        selectedStatus = '';
        searchQuery = '';
        document.getElementById('searchAccolades').value = '';
        const dropdownButton = document.querySelector('.dropdown-toggle');
        dropdownButton.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Training Status';
        filteredTrainings = [...trainings];
        currentPage = 1;
        renderFilteredPage(currentPage);
        renderFilteredPagination();
    });
}

// Modified render function to work with filtered data
function renderFilteredPage(page) {
    const dataToRender = filteredTrainings.length > 0 ? filteredTrainings : trainings;
    const startIndex = (page - 1) * trainingPerPage;
    const endIndex = startIndex + trainingPerPage;
    const pageData = dataToRender.slice(startIndex, endIndex);

    trainingsTableBody.innerHTML = '';

    if (pageData.length === 0) {
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">No data available.</td>
            </tr>`;
        return;
    }

    pageData.forEach((training, index) => {
        let availabilityStatus, badgeClass;
    
        switch (training.training_status) {
            case 'Scheduled':
                availabilityStatus = 'Scheduled';
                badgeClass = 'warning';
                break;
            case 'Completed':
                availabilityStatus = 'Completed';
                badgeClass = 'success';
                break;
            case 'Postponed':
                availabilityStatus = 'Postponed';
                badgeClass = 'info';
                break;
            case 'Cancelled':
                availabilityStatus = 'Cancelled';
                badgeClass = 'danger';
                break;
            default:
                availabilityStatus = 'unknown';
                badgeClass = 'secondary';
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
                            ? `<a href="<%= base_url %>/training-payments/3/bdbe4592-738e-42b1-ad02-beea957a3f9d/1" style="color: white; text-decoration: none;">Register Now</a>` 
                            : 'Registration Closed'}
                    </span>
                </td>
            </tr>`;
    });
}

// Modified pagination for filtered results
function renderFilteredPagination() {
    const dataToRender = filteredTrainings.length > 0 ? filteredTrainings : trainings;
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(dataToRender.length / trainingPerPage);

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

// Modified changePage function
function changePage(page) {
    const dataToRender = filteredTrainings.length > 0 ? filteredTrainings : trainings;
    if (page < 1 || page > Math.ceil(dataToRender.length / trainingPerPage)) return;
    currentPage = page;
    renderFilteredPage(currentPage);
    renderFilteredPagination();
}

// Add search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchAccolades');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterTrainings();
    });
}

// Modified filter function to handle both search and status filters
function filterTrainings() {
    filteredTrainings = trainings.filter(training => {
        const matchesSearch = searchQuery === '' || 
            training.training_name.toLowerCase().includes(searchQuery) ||
            training.training_venue.toLowerCase().includes(searchQuery) ||
            training.training_price.toString().toLowerCase().includes(searchQuery) ||
            training.training_status.toLowerCase().includes(searchQuery);

        const matchesStatus = !selectedStatus || training.training_status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    currentPage = 1;
    renderFilteredPage(currentPage);
    renderFilteredPagination();
}



