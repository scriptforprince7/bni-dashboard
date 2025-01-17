// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.apiUrl = 'https://bni-data-backend.onrender.com/api/regions';

// Use window.BNI namespace for other global variables
window.BNI.state = {
    allRegions: [],
    allChapters: [],
    allMembers: [],
    filteredRegions: [],
    entriesPerPage: 10,
    currentPage: 1
};

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Fetch chapters and members
const fetchChaptersAndMembers = async () => {
    try {
        // Fetch chapters
        const chaptersResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
        if (!chaptersResponse.ok) throw new Error('Error fetching chapters data');
        window.BNI.state.allChapters = await chaptersResponse.json();

        // Fetch members
        const membersResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
        if (!membersResponse.ok) throw new Error('Error fetching members data');
        window.BNI.state.allMembers = await membersResponse.json();

        console.log('Chapters and Members data fetched successfully');
    } catch (error) {
        console.log("Error fetching chapters and members;",error)
    }
};

// Calculate the total number of chapters and members for a region
const getCountsForRegion = (regionId) => {
    const chaptersCount = window.BNI.state.allChapters.filter(chapter => chapter.region_id === regionId).length;
    const membersCount = window.BNI.state.allMembers.filter(member => member.region_id === regionId).length;
    return { chaptersCount, membersCount };
};

// Fetch regions with the applied filter
const fetchRegions = async (filter = '') => {
    try {
        const filterQuery = filter ? `?filter=${filter}` : '';
        const response = await fetch(`${window.BNI.apiUrl}${filterQuery}`);
        if (!response.ok) throw new Error('Network response was not ok');

        window.BNI.state.allRegions = await response.json();
        window.BNI.state.filteredRegions = [...window.BNI.state.allRegions];

        displayRegions(window.BNI.state.filteredRegions.slice(0, window.BNI.state.entriesPerPage));
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
            <td>${(window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage + index + 1}</td>
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
    window.BNI.state.filteredRegions = window.BNI.state.allRegions.filter(region => 
        region.region_name.toLowerCase().includes(searchValue)
    );

    // Display the filtered regions
    displayRegions(window.BNI.state.filteredRegions.slice(0, window.BNI.state.entriesPerPage)); // Display only the first entriesPerPage results
}

// Add event listener to the search input
document.getElementById('searchChapterInput').addEventListener('input', filterRegions);

// Initialize everything when the DOM is loaded
window.addEventListener('DOMContentLoaded', async () => {
    showLoader();
    try {
        await fetchChaptersAndMembers();
        await fetchRegions();
    } catch (error) {
        console.error('Error during initialization:', error);
    } finally {
        hideLoader();
    }
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