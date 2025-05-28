document.addEventListener("DOMContentLoaded", function () {
    fetchHotels();

    // Add event listener to filter options
    document.querySelectorAll(".filter-option").forEach(option => {
        option.addEventListener("click", function () {
            const filterValue = this.getAttribute("data-filter");
            filterHotels(filterValue);
        });
    });

    // Add real-time search functionality
    document.getElementById("searchChapterInput").addEventListener("input", function () {
        searchHotels(this.value.trim().toLowerCase());
    });

    // Show all hotels when clicking "Show All" button
    document.getElementById("showAllBtn").addEventListener("click", function () {
        renderTable(allHotels);
    });
});

let allHotels = []; // Store all hotel data
    // Function to show the loader
    function showLoader() {
        document.getElementById('loader').style.display = 'flex';
    }
    
    // Function to hide the loader
    function hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }
    

async function fetchHotels() {
    try {
        showLoader();
        const response = await fetch("http://localhost:5000/api/getHotels");
        allHotels = await response.json(); // Store original data

        document.getElementById("totalHotel").textContent = allHotels.length;

        document.getElementById("totalEntries").textContent = allHotels.length; // Update total count

        renderTable(allHotels); // Render initially with all hotels
    } catch (error) {
        console.error("Error fetching hotels:", error);
    } finally {
        hideLoader();
    }
}

function filterHotels(status) {
    let filteredHotels = allHotels;

    if (status === "active") {
        filteredHotels = allHotels.filter(hotel => hotel.is_active);
    } else if (status === "inactive") {
        filteredHotels = allHotels.filter(hotel => !hotel.is_active);
    }

    renderTable(filteredHotels);
}

function searchHotels(searchTerm) {
    const filteredHotels = allHotels.filter(hotel =>
        hotel.hotel_name.toLowerCase().includes(searchTerm) ||
        hotel.hotel_address.toLowerCase().includes(searchTerm) ||
        hotel.hotel_pincode.toString().includes(searchTerm)
    );

    renderTable(filteredHotels);
}

function renderTable(hotels) {
    const tableBody = document.getElementById("chaptersTableBody");
    tableBody.innerHTML = ""; // Clear previous content

    hotels.forEach((hotel, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td style="border: 1px solid grey;"><b>${index + 1}</b></td>
          <td style="border: 1px solid grey;"><b>${hotel.hotel_name}</b></td>
          <td style="border: 1px solid grey;"><b>${hotel.hotel_address}</b></td>
          <td style="border: 1px solid grey;"><b>₹${parseFloat(hotel.hotel_bill_amount).toLocaleString()}</b></td>
          <td style="border: 1px solid grey;"><b>${hotel.hotel_pincode}</b></td>
          <td style="border: 1px solid grey;"><b>${hotel.hotel_email || "N/A"}</b></td>
          <td style="border: 1px solid grey;"><b>${hotel.hotel_phone || "N/A"}</b></td>
          <td style="border: 1px solid grey;">
            ${hotel.is_active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Inactive</span>'}
          </td>
          <td style="border: 1px solid grey;">
          <a href="/h/edit-hotel?id=${hotel.hotel_id}" class="btn btn-sm btn-primary">Edit</a>
          <a class="btn btn-sm btn-danger delete-hotel" data-id="${hotel.hotel_id}">Delete</a>
          </td>
          <td style="border: 1px solid grey;">
            <button class="btn btn-sm btn-info" onclick="viewLedger(${hotel.hotel_id})">View Ledger</button>
          </td>
        `;

        tableBody.appendChild(row);
    });

    // Update entries count
    document.getElementById("showingStart").textContent = hotels.length > 0 ? 1 : 0;
    document.getElementById("showingEnd").textContent = hotels.length;
    document.getElementById("totalEntries").textContent = allHotels.length; // Keep original count
}

document.addEventListener("DOMContentLoaded", function () {
    fetchHotels();

    // Event listener for delete buttons
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-hotel")) {
            const hotelId = event.target.getAttribute("data-id");
            confirmDeleteHotel(hotelId);
        }
    });
});

// Function to show SweetAlert confirmation and send delete request
function confirmDeleteHotel(hotelId) {
    Swal.fire({
        title: "Are you sure?",
        text: "This hotel will be marked as deleted.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            deleteHotel(hotelId);
        }
    });
}

// Function to send delete request to backend
async function deleteHotel(hotelId) {
    try {
        const response = await fetch(`http://localhost:5000/api/deleteHotel/${hotelId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        if (response.ok) {
            Swal.fire("Deleted!", result.message, "success");
            fetchHotels(); // Refresh the hotel list
        } else {
            Swal.fire("Error!", result.message, "error");
        }
    } catch (error) {
        console.error("Error deleting hotel:", error);
        Swal.fire("Error!", "An error occurred while deleting the hotel.", "error");
    }
}

