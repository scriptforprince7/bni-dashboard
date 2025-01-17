// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.endpoints = {
    chapters: "https://bni-data-backend.onrender.com/api/chapters",
    regions: "https://bni-data-backend.onrender.com/api/regions",
    members: "https://bni-data-backend.onrender.com/api/members"
};

// Use window.BNI namespace for other global variables
window.BNI.state = window.BNI.state || {
    allChapters: [],
    filteredChapters: [],
    allMembers: [],
    allRegions: []
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

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <a href="/c/view-chapter/?chapter_id=${chapter.chapter_id}">
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
    });
};

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