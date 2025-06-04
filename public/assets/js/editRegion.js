// Function to show the loader
function showLoader() {
    document.getElementById("loader").style.display = "flex";
}

// Function to hide the loader
function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

const region_id = new URLSearchParams(window.location.search).get("region_id");

if (!region_id) {
    console.error("Error: region_id is missing in the URL");
}

let accoladeMap = {};

// Fetch accolades data


const fetchRegionDetails = async () => {
    showLoader();
    try {
        const response = await fetch(`http://localhost:5000/api/getRegion/${region_id}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("data recived-----",data);
        populateFormFields(data);
    } catch (error) {
        console.error("Error fetching region details:", error);
        alert("Failed to load region details. Please try again.");
    } finally {
        hideLoader();
    }
};

// Fetch all accolades
const fetchAccolades = async () => {
    showLoader();
    try {
        const response = await fetch("http://localhost:5000/api/accolades");
        if (!response.ok) {
            throw new Error(`Accolades API error: ${response.status} ${response.statusText}`);
        }
        const accolades = await response.json();
        accoladeMap = accolades.reduce((map, accolade) => {
            map[accolade.accolade_id] = accolade.accolade_name;
            return map;
        }, {});

        // Populate accolades container
        const accoladesContainer = document.getElementById("accoladesContainer");
        accoladesContainer.innerHTML = ""; // Clear container
        accolades.forEach(accolade => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "accolades[]";
            checkbox.value = accolade.accolade_id;
            checkbox.id = `accolade_${accolade.accolade_id}`;
            
            const label = document.createElement("label");
            label.htmlFor = `accolade_${accolade.accolade_id}`;
            label.textContent = accolade.accolade_name;

            const div = document.createElement("div");
            div.appendChild(checkbox);
            div.appendChild(label);

            accoladesContainer.appendChild(div);
        });
    } catch (error) {
        console.error("Error fetching accolades:", error);
        alert("Failed to load accolades. Please try again.");
    }
};

// Fetch country data
const fetchCountries = async () => {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const selectElement = document.getElementById('region_country');

        if (!selectElement) {
            console.error("Dropdown element with ID 'region_country' not found!");
            return;
        }

        // Clear existing options
        selectElement.innerHTML = '<option value="">Select Country</option>';

        // Add "India" as the first option
        const indiaOption = document.createElement('option');
        indiaOption.value = "IN"; // Country code for India
        indiaOption.innerHTML = "India";
        selectElement.appendChild(indiaOption);

        // Populate the rest of the select element with other countries
        data.forEach(country => {
            // Skip "India" to avoid duplication
            if (country.name.common.toLowerCase() === "india") return;

            const option = document.createElement('option');
            option.value = country.cca2; // Use country code as value
            option.innerHTML = `${country.name.common}`;
            selectElement.appendChild(option);
        });

        // Ensure "India" is selected by default
        selectElement.value = "IN";
        console.log('Dropdown populated successfully!');
    } catch (error) {
        console.error('Error fetching countries:', error);
    }
};

// Add these functions at the beginning after the loader functions
function setupSelectAllHandlers() {
    console.log('Setting up Select All handlers');
    
    // Chapter Days
    const selectAllDays = document.getElementById('selectAllDays');
    const dayCheckboxes = document.querySelectorAll('#chapterDaysContainer .form-check-input');
    setupSelectAllForGroup(selectAllDays, dayCheckboxes, 'Chapter Days');

    // Chapter Status
    const selectAllStatus = document.getElementById('selectAllStatus');
    const statusCheckboxes = document.querySelectorAll('#chapterStatusContainer .form-check-input');
    setupSelectAllForGroup(selectAllStatus, statusCheckboxes, 'Chapter Status');

    // Chapter Type
    const selectAllTypes = document.getElementById('selectAllTypes');
    const typeCheckboxes = document.querySelectorAll('#chapterTypeContainer .form-check-input');
    setupSelectAllForGroup(selectAllTypes, typeCheckboxes, 'Chapter Type');

    // Accolades
    const selectAllAccolades = document.getElementById('selectAllAccolades');
    const accoladeCheckboxes = document.querySelectorAll('#accoladesContainer .form-check-input');
    setupSelectAllForGroup(selectAllAccolades, accoladeCheckboxes, 'Accolades');

    // Hotels
    const selectAllHotels = document.getElementById('selectAllHotels');
    const hotelCheckboxes = document.querySelectorAll('#hotelsContainer input[name="hotels[]"]');
    setupSelectAllForGroup(selectAllHotels, hotelCheckboxes, 'Hotels');
}

function setupSelectAllForGroup(selectAllCheckbox, groupCheckboxes, groupName) {
    if (!selectAllCheckbox) {
        console.warn(`Select All checkbox for ${groupName} not found`);
        return;
    }

    console.log(`Setting up ${groupName} group with ${groupCheckboxes.length} checkboxes`);

    // Handle "Select All" checkbox change
    selectAllCheckbox.addEventListener('change', function() {
        console.log(`${groupName} Select All clicked: ${this.checked}`);
        groupCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    // Handle individual checkbox changes
    groupCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allChecked = Array.from(groupCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
            console.log(`${groupName} checkbox changed, all checked: ${allChecked}`);
        });
    });
}

// Update the populateFormFields function to handle "Select All" states
function updateSelectAllStates() {
    console.log('Updating Select All states');

    // Check Chapter Days
    const dayCheckboxes = document.querySelectorAll('#chapterDaysContainer input[name="chapterDays[]"]');
    const selectAllDays = document.getElementById('selectAllDays');
    if (selectAllDays && dayCheckboxes.length > 0) {
        selectAllDays.checked = Array.from(dayCheckboxes).every(cb => cb.checked);
    }

    // Check Chapter Status
    const statusCheckboxes = document.querySelectorAll('#chapterStatusContainer input[name="chapterStatus[]"]');
    const selectAllStatus = document.getElementById('selectAllStatus');
    if (selectAllStatus && statusCheckboxes.length > 0) {
        selectAllStatus.checked = Array.from(statusCheckboxes).every(cb => cb.checked);
    }

    // Check Chapter Type
    const typeCheckboxes = document.querySelectorAll('#chapterTypeContainer input[name="chapterType[]"]');
    const selectAllTypes = document.getElementById('selectAllTypes');
    if (selectAllTypes && typeCheckboxes.length > 0) {
        selectAllTypes.checked = Array.from(typeCheckboxes).every(cb => cb.checked);
    }

    // Check Accolades
    const accoladeCheckboxes = document.querySelectorAll('#accoladesContainer input[name="accolades[]"]');
    const selectAllAccolades = document.getElementById('selectAllAccolades');
    if (selectAllAccolades && accoladeCheckboxes.length > 0) {
        selectAllAccolades.checked = Array.from(accoladeCheckboxes).every(cb => cb.checked);
    }

    // Check Hotels
    const hotelCheckboxes = document.querySelectorAll('#hotelsContainer input[name="hotels[]"]');
    const selectAllHotels = document.getElementById('selectAllHotels');
    if (selectAllHotels && hotelCheckboxes.length > 0) {
        selectAllHotels.checked = Array.from(hotelCheckboxes).every(cb => cb.checked);
        console.log('Hotels Select All state:', selectAllHotels.checked);
    }
}

// Modify the existing populateFormFields function
const populateFormFields = (data) => {
    console.log('🔄 Starting to populate form fields with data:', data);

    // Handle logo preview
    if (data.region_logo) {
        console.log('🖼️ Found logo filename:', data.region_logo);
        const preview = document.getElementById('preview');
        const imagePreview = document.getElementById('imagePreview');
        
        // Construct the URL if not provided in response
        const logoUrl = `http://localhost:5000/api/uploads/regionLogos/${data.region_logo}`;
        console.log('🔗 Using logo URL:', logoUrl);
        
        if (preview && imagePreview) {
            preview.src = logoUrl;
            imagePreview.style.display = 'block';
            console.log('✅ Logo preview updated successfully');
        } else {
            console.warn('⚠️ Preview elements not found in DOM');
        }
    } else {
        console.log('ℹ️ No logo found for this region');
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
    }

    // Standard fields
    document.querySelector("#region_name").value = data.region_name || "Not Found";
    document.querySelector("#contact_person").value = data.contact_person || "Not Found";
    document.querySelector("#contact_number").value = data.contact_number || "Not Found";
    document.querySelector("#email_id").value = data.email_id || "Not Found";
    document.querySelector("#mission").value = data.mission || "Not Found";
    document.querySelector("#vision").value = data.vision || "Not Found";

    document.querySelector("#region_status").value = data.region_status || "null";
    document.querySelector("#one_time_registration_fee").value = data.one_time_registration_fee || "Not Found";
    document.querySelector("#one_year_fee").value = data.one_year_fee || "Not Found";
    document.querySelector("#two_year_fee").value = data.two_year_fee || "Not Found";
    document.querySelector("#five_year_fee").value = data.five_year_fee || "Not Found";
    document.querySelector("#late_fees").value = data.late_fees || "Not Found";

    // Set the country dropdown after the region details load
    const regionCountry = data.country || "IN";  // Default to India if no country set
    const countryDropdown = document.querySelector("#region_country");
    countryDropdown.value = regionCountry;  // Ensure the correct country is selected

    document.querySelector("#state").value = data.state || "Not Found";
    document.querySelector("#city").value = data.city || "Not Found";
    document.querySelector("#street_address_line_1").value = data.street_address_line_1 || "Not Found";
    document.querySelector("#street_address_line_2").value = data.street_address_line_2 || "Not Found";
    document.querySelector("#postal_code").value = data.postal_code || "Not Found";
    document.querySelector("#social_facebook").value = data.social_facebook || "Not Found";
    document.querySelector("#social_instagram").value = data.social_instagram || "Not Found";
    document.querySelector("#social_linkedin").value = data.social_linkedin || "Not Found";
    document.querySelector("#social_youtube").value = data.social_youtube || "Not Found";
    document.querySelector("#website_link").value = data.website_link || "Not Found";
    document.querySelector("#date_of_publishing").value =
        data.date_of_publishing ? new Date(data.date_of_publishing).toISOString().split("T")[0] : "Not Found";
    document.querySelector("#region_launched_by").value = data.region_launched_by || "Not Found";

    // Check Chapter Days
    const chapterDays = data.days_of_chapter || [];
    chapterDays.forEach(day => {
        const checkbox = document.querySelector(`input[name="chapterDays[]"][value="${day}"]`);
        if (checkbox) {
            checkbox.checked = true;
            console.log(`Checked day: ${day}`);
        }
    });

    // Check Chapter Status
    const chapterStatus = data.chapter_status || [];
    console.log('Received chapter_status:', chapterStatus);
    
    // Create a mapping for exact matches
    const statusMapping = {
        '"Running"': 'Running',
        '"Pre-Launch"': 'Pre-Launch',
        '"Re-Launch"': 'Re-Launch',
        'Running': 'Running',
        'Pre-Launch': 'Pre-Launch',
        'Re-Launch': 'Re-Launch'
    };

    chapterStatus.forEach(status => {
        // Get the mapped value or use the original status
        const mappedStatus = statusMapping[status] || status;
        console.log(`Looking for checkbox with value: ${mappedStatus}`);
        
        // Find checkbox with exact mapped value
        const checkbox = document.querySelector(`input[name="chapterStatus[]"][value="${mappedStatus}"]`);
        if (checkbox) {
            checkbox.checked = true;
            console.log(`✅ Checked status: ${mappedStatus}`);
        } else {
            // Log the actual HTML for debugging
            const allCheckboxes = document.querySelectorAll('input[name="chapterStatus[]"]');
            console.log('Available checkboxes:', Array.from(allCheckboxes).map(cb => cb.value));
            console.log(`❌ Checkbox not found for status: ${mappedStatus}`);
        }
    });

    // Check Chapter Type
    const chapterType = data.chapter_type || [];
    chapterType.forEach(type => {
        console.log(`Looking for checkbox with value: ${type}`);
        const checkbox = document.querySelector(`input[name="chapterType[]"][value="${type}"]`);
        if (checkbox) {
            checkbox.checked = true;
            console.log(`✅ Checked type: ${type}`);
        } else {
            console.log(`❌ Checkbox not found for type: ${type}`);
        }
    });

    // Check Accolades Configuration
    const accoladesConfig = data.accolades_config || [];
    accoladesConfig.forEach(accoladeId => {
        console.log(`Looking for accolade checkbox with value: ${accoladeId}`);
        const checkbox = document.querySelector(`input[name="accolades[]"][value="${accoladeId}"]`);
        if (checkbox) {
            checkbox.checked = true;
            console.log(`✅ Checked accolade: ${accoladeId}`);
        } else {
            console.log(`❌ Checkbox not found for accolade: ${accoladeId}`);
        }
    });

    // Check Hotels Configuration
    const hotelIds = data.hotel_id || [];
    console.log('🏨 Hotel IDs from data:', hotelIds);
    
    hotelIds.forEach(hotelId => {
        console.log(`Looking for hotel checkbox with value: ${hotelId}`);
        const checkbox = document.querySelector(`input[name="hotels[]"][value="${hotelId}"]`);
        if (checkbox) {
            checkbox.checked = true;
            console.log(`✅ Checked hotel: ${hotelId}`);
        } else {
            console.log(`❌ Checkbox not found for hotel: ${hotelId}`);
        }
    });

    // After setting all checkboxes
    console.log('Populating form fields completed, updating Select All states');
    updateSelectAllStates();
};

// Helper Function to Parse Chapter Status (Fixing malformed string formats)
const parseArrayString = (str) => {
    if (!str) return [];
    // Strip the curly braces, then split by commas and clean up the items
    const cleanedStr = str.replace(/[{}]/g, "").split(",").map(item => item.trim().replace(/^"|"$/g, ''));
    return cleanedStr;
};



// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCountries(); // Ensure countries are loaded first
    await fetchAccolades(); // Fetch all accolades first
    await fetchHotels();
    console.log('Setting up edit region page');
    setupSelectAllHandlers();
    await fetchRegionDetails(); // Then fetch and populate region details
});



