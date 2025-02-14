// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.apiUrl = 'https://bni-data-backend.onrender.com/api/regions';
let total_regions =0;
let active_total =0;
let chapter_total = 0;
let member_total = 0;
// Use window.BNI namespace for other global variables
window.BNI.state = {
    allRegions: [],
    allChapters: [],
    allMembers: [],
    filteredRegions: [],
    entriesPerPage: 10,
    currentPage: 1,
    totalPages: 0
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

// Add a function to calculate totals
function calculateTotals(allRegions) {
    console.log('=== Calculating Totals ===');
    
    // Reset totals
    total_regions = allRegions.length;
    active_total = allRegions.filter(region => region.region_status === 'active').length;
    
    // Calculate chapter and member totals
    chapter_total = 0;
    member_total = 0;
    
    allRegions.forEach(region => {
        const { chaptersCount, membersCount } = getCountsForRegion(region.region_id);
        chapter_total += chaptersCount;
        member_total += membersCount;
    });

    console.log('Totals calculated:', {
        total_regions,
        active_total,
        chapter_total,
        member_total
    });

    updateTotalDisplays();
}

// Function to update the display of totals
function updateTotalDisplays() {
    console.log('=== Updating Total Displays ===');
    
    document.getElementById("totalRegions").innerHTML = total_regions;
    document.getElementById("activeTotal").innerHTML = active_total;
    document.getElementById("inactiveTotal").innerHTML = total_regions - active_total;
    document.getElementById("chapterTotal").innerHTML = chapter_total;
    document.getElementById("memberTotal").innerHTML = member_total;
    
    console.log('Displays updated with values:', {
        total_regions,
        active_total,
        inactive_total: total_regions - active_total,
        chapter_total,
        member_total
    });
}

// Fetch regions with the applied filter
const fetchRegions = async (filter = '') => {
    try {
        console.log('=== Fetching Regions ===');
        const filterQuery = filter ? `?filter=${filter}` : '';
        const response = await fetch(`${window.BNI.apiUrl}${filterQuery}`);
        if (!response.ok) throw new Error('Network response was not ok');

        window.BNI.state.allRegions = await response.json();
        window.BNI.state.filteredRegions = [...window.BNI.state.allRegions];

        // Calculate totals once when data is fetched
        calculateTotals(window.BNI.state.allRegions);

        console.log(`Fetched ${window.BNI.state.allRegions.length} regions`);
        
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
    console.log('=== Displaying Regions ===');
    console.log(`Displaying ${regions.length} regions for current page`);
    
    const tableBody = document.getElementById('chaptersTableBody');
    tableBody.innerHTML = '';

    regions.forEach((region, index) => {
        const { chaptersCount, membersCount } = getCountsForRegion(region.region_id);
        const row = document.createElement('tr');
        row.classList.add('order-list');
        total_regions= total_regions +1;
        if(region.region_status === 'active' ){
            active_total= active_total +1;
        }
        chapter_total = parseFloat(chapter_total)+ (chaptersCount);
        member_total = parseFloat(member_total) + (membersCount) ;

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

    // Don't recalculate totals here, just update pagination
    updatePagination();
}

// Function to filter regions based on search input
function filterRegions() {
    console.log('=== Filtering Regions ===');
    const searchValue = document.getElementById('searchChapterInput').value.toLowerCase();
    
    window.BNI.state.filteredRegions = window.BNI.state.allRegions.filter(region => 
        region.region_name.toLowerCase().includes(searchValue)
    );

    // Recalculate totals for filtered regions
    calculateTotals(window.BNI.state.filteredRegions);
    
    console.log(`Found ${window.BNI.state.filteredRegions.length} matching regions`);
    
    window.BNI.state.currentPage = 1;
    changePage(1);
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

// Add this function to calculate and display pagination
function updatePagination() {
    console.log('=== Updating Pagination ===');
    const totalItems = window.BNI.state.filteredRegions.length;
    window.BNI.state.totalPages = Math.ceil(totalItems / window.BNI.state.entriesPerPage);
    
    console.log('Pagination Details:', {
        totalItems,
        entriesPerPage: window.BNI.state.entriesPerPage,
        totalPages: window.BNI.state.totalPages,
        currentPage: window.BNI.state.currentPage
    });

    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';

    // Previous button
    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${window.BNI.state.currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = '<a class="page-link" href="javascript:void(0)">Previous</a>';
    prevButton.onclick = () => {
        if (window.BNI.state.currentPage > 1) {
            changePage(window.BNI.state.currentPage - 1);
        }
    };
    paginationContainer.appendChild(prevButton);

    // Page numbers
    for (let i = 1; i <= window.BNI.state.totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === window.BNI.state.currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="javascript:void(0)">${i}</a>`;
        pageItem.onclick = () => changePage(i);
        paginationContainer.appendChild(pageItem);
    }

    // Next button
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${window.BNI.state.currentPage === window.BNI.state.totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = '<a class="page-link" href="javascript:void(0)">Next</a>';
    nextButton.onclick = () => {
        if (window.BNI.state.currentPage < window.BNI.state.totalPages) {
            changePage(window.BNI.state.currentPage + 1);
        }
    };
    paginationContainer.appendChild(nextButton);

    // Update showing entries text
    const start = (window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage + 1;
    const end = Math.min(start + window.BNI.state.entriesPerPage - 1, totalItems);
    document.querySelector('.mb-2.mb-sm-0').innerHTML = 
        `Showing <b>${start}</b> to <b>${end}</b> of <b>${totalItems}</b> entries`;
}

// Function to change page
function changePage(pageNumber) {
    console.log('=== Changing Page ===');
    console.log('Changing to page:', pageNumber);
    
    window.BNI.state.currentPage = pageNumber;
    
    const startIndex = (pageNumber - 1) * window.BNI.state.entriesPerPage;
    const endIndex = startIndex + window.BNI.state.entriesPerPage;
    
    console.log('Page Change Details:', {
        startIndex,
        endIndex,
        totalItems: window.BNI.state.filteredRegions.length
    });

    const pageData = window.BNI.state.filteredRegions.slice(startIndex, endIndex);
    console.log(`Displaying ${pageData.length} items for page ${pageNumber}`);

    displayRegions(pageData);
    updatePagination();
}