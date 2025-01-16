let apiUrl = "https://bni-data-backend.onrender.com/api/chapters";
const regionsUrl = "https://bni-data-backend.onrender.com/api/regions";
let allChapters = [];
let filteredChapters = [];
let allMembers = []; // Store all members globally
let allRegions = []; // Store all regions globally

const regionsDropdown = document.getElementById("region-filter");
const meetingDayDropdown = document.getElementById("meeting-day-filter");
const chapterTypeDropdown = document.getElementById("chapter-type-filter");
const chapterStatusDropdown = document.getElementById("chapter-status-filter");

// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

// Function to hide the loader
function hideLoader() {
  document.getElementById("loader").style.display = "none";
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

// Fetch regions and populate the regions dropdown
const loadRegions = async () => {
  try {
    showLoader();

    // Fetch the regions data
    const response = await fetch(regionsUrl);
    if (!response.ok) throw new Error("Error fetching regions");

    allRegions = await response.json(); // Store fetched regions in allRegions array

    // Populate the regions dropdown with fetched data
    populateDropdown(
      regionsDropdown,
      allRegions,
      "region_id",
      "region_name",
      "Select Region"
    );
  } catch (error) {
    console.error("Error loading regions:", error);
    alert("Failed to load regions. Please try again.");
  } finally {
    hideLoader();
  }
};

// Populate chapter day dropdown
const populateChapterDayDropdown = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  meetingDayDropdown.innerHTML = ""; // Clear existing options
  days.forEach((day) => {
    meetingDayDropdown.innerHTML += `<li>
      <a class="dropdown-item" href="javascript:void(0);" data-value="${day.toLowerCase()}">
        ${day}
      </a>
    </li>`;
  });
  // Attach listeners after populating
  attachDropdownListeners(meetingDayDropdown);
};

// Call the function to populate months
populateChapterDayDropdown();

// Populate chapter type dropdown
const populateChapterTypeDropdown = async () => {
  try {
    showLoader();
    // Fetch chapters data
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Error fetching chapters");

    const chapters = await response.json(); // Assume the API returns an array of chapter objects

    // Extract unique chapter types
    const uniqueTypes = [
      ...new Set(chapters.map((chapter) => chapter.chapter_type)),
    ];

    // Clear existing options
    chapterTypeDropdown.innerHTML = "";

    // Populate dropdown with unique chapter types
    uniqueTypes.forEach((type) => {
      chapterTypeDropdown.innerHTML += `<li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${type.toUpperCase()}">
                    ${type}
                </a>
            </li>`;
    });

    // Attach listeners after populating
    attachDropdownListeners(chapterTypeDropdown);
  } catch (error) {
    console.error("Error populating chapter type dropdown:", error);
  } finally {
    hideLoader();
  }
};
// Call the function to populate the chapter type dropdown
populateChapterTypeDropdown();

// Populate chapter status dropdown
const populateChapterStatusDropdown = async () => {
  try {
    showLoader();
    // Fetch chapters data
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Error fetching chapters");

    const chapters = await response.json(); // Assume the API returns an array of chapter objects

    // Extract unique chapter types
    const uniqueTypes = [
      ...new Set(chapters.map((chapter) => chapter.chapter_status)),
    ];

    // Clear existing options
    chapterStatusDropdown.innerHTML = "";

    // Populate dropdown with unique chapter types
    uniqueTypes.forEach((type) => {
      chapterStatusDropdown.innerHTML += `<li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${type.toUpperCase()}">
                    ${type}
                </a>
            </li>`;
    });

    // Attach listeners after populating
    attachDropdownListeners(chapterStatusDropdown);
  } catch (error) {
    console.error("Error populating chapter type dropdown:", error);
  } finally {
    hideLoader();
  }
};
// Call the function to populate the chapter type dropdown
populateChapterStatusDropdown();

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
  const meetingDay = meetingDayDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const chapterType = chapterTypeDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || ''.toLowerCase();
  const chapterStatus = chapterStatusDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';

  const queryParams = new URLSearchParams();

  if (regionId) queryParams.append('region_id', regionId);
  if (meetingDay) queryParams.append('meeting_day', meetingDay);
  if (chapterType) queryParams.append('chapter_type', chapterType);
  if (chapterStatus) queryParams.append('chapter_status', chapterStatus);

  const filterUrl = `/c/manage-chapter?${queryParams.toString()}`;
  window.location.href = filterUrl;
});


// On page load, check for any applied filters in the URL params
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);

  // Get the filter values from URL params
  const regionId = urlParams.get("region_id");
  const meetingDay = urlParams.get("meeting_day");
  const chapterType = urlParams.get("chapter_type");
  const chapterStatus = urlParams.get("chapter_status");

  // Update the dropdowns with the selected filter values
  if (regionId) updateDropdownText(regionsDropdown, regionId);
  if (meetingDay) updateDropdownText(meetingDayDropdown, meetingDay);
  if (chapterType) updateDropdownText(chapterTypeDropdown, chapterType.toUpperCase()); // Ensure chapter type is uppercased
  if (chapterStatus) updateDropdownText(chapterStatusDropdown, chapterStatus.toUpperCase()); // Ensure chapter status is uppercased

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

// Fetch members data
const fetchMembers = async () => {
  try {
    const response = await fetch(
      "https://bni-data-backend.onrender.com/api/members"
    );
    if (!response.ok) {
      throw new Error("Error fetching members data");
    }

    allMembers = await response.json();
    console.log("Fetched members:", allMembers);
  } catch (error) {
    console.error("Error fetching members:", error);
  }
};