// Function to validate the form inputs
const validateRegionForm = () => {
    const errors = [];

    // Region Name validation
    const regionName = document.querySelector("#region_name").value.trim();
    if (!regionName) {
        errors.push("Region name is required.");
    }

    // Contact Person validation
    const contactPerson = document.querySelector("#contact_person").value.trim();
    if (!contactPerson) {
        errors.push("Contact person name is required.");
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

    // Chapter Days validation - at least one required
    const selectedDays = Array.from(document.querySelectorAll('input[name="chapterDays[]"]:checked'));
    if (selectedDays.length === 0) {
        errors.push("Please select at least one chapter day.");
    }

    // Chapter Status validation - at least one required
    const selectedStatus = Array.from(document.querySelectorAll('input[name="chapterStatus[]"]:checked'));
    if (selectedStatus.length === 0) {
        errors.push("Please select at least one chapter status.");
    }

    // Chapter Type validation - at least one required
    const selectedType = Array.from(document.querySelectorAll('input[name="chapterType[]"]:checked'));
    if (selectedType.length === 0) {
        errors.push("Please select at least one chapter type.");
    }

    // Accolades Configuration validation
    const selectedAccolades = Array.from(document.querySelectorAll('input[name="accolades[]"]:checked'));
    if (selectedAccolades.length === 0) {
        errors.push("Please select at least one accolade.");
    }

    // Region Status validation
    const regionStatus = document.querySelector("#region_status").value;
    if (!regionStatus || regionStatus === '') {
        errors.push("Please select a region status.");
    }

    // Date of Publishing validation
    const publishingDate = document.querySelector("#date_of_publishing").value;
    if (!publishingDate) {
        errors.push("Please select the date of publishing.");
    }

    // Region Launched By validation
    const launchedBy = document.querySelector("#region_launched_by").value.trim();
    if (!launchedBy) {
        errors.push("Please enter who launched the region.");
    }

    // Membership Fee Information Validations
    // One time registration fee validation
    const registrationFee = document.querySelector("#one_time_registration_fee").value.trim();
    if (!registrationFee) {
        errors.push("One time registration fee is required.");
    } else if (isNaN(parseFloat(registrationFee))) {
        errors.push("One time registration fee must be a valid number.");
    }

    // Membership fees validation (1 year, 2 year, 5 year)
    const feeFields = [
        { id: "one_year_fee", label: "ONE YEAR FEE" },
        { id: "two_year_fee", label: "TWO YEAR FEE" },
        { id: "five_year_fee", label: "FIVE YEAR FEE" }
    ];

    feeFields.forEach(field => {
        const value = document.querySelector(`#${field.id}`).value.trim();
        if (!value) {
            errors.push(`${field.label} is required.`);
        } else if (isNaN(parseFloat(value))) {
            errors.push(`${field.label} must be a valid number.`);
        }
    });

    // Late fees validation
    const lateFees = document.querySelector("#late_fees").value.trim();
    if (!lateFees) {
        errors.push("Late fees amount is required.");
    } else if (isNaN(parseFloat(lateFees))) {
        errors.push("Late fees must be a valid number.");
    }

    // Address & Venue Details Validations
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
    const streetAddress = document.querySelector("#street_address_line_1").value.trim();
    if (!streetAddress) {
        errors.push("Street Address Line 1 is required.");
    }

    // Postal Code validation
    const postalCode = document.querySelector("#postal_code").value.trim();
    if (!postalCode) {
        errors.push("Postal Code is required.");
    } else if (!/^\d{6}$/.test(postalCode)) {
        errors.push("Please enter a valid 6-digit postal code.");
    }

    // Validate numeric values for all fee fields
    const numericFields = [
        { id: "one_time_registration_fee", label: "One time registration fee" },
        { id: "one_year_fee", label: "One year fee" },
        { id: "two_year_fee", label: "Two year fee" },
        { id: "five_year_fee", label: "Five year fee" },
        { id: "late_fees", label: "Late fees" }
    ];

    numericFields.forEach(field => {
        const value = document.querySelector(`#${field.id}`).value.trim();
        if (value && !/^\d+(\.\d{1,2})?$/.test(value)) {
            errors.push(`${field.label} must be a valid number with up to 2 decimal places.`);
        }
    });

    // Logo file validation (only if a new file is selected)
    const logoFile = document.querySelector("#region_logo").files[0];
    if (logoFile) {
        const validExtensions = ["jpg", "jpeg", "png"];
        const fileExtension = logoFile.name.split(".").pop().toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
            errors.push("Region logo must be a JPG, JPEG, or PNG file.");
        }
    }

    return errors;
};

