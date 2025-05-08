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
let allMemberAccolades = [];

// Function to fetch regions data
async function fetchRegions() {
    try {
        const response = await fetch('http://backend.bninewdelhi.com/api/regions');
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
        const response = await fetch('http://backend.bninewdelhi.com/api/chapters');
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
        const response = await fetch('http://backend.bninewdelhi.com/api/members');
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
        const response = await fetch('http://backend.bninewdelhi.com/api/accolades');
        if (!response.ok) throw new Error('Failed to fetch accolades');
        const data = await response.json();
        allAccolades = data.filter(accolade => accolade.delete_status === 0);
        return data;
    } catch (error) {
        console.error('Error fetching accolades:', error);
        return [];
    }
}

// Function to fetch member accolades data
async function fetchMemberAccolades() {
    try {
        const response = await fetch('http://backend.bninewdelhi.com/api/getAllMemberAccolades');
        if (!response.ok) throw new Error('Failed to fetch member accolades');
        const data = await response.json();
        allMemberAccolades = data;
        return data;
    } catch (error) {
        console.error('Error fetching member accolades:', error);
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
function showAccoladeDetails(accoladeIds, memberId) {
    if (!accoladeIds || accoladeIds.length === 0) return;

    const memberAccolades = allMemberAccolades.filter(acc => 
        acc.member_id === memberId && accoladeIds.includes(acc.accolade_id)
    );

    const accoladeDetails = memberAccolades.map(memberAcc => {
        const accolade = allAccolades.find(acc => acc.accolade_id === memberAcc.accolade_id);
        if (!accolade) return '';
        return `
            <div class="accolade-detail">
                <h5 class="text-primary">${accolade.accolade_name}</h5>
                <div class="publish-date">
                    <i class="ti ti-calendar"></i>
                    Issued on ${formatDate(memberAcc.issue_date)}
                </div>
                
                <p><strong>Item Type:</strong> ${accolade.item_type}</p>
                <p><strong>Status:</strong> <span class="badge ${accolade.accolade_status === 'active' ? 'bg-success' : 'bg-danger'}">${accolade.accolade_status}</span></p>
                ${memberAcc.given_date ? `
                    <p><strong>Given Date:</strong> ${formatDate(memberAcc.given_date)}</p>
                ` : ''}
                ${memberAcc.comment ? `
                    <p><strong>Comment:</strong> ${memberAcc.comment}</p>
                ` : ''}
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
function getAccoladeNames(memberId) {
    // Filter accolades for this member
    const memberAccolades = allMemberAccolades.filter(acc => acc.member_id === memberId);
    
    if (!memberAccolades || memberAccolades.length === 0) return 'None';
    
    // Get unique accolade IDs for this member
    const accoladeIds = [...new Set(memberAccolades.map(acc => acc.accolade_id))];
    
    return `<a href="#" class="text-primary accolade-link" onclick="showAccoladeDetails(${JSON.stringify(accoladeIds)}, ${memberId})">${
        accoladeIds
            .map(id => allAccolades.find(acc => acc.accolade_id === id)?.accolade_name)
            .filter(name => name)
            .join(', ')
    }</a>`;
}

// Function to filter members based on selected region and chapter
function filterMembers() {
    // Initially show all members
    filteredMembers = [...allMembers];

    // Apply region filter if selected
    if (selectedRegion && selectedRegion !== 'all') {
        filteredMembers = filteredMembers.filter(member => member.region_id === parseInt(selectedRegion));
    }

    // Apply chapter filter if selected
    if (selectedChapter && selectedChapter !== 'all') {
        filteredMembers = filteredMembers.filter(member => member.chapter_id === parseInt(selectedChapter));
    }
}

// Function to display members in table
function displayMembers() {
    const tableBody = document.getElementById('chaptersTableBody');
    
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

    tableBody.innerHTML = membersToDisplay.map((member, index) => {
        // Count accolades for this member
        const memberAccoladesCount = allMemberAccolades.filter(acc => 
            acc.member_id === member.member_id
        ).length;

        return `
            <tr class="align-middle">
                <td class="fw-bold">${startIndex + index + 1}</td>
                <td class="fw-bold text-primary">${member.member_first_name} ${member.member_last_name}</td>
                <td class="fw-bold ">${allChapters.find(c => c.chapter_id === member.chapter_id)?.chapter_name || 'Unknown Chapter'}</td>
                <td class="fw-bold">${memberAccoladesCount}</td>
                <td class="fw-bold">${getAccoladeNames(member.member_id)}</td>
                <td class="fw-bold ${member.member_status === 'active' ? 'text-success' : 'text-danger'}">${member.member_status}</td>
            </tr>
        `;
    }).join('');

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

    // Calculate the range of page numbers to display
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Build pagination HTML
    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" id="prevPage" href="#">Previous</a>
        </li>`;

    // Add first page and ellipsis if necessary
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link pageNumber" href="#" data-page="1">1</a>
            </li>`;
        if (startPage > 2) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>`;
        }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link pageNumber" href="#" data-page="${i}">${i}</a>
            </li>`;
    }

    // Add last page and ellipsis if necessary
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>`;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link pageNumber" href="#" data-page="${totalPages}">${totalPages}</a>
            </li>`;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" id="nextPage" href="#">Next</a>
        </li>`;

    paginationContainer.innerHTML = paginationHTML;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch initial data
    await Promise.all([
        fetchRegions(), 
        fetchChapters(), 
        fetchMembers(), 
        fetchAccolades(),
        fetchMemberAccolades()
    ]);
    
    // Populate initial filters
    populateRegionFilter();
    populateChapterFilter();
    
    // Initialize filteredMembers with all members
    filteredMembers = [...allMembers];
    
    // Display all members initially
    displayMembers();

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        // Filter from all members
        filteredMembers = allMembers.filter(member => {
            const nameMatch = (member.member_first_name + ' ' + member.member_last_name)
                .toLowerCase()
                .includes(searchTerm);
                
            // Apply region and chapter filters if selected
            const regionMatch = !selectedRegion || selectedRegion === 'all' || 
                member.region_id === parseInt(selectedRegion);
            const chapterMatch = !selectedChapter || selectedChapter === 'all' || 
                member.chapter_id === parseInt(selectedChapter);
                
            return nameMatch && regionMatch && chapterMatch;
        });
        
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
