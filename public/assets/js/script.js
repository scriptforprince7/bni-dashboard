const apiUrl = 'https://bni-data-backend.onrender.com/api/members';
const chaptersApiUrl = 'https://bni-data-backend.onrender.com/api/chapters'; 
const regionsApiUrl = 'https://bni-data-backend.onrender.com/api/regions';
const categoriesApiUrl = 'https://bni-data-backend.onrender.com/api/memberCategory';
const accoladesApiUrl = 'https://bni-data-backend.onrender.com/api/accolades';
let chaptersMap = {};
let allMembers = []; 
let filteredMembers = []; 
let currentPage = 1; 
const entriesPerPage = 30; 
const regionsDropdown = document.getElementById("region-filter");
const chapterDropdown = document.getElementById("chapter-filter");
const membershipDropdown = document.getElementById("membership-filter");
const categoryDropdown = document.getElementById("category-filter");
const accoladesDropdown = document.getElementById("accolades-filter");
const statusDropdown = document.getElementById("status-filter");

function showLoader() { 
  document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Function to populate a dropdown
const populateDropdown = (
  dropdown,
  data,
  valueField,
  textField,
  defaultText
) => {
  // Clear the dropdown
  dropdown.innerHTML = "";

  // Add a default option
  dropdown.innerHTML += `
      <li>
        <a class="dropdown-item" href="javascript:void(0);" data-value="">
          ${defaultText}
        </a>
      </li>
    `;

  // Add options dynamically
  data.forEach((item) => {
    dropdown.innerHTML += `
          <li>
            <a class="dropdown-item" href="javascript:void(0);" data-value="${item[valueField]}">
              ${item[textField]}
            </a>
          </li>
        `;
  });

  // Attach event listeners
  attachDropdownListeners(dropdown);
};

// Function to attach event listeners to dropdown items
const attachDropdownListeners = (dropdown) => {
  const dropdownToggle = dropdown
    .closest(".dropdown")
    .querySelector(".dropdown-toggle");

  dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", () => {
      dropdown.querySelectorAll(".dropdown-item.active").forEach((activeItem) => {
        activeItem.classList.remove("active");
      });

      item.classList.add("active");
      const selectedValue = item.getAttribute("data-value");
      const selectedText = item.textContent.trim();

      if (dropdownToggle) {
        dropdownToggle.textContent = selectedText;
      }

      console.log(`Selected Value from ${dropdown.id}:`, selectedValue);
    });
  });
};

const populateRegionDropdown = async () => {
  try {
    showLoader();
    const response = await fetch(regionsApiUrl);
    if (!response.ok) throw new Error("Error fetching regions");

    const regions = await response.json();

    // Clear existing options
    regionsDropdown.innerHTML = "";

    // Add a default option
    regionsDropdown.innerHTML += `
      <li>
        <a class="dropdown-item" href="javascript:void(0);" data-value="">
          Select Region
        </a>
      </li>
    `;

    // Populate dropdown with region IDs and names
    regions.forEach((region) => {
      regionsDropdown.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${region.region_id}">
            ${region.region_name}
          </a>
        </li>
      `;
    });

    // Attach listeners after populating
    attachDropdownListeners(regionsDropdown);
  } catch (error) {
    console.error("Error populating regions dropdown:", error);
  } finally {
    hideLoader();
  }
};

// Call the function to populate the regions dropdown
populateRegionDropdown();

const populateChapterDropdown = async () => {
  try {
    showLoader();
    // Fetch chapters data
    const response = await fetch(chaptersApiUrl);
    if (!response.ok) throw new Error("Error fetching chapter");

    const chapters = await response.json(); // Assume the API returns an array of chapter objects

    // Clear existing options
    chapterDropdown.innerHTML = "";

    // Populate dropdown with unique chapter
    chapters.forEach((chapter) => {
      chapterDropdown.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${chapter.chapter_id}">
            ${chapter.chapter_name}
          </a>
        </li>
      `;
    });
    

    // Attach listeners after populating
    attachDropdownListeners(chapterDropdown);
  } catch (error) {
    console.error("Error populating chapters dropdown:", error);
  } finally {
    hideLoader();
  }
};
// Call the function to populate the chapter categories
populateChapterDropdown();

