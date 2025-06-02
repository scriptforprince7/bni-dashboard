// Debug flag
const DEBUG = true;

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Debug logging function
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
        if (data) console.log(data);
    }
}

async function populateDropdowns() {
    try {
        showLoader();
        
        // Fetch both accolades and members data in parallel
        const [accoladesResponse, membersResponse] = await Promise.all([
            fetch('http://localhost:5000/api/accolades'),
            fetch('http://localhost:5000/api/members')
        ]);

        const accoladesData = await accoladesResponse.json();
        const membersData = await membersResponse.json();

        debugLog('Accolades data fetched:', accoladesData);
        debugLog('Members data fetched:', membersData);

        // Populate accolades dropdown
        const accoladesSelect = document.getElementById('region_status');
        if (!accoladesSelect) {
            debugLog('Accolades select element not found');
            return;
        }

        // Clear existing options except the first one
        accoladesSelect.innerHTML = '<option value="">Select</option>';

        // Add accolades as options
        accoladesData.forEach(accolade => {
            const option = document.createElement('option');
            option.value = accolade.accolade_id;
            option.textContent = accolade.accolade_name;
            accoladesSelect.appendChild(option);
        });

        // Populate members dropdown
        const membersSelect = document.getElementById('member_select');
        if (!membersSelect) {
            debugLog('Members select element not found');
            return;
        }

        // Clear existing options except the first one
        membersSelect.innerHTML = '<option value="">Select Member</option>';

        // Add members as options
        membersData.forEach(member => {
            const option = document.createElement('option');
            option.value = member.member_id;
            // Combine first and last name for display
            option.textContent = `${member.member_first_name} ${member.member_last_name}`;
            membersSelect.appendChild(option);
        });

        debugLog('Dropdowns populated successfully');

    } catch (error) {
        console.error('Error populating dropdowns:', error);
        debugLog('Error occurred while populating dropdowns:', error);
    } finally {
        hideLoader();
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    debugLog('Document ready, initializing...');
    populateDropdowns();
});