// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

// Function to hide the loader
function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// Get chapter_id from the URL
const chapter_id = new URLSearchParams(window.location.search).get("chapter_id");

if (!chapter_id) {
  console.error("Error: chapter_id is missing in the URL");
  alert("Invalid chapter ID. Please check the URL.");
}

// Function to populate Chapter Meeting Day
const populateChapterMeetingDay = (currentDay) => {
  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];
  const selectElement = document.getElementById("chapter_meeting_day");

  // Clear any existing options
  selectElement.innerHTML = '<option value="">Select</option>';

  // Add days of the week
  daysOfWeek.forEach(day => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;

    // Auto-select the current day
    if (day === currentDay) {
      option.selected = true;
    }

    selectElement.appendChild(option);
  });
};

// Function to populate Chapter Type
const populateChapterType = (currentType) => {
  const chapterTypes = ["online", "offline", "Hybrid"];
  const selectElement = document.getElementById("chapter_type");

  // Clear any existing options
  selectElement.innerHTML = '<option value="">Select</option>';

  // Add chapter types
  chapterTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter

    // Auto-select the current type
    if (type === currentType) {
      option.selected = true;
    }

    selectElement.appendChild(option);
  });
};

// Possible chapter statuses
const chapterStatusOptions = ["running", "pre-launch", "re-launch"];

// Populate Chapter Status dropdown
const populateChapterStatus = (currentStatus) => {
  const chapterStatusDropdown = document.getElementById("chapter_status");

  // Clear existing options
  chapterStatusDropdown.innerHTML = '<option value="">Select</option>';

  // Add each status as an option
  chapterStatusOptions.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize first letter
    if (status === currentStatus) {
      option.selected = true; // Auto-select the current status
    }
    chapterStatusDropdown.appendChild(option);
  });
};

// Function to populate Country dropdown
const populateCountryDropdown = async () => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    if (!response.ok) throw new Error('Failed to fetch countries.');

    const countries = await response.json();
    const countryDropdown = document.getElementById("country");

    countryDropdown.innerHTML = '<option value="">Select Country</option>'; // Clear options

    countries.forEach(country => {
      const option = document.createElement("option");
      option.value = country.cca2; // Use country code as value
      option.textContent = country.name.common; // Display country name
      countryDropdown.appendChild(option);
    });

    // Auto-select India by default
    countryDropdown.value = 'IN'; // 'IN' is the country code for India
  } catch (error) {
    console.error('Error populating country dropdown:', error);
    alert('Failed to load country data. Please try again.');
  }
};


