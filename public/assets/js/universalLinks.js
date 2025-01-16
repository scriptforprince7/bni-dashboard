let apiUrl = 'https://bni-data-backend.onrender.com/api/universalLinks';
let allLinks = []; // To store fetched links globally
let filteredLinks = []; // To store filtered links based on search
let paymentGateways = []; // To store fetched payment gateways globally
let entriesPerPage = 10; // Number of entries to display per page
let currentPage = 1; // For pagination

// Show loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex';
}

// Hide loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Fetch the API URL from the backend
async function fetchApiUrl() {
  try {
    const response = await fetch('https://bni-data-backend.onrender.com/api/universalLinks');
    const data = await response.json();
    apiUrl = data.apiUrl;
    await fetchLinks(); // Fetch links using the API URL
  } catch (error) {
    console.error('Error fetching the API URL:', error);
  }
}

// Function to fetch payment gateways
async function fetchPaymentGateways() {
  try {
    const response = await fetch('https://bni-data-backend.onrender.com/api/paymentGateway');
    if (!response.ok) throw new Error('Network response was not ok');
    paymentGateways = await response.json();
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
  }
}

// Function to fetch links data
async function fetchLinks() {
  try {
    const response = await fetch('https://bni-data-backend.onrender.com/api/universalLinks');
    if (!response.ok) throw new Error('Network response was not ok');
    
    allLinks = await response.json(); // Store fetched links globally
    filteredLinks = [...allLinks]; // Initialize filtered links to all links
    displayLinks(filteredLinks.slice(0, entriesPerPage)); // Display first page of links
  } catch (error) {
    console.error('There was a problem fetching the links data:', error);
  }
}

// Function to display links in the table
function displayLinks(regions) {
  const tableBody = document.getElementById('chaptersTableBody');
  tableBody.innerHTML = ''; // Clear existing rows

  regions.forEach((region, index) => {
    const paymentGateway = paymentGateways.find(pg => pg.gateway_id.toString() === region.payment_gateway.toString());
    const paymentGatewayName = paymentGateway ? paymentGateway.gateway_name : 'N/A';

    const row = document.createElement('tr');
    row.classList.add('order-list');
    row.innerHTML = `
      <td>${(currentPage - 1) * entriesPerPage + index + 1}</td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <b>${region.universal_link_name}</b>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <b>${region.ulid || 'N/A'}</b>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <b>${region.link_slug || 'N/A'}</b>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <em><u>${paymentGatewayName}</u></em>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        <span class="badge bg-${region.status === 'active' ? 'success' : 'danger'}">
          ${region.status}
        </span>
      </td>
      <td style="border: 1px solid grey">
        <span class="badge bg-primary text-light" style="cursor:pointer; color:white;">
           <a href="/u/edit-universal-link/?id=${region.id}" style="color:white">Edit</a>
        </span>
        <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-id="${region.id}">
     Delete
    </span>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  hideLoader(); // Hide loader after displaying all data
}

// Function to filter links based on search input
function filterRegions() {
  const searchValue = document.getElementById('searchChapterInput').value.toLowerCase();
  filteredLinks = allLinks.filter(region => region.universal_link_name.toLowerCase().includes(searchValue));
  displayLinks(filteredLinks.slice(0, entriesPerPage));
}

// Add event listener to the search input
document.getElementById('searchChapterInput').addEventListener('input', filterRegions);

// Call fetch functions on page load
window.addEventListener('DOMContentLoaded', async () => {
  showLoader(); // Show loader immediately on page load
  try {
    await fetchPaymentGateways(); // Fetch payment gateways first
    await fetchApiUrl(); // Then fetch the API URL and links data
  } catch (error) {
    console.error('Error loading data on page load:', error);
  } finally {
    hideLoader(); // Ensure loader hides if an error occurs
  }
});

const deleteUniversalLink = async (id) => {
  // Show confirmation using SweetAlert
  const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This action will mark the universal link as deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
  });

  if (result.isConfirmed) {
      try {
          showLoader();  // Show loading indicator
          const response = await fetch(`https://bni-data-backend.onrender.com/api/deleteUniversalLink/${id}`, {
              method: 'PUT',
          });

          if (response.ok) {
              const data = await response.json();
              Swal.fire('Deleted!', data.message, 'success');
              // After deletion, remove the region from the table
              document.querySelector(`[data-id="${id}"]`).closest('tr').remove();
          } else {
              const errorResponse = await response.json();
              Swal.fire('Failed!', errorResponse.message, 'error');
          }
      } catch (error) {
          console.error('Error deleting universal link:', error);
          Swal.fire('Error!', 'Failed to delete universal link. Please try again.', 'error');
      } finally {
          hideLoader();  // Hide loading indicator
      }
  }
};

// Add event listener for delete buttons dynamically
document.getElementById('chaptersTableBody').addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const id = event.target.getAttribute('data-id');
    deleteUniversalLink(id);
  }
});
