// Global variables
let allMembers = [];
let allAccolades = [];
let allRegions = [];
let allChapters = [];
let filteredMembers = [];
let currentPage = 1;
const itemsPerPage = 10;
let isPaginationEnabled = true;
let selectedRegion = null;
let selectedChapter = null;

// Function to fetch regions data
async function fetchRegions() {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/regions');
        if (!response.ok) throw new Error('Failed to fetch regions');
        const data = await response.json();
        allRegions = data.filter(region => region.delete_status === 0);
        return data;
    } catch (error) {
        console.error('Error fetching regions:', error);
        return [];
    }
}

// Function to fetch chapters data
async function fetchChapters() {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/chapters');
        if (!response.ok) throw new Error('Failed to fetch chapters');
        const data = await response.json();
        allChapters = data.filter(chapter => chapter.delete_status === 0);
        return data;
    } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
    }
}

// Function to fetch members data
async function fetchMembers() {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/members');
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        allMembers = data.filter(member => member.delete_status === 0);
        return data;
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

// Function to fetch accolades data
async function fetchAccolades() {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/accolades');
        if (!response.ok) throw new Error('Failed to fetch accolades');
        const data = await response.json();
        allAccolades = data.filter(accolade => accolade.delete_status === 0);
        return data;
    } catch (error) {
        console.error('Error fetching accolades:', error);
        return [];
    }
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

// Function to show accolade details popup
function showAccoladeDetails(accoladeIds) {
    if (!accoladeIds || accoladeIds.length === 0) return;

    const accoladeDetails = accoladeIds.map(id => {
        const accolade = allAccolades.find(acc => acc.accolade_id === id);
        if (!accolade) return '';
        return `
            <div class="accolade-detail">
                <h5 class="text-primary">${accolade.accolade_name}</h5>
                <div class="publish-date">
                    <i class="ti ti-calendar"></i>
                    Issued on ${formatDate(accolade.accolade_publish_date)}
                </div>
                
                <p><strong>Item Type:</strong> ${accolade.item_type}</p>
                
                <p><strong>Status:</strong> <span class="badge ${accolade.accolade_status === 'active' ? 'bg-success' : 'bg-danger'}">${accolade.accolade_status}</span></p>
                
            </div>
        `;
    }).join('');

    Swal.fire({
        title: '<strong>Accolade Details</strong>',
        html: `<div class="accolade-details-container">${accoladeDetails}</div>`,
        showCloseButton: true,
        showConfirmButton: false,
        width: '600px',
        customClass: {
            container: 'accolade-popup',
            title: 'text-primary fw-bold',
            htmlContainer: 'accolade-popup-content',
            closeButton: 'btn btn-outline-secondary'
        }
    });
}

// Function to populate region filter
function populateRegionFilter() {
    const regionFilter = document.getElementById('region-filter');
    
    regionFilter.innerHTML = `
        <li><a class="dropdown-item fw-bold" href="#" data-region="all">All Regions</a></li>
        ${allRegions.map(region => `
            <li><a class="dropdown-item fw-bold" href="#" data-region="${region.region_id}">${region.region_name}</a></li>
        `).join('')}
    `;
}

// Function to populate chapter filter based on selected region
function populateChapterFilter() {
    const chapterFilter = document.getElementById('chapter-filter');
    let filteredChapters = allChapters;
    
    if (selectedRegion && selectedRegion !== 'all') {
        filteredChapters = allChapters.filter(chapter => chapter.region_id === parseInt(selectedRegion));
    }
    
    chapterFilter.innerHTML = `
        <li><a class="dropdown-item fw-bold" href="#" data-chapter="all">All Chapters</a></li>
        ${filteredChapters.map(chapter => `
            <li><a class="dropdown-item fw-bold" href="#" data-chapter="${chapter.chapter_id}">${chapter.chapter_name}</a></li>
        `).join('')}
    `;
}

// Function to get accolade names for a member
function getAccoladeNames(accoladeIds) {
    if (!accoladeIds) return 'None';
    return `<a href="#" class="text-primary accolade-link" onclick="showAccoladeDetails(${JSON.stringify(accoladeIds)})">${
        accoladeIds
            .map(id => allAccolades.find(acc => acc.accolade_id === id)?.accolade_name)
            .filter(name => name)
            .join(', ')
    }</a>`;
}

// Function to filter members based on selected region and chapter
function filterMembers() {
    if (!selectedRegion || !selectedChapter) {
        filteredMembers = [];
        return;
    }

    filteredMembers = allMembers.filter(member => {
        const regionMatch = selectedRegion === 'all' || member.region_id === parseInt(selectedRegion);
        const chapterMatch = selectedChapter === 'all' || member.chapter_id === parseInt(selectedChapter);
        return regionMatch && chapterMatch;
    });
}

// Function to display members in table
function displayMembers() {
    const tableBody = document.getElementById('chaptersTableBody');
    
    if (!selectedRegion || !selectedChapter) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <h5 class="text-primary fw-bold my-4">Please select a Region and Chapter to view members' accolades</h5>
                </td>
            </tr>
        `;
        return;
    }

    if (filteredMembers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <h4 class="text-danger fw-bold my-4">No members found for the selected criteria</h4>
                </td>
            </tr>
        `;
        return;
    }

    const startIndex = isPaginationEnabled ? (currentPage - 1) * itemsPerPage : 0;
    const endIndex = isPaginationEnabled ? startIndex + itemsPerPage : filteredMembers.length;
    const membersToDisplay = filteredMembers.slice(startIndex, endIndex);

    tableBody.innerHTML = membersToDisplay.map((member, index) => `
        <tr class="align-middle">
            <td class="fw-bold">${startIndex + index + 1}</td>
            <td class="fw-bold text-primary">${member.member_first_name} ${member.member_last_name}</td>
            <td class="fw-bold ">${allChapters.find(c => c.chapter_id === member.chapter_id)?.chapter_name || 'Unknown Chapter'}</td>
            <td class="fw-bold">${member.accolades_id ? member.accolades_id.length : 0}</td>
            <td class="fw-bold">${getAccoladeNames(member.accolades_id)}</td>
            <td class="fw-bold ${member.member_status === 'active' ? 'text-success' : 'text-danger'}">${member.member_status}</td>
        </tr>
    `).join('');

    updatePagination();
}