const populateCategoryDropdown = async () => {
  try {
    showLoader();
    // Fetch chapters data
    const response = await fetch(categoriesApiUrl);
    if (!response.ok) throw new Error("Error fetching chapter");

    const categories = await response.json(); // Assume the API returns an array of chapter objects

    // Clear existing options
    categoryDropdown.innerHTML = "";

    categories.forEach((category) => {
      categoryDropdown.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${category.category_id}">
            ${category.category_name}
          </a>
        </li>
      `;
    });
    

    // Attach listeners after populating all categories
    attachDropdownListeners(categoryDropdown);
  } catch (error) {
    console.error("Error populating chapters dropdown:", error);
  } finally {
    hideLoader();
  }
};
// Call the function to populate the chapter dropdown
populateCategoryDropdown();

const populateAccoladesDropdown = async () => {
  try {
    showLoader();
    // Fetch chapters data
    const response = await fetch(accoladesApiUrl);
    if (!response.ok) throw new Error("Error fetching chapter");

    const accolades = await response.json(); // Assume the API returns an array of chapter objects

    // Clear existing options
    accoladesDropdown.innerHTML = "";

    accolades.forEach((accolade) => {
      accoladesDropdown.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${accolade.accolade_id}">
            ${accolade.accolade_name}
          </a>
        </li>
      `;
    })

    // Attach listeners after populating all accolades
    attachDropdownListeners(accoladesDropdown);
  } catch (error) {
    console.error("Error populating chapters dropdown:", error);
  } finally {
    hideLoader();
  }
};
// Call the function to populate the accolade dropdown
populateAccoladesDropdown();

