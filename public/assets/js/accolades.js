// API URL to fetch accolades data
const accoladesApiUrl = 'https://backend.bninewdelhi.com/api/accolades';
const searchInput = document.getElementById('searchAccolades');
const accoladesTableBody = document.querySelector('table tbody');

let currentSortColumn = null;
let isAscending = true;
let accoladesData = []; // Store the original data

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Function to update the total accolades count
function updateTotalAccoladesCount(accolades) {
    try {
        const totalStock = accolades.reduce((sum, accolade) => {
            const stockValue = parseInt(accolade.stock_available) || 0;
            return sum + stockValue;
        }, 0);

        const countElement = document.getElementById('total-accolades-count');
        if (countElement) {
            countElement.innerHTML = `<b>${totalStock}</b>`;
        }
    } catch (error) {
        console.error('Error calculating total stock:', error);
        const countElement = document.getElementById('total-accolades-count');
        if (countElement) {
            countElement.innerHTML = '<b>0</b>';
        }
    }
}

// Function to display accolades
function displayAccolades(accolades) {
    if (!accolades || accolades.length === 0) {
        accoladesTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 20px;">
                    <div style="font-size: 14px; color: #666;">
                        Currently, there are no accolades available.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    accoladesTableBody.innerHTML = '';
    accolades.forEach((accolade, index) => {
        const stockStatus = accolade.stock_available > 0 ? 'In Stock' : 'Out Of Stock';
        const stockStatusClass = accolade.stock_available > 0 ? 'bg-success-transparent' : 'bg-danger-transparent';
        
        const availabilityStatus = accolade.accolade_availability === 'available' ? 'Available' : 'Not Available';
        const availabilityClass = accolade.accolade_availability === 'available' ? 'bg-success-transparent' : 'bg-danger-transparent';
        
        const activeStatus = accolade.accolade_status === 'active' ? 'Active' : 'Inactive';
        const activeClass = accolade.accolade_status === 'active' ? 'bg-success-transparent' : 'bg-danger-transparent';

        const row = `
            <tr class="order-list">
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ms-2">
                            <p class="fw-semibold mb-0 d-flex align-items-center gap-2">
                                <a href="#">${accolade.accolade_name}</a>
                                <span class="badge rounded-pill ${accolade.accolade_type?.toLowerCase() === 'global' ? 'bg-primary-transparent' : 'bg-danger-transparent'}" 
                                      style="font-size: 11px; padding: 4px 8px; border-radius: 12px;">
                                    ${accolade.accolade_type || 'N/A'}
                                </span>
                            </p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ms-2">
                            <p class="fw-semibold mb-0 d-flex align-items-center">
                                <a href="#">₹${accolade.accolade_price || 'N/A'}</a>
                            </p>
                        </div>
                
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
        accoladesTableBody.innerHTML += row;
    });

    updateTotalAccoladesCount(accolades);
}

// Function to fetch and display accolades
async function fetchAndDisplayAccolades() {
    try {
        showLoader();
        const response = await fetch(accoladesApiUrl);
        if (!response.ok) throw new Error('Error fetching accolades data');

        accoladesData = await response.json();
        displayAccolades(accoladesData);
    } catch (error) {
        console.error('Error fetching accolades data:', error);
        accoladesTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-danger">Error fetching accolades data.</td>
            </tr>
        `;
    } finally {
        hideLoader();
    }
}

// Function to sort accolades
function sortAccolades(column) {
    console.log('🔄 Sorting by:', column);

    if (currentSortColumn === column) {
        isAscending = !isAscending;
    } else {
        currentSortColumn = column;
        isAscending = true;
    }

    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.classList.remove('asc');
        if (icon.dataset.sort === column && !isAscending) {
            icon.classList.add('asc');
        }
    });

    accoladesData.sort((a, b) => {
        let compareA, compareB;

        switch (column) {
            case 'name':
                compareA = a.accolade_name?.toLowerCase() || '';
                compareB = b.accolade_name?.toLowerCase() || '';
                break;
            case 'price':
                compareA = parseFloat(a.accolade_price) || 0;
                compareB = parseFloat(b.accolade_price) || 0;
                break;
            case 'publisher':
                compareA = a.accolade_published_by?.toLowerCase() || '';
                compareB = b.accolade_published_by?.toLowerCase() || '';
                break;
            case 'stock':
                compareA = parseInt(a.stock_available) || 0;
                compareB = parseInt(b.stock_available) || 0;
                break;
            case 'date':
                compareA = new Date(a.accolade_publish_date).getTime();
                compareB = new Date(b.accolade_publish_date).getTime();
                break;
            case 'itemType':
                compareA = a.item_type?.toLowerCase() || '';
                compareB = b.item_type?.toLowerCase() || '';
                break;
            case 'accoladeType':
                compareA = a.accolade_type?.toLowerCase() || '';
                compareB = b.accolade_type?.toLowerCase() || '';
                break;
            case 'availability':
                compareA = a.accolade_availability?.toLowerCase() || '';
                compareB = b.accolade_availability?.toLowerCase() || '';
                break;
            case 'status':
                compareA = a.accolade_status?.toLowerCase() || '';
                compareB = b.accolade_status?.toLowerCase() || '';
                break;
            default:
                return 0;
        }

        if (isAscending) {
            return compareA > compareB ? 1 : -1;
        } else {
            return compareA < compareB ? 1 : -1;
        }
    });

    console.log(`📊 Sorted data (${isAscending ? 'ascending' : 'descending'})`, accoladesData);
    displayAccolades(accoladesData);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sorting
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const column = e.target.dataset.sort;
            sortAccolades(column);
        });
    });

    // Initialize search
    searchInput.addEventListener('input', filterAccolades);

    // Initial load
    fetchAndDisplayAccolades();
});

// Function to filter accolades based on search query
function filterAccolades() {
    const query = searchInput.value.toLowerCase();
    const filteredAccolades = accoladesData.filter(accolade => 
        accolade.accolade_name?.toLowerCase().includes(query) ||
        accolade.accolade_published_by?.toLowerCase().includes(query)
    );
    displayAccolades(filteredAccolades);
}

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
          const response = await fetch(`https://backend.bninewdelhi.com/api/deleteAccolade/${accolade_id}`, {
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
