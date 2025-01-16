document.addEventListener("DOMContentLoaded", async () => {

    const regionsDropdown = document.getElementById("region-filter");
    const chaptersDropdown = document.getElementById("chapter-filter");
    const monthsDropdown = document.getElementById("month-filter");
    const paymentStatusDropdown = document.getElementById("payment-status-filter");
    const paymentTypeDropdown = document.getElementById("payment-type-filter");
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
        fetch("https://bni-data-backend.onrender.com/api/allOrders"),
        fetch("https://bni-data-backend.onrender.com/api/allTransactions"),
        fetch("https://bni-data-backend.onrender.com/api/chapters"),
        fetch("https://bni-data-backend.onrender.com/api/paymentGateway"),
        fetch("https://bni-data-backend.onrender.com/api/universalLinks"),
        fetch("https://bni-data-backend.onrender.com/api/regions"),
        fetch("https://bni-data-backend.onrender.com/api/universalLinks"),
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
    const paymentType = paymentTypeDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
    const paymentGateway = paymentGatewayDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
    const paymentMethod = (paymentMethodDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '').toLowerCase();
  
  
    // Construct the query string
    const queryParams = new URLSearchParams();
  
    if (regionId) queryParams.append('region_id', regionId);
    if (chapterId) queryParams.append('chapter_id', chapterId);
    if (month) queryParams.append('month', month);
    if (paymentStatus) queryParams.append('payment_status', paymentStatus);
    if (paymentType) queryParams.append('payment_type', paymentType);
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
    payment_type: urlParams.get("payment_type"),
    payment_gateway: urlParams.get("payment_gateway"),
    payment_method: urlParams.get("payment_method"),
  };
  
  // Show filters in the console for debugging
  console.log(filters);
  
  
  // Filter transactions based on the region_id
  const filteredTransactions = transactions.filter((transaction) => {
    let isValid = true;
  
    console.log("Checking transaction for region:", transaction.order_id);
  
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
      const tableBody = document.querySelector(".table tbody");
  
      filteredTransactions.forEach((transaction, index) => {
        console.log("Transaction in filtered list:", transaction);
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
        totalTransactionAmount += transactionAmount;
  
        // Check payment status and update settled or pending totals
        if (transaction.payment_status === "SUCCESS") {
          settledPayments += transactionAmount;
        } else if (transaction.payment_status === "PENDING") {
          pendingPayments += transactionAmount;
        }
  
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
        const formattedDate = new Date(
          transaction.payment_time
        ).toLocaleDateString("en-GB");
        const formattedAmount = `+ ₹${transactionAmount.toLocaleString("en-IN")}`;
  
        // Create a new row for the table
        const row = document.createElement("tr");
        row.classList.add("invoice-list");
  
        const invoiceButton =
          transaction.payment_status === "SUCCESS"
            ? `<a href="#" data-order-id="${order.order_id}" class="btn btn-sm btn-success btn-wave waves-light generate-invoice">Generate E-Invoice</a>`
            : `<em>Not Applicable</em>`;
  
        row.innerHTML = `
                  <td>${index + 1}</td>
                  <td>${formattedDate}</td>
                  <td><img src="https://www.kindpng.com/picc/m/78-786207_user-avatar-png-user-avatar-icon-png-transparent.png" alt="Card" width="20" height="20">${
                    order?.member_name || "Unknown"
                  }</td>
                  <td><b><em>${chapterName}</em></b></td>
                  <td><b>${formattedAmount}</b><br><a href="/t/view-invoice?order_id=${
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
                  <td class="irn"><em>Not Applicable</em></td>
                  <td class="qrcode"><em>Not Applicable</em></td>
                  <td class="generate-invoice-btn">${invoiceButton}</td>
              `;
  
        tableBody.appendChild(row);
  
        // Fetch IRN and QR code details for each order from the einvoice table
        if (transaction.payment_status === 'SUCCESS') {
          showLoader();
          fetch(`https://bni-data-backend.onrender.com/api/einvoice/${order.order_id}`)
              .then(response => response.json())
              .then(einvoiceData => {
                  const irnCell = row.querySelector(".irn");
                  const qrcodeCell = row.querySelector(".qrcode");
                  const btnCell = row.querySelector(".generate-invoice-btn");
                  const qrCodeKey = `qrCode_${order.order_id}`; // Unique key for each order
                  const orderId = order.order_id;
                  const orderr = orders.find((o) => o.order_id === orderId);
                  const transaction = transactions.find((t) => t.order_id === orderId);
                  const chapterName = chapterMap.get(order?.chapter_id) || "N/A";
                  const gatewayName = paymentGatewayMap.get(order?.payment_gateway_id) || "Unknown";
                  const universalLinkName = universalLinkMap.get(order?.universal_link_id) || "Not Applicable";
  
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
                    
                      // Check if QR code is already stored in localStorage for this order
                      if (localStorage.getItem(qrCodeKey)) {
                        // If QR code is stored, show the QR code image
                        transactionRow.querySelector(".qrcode").innerHTML = `<img src="${localStorage.getItem(qrCodeKey)}" alt="QR Code" width="30" height="30">`;
                      } else if (einvoiceData.qrcode) {
                        // If QR code is available but not yet stored, show the button
                        const encodedInvoiceData = encodeURIComponent(JSON.stringify(invoiceData));
                        const encodedEinvoiceData = encodeURIComponent(JSON.stringify(einvoiceData));
                        transactionRow.querySelector(".qrcode").innerHTML = `<span class="generate-qr-btn">Generate QR Code</span>`;
                        transactionRow.querySelector(".generate-invoice-btn").innerHTML = `<a href="/v/einvoice?invoiceData=${encodedInvoiceData}&einvoiceData=${encodedEinvoiceData}" class="btn btn-sm btn-link">View E-Invoice</a>`;
                    
                        // Add event listener to the button to display loading and then the QR code
                        transactionRow.querySelector(".generate-qr-btn").addEventListener("click", () => {
                          // Show "Loading..." message
                          transactionRow.querySelector(".qrcode").innerHTML = "<em>Loading...</em>";
                    
                          // Simulate loading for 3-4 seconds
                          setTimeout(() => {
                            // Generate the QR code using the qrcode.js library
                            const qrCodeData = einvoiceData.qrcode;
                  
                            // Generate the QR code and set it as an image
                            QRCode.toDataURL(qrCodeData, { width: 100, height: 100 }, (err, url) => {
                              if (err) {
                                console.error('Error generating QR Code:', err);
                                transactionRow.querySelector(".qrcode").innerHTML = "<em>Error generating QR Code</em>";
                              } else {
                                // Store the generated QR code URL in localStorage
                                localStorage.setItem(qrCodeKey, url);
                  
                                // Display the generated QR code
                                transactionRow.querySelector(".qrcode").innerHTML = `<img src="${url}" alt="QR Code" width="100" height="100">`;
                              }
                            });
                          }, 3000); // Delay for 3 seconds
                        });
                      } else {
                        transactionRow.querySelector(".qrcode").innerHTML = "<em>Not Applicable</em>";
                      }
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
  
  `;
  
  // Append the style to the head of the document
  document.head.appendChild(style);