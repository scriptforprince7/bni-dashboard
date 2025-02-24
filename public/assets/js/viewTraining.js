document.addEventListener("DOMContentLoaded", async () => {

  // Step 2: Add the function to update the number of registrations
  function updateRegistrationCount() {
    const tableBody = document.querySelector('.table-responsive tbody');
    const registrationCount = tableBody ? tableBody.rows.length-1 : 0;
    document.querySelector('.registrations').textContent = registrationCount;
}

  const urlParams = new URLSearchParams(window.location.search);
  const training_id = urlParams.get('training_id');
  console.log("Training ID:", training_id);


  async function checkAttendanceStatus() {
    try {
      const response = await fetch('https://bni-data-backend.onrender.com/api/allCheckins');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const checkins = await response.json();
      console.log("All checkins:", checkins);
      
      // Filter checkins for current training
      const trainingCheckins = checkins.filter(checkin => 
        checkin.training_id === parseInt(training_id)
      );
      console.log("Filtered checkins for this training:", trainingCheckins);
      return trainingCheckins;
    } catch (error) {
      console.error("Error in checkAttendanceStatus:", error);
      return [];
    }
  }
  const regionsDropdown = document.getElementById("region-filter");
  const chaptersDropdown = document.getElementById("chapter-filter");
  const monthsDropdown = document.getElementById("month-filter");
  const paymentStatusDropdown = document.getElementById("payment-status-filter");
  const paymentGatewayDropdown = document.getElementById("payment-gateway-filter");
  const paymentMethodDropdown = document.getElementById("payment-method-filter");
  // Function to show the loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Populate a dropdown with options
const populateDropdown = (dropdown, data, valueField, textField, defaultText) => {
  // Clear the dropdown
  dropdown.innerHTML = '';

  // Add a default option
  dropdown.innerHTML += `
    <li>
      <a class="dropdown-item" href="javascript:void(0);" data-value="">
        ${defaultText}
      </a>
    </li>
  `;

  // Add options dynamically
  data.forEach(item => {
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

  const attachDropdownListeners = (dropdown) => {
    // Find the dropdown toggle specific to the current dropdown
    const dropdownToggle = dropdown.closest('.dropdown').querySelector('.dropdown-toggle');
  
    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        // Remove 'active' class from all items in the dropdown
        dropdown.querySelectorAll('.dropdown-item.active').forEach(activeItem => {
          activeItem.classList.remove('active');
        });
  
        // Add 'active' class to the selected item
        item.classList.add('active');
  
        // Get the selected value and text
        const selectedValue = item.getAttribute('data-value');
        const selectedText = item.textContent.trim();
  
        // Update the specific dropdown's toggle label
        if (dropdownToggle) {
          dropdownToggle.textContent = selectedText;
        }
  
        console.log(`Selected Value from ${dropdown.id}:`, selectedValue);
      });
    });
  };


  try {
    showLoader();
    // Fetch data from all necessary endpoints
    const checkinsData = await checkAttendanceStatus();
    console.log("Checkins data loaded:", checkinsData);
    const [
      ordersResponse,
      transactionsResponse,
      chaptersResponse,
      paymentGatewayResponse,
      universalLinksResponse,
      regionsResponse,
          // Added this new item
    ] = await Promise.all([
      fetch(`https://bni-data-backend.onrender.com/api/getTrainingOrder/${training_id}`),
      fetch("https://bni-data-backend.onrender.com/api/allTransactions"),
      fetch("https://bni-data-backend.onrender.com/api/chapters"),
      fetch("https://bni-data-backend.onrender.com/api/paymentGateway"),
      fetch("https://bni-data-backend.onrender.com/api/universalLinks"),
      fetch("https://bni-data-backend.onrender.com/api/regions"),
      fetch("https://bni-data-backend.onrender.com/api/allOrders"),
      
    ]);

    const orders = await ordersResponse.json();
    const allTransactions = await transactionsResponse.json();
    const chapters = await chaptersResponse.json();
    const paymentGateways = await paymentGatewayResponse.json();
    const universalLinks = await universalLinksResponse.json();
    const regions = await regionsResponse.json();
    console.log("Checkins Data received:", checkinsData);

    // Filter transactions related to the orders
const transactions = allTransactions.filter(transaction =>
  orders.some(order => order.order_id === transaction.order_id)
);
    
    // Update the registration count with the number of transactions
    const transactionCount = transactions.length;
    document.querySelector('.registrations b').textContent = transactionCount;

    // Populate region and chapter dropdowns
    populateDropdown(regionsDropdown, regions, "region_id", "region_name", "Select Region");
    populateDropdown(chaptersDropdown, chapters, "chapter_id", "chapter_name", "Select Chapter");
    populateDropdown(paymentGatewayDropdown, paymentGateways, "gateway_id", "gateway_name", "Select Gateway");

    // Populate month dropdown
const populateMonthDropdown = () => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  monthsDropdown.innerHTML = ""; // Clear existing options
  months.forEach((month, index) => {
    monthsDropdown.innerHTML += `<li>
      <a class="dropdown-item" href="javascript:void(0);" data-value="${index + 1}">
        ${month}
      </a>
    </li>`;
  });
  // Attach listeners after populating
  attachDropdownListeners(monthsDropdown);
};

// Call the function to populate months
populateMonthDropdown();




// Populate payment status dropdown
const populatePaymentStatusDropdown = () => {
  try {
    const uniqueStatuses = [...new Set(transactions.map(transaction => transaction.payment_status))];
    paymentStatusDropdown.innerHTML = ""; // Clear existing options
    uniqueStatuses.forEach(status => {
      paymentStatusDropdown.innerHTML += `<li>
        <a class="dropdown-item" href="javascript:void(0);" data-value="${status.toUpperCase()}">
          ${status}
        </a>
      </li>`;
    });
    // Attach listeners after populating
    attachDropdownListeners(paymentStatusDropdown);
  } catch (error) {
    console.error("Error populating payment status dropdown:", error);
  }
};

populatePaymentStatusDropdown();
// Populate payment method dropdown
const populatePaymentMethodDropdown = () => {
  try {
    const uniqueMethods = [...new Set(transactions.map(transaction => transaction.payment_group))];
    paymentMethodDropdown.innerHTML = ""; // Clear existing options
    uniqueMethods.forEach(method => {
      paymentMethodDropdown.innerHTML += `<li>
        <a class="dropdown-item" href="javascript:void(0);" data-value="${method.toUpperCase()}">
          ${method}
        </a>
      </li>`;
    });
    // Attach listeners after populating
    attachDropdownListeners(paymentMethodDropdown);
  } catch (error) {
    console.error("Error populating payment method dropdown:", error);
  }
};

// Call the function to populate payment methods
populatePaymentMethodDropdown();

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

// Attach event listener to a "Filter" button or trigger
document.getElementById("apply-filters-btn").addEventListener("click", () => {
  // Capture selected values
  const regionId = regionsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const chapterId = chaptersDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const month = monthsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentStatus = paymentStatusDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentGateway = paymentGatewayDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentMethod = (paymentMethodDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '').toLowerCase();


  // Construct the query string
  const queryParams = new URLSearchParams();

  if (regionId) queryParams.append('region_id', regionId);
  if (chapterId) queryParams.append('chapter_id', chapterId);
  if (month) queryParams.append('month', month);
  if (paymentStatus) queryParams.append('payment_status', paymentStatus);
  if (paymentGateway) queryParams.append('payment_gateway', paymentGateway);
  if (paymentMethod) queryParams.append('payment_method', paymentMethod);

  // Redirect to the filtered URL
  const filterUrl = `/t/all-transactions?${queryParams.toString()}`;
  window.location.href = filterUrl;
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

const urlParams = new URLSearchParams(window.location.search);
const filters = {
  region_id: urlParams.get("region_id"),
  chapter_id: urlParams.get("chapter_id"),
  month: urlParams.get("month"),
  payment_status: urlParams.get("payment_status"),
  payment_gateway: urlParams.get("payment_gateway"),
  payment_method: urlParams.get("payment_method"),
};

// Show filters in the console for debugging
console.log(filters);


// Filter transactions based on the region_id
const filteredTransactions = transactions.filter((transaction) => {
  let isValid = true;

  // console.log("Checking transaction for region:", transaction.order_id);

  if (filters.region_id && transaction.order_id) {
    const order = orders.find(order => order.order_id === transaction.order_id);
    if (order) {
      // Ensure both region_id values are strings (or numbers)
      const orderRegionId = String(order.region_id);  // Convert to string
      const filterRegionId = String(filters.region_id);  // Convert to string

      // Compare as strings (or numbers, depending on the data type)
      if (orderRegionId !== filterRegionId) {
        isValid = false;
      }
    } else {
      console.log(`No matching order found for transaction ${transaction.order_id}`);
    }
  }

  if (filters.chapter_id && transaction.order_id) {
    const order = orders.find(order => order.order_id === transaction.order_id);

    if (order) {
      // Ensure both region_id values are strings (or numbers)
      const orderChapterId = String(order.chapter_id);  // Convert to string
      const filterChapterId = String(filters.chapter_id);  // Convert to string

      // Compare as strings (or numbers, depending on the data type)
      if (orderChapterId !== filterChapterId) {
        isValid = false;
      }
    } else {
      console.log(`No matching order found for transaction ${transaction.order_id}`);
    }
  }

  if (filters.payment_gateway && transaction.order_id) {
    const order = orders.find(order => order.order_id === transaction.order_id);

    if (order) {
      // Ensure both region_id values are strings (or numbers)
      const orderGatewayId = String(order.payment_gateway_id);  // Convert to string
      const filterGatewayId = String(filters.payment_gateway);  // Convert to string

      // Compare as strings (or numbers, depending on the data type)
      if (orderGatewayId !== filterGatewayId) {
        isValid = false;
      }
    } else {
      console.log(`No matching order found for transaction ${transaction.order_id}`);
    }
  }

  if (filters.payment_status && transaction.order_id) {
    const order = orders.find(order => order.order_id === transaction.order_id);

    if (order) {
      // Ensure both region_id values are strings (or numbers)
      const orderPaymentStatus = transaction.payment_status; 
      const filterPaymentStatus = filters.payment_status;

      // Compare as strings (or numbers, depending on the data type)
      if (orderPaymentStatus !== filterPaymentStatus) {
        isValid = false;
      }
    } else {
      console.log(`No matching order found for transaction ${transaction.order_id}`);
    }
  }

  if (filters.payment_method && transaction.order_id) {
    const order = orders.find(order => order.order_id === transaction.order_id);

    if (order) {
      // Ensure both region_id values are strings (or numbers)
      const orderPaymentMethodStatus = transaction.payment_group; 
      const filterPaymentMethodStatus = filters.payment_method;

      // Compare as strings (or numbers, depending on the data type)
      if (orderPaymentMethodStatus !== filterPaymentMethodStatus) {
        isValid = false;
      }
    } else {
      console.log(`No matching order found for transaction ${transaction.order_id}`);
    }
  }

  // Assuming `filters.month` is the selected month filter (e.g., "4" for April)
if (filters.month && transaction.order_id) {
  const order = orders.find(order => order.order_id === transaction.order_id);

  if (order) {
    // Ensure both the order's created_at and the filter are in comparable formats
    const orderDate = new Date(order.created_at);  // Convert the created_at string to a Date object
    const orderMonth = orderDate.getMonth() + 1; // Get the month (1-12, because we add 1 to zero-indexed value)
    const filterMonth = parseInt(filters.month, 10); // Convert the filter to an integer

    // Compare the months (both are now 1-12 values)
    if (orderMonth !== filterMonth) {
      isValid = false;
    }
  } else {
    console.log(`No matching order found for transaction ${transaction.order_id}`);
  }
}

  return isValid;
});

    // Map chapter names by chapter_id for quick access
    const chapterMap = new Map();
    chapters.forEach((chapter) => {
      chapterMap.set(chapter.chapter_id, chapter.chapter_name);
    });

    // Map payment gateway names by gateway_id for quick access
    const paymentGatewayMap = new Map();
    paymentGateways.forEach((gateway) => {
      paymentGatewayMap.set(gateway.gateway_id, gateway.gateway_name);
    });

    // Map universal link names by id for quick access
    const universalLinkMap = new Map();
    universalLinks.forEach((link) => {
      universalLinkMap.set(link.id, link.universal_link_name);
    });

    // Initialize totals
    let totalTransactionAmount = 0;
    let settledPayments = 0;
    let pendingPayments = 0;

    // Sort transactions by payment time (latest first)
    filteredTransactions.sort(
      (a, b) => new Date(b.payment_time) - new Date(a.payment_time)
    );

    // Get the table body to insert rows
    // Get the table body to insert rows
const tableBody = document.querySelector(".table tbody");

filteredTransactions.forEach((transaction, index) => {
  // Find the associated order
  const order = orders.find(
    (order) => order.order_id === transaction.order_id
  );
  
  // Check attendance status
  const checkin = checkinsData.find(c => c.order_id === transaction.order_id);
  console.log("Processing transaction:", transaction.order_id, "Checkin status:", checkin);

  // Get chapter name from chapterMap
  const chapterName = chapterMap.get(order?.chapter_id) || "N/A";

  // Get gateway name from paymentGatewayMap
  const gatewayName = paymentGatewayMap.get(order?.payment_gateway_id) || "Unknown";

  // Format date and amount
  const formattedDate = new Date(transaction.payment_time).toLocaleDateString("en-GB");
  const formattedAmount = `+ ₹${parseFloat(transaction.payment_amount).toLocaleString("en-IN")}`;

  // Determine payment method and image
  let paymentMethod = "N/A";
  let paymentImage = "";
  if (transaction.payment_method) {
    if (transaction.payment_method.upi) {
      paymentMethod = "UPI";
      paymentImage = '<img src="https://economictimes.indiatimes.com/thumb/msid-74960608,width-1200,height-900,resizemode-4,imgsize-49172/upi-twitter.jpg?from=mdr" alt="UPI" width="30" height="30">';
    } else if (transaction.payment_method.card) {
      paymentMethod = "Card";
      paymentImage = '<img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" alt="Card" width="20" height="20">';
    } else if (transaction.payment_method.netbanking) {
      paymentMethod = "Net Banking";
      paymentImage = '<img src="https://cdn.prod.website-files.com/64199d190fc7afa82666d89c/648b63af41676287e601542d_regular-bank-transfer.png" alt="Net Banking" width="20" height="20">';
    } else if (transaction.payment_method.wallet) {
      paymentMethod = "Wallet";
      paymentImage = '<img src="https://ibsintelligence.com/wp-content/uploads/2024/01/digital-wallet-application-mobile-internet-banking-online-payment-security-via-credit-card_228260-825.jpg" alt="Wallet" width="20" height="20">';
    }
  }

  const row = document.createElement("tr");
  row.classList.add("invoice-list");

  row.innerHTML = `
    <td>${index + 1}</td>
    <td>
      ${checkin && checkin.checked_in 
        ? `<button value="${index}" class="btn btn-sm btn-success btn-wave waves-light" disabled>Attendance Marked ✔</button>`
        : `<button value="${index}" class="btn btn-sm btn-outline-danger mark_attendence btn-wave waves-light">Mark Attendence</button>`
      }
    </td>
    <td>
      ${checkin && checkin.checked_in 
        ? `<button class="generate-qr-btn" disabled style="opacity: 0.5">Send QR</button>`
        : `<button class="generate-qr-btn" data-transaction-id="${transaction.order_id}">Send QR</button>`
      }
    </td>
    <td>${formattedDate}</td>
    <td class="dynamic_member"><img src="https://www.kindpng.com/picc/m/78-786207_user-avatar-png-user-avatar-icon-png-transparent.png" alt="Card" width="20" height="20">${order?.member_name || "Unknown"}</td>
    <td class="dynamic_chapter"><b><em>${chapterName}</em></b></td>
    <td><b>${formattedAmount}</b><br><a href="/t/view-invoice?order_id=${transaction.order_id}" class="fw-medium text-success">View</a></td>
    <td>${paymentImage} ${paymentMethod}</td>
    <td class="o_id"><em>${transaction.order_id}</em></td>
    <td class="custom_id"><b><em>${transaction.cf_payment_id}</em></b></td>
    <td><span class="badge ${transaction.payment_status === "SUCCESS" ? "bg-success" : "bg-danger"}">${transaction.payment_status.toLowerCase()}</span></td>
    <td><b><em>${gatewayName}</em></b></td>
    <td>
      <a href="#" data-transaction-id="${transaction.order_id}" class="btn btn-sm btn-outline-danger btn-wave waves-light track-settlement">Track Settlement</a>
    </td>
    <td class="utr-cell"><em>Not Available</em></td>
    <td class="settlement-time"><em>Not Available</em></td>
    <td class="irn"><em>Not Applicable</em></td>
    <td class="qrcode"><em>Not Applicable</em></td>
    <td class="generate-invoice-btn">Not Applicable</td>
    <td class="customer_id">${order?.customer_id || "Unknown"}</td>
  `;

  tableBody.appendChild(row);
});
updateRegistrationCount();

    tableBody.addEventListener("click", async (event) => {
      const target = event.target;
    
      if (target.classList.contains("mark_attendence")) {
        try {
            // Get the transaction ID from the row
            const row = target.closest("tr");
            const transactionId = row.querySelector(".custom_id b em").innerText;
            const orderId = row.querySelector(".o_id").innerText;
            const customerId = row.querySelector(".customer_id").innerText;
            const chapterName = row.querySelector(".dynamic_chapter").innerText;
            const memberName = row.querySelector(".dynamic_member").innerText;
            
            // Default avatar URL as fallback
            let memberImage = "https://www.kindpng.com/picc/m/78-786207_user-avatar-png-user-avatar-icon-png-transparent.png";
            
            console.log('Fetching member details for customer ID:', customerId);
            
            // Fetch member data to get the photo
            const memberResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
            const membersData = await memberResponse.json();
            console.log('Members data received:', membersData);
            
            // Find matching member
            const matchingMember = membersData.find(member => member.member_id.toString() === customerId);
            console.log('Matching member found:', matchingMember);
            
            if (matchingMember && matchingMember.member_photo) {
                // Extract just the filename from the member_photo path
                const photoFileName = matchingMember.member_photo.split('/').pop(); // This will get the last part after '/'
                console.log('Extracted photo filename:', photoFileName);
                
                const photoUrl = `https://bni-data-backend.onrender.com/uploads/memberPhotos/${photoFileName}`;
                console.log('Constructed photo URL:', photoUrl);
                
                // Test if image exists
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = photoUrl;
                }).then(() => {
                    memberImage = photoUrl;
                    console.log('Member photo loaded successfully');
                }).catch(() => {
                    console.log('Failed to load member photo, using default avatar');
                });
            } else {
                console.log('No member photo found, using default avatar');
            }

            // Show SweetAlert confirmation dialog with custom image and additional info
            Swal.fire({
                title: "Are you sure to mark attendance?",
                text: `Transaction ID: ${transactionId} \nOrder ID: ${orderId} \nChapter: ${chapterName} \nMember: ${memberName}`,
                imageUrl: memberImage,
                imageWidth: 200,
                imageHeight: 200,
                imageAlt: "Member Image",
                html: `
                    <div class="text-left">
                        <p><b>Chapter</b>: ${chapterName}</p>
                        <p><b>Member</b>: ${memberName}</p>
                        <p><b>Transaction ID</b>: ${transactionId}</p>
                        <p><b>Order ID</b>: ${orderId}</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, mark attendance!",
            }).then((result) => {
                if (result.isConfirmed) {
                    // Send request to mark attendance
                    fetch("https://bni-data-backend.onrender.com/api/markAttendence", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ 
                            transaction_id: transactionId, 
                            training_id, 
                            orderId, 
                            customerId 
                        }),
                    })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.success) {
                            Swal.fire({
                                title: "Attendance Marked!",
                                text: "The member's attendance has been successfully marked.",
                                icon: "success",
                                confirmButtonText: "OK",
                            }).then(() => {
                                window.location.reload();
                            });

                            target.classList.remove("mark_attendence");
                            target.classList.add("btn-success");
                            target.innerText = "Attendance Marked ✔";
                            target.disabled = true;
                        } else {
                            Swal.fire({
                                title: "Error!",
                                text: data.message || "Failed to mark attendance.",
                                icon: "error",
                                confirmButtonText: "OK",
                            });
                        }
                    })
                    .catch((error) => {
                        console.error("Error marking attendance:", error);
                        Swal.fire({
                            title: "Error!",
                            text: "An unexpected error occurred.",
                            icon: "error",
                            confirmButtonText: "OK",
                        });
                    });
                }
            });
        } catch (error) {
            console.error("Error in attendance marking process:", error);
            Swal.fire({
                title: "Error!",
                text: "An error occurred while processing the request.",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
      }
    });

      // Add event listener for "Track Settlement" buttons
      document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('track-settlement')) {
          event.preventDefault();
    
          const button = event.target;
          const originalText = button.textContent; // Store the original button text
          button.textContent = 'Loading...'; // Display loading text
          button.disabled = true; // Disable the button to prevent multiple clicks
          const orderId = button.dataset.transactionId;
    
          try {
            // Step 1: Send request to save settlement data
            const saveResponse = await fetch(
              `https://bni-data-backend.onrender.com/api/orders/${orderId}/settlementStatus`,
              { method: 'GET' }
            );
    
            if (!saveResponse.ok) {
              throw new Error('Failed to save settlement data.');
            }
    
            // Step 2: Fetch settlement data using cf_payment_id
            const row = button.closest('tr');
            const cfPaymentId = row.querySelector('.custom_id').innerText;
    
            const fetchResponse = await fetch(
              `https://bni-data-backend.onrender.com/api/settlement/${cfPaymentId}`
            );
    
            if (!fetchResponse.ok) {
              throw new Error('Failed to fetch settlement data.');
            }
    
            const { settlement } = await fetchResponse.json();
    
            // Step 3: Update the table row based on settlement data
            if (settlement.transfer_utr && settlement.transfer_time && settlement.transfer_id) {

              fetch(`https://bni-data-backend.onrender.com/api/einvoice/${settlement.order_id}`)
              .then(response => response.json())
              .then(einvoiceData => {
                  const irnCell = row.querySelector(".irn");
                  const qrcodeCell = row.querySelector(".qrcode");
                  const btnCell = row.querySelector(".generate-invoice-btn");
                  const qrCodeKey = `qrCode_${settlement.order_id}`; // Unique key for each order
                  const orderId = settlement.order_id;
                  const orderr = orders.find((o) => o.order_id === orderId);
                  const transaction = transactions.find((t) => t.order_id === orderId);
                  const chapterName = chapterMap.get(settlement?.chapter_id) || "N/A";
                  const gatewayName = paymentGatewayMap.get(settlement?.payment_gateway_id) || "Unknown";
                  const universalLinkName = universalLinkMap.get(settlement?.universal_link_id) || "Not Applicable";
        
                  const invoiceData = {
                    orderId: orderr,
                    transactionId: transaction,
                    amount: transaction.payment_amount,
                    chapterName: chapterName,
                    gatewayName: gatewayName,
                    universalLinkName: universalLinkName,
                  };
        
                  // Display the IRN or a message if not available
                  irnCell.innerHTML = einvoiceData.irn || "<em>Not Applicable</em>";
        
                  // Check if both IRN and QR code are available
                  if (einvoiceData.irn && einvoiceData.qrcode) {
                      // Update the Generate E-Invoice button to View E-Invoice with link
                      const encodedInvoiceData = encodeURIComponent(JSON.stringify(invoiceData));
                      const encodedEinvoiceData = encodeURIComponent(JSON.stringify(einvoiceData));
                      btnCell.innerHTML = `<a href="/v/einvoice?invoiceData=${encodedInvoiceData}&einvoiceData=${encodedEinvoiceData}" class="btn btn-sm btn-link">View E-Invoice</a>`;
                  }
        
                  // Check if QR code is already stored in localStorage for this order
                  if (localStorage.getItem(qrCodeKey)) {
                      // If QR code is stored, show the QR code image
                      qrcodeCell.innerHTML = `<img src="${localStorage.getItem(qrCodeKey)}" alt="QR Code" width="100" height="100">`;
                  } else if (einvoiceData.qrcode) {
                      // If QR code is available but not yet stored, show the button
                      qrcodeCell.innerHTML = `<span class="generate-qr-btn">Send QR</span>`;
        
                      // Add event listener to the button to display loading and then the QR code
                      row.querySelector(".generate-qr-btn").addEventListener("click", () => {
                          // Show "Loading..." message or spinner
                          qrcodeCell.innerHTML = "<em>Loading...</em>";
        
                          // Simulate loading for 3-4 seconds
                          setTimeout(() => {
                              // Generate QR Code as a data URL using cf_payment_id
                              const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(cfPaymentId)}&size=100x100`;
                              
                              console.log("QR Code Image:", qrCodeImage);

                              // Create an image element for the QR code
                              const qrcodeDiv = document.createElement('div');
                              qrcodeDiv.className = 'qrcode'; // Add a class for styling
                              qrcodeDiv.innerHTML = `<img src="${qrCodeImage}" alt="QR Code" width="100" height="100">`;
                              
                              // Insert QR code after the button
                              button.parentNode.insertBefore(qrcodeDiv, loaderDiv.nextSibling); 

                              // Remove the loader
                              loaderDiv.remove();

                              // Fetch the transaction data to get the orderId
                              fetch('https://bni-data-backend.onrender.com/api/allTransactions')
                                  .then(response => response.json())
                                  .then(transactions => {
                                      // Find the transaction with the matching cf_payment_id
                                      const transaction = transactions.find(tx => tx.cf_payment_id === cfPaymentId);
                                      if (transaction) {
                                          const orderId = transaction.order_id; // Get the order_id

                                          // Send both orderId and cf_payment_id to the backend
                                          fetch('https://bni-data-backend.onrender.com/api/send-qr-code', {
                                              method: 'POST',
                                              headers: {
                                                  'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({ orderId, cfPaymentId }), // Send both values
                                          })
                                          .then(response => response.json())
                                          .then(data => {
                                              console.log(data.message); // Handle success message
                                          })
                                          .catch(error => {
                                              console.error("Error sending data to backend:", error); // Handle error
                                          });
                                      } else {
                                          console.error("Transaction not found for cf_payment_id:", cfPaymentId);
                                      }
                                  })
                                  .catch(error => {
                                      console.error("Error fetching transactions:", error); // Handle error
                                  });

                          }, 3000); // 3 seconds delay
                      });
                  } else {
                      qrcodeCell.innerHTML = "<em>Not Applicable</em>";
                  }
              })
              .catch(() => {
                  row.querySelector(".irn").innerHTML = "<em>Error Loading IRN</em>";
                  row.querySelector(".qrcode").innerHTML = "<em>Error Loading QR Code</em>";
              });
              button.textContent = 'Payment Settled ✔';
              button.classList.remove('btn-success');
              button.classList.add('btn-success');
              button.setAttribute('disabled', 'true');
              toastr.success('Payment successfully settled!');

              let e_invoice = row.querySelector('.generate-invoice-btn');
              e_invoice.innerHTML = `<a href="#" data-order-id="${settlement.order_id}" class="btn btn-sm btn-success btn-wave waves-light generate-invoice">Generate E-Invoice</a>
              `;
    
              // Add UTR ID cell dynamically if it doesn't exist
              let utrCell = row.querySelector('.utr-cell');
              let settlementTime = row.querySelector('.settlement-time');
              if (!utrCell) {
                utrCell = document.createElement('td');
                utrCell.classList.add('utr-cell');
                utrCell.innerHTML = `<b>${settlement.transfer_utr}</b>`;
                row.appendChild(utrCell);
              } else {
                utrCell.innerHTML = `<b>${settlement.transfer_utr}</b>`;
              }
              if (!settlementTime) {
                settlementTime = document.createElement('td');
                settlementTime.classList.add('utr-cell');
              
                // Format the transfer time
                const formattedTime = new Date(settlement.transfer_time).toLocaleString('en-US', {
                  dateStyle: 'medium', // Example: Jul 25, 2021
                  timeStyle: 'short', // Example: 7:27 AM
                });
              
                settlementTime.innerHTML = `<b>${formattedTime}</b>`;
                row.appendChild(settlementTime);
              } else {
                // Format the transfer time
                const formattedTime = new Date(settlement.transfer_time).toLocaleString('en-US', {
                  dateStyle: 'medium', // Example: Jul 25, 2021
                  timeStyle: 'short', // Example: 7:27 AM
                });
              
                settlementTime.innerHTML = `<b>${formattedTime}</b>`;
              }
              
            } else {
              toastr.info('Settlement in process. Please track after some time.');
              button.textContent = originalText; // Restore button text
              button.disabled = false; // Re-enable the button
            }
          } catch (error) {
            console.error('Error tracking settlement:', error.message);
            toastr.error('An error occurred while tracking the settlement.');
            button.textContent = originalText; // Restore button text
            button.disabled = false; // Re-enable the button
          }
        }
      });
    

    // Display the totals
    document.querySelector(
      ".count-up[data-count='385']"
    ).textContent = `₹ ${totalTransactionAmount.toLocaleString("en-IN")}`;
    document.querySelectorAll(
      ".count-up"
    )[1].textContent = `₹ ${settledPayments.toLocaleString("en-IN")}`;
    document.querySelectorAll(
      ".count-up"
    )[2].textContent = `₹ ${pendingPayments.toLocaleString("en-IN")}`;

    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("generate-invoice")) {
        event.preventDefault();

        // Get the order and transaction details, as in your original code
        const orderId = event.target.getAttribute("data-order-id");
        const order = orders.find((o) => o.order_id === orderId);
        const transaction = transactions.find((t) => t.order_id === orderId);
        const chapterName = chapterMap.get(order?.chapter_id) || "N/A";
        const gatewayName =
          paymentGatewayMap.get(order?.payment_gateway_id) || "Unknown";
        const universalLinkName =
          universalLinkMap.get(order?.universal_link_id) || "Not Applicable";

        // SweetAlert for confirmation, as in your original code
        Swal.fire({
          title: "Are you sure?",
          text: `You are about to generate IRN and QR code for Order ID: ${orderId} and Transaction ID: ${transaction.cf_payment_id}.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, Generate!",
          cancelButtonText: "No, Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Please check the details",
              html: `
                      <strong>Order ID:</strong> ${orderId}<br>
                      <strong>Transaction ID:</strong> ${transaction.cf_payment_id}<br>
                      <strong>Chapter Name:</strong> ${chapterName}<br>
                      <strong>Payment Gateway:</strong> ${gatewayName}<br>
                      <strong>Universal Link:</strong> ${universalLinkName}<br>
                      <strong>Amount:</strong> ₹ ${transaction.payment_amount}
                    `,
              icon: "info",
              showCancelButton: true,
              confirmButtonText: "Confirm and Generate",
              cancelButtonText: "Cancel",
            }).then(async (secondResult) => {
              if (secondResult.isConfirmed) {
                const invoiceData = {
                  orderId: order,
                  transactionId: transaction,
                  amount: transaction.payment_amount,
                  chapterName: chapterName,
                  gatewayName: gatewayName,
                  universalLinkName: universalLinkName,
                };

                // Show the "Fetching IRN and QR code" loading SweetAlert
          let timerInterval;
          const loadingSwal = Swal.fire({
            title: "Fetching IRN and QR code",
            html: "Please wait while we fetch the IRN and QR code...",
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              const timer = Swal.getPopup().querySelector("b");
              timerInterval = setInterval(() => {
                timer.textContent = `${Swal.getTimerLeft()}`;
              }, 4000);
            },
            willClose: () => {
              clearInterval(timerInterval);
            }
          });

                try {
                  const backendResponse = await fetch(
                    "https://bni-data-backend.onrender.com/einvoice/generate-irn",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(invoiceData),
                    }
                  );

                  const responseData = await backendResponse.json();
                  if (backendResponse.ok) {
                    // Success response handling
                    Swal.fire("Success", responseData.message, "success");
                  
                    // Fetch IRN and QR code details after successful generation
                    const einvoiceResponse = await fetch(
                      `https://bni-data-backend.onrender.com/api/einvoice/${orderId}`
                    );
                    const einvoiceData = await einvoiceResponse.json();
                  
                    const transactionRow = event.target.closest("tr");
                    const qrCodeKey = `qrCode_${orderId}`; // Unique key for each order
                  
                    // Display the IRN or a message if not available
                    transactionRow.querySelector(".irn").innerHTML =
                      einvoiceData.irn || "<em>Not Applicable</em>";
                  
                  }
                
                  else {
                    // Error response handling
                    Swal.fire("Error", responseData.message, "error");
                  }
                } catch (error) {
                  // Handle any fetch errors
                  Swal.fire(
                    "Error",
                    "There was an issue connecting to the server. Please try again later.",
                    "error"
                  );
                }
              }
            });
          }
        });
      }
    });
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    hideLoader();
}
});



