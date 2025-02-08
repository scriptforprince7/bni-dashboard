// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.endpoints = {
    chapters: "https://bni-data-backend.onrender.com/api/chapters",
    regions: "https://bni-data-backend.onrender.com/api/regions",
    members: "https://bni-data-backend.onrender.com/api/members"
};
let active_total =0;
let member_total = 0;

// Use window.BNI namespace for other global variables
window.BNI.state = window.BNI.state || {
    allChapters: [],
    filteredChapters: [],
    allMembers: [],
    allRegions: [],
    filters: {
        region: '',
        meetingDay: 'all',
        chapterStatus: 'all',
        chapterType: 'all'
    }
};

// Function to show the loader
function showLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "flex";
    } else {
        console.error("Loader element not found");
    }
}

// Function to hide the loader
function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "none";
    } else {
        console.error("Loader element not found");
    }
}

// Function to get member count for a chapter
function getMemberCountForChapter(chapterId) {
    console.log(`Getting member count for chapter ${chapterId}`);
    return window.BNI.state.allMembers.filter(member => member.chapter_id === chapterId).length;
}

// Function to get region name by ID
function getRegionNameById(regionId) {
    console.log(`Getting region name for ID ${regionId}`);
    const region = window.BNI.state.allRegions.find(r => r.region_id === regionId);
    return region ? region.region_name : 'Unknown Region';
}

// Function to update the running chapters count
function updateRunningChaptersCount() {
    const runningCount = window.BNI.state.filteredChapters.filter(chapter => chapter.chapter_status === 'running').length;
    const runningChaptersElement = document.getElementById("running-chapters-count");
    if (runningChaptersElement) {
        runningChaptersElement.innerHTML = `<b>${runningCount}</b>`;
    }
}

