const trainingsApiUrl = 'https://backend.bninewdelhi.com/api/allTrainings';
const trainingsTableBody = document.querySelector('table tbody');
const paginationContainer = document.querySelector('.pagination');
let trainings = []; // To store all fetched events
const trainingPerPage = 15; // Number of events per page
let currentPage = 1; // Current active page
let filteredTrainings = [];
let selectedStatus = '';
let searchQuery = '';
let hotels = [];

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Function to render the current page of events
async function renderPage(page) {
    const startIndex = (page - 1) * trainingPerPage;
    const endIndex = startIndex + trainingPerPage;
    const pageData = trainings.slice(startIndex, endIndex);

    trainingsTableBody.innerHTML = '';

    if (pageData.length === 0) {
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">No data available.</td>
            </tr>`;
        return;
    }

    for (const [index, training] of pageData.entries()) {
        const isRegistered = await checkRegistrationStatus(training);
        console.log('Registration status for training:', training.training_id, isRegistered);

        console.log('Processing training:', training);
        console.log('Training venue ID:', training.training_venue);
        
        // Find matching hotel
        const matchingHotel = hotels.find(hotel => {
            console.log('Comparing hotel_id:', hotel.hotel_id, 'with venue:', parseInt(training.training_venue));
            return hotel.hotel_id === parseInt(training.training_venue);
        });
        
        console.log('Matching hotel found:', matchingHotel);

        const venueDisplay = matchingHotel ? 
            `${matchingHotel.hotel_name}, ${matchingHotel.hotel_address}` : 
            training.training_venue || 'N/A';
            
        console.log('Final venue display:', venueDisplay);

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
                <td><b>${venueDisplay}</b></td>
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
                    ${isRegistered ? 
                        `<span class="badge bg-secondary" style="opacity: 0.7;">Already Registered ✓</span>` :
                        `<span class="badge bg-${(training.training_status || '').toLowerCase() === 'scheduled' || (training.training_status || '').toLowerCase() === 'postponed' ? 'success' : 'danger'}">
                            ${(training.training_status || '').toLowerCase() === 'scheduled' || (training.training_status || '').toLowerCase() === 'postponed' 
                                ? `<a href="javascript:void(0)" onclick="handleRegistration(${training.training_id})" style="color: white; text-decoration: none;">Register Now</a>` 
                                : 'Registration Closed'}
                        </span>`
                    }
                </td>
            </tr>`;
    }
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
        // Fetch hotels first
        await fetchHotels();
        
        const response = await fetch(trainingsApiUrl);
        if (!response.ok) throw new Error('Error fetching trainings data');

        trainings = await response.json();
        filteredTrainings = [...trainings];
        currentPage = 1;
        await renderPage(currentPage);
        renderPagination();
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
            const response = await fetch(`https://backend.bninewdelhi.com/api/deleteTraining/${training_id}`, {
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
        console.log('Processing training:', training);
        console.log('Training venue ID:', training.training_venue);
        
        // Find matching hotel
        const matchingHotel = hotels.find(hotel => {
            console.log('Comparing hotel_id:', hotel.hotel_id, 'with venue:', parseInt(training.training_venue));
            return hotel.hotel_id === parseInt(training.training_venue);
        });
        
        console.log('Matching hotel found:', matchingHotel);

        const venueDisplay = matchingHotel ? 
            `${matchingHotel.hotel_name}, ${matchingHotel.hotel_address}` : 
            training.training_venue || 'N/A';
            
        console.log('Final venue display:', venueDisplay);

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
                <td><b>${venueDisplay}</b></td>
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
                            ? `<a href="javascript:void(0)" onclick="handleRegistration(${training.training_id})" style="color: white; text-decoration: none;">Register Now</a>` 
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

// Add this function to fetch hotels
async function fetchHotels() {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/getHotels');
        if (!response.ok) throw new Error('Failed to fetch hotels');
        hotels = await response.json();
        console.log('Hotels fetched successfully:', hotels);
        return hotels;
    } catch (error) {
        console.error('Error fetching hotels:', error);
        return [];
    }
}

// Add this new function
async function checkRegistrationStatus(training) {
    try {
        let userEmail;
        const loginType = getUserLoginType();
        
        // Determine which email to use
        if (loginType === 'ro_admin') {
            userEmail = localStorage.getItem('current_member_email');
            console.log('RO Admin checking for member email:', userEmail);
        } else {
            userEmail = getUserEmail();
            console.log('Regular member email:', userEmail);
        }

        if (!userEmail) {
            console.log('No email found to check registration');
            return false;
        }

        // Get member details
        const memberResponse = await fetch('https://backend.bninewdelhi.com/api/members');
        const members = await memberResponse.json();
        console.log('Fetched all members:', members);

        const member = members.find(m => m.member_email_address === userEmail);
        console.log('Found member:', member);

        if (!member) {
            console.log('No member found for email:', userEmail);
            return false;
        }

        // Get orders
        const ordersResponse = await fetch('https://backend.bninewdelhi.com/api/allOrders');
        const orders = await ordersResponse.json();
        console.log('Fetched all orders:', orders);

        const memberOrder = orders.find(order => 
            order.customer_id === member.member_id && 
            order.training_id === training.training_id
        );
        console.log('Found member order:', memberOrder);

        if (!memberOrder) {
            console.log('No order found for member:', member.member_id);
            return false;
        }

        // Get transactions
        const transactionsResponse = await fetch('https://backend.bninewdelhi.com/api/allTransactions');
        const transactions = await transactionsResponse.json();
        console.log('Fetched all transactions:', transactions);

        const successTransaction = transactions.find(t => 
            t.order_id === memberOrder.order_id && 
            t.payment_status === 'SUCCESS'
        );
        console.log('Found success transaction:', successTransaction);

        return !!successTransaction;
    } catch (error) {
        console.error('Error checking registration:', error);
        return false;
    }
}

// Add this new function to create registration link
async function createRegistrationLink(training_id) {
    try {
        const loginType = getUserLoginType();
        let memberEmail, memberId;

        if (loginType === 'ro_admin') {
            // For RO Admin, get member details from localStorage
            memberEmail = localStorage.getItem('current_member_email');
            memberId = localStorage.getItem('current_member_id');
        } else {
            // For regular members, get email from token
            memberEmail = getUserEmail();
        }

        if (!memberEmail) {
            console.error('No member email found');
            return null;
        }

        // Fetch members data
        const response = await fetch('https://backend.bninewdelhi.com/api/members');
        const members = await response.json();
        
        // Find the member with matching email
        const member = members.find(m => m.member_email_address === memberEmail);
        if (!member) {
            console.error('Member not found');
            return null;
        }

        // Create the registration link with all required parameters
        const baseUrl = 'https://bninewdelhi.com/training-payments/3/bdbe4592-738e-42b1-ad02-beea957a3f9d/1';
        return `${baseUrl}?region_id=${member.region_id}&chapter_id=${member.chapter_id}&member_id=${member.member_id}&training_id=${training_id}`;
    } catch (error) {
        console.error('Error creating registration link:', error);
        return null;
    }
}

// Add this new function to handle registration click
async function handleRegistration(training_id) {
    const registrationLink = await createRegistrationLink(training_id);
    if (registrationLink) {
        window.location.href = registrationLink;
    } else {
        alert('Unable to create registration link. Please try again later.');
    }
}



