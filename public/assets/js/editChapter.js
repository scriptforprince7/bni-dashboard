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
    if (type.toLowerCase() === currentType.toLowerCase()) {
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
    console.log('🔄 Populating chapter status with:', currentStatus);

    // Clean the status string by removing extra quotes
    const cleanStatus = currentStatus.replace(/^"|"$/g, '');
    console.log('🧹 Cleaned status:', cleanStatus);

    // Clear existing options
    chapterStatusDropdown.innerHTML = '<option value="">Select</option>';

    // Add each status as an option
    chapterStatusOptions.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize first letter
        
        // Compare cleaned status with current option
        if (status.toLowerCase() === cleanStatus.toLowerCase()) {
            console.log('✅ Found matching status:', status);
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
    const response = await fetch(`https://backend.bninewdelhi.com/api/getChapter/${chapter_id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('📥 Received chapter data:', data);
    
    await populateRegions(data.region_id);
    populateChapterFields(data);
    populateChapterMeetingDay(data.chapter_meeting_day);
    populateChapterType(data.chapter_type);
    
    // Log the status before populating
    console.log('📊 Chapter status from API:', data.chapter_status);
    populateChapterStatus(data.chapter_status);
    
  } catch (error) {
    console.error("❌ Error fetching chapter details:", error);
    alert("Failed to load chapter details. Please try again.");
  } finally {
    hideLoader();
  }
};

// Fetch and populate regions
const populateRegions = async (currentRegionId) => {
  try {
    const response = await fetch("https://backend.bninewdelhi.com/api/regions");
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

// Function to fetch hotels based on region's hotel_ids
const fetchAndPopulateHotels = async (selectedHotelId, regionId) => {
    console.log('🔄 Starting hotel population process');
    console.log('Selected Hotel ID:', selectedHotelId);
    console.log('Region ID:', regionId);

    try {
        // First fetch region data to get hotel_ids array
        const regionResponse = await fetch('https://backend.bninewdelhi.com/api/regions');
        if (!regionResponse.ok) {
            throw new Error(`Failed to fetch regions: ${regionResponse.status}`);
        }
        const regions = await regionResponse.json();
        
        // Find the matching region
        const selectedRegion = regions.find(region => region.region_id === parseInt(regionId));
        console.log('📍 Selected Region:', selectedRegion?.region_name);
        console.log('🏨 Region Hotel IDs:', selectedRegion?.hotel_id);

        if (!selectedRegion || !selectedRegion.hotel_id) {
            console.warn('⚠️ No hotel IDs found for this region');
            return;
        }

        // Fetch all hotels
        const hotelsResponse = await fetch('https://backend.bninewdelhi.com/api/getHotels');
        if (!hotelsResponse.ok) {
            throw new Error(`Failed to fetch hotels: ${hotelsResponse.status}`);
        }
        const allHotels = await hotelsResponse.json();
        console.log('📥 All Hotels:', allHotels);

        // Filter hotels based on region's hotel_ids
        const regionHotels = allHotels.filter(hotel => 
            selectedRegion.hotel_id.includes(hotel.hotel_id)
        );
        console.log('🏨 Filtered Hotels for Region:', regionHotels);

        const hotelSelect = document.getElementById('hotel_id');
        hotelSelect.innerHTML = '<option value="">Select</option>';

        // Populate dropdown with filtered hotels
        regionHotels.forEach(hotel => {
            const option = document.createElement('option');
            option.value = hotel.hotel_id;
            option.textContent = hotel.hotel_name;
            
            // Set selected if matches current hotel_id
            if (hotel.hotel_id === parseInt(selectedHotelId)) {
                option.selected = true;
                console.log('✅ Pre-selecting hotel:', hotel.hotel_name);
            }
            
            hotelSelect.appendChild(option);
        });

    } catch (error) {
        console.error('❌ Error in hotel population:', error);
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
  document.getElementById("street_address_line").value = data.street_address_line || "Not Found";
  document.getElementById("postal_code").value = data.postal_code || "Not Found";
  document.getElementById("chapter_facebook").value = data.chapter_facebook || "Not Found";
  document.getElementById("chapter_instagram").value = data.chapter_instagram || "Not Found";
  document.getElementById("chapter_linkedin").value = data.chapter_linkedin || "Not Found";
  document.getElementById("chapter_youtube").value = data.chapter_youtube || "Not Found";
  document.getElementById("chapter_website").value = data.chapter_website || "Not Found";
  document.getElementById("one_time_registration_fee").value = data.one_time_registration_fee || "Not Found";
  document.getElementById("chapter_late_fees").value = data.chapter_late_fees || "Not Found";
  document.getElementById("chapter_available_fund").value = data.available_fund || "Not Found";
  document.getElementById("chapter_membership_fee").value = data.chapter_membership_fee || "Not Found";
  document.getElementById("chapter_membership_fee_two_year").value = data.chapter_membership_fee_two_year || "Not Found";
  document.getElementById("chapter_membership_fee_five_year").value = data.chapter_membership_fee_five_year || "Not Found";
  document.getElementById("date_of_publishing").value =
    data.date_of_publishing ? new Date(data.date_of_publishing).toISOString().split("T")[0] : "Not Found";
  document.getElementById("chapter_launched_by").value = data.chapter_launched_by || "Not Found";
  document.getElementById("billing_frequency").value = data.kitty_billing_frequency || "Not Found";
  document.getElementById("president_email").value = data.president_mail || "Not Found";
  document.getElementById("vice_president_email").value = data.vice_president_mail || "Not Found";
  document.getElementById("treasurer_email").value = data.treasurer_mail || "Not Found";

  // Handle logo preview
  const logoPreviewContainer = document.getElementById('logoPreviewContainer');
  const logoPreview = document.getElementById('logoPreview');
  
  console.log('🖼️ Processing chapter logo:', data.chapter_logo);
  
  if (data.chapter_logo) {
    // Use consistent URL pattern for chapter logos
    const logoUrl = `https://backend.bninewdelhi.com/api/uploads/chapterLogos/${data.chapter_logo}`;
    console.log('🔗 Setting logo URL:', logoUrl);
    
    logoPreview.src = logoUrl;
    logoPreviewContainer.style.display = 'block';
  } else {
    console.log('ℹ️ No logo found for chapter');
    logoPreviewContainer.style.display = 'none';
  }

  // Add hotel population with region_id
  if (data.hotel_id && data.region_id) {
    console.log('🏢 Populating hotels for:');
    console.log('Chapter Hotel ID:', data.hotel_id);
    console.log('Region ID:', data.region_id);
    fetchAndPopulateHotels(data.hotel_id, data.region_id);
  }
};

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  await fetchChapterDetails();
});

