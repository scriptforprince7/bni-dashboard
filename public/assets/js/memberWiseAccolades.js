const accoladesApiUrl = "http://localhost:5000/api/accolades";
const membersApiUrl = "http://localhost:5000/api/members";
let allMembers = [];
let allAccolades = [];
let selectedAccolades = [];
let currentChapterId = null;
let filteredMemberAccolades = [];

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Fetch all accolades and populate the filter dropdown
async function loadAccolades() {
    try {
        const response = await fetch(accoladesApiUrl);
        allAccolades = await response.json();

        const filterDropdown = document.getElementById("accolades-filter");
        filterDropdown.innerHTML = allAccolades
            .map(accolade => `
                <li>
                    <label class="dropdown-item">
                        <input type="checkbox" 
                               value="${accolade.accolade_id}" 
                               class="me-2"
                               id="accolade-${accolade.accolade_id}"/>
                        ${accolade.accolade_name}
                    </label>
                </li>
            `).join("");

        setupFilterListener();
    } catch (error) {
        console.error('❌ Error loading accolades:', error);
    }
}

// Function to get chapter details
async function getCurrentChapterDetails() {
    try {
        const loginType = getUserLoginType();
        console.log('👤 Login type:', loginType);

        let chapterEmail, chapterId;

        if (loginType === 'ro_admin') {
            chapterEmail = localStorage.getItem('current_chapter_email');
            chapterId = localStorage.getItem('current_chapter_id');
            console.log('🔐 RO Admin - Chapter details:', { chapterEmail, chapterId });

            if (chapterId) {
                return parseInt(chapterId);
            }
        } else {
            chapterEmail = getUserEmail();
            console.log('🔑 Chapter email from token:', chapterEmail);

            const response = await fetch('http://localhost:5000/api/chapters');
            const chapters = await response.json();
            
            const currentChapter = chapters.find(chapter =>
                chapter.email_id === chapterEmail ||
                chapter.vice_president_mail === chapterEmail ||
                chapter.president_mail === chapterEmail ||
                chapter.treasurer_mail === chapterEmail
            );

            if (currentChapter) {
                return currentChapter.chapter_id;
            }
        }

        throw new Error('No chapter found');

    } catch (error) {
        console.error('❌ Error getting chapter details:', error);
        return null;
    }
}

// Modified function to get all member accolades at once
async function getAllMemberAccolades() {
    try {
        const response = await fetch('http://localhost:5000/api/getAllMemberAccolades');
        const allMemberAccolades = await response.json();
        console.log(`📊 Fetched all member accolades:`, allMemberAccolades.length);
        return allMemberAccolades;
    } catch (error) {
        console.error('❌ Error fetching member accolades:', error);
        return [];
    }
}

// Modified loadMembers function
async function loadMembers() {
    try {
        showLoader();

        // Get chapter ID first
        currentChapterId = await getCurrentChapterDetails();
        if (!currentChapterId) {
            throw new Error('Unable to determine current chapter');
        }

        // Fetch all data in parallel
        const [membersResponse, accoladesResponse, allMemberAccolades] = await Promise.all([
            fetch(membersApiUrl),
            fetch(accoladesApiUrl),
            getAllMemberAccolades()
        ]);

        const [allMembersData, accoladesData] = await Promise.all([
            membersResponse.json(),
            accoladesResponse.json()
        ]);
        
        // Filter members by chapter_id
        allMembers = allMembersData.filter(member => member.chapter_id === currentChapterId);
        allAccolades = accoladesData;
        filteredMemberAccolades = allMemberAccolades; // Store all member accolades

        console.log('👥 Chapter members:', allMembers);
        console.log('🏆 All accolades loaded:', allAccolades);

        // Render table with all data
        renderTable(allMembers, allMemberAccolades);
        
        // Setup search after data is loaded
        setupSearch();

    } catch (error) {
        console.error('❌ Error loading members:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load members data'
        });
    } finally {
        hideLoader();
    }
}

