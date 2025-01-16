// API URL to fetch accolades data
const accoladesApiUrl = 'https://bni-data-backend.onrender.com/api/accolades';
const searchInput = document.getElementById('searchAccolades');

// DOM element to populate the accolades table
const accoladesTableBody = document.querySelector('table tbody');

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex'; // Show loader
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById('loader').style.display = 'none'; // Hide loader
  }

// Function to fetch and display accolades
async function fetchAndDisplayAccolades() {
  try {
    showLoader();

    // Fetch accolades data from the API
    const response = await fetch(accoladesApiUrl);
    if (!response.ok) throw new Error('Error fetching accolades data');

    const accolades = await response.json();

    // Clear the table body
    accoladesTableBody.innerHTML = '';

    // Loop through accolades and populate the table
    accolades.forEach((accolade, index) => {
      const stockStatus = accolade.stock_available > 0 ? 'In Stock' : 'Out Of Stock';
      const stockStatusClass = accolade.stock_available > 0 ? 'bg-success-transparent' : 'bg-danger-transparent';
      
      // Check availability and status
      const availabilityStatus = accolade.accolade_availability === 'available' ? 'Available' : 'Not Available';
      const availabilityClass = accolade.accolade_availability === 'available' ? 'bg-success-transparent' : 'bg-danger-transparent';
      
      const activeStatus = accolade.accolade_status === 'active' ? 'Active' : 'Inactive';
      const activeClass = accolade.accolade_status === 'active' ? 'bg-success-transparent' : 'bg-danger-transparent';

      accoladesTableBody.innerHTML += `
        <tr class="order-list">
          <td>${index + 1}</td>
          <td>
            <div class="d-flex align-items-center">
              <div class="ms-2">
                <p class="fw-semibold mb-0 d-flex align-items-center">
                  <a href="#">${accolade.accolade_name}</a>
                </p>
              </div>
            </div>
          </td>
          <td>
            <div class="d-flex align-items-center">
              <div class="ms-2">
                <p class="fw-semibold mb-0 d-flex align-items-center">
                  <a href="#">${accolade.accolade_published_by || 'N/A'}</a>
                </p>
              </div>
            </div>
          </td>
          <td class="text-center">${accolade.stock_available}</td>
          <td class="fw-semibold">${new Date(accolade.accolade_publish_date).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) || 'N/A'}</td>
          <td>
            <div class="d-flex align-items-center">
              <div class="ms-2">
                <p class="fw-semibold mb-0 d-flex align-items-center">
                  <a href="#">${accolade.item_type || 'N/A'}</a>
                </p>
              </div>
            </div>
          </td>
          <td>
            <div class="d-flex align-items-center">
              <div class="ms-2">
                <p class="fw-semibold mb-0 d-flex align-items-center">
                  <a href="#">${accolade.accolade_type || 'N/A'}</a>
                </p>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${availabilityClass}">${availabilityStatus}</span>
          </td>
          <td>
            <span class="badge ${activeClass}">${activeStatus}</span>
          </td>
          <td>
            <span class="badge bg-primary text-light" style="cursor:pointer; color:white;">
              <a href="/acc/edit-accolades/?accolade_id=${accolade.accolade_id}" style="color:white">Edit</a>
            </span>
            <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-accolade-id="${accolade.accolade_id}">
              Delete
            </span>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error('Error fetching accolades data:', error);
    accoladesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">Error fetching accolades data.</td>
      </tr>
    `;
  } finally {
    hideLoader();
  }
}



// Function to filter accolades based on search query
function filterAccolades() {
    const query = searchInput.value.toLowerCase(); // Get the search query in lowercase
    const rows = accoladesTableBody.querySelectorAll('tr'); // Select all rows in the table
  
    rows.forEach((row) => {
      const accoladeName = row.querySelector('td:nth-child(2) a')?.textContent.toLowerCase(); // Get the accolade name text
      const publishedBy = row.querySelector('td:nth-child(3) a')?.textContent.toLowerCase(); // Get the published by text
  
      // Check if either accolade name or published by matches the search query
      if (accoladeName?.includes(query) || publishedBy?.includes(query)) {
        row.style.display = ''; // Show the row if it matches
      } else {
        row.style.display = 'none'; // Hide the row if it doesn't match
      }
    });
  }

  searchInput.addEventListener('input', filterAccolades);

// Call the function on page load
window.addEventListener('load', fetchAndDisplayAccolades);


const deleteAccolade = async (accolade_id) => {
  // Show confirmation using SweetAlert
  const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This action will mark the accolade as deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
  });

  if (result.isConfirmed) {
      try {
          showLoader();  // Show loading indicator
          const response = await fetch(`https://bni-data-backend.onrender.com/api/deleteAccolade/${accolade_id}`, {
              method: 'PUT',
          });

          if (response.ok) {
              const data = await response.json();
              Swal.fire('Deleted!', data.message, 'success');
              // After deletion, remove the accolade from the table
              document.querySelector(`[data-accolade-id="${accolade_id}"]`).closest('tr').remove();
          } else {
              const errorResponse = await response.json();
              Swal.fire('Failed!', errorResponse.message, 'error');
          }
      } catch (error) {
          console.error('Error deleting accolade:', error);
          Swal.fire('Error!', 'Failed to delete accolade. Please try again.', 'error');
      } finally {
          hideLoader();  // Hide loading indicator
      }
  }
};

// Add event listener for delete buttons dynamically
document.getElementById('chaptersTableBody').addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const accolade_id = event.target.getAttribute('data-accolade-id');
    deleteAccolade(accolade_id);
  }
});