// Fetch regions data
const fetchRegions = async () => {
  try {
    const response = await fetch(regionsUrl);
    if (!response.ok) {
      throw new Error("Error fetching regions data");
    }

    allRegions = await response.json();
    console.log("Fetched regions:", allRegions);
  } catch (error) {
    console.error("Error fetching regions:", error);
  }
};

async function fetchChapters() {
  showLoader();
  try {
    console.log(`Fetching data from: ${apiUrl}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Network response was not ok. Status: ${response.status}`
      );
    }

    allChapters = await response.json();
    console.log("Fetched chapters:", allChapters);

    // Apply filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {
      region_id: urlParams.get("region_id"),
      meeting_day: urlParams.get("meeting_day"),
      chapter_type: urlParams.get("chapter_type"),
      chapter_status: urlParams.get("chapter_status"),
    };

    console.log("Filters from URL params:", filters);

    // Filter chapters based on the filters
    filteredChapters = allChapters.filter((chapter) => {
      return (
        (!filters.region_id || chapter.region_id === parseInt(filters.region_id)) &&
        (!filters.meeting_day || chapter.chapter_meeting_day.toLowerCase() === filters.meeting_day.toLowerCase()) &&
        (!filters.chapter_type || chapter.chapter_type.toUpperCase() === filters.chapter_type.toUpperCase()) &&
        (!filters.chapter_status || chapter.chapter_status.toUpperCase() === filters.chapter_status.toUpperCase())
      );
    });

    updateTotalChaptersCount();
    

    console.log("Filtered chapters:", filteredChapters);

    await Promise.all([fetchMembers(), fetchRegions()]);

    // Display filtered chapters
    displayChapters(filteredChapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
  } finally {
    hideLoader();
  }
}


// Function to get the total number of members for a chapter
const getMemberCountForChapter = (chapterId) => {
  return allMembers.filter((member) => member.chapter_id === chapterId).length;
};

// Function to update the total chapters count
const updateTotalChaptersCount = () => {
  const totalChaptersElement = document.getElementById("total-chapters-count"); // Ensure you have an element with this ID
  const totalFilteredChapters = filteredChapters.length; // Use the filtered chapters array
  totalChaptersElement.innerHTML = `<strong>${totalFilteredChapters}</strong>`;
};


// Function to get the region name for a region_id
const getRegionNameById = (regionId) => {
  const region = allRegions.find((r) => r.region_id === regionId);
  return region ? region.region_name : "Unknown Region"; // Return the region name or a default message
};

// Function to display chapters in the table
function displayChapters(chapters) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = ""; // Clear the table body

  if (chapters.length === 0) {
    // Show "No data" message if no chapters are available
    const noDataRow = document.createElement("tr");
    noDataRow.innerHTML = `
      <td colspan="9" style="text-align: center; font-weight: bold;">No data available</td>
    `;
    tableBody.appendChild(noDataRow);
    return;
  }

  // Populate the table with chapters data
  chapters.forEach((chapter, index) => {
    const membersCount = getMemberCountForChapter(chapter.chapter_id);
    const regionName = getRegionNameById(chapter.region_id);
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
            <td>${chapter.chapter_meeting_day}</td>
            <td><b>${chapter.chapter_kitty_fees}</b></td>
            <td><b>${chapter.chapter_visitor_fees}</b></td>
            <td><b>${chapter.kitty_billing_frequency}</b></td>
            <td>
              <span class="badge bg-${
                chapter.chapter_status === "running" ? "success" : "danger"
              }">${chapter.chapter_status}</span>
            </td>
            <td>
              <span class="badge bg-warning text-light" style="cursor:pointer; color:white;">
                <a href="/c/edit-chapter/?chapter_id=${
                  chapter.chapter_id
                }" style="cursor:pointer; color:white;">Edit</a>
              </span>
              <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-chapter-id="${
                chapter.chapter_id
              }">Delete</span>
            </td>
        `;
    tableBody.appendChild(row);
  });
}


// Function to filter chapters based on search input
function filterChapters(searchTerm) {
  if (searchTerm === "") {
    filteredChapters = [...allChapters];
  } else {
    filteredChapters = allChapters.filter((chapter) =>
      chapter.chapter_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  displayChapters(filteredChapters);
}

// Add event listener for the search input
document
  .getElementById("searchChapterInput")
  .addEventListener("input", function () {
    const searchTerm = this.value;
    filterChapters(searchTerm);
  });

// Call fetchChapters on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchChapters();
  loadRegions();
});

const deleteChapter = async (chapter_id) => {
  // Show confirmation using SweetAlert
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This action will mark the chapter as deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "No, cancel",
  });

  if (result.isConfirmed) {
    try {
      showLoader(); // Show loading indicator
      const response = await fetch(
        `https://bni-data-backend.onrender.com/api/deleteChapter/${chapter_id}`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        const data = await response.json();
        Swal.fire("Deleted!", data.message, "success");
        // After deletion, remove the region from the table
        document
          .querySelector(`[data-chapter-id="${chapter_id}"]`)
          .closest("tr")
          .remove();
      } else {
        const errorResponse = await response.json();
        Swal.fire("Failed!", errorResponse.message, "error");
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      Swal.fire(
        "Error!",
        "Failed to delete chapter. Please try again.",
        "error"
      );
    } finally {
      hideLoader(); // Hide loading indicator
    }
  }
};

// Add event listener for delete buttons dynamically
document
  .getElementById("chaptersTableBody")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const chapter_id = event.target.getAttribute("data-chapter-id");
      deleteChapter(chapter_id);
    }
  });