// Function to validate the form inputs
const validateChapterForm = () => {
    const errors = [];

    // Chapter Name validation
    const chapterName = document.querySelector("#chapter_name").value.trim();
    if (!chapterName) {
        errors.push("Chapter name is required.");
    }

    // Region Selection validation
    const regionId = document.querySelector("#region_id").value;
    if (!regionId) {
        errors.push("Please select a region.");
    }

    // Meeting Day validation
    const meetingDay = document.querySelector("#chapter_meeting_day").value;
    if (!meetingDay) {
        errors.push("Please select a meeting day.");
    }

    // Chapter Type validation
    const chapterType = document.querySelector("#chapter_type").value;
    if (!chapterType) {
        errors.push("Please select a chapter type.");
    }

    // Contact Number validation
    const contactNumber = document.querySelector("#contact_number").value.trim();
    if (!/^\d{10}$/.test(contactNumber)) {
        errors.push("Contact number must be exactly 10 digits.");
    }

    // Email validation
    const emailId = document.querySelector("#email_id").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
        errors.push("Please enter a valid email address.");
    }

    // Kitty Billing Frequency validation
    const billingFrequency = document.querySelector("#billing_frequency").value;
    if (!billingFrequency) {
        errors.push("Please select kitty billing frequency.");
    }

    // Chapter Meeting/Kitty Fees validation
    const kittyFees = document.querySelector("#chapter_kitty_fees").value.trim();
    if (!kittyFees) {
        errors.push("Chapter meeting/kitty fees is required.");
    } else if (isNaN(parseFloat(kittyFees))) {
        errors.push("Kitty fees must be a valid number.");
    }

    // Chapter Visitor Fee validation
    const visitorFees = document.querySelector("#chapter_visitor_fees").value.trim();
    if (!visitorFees) {
        errors.push("Chapter visitor fee is required.");
    } else if (isNaN(parseFloat(visitorFees))) {
        errors.push("Visitor fee must be a valid number.");
    }

    // Chapter Status validation
    const chapterStatus = document.querySelector("#chapter_status").value;
    if (!chapterStatus) {
        errors.push("Please select chapter status.");
    }

    // State validation
    const state = document.querySelector("#state").value.trim();
    if (!state) {
        errors.push("State/Province is required.");
    }

    // City validation
    const city = document.querySelector("#city").value.trim();
    if (!city) {
        errors.push("City is required.");
    }

    // Street Address validation
    const streetAddress = document.querySelector("#street_address_line").value.trim();
    if (!streetAddress) {
        errors.push("Street Address Line is required.");
    }

    // Postal Code validation
    const postalCode = document.querySelector("#postal_code").value.trim();
    if (!postalCode) {
        errors.push("Postal Code is required.");
    } else if (!/^\d{6}$/.test(postalCode)) {
        errors.push("Please enter a valid 6-digit postal code.");
    }


    // Date of Publishing validation
    const publishingDate = document.querySelector("#date_of_publishing").value;
    if (!publishingDate) {
        errors.push("Please select the date of publishing.");
    }

    // Chapter Launched By validation
    const launchedBy = document.querySelector("#chapter_launched_by").value.trim();
    if (!launchedBy) {
        errors.push("Please enter who launched the chapter.");
    }

    // Logo file validation (only if a new file is selected)
    const logoFile = document.querySelector("#chapter_logo").files[0];
    if (logoFile) {
        const validExtensions = ["jpg", "jpeg", "png"];
        const fileExtension = logoFile.name.split(".").pop().toLowerCase();
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
      chapter_available_fund: document.querySelector("#chapter_available_fund").value,
      hotel_id: document.getElementById('hotel_id').value,
      president_email: document.getElementById('president_email').value,
      vice_president_email: document.getElementById('vice_president_email').value,
      treasurer_email: document.getElementById('treasurer_email').value,
  };

  console.log('📦 Collected chapter data with hotel:', chapterData);
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

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to edit the chapter details!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
        try {
            showLoader();
            const formData = new FormData();
            
            // Add all form fields to FormData
            const chapterData = collectChapterFormData();
            Object.keys(chapterData).forEach(key => {
                if (key !== 'chapter_logo') { // Handle logo separately
                    formData.append(key, chapterData[key]);
                }
            });
            
            // Handle logo file
            const logoInput = document.getElementById('chapter_logo');
            if (logoInput.files[0]) {
                console.log('📸 New logo selected:', {
                    name: logoInput.files[0].name,
                    type: logoInput.files[0].type,
                    size: `${(logoInput.files[0].size / 1024).toFixed(2)}KB`
                });
                formData.append('chapter_logo', logoInput.files[0]);
            }
            
            console.log('📤 Sending update request with logo...');
            const response = await fetch(`https://backend.bninewdelhi.com/api/updateChapter/${chapter_id}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                const updatedChapter = await response.json();
                console.log('✅ Chapter updated successfully:', updatedChapter);
                
                // Update logo preview if new logo was uploaded
                if (updatedChapter.chapter_logo) {
                    const logoUrl = `https://backend.bninewdelhi.com/api/uploads/chapterLogos/${updatedChapter.chapter_logo}`;
                    console.log('🔄 Updating logo preview with:', logoUrl);
                    document.getElementById('logoPreview').src = logoUrl;
                }
                
                Swal.fire('Updated!', 'Chapter details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/c/manage-chapter';
                }, 1200);
            } else {
                const errorResponse = await response.json();
                console.error('❌ Update failed:', errorResponse);
                Swal.fire('Error!', `Failed to update chapter: ${errorResponse.message}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error updating chapter:', error);
            Swal.fire('Error!', 'Failed to update chapter. Please try again.', 'error');
        } finally {
            hideLoader();
        }
    } else {
        console.log('❌ Update canceled by user');
    }
};

// Event listener to trigger the update
document.getElementById("updateChapterBtn").addEventListener("click", updateChapterData);

// Add logo preview functionality
document.getElementById('chapter_logo').addEventListener('change', function(e) {
    console.log('📸 Logo input changed');
    const file = e.target.files[0];
    if (file) {
        console.log('📄 Selected file:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)}KB`
        });
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('logoPreview');
            console.log('🖼️ Setting preview image');
            preview.src = e.target.result;
            document.getElementById('logoPreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Add event listener for region change to update hotels
document.getElementById('region_id').addEventListener('change', function() {
    const selectedRegionId = this.value;
    console.log('🔄 Region changed to:', selectedRegionId);
    if (selectedRegionId) {
        fetchAndPopulateHotels(null, selectedRegionId);
    }
});