// Define and inject CSS styles in JavaScript
const style = document.createElement('style');
style.innerHTML = `
  .generate-qr-btn {
    color: transparent;
    cursor: pointer;
    text-align: center;
    background: linear-gradient(90deg, red, blue, red);
    background-size: 200% 100%;
    background-clip: text;
    -webkit-background-clip: text; /* for Safari */
    animation: gradient-move 1s infinite linear;
  }

  @keyframes gradient-move {
    0% { background-position: 0% 0%; }
    100% { background-position: 100% 0%; }
  }

  .loader {
    border: 4px solid rgba(0, 123, 255, 0.3); /* Light blue border */
    border-top: 4px solid #007bff; /* Blue border */
    border-radius: 50%; /* Make it round */
    width: 24px; /* Size of the loader */
    height: 24px; /* Size of the loader */
    animation: spin 1s linear infinite; /* Spin animation */
    margin-left: 10px; /* Space from the button */
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Append the style to the head of the document
document.head.appendChild(style);

// Event delegation for QR code generation
document.addEventListener('click', async function(event) {
  if (event.target.closest('.generate-qr-btn')) {
    const button = event.target.closest('.generate-qr-btn');
    const training_id = urlParams.get('training_id');
    console.log("Training ID:", training_id);

    // Function to fetch training details and return the data
    async function fetchTrainingDetails() {
      try {
        showLoader();
        const response = await fetch(`https://bni-data-backend.onrender.com/api/getTraining/${training_id}`);
        if (!response.ok) throw new Error('Failed to fetch training details');
        return await response.json(); // Return the training data
      } catch (error) {
        console.error('Error fetching training details:', error);
        return null;
      } finally {
        hideLoader();
      }
    }

    // Get the closest table row to the button
    const transactionRow = button.closest('tr');
    
    // Retrieve the cf_payment_id from the corresponding table cell
    const cfPaymentIdCell = transactionRow.querySelector('.custom_id b em');
    const cfPaymentId = cfPaymentIdCell ? cfPaymentIdCell.textContent : null; // Get the cf_payment_id
    console.log('CF Payment ID:', cfPaymentId); // Debug log

    if (cfPaymentId) {
      // Create and show a loader next to the button
      const loaderDiv = document.createElement('div');
      loaderDiv.className = 'loader'; // Add a class for styling the loader
      button.parentNode.insertBefore(loaderDiv, button.nextSibling); // Insert loader after the button
      
      // Hide the "Generate QR" button
      button.style.display = 'none';

      // Wait for 3 seconds (simulate loading)
      setTimeout(async () => {
        // Fetch the training details
        const trainingData = await fetchTrainingDetails();

        if (trainingData) {
        const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(cfPaymentId)}&size=100x100`;


         // Instead of showing QR code, show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<button class="btn btn-success btn-sm" disabled>QR Sent ✓</button>`;
    
    button.parentNode.insertBefore(successDiv, loaderDiv.nextSibling);
          // Extract the additional data
          const page_title = trainingData.training_name || '';
          const training_name = trainingData.training_name || '';
          const training_venue = trainingData.training_venue || '';
          const training_ticket_price = trainingData.training_price || '';
          const training_date = formatDateForInput(trainingData.training_date) || '';
          const training_published_by = trainingData.training_published_by || '';

          // Fetch the transaction data to get the orderId
          fetch('https://bni-data-backend.onrender.com/api/allTransactions')
              .then(response => response.json())
              .then(transactions => {
                  // Find the transaction with the matching cf_payment_id
                  const transaction = transactions.find(tx => tx.cf_payment_id === cfPaymentId);
                  if (transaction) {
                      const orderId = transaction.order_id; // Get the order_id

                      // Send all details to the backend
                      fetch('https://bni-data-backend.onrender.com/api/send-qr-code', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                              orderId,
                              cfPaymentId,
                              page_title,
                              training_name,
                              training_venue,
                              training_ticket_price,
                              training_date,
                              training_published_by,
                              qrCodeImage,
                              training_id
                          }), // Send all values
                      })
                      .then(response => response.json())
                      .then(data => {
                          console.log(data.message); // Handle success message
                      })
                      .catch(error => {
                          console.error("Error sending data to backend:", error); // Handle error
                      });
                  } else {
                      console.error("Transaction not found for cf_payment_id:", cfPaymentId);
                  }
              })
              .catch(error => {
                  console.error("Error fetching transactions:", error); // Handle error
              });
        } else {
          console.error("Training data not found.");
        }

        // Remove the loader
        loaderDiv.remove();

      }, 3000); // 3 seconds delay
    } else {
      console.error('CF Payment ID not found');
      toastr.error('CF Payment ID not found');
    }
  }
});



