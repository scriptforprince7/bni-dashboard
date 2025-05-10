// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.endpoints = {
    chapters: "http://localhost:5000/api/chapters",
    regions: "http://localhost:5000/api/regions",
    members: "http://localhost:5000/api/members"
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

// Add these variables at the top of your file
let currentPage = 1;
const entriesPerPage = 10;
let totalPages = 0;
let showingAll = false;

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
    const runningCount = window.BNI.state.filteredChapters.filter(chapter => {
        const status = chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim();
        return status === 'running';
    }).length;
    const runningChaptersElement = document.getElementById("RunningChapter");
    if (runningChaptersElement) {
        runningChaptersElement.innerHTML = `<b>${runningCount}</b>`;
    }
}

// Function to update the pre-launch chapters count
function updatePreLaunchChaptersCount() {
    const preLaunchCount = window.BNI.state.filteredChapters.filter(chapter => {
        const status = chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim();
        return status === 'pre-launch';
    }).length;
    const preLaunchChaptersElement = document.getElementById("PreLaunchChapter");
    if (preLaunchChaptersElement) {
        preLaunchChaptersElement.innerHTML = `<b>${preLaunchCount}</b>`;
    }
}

// Function to update the re-launch chapters count
function updateReLaunchChaptersCount() {
    const reLaunchCount = window.BNI.state.filteredChapters.filter(chapter => {
        const status = chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim();
        return status === 're-launch';
    }).length;
    const reLaunchChaptersElement = document.getElementById("ReLaunchChapter");
    if (reLaunchChaptersElement) {
        reLaunchChaptersElement.innerHTML = `<b>${reLaunchCount}</b>`;
    }
}

