const accoladesApiUrl = "https://backend.bninewdelhi.com/api/accolades";
const membersApiUrl = "https://backend.bninewdelhi.com/api/members";
let allMembers = [];
let allAccolades = [];
let selectedAccolades = [];
let currentChapterId = null;

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
  const response = await fetch(accoladesApiUrl);
  allAccolades = await response.json();

  const filterDropdown = document.getElementById("accolades-filter");
  filterDropdown.innerHTML = allAccolades
    .map(
      (accolade) => `
      <li>
        <label class="dropdown-item">
          <input type="checkbox" value="${accolade.accolade_id}" /> ${accolade.accolade_name}
        </label>
      </li>`
    )
    .join("");

  setupFilterListener();
}

// Add new function to get chapter details
async function getCurrentChapterDetails() {
    try {
        const loginType = getUserLoginType();
        console.log('👤 Login type:', loginType);

        let chapterEmail, chapterId;

        if (loginType === 'ro_admin') {
            // For RO admin, get from localStorage
            chapterEmail = localStorage.getItem('current_chapter_email');
            chapterId = localStorage.getItem('current_chapter_id');
            console.log('🔐 RO Admin - Chapter details from localStorage:', {
                chapterEmail,
                chapterId
            });

            if (chapterId) {
                return {
                    chapter_id: parseInt(chapterId),
                    email_id: chapterEmail
                };
            }
        } else {
            // For chapter login, get from token
            chapterEmail = getUserEmail();
            console.log('🔑 Chapter email from token:', chapterEmail);

            const response = await fetch('https://backend.bninewdelhi.com/api/chapters');
            const chapters = await response.json();
            console.log('📚 All chapters:', chapters);

            const currentChapter = chapters.find(chapter =>
              chapter.email_id === chapterEmail ||
              chapter.vice_president_mail === chapterEmail ||
              chapter.president_mail === chapterEmail ||
              chapter.treasurer_mail === chapterEmail
          );
          
            console.log('🎯 Matched chapter:', currentChapter);

            if (currentChapter) {
                return currentChapter;
            }
        }

        console.error('❌ No chapter found');
        return null;

    } catch (error) {
        console.error('❌ Error fetching chapter details:', error);
        return null;
    }
}

// Modify loadMembers function
async function loadMembers() {
    try {
        showLoader();

        // First get chapter details
        const chapterDetails = await getCurrentChapterDetails();
        if (!chapterDetails) {
            throw new Error('Unable to determine current chapter');
        }

        currentChapterId = chapterDetails.chapter_id;
        console.log('📍 Current chapter ID:', currentChapterId);

        // Fetch all members
        const response = await fetch(membersApiUrl);
        const allMembersData = await response.json();
        console.log('👥 All members:', allMembersData);

        // Filter members by chapter_id
        allMembers = allMembersData.filter(member => member.chapter_id === currentChapterId);
        console.log('👥 Filtered members for chapter:', allMembers);

        renderTable(allMembers);
    } catch (error) {
        console.error('❌ Error in loadMembers:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load members data'
        });
    } finally {
        hideLoader();
    }
}

// Update renderTable function to include chapter info in logs
const renderTable = (members) => {
    console.log(`🎨 Rendering table for chapter ${currentChapterId} with ${members.length} members`);
    
    const tableBody = document.getElementById("chaptersTableBody");
    tableBody.innerHTML = members
        .map((member, index) => {
            console.log(`📊 Processing member ${member.member_first_name} with ${member.accolades_id.length} accolades`);
            
            const memberName = `${member.member_first_name} ${member.member_last_name}`;
            const accoladeDetails = member.accolades_id.map(id => {
                const accolade = allAccolades.find(a => a.accolade_id === Number(id));
                return accolade ? { 
                    name: accolade.accolade_name, 
                    date: accolade.accolade_publish_date || 'Unknown Date' 
                } : null;
            }).filter(Boolean);
            
            console.log(`🏆 Accolades for ${memberName}:`, accoladeDetails);

            const accoladeCount = accoladeDetails.length;
            const accoladeInfo = accoladeDetails.map(acc => `<li>${acc.name} (Issued: ${acc.date})</li>`).join('');

            const statusBadge =
                member.member_status === "active"
                    ? `<span class="badge bg-success">Active</span>`
                    : `<span class="badge bg-danger">Inactive</span>`;

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><b>${memberName}</b></td>
                    <td>
                        <span class="accolade-count" data-member="${memberName}" data-info="${accoladeInfo}">
                            ${accoladeCount} Accolade(s)
                        </span>
                    </td>
                    <td>${statusBadge}</td>
                </tr>`;
        })
        .join("");

    setupModalListener();
};

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

// Handle filter changes
function setupFilterListener() {
  document.querySelectorAll("#accolades-filter input").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const accoladeId = Number(e.target.value);

      if (e.target.checked) {
        selectedAccolades.push(accoladeId);
      } else {
        selectedAccolades = selectedAccolades.filter((id) => id !== accoladeId);
      }

      filterMembers();
    });
  });
}

// Reset button functionality
document.getElementById("reset-filters-btn").addEventListener("click", () => {
    // Clear selected checkboxes
    document.querySelectorAll("#accolades-filter input").forEach((checkbox) => {
      checkbox.checked = false;
    });
  
    // Reset selected accolades
    selectedAccolades = [];
  
    // Reload all members
    renderTable(allMembers);
  });
  

// Filter members based on selected accolades
function filterMembers() {
  const filteredMembers = allMembers.filter((member) =>
    selectedAccolades.every((accId) => member.accolades_id.includes(accId))
  );

  renderTable(filteredMembers.length ? filteredMembers : allMembers);
}

// Show Popup with Accolade Details
function showAccoladePopup(target) {
  const memberName = target.getAttribute("data-member");
  const accoladeName = target.getAttribute("data-accolade");
  const issueDate = target.getAttribute("data-date");

  // Fill modal content
  document.getElementById("modalTitle").textContent = `${memberName}'s Accolade`;
  document.getElementById("modalBody").innerHTML = `
    <p><strong>Member:</strong> ${memberName}</p>
    <p><strong>Accolade:</strong> ${accoladeName}</p>
    <p><strong>Issued Date:</strong> ${issueDate}</p>
  `;

  // Show the Bootstrap Modal
  const accoladeModal = new bootstrap.Modal(document.getElementById("accoladeModal"));
  accoladeModal.show();
}

// Search members by name
document.getElementById("searchMember").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredMembers = allMembers.filter((member) => {
      const fullName = `${member.member_first_name} ${member.member_last_name}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
  
    renderTable(filteredMembers);
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