document.addEventListener("DOMContentLoaded", function () {
  const qrReader = new Html5Qrcode("qr-reader"); // Initialize the QR reader container
  const resultsDiv = document.getElementById("qr-reader-results");

  // Simulating retrieval of loginType and loggedInEmail (replace with actual logic)
  // const loginType = localStorage.getItem("loginType"); // Or fetch it from a backend endpoint
  const loggedInEmail = localStorage.getItem("loggedInEmail"); // Retrieve the email if available
  const orderId = document.getElementsByClassName("o_id")[0];
  const customerId = document.getElementsByClassName("customer_id")[0];
  const chapterName = document.getElementsByClassName("dynamic_chapter")[0];
  const memberName = document.getElementsByClassName("dynamic_member")[0];
  

  document.addEventListener("click", async function (event) {
    if (event.target.closest("#openCamera")) {
      const token = localStorage.getItem('token');
      // if (loginType !== "ro_admin") {
      //   alert("You are not authorized to scan QR codes.");
      //   return;
      // }

      let loginType;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedToken = JSON.parse(window.atob(base64));
        loginType = decodedToken.login_type;
      } catch (error) {
        console.error('Error decoding token:', error);
        alert('Authentication error. Please login again.');
        return;
      }

      if (loginType !== "ro_admin") {
        alert("You are not authorized to scan QR codes.");
        return;
      }

      // Check if scanner is already running
      if (qrReader.isScanning) {
        // Stop the scanner
        qrReader.stop().then(() => {
          console.log('QR Code scanner stopped');
          const button = event.target.closest("#openCamera");
          // Restore the original camera icon
          button.innerHTML = `<i class="fa fa-camera" style="font-size:20px; color:red;"></i>`;
          
          // Make sure QR reader div exists
          let qrReaderDiv = document.getElementById('qr-reader');
          if (!qrReaderDiv) {
            qrReaderDiv = document.createElement('div');
            qrReaderDiv.id = 'qr-reader';
            qrReaderDiv.style.width = '300px';
            button.insertAdjacentElement('afterend', qrReaderDiv);
          }
          qrReaderDiv.style.display = 'none';
        }).catch(err => {
          console.error('Failed to stop QR Code scanner:', err);
        });
        return;
      }

      // Starting the scanner
      // Make sure QR reader div exists and is visible
      let qrReaderDiv = document.getElementById('qr-reader');
      if (!qrReaderDiv) {
        qrReaderDiv = document.createElement('div');
        qrReaderDiv.id = 'qr-reader';
        qrReaderDiv.style.width = '300px';
        const button = event.target.closest("#openCamera");
        button.insertAdjacentElement('afterend', qrReaderDiv);
      }
      qrReaderDiv.style.display = 'block';
      

      // Start the QR Code scanning process
      qrReader
        .start(
          { facingMode: "environment" }, // Use the rear camera
          {
            fps: 10, // Frames per second for scanning
            qrbox: { width: 250, height: 250 }, // Define the scanning area
          },
          async (decodedText, decodedResult) => {
            console.log("QR Code scanned:", decodedText);
            
            // Find the row containing this QR code/transaction ID
            const rows = document.querySelectorAll('.table tbody tr');
            let targetRow;
            for (const row of rows) {
              const customIdCell = row.querySelector('.custom_id b em');
              if (customIdCell && customIdCell.textContent === decodedText) {
                targetRow = row;
                break;
              }
            }

            // Get member and chapter details from the found row
            const memberName = targetRow ? targetRow.querySelector('.dynamic_member').textContent : 'N/A';
            const chapterName = targetRow ? targetRow.querySelector('.dynamic_chapter b em').textContent : 'N/A';
            const orderId = targetRow ? targetRow.querySelector('.o_id em').textContent : 'N/A';
            const customerId = targetRow ? targetRow.querySelector('.customer_id').textContent : 'N/A';

            // Default avatar URL
            let memberImage = "https://img.freepik.com/premium-vector/young-man-avatar-character_24877-9475.jpg?semt=ais_hybrid";

            try {
                // Fetch member data to get the photo
                const memberResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
                const membersData = await memberResponse.json();
                console.log('Members data received:', membersData);
                
                // Find matching member
                const matchingMember = membersData.find(member => member.member_id.toString() === customerId);
                console.log('Matching member found:', matchingMember);
                
                if (matchingMember && matchingMember.member_photo) {
                    // Extract just the filename from the member_photo path
                    const photoFileName = matchingMember.member_photo.split('/').pop();
                    const photoUrl = `https://bni-data-backend.onrender.com/uploads/memberPhotos/${photoFileName}`;
                    console.log('Constructed photo URL:', photoUrl);
                    
                    // Test if image exists
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = photoUrl;
                    }).then(() => {
                        memberImage = photoUrl;
                        console.log('Member photo loaded successfully');
                    }).catch(() => {
                        console.log('Failed to load member photo, using default avatar');
                    });
                }
            } catch (error) {
                console.log('Error fetching member photo, using default avatar:', error);
            }

            // Use SweetAlert with the found data
            const result = await Swal.fire({
                title: "Are you sure to mark attendance?",
                text: `Do you want to mark attendance for this member? QR Code: ${decodedText}`,
                imageUrl: memberImage,
                imageWidth: 200,
                imageHeight: 200,
                imageAlt: "Member Image",
                html: `
                    <p><b>Chapter</b>: ${chapterName}</p>
                    <p><b>Member</b>: ${memberName}</p>
                    <p><b>Transaction ID</b>: ${decodedText}</p>
                    <p><b>Order ID</b>: ${orderId}</p>
                `,
                showCancelButton: true,
                confirmButtonText: "Yes, mark attendance!",
                cancelButtonText: "No, cancel",
            });
            

            if (result.isConfirmed) {
                try {
                    // Send the scanned QR code to the backend
                    const response = await fetch("https://bni-data-backend.onrender.com/api/verify-qr-code", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "loggedin-email": loggedInEmail || "", // Send email if available
                            "login-type": loginType, // Include login type
                        },
                        body: JSON.stringify({
                            cfPaymentId: decodedText,
                            confirmAttendance: true,
                        }),
                    });

                    const result = await response.json();
                    if (response.ok) {
                        Swal.fire({
                            title: "Success!",
                            text: result.message,
                            icon: "success",
                        }).then(() => {
                            // Add page reload after clicking OK on success message
                            window.location.reload();
                        });
                        resultsDiv.innerHTML = `<p>Attendance marked successfully for: ${decodedText}</p>`;
                    } else {
                        Swal.fire({
                            title: "Error!",
                            text: result.message || "Failed to mark attendance",
                            icon: "error",
                        }).then(() => {
                            window.location.reload();
                        });
                    }
                } catch (error) {
                    console.error("Error marking attendance:", error);
                    Swal.fire({
                        title: "Error!",
                        text: "An unexpected error occurred.",
                        icon: "error",
                    });
                }
            }
          },
          (errorMessage) => {
            console.error("QR Code scan error:", errorMessage);
          }
        )
        .catch((err) => {
          console.error("Failed to start the QR Code scanner:", err);
        });
    }
  });
});
