const accoladesApiUrl = "https://bni-data-backend.onrender.com/api/accolades";
const membersApiUrl = "https://backend.bninewdelhi.com/api/members";
const chaptersApiUrl = "https://backend.bninewdelhi.com/api/chapters";

let allMembers = [];
let allAccolades = [];
let allChapters = [];
let selectedAccolades = [];

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

// Fetch members data
async function loadMembers() {
  const response = await fetch(membersApiUrl);
  allMembers = await response.json();
  renderTable(allMembers);
}

// Add function to fetch chapters
async function loadChapters() {
    const response = await fetch(chaptersApiUrl);
    allChapters = await response.json();
}

// Function to get random accolades
function getRandomAccolades(count = 5) {
    const shuffled = [...allAccolades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Add function to handle accolade click
function handleAccoladeClick(accolade) {
    // Demo data - this will be replaced with real data later
    const requestDetails = {
        accolade_name: accolade.accolade_name,
        member_name: "Raja Shukla",
        chapter_name: "BNI Amigos",
        request_date: "2024-03-15",
        reason: "Professional Achievement",
        type: accolade.accolade_type,
        chapter_comment: "Excellent performance in leadership role",
        status: "Pending",
        ro_comment: "Under review",
        issued_date: "-",
        given_date: "-",
        requested_by: "Chapter President"
    };

    Swal.fire({
        title: '<span style="color: #2563eb"><i class="ri-file-list-3-line"></i> Accolade Request Details</span>',
        html: `
            <div class="request-details-container" style="
                max-height: 70vh;
                overflow-y: auto;
                padding: 20px;
                background: #ffffff;
                border-radius: 12px;
            ">
                <div class="details-grid" style="
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    text-align: left;
                ">
                    <!-- Accolade Name -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-award-line"></i> Accolade
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.accolade_name}
                        </div>
                    </div>

                    <!-- Member Name -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-user-line"></i> Member
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.member_name}
                        </div>
                    </div>

                    <!-- Chapter Name -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-building-line"></i> Chapter
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.chapter_name}
                        </div>
                    </div>

                    <!-- Request Date -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-calendar-line"></i> Request Date
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.request_date}
                        </div>
                    </div>

                    <!-- Reason -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-file-text-line"></i> Reason
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.reason}
                        </div>
                    </div>

                    <!-- Type -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-price-tag-3-line"></i> Type
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.type}
                        </div>
                    </div>

                    <!-- Chapter Comment -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                        grid-column: span 2;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-chat-1-line"></i> Chapter Comment
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.chapter_comment}
                        </div>
                    </div>

                    <!-- Status -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-checkbox-circle-line"></i> Status
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            <span class="badge" style="
                                background: #fef3c7;
                                color: #92400e;
                                padding: 4px 8px;
                                border-radius: 9999px;
                                font-size: 0.75rem;
                            ">
                                ${requestDetails.status}
                            </span>
                        </div>
                    </div>

                    <!-- RO Comment -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                        grid-column: span 2;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-chat-2-line"></i> RO Comment
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.ro_comment}
                        </div>
                    </div>

                    <!-- Dates and Requested By -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-calendar-check-line"></i> Issued/Given Date
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.issued_date} / ${requestDetails.given_date}
                        </div>
                    </div>

                    <!-- Requested By -->
                    <div class="detail-item" style="
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    ">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                            <i class="ri-user-star-line"></i> Requested By
                        </div>
                        <div style="color: #1e293b; font-weight: 500;">
                            ${requestDetails.requested_by}
                        </div>
                    </div>
                </div>
            </div>
        `,
        width: '800px',
        showCloseButton: true,
        showConfirmButton: false
    });
}

// Update the renderTable function to make accolades clickable
const renderTable = () => {
    const tableBody = document.getElementById("chaptersTableBody");
    
    tableBody.innerHTML = allChapters
        .map((chapter, index) => {
            const randomAccolades = getRandomAccolades();
            const accoladesHtml = randomAccolades
                .map(accolade => `
                    <div class="accolade-item" 
                         onclick="handleAccoladeClick(${JSON.stringify(accolade).replace(/"/g, '&quot;')})"
                         style="
                            margin-bottom: 8px;
                            padding: 8px;
                            border-left: 3px solid #2563eb;
                            background: linear-gradient(to right, #f8fafc, transparent);
                            border-radius: 4px;
                            transition: all 0.3s ease;
                            cursor: pointer;
                    ">
                        <span class="accolade-badge" style="
                            background: ${accolade.accolade_type === 'Global' ? '#4f46e5' : '#e11d48'};
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 0.75rem;
                            color: white;
                            margin-right: 8px;
                        ">
                            ${accolade.accolade_type}
                        </span>
                        <span style="font-weight: 500; color: #1e293b;">
                            ${accolade.accolade_name}
                        </span>
                    </div>
                `).join('');

            return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        ${index + 1}
                    </td>
                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        ${chapter.chapter_name}
                    </td>
                    <td style="padding: 16px;">
                        <div class="accolades-container" style="
                            max-width: 500px;
                        ">
                            ${accoladesHtml}
                        </div>
                    </td>
                    <td style="font-weight: bold; padding: 16px;">
                        <span class="badge" style="
                            background: #fef3c7;
                            color: #92400e;
                            padding: 6px 12px;
                            border-radius: 9999px;
                            font-weight: 500;
                            font-size: 0.875rem;
                        ">
                            Pending
                        </span>
                    </td>
                </tr>`;
        })
        .join("");
};

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
    renderTable();
  });
  

// Filter members based on selected accolades
function filterMembers() {
  const filteredMembers = allMembers.filter((member) =>
    selectedAccolades.every((accId) => member.accolades_id.includes(accId))
  );

  renderTable();
}

// Set up the modal listener to show accolade details
function setupModalListener() {
  document.querySelectorAll(".accolade-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showAccoladePopup(e.target);
    });
  });
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
  
    renderTable();
  });
  

// Update loadEverything function
async function loadEverything() {
    try {
        showLoader();
        await Promise.all([
            loadChapters(),
            loadAccolades()
        ]);
        renderTable();
    } catch (error) {
        console.error("Error loading data:", error);
    } finally {
        hideLoader();
    }
}

// Load everything
loadEverything();
