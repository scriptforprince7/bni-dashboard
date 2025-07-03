// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.endpoints = {
    members: "https://backend.bninewdelhi.com/api/members",
    chapters: "https://backend.bninewdelhi.com/api/chapters",
    regions: "https://backend.bninewdelhi.com/api/regions",
    categories: "https://backend.bninewdelhi.com/api/memberCategory",
    accolades: "https://backend.bninewdelhi.com/api/accolades"
};

// Use window.BNI namespace for other global variables
window.BNI.state = window.BNI.state || {
    chaptersMap: {},
    allMembers: [],
    filteredMembers: [],
    currentPage: 1,
    entriesPerPage: 30,
    showingAllEntries: false
};

// Cache DOM elements
window.BNI.elements = {
    dropdowns: {
        region: document.getElementById("region-filter"),
        chapter: document.getElementById("chapter-filter"),
        membership: document.getElementById("membership-filter"),
        category: document.getElementById("category-filter"),
        accolades: document.getElementById("accolades-filter"),
        status: document.getElementById("status-filter")
    },
    loader: document.getElementById("loader"),
    tableBody: document.querySelector('.table tbody'),
    totalMembersCount: document.getElementById("total-members-count")
};

// Function to show/hide loader
function showLoader() {
    if (window.BNI.elements.loader) {
        window.BNI.elements.loader.style.display = 'flex';
    }
}

function hideLoader() {
    if (window.BNI.elements.loader) {
        window.BNI.elements.loader.style.display = 'none';
    }
}