// Function to display chapters
const displayChapters = (chapters) => {
    console.log("Displaying chapters:", chapters);
    const tableBody = document.getElementById("chaptersTableBody");
    if (!tableBody) {
        console.error("Chapters table body not found");
        return;
    }

    tableBody.innerHTML = ""; // Clear the table body

    if (chapters.length === 0) {
        console.log("No chapters to display");
        const noDataRow = document.createElement("tr");
        noDataRow.innerHTML = `
            <td colspan="10" style="text-align: center; font-weight: bold;">No data available</td>
        `;
        tableBody.appendChild(noDataRow);
        return;
    }

    // Update total chapters count
    const totalChaptersElement = document.getElementById("total-chapters-count");
    if (totalChaptersElement) {
        totalChaptersElement.textContent = chapters.length;
    }

    // Populate the table with chapters data
    chapters.forEach((chapter, index) => {
        const membersCount = getMemberCountForChapter(chapter.chapter_id);
        const regionName = getRegionNameById(chapter.region_id);
        console.log(`Processing chapter: ${chapter.chapter_name}, Region: ${regionName}, Members: ${membersCount}`);


        member_total = parseFloat(member_total) + parseFloat(membersCount);
        if(chapter.chapter_status === "running"){
            active_total= parseFloat(active_total) + 1;
        }
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <a href="javascript:void(0);" onclick="handleChapterAccess('${chapter.chapter_id}', '${chapter.email_id}');" class="chapter-link">
                    <b>${chapter.chapter_name}</b>
                </a>
            </td>
            <td>${regionName}</td>
            <td><b>${membersCount}</b></td>
            <td>${chapter.chapter_meeting_day || 'N/A'}</td>
            <td><b>₹${chapter.chapter_kitty_fees || '0'}</b></td>
            <td><b>₹${chapter.chapter_visitor_fees || '0'}</b></td>
            <td><b>${chapter.kitty_billing_frequency || 'N/A'}</b></td>
            <td>
                <span class="badge bg-${chapter.chapter_status === "running" ? "success" : "danger"}">
                    ${chapter.chapter_status}
                </span>
            </td>
            <td>
                <span class="badge bg-warning text-light" style="cursor:pointer;">
                    <a href="/c/edit-chapter/?chapter_id=${chapter.chapter_id}" style="color:white">Edit</a>
                </span>
                <span class="badge bg-danger text-light delete-btn" 
                      style="cursor:pointer;" 
                      data-chapter-id="${chapter.chapter_id}">Delete</span>
            </td>
        `;
        tableBody.appendChild(row);
    const tot_member_display = document.getElementById("memberTotal");
    const tot_running_display = document.getElementById("RunningChapter");
    const tot_inactive_display = document.getElementById("InactiveChapter");
    tot_running_display.innerHTML = active_total;
    tot_inactive_display.innerHTML = parseFloat(chapters.length) - parseFloat(active_total);
    tot_member_display.innerHTML = member_total;

    });

    // Update the running chapters count after displaying chapters
    updateRunningChaptersCount();
};

// Function to populate filter dropdowns
function populateFilters() {
    // Populate region filter with specific regions
    const regionFilter = document.getElementById("region-filter");
    const regions = ['North', 'South', 'East', 'West']; // Fixed set of regions
    regionFilter.innerHTML = `
        ${regions.map(region => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${region}">${region}</a></li>
        `).join('')}
    `;

    // Populate meeting day filter
    const meetingDayFilter = document.getElementById("meeting-day-filter");
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    meetingDayFilter.innerHTML = `
       
        ${days.map(day => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${day}">${day}</a></li>
        `).join('')}
    `;

    // Populate chapter status filter
    const statusFilter = document.getElementById("chapter-status-filter");
    const statuses = ['running', 'pre-launch']; // Base statuses - can be expanded later
    statusFilter.innerHTML = `
        
        ${statuses.map(status => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </a></li>
        `).join('')}
    `;

    // Populate chapter type filter
    const typeFilter = document.getElementById("chapter-type-filter");
    const chapterTypes = ['Offline', 'Online', 'Hybrid'];
    typeFilter.innerHTML = `
        ${chapterTypes.map(type => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${type.toLowerCase()}">
                ${type}
            </a></li>
        `).join('')}
    `;
}

// Function to apply filters
function applyFilters() {
    const { region, meetingDay, chapterStatus, chapterType } = window.BNI.state.filters;
    
    window.BNI.state.filteredChapters = window.BNI.state.allChapters.filter(chapter => {
        const regionName = getRegionNameById(chapter.region_id);
        const matchesRegion = !region || regionName.includes(region);
        const matchesMeetingDay = meetingDay === 'all' || chapter.chapter_meeting_day === meetingDay;
        const matchesStatus = chapterStatus === 'all' || chapter.chapter_status === chapterStatus;
        const matchesType = chapterType === 'all' || 
                          (chapter.chapter_type && chapter.chapter_type.toLowerCase() === chapterType.toLowerCase());
        return matchesRegion && matchesMeetingDay && matchesStatus && matchesType;
    });

    displayChapters(window.BNI.state.filteredChapters);
}

// Event listeners for filters
document.getElementById("region-filter")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("dropdown-item")) {
        window.BNI.state.filters.region = event.target.dataset.value;
        event.target.closest('.dropdown').querySelector('.dropdown-toggle').textContent = 
            `Region: ${event.target.textContent}`;
    }
});

document.getElementById("meeting-day-filter")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("dropdown-item")) {
        window.BNI.state.filters.meetingDay = event.target.dataset.value;
        event.target.closest('.dropdown').querySelector('.dropdown-toggle').textContent = 
            `Meeting Day: ${event.target.textContent}`;
    }
});

document.getElementById("chapter-status-filter")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("dropdown-item")) {
        window.BNI.state.filters.chapterStatus = event.target.dataset.value;
        event.target.closest('.dropdown').querySelector('.dropdown-toggle').textContent = 
            `Status: ${event.target.textContent}`;
    }
});

document.getElementById("chapter-type-filter")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("dropdown-item")) {
        window.BNI.state.filters.chapterType = event.target.dataset.value;
        event.target.closest('.dropdown').querySelector('.dropdown-toggle').textContent = 
            `Chapter Type: ${event.target.textContent}`;
    }
});

document.getElementById("apply-filters-btn")?.addEventListener("click", () => {
    applyFilters();
});

document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    // Reset filter state
    window.BNI.state.filters.region = '';
    window.BNI.state.filters.meetingDay = 'all';
    window.BNI.state.filters.chapterStatus = 'all';
    window.BNI.state.filters.chapterType = 'all';
    
    // Reset dropdown texts
    document.querySelector('#region-filter').closest('.dropdown').querySelector('.dropdown-toggle').textContent = 'Region';
    document.querySelector('#meeting-day-filter').closest('.dropdown').querySelector('.dropdown-toggle').textContent = 'Meeting Day';
    document.querySelector('#chapter-status-filter').closest('.dropdown').querySelector('.dropdown-toggle').textContent = 'Chapter Status';
    document.querySelector('#chapter-type-filter').closest('.dropdown').querySelector('.dropdown-toggle').textContent = 'Chapter Type';
    
    // Reset filtered chapters to all chapters
    window.BNI.state.filteredChapters = [...window.BNI.state.allChapters];
    displayChapters(window.BNI.state.filteredChapters);
});

// Initialize everything when the DOM is loaded
window.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded - Starting initialization");
    showLoader();
    try {
        // Fetch initial data
        console.log("Fetching data from endpoints:", window.BNI.endpoints);
        const [chaptersResponse, regionsResponse, membersResponse] = await Promise.all([
            fetch(window.BNI.endpoints.chapters),
            fetch(window.BNI.endpoints.regions),
            fetch(window.BNI.endpoints.members)
        ]);

        if (!chaptersResponse.ok) throw new Error(`Chapters fetch failed: ${chaptersResponse.status}`);
        if (!regionsResponse.ok) throw new Error(`Regions fetch failed: ${regionsResponse.status}`);
        if (!membersResponse.ok) throw new Error(`Members fetch failed: ${membersResponse.status}`);

        window.BNI.state.allChapters = await chaptersResponse.json();
        window.BNI.state.allRegions = await regionsResponse.json();
        window.BNI.state.allMembers = await membersResponse.json();
        window.BNI.state.filteredChapters = [...window.BNI.state.allChapters];

        console.log("Data fetched successfully:", {
            chapters: window.BNI.state.allChapters.length,
            regions: window.BNI.state.allRegions.length,
            members: window.BNI.state.allMembers.length
        });

        // After data is fetched successfully, populate filters
        populateFilters();
        
        // Display initial data
        displayChapters(window.BNI.state.filteredChapters);

    } catch (error) {
        console.error('Error during initialization:', error);
    } finally {
        hideLoader();
    }
});

// Search functionality
document.getElementById("searchChapterInput")?.addEventListener("input", function() {
    const searchTerm = this.value.toLowerCase();
    console.log("Searching for:", searchTerm);
    
    window.BNI.state.filteredChapters = window.BNI.state.allChapters.filter(chapter =>
        chapter.chapter_name.toLowerCase().includes(searchTerm)
    );
    
    displayChapters(window.BNI.state.filteredChapters);
});

// Delete functionality
document.getElementById("chaptersTableBody")?.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const chapterId = event.target.getAttribute("data-chapter-id");
        console.log("Delete requested for chapter ID:", chapterId);
        
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This action will mark the chapter as deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel"
        });

        if (result.isConfirmed) {
            try {
                showLoader();
                const response = await fetch(`https://bni-data-backend.onrender.com/api/deleteChapter/${chapterId}`, {
                    method: "PUT"
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Chapter deleted successfully:", data);
                    Swal.fire("Deleted!", data.message, "success");
                    event.target.closest("tr").remove();
                } else {
                    const errorData = await response.json();
                    console.error("Delete failed:", errorData);
                    Swal.fire("Failed!", errorData.message, "error");
                }
            } catch (error) {
                console.error("Error during delete:", error);
                Swal.fire("Error!", "Failed to delete chapter. Please try again.", "error");
            } finally {
                hideLoader();
            }
        }
    }
});