const populateMembershipDropdown = async () => {
  try {
    showLoader();
    // Fetch membership data
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Error fetching membershi[");

    const memberships = await response.json(); // Assume the API returns an array of chapter objects

    // Extract unique membership type
    const uniqueTypes = [
      ...new Set(memberships.map((membership) => membership.member_current_membership)),
    ];

    // Clear existing options
    membershipDropdown.innerHTML = "";

    // Populate dropdown with unique membership
    uniqueTypes.forEach((type) => {
      membershipDropdown.innerHTML += `<li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${type.toUpperCase()}">
                    ${type}
                </a>
            </li>`;
    });

    // Attach listeners after populating all membership
    attachDropdownListeners(membershipDropdown);
  } catch (error) {
    console.error("Error populating chapters dropdown:", error);
  } finally {
    hideLoader();
  }
};
// Call the function to populate the membership dropdown
populateMembershipDropdown();

const populateStatusDropdown = async () => {
  try {
    showLoader();
    // Fetch member status data
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Error fetching member current membership");

    const statuses = await response.json(); // Assume the API returns an array of members objects

    // Extract unique current membership type
    const uniqueTypes = [
      ...new Set(statuses.map((status) => status.member_status)),
    ];

    // Clear existing options
    statusDropdown.innerHTML = "";

    // Populate dropdown with unique current membership
    uniqueTypes.forEach((type) => {
      statusDropdown.innerHTML += `<li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${type.toUpperCase()}">
                    ${type}
                </a>
            </li>`;
    });

    // Attach listeners after populating all current membership
    attachDropdownListeners(statusDropdown);
  } catch (error) {
    console.error("Error populating chapters dropdown:", error);
  } finally {
    hideLoader();
  }
};
// Call the function to populate the membership dropdown
populateStatusDropdown();

// Function to check if there are any filters in the query parameters
function checkFiltersAndToggleResetButton() {
  const urlParams = new URLSearchParams(window.location.search);

  // Check if any query parameters exist (indicating filters are applied)
  if (urlParams.toString()) {
    // Show the Reset Filter button if filters are applied
    document.getElementById("reset-filters-btn").style.display = "inline-block";
  } else {
    // Hide the Reset Filter button if no filters are applied
    document.getElementById("reset-filters-btn").style.display = "none";
  }
}

// Call this function on page load to check the filters
window.addEventListener("load", checkFiltersAndToggleResetButton);

// Update the dropdown text and mark the item as active
const updateDropdownText = (dropdown, selectedValue) => {
  const selectedItem = dropdown.querySelector(`.dropdown-item[data-value="${selectedValue}"]`);
  const dropdownToggle = dropdown.closest('.dropdown').querySelector('.dropdown-toggle');

  if (selectedItem && dropdownToggle) {
    console.log(`Updating dropdown: ${dropdown.id}, selectedValue: ${selectedValue}`);  // Debugging line
    dropdownToggle.textContent = selectedItem.textContent.trim();

    dropdown.querySelectorAll('.dropdown-item').forEach((item) => {
      item.classList.remove('active');
    });
    selectedItem.classList.add('active');
  }
};

// Attach event listener to a "Filter" button or trigger
document.getElementById("apply-filters-btn").addEventListener("click", () => {
  const regionId = regionsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const chapterId = chapterDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const membershipYear = membershipDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const categoryId = categoryDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const accoladesId = accoladesDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const status = statusDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';

  const queryParams = new URLSearchParams();

  if (regionId) queryParams.append('region_id', regionId);
  if (chapterId) queryParams.append('chapter_id', chapterId);
  if (membershipYear) queryParams.append('membership_year', membershipYear);
  if (categoryId) queryParams.append('category_id', categoryId);
  if (accoladesId) queryParams.append('accolades_id', accoladesId);
  if (status) queryParams.append('status', status);

  const filterUrl = `/m/manage-members?${queryParams.toString()}`;
  window.location.href = filterUrl;
});


// On page load, check for any applied filters in the URL params
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);

  // Get the filter values from URL params
  const regionId = urlParams.get("region_id");
  const chapterId = urlParams.get("chapter_id");
  const membershipYear = urlParams.get("membership_year");
  const categoryId = urlParams.get("category_id");
  const accoladesId = urlParams.get("accolades_id");
  const status = urlParams.get("status");

  // Update the dropdowns with the selected filter values
  if (regionId) updateDropdownText(regionsDropdown, regionId);
  if (chapterId) updateDropdownText(chapterDropdown, chapterId);
  if (membershipYear) updateDropdownText(membershipDropdown, membershipYear); // Ensure chapter type is uppercased
  if (categoryId) updateDropdownText(categoryDropdown, categoryId); // Ensure chapter status is uppercased
  if (accoladesId) updateDropdownText(accoladesDropdown, accoladesId); // Ensure chapter status is uppercased
  if (status) updateDropdownText(statusDropdown, status); // Ensure chapter status is uppercased

  checkFiltersAndToggleResetButton();
});

// Attach event listener to "Reset Filter" button to clear query params
document.getElementById("reset-filters-btn").addEventListener("click", () => {
  // Clear all query parameters from the URL
  const url = new URL(window.location);
  url.search = ''; // Remove query parameters

  // Reload the page without filters (cleared query string)
  window.location.href = url.toString();
});

// Check for filters on page load
checkFiltersAndToggleResetButton();