// Function to update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    
    if (!isPaginationEnabled || filteredMembers.length === 0) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    document.getElementById('prevPage').classList.toggle('disabled', currentPage === 1);
    
    const pageNumbers = document.querySelector('.pagination');
    pageNumbers.innerHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" id="prevPage" href="#">Previous</a>
        </li>
        ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
            <li class="page-item ${page === currentPage ? 'active' : ''}">
                <a class="page-link pageNumber" href="#" data-page="${page}">${page}</a>
            </li>
        `).join('')}
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" id="nextPage" href="#">Next</a>
        </li>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch initial data
    await Promise.all([fetchRegions(), fetchChapters(), fetchMembers(), fetchAccolades()]);
    
    // Populate initial filters
    populateRegionFilter();
    populateChapterFilter();
    
    // Display initial message
    displayMembers();

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!selectedRegion || !selectedChapter) return;
        
        filterMembers();
        filteredMembers = filteredMembers.filter(member => 
            member.member_first_name.toLowerCase().includes(searchTerm) ||
            member.member_last_name.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        displayMembers();
    });

    // Region filter
    document.getElementById('region-filter').addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-item')) {
            selectedRegion = e.target.dataset.region;
            selectedChapter = null; // Reset chapter selection
            populateChapterFilter(); // Update chapter filter options
            filterMembers();
            currentPage = 1;
            displayMembers();
        }
    });

    // Chapter filter
    document.getElementById('chapter-filter').addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-item')) {
            selectedChapter = e.target.dataset.chapter;
            filterMembers();
            currentPage = 1;
            displayMembers();
        }
    });

    // Pagination controls
    document.querySelector('.pagination').addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('pageNumber')) {
            currentPage = parseInt(e.target.dataset.page);
            displayMembers();
        } else if (e.target.id === 'prevPage' && currentPage > 1) {
            currentPage--;
            displayMembers();
        } else if (e.target.id === 'nextPage' && currentPage < Math.ceil(filteredMembers.length / itemsPerPage)) {
            currentPage++;
            displayMembers();
        }
    });

    // Toggle pagination
    document.getElementById('togglePagination').addEventListener('click', () => {
        isPaginationEnabled = !isPaginationEnabled;
        const button = document.getElementById('togglePagination');
        button.textContent = isPaginationEnabled ? 'Show All' : 'Show Paginated';
        currentPage = 1;
        displayMembers();
    });

    // Reset filters button
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        selectedRegion = null;
        selectedChapter = null;
        document.getElementById('searchInput').value = '';
        populateRegionFilter();
        populateChapterFilter();
        filterMembers();
        currentPage = 1;
        displayMembers();
    });
});
