// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.apiUrl = 'http://localhost:5000/api/regions';
const API_BASE_URL = 'http://localhost:5000/api';
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
    totalPages: 0,
    showingAllEntries: false
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
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        // Fetch chapters
        const chaptersResponse = await fetch(`${API_BASE_URL}/chapters`, fetchOptions);
        if (!chaptersResponse.ok) {
            throw new Error(`Chapters fetch failed: ${chaptersResponse.status}`);
        }
        window.BNI.state.allChapters = await chaptersResponse.json();

        // Fetch members
        const membersResponse = await fetch(`${API_BASE_URL}/members`, fetchOptions);
        if (!membersResponse.ok) {
            throw new Error(`Members fetch failed: ${membersResponse.status}`);
        }
        window.BNI.state.allMembers = await membersResponse.json();

        console.log('✅ Chapters and Members data fetched successfully');
    } catch (error) {
        console.error("Error fetching chapters and members:", error);
        // Show error to user
        if (error.message.includes('Failed to fetch')) {
            console.error("API server might be down or network issue");
        }
        hideLoader(); // Hide loader on error
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
    chapter_total = window.BNI.state.allChapters.length; // Count all chapters regardless of status
    member_total = window.BNI.state.allMembers.length;
    
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

        // Get current sort order if any
        const activeSortOption = document.querySelector('.sort-option.active');
        if (activeSortOption) {
            const currentSort = activeSortOption.getAttribute('data-sort');
            sortRegions(currentSort);
        }

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
    console.log(`Displaying ${regions.length} regions`);
    
    const tableBody = document.getElementById('chaptersTableBody');
    tableBody.innerHTML = '';

    regions.forEach((region, index) => {
        const { chaptersCount, membersCount } = getCountsForRegion(region.region_id);
        const row = document.createElement('tr');
        row.classList.add('order-list');

        // Update the index to show actual position whether showing all or paginated
        const displayIndex = window.BNI.state.showingAllEntries ? 
            index + 1 : 
            (window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage + index + 1;

        row.innerHTML = `
            <td>${displayIndex}</td>
            <td style="border: 1px solid grey;">
                <div class="d-flex align-items-center">
                    <b>${region.region_name}</b>
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
                <span class="badge bg-info text-light" style="cursor:pointer; color:white; margin-right: 4px;">
                    <a href="/r/view-region/?region_id=${region.region_id}" style="color:white">View</a>
                </span>
                <span class="badge bg-primary text-light" style="cursor:pointer; color:white; margin-right: 4px;">
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

    // Don't update pagination if showing all entries
    if (!window.BNI.state.showingAllEntries) {
        updatePagination();
    }
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
    console.log('=== Starting Region Status Check ===');
    console.log('Checking region ID:', region_id);

    // Get the region's row and its data
    const regionRow = document.querySelector(`[data-region-id="${region_id}"]`).closest('tr');
    
    // Get chapters and members count directly from the table row
    const chaptersCount = parseInt(regionRow.querySelector('td:nth-child(3)').textContent);
    const membersCount = parseInt(regionRow.querySelector('td:nth-child(4)').textContent);
    const regionName = regionRow.querySelector('td:nth-child(2)').textContent.trim();

    console.log('Region details from table:', {
        regionName,
        chaptersCount,
        membersCount
    });

    // If region has chapters or members, show warning
    if (chaptersCount > 0 || membersCount > 0) {
        console.log(`Cannot delete region: ${regionName} has ${chaptersCount} chapters and ${membersCount} members`);
        
        const result = await Swal.fire({
            title: 'Cannot Delete Region',
            text: `This region has ${chaptersCount} chapters and ${membersCount} members. Would you like to mark it as inactive instead?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, mark as inactive',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            console.log('User confirmed to mark region as inactive');
            showLoader();
            
            try {
                // First get the current region data
                console.log('Fetching current region data...');
                const getResponse = await fetch(`http://localhost:5000/api/getRegion/${region_id}`);
                const regionData = await getResponse.json();
                console.log('Current region data:', regionData);

                // Prepare update data
                const updateData = {
                    ...regionData,
                    region_status: 'inactive'
                };
                console.log('Prepared update data:', updateData);

                // Update the region via API
                console.log('Sending update request...');
                const updateResponse = await fetch(`http://localhost:5000/api/updateRegion/${region_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update region status');
                }

                const updatedData = await updateResponse.json();
                console.log('Region update response:', updatedData);

                hideLoader();

                // Update UI
                const statusBadge = regionRow.querySelector('td:nth-child(6) .badge');
                statusBadge.classList.remove('bg-success');
                statusBadge.classList.add('bg-danger');
                statusBadge.textContent = 'inactive';
                
                // Update counts
                active_total--;
                document.getElementById("activeTotal").innerHTML = active_total;
                document.getElementById("inactiveTotal").innerHTML = total_regions - active_total;
                
                console.log('Updated counts:', {
                    active_total,
                    inactive_total: total_regions - active_total
                });

                await Swal.fire('Updated!', `${regionName} has been marked as inactive`, 'success');
            } catch (error) {
                console.error('Error updating region status:', error);
                hideLoader();
                await Swal.fire('Error!', 'Failed to update region status. Please try again.', 'error');
            }
        }
    } else {
        console.log(`Region ${regionName} has no chapters or members. Proceeding with deletion...`);
        
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `This will delete the region: ${regionName}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel'
        });

        if (result.isConfirmed) {
            try {
                showLoader();
                const response = await fetch(`http://localhost:5000/api/deleteRegion/${region_id}`, {
                    method: 'PUT',
                });

                if (response.ok) {
                    const data = await response.json();
                    hideLoader();
                    await Swal.fire('Deleted!', data.message, 'success');
                    console.log('Region deleted successfully');
                    await fetchChaptersAndMembers();
                    await fetchRegions();
                } else {
                    const errorResponse = await response.json();
                    hideLoader();
                    await Swal.fire('Failed!', errorResponse.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting region:', error);
                hideLoader();
                await Swal.fire('Error!', 'Failed to delete region. Please try again.', 'error');
            }
        }
    }
    console.log('=== Region Status Check Completed ===');
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
    updateEntriesText();
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

// Update the showing entries text with a clickable "Show All" link
function updateEntriesText() {
    const totalItems = window.BNI.state.filteredRegions.length;
    const start = window.BNI.state.showingAllEntries ? 1 : 
        (window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage + 1;
    const end = window.BNI.state.showingAllEntries ? totalItems : 
        Math.min(start + window.BNI.state.entriesPerPage - 1, totalItems);
    
    const entriesText = document.querySelector('.mb-2.mb-sm-0');
    entriesText.innerHTML = `
        Showing <b>${start}</b> to <b>${end}</b> of <b>${totalItems}</b> entries 
        <a href="javascript:void(0)" class="ms-2 text-primary show-all-link">
            ${window.BNI.state.showingAllEntries ? 'Show Paginated' : 'Show All'}
        </a>
    `;

    // Add click event listener to the "Show All" link
    const showAllLink = entriesText.querySelector('.show-all-link');
    showAllLink.onclick = toggleShowAll;
}

// Function to toggle between showing all entries and paginated view
function toggleShowAll() {
    window.BNI.state.showingAllEntries = !window.BNI.state.showingAllEntries;
    
    if (window.BNI.state.showingAllEntries) {
        // Show all entries
        displayRegions(window.BNI.state.filteredRegions);
        // Hide pagination
        document.querySelector('.pagination').style.display = 'none';
    } else {
        // Return to paginated view
        window.BNI.state.currentPage = 1;
        changePage(1);
        // Show pagination
        document.querySelector('.pagination').style.display = 'flex';
    }
    
    updateEntriesText();
}

// Add some CSS styles to the page
const style = document.createElement('style');
style.textContent = `
    .show-all-link {
        text-decoration: none;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 4px;
        background-color: #f8f9fa;
        transition: background-color 0.2s;
    }
    .show-all-link:hover {
        background-color: #e9ecef;
        text-decoration: none;
    }
`;
document.head.appendChild(style);

// Add reset filters functionality
document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    console.log('🔄 Resetting filters...');
    
    // Simply redirect to the base URL without any query parameters
    window.location.href = '/r/manage-region';
});

// Add sorting icons to table headers
document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('th[scope="col"]');
    headers.forEach(header => {
        if (header.textContent !== 'Actions' && header.textContent !== 'Contact Number') {
            const originalText = header.textContent;
            header.innerHTML = `
                <div class="d-flex align-items-center justify-content-between">
                    ${originalText}
                    <span class="sort-icons ms-2" style="cursor: pointer;">
                        <i class="ti ti-arrows-sort"></i>
                    </span>
                </div>
            `;
        }
    });
});

// Sorting function for different types of data
function sortRegions(columnIndex, ascending = true) {
    console.log(`🔄 Starting sort on column ${columnIndex}, ascending: ${ascending}`);
    
    const tableBody = document.getElementById('chaptersTableBody');
    const rows = Array.from(tableBody.getElementsByTagName('tr'));

    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();
        
        console.log(`Comparing: ${aValue} with ${bValue}`);

        // Handle different column types
        switch(columnIndex) {
            case 0: // S.No.
            case 2: // No. of Chapters
            case 3: // No. of Members
                // Numeric sorting
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
                console.log(`Numeric comparison: ${aValue} vs ${bValue}`);
                return ascending ? aValue - bValue : bValue - aValue;

            case 1: // Region Name
                // Alphabetical sorting
                return ascending ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);

            case 5: // Region Status
                // Status sorting (active/inactive)
                return ascending ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);

            default:
                return 0;
        }
    });

    // Reorder the table
    rows.forEach((row, index) => {
        // Update S.No.
        row.cells[0].textContent = index + 1;
        tableBody.appendChild(row);
    });

    console.log(`✅ Sorting complete. First few entries:`, 
        rows.slice(0, 3).map(row => ({
            sNo: row.cells[0].textContent,
            name: row.cells[1].textContent,
            chapters: row.cells[2].textContent,
            members: row.cells[3].textContent,
            status: row.cells[5].textContent
        }))
    );
}

// Add click event listeners to sort icons
document.addEventListener('click', (event) => {
    const sortIcon = event.target.closest('.sort-icons');
    if (!sortIcon) return;

    const header = sortIcon.closest('th');
    const columnIndex = Array.from(header.parentElement.children).indexOf(header);
    
    console.log(`🎯 Sort clicked for column: ${header.textContent.trim()}`);

    // Toggle sort direction
    const currentDirection = sortIcon.getAttribute('data-sort') === 'asc';
    const newDirection = !currentDirection;
    
    // Reset all icons
    document.querySelectorAll('.sort-icons').forEach(icon => {
        icon.setAttribute('data-sort', '');
        icon.querySelector('i').className = 'ti ti-arrows-sort';
    });

    // Update clicked icon
    sortIcon.setAttribute('data-sort', newDirection ? 'asc' : 'desc');
    sortIcon.querySelector('i').className = newDirection ? 
        'ti ti-sort-ascending' : 
        'ti ti-sort-descending';

    // Perform sort
    sortRegions(columnIndex, newDirection);
});