async function fetchChapters() {
  try {
    const response = await fetch(chaptersApiUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const chapters = await response.json();
    chapters.forEach(chapter => {
      chaptersMap[chapter.chapter_id] = chapter.chapter_name;
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
  }
}

async function fetchMembers() {
  showLoader();
  try {
    await fetchChapters();
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    
    allMembers = await response.json(); 
    // Apply filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {
      // Get the filter values from URL params
        regionId : urlParams.get("region_id"),
        chapterId : urlParams.get("chapter_id"),
        membershipYear : urlParams.get("membership_year"),
        categoryId : urlParams.get("category_id"),
        accoladesId : urlParams.get("accolades_id"),
        status : urlParams.get("status"),
    };
    console.log("Filters from URL params:", filters);
    // Filter chapters based on the filters
    filteredMembers = allMembers.filter((member) => {
      return (
        (!filters.regionId || member.region_id === parseInt(filters.regionId)) &&
        (!filters.chapterId || member.chapter_id === parseInt(filters.chapterId)) &&
        (!filters.membershipYear || member.member_current_membership === filters.membershipYear) &&
        (!filters.categoryId || member.category_id === parseInt(filters.categoryId)) && 
        (!filters.accoladesId || (Array.isArray(member.accolades_id) && member.accolades_id.includes(parseInt(filters.accoladesId)))) &&
        (!filters.status || member.member_status.toUpperCase() === filters.status)
      );
    });
    updateTotalMembersCount();
    console.log("Filtered chapters:", filteredMembers);
  
    displayMembers(filteredMembers.slice(0, entriesPerPage));
    setupPagination(filteredMembers.length); 
  } catch (error) {
    console.error('There was a problem fetching the members data:', error);
  } finally {
    hideLoader();
  }
}

// Function to update the total chapters count
const updateTotalMembersCount = () => {
  const totalMembersElement = document.getElementById("total-members-count"); // Ensure you have an element with this ID
  const totalFilteredMembers = filteredMembers.length; // Use the filtered chapters array
  totalMembersElement.innerHTML = `<strong>${totalFilteredMembers}</strong>`;
};

function displayMembers(members) {
  const tableBody = document.querySelector('.table tbody');
  tableBody.innerHTML = '';

  if (members.length === 0) {
    // Show "No data" message if no chapters are available
    const noDataRow = document.createElement("tr");
    noDataRow.innerHTML = `
      <td colspan="10" style="text-align: center; font-weight: bold;">No data available</td>
    `;
    tableBody.appendChild(noDataRow);
    return;
  }

  members.forEach((member, index) => {
    const fullName = `${member.member_first_name} ${member.member_last_name || ''}`;
    const formattedDate = member.member_induction_date ? member.member_induction_date.substring(0, 10) : 'N/A';
    const chapterName = chaptersMap[member.chapter_id] || 'N/A';
    const row = document.createElement('tr');
    row.classList.add('order-list');
    
    row.innerHTML = `
      <td>${(currentPage - 1) * entriesPerPage + index + 1}</td> <!-- Adjust for pagination -->
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <span class="avatar avatar-sm me-2 avatar-rounded">
            <img src="https://cdn-icons-png.flaticon.com/512/194/194828.png" alt="" />
          </span>
          <a href="/m/view-member/?member_id=${member.member_id}">${fullName}</a>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <b>${member.member_email_address}</b>
        </div>
      </td>
      <td style="border: 1px solid grey;">${member.member_phone_number}</td>
      <td class="fw-semibold" style="color:#d01f2f;">${chapterName}</td>
      <td class="fw-semibold" style="border: 1px solid grey;">${formattedDate}</td>
      <td class="fw-semibold" style="border: 1px solid grey; color:#d01f2f;">${formattedDate}</td>
      <td class="fw-semibold" style="border: 1px solid grey;">2</td>
      <td style="border: 1px solid grey;">
        <span class="badge bg-${member.member_status === 'active' ? 'success' : 'danger'}">
          ${member.member_status}
        </span>
      </td>
       <td style="border: 1px solid grey">
        <span class="badge bg-warning text-light" style="cursor:pointer; color:white;">
           <a href="/m/edit-member/?member_id=${member.member_id} "style="cursor:pointer; color:white;">Edit</a>
        </span>
        <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-member-id="${member.member_id}">
     Delete
    </span>
      </td>
    `;
    
    // Append the row to the table body
    tableBody.appendChild(row);
  });
}

// Function to filter members based on search input
function filterMembers(searchTerm) {
  if (searchTerm === '') {
    filteredMembers = [...allMembers]; // Reset filtered members to all members if search term is empty
    currentPage = 1; // Reset to the first page when search term is cleared
  } else {
    filteredMembers = allMembers.filter(member => {
      const fullName = `${member.member_first_name} ${member.member_last_name}`.toLowerCase();
      const email = member.member_email_address.toLowerCase();
      const phone = member.member_phone_number;
      // Check if search term matches any of the fields (name, email, or phone)
      return fullName.includes(searchTerm.toLowerCase()) || 
             email.includes(searchTerm.toLowerCase()) || 
             phone.includes(searchTerm);
    });
  }
  displayMembers(filteredMembers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)); // Display current page members
  setupPagination(filteredMembers.length); // Update pagination based on filtered results
}

// Add event listener for the search input
document.getElementById('searchInput').addEventListener('input', function() {
  const searchTerm = this.value;
  filterMembers(searchTerm); // Call the filter function with the search term
});

// Function to setup pagination
function setupPagination(totalMembers) {
  const paginationElement = document.querySelector('.pagination');
  paginationElement.innerHTML = ''; // Clear existing pagination
  const totalPages = Math.ceil(totalMembers / entriesPerPage);
  // Previous button
  const prevPage = document.createElement('li');
  prevPage.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevPage.innerHTML = `<a class="page-link" href="javascript:void(0)">Previous</a>`;
  prevPage.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayMembers(filteredMembers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage));
      setupPagination(filteredMembers.length);
    }
  };
  paginationElement.appendChild(prevPage);
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement('li');
    pageItem.className = `page-item ${currentPage === i ? 'active' : ''}`;
    pageItem.innerHTML = `<a class="page-link" href="javascript:void(0)">${i}</a>`;
    pageItem.onclick = () => {
      currentPage = i;
      displayMembers(filteredMembers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage));
      setupPagination(filteredMembers.length);
    };
    paginationElement.appendChild(pageItem);
  }

  // Next button
  const nextPage = document.createElement('li');
  nextPage.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextPage.innerHTML = `<a class="page-link" href="javascript:void(0)">Next</a>`;
  nextPage.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayMembers(filteredMembers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage));
      setupPagination(filteredMembers.length);
    }
  };
  paginationElement.appendChild(nextPage);
}