// Add this function to handle form data collection
const collectFormData = () => {
    console.log('📝 Starting to collect form data');
    const formData = new FormData();

    // Handle file upload
    const logoInput = document.querySelector("#region_logo");
    if (logoInput && logoInput.files.length > 0) {
        console.log('🖼️ New logo file detected:', logoInput.files[0].name);
        formData.append('region_logo', logoInput.files[0]);
    } else {
        console.log('ℹ️ No new logo file selected');
    }

    // Add other form fields
    const fields = {
        region_name: document.querySelector("#region_name").value,
        contact_person: document.querySelector("#contact_person").value,
        contact_number: document.querySelector("#contact_number").value,
        email_id: document.querySelector("#email_id").value,
        mission: document.querySelector("#mission").value,
        vision: document.querySelector("#vision").value,
        region_status: document.querySelector("#region_status").value,
        one_time_registration_fee: document.querySelector("#one_time_registration_fee").value,
        one_year_fee: document.querySelector("#one_year_fee").value,
        two_year_fee: document.querySelector("#two_year_fee").value,
        five_year_fee: document.querySelector("#five_year_fee").value,
        late_fees: document.querySelector("#late_fees").value,
        country: document.querySelector("#region_country").value,
        state: document.querySelector("#state").value,
        city: document.querySelector("#city").value,
        street_address_line_1: document.querySelector("#street_address_line_1").value,
        street_address_line_2: document.querySelector("#street_address_line_2").value,
        postal_code: document.querySelector("#postal_code").value,
        social_facebook: document.querySelector("#social_facebook").value,
        social_instagram: document.querySelector("#social_instagram").value,
        social_linkedin: document.querySelector("#social_linkedin").value,
        social_youtube: document.querySelector("#social_youtube").value,
        website_link: document.querySelector("#website_link").value,
        date_of_publishing: document.querySelector("#date_of_publishing").value,
        region_launched_by: document.querySelector("#region_launched_by").value,
        // Chapter days (from checkboxes)
        chapter_days: Array.from(document.querySelectorAll('input[name="chapterDays[]"]:checked')).map(checkbox => checkbox.value),
        chapter_status: Array.from(document.querySelectorAll('input[name="chapterStatus[]"]:checked')).map(checkbox => checkbox.value),
        chapter_type: Array.from(document.querySelectorAll('input[name="chapterType[]"]:checked')).map(checkbox => checkbox.value),
        accolades_config: Array.from(document.querySelectorAll('input[name="accolades[]"]:checked')).map(checkbox => checkbox.value),
        hotels_config: Array.from(document.querySelectorAll('input[name="hotels[]"]:checked')).map(checkbox => checkbox.value),
    };

    // Append all fields to FormData
    for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
    }

    console.log('✅ Form data collected successfully');
    return formData;
};

