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
    // Get a random member from the demo data
    const demoMember = {
        member_first_name: "Raja",
        member_last_name: "Shukla",
        member_email_address: "rajashukla@outlook.com",
        member_company_name: "NATIONAL MARKETING PROJECTS INC",
        category_name: "IT"
    };

    Swal.fire({
        title: '<span style="color: #2563eb"><i class="ri-award-fill"></i> Accolade Request Review</span>',
        html: `
            <div class="member-details" style="text-align: left; padding: 20px;">
                <div class="detail-row" style="margin-bottom: 20px;">
                    <i class="ri-user-fill" style="color: #2563eb"></i>
                    <strong>Member Name:</strong> 
                    <span style="color: #1e293b; font-size: 1.1em;">
                        ${demoMember.member_first_name} ${demoMember.member_last_name}
                    </span>
                </div>
                
                <div class="detail-row" style="margin-bottom: 20px;">
                    <i class="ri-building-fill" style="color: #2563eb"></i>
                    <strong>Company:</strong> 
                    <span style="color: #1e293b">${demoMember.member_company_name}</span>
                </div>

                <div class="detail-row" style="margin-bottom: 20px;">
                    <i class="ri-mail-fill" style="color: #2563eb"></i>
                    <strong>Email:</strong> 
                    <span style="color: #1e293b">${demoMember.member_email_address}</span>
                </div>

                <div class="accolade-info" style="
                    margin: 25px 0;
                    padding: 15px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #2563eb;
                ">
                    <div style="margin-bottom: 10px;">
                        <i class="ri-award-line" style="color: #2563eb"></i>
                        <strong>Requested Accolade:</strong> 
                        <span style="color: #1e293b">${accolade.accolade_name}</span>
                    </div>
                    <div>
                        <i class="ri-folder-info-line" style="color: #2563eb"></i>
                        <strong>Category:</strong> 
                        <span style="color: #1e293b">${demoMember.category_name}</span>
                    </div>
                </div>

                <div class="approval-section" style="margin: 20px 0;">
                    <label style="display: block; margin-bottom: 10px; color: #1e293b;">
                        <i class="ri-checkbox-circle-line" style="color: #2563eb"></i>
                        <strong>Approval Status:</strong>
                    </label>
                    <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="approval_status" value="approved">
                            <span style="color: #059669">
                                <i class="ri-checkbox-circle-fill"></i> Approve
                            </span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="approval_status" value="rejected">
                            <span style="color: #dc2626">
                                <i class="ri-close-circle-fill"></i> Reject
                            </span>
                        </label>
                    </div>
                </div>

                <div class="comment-section">
                    <label style="display: block; margin-bottom: 8px; color: #1e293b;">
                        <i class="ri-chat-3-line" style="color: #2563eb"></i>
                        <strong>Leave your comment:</strong>
                    </label>
                    <textarea id="accolade-comment" 
                            class="form-control" 
                            style="width: 100%; min-height: 80px; border-radius: 8px; padding: 10px;"
                            placeholder="Enter your comment here..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="ri-check-line"></i> Submit Review',
        cancelButtonText: '<i class="ri-close-line"></i> Cancel',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#dc2626',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            const status = document.querySelector('input[name="approval_status"]:checked')?.value;
            const comment = document.getElementById('accolade-comment').value;

            if (!status) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Selection Required',
                    text: 'Please select either Approve or Reject.',
                    confirmButtonColor: '#2563eb'
                });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Review Submitted!',
                text: `Accolade has been ${status} successfully!`,
                confirmButtonColor: '#2563eb'
            });
        }
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
