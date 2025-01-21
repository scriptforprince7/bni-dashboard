// DOM Elements
const trainingsTableBody = document.getElementById('chaptersTableBody');
const monthsDropdown = document.getElementById('month-filter');
const applyFilterBtn = document.getElementById('apply-filters-btn');
const resetFilterBtn = document.getElementById('reset-filters-btn');
const loader = document.getElementById('loader');
const trainingsApiUrl = 'https://bni-data-backend.onrender.com/api/allTrainings';
const searchInput = document.getElementById('searchAccolades');

let trainings = []; // Store all trainings
let selectedTrainingStatus = null;

// Loader functions
function showLoader() {
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    if (loader) {
        loader.style.display = 'none';
    }
}

// Populate months dropdown
function populateMonthsDropdown() {
    const months = [
        { value: 1, name: "January" },
        { value: 2, name: "February" },
        { value: 3, name: "March" },
        { value: 4, name: "April" },
        { value: 5, name: "May" },
        { value: 6, name: "June" },
        { value: 7, name: "July" },
        { value: 8, name: "August" },
        { value: 9, name: "September" },
        { value: 10, name: "October" },
        { value: 11, name: "November" },
        { value: 12, name: "December" }
    ];

    monthsDropdown.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-value="">Select Month</a></li>
        ${months.map(month => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${month.value}">${month.name}</a></li>
        `).join('')}
    `;

    // Add click listeners to dropdown items
    monthsDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const dropdownToggle = monthsDropdown.closest('.dropdown').querySelector('.dropdown-toggle');
            dropdownToggle.textContent = item.textContent;
            
            // Remove active class from all items and add to selected
            monthsDropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// Function to populate Training Status filter dropdown
function populateTrainingStatusFilter() {
    const statuses = ['Scheduled', 'Postponed', 'Cancelled', 'Completed'];
    const statusFilter = document.getElementById('trainings-status-filter');
    statusFilter.innerHTML = ''; // Clear existing options

    statuses.forEach(status => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-status="${status}">
                ${status}
            </a>
        `;
        statusFilter.appendChild(li);
    });
}

// Add click event listener for status filter items
document.getElementById('trainings-status-filter').addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-item')) {
        selectedTrainingStatus = e.target.dataset.status;
        console.log('Selected Status:', selectedTrainingStatus); // Debug log
        
        // Update dropdown button text
        const dropdownButton = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
        dropdownButton.textContent = selectedTrainingStatus;
    }
});

// Update the apply filter button click handler
applyFilterBtn.addEventListener('click', () => {
    console.log('Applying filters...'); // Debug log
    console.log('Status:', selectedTrainingStatus); // Debug log
    
    const selectedMonth = monthsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value');
    let filteredTrainings = [...trainings]; // Create a copy of trainings array

    // Filter by month if selected
    if (selectedMonth) {
        filteredTrainings = filteredTrainings.filter(training => {
            const trainingDate = new Date(training.training_date);
            const trainingMonth = trainingDate.getMonth() + 1;
            return trainingMonth === parseInt(selectedMonth);
        });
    }

    // Filter by status if selected
    if (selectedTrainingStatus) {
        filteredTrainings = filteredTrainings.filter(training => {
            return training.training_status === selectedTrainingStatus;
        });
    }

    renderTrainings(filteredTrainings);
});

// Update reset filter button handler
resetFilterBtn.addEventListener('click', () => {
    // Reset training status filter
    selectedTrainingStatus = null;
    const statusDropdown = document.querySelector('[data-bs-toggle="dropdown"]');
    statusDropdown.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Training Status';
    
    // Reset month filter
    const dropdownToggle = monthsDropdown.closest('.dropdown').querySelector('.dropdown-toggle');
    dropdownToggle.textContent = 'Month';
    monthsDropdown.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));
    
    // Show all trainings
    renderTrainings(trainings);
});

// Add this function for search functionality
function searchTrainings(searchTerm) {
    const filteredTrainings = trainings.filter(training => {
        // Convert both search term and training data to lowercase for case-insensitive search
        searchTerm = searchTerm.toLowerCase();
        const trainingName = training.training_name.toLowerCase();
        const trainingVenue = (training.training_venue || '').toLowerCase();
        const trainingStatus = training.training_status.toLowerCase();

        // Return true if search term is found in any of these fields
        return trainingName.includes(searchTerm) || 
               trainingVenue.includes(searchTerm) || 
               trainingStatus.includes(searchTerm);
    });

    renderTrainings(filteredTrainings);
}

// Add real-time search event listener
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm === '') {
        // If search box is empty, show all trainings
        renderTrainings(trainings);
    } else {
        // Filter trainings based on search term
        searchTrainings(searchTerm);
    }
});

// Render trainings to table
function renderTrainings(trainingsToShow) {
    trainingsTableBody.innerHTML = '';

    if (trainingsToShow.length === 0) {
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">No trainings found matching your search.</td>
            </tr>`;
        return;
    }

    trainingsToShow.forEach((training, index) => {
        trainingsTableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <a href="/tr/view-training?training_id=${training.training_id}"><b>${training.training_name}</b></a>
                </td>
                <td>${training.training_venue || 'N/A'}</td>
                <td><b>${new Date(training.training_date).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })}</b></td>
                <td><b>${training.registrations_count || '0'}</b></td>
                <td class="text-center"><b>${training.training_price}</b></td>
                <td>
                    <span class="badge bg-${getBadgeClass(training.training_status)}">${training.training_status}</span>
                </td>
                <td>
                    <span class="badge bg-primary">
                        <a href="/tr/edit-training/?training_id=${training.training_id}" style="color:white">Edit</a>
                    </span>
                </td>
            </tr>`;
    });

    // Update total count
    const totalCount = document.querySelector('.btn-white span b');
    if (totalCount) {
        totalCount.textContent = trainingsToShow.length;
    }
}

// Helper function for badge colors
function getBadgeClass(status) {
    const statusMap = {
        'Scheduled': 'warning',
        'Completed': 'success',
        'Postponed': 'info',
        'Cancelled': 'danger'
    };
    return statusMap[status] || 'secondary';
}

// Fetch and display trainings on page load
async function fetchAndDisplayTrainings() {
    try {
        showLoader();
        const response = await fetch(trainingsApiUrl);
        if (!response.ok) throw new Error('Failed to fetch trainings');
        
        trainings = await response.json();
        renderTrainings(trainings);
        populateMonthsDropdown();
        populateTrainingStatusFilter();
    } catch (error) {
        console.error('Error:', error);
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">Error loading trainings. Please try again.</td>
            </tr>`;
    } finally {
        hideLoader();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTrainings();
    populateMonthsDropdown();
    populateTrainingStatusFilter();
});



