document.addEventListener("DOMContentLoaded", async () => {

  const regionsDropdown = document.getElementById("region-filter");
  const chaptersDropdown = document.getElementById("chapter-filter");
  const monthsDropdown = document.getElementById("month-filter");
  const paymentStatusDropdown = document.getElementById("payment-status-filter");
  const paymentTypeDropdown = document.getElementById("payment-type-filter");
  const paymentGatewayDropdown = document.getElementById("payment-gateway-filter");
  const paymentMethodDropdown = document.getElementById("payment-method-filter");
  const yearDropdown = document.getElementById("year-filter");
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
  
        // console.log(`Selected Value from ${dropdown.id}:`, selectedValue);
      });
    });
  };

showLoader();
  try {
    // Fetch data from all necessary endpoints
    const [
      ordersResponse,
      transactionsResponse,
      chaptersResponse,
      paymentGatewayResponse,
      universalLinksResponse,
      regionsResponse,
      paymentTypeResponse,
    ] = await Promise.all([
      fetch("https://backend.bninewdelhi.com/api/allOrders"),
      fetch("https://backend.bninewdelhi.com/api/allTransactions"),
      fetch("https://backend.bninewdelhi.com/api/chapters"),
      fetch("https://backend.bninewdelhi.com/api/paymentGateway"),
      fetch("https://backend.bninewdelhi.com/api/universalLinks"),
      fetch("https://backend.bninewdelhi.com/api/regions"),
      fetch("https://backend.bninewdelhi.com/api/universalLinks"),
    ]);

    const orders = await ordersResponse.json();
    const transactions = await transactionsResponse.json();
    const chapters = await chaptersResponse.json();
    const paymentGateways = await paymentGatewayResponse.json();
    const universalLinks = await universalLinksResponse.json();
    const regions = await regionsResponse.json();
    const paymentType = await paymentTypeResponse.json();

    // Populate region and chapter dropdowns
    populateDropdown(regionsDropdown, regions, "region_id", "region_name", "Select Region");
    populateDropdown(chaptersDropdown, chapters, "chapter_id", "chapter_name", "Select Chapter");
    populateDropdown(paymentTypeDropdown, paymentType, "id", "universal_link_name", "Select Payment Type");
    populateDropdown(paymentGatewayDropdown, paymentGateways, "gateway_id", "gateway_name", "Select Gateway");

    // Populate month dropdown
const populateMonthDropdown = () => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  monthsDropdown.innerHTML = `
    <li>
      <a class="dropdown-item" href="javascript:void(0);" data-value="">
        <input type="checkbox" class="select-all me-2"> Select All
      </a>
    </li>
  `; 
  months.forEach((month, index) => {
    monthsDropdown.innerHTML += `
      <li>
        <a class="dropdown-item" href="javascript:void(0);" data-value="${index + 1}">
          <input type="checkbox" class="month-checkbox me-2"> ${month}
        </a>
      </li>`;
  });

  // Prevent dropdown from closing when clicking checkboxes
  monthsDropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      if(e.target.classList.contains('select-all')) {
        // Handle "Select All" checkbox
        const checked = e.target.checked;
        monthsDropdown.querySelectorAll('.month-checkbox').forEach(cb => {
          cb.checked = checked;
        });
      }
    });
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

// Populate year dropdown
const populateYearDropdown = () => {
  try {
    // Get unique years from transactions based on payment_time
    const uniqueYears = [...new Set(transactions.map(transaction => {
      if (transaction.payment_time) {
        const formattedDate = new Date(transaction.payment_time).toLocaleDateString("en-GB");
        const year = formattedDate.split('/')[2];
        return year;
      }
      return null;
    }).filter(year => year !== null))];

    // Sort years in descending order (most recent first)
    uniqueYears.sort((a, b) => b - a);

    // Clear existing options
    const yearDropdown = document.getElementById("year-filter");
    yearDropdown.innerHTML = "";

    // Add default option
    yearDropdown.innerHTML = `
      <li>
        <a class="dropdown-item" href="javascript:void(0);" data-value="">
          Select Year
        </a>
      </li>
    `;

    // Add year options
    uniqueYears.forEach(year => {
      yearDropdown.innerHTML += `
        <li>
          <a class="dropdown-item" href="javascript:void(0);" data-value="${year}">
            ${year}
          </a>
        </li>
      `;
    });

    // Add click event listeners to year filter options
    const yearFilterOptions = yearDropdown.querySelectorAll('.dropdown-item');
    yearFilterOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Remove active class from all options
        yearFilterOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to selected option
        this.classList.add('active');
        
        const selectedYear = this.getAttribute('data-value');
        const yearFilterBtn = this.closest('.dropdown').querySelector('.dropdown-toggle');
        yearFilterBtn.textContent = selectedYear || 'Year';
      });
    });

  } catch (error) {
    console.error("Error populating year dropdown:", error);
  }
};

