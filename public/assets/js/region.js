let apiUrl = 'https://bni-data-backend.onrender.com/api/regions'; // Default value
let allRegions = []; // To store fetched regions globally
let allChapters = []; // To store all chapters
let allMembers = []; // To store all members
let filteredRegions = []; // To store filtered regions based on search
let entriesPerPage = 10; // Number of entries to display per page
let currentPage = 1; // For pagination

// Function to show the loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex'; // Show loader
}

// Function to hide the loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none'; // Hide loader
}

// Fetch the API URL from the backend
async function fetchApiUrl() {
  try {
    const response = await fetch('https://bni-data-backend.onrender.com/api/regions'); // Call the backend to get the API URL
    const data = await response.json();
    apiUrl = data.apiUrl || apiUrl; // Update apiUrl if provided in the response
    console.log('API URL fetched from backend:', apiUrl);
  } catch (error) {
    console.error('Error fetching the API URL:', error);
  }
}

// Fetch chapters and members
const fetchChaptersAndMembers = async () => {
  try {
    // Fetch chapters
    const chaptersResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
    if (!chaptersResponse.ok) throw new Error('Error fetching chapters data');
    allChapters = await chaptersResponse.json();

    // Fetch members
    const membersResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
    if (!membersResponse.ok) throw new Error('Error fetching members data');
    allMembers = await membersResponse.json();

    console.log('Chapters and Members data fetched successfully');
  } catch (error) {
    console.error('Error fetching chapters and members:', error);
  }
};

// Calculate the total number of chapters and members for a region
const getCountsForRegion = (regionId) => {
  const chaptersCount = allChapters.filter(chapter => chapter.region_id === regionId).length;
  const membersCount = allMembers.filter(member => member.region_id === regionId).length;
  return { chaptersCount, membersCount };
};


// Fetch regions with the applied filter
const fetchRegions = async (filter = '') => {
  try {
    const filterQuery = filter ?  `?filter=${filter}` : ''; // Append filter to URL
    const response = await fetch(`${apiUrl}${filterQuery}`); // Make the request with the filter
    if (!response.ok) throw new Error('Network response was not ok');

    allRegions = await response.json(); // Store fetched regions in the global variable
    filteredRegions = [...allRegions]; // Initialize filtered regions to all regions initially

    // Display the filtered regions in the table
    displayRegions(filteredRegions.slice(0, entriesPerPage)); // Display only the first 10 entries
  } catch (error) {
    console.error('There was a problem fetching the regions data:', error);
  }
};

// Add event listener for filter options
document.querySelectorAll('.filter-option').forEach((filterItem) => {
  filterItem.addEventListener('click', (event) => {
    const filter = event.target.getAttribute('data-filter'); // Get filter value from clicked item
    fetchRegions(filter); // Fetch regions with selected filter
    updateURLWithFilter(filter); // Update URL to reflect the applied filter
  });
});

// Function to update the URL with the selected filter
function updateURLWithFilter(filter) {
  const url = new URL(window.location); // Get the current page URL
  url.searchParams.set('filter', filter); // Set or update the 'filter' query parameter
  window.history.pushState({}, '', url); // Update the browser's URL without reloading the page
}




// Function to display regions in the table
function displayRegions(regions) {
  const tableBody = document.getElementById('chaptersTableBody');

  // Clear existing rows
  tableBody.innerHTML = '';

  // Loop through the regions and create table rows
  regions.forEach((region, index) => {
    const { chaptersCount, membersCount } = getCountsForRegion(region.region_id);
    const row = document.createElement('tr');
    row.classList.add('order-list');

    // Add table cells with region data
    row.innerHTML = `
      <td>${(currentPage - 1) * entriesPerPage + index + 1}</td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
         <a href="/r/view-region/?region_id=${region.region_id}"> <b>${region.region_name}</b></a>
        </div>
      </td>
      <td style="border: 1px solid grey;"><b>${chaptersCount}</b></td>
      <td style="border: 1px solid grey;"><b>${membersCount}</b></td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <b>${region.contact_number || 'N/A'}</b>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        <span class="badge bg-${region.region_status === 'active' ? 'success' : 'danger'}">
          ${region.region_status}
        </span>
      </td>
        <td style="border: 1px solid grey">
        <span class="badge bg-primary text-light" style="cursor:pointer; color:white;">
           <a href="/r/edit-region/?region_id=${region.region_id}" style="color:white">Edit</a>
        </span>
        <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-region-id="${region.region_id}">
     Delete
    </span>
      </td>
    `;

    // Append the row to the table body
    tableBody.appendChild(row);
  });

  // Hide the loader after the regions are displayed
  hideLoader();
}

// Function to filter regions based on search input
function filterRegions() {
  const searchValue = document.getElementById('searchChapterInput').value.toLowerCase();

  // Filter regions based on the search value
  filteredRegions = allRegions.filter(region => 
    region.region_name.toLowerCase().includes(searchValue)
  );

  // Display the filtered regions
  displayRegions(filteredRegions.slice(0, entriesPerPage)); // Display only the first entriesPerPage results
}

// Add event listener to the search input
document.getElementById('searchChapterInput').addEventListener('input', filterRegions);

window.addEventListener('DOMContentLoaded', async () => {
  showLoader(); // Show loader immediately on page load
  await fetchApiUrl();
  await fetchChaptersAndMembers(); // Fetch chapters and members
  await fetchRegions(); // Fetch regions with updated data
});


const deleteRegion = async (region_id) => {
  // Show confirmation using SweetAlert
  const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This action will mark the region as deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
  });

  if (result.isConfirmed) {
      try {
          showLoader();  // Show loading indicator
          const response = await fetch(`https://bni-data-backend.onrender.com/api/deleteRegion/${region_id}`, {
              method: 'PUT',
          });

          if (response.ok) {
              const data = await response.json();
              Swal.fire('Deleted!', data.message, 'success');
              // After deletion, remove the region from the table
              document.querySelector(`[data-region-id="${region_id}"]`).closest('tr').remove();
          } else {
              const errorResponse = await response.json();
              Swal.fire('Failed!', errorResponse.message, 'error');
          }
      } catch (error) {
          console.error('Error deleting region:', error);
          Swal.fire('Error!', 'Failed to delete region. Please try again.', 'error');
      } finally {
          hideLoader();  // Hide loading indicator
      }
  }
};

// Add event listener for delete buttons dynamically
document.getElementById('chaptersTableBody').addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const region_id = event.target.getAttribute('data-region-id');
    deleteRegion(region_id);
  }
});