// Function to populate dropdowns
const populateDropdown = (dropdown, data, valueField, textField, defaultText) => {
    if (!dropdown) return;
    
    dropdown.innerHTML = `
        <li>
            <a class="dropdown-item" href="javascript:void(0);" data-value="">
                ${defaultText}
            </a>
        </li>
        ${data.map(item => `
            <li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${item[valueField]}">
                    ${item[textField]}
                </a>
            </li>
        `).join('')}
    `;

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
    const response = await fetch(window.BNI.endpoints.regions);
    if (!response.ok) throw new Error("Error fetching regions");

    const regions = await response.json();

    // Clear existing options
    window.BNI.elements.dropdowns.region.innerHTML = "";

    // Add a default option
    window.BNI.elements.dropdowns.region.innerHTML += `
      <li>
        <a class="dropdown-item" href="javascript:void(0);" data-value="">
          Select Region
        </a>
      </li>
    `;

    // Populate dropdown with region IDs and names
    regions.forEach((region) => {
      window.BNI.elements.dropdowns.region.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${region.region_id}">
            ${region.region_name}
          </a>
        </li>
      `;
    });

    // Attach listeners after populating
    attachDropdownListeners(window.BNI.elements.dropdowns.region);
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
    const response = await fetch(window.BNI.endpoints.chapters);
    if (!response.ok) throw new Error("Error fetching chapter");

    const chapters = await response.json(); // Assume the API returns an array of chapter objects

    // Clear existing options
    window.BNI.elements.dropdowns.chapter.innerHTML = "";

    // Populate dropdown with unique chapter
    chapters.forEach((chapter) => {
      window.BNI.elements.dropdowns.chapter.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${chapter.chapter_id}">
            ${chapter.chapter_name}
          </a>
        </li>
      `;
    });
    

    // Attach listeners after populating
    attachDropdownListeners(window.BNI.elements.dropdowns.chapter);
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
    const response = await fetch(window.BNI.endpoints.categories);
    if (!response.ok) throw new Error("Error fetching chapter");

    const categories = await response.json(); // Assume the API returns an array of chapter objects

    // Clear existing options
    window.BNI.elements.dropdowns.category.innerHTML = "";

    categories.forEach((category) => {
      window.BNI.elements.dropdowns.category.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${category.category_id}">
            ${category.category_name}
          </a>
        </li>
      `;
    });
    

    // Attach listeners after populating all categories
    attachDropdownListeners(window.BNI.elements.dropdowns.category);
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
    const response = await fetch(window.BNI.endpoints.accolades);
    if (!response.ok) throw new Error("Error fetching chapter");

    const accolades = await response.json(); // Assume the API returns an array of chapter objects

    // Clear existing options
    window.BNI.elements.dropdowns.accolades.innerHTML = "";

    accolades.forEach((accolade) => {
      window.BNI.elements.dropdowns.accolades.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${accolade.accolade_id}">
            ${accolade.accolade_name}
          </a>
        </li>
      `;
    })

    // Attach listeners after populating all accolades
    attachDropdownListeners(window.BNI.elements.dropdowns.accolades);
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
    const response = await fetch(window.BNI.endpoints.members);
    if (!response.ok) throw new Error("Error fetching membershi[");

    const memberships = await response.json(); // Assume the API returns an array of chapter objects

    // Extract unique membership type
    const uniqueTypes = [
      ...new Set(memberships.map((membership) => membership.member_current_membership)),
    ];

    // Clear existing options
    window.BNI.elements.dropdowns.membership.innerHTML = "";

    // Populate dropdown with unique membership
    uniqueTypes.forEach((type) => {
      window.BNI.elements.dropdowns.membership.innerHTML += `<li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${type.toUpperCase()}">
                    ${type}
                </a>
            </li>`;
    });

    // Attach listeners after populating all membership
    attachDropdownListeners(window.BNI.elements.dropdowns.membership);
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
    const response = await fetch(window.BNI.endpoints.members);
    if (!response.ok) throw new Error("Error fetching member current membership");

    const statuses = await response.json(); // Assume the API returns an array of members objects

    // Extract unique current membership type
    const uniqueTypes = [
      ...new Set(statuses.map((status) => status.member_status)),
    ];

    // Clear existing options
    window.BNI.elements.dropdowns.status.innerHTML = "";

    // Populate dropdown with unique current membership
    uniqueTypes.forEach((type) => {
      window.BNI.elements.dropdowns.status.innerHTML += `<li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${type.toUpperCase()}">
                    ${type}
                </a>
            </li>`;
    });

    // Attach listeners after populating all current membership
    attachDropdownListeners(window.BNI.elements.dropdowns.status);
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
  const regionId = window.BNI.elements.dropdowns.region.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const chapterId = window.BNI.elements.dropdowns.chapter.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const membershipYear = window.BNI.elements.dropdowns.membership.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const categoryId = window.BNI.elements.dropdowns.category.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const accoladesId = window.BNI.elements.dropdowns.accolades.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const status = window.BNI.elements.dropdowns.status.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';

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
  if (regionId) updateDropdownText(window.BNI.elements.dropdowns.region, regionId);
  if (chapterId) updateDropdownText(window.BNI.elements.dropdowns.chapter, chapterId);
  if (membershipYear) updateDropdownText(window.BNI.elements.dropdowns.membership, membershipYear); // Ensure chapter type is uppercased
  if (categoryId) updateDropdownText(window.BNI.elements.dropdowns.category, categoryId); // Ensure chapter status is uppercased
  if (accoladesId) updateDropdownText(window.BNI.elements.dropdowns.accolades, accoladesId); // Ensure chapter status is uppercased
  if (status) updateDropdownText(window.BNI.elements.dropdowns.status, status); // Ensure chapter status is uppercased

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
    const response = await fetch(window.BNI.endpoints.chapters);
    if (!response.ok) throw new Error('Network response was not ok');
    const chapters = await response.json();
    chapters.forEach(chapter => {
      window.BNI.state.chaptersMap[chapter.chapter_id] = chapter.chapter_name;
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
  }
}

// Function to fetch and display members
async function fetchMembers() {
    showLoader();
    try {
        await fetchChapters();
        const response = await fetch(window.BNI.endpoints.members);
        if (!response.ok) throw new Error('Network response was not ok');
        
        window.BNI.state.allMembers = await response.json();
        const urlParams = new URLSearchParams(window.location.search);
        const filters = {
            regionId: urlParams.get("region_id"),
            chapterId: urlParams.get("chapter_id"),
            membershipYear: urlParams.get("membership_year"),
            categoryId: urlParams.get("category_id"),
            accoladesId: urlParams.get("accolades_id"),
            status: urlParams.get("status")
        };

        window.BNI.state.filteredMembers = window.BNI.state.allMembers.filter(member => {
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
        displayMembers(window.BNI.state.filteredMembers.slice(0, window.BNI.state.entriesPerPage));
        setupPagination(window.BNI.state.filteredMembers.length);
    } catch (error) {
        console.error('Error fetching members:', error);
    } finally {
        hideLoader();
    }
}

// Function to update the total chapters count
const updateTotalMembersCount = () => {
  const totalMembersElement = window.BNI.elements.totalMembersCount; // Ensure you have an element with this ID
  const totalFilteredMembers = window.BNI.state.filteredMembers.length; // Use the filtered chapters array
  totalMembersElement.innerHTML = `<strong>${totalFilteredMembers}</strong>`;
};

// Function to display members
function displayMembers(members) {
    const tableBody = window.BNI.elements.tableBody;
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (members.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; font-weight: bold;">No data available</td>
            </tr>
        `;
        return;
    }

    members.forEach((member, index) => {
        const fullName = `${member.member_first_name} ${member.member_last_name || ''}`;
        const formattedDate = member.member_induction_date ? formatDate(member.member_induction_date) : 'N/A';
        const formattedRenewalDate = member.member_renewal_date ? formatDate(member.member_renewal_date) : 'N/A';
        const chapterName = window.BNI.state.chaptersMap[member.chapter_id] || 'N/A';
        
        
        // Create the photo URL if member_photo exists
        const photoUrl = member.member_photo 
            ? `https://backend.bninewdelhi.com/uploads/memberLogos/${member.member_photo}`
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
            <td>${(window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage + index + 1}</td>
            <td style="border: 1px solid grey;">
                <div class="d-flex align-items-center">
                    <span class="avatar avatar-sm me-2 avatar-rounded">
                         <img 
                            src="${photoUrl || 'https://cdn-icons-png.flaticon.com/512/194/194828.png'}" 
                            alt="${fullName || 'avatar'}" 
                            onerror="console.log('Image failed to load, using default avatar for:', '${fullName}'); this.src='https://cdn-icons-png.flaticon.com/512/194/194828.png';"
                        />
                    </span>
                    <a href="javascript:void(0);" class="member-name" data-member-id="${member.member_id}" data-member-email="${member.member_email_address}">${fullName}</a>
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
            <td class="fw-semibold" style="border: 1px solid grey; color:#d01f2f;">${formattedRenewalDate}</td>
            <td class="fw-semibold" style="border: 1px solid grey;">${member.member_current_membership}</td>
            <td style="border: 1px solid grey;">
                <span class="badge bg-${member.member_status === 'active' ? 'success' : 'danger'}">
                    ${member.member_status}
                </span>
            </td>
            <td style="border: 1px solid grey">
                <span class="badge bg-warning text-light" style="cursor:pointer; color:white;">
                    <a href="/m/edit-member/?member_id=${member.member_id}" style="cursor:pointer; color:white;">Edit</a>
                </span>
                <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-member-id="${member.member_id}">
                    Delete
                </span>
            </td>
        `;

        // Add click handler for member name
        const memberNameLink = row.querySelector('.member-name');
        memberNameLink.style.cursor = 'pointer';
        memberNameLink.style.color = '#d01f2f'; // Add styling to make it look clickable
        memberNameLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const memberData = {
                    member_id: memberNameLink.dataset.memberId,
                    email_id: memberNameLink.dataset.memberEmail
                };
                
                console.log('=== Starting Member Access ===');
                console.log('Member data to be stored:', memberData);
                
                // Store the data
                localStorage.setItem('current_member_email', memberData.email_id);
                localStorage.setItem('current_member_id', memberData.member_id);
                
                // Verify storage
                const storedEmail = localStorage.getItem('current_member_email');
                const storedId = localStorage.getItem('current_member_id');
                
                console.log('Verification of stored member data:', {
                    originalEmail: memberData.email_id,
                    storedEmail: storedEmail,
                    originalId: memberData.member_id,
                    storedId: storedId
                });

                if (!storedEmail || !storedId) {
                    throw new Error('Failed to store member access data');
                }

                // Only redirect if data is properly stored
                window.open(`/m/member-transactions`, '_blank');
            } catch (error) {
                console.error('Error in member access:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Access Error',
                    text: 'Unable to access member dashboard. Please try again.'
                });
            }
        });

        tableBody.appendChild(row);
    });
}

// Function to filter members based on search input
function filterMembers(searchTerm) {
  if (searchTerm === '') {
    window.BNI.state.filteredMembers = [...window.BNI.state.allMembers]; // Reset filtered members to all members if search term is empty
    window.BNI.state.currentPage = 1; // Reset to the first page when search term is cleared
  } else {
    window.BNI.state.filteredMembers = window.BNI.state.allMembers.filter(member => {
      const fullName = `${member.member_first_name} ${member.member_last_name}`.toLowerCase();
      const email = member.member_email_address.toLowerCase();
      const phone = member.member_phone_number;
      // Check if search term matches any of the fields (name, email, or phone)
      return fullName.includes(searchTerm.toLowerCase()) || 
             email.includes(searchTerm.toLowerCase()) || 
             phone.includes(searchTerm);
    });
  }
  displayMembers(window.BNI.state.filteredMembers.slice((window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage, window.BNI.state.currentPage * window.BNI.state.entriesPerPage)); // Display current page members
  setupPagination(window.BNI.state.filteredMembers.length); // Update pagination based on filtered results
}

// Add event listener for the search input
document.getElementById('searchInput').addEventListener('input', function() {
  const searchTerm = this.value;
  filterMembers(searchTerm); // Call the filter function with the search term
});

// Function to setup pagination
function setupPagination(totalMembers) {
    const paginationElement = document.querySelector('.pagination');
    const totalPages = Math.ceil(totalMembers / window.BNI.state.entriesPerPage);
    
    // Update entries text display
    updateEntriesText(totalMembers);
    
    // Clear existing pagination
    paginationElement.innerHTML = '';

    // Don't show pagination if showing all entries
    if (window.BNI.state.showingAllEntries) {
        paginationElement.style.display = 'none';
        return;
    }

    paginationElement.style.display = 'flex';
    
    // Previous button
    const prevPage = createPaginationButton('Previous', window.BNI.state.currentPage === 1);
    prevPage.onclick = () => {
        if (window.BNI.state.currentPage > 1) {
            window.BNI.state.currentPage--;
            displayMembers(window.BNI.state.filteredMembers.slice(
                (window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage,
                window.BNI.state.currentPage * window.BNI.state.entriesPerPage
            ));
            setupPagination(totalMembers);
        }
    };
    paginationElement.appendChild(prevPage);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = createPaginationButton(i.toString(), false, window.BNI.state.currentPage === i);
        pageItem.onclick = () => {
            window.BNI.state.currentPage = i;
            displayMembers(window.BNI.state.filteredMembers.slice(
                (i - 1) * window.BNI.state.entriesPerPage,
                i * window.BNI.state.entriesPerPage
            ));
            setupPagination(totalMembers);
        };
        paginationElement.appendChild(pageItem);
    }
    
    // Next button
    const nextPage = createPaginationButton('Next', window.BNI.state.currentPage === totalPages);
    nextPage.onclick = () => {
        if (window.BNI.state.currentPage < totalPages) {
            window.BNI.state.currentPage++;
            displayMembers(window.BNI.state.filteredMembers.slice(
                (window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage,
                window.BNI.state.currentPage * window.BNI.state.entriesPerPage
            ));
            setupPagination(totalMembers);
        }
    };
    paginationElement.appendChild(nextPage);
}

// Helper function to create pagination buttons
function createPaginationButton(text, disabled = false, active = false) {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="javascript:void(0)">${text}</a>`;
    return li;
}

// Function to update entries text
function updateEntriesText(totalMembers) {
    const entriesText = document.querySelector('.mb-2.mb-sm-0');
    if (!entriesText) return;

    const start = window.BNI.state.showingAllEntries ? 1 : 
        (window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage + 1;
    const end = window.BNI.state.showingAllEntries ? totalMembers : 
        Math.min(window.BNI.state.currentPage * window.BNI.state.entriesPerPage, totalMembers);

    entriesText.innerHTML = `
        Showing <b>${start}</b> to <b>${end}</b> of <b>${totalMembers}</b> entries
        <a href="javascript:void(0)" class="ms-2 text-primary show-all-link">
            ${window.BNI.state.showingAllEntries ? 'Show Paginated' : 'Show All'}
        </a>
    `;

    // Add click handler for Show All link
    const showAllLink = entriesText.querySelector('.show-all-link');
    showAllLink.onclick = toggleShowAll;
}

// Function to toggle between showing all entries and paginated view
function toggleShowAll() {
    window.BNI.state.showingAllEntries = !window.BNI.state.showingAllEntries;
    
    if (window.BNI.state.showingAllEntries) {
        // Show all entries
        displayMembers(window.BNI.state.filteredMembers);
    } else {
        // Return to paginated view
        window.BNI.state.currentPage = 1;
        displayMembers(window.BNI.state.filteredMembers.slice(0, window.BNI.state.entriesPerPage));
    }
    
    setupPagination(window.BNI.state.filteredMembers.length);
}

// Function to fetch and display chapters
async function loadChapters() {
  showLoader();
  try {
    const response = await fetch(window.BNI.endpoints.chapters);
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

// Add this function near the top of your script.js file, after the window.BNI initialization
function getMemberIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('member_id');
}

// Update the event listener to use this function
document.addEventListener('DOMContentLoaded', async () => {
    showLoader();
    try {
        const memberId = getMemberIdFromUrl();
        console.log('Member ID from URL:', memberId);
        
        await fetchMembers();
        
        // If there's a specific member ID, filter for that member
        if (memberId) {
            window.BNI.state.filteredMembers = window.BNI.state.allMembers.filter(
                member => member.member_id === parseInt(memberId)
            );
        }
        
        displayMembers(window.BNI.state.filteredMembers.slice(0, window.BNI.state.entriesPerPage));
        setupPagination(window.BNI.state.filteredMembers.length);
        
    } catch (error) {
        console.error("Failed to fetch member data:", error);
    } finally {
        hideLoader();
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
          const response = await fetch(`https://backend.bninewdelhi.com/api/deleteMember/${member_id}`, {
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

// Function to fetch and update all member counts
async function updateMemberCounts() {
    try {
        console.log('=== Starting Member Counts Update Process ===');
        const response = await fetch('https://backend.bninewdelhi.com/api/members');
        const members = await response.json();
        console.log('Total members data fetched:', members.length);

        // Count active members
        const activeMembersCount = members.filter(member => member.member_status === 'active').length;
        console.log('Active members count:', activeMembersCount);

        // Count inactive members
        const inactiveMembersCount = members.filter(member => member.member_status !== 'active').length;
        console.log('Inactive members count:', inactiveMembersCount);

        // Update displays using proper ID selectors
        const totalMembersElement = document.getElementById('total-members-count');
        const activeMembersElement = document.getElementById('active-members-count');
        const inactiveMembersElement = document.getElementById('inactive-members-count');

        if (totalMembersElement) {
            totalMembersElement.innerHTML = `<b>${members.length}</b>`;
            console.log('Updated total members display:', members.length);
        } else {
            console.error('Total members element not found');
        }

        if (activeMembersElement) {
            activeMembersElement.innerHTML = `<b>${activeMembersCount}</b>`;
            console.log('Updated active members display:', activeMembersCount);
        } else {
            console.error('Active members element not found');
        }

        if (inactiveMembersElement) {
            inactiveMembersElement.innerHTML = `<b>${inactiveMembersCount}</b>`;
            console.log('Updated inactive members display:', inactiveMembersCount);
        } else {
            console.error('Inactive members element not found');
        }

        console.log('=== Member Counts Update Process Completed ===');
    } catch (error) {
        console.error('Error updating member counts:', error);
    }
}

// Call this function when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Page Loaded, Initializing Member Counts ===');
    updateMemberCounts();
});

// Add sorting icons to table headers
document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('th[scope="col"]');
    headers.forEach((header, index) => {
        // Skip Phone Number and Actions columns
        if (header.textContent !== 'Phone Number' && header.textContent !== 'Actions') {
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

// Function to sort members
function sortMembers(columnIndex, ascending) {
    const members = [...window.BNI.state.filteredMembers];
    
    members.sort((a, b) => {
        let aValue, bValue;
        
        switch(columnIndex) {
            case 0: // S.No
                return ascending ? a.member_id - b.member_id : b.member_id - a.member_id;
            
            case 1: // Member Details
                aValue = `${a.member_first_name} ${a.member_last_name}`.toLowerCase();
                bValue = `${b.member_first_name} ${b.member_last_name}`.toLowerCase();
                break;
            
            case 2: // Email
                aValue = a.member_email_address.toLowerCase();
                bValue = b.member_email_address.toLowerCase();
                break;
            
            case 4: // Chapter
                aValue = (window.BNI.state.chaptersMap[a.chapter_id] || '').toLowerCase();
                bValue = (window.BNI.state.chaptersMap[b.chapter_id] || '').toLowerCase();
                break;
            
            case 5: // Induction Date
                aValue = a.member_induction_date || '';
                bValue = b.member_induction_date || '';
                break;
            
            case 6: // Renewal Date
                aValue = a.member_induction_date || ''; // Using induction date as renewal date
                bValue = b.member_induction_date || '';
                break;
            
            case 7: // Membership Years
                aValue = parseInt(a.member_current_membership) || 0;
                bValue = parseInt(b.member_current_membership) || 0;
                return ascending ? aValue - bValue : bValue - aValue;
            
            case 8: // Status
                aValue = a.member_status.toLowerCase();
                bValue = b.member_status.toLowerCase();
                break;
            
            default:
                return 0;
        }
        
        return ascending ? 
            aValue.localeCompare(bValue) : 
            bValue.localeCompare(aValue);
    });

    window.BNI.state.filteredMembers = members;
    displayMembers(window.BNI.state.filteredMembers.slice(
        (window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage,
        window.BNI.state.currentPage * window.BNI.state.entriesPerPage
    ));
}

// Add click event listeners to sort icons
document.addEventListener('click', (event) => {
    const sortIcon = event.target.closest('.sort-icons');
    if (!sortIcon) return;

    const header = sortIcon.closest('th');
    const columnIndex = Array.from(header.parentElement.children).indexOf(header);
    
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
    sortMembers(columnIndex, newDirection);
});

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}


