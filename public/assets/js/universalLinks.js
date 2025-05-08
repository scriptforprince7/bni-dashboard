// Use window object to store global variables
window.BNI = window.BNI || {};
window.BNI.endpoints = {
    universalLinks: 'http://backend.bninewdelhi.com/api/universalLinks',
    paymentGateway: 'http://backend.bninewdelhi.com/api/paymentGateway',
    deleteUniversalLink: 'http://backend.bninewdelhi.com/api/deleteUniversalLink'
};

// Use window.BNI namespace for other global variables
window.BNI.state = window.BNI.state || {
    allLinks: [],
    filteredLinks: [],
    paymentGateways: [],
    currentPage: 1,
    entriesPerPage: 10
};

// Cache DOM elements
window.BNI.elements = {
    loader: document.getElementById('loader'),
    tableBody: document.getElementById('chaptersTableBody'),
    searchInput: document.getElementById('searchChapterInput')
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

// Function to fetch payment gateways
async function fetchPaymentGateways() {
    try {
        const response = await fetch(window.BNI.endpoints.paymentGateway);
        if (!response.ok) throw new Error('Network response was not ok');
        window.BNI.state.paymentGateways = await response.json();
    } catch (error) {
        console.error('Error fetching payment gateways:', error);
    }
}

// Function to fetch links data
async function fetchLinks() {
    try {
        const response = await fetch(window.BNI.endpoints.universalLinks);
        if (!response.ok) throw new Error('Network response was not ok');
        
        window.BNI.state.allLinks = await response.json();
        window.BNI.state.filteredLinks = [...window.BNI.state.allLinks];
        displayLinks(window.BNI.state.filteredLinks.slice(0, window.BNI.state.entriesPerPage));
    } catch (error) {
        console.error('Error fetching links:', error);
    }
}

// Function to display links in the table
function displayLinks(links) {
    const tableBody = window.BNI.elements.tableBody;
    if (!tableBody) return;

    tableBody.innerHTML = '';

    links.forEach((link, index) => {
        const paymentGateway = window.BNI.state.paymentGateways.find(
            pg => pg.gateway_id.toString() === link.payment_gateway.toString()
        );
        const paymentGatewayName = paymentGateway ? paymentGateway.gateway_name : 'N/A';

        const row = document.createElement('tr');
        row.classList.add('order-list');
        row.innerHTML = `
            <td>${(window.BNI.state.currentPage - 1) * window.BNI.state.entriesPerPage + index + 1}</td>
            <td style="border: 1px solid grey;">
                <div class="d-flex align-items-center">
                    <b>${link.universal_link_name}</b>
                </div>
            </td>
            <td style="border: 1px solid grey;">
                <div class="d-flex align-items-center">
                    <b>${link.ulid || 'N/A'}</b>
                </div>
            </td>
            <td style="border: 1px solid grey;">
                <div class="d-flex align-items-center">
                    <b>${link.link_slug || 'N/A'}</b>
                </div>
            </td>
            <td style="border: 1px solid grey;">
                <div class="d-flex align-items-center">
                    <em><u>${paymentGatewayName}</u></em>
                </div>
            </td>
            <td style="border: 1px solid grey;">
                <span class="badge bg-${link.status === 'active' ? 'success' : 'danger'}">
                    ${link.status}
                </span>
            </td>
            <td style="border: 1px solid grey">
                <span class="badge bg-primary text-light" style="cursor:pointer; color:white;">
                    <a href="/u/edit-universal-link/?id=${link.id}" style="color:white">Edit</a>
                </span>
                <span class="badge bg-danger text-light delete-btn" style="cursor:pointer; color:white;" data-id="${link.id}">
                    Delete
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to filter links based on search input
function filterLinks() {
    const searchValue = window.BNI.elements.searchInput.value.toLowerCase();
    window.BNI.state.filteredLinks = window.BNI.state.allLinks.filter(
        link => link.universal_link_name.toLowerCase().includes(searchValue)
    );
    displayLinks(window.BNI.state.filteredLinks.slice(0, window.BNI.state.entriesPerPage));
}

// Delete universal link function
const deleteUniversalLink = async (id) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This action will mark the universal link as deleted.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel'
    });

    if (result.isConfirmed) {
        try {
            showLoader();
            const response = await fetch(`${window.BNI.endpoints.deleteUniversalLink}/${id}`, {
                method: 'PUT'
            });

            if (response.ok) {
                const data = await response.json();
                Swal.fire('Deleted!', data.message, 'success');
                document.querySelector(`[data-id="${id}"]`).closest('tr').remove();
            } else {
                const errorResponse = await response.json();
                Swal.fire('Failed!', errorResponse.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting universal link:', error);
            Swal.fire('Error!', 'Failed to delete universal link. Please try again.', 'error');
        } finally {
            hideLoader();
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    showLoader();
    try {
        await fetchPaymentGateways();
        await fetchLinks();
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        hideLoader();
    }
});

if (window.BNI.elements.searchInput) {
    window.BNI.elements.searchInput.addEventListener('input', filterLinks);
}

if (window.BNI.elements.tableBody) {
    window.BNI.elements.tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const id = event.target.getAttribute('data-id');
            deleteUniversalLink(id);
        }
    });
}