// Update the updateRegionData function
const updateRegionData = async () => {
    console.log('🔄 Starting region update process');
    
    try {
        showLoader();
        const formData = collectFormData();
        
        console.log('🚀 Sending update request to server');
        const response = await fetch(`http://localhost:5000/api/updateRegion/${region_id}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Update successful:', result);

        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Region updated successfully',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3085d6',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.location.href = '/r/manage-region';
        });

    } catch (error) {
        console.error('❌ Error updating region:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to update region. Please try again.'
        });
    } finally {
        hideLoader();
    }
};

// Add preview functionality
function previewImage(event) {
    console.log('🔄 Starting image preview process');
    const file = event.target.files[0];
    const preview = document.getElementById('preview');
    const imagePreview = document.getElementById('imagePreview');
    
    if (!preview || !imagePreview) {
        console.error('❌ Preview elements not found');
        return;
    }
    
    if (file) {
        console.log('📁 File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        // Validate file type
        if (!file.type.match('image.*')) {
            console.error('❌ Invalid file type');
            toastr.error('Please select an image file (JPG, JPEG, or PNG)');
            event.target.value = '';
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            console.error('❌ File too large');
            toastr.error('File size should not exceed 2MB');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('✅ Image loaded successfully');
            preview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.onerror = function(e) {
            console.error('❌ Error reading file:', e);
            toastr.error('Error loading image preview');
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    console.log('🗑️ Removing current logo image');
    const fileInput = document.getElementById('region_logo');
    const preview = document.getElementById('preview');
    const imagePreview = document.getElementById('imagePreview');
    
    if (fileInput) fileInput.value = '';
    if (preview) preview.src = '';
    if (imagePreview) imagePreview.style.display = 'none';
    
    console.log('✅ Image removed successfully');
}

// Add this at the beginning of your file
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM Loaded - Setting up Edit Region functionality');
    
    const updateButton = document.getElementById('updateRegionBtn');
    if (!updateButton) {
        console.error('❌ Update Region button not found!');
        return;
    }

    console.log('✅ Found Update Region button, adding click listener');
    
    updateButton.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('🔄 Edit Region button clicked');

        // Validate the form inputs
        const errors = validateRegionForm();
        if (errors.length > 0) {
            console.log('❌ Validation errors found:', errors);
            Swal.fire({
                title: "Validation Errors",
                html: errors.join("<br>"),
                icon: "error"
            });
            return;
        }

        try {
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You want to update this region?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, update it!'
            });

            if (result.isConfirmed) {
                console.log('✅ User confirmed update');
                showLoader();

                // Create FormData object
                const formData = new FormData();
                
                // Add file if it exists
                const logoInput = document.getElementById('region_logo');
                if (logoInput && logoInput.files.length > 0) {
                    console.log('📁 Adding new logo file:', logoInput.files[0].name);
                    formData.append('region_logo', logoInput.files[0]);
                }

                // Add all other form fields
                const fields = {
                    region_name: document.getElementById('region_name').value,
                    contact_person: document.getElementById('contact_person').value,
                    contact_number: document.getElementById('contact_number').value,
                    email_id: document.getElementById('email_id').value,
                    mission: document.getElementById('mission').value,
                    vision: document.getElementById('vision').value,
                    region_status: document.getElementById('region_status').value,
                    one_time_registration_fee: document.getElementById('one_time_registration_fee').value,
                    one_year_fee: document.getElementById('one_year_fee').value,
                    two_year_fee: document.getElementById('two_year_fee').value,
                    five_year_fee: document.getElementById('five_year_fee').value,
                    late_fees: document.getElementById('late_fees').value,
                    country: document.getElementById('region_country').value,
                    state: document.getElementById('state').value,
                    city: document.getElementById('city').value,
                    street_address_line_1: document.getElementById('street_address_line_1').value,
                    street_address_line_2: document.getElementById('street_address_line_2').value,
                    postal_code: document.getElementById('postal_code').value,
                    social_facebook: document.getElementById('social_facebook').value,
                    social_instagram: document.getElementById('social_instagram').value,
                    social_linkedin: document.getElementById('social_linkedin').value,
                    social_youtube: document.getElementById('social_youtube').value,
                    website_link: document.getElementById('website_link').value,
                    date_of_publishing: document.getElementById('date_of_publishing').value,
                    region_launched_by: document.getElementById('region_launched_by').value,
                };

                // Append all fields to FormData
                for (const [key, value] of Object.entries(fields)) {
                    formData.append(key, value);
                }

                // Handle arrays (checkboxes)
                const selectedDays = Array.from(document.querySelectorAll('input[name="chapterDays[]"]:checked')).map(cb => cb.value);
                formData.append('days_of_chapter', JSON.stringify(selectedDays));

                const selectedStatus = Array.from(document.querySelectorAll('input[name="chapterStatus[]"]:checked')).map(cb => cb.value);
                formData.append('chapter_status', JSON.stringify(selectedStatus));

                const selectedTypes = Array.from(document.querySelectorAll('input[name="chapterType[]"]:checked')).map(cb => cb.value);
                formData.append('chapter_type', JSON.stringify(selectedTypes));

                const selectedAccolades = Array.from(document.querySelectorAll('input[name="accolades[]"]:checked')).map(cb => cb.value);
                formData.append('accolades_config', JSON.stringify(selectedAccolades));

                const selectedHotels = Array.from(document.querySelectorAll('input[name="hotels[]"]:checked')).map(cb => cb.value);
                formData.append('hotels_config', JSON.stringify(selectedHotels));

                console.log('🚀 Sending update request for region:', region_id);

                const response = await fetch(`http://localhost:5000/api/updateRegion/${region_id}`, {
                    method: 'PUT',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Region updated successfully:', data);

                Swal.fire({
                    title: 'Success!',
                    text: 'Region updated successfully',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/r/manage-region';
                });

            } else {
                console.log('🚫 Update cancelled by user');
            }
        } catch (error) {
            console.error('❌ Error updating region:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to update region. Please try again.',
                icon: 'error'
            });
        } finally {
            hideLoader();
        }
    });

    // Initialize other functionality
    setupSelectAllHandlers();
    fetchRegionDetails();
});