// Add this function at the bottom of the file
async function handleChapterAccess(chapterId, chapterEmail) {
    console.log('=== Starting handleChapterAccess ===');
    console.log('Params received:', { chapterId, chapterEmail });
    
    const loginType = getUserLoginType();
    console.log('Current user login type:', loginType);
    
    try {
        if (loginType === 'ro_admin') {
            const chapterData = {
                chapter_id: chapterId,
                email_id: chapterEmail
            };
            
            if (setChapterAccessForAdmin(chapterData)) {
                // First store the data
                localStorage.setItem('current_chapter_email', chapterEmail);
                localStorage.setItem('current_chapter_id', chapterId);
                
                // Verify the data was stored
                const storedEmail = localStorage.getItem('current_chapter_email');
                const storedId = localStorage.getItem('current_chapter_id');
                
                console.log('Verification of stored data:', {
                    originalEmail: chapterEmail,
                    storedEmail: storedEmail,
                    originalId: chapterId,
                    storedId: storedId
                });

                if (!storedEmail || !storedId) {
                    throw new Error('Failed to store chapter access data');
                }

                // Only redirect if data is properly stored
                window.location.href = `/d/chapter-dashboard/${chapterId}`;
            } else {
                throw new Error('Failed to set admin chapter access');
            }
        } else if (loginType === 'chapter') {
            const userEmail = getUserEmail();
            console.log('Chapter access check:', { 
                userEmail, 
                requestedEmail: chapterEmail 
            });
            
            if (userEmail === chapterEmail) {
                console.log('Chapter accessing own dashboard');
                localStorage.setItem('current_chapter_email', chapterEmail);
                localStorage.setItem('current_chapter_id', chapterId);
                window.location.href = `/d/chapter-dashboard/${chapterId}`;
            } else {
                throw new Error('Chapter attempting to access unauthorized dashboard');
            }
        } else {
            console.log('Regular user access - redirecting to view-chapter');
            window.location.href = `/c/view-chapter/?chapter_id=${chapterId}`;
        }
    } catch (error) {
        console.error('Error in handleChapterAccess:', error);
        Swal.fire({
            icon: 'error',
            title: 'Access Error',
            text: error.message || 'Failed to access chapter dashboard'
        });
    }
}