// Function to fetch and display chapters
async function loadChapters() {
  showLoader();
  try {
    const response = await fetch(chaptersApiUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const chapters = await response.json();
    displayChapters(chapters);
  } catch (error) {
    console.error('There was a problem fetching the chapters data:', error);
  } finally {
    hideLoader();
  }
}

// Function to display chapters in the table
function displayChapters(chapters) {
  const tableBody = document.getElementById('chaptersTableBody');
  tableBody.innerHTML = ''; // Clear existing rows

  chapters.forEach((chapter, index) => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <div class="ms-2">
            <p class="fw-semibold mb-0 d-flex align-items-center">
              <a href="#">${chapter.chapter_name}</a>
            </p>
          </div>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        <div class="d-flex align-items-center">
          <b>${chapter.region_name}</b>
        </div>
      </td>
      <td style="border: 1px solid grey;">${chapter.chapter_id}</td>
    `;

    // Append the row to the table body
    tableBody.appendChild(row);
  });
}
// Call fetchMembers on page load
window.addEventListener('DOMContentLoaded', async () => {
  showLoader(); // Show loader immediately on page load

  const memberId = getMemberIdFromUrl(); // Get the member ID from the URL
  console.log('Member ID:', memberId); // Check if the memberId is being extracted correctly

  try {
    await fetchMembers(); // Wait for data to be fetched
  } catch (error) {
    console.error("Failed to fetch member data:", error);
  } finally {
    hideLoader(); // Hide loader after data is fetched, whether successful or not
  }
});
window.onload = fetchMembers;


const deleteMember = async (member_id) => {
  // Show confirmation using SweetAlert
  const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This action will mark the member as deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
  });

  if (result.isConfirmed) {
      try {
          showLoader();  // Show loading indicator
          const response = await fetch(`https://bni-data-backend.onrender.com/api/deleteMember/${member_id}`, {
              method: 'PUT',
          });

          if (response.ok) {
              const data = await response.json();
              Swal.fire('Deleted!', data.message, 'success');
              // After deletion, remove the region from the table
              document.querySelector(`[data-member-id="${member_id}"]`).closest('tr').remove();
          } else {
              const errorResponse = await response.json();
              Swal.fire('Failed!', errorResponse.message, 'error');
          }
      } catch (error) {
          console.error('Error deleting member:', error);
          Swal.fire('Error!', 'Failed to delete member. Please try again.', 'error');
      } finally {
          hideLoader();  // Hide loading indicator
      }
  }
};

// Add event listener for delete buttons dynamically
document.getElementById('chaptersTableBody').addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-btn')) {
    const member_id = event.target.getAttribute('data-member-id');
    deleteMember(member_id);
  }
});