// Call this function after your transactions data is loaded
populateYearDropdown();

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

// Attach event listener to "Apply Filter" button
document.getElementById("apply-filters-btn").addEventListener("click", () => {
  // Capture selected values including year
  const regionId = regionsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const chapterId = chaptersDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const month = monthsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const year = document.getElementById('year-filter').querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentStatus = paymentStatusDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentType = paymentTypeDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentGateway = paymentGatewayDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentMethod = (paymentMethodDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '').toLowerCase();

  // Construct the query string
  const queryParams = new URLSearchParams();

  if (regionId) queryParams.append('region_id', regionId);
  if (chapterId) queryParams.append('chapter_id', chapterId);
  if (month) queryParams.append('month', month);
  if (year) queryParams.append('year', year);
  if (paymentStatus) queryParams.append('payment_status', paymentStatus);
  if (paymentType) queryParams.append('payment_type', paymentType);
  if (paymentGateway) queryParams.append('payment_gateway', paymentGateway);
  if (paymentMethod) queryParams.append('payment_method', paymentMethod);

  // Show the Reset Filter button if any filter is applied
  if (queryParams.toString()) {
    document.getElementById("reset-filters-btn").style.display = "inline-block";
  }

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
  payment_type: urlParams.get("payment_type"),
  payment_gateway: urlParams.get("payment_gateway"),
  payment_method: urlParams.get("payment_method"),
  year: urlParams.get("year"),
};

// Show filters in the console for debugging
// console.log(filters);


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
      // console.log(`No matching order found for transaction ${transaction.order_id}`);
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
      // console.log(`No matching order found for transaction ${transaction.order_id}`);
    }
  }

  if (filters.payment_type && transaction.order_id) {
    const order = orders.find(order => order.order_id === transaction.order_id);

    if (order) {
      // Ensure both region_id values are strings (or numbers)
      const orderPaymentId = String(order.universal_link_id);  // Convert to string
      const filterPaymentId = String(filters.payment_type);  // Convert to string

      // Compare as strings (or numbers, depending on the data type)
      if (orderPaymentId !== filterPaymentId) {
        isValid = false;
      }
    } else {
      // console.log(`No matching order found for transaction ${transaction.order_id}`);
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
      // console.log(`No matching order found for transaction ${transaction.order_id}`);
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
      // console.log(`No matching order found for transaction ${transaction.order_id}`);
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
      // console.log(`No matching order found for transaction ${transaction.order_id}`);
    }
  }

  // Add year filter condition
  if (filters.year && transaction.payment_time) {
    const transactionDate = new Date(transaction.payment_time).toLocaleDateString("en-GB");
    const transactionYear = transactionDate.split('/')[2];
    if (transactionYear !== filters.year) {
      isValid = false;
    }
  }

  if (filters.month && transaction.payment_time) {
    const transactionDate = new Date(transaction.payment_time);
    const transactionMonth = transactionDate.getMonth() + 1; // getMonth() returns 0-11
    if (transactionMonth !== parseInt(filters.month)) {
      isValid = false;
    }
  }

  if (filters.payment_status && transaction.payment_status) {
    if (transaction.payment_status !== filters.payment_status) {
      isValid = false;
    }
  }

  if (filters.payment_method && transaction.payment_group) {
    if (transaction.payment_group.toLowerCase() !== filters.payment_method.toLowerCase()) {
      isValid = false;
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
    let totalGSTAmount = 0;
    let totalBaseAmount = 0;

    // Sort transactions by payment time (latest first)
    filteredTransactions.sort(
      (a, b) => new Date(b.payment_time) - new Date(a.payment_time)
    );

    // Get the table body to insert rows
    const tableBody = document.querySelector(".table tbody");

    filteredTransactions.forEach((transaction, index) => {
      // console.log("Transaction in filtered list:", transaction);
      // Find the associated order
      const order = orders.find(
        (order) => order.order_id === transaction.order_id
      );
      // Get chapter name from chapterMap
      const chapterName = chapterMap.get(order?.chapter_id) || "N/A";

      // Get gateway name from paymentGatewayMap using order's gateway_id
      const gatewayName =
        paymentGatewayMap.get(order?.payment_gateway_id) || "Unknown";

      // Get universal link name from universalLinkMap using order's universal_link_id
      const universalLinkName =
        universalLinkMap.get(order?.universal_link_id) || "Not Applicable";

      // Update total transaction amount
      const transactionAmount = parseFloat(transaction.payment_amount);
       
      // Check payment status and update settled or pending totals
      if (transaction.payment_status === "SUCCESS") {
        // Add to settled payments
        settledPayments += transactionAmount;
        totalTransactionAmount += transactionAmount;
      } else if (transaction.payment_status === "PENDING") {
        // Add to pending payments
        pendingPayments += transactionAmount;
        console.log('⚠️ Skipped Transaction:', {
            '🔢 Order ID': transaction.order_id,
            '💵 Amount': `₹${transactionAmount.toLocaleString("en-IN")}`,
            '❌ Status': transaction.payment_status
        });
      }

      // Calculate GST (amount × 18/118)
      const gstAmount = Math.round((totalTransactionAmount * 18) / 100);
      console.log('💰 GST Amount:', gstAmount);

      // Calculate base amount (total amount - GST amount)
      const baseAmount = Math.round(totalTransactionAmount - gstAmount);
      console.log('💰 Base Amount:', baseAmount);

      // Update UI elements
      document.getElementById('total_gst_amount').textContent = `₹${gstAmount.toLocaleString("en-IN")}`;
      // document.getElementById('total_base_amount').textContent = `₹${baseAmount.toLocaleString("en-IN")}`;
// 
      // Format all amounts with Indian currency format
      const formattedTotalAmount = `₹${transactionAmount.toLocaleString("en-IN")}`;
     

      // Determine payment method
      let paymentMethod = "N/A";
      let paymentImage = "";
      if (transaction.payment_method) {
        if (transaction.payment_method.upi) {
          paymentMethod = "UPI";
          paymentImage =
            '<img src="https://economictimes.indiatimes.com/thumb/msid-74960608,width-1200,height-900,resizemode-4,imgsize-49172/upi-twitter.jpg?from=mdr" alt="UPI" width="30" height="30">';
        } else if (transaction.payment_method.card) {
          paymentMethod = "Card";
          paymentImage =
            '<img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" alt="Card" width="20" height="20">';
        } else if (transaction.payment_method.netbanking) {
          paymentMethod = "Net Banking";
          paymentImage =
            '<img src="https://cdn.prod.website-files.com/64199d190fc7afa82666d89c/648b63af41676287e601542d_regular-bank-transfer.png" alt="Net Banking" width="20" height="20">';
        } else if (transaction.payment_method.wallet) {
          paymentMethod = "Wallet";
          paymentImage =
            '<img src="https://ibsintelligence.com/wp-content/uploads/2024/01/digital-wallet-application-mobile-internet-banking-online-payment-security-via-credit-card_228260-825.jpg" alt="Wallet" width="20" height="20">';
        }
      }

      // Format date and amount
      const formattedDate = transaction.payment_time.split('T')[0].split('-').reverse().join('/');
      // Create a new row for the table
      const row = document.createElement("tr");
      row.classList.add("invoice-list");

      let actionButton;
      let invoiceButton;
      let utrValue = '<em>Not Available</em>';
      let settlementValue = '<em>Not Available</em>';
      let irnValue = '<em>Not Applicable</em>';
      let qrcodeValue = '<em>Not Applicable</em>';
      let cancelIrnValue = '<em>Not Applicable</em>';

      // console.log('Checking payment method for transaction:', transaction.order_id);
      // console.log('Payment method structure:', transaction.payment_method);

      if (transaction.payment_method?.cash?.payment_note === "Visitor Payment" || 
        transaction.payment_method?.cash?.payment_note === "Meeting Payment" ||
        transaction.payment_method?.cash?.payment_note === "Advance Meeting Payment") {
          // console.log('✅ Cash payment detected for order:', transaction.order_id);
          actionButton = `
              <button class="btn btn-sm btn-success" disabled>
                  <i class="ti ti-check me-1"></i>
                  Payment Settled
              </button>
          `;
          invoiceButton = `
              <a href="#" data-order-id="${transaction.order_id}" 
                 class="btn btn-sm btn-success btn-wave waves-light generate-invoice">
                  Generate E-Invoice
              </a>
          `;
          
          // Set static values for cash payments
          utrValue = '<em>Cash Payment</em>';
          settlementValue = '<em>Cash Payment</em>';
          irnValue = '<em>Cash Payment</em>';
          qrcodeValue = '<em>Cash Payment</em>';
      } else {
          // console.log('🔄 Non-cash payment detected for order:', transaction.order_id);
          actionButton = `
              <a href="#" data-transaction-id="${transaction.order_id}" 
                 class="btn btn-sm btn-outline-danger btn-wave waves-light track-settlement">
                  Track Settlement
              </a>
          `;
          invoiceButton = "Not Applicable";
      }

      // Function to get member name with console logging
      const getMemberName = (order, universalLinkName) => {
        console.log('💡 Member Name Check:', {
            'Order Details': order,
            'Link Type': universalLinkName,
            'Visitor Name': order?.visitor_name,
            'Member Name': order?.member_name,
            'Payment Note': order?.payment_note
        });

        // Trim the universalLinkName to handle any extra spaces
        const linkType = universalLinkName?.trim();

        // Check for Visitor Payment in payment_note
    if (order?.payment_note === "Visitor Payment") {
      console.log('👥 Visitor Payment Detected from Note:', {
          'Visitor Name': order?.visitor_name || 'Not Available',
          'Order ID': order?.order_id
      });
      return order?.visitor_name || "Unknown Visitor";
  }

        if (order?.payment_note === "New Member Payment") {
            console.log('🆕 New Member Payment Detected:', {
                'Visitor Name': order?.visitor_name || 'Not Available',
                'Member Name': order?.member_name || 'Not Available',
                'Order ID': order?.order_id
            });
            return order?.visitor_name || "Unknown Visitor"; // Return visitor name for new member payments
        }

        if (linkType === "Visitors Payment") {
            return order?.visitor_name || "Unknown Visitor";
        }

        return order?.member_name || "Unknown";
      };
      // <td><b>${actualAmount}</b></td>
      // <td><b>${gstAmount}</b></td>
      row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formattedDate}</td>
                <td><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMRBqTeY-dTImnv-0qS4j32of8dVtWelSEMw&s" alt="Card" width="20" height="20">${
                  getMemberName(order, universalLinkName)
                }</td>
                <td><b><em>${chapterName}</em></b></td>
                <td><b>${formattedTotalAmount}</b><br><a href="/t/view-invoice?order_id=${
        transaction.order_id
      }" class="fw-medium text-success">View</a></td>
                   
               
                <td>${paymentImage} ${paymentMethod}</td>
                <td><em>${transaction.order_id}</em></td>
                <td><b><em>${transaction.cf_payment_id}</em></b></td>
                <td><span class="badge ${
                  transaction.payment_status === "SUCCESS"
                    ? "bg-success"
                    : "bg-danger"
                }">${transaction.payment_status.toLowerCase()}</span></td>
                <td><b><em>${gatewayName}</em></b></td>
                <td><em>${universalLinkName}</em></td>
                <td>${actionButton}</td>
                <td class="utr-cell">${utrValue}</td>
                <td class="settlement-time">${settlementValue}</td>
                <td class="irn">${irnValue}</td>
                <td class="qrcode">${qrcodeValue}</td>
                <td class="generate-invoice-btn">${invoiceButton}</td>
                <td class="cancel-invoice-btn">${cancelIrnValue}</td>
            `;

      tableBody.appendChild(row);
    
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
              `https://backend.bninewdelhi.com/api/orders/${orderId}/settlementStatus`,
              { method: 'GET' }
            );
    
            if (!saveResponse.ok) {
              throw new Error('Failed to save settlement data.');
            }
    
            // Step 2: Fetch settlement data using cf_payment_id
            const row = button.closest('tr');
            const cfPaymentId = row.querySelector('td:nth-child(8) em').innerText;
    
            const fetchResponse = await fetch(
              `https://backend.bninewdelhi.com/api/settlement/${cfPaymentId}`
            );
    
            if (!fetchResponse.ok) {
              throw new Error('Failed to fetch settlement data.');
            }
    
            const { settlement } = await fetchResponse.json();
    
            // Step 3: Update the table row based on settlement data
            if (settlement.transfer_utr && settlement.transfer_time && settlement.transfer_id) {

              fetch(`https://backend.bninewdelhi.com/api/einvoice/${settlement.order_id}`)
              .then(response => response.json())
              .then(einvoiceData => {
                  const irnCell = row.querySelector(".irn");
                  const qrcodeCell = row.querySelector(".qrcode");
                  const btnCell = row.querySelector(".generate-invoice-btn");
                  const cancelIrnBtn = row.querySelector(".cancel-invoice-btn");
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

                    // Fetch cancelled IRNs and check if current IRN is cancelled
                    fetch('https://backend.bninewdelhi.com/api/getCancelIrn')
                        .then(response => response.json())
                        .then(cancelledIrns => {
                            const isIrnCancelled = cancelledIrns.some(item => item.irn === einvoiceData.irn);
                            
                            if (isIrnCancelled) {
                                cancelIrnBtn.innerHTML = `<button class="btn btn-sm btn-success" disabled style="opacity: 0.5;">
                                    Already Cancelled ✓
                                </button>`;
                            } else {
                                cancelIrnBtn.innerHTML = `<button class="btn btn-sm btn-link cancel_irn" data-id="${einvoiceData.irn}">Cancel IRN</button>`;

                                cancelIrnBtn.querySelector(".cancel_irn").addEventListener("click", function () {
                                    const irn = this.getAttribute("data-id");
                                    
                                    Swal.fire({
                                        title: "Are you sure?",
                                        html: `Are you sure to cancel IRN for <b>${irn}</b>?`,
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonText: "Yes, Cancel IRN",
                                        cancelButtonText: "No"
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            Swal.fire({
                                                title: "Enter Cancel Reason",
                                                input: "textarea",
                                                inputPlaceholder: "Enter the reason for cancellation...",
                                                showCancelButton: true,
                                                confirmButtonText: "Cancel IRN",
                                                preConfirm: (remarks) => {
                                                    if (!remarks) {
                                                        Swal.showValidationMessage("Please enter a reason!");
                                                    }
                                                    return remarks;
                                                }
                                            }).then((reasonResult) => {
                                                if (reasonResult.isConfirmed) {
                                                    const remarks = reasonResult.value;
                                                    console.log("IRN:", irn);
                                                    console.log("Cancel Remarks:", remarks);
                                                    
                                                    // Send data to backend
                                                    fetch("https://backend.bninewdelhi.com/einvoice/cancel-irn", {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json"
                                                        },
                                                        body: JSON.stringify({
                                                            Irn: irn,
                                                            CnlRsn: 1,
                                                            CnlRem: remarks
                                                        })
                                                    })
                                                    .then(response => response.json())
                                                    .then(data => {
                                                        console.log("Response from backend:", data);
                                                        if (data.success) {
                                                            Swal.fire("Cancelled!", "IRN has been cancelled successfully.", "success")
                                                                .then(() => {window.location.href = "/t/cancelled-irns"});
                                                        } else {
                                                            Swal.fire("Error!", "Something went wrong.", "error");
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error("Error:", error);
                                                        Swal.fire("Error!", "Failed to cancel IRN.", "error");
                                                    });
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                        })
                        .catch(error => {
                            console.error("Error fetching cancelled IRNs:", error);
                            // If we can't check cancelled status, show the cancel button by default
                            cancelIrnBtn.innerHTML = `<button class="btn btn-sm btn-link cancel_irn" data-id="${einvoiceData.irn}">Cancel IRN</button>`;
                        });

                    // Check if QR code is already stored in localStorage for this order
                    if (localStorage.getItem(qrCodeKey)) {
                        // If QR code is stored, show the QR code image
                        qrcodeCell.innerHTML = `<img src="${localStorage.getItem(qrCodeKey)}" alt="QR Code" width="100" height="100">`;
                    } else if (einvoiceData.qrcode) {
                        // If QR code is available but not yet stored, show the button
                        qrcodeCell.innerHTML = `<span class="generate-qr-btn">Generate QR Code</span>`;

                        // Add event listener to the button to display loading and then the QR code
                        row.querySelector(".generate-qr-btn").addEventListener("click", () => {
                            // Show "Loading..." message or spinner
                            qrcodeCell.innerHTML = "<em>Loading...</em>";

                            // Simulate loading for 3-4 seconds
                            setTimeout(() => {
                                // Generate the QR code using the qrcode.js library
                                const qrCodeData = einvoiceData.qrcode;

                                // Generate the QR code and set it as an image
                                QRCode.toDataURL(qrCodeData, { width: 100, height: 100 }, (err, url) => {
                                    if (err) {
                                        console.error('Error generating QR Code:', err);
                                        qrcodeCell.innerHTML = "<em>Error generating QR Code</em>";
                                    } else {
                                        // Store the generated QR code URL in localStorage
                                        localStorage.setItem(qrCodeKey, url);

                                        // Display the generated QR code
                                        qrcodeCell.innerHTML = `<img src="${url}" alt="QR Code" width="100" height="100">`;
                                    }
                                });
                            }, 3000); // Delay for 3 seconds
                        });
                    } else {
                        qrcodeCell.innerHTML = "<em>Not Applicable</em>";
                    }
                }
        
                  // Check if QR code is already stored in localStorage for this order
                  if (localStorage.getItem(qrCodeKey)) {
                      // If QR code is stored, show the QR code image
                      qrcodeCell.innerHTML = `<img src="${localStorage.getItem(qrCodeKey)}" alt="QR Code" width="100" height="100">`;
                  } else if (einvoiceData.qrcode) {
                      // If QR code is available but not yet stored, show the button
                      qrcodeCell.innerHTML = `<span class="generate-qr-btn">Generate QR Code</span>`;
        
                      // Add event listener to the button to display loading and then the QR code
                      row.querySelector(".generate-qr-btn").addEventListener("click", () => {
                          // Show "Loading..." message or spinner
                          qrcodeCell.innerHTML = "<em>Loading...</em>";
        
                          // Simulate loading for 3-4 seconds
                          setTimeout(() => {
                              // Generate the QR code using the qrcode.js library
                              const qrCodeData = einvoiceData.qrcode;
        
                              // Generate the QR code and set it as an image
                              QRCode.toDataURL(qrCodeData, { width: 100, height: 100 }, (err, url) => {
                                  if (err) {
                                      console.error('Error generating QR Code:', err);
                                      qrcodeCell.innerHTML = "<em>Error generating QR Code</em>";
                                  } else {
                                      // Store the generated QR code URL in localStorage
                                      localStorage.setItem(qrCodeKey, url);
        
                                      // Display the generated QR code
                                      qrcodeCell.innerHTML = `<img src="${url}" alt="QR Code" width="100" height="100">`;
                                  }
                              });
                          }, 3000); // Delay for 3 seconds
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
              // Only show "in process" toaster if NOT in auto-tracking mode
              if (!window.isAutoTracking) {
                  toastr.info('Settlement in process. Please track after some time.');
              }
              button.textContent = originalText; // Restore button text
              button.disabled = false; // Re-enable the button
            }
          } catch (error) {
            // Only show error toaster if NOT in auto-tracking mode
            if (!window.isAutoTracking) {
                toastr.error('An error occurred while tracking the settlement.');
            }
            console.error('Error tracking settlement:', error.message);
            button.textContent = originalText; // Restore button text
            button.disabled = false; // Re-enable the button
          }
        }
      });
    

    // Add this right after the table population loop ends
    function autoClickTrackSettlements() {
        // console.log('🚀 Starting auto-click process after table population');
        
        window.isAutoTracking = true;
        // console.log('🔄 Setting auto-tracking flag');
        
        const buttons = document.querySelectorAll('.track-settlement');
        // console.log(`📊 Found ${buttons.length} track settlement buttons`);
        
        // First click all buttons
        buttons.forEach((button, index) => {
            setTimeout(async () => {
                const orderId = button.dataset.transactionId;
                const row = button.closest('tr');
                
                const dateInTable = row.cells[1].textContent.trim();
                const today = new Date();
                const todayString = today.toLocaleDateString('en-GB');
                
                // console.log(`Checking: Table date: ${dateInTable}, Today: ${todayString}`);
                
                const currentText = button.textContent.trim();

                if (currentText !== 'Payment Settled ✔') {
                    button.click();
                    
                    setTimeout(() => {
                        const newText = button.textContent.trim();
                        if (newText === 'Payment Settled ✔') {
                            if (dateInTable === todayString) {
                                toastr.success('Payment successfully settled!');
                            }
                        }
                    }, 200);
                }
            }, index * 1000); // Increased delay between clicks
        });

        // Wait for IRNs to load, then check them
        setTimeout(() => {
            // console.log('[CHECK] Starting IRN verification after delay');
            
            const irnCells = document.querySelectorAll('.irn');
            irnCells.forEach((irnCell, index) => {
                const currentIrn = irnCell.textContent.trim();
                // console.log(`[IRN ${index + 1}] Current value:`, currentIrn);
                
                if (currentIrn && currentIrn !== 'Not Applicable' && currentIrn !== 'Not Available') {
                    // console.log(`[COMPARE] Checking IRN against cancelled list:`, currentIrn);
                    
                    const isCancelled = cancelledIrnData.some(item => {
                        const matches = item.irn === currentIrn;
                        console.log(`[MATCH] Comparing:`, {
                            currentIrn: currentIrn,
                            cancelledIrn: item.irn,
                            matches: matches
                        });
                        return matches;
                    });

                    if (isCancelled) {
                        const row = irnCell.closest('tr');
                        const cancelCell = row.querySelector('.cancel-invoice-btn');
                        console.log(`[UPDATE] Marking IRN as cancelled:`, currentIrn);
                        
                        if (cancelCell) {
                            cancelCell.innerHTML = `
                                <button class="btn btn-sm btn-success" disabled style="opacity: 0.7;">
                                    Already Cancelled ✓
                                </button>`;
                        }
                    }
                }
            });
        }, (buttons.length * 1000) + 1000); // Wait for all buttons plus 5 seconds

        setTimeout(() => {
            window.isAutoTracking = false;
            // console.log('✅ Auto-tracking completed');
        }, (buttons.length * 1000) + 6000);
    }

    // Call the function immediately after table population
    // console.log('📋 Table populated, initiating auto-click');
    autoClickTrackSettlements();

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

    // Add after processing all transactions
    console.log('📑 Final GST Summary:', {
        '💰 Total GST Collected': `₹${totalGSTAmount.toLocaleString("en-IN")}`,
        '✅ Formula Used': 'Amount × 0.18'
    });

    // Function to update transaction counts
    function updateTransactionCounts() {
        try {
            // Get all rows from the transaction table
            const rows = document.getElementsByTagName('tr');
            let maxSerialNumber = 0;
            let cancelledIrns = 0;
            let generatedInvoices = 0;
            
            // Find the highest serial number in the table
            for (let i = 1; i < rows.length; i++) {
                const firstCell = rows[i].cells[0];
                if (firstCell) {
                    const serialNumber = parseInt(firstCell.textContent);
                    if (!isNaN(serialNumber) && serialNumber > maxSerialNumber) {
                        maxSerialNumber = serialNumber;
                    }
                }
            }
            
            // Count rows with valid IRN values and cancelled IRNs
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const irnCell = row.querySelector('.irn');
                const cancelCell = row.querySelector('.cancel-invoice-btn');
                
                // Check for valid IRN
                if (irnCell && 
                    irnCell.textContent && 
                    irnCell.textContent.trim() !== 'Not Applicable' && 
                    irnCell.textContent.trim() !== 'Not Available' &&
                    irnCell.textContent.trim() !== 'Error Loading IRN' &&
                    irnCell.textContent.trim() !== 'Loading...') {
                    
                    // Check if this IRN is cancelled
                    const currentIrn = irnCell.textContent.trim();
                    const isCancelled = cancelledIrnData.some(item => item.irn === currentIrn);
                    
                    if (isCancelled || 
                        (cancelCell && cancelCell.innerHTML.includes('Already Cancelled'))) {
                        cancelledIrns++;
                        console.log(`Found cancelled IRN: ${currentIrn}`);
                    } else {
                        generatedInvoices++;
                    }
                }
            }
            
            // Calculate totals
            const totalTransactions = maxSerialNumber;
            const pendingInvoices = totalTransactions - (generatedInvoices + cancelledIrns);
            
            // Update the counters in the UI
            document.getElementById('no_of_transaction').textContent = totalTransactions;
            document.getElementById('settled_transaction').textContent = generatedInvoices;
            document.getElementById('not_settle_transaction').textContent = pendingInvoices;
            document.getElementById('cancelled_irns').textContent = cancelledIrns;
            
            // console.log('📊 Transaction Counts Updated:', {
            //     ' Total Transactions': totalTransactions,
            //     '✅ Generated Invoices': generatedInvoices,
            //     '⏳ Pending Invoices': pendingInvoices,
            //     '❌ Cancelled IRNs': cancelledIrns,
            //     '🔢 Max Serial Found': maxSerialNumber,
            //     '⏰ Updated At': new Date().toLocaleTimeString()
            // });
        } catch (error) {
            console.error('Error in counting transactions:', error);
        }
    }

    // Update counts when IRN is cancelled
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('cancel_irn')) {
            // Wait for the cancellation process to complete
            setTimeout(updateTransactionCounts, 1000);
        }
    });

    // Set up a MutationObserver to watch for changes in the table
    const observer = new MutationObserver(() => {
        updateTransactionCounts();
    });

    // Start observing the table for changes
    const table = document.querySelector('.table');
    if (table) {
        observer.observe(table, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Initial count when page loads
    document.addEventListener('DOMContentLoaded', () => {
        updateTransactionCounts();
    });

    // Move the click event listener inside the try block where orders and other data are available
    document.body.addEventListener("click", async (event) => {
        const generateButton = event.target.closest('.generate-invoice');
        if (!generateButton) return;

        event.preventDefault();
        event.stopPropagation();

        const orderId = generateButton.getAttribute("data-order-id");
        const order = orders.find((o) => o.order_id === orderId);
        const transaction = transactions.find((t) => t.order_id === orderId);
        const chapterName = chapterMap.get(order?.chapter_id) || "N/A";
        const gatewayName = paymentGatewayMap.get(order?.payment_gateway_id) || "Unknown";
        const universalLinkName = universalLinkMap.get(order?.universal_link_id) || "Not Applicable";

        // Rest of your existing confirmation and generation logic...
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

                        // Show loading dialog
                        let timerInterval;
                        const loadingSwal = Swal.fire({
                            title: "Fetching IRN and QR code",
                            html: "Please wait while we fetch the IRN and QR code...",
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });

                        try {
                            const backendResponse = await fetch(
                                "https://backend.bninewdelhi.com/einvoice/generate-irn",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(invoiceData),
                                }
                            );
                            const responseData = await backendResponse.json();

                            // Close the loading dialog
                            if (loadingSwal) {
                                loadingSwal.close();
                            }

                            if (backendResponse.ok) {
                                // Success response handling
                                await Swal.fire({
                                    title: "Success",
                                    text: responseData.message || "IRN generated successfully",
                                    icon: "success",
                                    confirmButtonText: "OK"
                                });

                                // Fetch IRN and QR code details after successful generation
                                const einvoiceResponse = await fetch(
                                    `https://backend.bninewdelhi.com/api/einvoice/${orderId}`
                                );
                                const einvoiceData = await einvoiceResponse.json();

                                const transactionRow = event.target.closest("tr");
                                const qrCodeKey = `qrCode_${orderId}`; // Unique key for each order

                                // Display the IRN
                                transactionRow.querySelector(".irn").innerHTML = einvoiceData.irn || "<em>Not Applicable</em>";

                                // Update the Generate E-Invoice button to View E-Invoice
                                const encodedInvoiceData = encodeURIComponent(JSON.stringify(invoiceData));
                                const encodedEinvoiceData = encodeURIComponent(JSON.stringify(einvoiceData));
                                transactionRow.querySelector(".generate-invoice-btn").innerHTML = 
                                    `<a href="/v/einvoice?invoiceData=${encodedInvoiceData}&einvoiceData=${encodedEinvoiceData}" class="btn btn-sm btn-link">View E-Invoice</a>`;

                                // Add Cancel IRN button
                                transactionRow.querySelector(".cancel-invoice-btn").innerHTML = 
                                    `<button class="btn btn-sm btn-link cancel_irn" data-id="${einvoiceData.irn}">Cancel IRN</button>`;

                                // Handle QR code display
                                if (localStorage.getItem(qrCodeKey)) {
                                    transactionRow.querySelector(".qrcode").innerHTML = 
                                        `<img src="${localStorage.getItem(qrCodeKey)}" alt="QR Code" width="100" height="100">`;
                                } else if (einvoiceData.qrcode) {
                                    transactionRow.querySelector(".qrcode").innerHTML = 
                                        `<span class="generate-qr-btn">Generate QR Code</span>`;

                                    // Add QR code generation event listener
                                    transactionRow.querySelector(".generate-qr-btn").addEventListener("click", () => {
                                        // ... rest of your QR code generation logic ...
                                    });
                                } else {
                                    transactionRow.querySelector(".qrcode").innerHTML = "<em>Not Applicable</em>";
                                }
                            } else {
                                // Handle non-ok response
                                await Swal.fire({
                                    title: "Error",
                                    text: responseData.message || "Failed to generate IRN",
                                    icon: "error",
                                    confirmButtonText: "OK"
                                });
                            }
                        } catch (error) {
                            console.error("Error generating invoice:", error);
                            // Close loading dialog if it's still open
                            if (loadingSwal) {
                                loadingSwal.close();
                            }
                            
                            await Swal.fire({
                                title: "Error",
                                text: "There was an issue connecting to the server. Please try again later.",
                                icon: "error",
                                confirmButtonText: "OK"
                            });
                        }
                    }
                });
            }
        });
    });

  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    hideLoader();
}