// Add this to fetch and populate hotels
const fetchHotels = async () => {
    showLoader();
    try {
        const response = await fetch("http://localhost:5000/api/getHotels");
        if (!response.ok) {
            throw new Error(`Hotels API error: ${response.status} ${response.statusText}`);
        }
        const hotels = await response.json();
        console.log('📥 Fetched hotels:', hotels);

        // Populate hotels container
        const hotelsContainer = document.getElementById("hotelsContainer");
        hotelsContainer.innerHTML = ""; // Clear container

        hotels.forEach(hotel => {
            const checkboxDiv = document.createElement("div");
            checkboxDiv.className = "form-check";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.name = "hotels[]";
            checkbox.value = hotel.hotel_id;
            checkbox.id = `hotel_${hotel.hotel_id}`;
            
            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = `hotel_${hotel.hotel_id}`;
            label.textContent = hotel.hotel_name;

            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            hotelsContainer.appendChild(checkboxDiv);
        });

        // Setup select all functionality
        const selectAllHotels = document.getElementById('selectAllHotels');
        if (selectAllHotels) {
            selectAllHotels.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('#hotelsContainer input[name="hotels[]"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                console.log(`🔄 Hotels Select All: ${this.checked}`);
            });
        }

    } catch (error) {
        console.error("Error fetching hotels:", error);
        alert("Failed to load hotels. Please try again.");
    } finally {
        hideLoader();
    }
};


