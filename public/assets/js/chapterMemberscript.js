const apiUrl = 'http://localhost:5000/api/members';
const chaptersApiUrl = 'http://localhost:5000/api/chapters'; 
// const regionsApiUrl = 'http://localhost:5000/api/regions';
const categoriesApiUrl = 'http://localhost:5000/api/memberCategory';
const accoladesApiUrl = 'http://localhost:5000/api/accolades';
let chaptersMap = {};
let allMembers = []; 

let usedEmail;
let chapterMembers = [];

let filteredMembers = []; 
let currentPage = 1; 
const entriesPerPage = 30; 
// const regionsDropdown = document.getElementById("region-filter");
// const chapterDropdown = document.getElementById("chapter-filter");
const membershipDropdown = document.getElementById("membership-filter");
const categoryDropdown = document.getElementById("category-filter");
const accoladesDropdown = document.getElementById("accolades-filter");
const statusDropdown = document.getElementById("status-filter");

// Add these variables at the top with other global variables
let currentSortColumn = null;
let isAscending = true;

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
//   const regionId = regionsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
//   const chapterId = chapterDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const membershipYear = membershipDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const categoryId = categoryDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const accoladesId = accoladesDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const status = statusDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';

  const queryParams = new URLSearchParams();

//   if (regionId) queryParams.append('region_id', regionId);
//   if (chapterId) queryParams.append('chapter_id', chapterId);
  if (membershipYear) queryParams.append('membership_year', membershipYear);
  if (categoryId) queryParams.append('category_id', categoryId);
  if (accoladesId) queryParams.append('accolades_id', accoladesId);
  if (status) queryParams.append('status', status);

  const filterUrl = `/cm/managechaptermember?${queryParams.toString()}`;
  window.location.href = filterUrl;
});


// On page load, check for any applied filters in the URL params
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);

  // Get the filter values from URL params
//   const regionId = urlParams.get("region_id");
//   const chapterId = urlParams.get("chapter_id");
  const membershipYear = urlParams.get("membership_year");
  const categoryId = urlParams.get("category_id");
  const accoladesId = urlParams.get("accolades_id");
  const status = urlParams.get("status");

  // Update the dropdowns with the selected filter values
//   if (regionId) updateDropdownText(regionsDropdown, regionId);
//   if (chapterId) updateDropdownText(chapterDropdown, chapterId);
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
 