// Debug function
function debugChapterCounts() {
    console.group('🔍 Chapter Status Debug');
    window.BNI.state.filteredChapters.forEach(chapter => {
        const originalStatus = chapter.chapter_status;
        const cleanedStatus = originalStatus.replace(/['"]+/g, '').toLowerCase().trim();
        console.log(`Chapter: ${chapter.chapter_name}, Original Status: ${originalStatus}, Cleaned Status: ${cleanedStatus}`);
    });
    
    const runningCount = window.BNI.state.filteredChapters.filter(chapter => {
        const status = chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim();
        return status === 'running';
    }).length;
    
    const preLaunchCount = window.BNI.state.filteredChapters.filter(chapter => {
        const status = chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim();
        return status === 'pre-launch';
    }).length;
    
    const reLaunchCount = window.BNI.state.filteredChapters.filter(chapter => {
        const status = chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim();
        return status === 're-launch';
    }).length;
    
    console.log('📊 Count Summary:');
    console.log('Running:', runningCount);
    console.log('Pre-Launch:', preLaunchCount);
    console.log('Re-Launch:', reLaunchCount);
    console.log('Total:', window.BNI.state.filteredChapters.length);
    console.groupEnd();
}

// Function to update all counts
function updateChapterCounts() {
    debugChapterCounts();
    updateRunningChaptersCount();
    updatePreLaunchChaptersCount();
    updateReLaunchChaptersCount();
}

// Move this function OUTSIDE displayChapters, so it can accept pre-fetched data
const calculateTotalAvailableFund = (chapterData, expenses, allOrders, allTransactions) => {
    try {
        // 1. Base available fund
        const available_fund = parseFloat(chapterData.available_fund) || 0;

        // 2. Paid Expenses
        let total_paid_expense = 0;
        if (Array.isArray(expenses)) {
            expenses.forEach((expense) => {
                if (expense.payment_status === "paid" && expense.chapter_id === chapterData.chapter_id) {
                    total_paid_expense += parseFloat(expense.amount) || 0;
                }
            });
        }

        // 3. Visitor Amount
        let visitorAmountTotal = 0;
        const visitorOrders = allOrders.filter(order => 
            order.chapter_id === chapterData.chapter_id && 
            order.payment_note === "visitor-payment"
        );
        visitorOrders.forEach(order => {
            const transaction = allTransactions.find(tran => 
                tran.order_id === order.order_id && 
                tran.payment_status === "SUCCESS"
            );
            if (transaction) {
                visitorAmountTotal += parseFloat(order.order_amount) || 0;
            }
        });

        // 4. Kitty Payments
        let ReceivedAmount = 0;
        const kittyBillIds = allOrders
            .filter(order => order.chapter_id === chapterData.chapter_id && order.universal_link_id === 4 && order.kitty_bill_id)
            .map(order => order.kitty_bill_id);
        const latestKittyBillId = kittyBillIds.length > 0 ? kittyBillIds[kittyBillIds.length - 1] : null;

        const kittyOrders = allOrders.filter(order => 
            order.chapter_id === chapterData.chapter_id &&
            order.universal_link_id === 4 &&
            (
                order.payment_note === "meeting-payments" ||
                order.payment_note === "meeting-payments-opening-only"
            ) &&
            (
                (latestKittyBillId ? order.kitty_bill_id === latestKittyBillId : true) ||
                order.kitty_bill_id === null
            )
        );
        kittyOrders.forEach(order => {
            const transaction = allTransactions.find(tran => 
                tran.order_id === order.order_id && 
                tran.payment_status === "SUCCESS"
            );
            if (transaction) {
                const payamount = Math.ceil(
                    parseFloat(transaction.payment_amount) -
                    (parseFloat(transaction.payment_amount) * 18) / 118
                );
                ReceivedAmount += parseFloat(payamount);
            }
        });

        // 5. Final Calculation
        const totalAvailable = parseFloat(available_fund) - 
                             parseFloat(total_paid_expense) + 
                             parseFloat(visitorAmountTotal) +
                             parseFloat(ReceivedAmount);

        return totalAvailable;
    } catch (error) {
        return parseFloat(chapterData.available_fund) || 0;
    }
};

// Update displayChapters to fetch all data once and process in-memory
async function displayChapters(chapters) {
    console.log("📊 Displaying chapters:", chapters);
    const tableBody = document.getElementById("chaptersTableBody");
    const totalEntries = chapters.length;

    // Update total entries display and counters
    document.getElementById("totalEntries").textContent = totalEntries;
    document.getElementById("total-chapters-count").textContent = totalEntries;

    // Update total members count
    fetch('http://localhost:5000/api/members')
        .then(response => response.json())
        .then(members => {
            const activeMembersCount = members.filter(member => member).length;
            document.getElementById("memberTotal").innerHTML = `<b>${activeMembersCount}</b>`;
        })
        .catch(error => {
            console.error('❌ Error fetching members:', error);
            document.getElementById("memberTotal").innerHTML = '<b>0</b>';
        });

    // Fetch all required data ONCE
    const [expenses, allOrders, allTransactions] = await Promise.all([
        fetch("http://localhost:5000/api/allExpenses").then(r => r.json()),
        fetch("http://localhost:5000/api/allOrders").then(r => r.json()),
        fetch("http://localhost:5000/api/allTransactions").then(r => r.json())
    ]);

    // Calculate pagination
    const start = (currentPage - 1) * entriesPerPage;
    const end = showingAll ? chapters.length : start + entriesPerPage;
    const chaptersToShow = showingAll ? chapters : chapters.slice(start, end);

    // Update showing entries text
    document.getElementById("showingStart").textContent = chapters.length > 0 ? start + 1 : 0;
    document.getElementById("showingEnd").textContent = end;

    // Clear existing table content
    tableBody.innerHTML = "";

    // Reset counters
    let active_total = 0;
    let inactive_total = 0;

    // Display chapters
    for (const chapter of chaptersToShow) {
        const membersCount = getMemberCountForChapter(chapter.chapter_id);
        const regionName = getRegionNameById(chapter.region_id);

        // Update status counters
        const cleanStatus = chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim();
        if(cleanStatus === 'running') {
            active_total++;
        } else {
            inactive_total++;
        }

        // Calculate total available fund (now in-memory, no await)
        const totalAvailable = calculateTotalAvailableFund(chapter, expenses, allOrders, allTransactions);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="border: 1px solid grey;">${showingAll ? chapters.indexOf(chapter) + 1 : start + chapters.indexOf(chapter) + 1}</td>
            <td style="border: 1px solid grey;">
                <a href="javascript:void(0);" onclick="handleChapterAccess('${chapter.chapter_id}', '${chapter.email_id}');" class="chapter-link">
                    <b>${chapter.chapter_name}</b>
                </a>
            </td>
            <td style="border: 1px solid grey;">${regionName}</td>
            <td style="border: 1px solid grey;"><b>${membersCount}</b></td>
            <td style="border: 1px solid grey;"><b>₹${totalAvailable.toLocaleString('en-IN')}</b></td>
            <td style="border: 1px solid grey;">${chapter.chapter_meeting_day || 'N/A'}</td>
            <td style="border: 1px solid grey;"><b>₹${chapter.chapter_kitty_fees || '0'}</b></td>
            <td style="border: 1px solid grey;"><b>₹${chapter.chapter_visitor_fees || '0'}</b></td>
            <td style="border: 1px solid grey;"><b>${chapter.kitty_billing_frequency || 'N/A'}</b></td>
            <td style="border: 1px solid grey;">
                <span class="badge bg-${
                    cleanStatus === 'running' ? 'success' :
                    cleanStatus === 'pre-launch' ? 'warning' :
                    cleanStatus === 're-launch' ? 'info' :
                    'secondary'
                }">
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
    }

    // Update status counters display
    document.getElementById("RunningChapter").innerHTML = `<b>${active_total}</b>`;
    document.getElementById("PreLaunchChapter").innerHTML = `<b>${
        chapters.filter(chapter => 
            chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim() === 'pre-launch'
        ).length
    }</b>`;
    document.getElementById("ReLaunchChapter").innerHTML = `<b>${
        chapters.filter(chapter => 
            chapter.chapter_status.replace(/['"]+/g, '').toLowerCase().trim() === 're-launch'
        ).length
    }</b>`;

    // Update pagination if needed
    if (!showingAll) {
        const totalPages = Math.ceil(totalEntries / entriesPerPage);
        updatePagination(totalPages);
    }
}

// Function to populate filter dropdowns
function populateFilters() {
    console.log('🔄 Starting to populate filters...');

    // Get unique regions from the chapters data
    const uniqueRegions = [...new Set(window.BNI.state.allChapters.map(chapter => {
        const regionName = getRegionNameById(chapter.region_id);
        console.log(`📍 Found region: ${regionName} for chapter: ${chapter.chapter_name}`);
        return regionName;
    }))].sort();

    console.log('📋 Unique regions found:', uniqueRegions);

    // Populate region filter with actual regions from data
    const regionFilter = document.getElementById("region-filter");
    regionFilter.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-value="all">All Regions</a></li>
        ${uniqueRegions.map(region => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${region}">${region}</a></li>
        `).join('')}
    `;

    // Populate meeting day filter
    const meetingDayFilter = document.getElementById("meeting-day-filter");
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    meetingDayFilter.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-value="all">All Days</a></li>
        ${days.map(day => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${day}">${day}</a></li>
        `).join('')}
    `;

    // Populate chapter status filter
    const statusFilter = document.getElementById("chapter-status-filter");
    const statuses = ['running', 'pre-launch'];
    statusFilter.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-value="all">All Status</a></li>
        ${statuses.map(status => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </a></li>
        `).join('')}
    `;

    console.log('✅ Filters populated successfully');
}

// Function to apply filters
function applyFilters() {
    const { region, meetingDay, chapterStatus } = window.BNI.state.filters;
    console.log('🔍 Starting filter application:', { region, meetingDay, chapterStatus });
    
    // Create a Set to track unique chapter IDs
    const seenChapterIds = new Set();
    
    window.BNI.state.filteredChapters = window.BNI.state.allChapters.filter(chapter => {
        // Check if we've already seen this chapter
        if (seenChapterIds.has(chapter.chapter_id)) {
            console.log(`🔄 Skipping duplicate chapter: ${chapter.chapter_name}`);
            return false;
        }
        
        // Get clean values
        const chapterMeetingDay = (chapter.chapter_meeting_day || '').trim();
        const cleanStatus = (chapter.chapter_status || '').replace(/['"]+/g, '').trim().toLowerCase();
        const chapterRegion = getRegionNameById(chapter.region_id);
        
        // Set match conditions
        const matchesMeetingDay = meetingDay === 'all' || chapterMeetingDay === meetingDay;
        const matchesStatus = chapterStatus === 'all' || cleanStatus === chapterStatus.toLowerCase();
        const matchesRegion = !region || region === 'all' || chapterRegion === region;

        console.log(`Checking ${chapter.chapter_name}:`, {
            meeting: { has: chapterMeetingDay, want: meetingDay, matches: matchesMeetingDay },
            status: { has: cleanStatus, want: chapterStatus, matches: matchesStatus },
            region: { has: chapterRegion, want: region, matches: matchesRegion }
        });

        // If chapter matches all conditions, add to seen set and return true
        if (matchesMeetingDay && matchesStatus && matchesRegion) {
            seenChapterIds.add(chapter.chapter_id);
            return true;
        }

        return false;
    });

    console.log(`✅ Found ${window.BNI.state.filteredChapters.length} unique matching chapters`);
    
    if (window.BNI.state.filteredChapters.length === 0) {
        console.log('❌ No entries match the applied filters');
        const tableBody = document.getElementById("chaptersTableBody");
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">No entries match the applied filters</td></tr>';
        }
    } else {
        displayChapters(window.BNI.state.filteredChapters);
    }
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

document.getElementById("apply-filters-btn")?.addEventListener("click", () => {
    applyFilters();
});

document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    // Reset filter state
    window.BNI.state.filters.region = 'all';
    window.BNI.state.filters.meetingDay = 'all';
    window.BNI.state.filters.chapterStatus = 'all';
    
    // Reset dropdown texts
    document.querySelector('#region-filter').closest('.dropdown').querySelector('.dropdown-toggle').textContent = 'Region';
    document.querySelector('#meeting-day-filter').closest('.dropdown').querySelector('.dropdown-toggle').textContent = 'Meeting Day';
    document.querySelector('#chapter-status-filter').closest('.dropdown').querySelector('.dropdown-toggle').textContent = 'Chapter Status';
    
    // Reset filtered chapters to all chapters
    window.BNI.state.filteredChapters = [...window.BNI.state.allChapters];
    displayChapters(window.BNI.state.filteredChapters);
});

// Add event listener for sort options
document.getElementById("sort-name-filter")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("sort-option")) {
        const sortOrder = event.target.dataset.sort;
        console.log('🔄 Starting chapter name sorting:', sortOrder);

        // Sort the chapters array
        window.BNI.state.filteredChapters.sort((a, b) => {
            // Extract chapter names, convert to lowercase and remove leading/trailing spaces
            const nameA = (a.chapter_name || '').toLowerCase().trim();
            const nameB = (b.chapter_name || '').toLowerCase().trim();
            
            console.log(`Comparing: ${nameA} with ${nameB}`);

            // Handle null/undefined/empty chapter names
            if (!nameA && !nameB) return 0;
            if (!nameA) return 1;
            if (!nameB) return -1;

            // Simple alphabetical comparison
            if (sortOrder === 'asc') {
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            } else {
                if (nameA < nameB) return 1;
                if (nameA > nameB) return -1;
                return 0;
            }
        });

        console.log('✅ Sorting complete. First few chapters:', 
            window.BNI.state.filteredChapters.slice(0, 3).map(c => c.chapter_name)
        );

        // Update dropdown text
        event.target.closest('.dropdown').querySelector('.dropdown-toggle').textContent = 
            `Sort By Name: ${sortOrder === 'asc' ? 'A to Z' : 'Z to A'}`;

        // Display sorted chapters
        displayChapters(window.BNI.state.filteredChapters);
    }
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
        updateChapterCounts();

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
                const response = await fetch(`http://localhost:5000/api/deleteChapter/${chapterId}`, {
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

// Add sorting icons to table headers
document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('th[scope="col"]');
    headers.forEach(header => {
        // Skip Actions column
        if (header.textContent !== 'Actions') {
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
function sortChapters(columnIndex, ascending = true) {
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
            case 3: // No's of Members
                // Numeric sorting
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
                console.log(`Numeric comparison: ${aValue} vs ${bValue}`);
                return ascending ? aValue - bValue : bValue - aValue;

            case 4: // Available Fund
            case 6: // Chapter Kitty Fees
            case 7: // Chapter Visitor Fees
                // Currency sorting (remove ₹ and convert to number)
                aValue = parseFloat(aValue.replace('₹', '').replace(/,/g, '')) || 0;
                bValue = parseFloat(bValue.replace('₹', '').replace(/,/g, '')) || 0;
                console.log(`Currency comparison: ${aValue} vs ${bValue}`);
                return ascending ? aValue - bValue : bValue - aValue;

            case 1: // Chapter Name
            case 2: // Chapter Region
            case 5: // Chapter Meeting Day
            case 8: // Kitty Billing Type
            case 9: // Status
                // Alphabetical sorting
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
            chapterName: row.cells[1].textContent,
            region: row.cells[2].textContent,
            members: row.cells[3].textContent,
            fund: row.cells[4].textContent,
            status: row.cells[9].textContent
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
    sortChapters(columnIndex, newDirection);
});

// Update pagination function
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
            displayChapters(window.BNI.state.filteredChapters);
        };
        container.appendChild(pageItem);
    }
    
    // Update prev/next buttons
    prevBtn.classList.toggle('disabled', currentPage === 1);
    nextBtn.classList.toggle('disabled', currentPage === totalPages);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Show All button handler
    document.getElementById("showAllBtn").addEventListener('click', function() {
        showingAll = !showingAll;
        this.textContent = showingAll ? "Show Less" : "Show All";
        currentPage = 1;
        displayChapters(window.BNI.state.filteredChapters);
    });

    // Previous page handler
    document.getElementById("prevPage").addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayChapters(window.BNI.state.filteredChapters);
        }
    });

    // Next page handler
    document.getElementById("nextPage").addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            displayChapters(window.BNI.state.filteredChapters);
        }
    });
});
