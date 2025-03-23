const accoladesApiUrl = "https://backend.bninewdelhi.com/api/accolades";
const membersApiUrl = "https://backend.bninewdelhi.com/api/members";
let allMembers = [];
let allAccolades = [];
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

// Render table based on member data
function renderTable(members) {
  const tableBody = document.getElementById("chaptersTableBody");
  tableBody.innerHTML = members
    .map((member, index) => {
      const memberName = `${member.member_first_name} ${member.member_last_name}`;
      const memberAccolades = member.accolades_id
        .map((id) => {
          const accolade = allAccolades.find((a) => a.accolade_id === id);
          return accolade
            ? `<span class="accolade-link" data-member="${memberName}" data-accolade="${accolade.accolade_name}" data-date="2024-10-10">${accolade.accolade_name}</span>`
            : `<span class="text-danger">Unknown Accolade</span>`;
        })
        .join(", ");

      const statusBadge =
        member.member_status === "active"
          ? `<span class="badge bg-success">Active</span>`
          : `<span class="badge bg-danger">Inactive</span>`;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${memberName}</td>
          <td>${memberAccolades || "No Accolades"}</td>
          <td>${statusBadge}</td>
        </tr>`;
    })
    .join("");

  setupModalListener();
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

// Load everything
loadEverything();
