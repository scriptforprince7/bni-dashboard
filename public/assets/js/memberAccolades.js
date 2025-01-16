// Debug flag

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex'; // Show loader
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById('loader').style.display = 'none'; // Hide loader
  }
const DEBUG = true;

// Debug logging function
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
        if (data) console.log(data);
    }
}

async function fetchMemberData() {
    try {
        showLoader();
        // Get logged in email from localStorage
        const loggedInEmail = localStorage.getItem('loggedInEmail');
        debugLog('Logged in email:', loggedInEmail);

        // Fetch members data
        const membersResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
        const membersData = await membersResponse.json();
        debugLog('Members data fetched:', membersData);

        // Find logged in member
        const loggedInMember = membersData.find(member => member.member_email_address === loggedInEmail);
        debugLog('Logged in member:', loggedInMember);

        if (!loggedInMember) {
            throw new Error('Member not found');
        }

        // Log accolades array from member
        debugLog('Member accolades IDs:', loggedInMember.accolades_id);

        // Get accolades data
        const accoladesResponse = await fetch('https://bni-data-backend.onrender.com/api/accolades');
        const accoladesData = await accoladesResponse.json();
        debugLog('All accolades data fetched:', accoladesData);

        // Map all accolades IDs to their full data
        const memberAccolades = [];
        loggedInMember.accolades_id.forEach(id => {
            debugLog(`Looking for accolade with ID: ${id}`);
            const matchingAccolade = accoladesData.find(accolade => accolade.accolade_id === id);
            if (matchingAccolade) {
                debugLog(`Found matching accolade:`, matchingAccolade);
                memberAccolades.push(matchingAccolade);
            }
        });

        debugLog(`Total accolades found: ${memberAccolades.length}`, memberAccolades);

        // Populate table
        populateAccoladesTable(memberAccolades);

    } catch (error) {
        console.error('Error fetching data:', error);
        debugLog('Error occurred:', error);
    } finally {
        hideLoader();
    }
}

function populateAccoladesTable(accolades) {
    const tableBody = document.querySelector('.chaptersTableBody tbody');
    if (!tableBody) {
        debugLog('Table body not found');
        return;
    }

    debugLog(`Populating table with ${accolades.length} accolades`);

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows for each accolade
    accolades.forEach((accolade, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const publishDate = new Date(accolade.accolade_publish_date).toLocaleDateString();
        
        row.innerHTML = `
            <td><span style="font-weight: 600">${index + 1}</span></td>
            <td><span style="font-weight: 600">${accolade.accolade_name || 'N/A'}</span></td>
            <td>${accolade.accolade_published_by || 'N/A'}</td>
            <td><span style="font-weight: 600">${publishDate}</span></td>
            <td>${accolade.item_type || 'N/A'}</td>
            <td>${accolade.accolade_type || 'N/A'}</td>
        `;
        
        tableBody.appendChild(row);
        debugLog(`Added row ${index + 1} for accolade:`, accolade);
    });

    if (accolades.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No accolades found</td></tr>';
        debugLog('No accolades to display');
    }

    updateAccoladesCount();
}

function updateAccoladesCount() {
    const totalRows = document.querySelector('.chaptersTableBody tbody').getElementsByTagName('tr').length;
    document.getElementById('totalAccoladesCount').innerHTML = `<b>${totalRows}</b>`;
}

async function populateAccoladesDropdown() {
    try {
        // Fetch accolades data
        const accoladesResponse = await fetch('https://bni-data-backend.onrender.com/api/accolades');
        const accoladesData = await accoladesResponse.json();
        debugLog('Accolades data fetched for dropdown:', accoladesData);

        // Get the select element
        const selectElement = document.getElementById('region_status');
        if (!selectElement) {
            debugLog('Select element not found');
            return;
        }

        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">Select</option>';

        // Add accolades as options
        accoladesData.forEach(accolade => {
            const option = document.createElement('option');
            option.value = accolade.accolade_id;
            option.textContent = accolade.accolade_name;
            selectElement.appendChild(option);
        });

        debugLog('Dropdown populated with accolades');

    } catch (error) {
        console.error('Error populating accolades dropdown:', error);
        debugLog('Error occurred while populating dropdown:', error);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    debugLog('Document ready, initializing...');
    fetchMemberData();
    populateAccoladesDropdown();
});