// Add at the start of your file
let cancelledIrnData = [];

// Fetch cancelled IRNs first
fetch('https://backend.bninewdelhi.com/api/getCancelIrn')
    .then(response => response.json())
    .then(data => {
        console.log('[INIT] Stored cancelled IRNs:', data);
        cancelledIrnData = data.map(item => {
            console.log('[DATA] Cancelled IRN:', item.irn);
            return item;
        });
    })
    .catch(error => console.error('[ERROR] Failed to fetch cancelled IRNs:', error));
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

`;

// Append the style to the head of the document
document.head.appendChild(style);

// New calculation for base amount
async function calculateExpenseBaseAmount() {
  try {
    const response = await fetch('https://backend.bninewdelhi.com/api/allexpenses');
    const expenses = await response.json();
    
    let totalAmount = 0;
    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      console.log('💵 Individual Expense Amount:', amount);
      totalAmount += amount;
    });
    
    console.log('💰 Total Sum of Expenses:', totalAmount);
    const calculation = (totalAmount * 18);
    console.log('📊 After multiplying by 18:', calculation);
    const finalAmount = Math.round(calculation / 100);
    console.log('🎯 Final Base Amount:', finalAmount);
    
    // Make sure the element exists
    const baseAmountElement = document.getElementById('total_base_amount');
    if (baseAmountElement) {
      baseAmountElement.textContent = `₹${finalAmount.toLocaleString("en-IN")}`;
      console.log('✅ UI Updated with amount:', `₹${finalAmount.toLocaleString("en-IN")}`);
    } else {
      console.error('❌ Could not find total_base_amount element');
    }
  } catch (error) {
    console.error('❌ Error calculating base amount:', error);
  }
}

// Call the function after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  calculateExpenseBaseAmount();
});