// added by vasusri
const updateActiveInactiveMembersCount = () => {
  const activeMembersCount = filteredMembers.filter(member => member.member_status.toLowerCase() === 'active').length;
  const inactiveMembersCount = filteredMembers.filter(member => member.member_status.toLowerCase() !== 'active').length;

  document.getElementById("active-members-count").innerHTML = `<strong>${activeMembersCount}</strong>`;
  document.getElementById("inactive-members-count").innerHTML = `<strong>${inactiveMembersCount}</strong>`;
};
// added by vasusri
async function fetchChapters() {
  try {
    const response = await fetch(chaptersApiUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const chapters = await response.json();
    
    // Populate chaptersMap with only Prolific chapters
    chapters.forEach(chapter => {
      if (chapter.chapter_name.toLowerCase().includes('prolific')) {
        chaptersMap[chapter.chapter_id] = chapter.chapter_name;
      }
    });
    
    usedEmail = chapters.find(t => t.email_id === userEmail);
    console.log('Chapters Map:', chaptersMap);

  } catch (error) {
    console.error('Error fetching chapters:', error);
  }
}
//added by vasusri
async function fetchMembers() {
    showLoader();
    try {
        console.log("🔄 Starting to fetch members...");
        
        // Get user type and email
        const userType = getUserLoginType();
        const userEmail = localStorage.getItem('current_chapter_email') || getUserEmail();
        
        console.log("🔑 User Details:", {
            type: userType,
            email: userEmail
        });

        // Fetch all members
        const response = await fetch("http://localhost:5000/api/members");
        if (!response.ok) throw new Error('Network response was not ok');
        
        const allMembersData = await response.json();
        console.log("👥 All Members Data:", {
            total: allMembersData.length,
            sample: allMembersData.slice(0, 2).map(m => ({
                name: `${m.member_first_name} ${m.member_last_name}`,
                chapter_id: m.chapter_id
            }))
        });

        // Get chapter details from localStorage for ro_admin
        const storedChapterId = localStorage.getItem('current_chapter_id');
        console.log("Stored Chapter ID:", storedChapterId);

        // Filter members based on chapter_id
        if (userType === 'ro_admin' && storedChapterId) {
            // For ro_admin, filter members by the chapter_id stored in localStorage
            allMembers = allMembersData.filter(member => member.chapter_id.toString() === storedChapterId);
            console.log("👨‍💼 RO Admin access - showing members for chapter_id:", storedChapterId, allMembers.length);
        } else {
            // Get chapter details first
            const chapterUser = await getChapterForUser(userEmail);
            console.log("📍 Chapter User Details:", chapterUser);

            if (chapterUser) {
                // For chapter users, filter by their specific chapter_id
                allMembers = allMembersData.filter(member => member.chapter_id === chapterUser.chapter_id);
                console.log("🎯 Filtered Chapter Members:", {
                    chapterId: chapterUser.chapter_id,
                    totalMembers: allMembers.length,
                    members: allMembers.map(m => ({
                        name: `${m.member_first_name} ${m.member_last_name}`,
                        status: m.member_status
                    }))
                });
            } else {
                console.error("❌ No chapter found for user:", userEmail);
                allMembers = [];
            }
        }

        // Update the display
        filteredMembers = [...allMembers];
        console.log("📊 Final Members List:", {
            total: filteredMembers.length,
            sample: filteredMembers.slice(0, 3).map(m => ({
                name: `${m.member_first_name} ${m.member_last_name}`,
                status: m.member_status,
                company: m.member_company_name
            }))
        });

        updateDisplay();
        updateTotalMembersCount();
        updateActiveInactiveMembersCount();
        
    } catch (error) {
        console.error("❌ Error in fetchMembers:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error Loading Members',
            text: 'Failed to load members list. Please try again.'
        });
    } finally {
        hideLoader();
    }
}