// Fetch chapter details
const fetchChapterDetails = async () => {
  showLoader();
  try {
    const response = await fetch(`https://bni-data-backend.onrender.com/api/getChapter/${chapter_id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    await populateRegions(data.region_id); // Fetch regions and select the current one
    populateChapterFields(data);
    populateChapterMeetingDay(data.chapter_meeting_day);
    populateChapterType(data.chapter_type);
    populateChapterStatus(data.chapter_status);
  } catch (error) {
    console.error("Error fetching chapter details:", error);
    alert("Failed to load chapter details. Please try again.");
  } finally {
    hideLoader();
  }
};

// Fetch and populate regions
const populateRegions = async (currentRegionId) => {
  try {
    const response = await fetch("https://bni-data-backend.onrender.com/api/regions");
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const regions = await response.json();
    const regionSelect = document.getElementById("region_id");

    // Populate the <select> dropdown
    regionSelect.innerHTML = regions
      .map((region) => `<option value="${region.region_id}">${region.region_name}</option>`)
      .join("");

    // Set the current region as selected
    regionSelect.value = currentRegionId || "";
  } catch (error) {
    console.error("Error fetching regions:", error);
    alert("Failed to load regions. Please try again.");
  }
};

// Populate form fields with chapter data
const populateChapterFields = (data) => {
  document.getElementById("chapter_name").value = data.chapter_name || "Not Found";
  document.getElementById("contact_person").value = data.contact_person || "Not Found";
  document.getElementById("contact_number").value = data.contact_number || "Not Found";
  document.getElementById("email_id").value = data.email_id || "Not Found";
  document.getElementById("eoi_link").value = data.eoi_link || "Not Found";
  document.getElementById("member_app_link").value = data.member_app_link || "Not Found";
  document.getElementById("chapter_mission").value = data.chapter_mission || "Not Found";
  document.getElementById("chapter_vision").value = data.chapter_vision || "Not Found";
  document.getElementById("chapter_kitty_fees").value = data.chapter_kitty_fees || "Not Found";
  document.getElementById("chapter_visitor_fees").value = data.chapter_visitor_fees || "Not Found";
  document.getElementById("chapter_logo").src = data.chapter_logo || "";
  document.getElementById("state").value = data.state || "Not Found";
  document.getElementById("city").value = data.city || "Not Found";
  document.getElementById("meeting_hotel_name").value = data.meeting_hotel_name || "Not Found";
  document.getElementById("street_address_line").value = data.street_address_line || "Not Found";
  document.getElementById("postal_code").value = data.postal_code || "Not Found";
  document.getElementById("chapter_facebook").value = data.chapter_facebook || "Not Found";
  document.getElementById("chapter_instagram").value = data.chapter_instagram || "Not Found";
  document.getElementById("chapter_linkedin").value = data.chapter_linkedin || "Not Found";
  document.getElementById("chapter_youtube").value = data.chapter_youtube || "Not Found";
  document.getElementById("chapter_website").value = data.chapter_website || "Not Found";
  document.getElementById("one_time_registration_fee").value = data.one_time_registration_fee || "Not Found";
  document.getElementById("chapter_late_fees").value = data.chapter_late_fees || "Not Found";
  document.getElementById("chapter_membership_fee").value = data.chapter_membership_fee || "Not Found";
  document.getElementById("chapter_membership_fee_two_year").value = data.chapter_membership_fee_two_year || "Not Found";
  document.getElementById("chapter_membership_fee_five_year").value = data.chapter_membership_fee_five_year || "Not Found";
  document.getElementById("date_of_publishing").value =
    data.date_of_publishing ? new Date(data.date_of_publishing).toISOString().split("T")[0] : "Not Found";
  document.getElementById("chapter_launched_by").value = data.chapter_launched_by || "Not Found";
  document.getElementById("billing_frequency").value = data.kitty_billing_frequency || "Not Found";
};

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  await populateCountryDropdown();
  await fetchChapterDetails();
});

// Function to validate the form inputs
const validateChapterForm = () => {
  const contactNumber = document.querySelector("#contact_number").value.trim();
  const emailId = document.querySelector("#email_id").value.trim();
  const regionLogo = document.querySelector("#chapter_logo").files[0]; // Assuming file input for the logo

  // Validation messages
  const errors = [];

  // Validate contact number
  if (!/^\d{10}$/.test(contactNumber)) {
      errors.push("Contact number must be exactly 10 digits.");
  }

  // Validate email ID
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
      errors.push("Invalid email address format.");
  }

  // Validate region logo file type
  if (regionLogo) {
      const validExtensions = ["jpg", "jpeg", "png"];
      const fileExtension = regionLogo.name.split(".").pop().toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
          errors.push("Chapter logo must be a JPG, JPEG, or PNG file.");
      }
  }

  return errors;
};


// Function to collect form data and prepare it for the update
const collectChapterFormData = () => {
  const chapterData = {
      chapter_name: document.querySelector("#chapter_name").value,
      region_id: document.querySelector("#region_id").value,
      chapter_meeting_day: document.querySelector("#chapter_meeting_day").value,
      chapter_type: document.querySelector("#chapter_type").value,
      chapter_status: document.querySelector("#chapter_status").value,
      chapter_membership_fee: document.querySelector("#chapter_membership_fee").value,
      chapter_kitty_fees: document.querySelector("#chapter_kitty_fees").value,
      chapter_visitor_fees: document.querySelector("#chapter_visitor_fees").value,
      one_time_registration_fee: document.querySelector("#one_time_registration_fee").value,
      eoi_link: document.querySelector("#eoi_link").value,
      member_app_link: document.querySelector("#member_app_link").value,
      meeting_hotel_name: document.querySelector("#meeting_hotel_name").value,
      chapter_mission: document.querySelector("#chapter_mission").value,
      chapter_vision: document.querySelector("#chapter_vision").value,
      contact_person: document.querySelector("#contact_person").value,
      contact_number: document.querySelector("#contact_number").value,
      email_id: document.querySelector("#email_id").value,
      country: document.querySelector("#country").value,
      state: document.querySelector("#state").value,
      city: document.querySelector("#city").value,
      street_address_line: document.querySelector("#street_address_line").value,
      postal_code: document.querySelector("#postal_code").value,
      chapter_facebook: document.querySelector("#chapter_facebook").value,
      chapter_instagram: document.querySelector("#chapter_instagram").value,
      chapter_linkedin: document.querySelector("#chapter_linkedin").value,
      chapter_youtube: document.querySelector("#chapter_youtube").value,
      chapter_website: document.querySelector("#chapter_website").value,
      chapter_logo: document.querySelector("#chapter_logo").src, // Assuming logo is stored in the image src
      date_of_publishing: document.querySelector("#date_of_publishing").value,
      chapter_launched_by: document.querySelector("#chapter_launched_by").value,
      chapter_late_fees: document.querySelector("#chapter_late_fees").value,
      chapter_membership_fee_two_year: document.querySelector("#chapter_membership_fee_two_year").value,
      chapter_membership_fee_five_year: document.querySelector("#chapter_membership_fee_five_year").value,
      billing_frequency: document.querySelector("#billing_frequency").value,
  };

  return chapterData;
};

// Function to send the updated data to the backend after confirmation
const updateChapterData = async () => {

  // Validate the form inputs
  const errors = validateChapterForm();
  if (errors.length > 0) {
      Swal.fire("Validation Errors", errors.join("<br>"), "error");
      return;
  }
  // Ask for confirmation using SweetAlert
  const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You are about to edit the chapter details!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'No, cancel!',
  });

  if (result.isConfirmed) {
      const chapterData = collectChapterFormData();
      console.log(chapterData); // Verify the data before sending it

      try {
          showLoader(); // Show the loader when sending data
          const response = await fetch(`https://bni-data-backend.onrender.com/api/updateChapter/${chapter_id}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(chapterData),
          });

          if (response.ok) {
              const updatedChapter = await response.json();
              console.log('Chapter updated successfully:', updatedChapter);
              Swal.fire('Updated!', 'The chapter details have been updated.', 'success');
              // Redirect to the region page after successful update
              setTimeout(() => {
                window.location.href = '/c/manage-chapter';  // Redirect to the region page
            }, 1200);
          } else {
              const errorResponse = await response.json();
              console.error('Failed to update chapter:', errorResponse);
              Swal.fire('Error!', `Failed to update chapter: ${errorResponse.message}`, 'error');
          }
      } catch (error) {
          console.error('Error updating chapter:', error);
          Swal.fire('Error!', 'Failed to update chapter. Please try again.', 'error');
      } finally {
          hideLoader(); // Hide the loader once the request is complete
      }
  } else {
      console.log('Update canceled');
  }
};

// Event listener to trigger the update
document.getElementById("updateChapterBtn").addEventListener("click", updateChapterData);

