// Global variables
window.BNI = window.BNI || {};
window.BNI.apiUrl = 'https://bni-data-backend.onrender.com/api/getZones';
window.BNI.state = {
    allZones: [],
    filteredZones: [],
    currentSort: {
        column: null,
        direction: 'asc'
    }
};
let total_zones = 0;
let total_regions = 0;
let chapter_total = 0;
let member_total = 0;
let currentPage = 1;
const entriesPerPage = 10;
let totalPages = 0;
let showingAll = false;

// Function to show loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Function to fetch all required data
const fetchAllData = async () => {
    console.log('🚀 Starting to fetch all data...');
    try {
        // Fetch regions
        const regionsResponse = await fetch('https://bni-data-backend.onrender.com/api/regions');
        const regionsData = await regionsResponse.json();
        console.log('✅ Regions fetched:', regionsData.length);

        // Fetch chapters
        const chaptersResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
        const chaptersData = await chaptersResponse.json();
        console.log('✅ Chapters fetched:', chaptersData.length);

        // Fetch members
        const membersResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
        const membersData = await membersResponse.json();
        console.log('✅ Members fetched:', membersData.length);

        return { regions: regionsData, chapters: chaptersData, members: membersData };
    } catch (error) {
        console.error('❌ Error fetching data:', error);
        throw error;
    }
};

// Function to calculate totals
const calculateTotals = (zones, allData) => {
    console.log('📊 Calculating totals...');
    
    // Set total zones
    total_zones = zones.length;
    console.log('Total zones:', total_zones);

    // Calculate totals from the data
    total_regions = allData.regions.length;
    chapter_total = allData.chapters.length;
    member_total = allData.members.length;

    console.log('Totals calculated:', {
        zones: total_zones,
        regions: total_regions,
        chapters: chapter_total,
        members: member_total
    });

    // Update display
    updateTotalDisplays();
};

// Function to update total displays
const updateTotalDisplays = () => {
    document.getElementById('totalZones').textContent = total_zones;
    document.getElementById('totalRegions').textContent = total_regions;
    document.getElementById('chapterTotal').textContent = chapter_total;
    document.getElementById('memberTotal').textContent = member_total;
};

// Add search functionality
document.getElementById('searchChapterInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log('🔍 Searching for:', searchTerm);
    
    const filtered = window.BNI.state.allZones.filter(zone => 
        zone.zone_name.toLowerCase().includes(searchTerm)
    );
    
    window.BNI.state.filteredZones = filtered;
    displayZones(filtered);
});

// Add status filter functionality
document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', function(e) {
        const status = e.target.dataset.filter;
        console.log('🔍 Filtering by status:', status);
        
        const filtered = window.BNI.state.allZones.filter(zone => {
            if (status === 'active') return zone.zone_status.toLowerCase() === 'active';
            if (status === 'inactive') return zone.zone_status.toLowerCase() === 'inactive';
            return true;
        });
        
        window.BNI.state.filteredZones = filtered;
        displayZones(filtered);
    });
});

// Add reset filter functionality
document.getElementById('reset-filters-btn').addEventListener('click', () => {
    console.log('🔄 Resetting filters');
    document.getElementById('searchChapterInput').value = '';
    window.BNI.state.filteredZones = window.BNI.state.allZones;
    displayZones(window.BNI.state.allZones);
});