// Helper function to get chapter for user
async function getChapterForUser(email) {
  try {
      const response = await fetch(chaptersApiUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const chapters = await response.json();
      
      // Find chapter where the email matches any of the leadership positions
      const userChapter = chapters.find(chapter => 
          chapter.email_id?.toLowerCase() === email?.toLowerCase() ||
          chapter.vice_president_mail?.toLowerCase() === email?.toLowerCase() ||
          chapter.president_mail?.toLowerCase() === email?.toLowerCase() ||
          chapter.treasurer_mail?.toLowerCase() === email?.toLowerCase()
      );

      console.log("Found chapter for user:", userChapter);
      return userChapter;
  } catch (error) {
      console.error('Error fetching chapter for user:', error);
      return null;
  }
}


// Function to update the total chapters count
const updateTotalMembersCount = () => {
  const totalMembersElement = document.getElementById("total-members-count"); // Ensure you have an element with this ID
  const totalFilteredMembers = filteredMembers.length; // Use the filtered chapters array
  totalMembersElement.innerHTML = `<strong>${totalFilteredMembers}</strong>`;
};


function displayMembers(members) {
    try {
        console.log("🎯 Displaying Members:", {
            total: members.length,
            currentPage,
            entriesPerPage
        });

        const tableBody = document.querySelector('.table tbody');
        if (!tableBody) {
            throw new Error("Table body element not found");
        }
        
        tableBody.innerHTML = '';

        if (members.length === 0) {
            const noDataRow = document.createElement("tr");
            noDataRow.innerHTML = `
                <td colspan="10" style="text-align: center; font-weight: bold;">No data available</td>
            `;
            tableBody.appendChild(noDataRow);
            return;
        }

        members.forEach((member, index) => {
            console.log(`📋 Rendering member ${index + 1}:`, {
                name: `${member.member_first_name} ${member.member_last_name}`,
                company: member.member_company_name,
                status: member.member_status
            });

            const fullName = `${member.member_first_name} ${member.member_last_name || ''}`;
            const formattedDate = member.member_induction_date ? member.member_induction_date.substring(0, 10) : 'N/A';
            
            // Add photo URL handling like in script.js
            const photoUrl = member.member_photo 
                ? `http://localhost:5000/uploads/memberLogos/${member.member_photo}`
                : null;
            
            console.log('Photo processing for member:', {
                name: fullName,
                hasPhoto: !!member.member_photo,
                photoUrl: photoUrl || 'Using default avatar',
                photoName: member.member_photo || 'No photo available'
            });

            const row = document.createElement('tr');
            row.classList.add('order-list');
            
            row.innerHTML = `
                <td>${(currentPage - 1) * entriesPerPage + index + 1}</td>
                <td style="border: 1px solid grey;">
                    <div class="d-flex align-items-center">
                        <span class="avatar avatar-sm me-2 avatar-rounded">
                            <img 
                                src="${photoUrl || 'https://cdn-icons-png.flaticon.com/512/194/194828.png'}" 
                                alt="${fullName || 'avatar'}" 
                                onerror="console.log('Image failed to load, using default avatar for:', '${fullName}'); this.src='https://cdn-icons-png.flaticon.com/512/194/194828.png';"
                            />
                        </span>
                        <a href="#" onclick="handleMemberClick('${member.member_email_address}', '${member.member_id}')">${fullName}</a>
                    </div>
                </td>
                <td style="border: 1px solid grey;">
                    <div class="d-flex align-items-center">
                        <b>${member.member_email_address}</b>
                    </div>
                </td>
                <td style="border: 1px solid grey;">${member.member_phone_number}</td>
                
                <td class="fw-semibold" style="border: 1px solid grey;">${formatDate(member.member_induction_date)}</td>
                <td class="fw-semibold" style="border: 1px solid grey; color:#d01f2f;">${formatDate(member.member_renewal_date)}</td>
                <td class="fw-semibold" style="border: 1px solid grey;">${member.member_current_membership}</td>
                <td style="border: 1px solid grey;">
                    <span class="badge bg-${member.member_status === 'active' ? 'success' : 'danger'}">
                        ${member.member_status}
                    </span>
                </td>
                <td style="border: 1px solid grey">
                    <span class="badge bg-warning text-light" style="cursor:pointer; color:white;">
                        <a href="/cm/editchaptermember/?member_id=${member.member_id}" style="cursor:pointer; color:white;">Edit</a>
                    </span>
                    <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-member-id="${member.member_id}">
                        Delete
                    </span>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Initialize sort handlers after displaying members
        initializeSortHandlers();
    } catch (error) {
        console.error('Error in displayMembers:', error);
        Swal.fire({
            icon: 'error',
            title: 'Display Error',
            text: 'There was an error displaying the members. Please try again.',
            confirmButtonColor: '#d01f2f'
        });
    }
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

// Add this function to get member ID from URL
function getMemberIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('member_id') || null;
}

// Call fetchMembers on page load
window.addEventListener('DOMContentLoaded', async () => {
    showLoader(); // Show loader immediately on page load

    try {
        const memberId = getMemberIdFromUrl(); // Get the member ID from the URL
        console.log('Member ID:', memberId); // Check if the memberId is being extracted correctly

        await fetchMembers(); // Wait for data to be fetched
    } catch (error) {
        console.error("Failed to fetch member data:", error);
    } finally {
        hideLoader(); // Hide loader after data is fetched, whether successful or not
    }
});

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
          const response = await fetch(`http://localhost:5000/api/deleteMember/${member_id}`, {
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

// Add this function to handle display updates
function updateDisplay() {
    // Calculate current page's data
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const currentPageData = filteredMembers.slice(startIndex, endIndex);
    
    // Display the current page's data
    displayMembers(currentPageData);
    
    // Update pagination
    setupPagination(filteredMembers.length);
    
    // Update counts
    updateTotalMembersCount();
    updateActiveInactiveMembersCount();
}

// Add this function at the top level of your file
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Add this new function to handle member clicks
function handleMemberClick(memberEmail, memberId) {
    // Store member details in localStorage
    localStorage.setItem('current_member_email', memberEmail);
    localStorage.setItem('current_member_id', memberId);
    
    // Redirect to member dashboard
    window.location.href = `/d/member-dashboard/?member_id=${memberId}`;
}

// Add this function to sort members
function sortMembers(column) {
    try {
        console.log(`Sorting by ${column}, direction: ${isAscending ? 'ascending' : 'descending'}`);
        
        // Toggle sort direction if clicking the same column
        if (currentSortColumn === column) {
            isAscending = !isAscending;
        } else {
            currentSortColumn = column;
            isAscending = true;
        }

        // Update sort icons
        document.querySelectorAll('.ti-arrows-sort').forEach(icon => {
            icon.className = 'ti ti-arrows-sort';
        });

        const activeIcon = document.querySelector(`[data-sort="${column}"] .ti-arrows-sort`);
        if (activeIcon) {
            activeIcon.className = isAscending ? 'ti ti-sort-ascending' : 'ti ti-sort-descending';
        }

        // Sort the filtered members
        filteredMembers.sort((a, b) => {
            try {
                let valueA, valueB;

                switch(column) {
                    case 'member_details':
                        valueA = `${a.member_first_name || ''} ${a.member_last_name || ''}`.toLowerCase();
                        valueB = `${b.member_first_name || ''} ${b.member_last_name || ''}`.toLowerCase();
                        break;
                    case 'email':
                        valueA = (a.member_email_address || '').toLowerCase();
                        valueB = (b.member_email_address || '').toLowerCase();
                        break;
                    case 'phone':
                        valueA = a.member_phone_number || '';
                        valueB = b.member_phone_number || '';
                        break;
                    case 'induction_date':
                    case 'renewal_date':
                        valueA = a[`member_${column}`] ? new Date(a[`member_${column}`]) : new Date(0);
                        valueB = b[`member_${column}`] ? new Date(b[`member_${column}`]) : new Date(0);
                        break;
                    case 'membership':
                        valueA = (a.member_current_membership || '').toLowerCase();
                        valueB = (b.member_current_membership || '').toLowerCase();
                        break;
                    case 'status':
                        valueA = (a.member_status || '').toLowerCase();
                        valueB = (b.member_status || '').toLowerCase();
                        break;
                    default:
                        return 0;
                }

                if (valueA < valueB) return isAscending ? -1 : 1;
                if (valueA > valueB) return isAscending ? 1 : -1;
                return 0;
            } catch (error) {
                console.error('Error comparing values:', error);
                return 0;
            }
        });

        // Update the display
        displayMembers(filteredMembers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage));
    } catch (error) {
        console.error('Error in sortMembers:', error);
        Swal.fire({
            icon: 'error',
            title: 'Sorting Error',
            text: 'There was an error sorting the members. Please try again.',
            confirmButtonColor: '#d01f2f'
        });
    }
}

// Add this function to initialize sort handlers
function initializeSortHandlers() {
    try {
        const sortableColumns = {
            'member_details': 'Member Details',
            'email': 'Member Email I\'d',
            'phone': 'Phone Number',
            'induction_date': 'Induction Date',
            'renewal_date': 'Renewal Date',
            'membership': 'Membership (in years)',
            'status': 'Status'
        };

        // Add click handlers to each sortable column
        Object.entries(sortableColumns).forEach(([column, label]) => {
            const header = Array.from(document.querySelectorAll('th')).find(th => 
                th.textContent.trim().includes(label)
            );
            
            if (header) {
                header.setAttribute('data-sort', column);
                header.style.cursor = 'pointer';
                
                // Add click handler
                header.addEventListener('click', () => {
                    sortMembers(column);
                });
            }
        });
    } catch (error) {
        console.error('Error initializing sort handlers:', error);
        Swal.fire({
            icon: 'error',
            title: 'Initialization Error',
            text: 'There was an error initializing the sorting functionality. Please refresh the page.',
            confirmButtonColor: '#d01f2f'
        });
    }
}