// Modified renderTable function
function renderTable(members, allMemberAccolades) {
    const tableBody = document.getElementById("chaptersTableBody");
    tableBody.innerHTML = ''; // Clear existing content

    members.forEach((member, index) => {
        try {
            // Filter accolades for this member from the complete dataset
            const memberAccolades = allMemberAccolades.filter(ma => ma.member_id === member.member_id);
            
            // Map accolade details with full information
            const accoladeDetails = memberAccolades.map(ma => {
                const accolade = allAccolades.find(a => a.accolade_id === ma.accolade_id);
                if (accolade) {
                    return {
                        name: accolade.accolade_name,
                        issueDate: new Date(ma.issue_date).toLocaleDateString(),
                        givenDate: ma.given_date ? new Date(ma.given_date).toLocaleDateString() : 'Not Given',
                        count: ma.count || 1
                    };
                }
                return null;
            }).filter(Boolean);

            const memberName = `${member.member_first_name} ${member.member_last_name}`;
            const accoladeCount = accoladeDetails.length;
            
            // Create accolade info HTML
            const accoladeInfo = accoladeDetails.map(acc => 
                `<li>
                    ${acc.name} 
                    <br>
                    <small>Issued: ${acc.issueDate}</small>
                    <br>
                    <small>Given: ${acc.givenDate}</small>
                    <br>
                    <small>Count: ${acc.count}</small>
                </li>`
            ).join('');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><b>${memberName}</b></td>
                <td>
                    <span class="accolade-count" 
                          data-member="${memberName}" 
                          data-info="${accoladeInfo}"
                          style="cursor: pointer; color: #2563eb;">
                        ${accoladeCount} Accolade(s)
                    </span>
                </td>
                <td>
                    <span class="badge ${member.member_status === 'active' ? 'bg-success' : 'bg-danger'}">
                        ${member.member_status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
            `;
            
            tableBody.appendChild(row);
        } catch (error) {
            console.error(`❌ Error processing member ${member.member_id}:`, error);
        }
    });

    setupModalListener();
}

function setupModalListener() {
  document.querySelectorAll(".accolade-count").forEach((count) => {
    count.addEventListener("click", (e) => {
      const memberName = e.target.getAttribute("data-member");
      const accoladeInfo = e.target.getAttribute("data-info");

      document.getElementById("modalTitle").textContent = `${memberName}'s Accolades`;
      document.getElementById("modalBody").innerHTML =
        accoladeInfo && accoladeInfo !== "null"
          ? `<ul>${accoladeInfo}</ul>`
          : "<p>No accolades issued</p>";

      const accoladeModal = new bootstrap.Modal(document.getElementById("accoladeModal"));
      accoladeModal.show();
    });
  });
}

function showAccoladePopup(details) {
  document.getElementById("modalTitle").textContent = "Accolades Details";
  document.getElementById("modalBody").innerHTML = `<p>${details}</p>`;
  const accoladeModal = new bootstrap.Modal(document.getElementById("accoladeModal"));
  accoladeModal.show();
}

// Modified setupFilterListener function
function setupFilterListener() {
    const checkboxes = document.querySelectorAll("#accolades-filter input[type='checkbox']");
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const selectedAccolades = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => parseInt(cb.value));

            filterMembersByAccolades(selectedAccolades);
        });
    });
}

// New function to filter members by accolades
function filterMembersByAccolades(selectedAccoladeIds) {
    if (selectedAccoladeIds.length === 0) {
        // If no accolades selected, show all members with their accolades
        renderTable(allMembers, filteredMemberAccolades);
        return;
    }

    // Filter member accolades that match selected accolade IDs
    const matchingAccolades = filteredMemberAccolades.filter(ma => 
        selectedAccoladeIds.includes(ma.accolade_id)
    );

    // Get unique member IDs that have the selected accolades
    const matchingMemberIds = [...new Set(matchingAccolades.map(ma => ma.member_id))];

    // Filter members
    const filteredMembers = allMembers.filter(member => 
        matchingMemberIds.includes(member.member_id)
    );

    renderTable(filteredMembers, matchingAccolades);
}

// Modified search function
function setupSearch() {
    const searchInput = document.getElementById("searchMember");
    let searchTimeout;

    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        
        // Add debounce to prevent too many renders
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                renderTable(allMembers, filteredMemberAccolades);
                return;
            }

            const filteredMembers = allMembers.filter(member => {
                const fullName = `${member.member_first_name} ${member.member_last_name}`.toLowerCase();
                return fullName.includes(searchTerm);
            });

            renderTable(filteredMembers, filteredMemberAccolades);
        }, 300); // 300ms debounce
    });
}

// Modified reset filter function
document.getElementById("reset-filters-btn").addEventListener("click", () => {
    // Clear checkboxes
    document.querySelectorAll("#accolades-filter input[type='checkbox']").forEach(checkbox => {
        checkbox.checked = false;
    });

    // Clear search
    const searchInput = document.getElementById("searchMember");
    if (searchInput) {
        searchInput.value = '';
    }

    // Reset to original data
    renderTable(allMembers, filteredMemberAccolades);
});

// Ensure accolades load first, then members
async function loadEverything() {
    try {
      showLoader();
      await loadAccolades();
      await loadMembers();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      hideLoader();
    }
  }

// Update the initial load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing memberWiseAccolades.js');
    loadEverything();
});
