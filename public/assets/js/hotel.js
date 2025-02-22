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
        const response = await fetch("https://bni-data-backend.onrender.com/api/getHotels");
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
            <button class="btn btn-sm btn-primary">Edit</button>
            <button class="btn btn-sm btn-danger">Delete</button>
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
