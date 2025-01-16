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
        const response = await fetch(`https://bni-data-backend.onrender.com/api/getRegion/${region_id}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
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
        const response = await fetch("https://bni-data-backend.onrender.com/api/accolades");
        if (!response.ok) {
            throw new Error(`Accolades API error: ${response.status} ${response.statusText}`);
        }
        const accolades = await response.json();
        // Create a map of accolade IDs to names
        accoladeMap = accolades.reduce((map, accolade) => {
            map[accolade.accolade_id] = accolade.accolade_name;
            return map;
        }, {});

        // Display all accolades in the container
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



const populateFormFields = (data) => {
    // Standard fields
    document.querySelector("#region_name").value = data.region_name || "Not Found";
    document.querySelector("#contact_person").value = data.contact_person || "Not Found";
    document.querySelector("#contact_number").value = data.contact_number || "Not Found";
    document.querySelector("#email_id").value = data.email_id || "Not Found";
    document.querySelector("#mission").value = data.mission || "Not Found";
    document.querySelector("#vision").value = data.vision || "Not Found";

    const logo = document.querySelector("#region_logo");
    if (logo) {
        logo.src = data.region_logo || "";
    }

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

    // Chapter Days
    const chapterDays = data.days_of_chapter || [];
    chapterDays.forEach(day => {
        const checkbox = document.querySelector(`input[name="chapterDays[]"][value="${day}"]`);
        if (checkbox) checkbox.checked = true;
    });

    console.log(data.chapter_status);

// Chapter Status
const chapterStatus = Array.isArray(data.chapter_status) ? data.chapter_status : parseArrayString(data.chapter_status);
chapterStatus.forEach(status => {
    const checkbox = document.querySelector(`input[name="chapterStatus[]"][value="${status}"]`);
    if (checkbox) checkbox.checked = true;
});



    // Chapter Type
    const chapterType = data.chapter_type || [];
    chapterType.forEach(type => {
        const checkbox = document.querySelector(`input[name="chapterType[]"][value="${type}"]`);
        if (checkbox) checkbox.checked = true;
    });

     // Accolades Configuration
       // Pre-check accolades based on accolades_config
    const accoladesConfig = data.accolades_config || [];
    accoladesConfig.forEach(accoladeId => {
        const checkbox = document.querySelector(`input[name="accolades[]"][value="${accoladeId}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
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
    await fetchRegionDetails(); // Then fetch and populate region details
});



// Function to validate the form inputs
const validateRegionForm = () => {
    const contactNumber = document.querySelector("#contact_number").value.trim();
    const emailId = document.querySelector("#email_id").value.trim();
    const regionLogo = document.querySelector("#region_logo").files[0]; // Assuming file input for the logo

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
            errors.push("Region logo must be a JPG, JPEG, or PNG file.");
        }
    }

    return errors;
};

// Function to collect form data and prepare it for the update
const collectFormData = () => {
    const regionData = {
        region_name: document.querySelector("#region_name").value,
        contact_person: document.querySelector("#contact_person").value,
        contact_number: document.querySelector("#contact_number").value,
        email_id: document.querySelector("#email_id").value,
        mission: document.querySelector("#mission").value,
        vision: document.querySelector("#vision").value,
        region_logo: document.querySelector("#region_logo").src,  // Assuming the logo URL is in the src
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
    };

    return regionData;
};
// Function to send the updated data to the backend after confirmation
const updateRegionData = async () => {

    // Validate the form inputs
    const errors = validateRegionForm();
    if (errors.length > 0) {
        Swal.fire("Validation Errors", errors.join("<br>"), "error");
        return;
    }

    
    // Ask for confirmation using SweetAlert
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to edit the region details!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
        const regionData = collectFormData();
        console.log(regionData); // Verify the data before sending it

        try {
            showLoader(); // Show the loader when sending data
            const response = await fetch(`https://bni-data-backend.onrender.com/api/updateRegion/${region_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(regionData),
            });

            if (response.ok) {
                const updatedRegion = await response.json();
                console.log('Region updated successfully:', updatedRegion);
                Swal.fire('Updated!', 'The region details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/r/manage-region';  // Redirect to the region page
                }, 1200);
            } else {
                const errorResponse = await response.json();
                console.error('Failed to update region:', errorResponse);
                Swal.fire('Error!', `Failed to update region: ${errorResponse.message}`, 'error');
            }
        } catch (error) {
            console.error('Error updating region:', error);
            Swal.fire('Error!', 'Failed to update region. Please try again.', 'error');
        } finally {
            hideLoader(); // Hide the loader once the request is complete
        }
    } else {
        console.log('Update canceled');
    }
};
// Event listener to trigger the update
document.getElementById("updateRegionBtn").addEventListener("click", updateRegionData);