// Add sorting functionality
function sortData(column) {
    console.log('📊 Sorting by:', column);
    
    const direction = window.BNI.state.currentSort.column === column && 
                     window.BNI.state.currentSort.direction === 'asc' ? 'desc' : 'asc';
    
    window.BNI.state.currentSort = { column, direction };
    
    const sorted = [...window.BNI.state.filteredZones].sort((a, b) => {
        let compareA, compareB;
        
        switch(column) {
            case 'zone_name':
                compareA = a.zone_name.toLowerCase();
                compareB = b.zone_name.toLowerCase();
                break;
            case 'regions':
                compareA = allData.regions.filter(r => r.zone_id === a.zone_id).length;
                compareB = allData.regions.filter(r => r.zone_id === b.zone_id).length;
                break;
            case 'chapters':
                compareA = allData.chapters.filter(c => c.zone_id === a.zone_id).length;
                compareB = allData.chapters.filter(c => c.zone_id === b.zone_id).length;
                break;
            case 'members':
                compareA = allData.members.filter(m => m.zone_id === a.zone_id).length;
                compareB = allData.members.filter(m => m.zone_id === b.zone_id).length;
                break;
            case 'status':
                compareA = a.zone_status.toLowerCase();
                compareB = b.zone_status.toLowerCase();
                break;
            default:
                return 0;
        }
        
        if (compareA < compareB) return direction === 'asc' ? -1 : 1;
        if (compareA > compareB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    displayZones(sorted);
}

// Update the table headers in displayZones function
function updateTableHeaders() {
    const headers = {
        'zone_name': 'Zone Name',
        'regions': 'No. of regions',
        'chapters': 'No. of Chapters',
        'members': 'No. of Members',
        'status': 'Zone Status'
    };

    Object.entries(headers).forEach(([key, text]) => {
        const th = document.querySelector(`th[data-column="${key}"]`);
        if (th) {
            const isCurrentSort = window.BNI.state.currentSort.column === key;
            const direction = isCurrentSort ? window.BNI.state.currentSort.direction : '';
            th.innerHTML = `
                ${text} 
                <i class="ti ti-arrow-${direction === 'asc' ? 'up' : 'down'}" 
                   style="opacity: ${isCurrentSort ? '1' : '0.3'}"></i>
            `;
        }
    });
}

// Main function to display zones
const displayZones = async (zones) => {
    console.log('🎯 Starting to display zones:', zones);
    
    try {
        const allData = await fetchAllData();
        const tableBody = document.getElementById('chaptersTableBody');
        tableBody.innerHTML = '';

        // Update table headers with sort indicators
        updateTableHeaders();

        // Calculate pagination
        const totalEntries = zones.length;
        document.getElementById("totalEntries").textContent = totalEntries;
        
        totalPages = Math.ceil(zones.length / entriesPerPage);
        const start = showingAll ? 0 : (currentPage - 1) * entriesPerPage;
        const end = showingAll ? zones.length : Math.min(start + entriesPerPage, zones.length);
        
        // Update showing entries text
        document.getElementById("showingStart").textContent = zones.length > 0 ? start + 1 : 0;
        document.getElementById("showingEnd").textContent = end;

        // Get zones for current page
        const zonesToShow = showingAll ? zones : zones.slice(start, end);

        zonesToShow.forEach((zone, index) => {
            // Count data for this zone
            const regionsCount = allData.regions.filter(region => region.zone_id === zone.zone_id).length;
            const chaptersCount = allData.chapters.filter(chapter => chapter.zone_id === zone.zone_id).length;
            const membersCount = allData.members.filter(member => member.zone_id === zone.zone_id).length;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${showingAll ? index + 1 : start + index + 1}</td>
                <td style="border: 1px solid grey;">
                    <div class="d-flex align-items-center">
                        <b>${zone.zone_name}</b>
                    </div>
                </td>
                <td style="border: 1px solid grey;"><b>${regionsCount}</b></td>
                <td style="border: 1px solid grey;"><b>${chaptersCount}</b></td>
                <td style="border: 1px solid grey;"><b>${membersCount}</b></td>
                <td style="border: 1px solid grey;">
                    <span class="badge bg-${zone.zone_status.toLowerCase() === 'active' ? 'success' : 'danger'}">
                        ${zone.zone_status}
                    </span>
                </td>
                <td style="border: 1px solid grey">
                    <span class="badge bg-info text-light" style="cursor:pointer; color:white; margin-right: 4px;">
                        <a href="/z/view-zone/${zone.zone_id}" style="color:white">View</a>
                    </span>
                    <span class="badge bg-primary text-light" style="cursor:pointer; color:white; margin-right: 4px;">
                        <a href="/z/edit-zone/${zone.zone_id}" style="color:white">Edit</a>
                    </span>
                    <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-zone-id="${zone.zone_id}">
                        Delete
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Calculate and update totals
        calculateTotals(zones, allData);
        
        // Update pagination UI
        const paginationContainer = document.getElementById("paginationContainer");
        paginationContainer.style.display = showingAll ? 'none' : 'flex';
        if (!showingAll) {
            updatePagination(totalPages);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
};

// Function to fetch and display zones
const fetchZones = async () => {
    console.log('🚀 Fetching zones...');
    showLoader();
    
    try {
        const response = await fetch(window.BNI.apiUrl);
        if (!response.ok) throw new Error('Failed to fetch zones');
        
        const zones = await response.json();
        window.BNI.state.allZones = zones;
        window.BNI.state.filteredZones = zones;
        
        await displayZones(zones);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        hideLoader();
    }
};

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', fetchZones);

// Add event listener for delete buttons
document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-btn')) {
        const zoneId = e.target.closest('.delete-btn').dataset.zoneId;
        // Handle delete action here
        console.log('Delete clicked for zone:', zoneId);
    }
});

// Add this sorting function to zone.js
function sortZones(columnIndex, ascending) {
    console.log(`🔄 Sorting column ${columnIndex} in ${ascending ? 'ascending' : 'descending'} order`);
    
    const tableBody = document.getElementById('chaptersTableBody');
    const rows = Array.from(tableBody.getElementsByTagName('tr'));

    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();
        
        console.log(`Comparing: ${aValue} with ${bValue}`);

        // Handle different column types
        switch(columnIndex) {
            case 0: // S.No.
            case 2: // No. of regions
            case 3: // No. of Chapters
            case 4: // No. of Members
                // Numeric sorting
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
                console.log(`Numeric comparison: ${aValue} vs ${bValue}`);
                return ascending ? aValue - bValue : bValue - aValue;

            case 1: // Zone Name
                // Alphabetical sorting
                return ascending ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);

            case 5: // Zone Status
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
            regions: row.cells[2].textContent,
            chapters: row.cells[3].textContent,
            members: row.cells[4].textContent,
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
    sortZones(columnIndex, newDirection);
});

// Add some CSS styles to the page
const style = document.createElement('style');
style.textContent = `
    .sort-icons {
        opacity: 0.5;
        transition: opacity 0.2s;
    }
    .sort-icons:hover {
        opacity: 1;
    }
    th {
        cursor: pointer;
    }
    th[data-sort="asc"] .sort-icons i {
        transform: rotate(180deg);
    }
`;
document.head.appendChild(style);

// Initialize sorting icons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add click listeners to sort icons
    document.querySelectorAll('.sort-icons').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const th = e.target.closest('th');
            const columnIndex = Array.from(th.parentElement.children).indexOf(th);
            
            // Toggle sort direction
            const currentDirection = icon.getAttribute('data-sort') === 'asc';
            const newDirection = !currentDirection;
            
            // Reset all icons
            document.querySelectorAll('.sort-icons').forEach(otherIcon => {
                otherIcon.setAttribute('data-sort', '');
                otherIcon.querySelector('i').className = 'ti ti-arrows-sort';
            });
            
            // Update clicked icon
            icon.setAttribute('data-sort', newDirection ? 'asc' : 'desc');
            icon.querySelector('i').className = newDirection ? 
                'ti ti-sort-ascending' : 
                'ti ti-sort-descending';
            
            // Perform sort
            sortZones(columnIndex, newDirection);
        });
    });
});

// Add pagination functions
function updatePagination(totalPages) {
    const container = document.getElementById("pageNumbers");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    
    container.innerHTML = "";
    
    // Create page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement("li");
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="javascript:void(0)">${i}</a>`;
        pageItem.onclick = () => {
            currentPage = i;
            displayZones(window.BNI.state.filteredZones);
        };
        container.appendChild(pageItem);
    }
    
    // Update prev/next buttons
    prevBtn.classList.toggle('disabled', currentPage === 1);
    nextBtn.classList.toggle('disabled', currentPage === totalPages);
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchZones();

    // Show All button handler
    document.getElementById("showAllBtn").addEventListener('click', function() {
        showingAll = !showingAll;
        this.textContent = showingAll ? "Show Less" : "Show All";
        currentPage = 1;
        displayZones(window.BNI.state.filteredZones);
    });

    // Previous page handler
    document.getElementById("prevPage").addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayZones(window.BNI.state.filteredZones);
        }
    });

    // Next page handler
    document.getElementById("nextPage").addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            displayZones(window.BNI.state.filteredZones);
        }
    });
});