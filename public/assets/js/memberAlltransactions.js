// Function to show the loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex'; // Show loader
}

// Function to hide the loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none'; // Hide loader
}

const monthsDropdown = document.getElementById("month-filter");
const paymentStatusDropdown = document.getElementById("payment-status-filter");
const paymentTypeDropdown = document.getElementById("payment-type-filter");
const paymentMethodDropdown = document.getElementById("payment-method-filter");

// Add this after your existing variable declarations
const searchInput = document.getElementById('searchChapterInput');
console.log('Search input initialized:', searchInput);

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

(async function fetchTransactions() {
  try {
      showLoader();
      
      // Step 1: Try getting member details from multiple sources
      let member_id = localStorage.getItem('current_member_id');
      let member_email = localStorage.getItem('current_member_email');
      
      console.log('=== Starting Member All Transactions ===');
      console.log('Initial check from localStorage:', {
          member_id: member_id,
          member_email: member_email
      });

      // If not in localStorage, try getting from token
      if (!member_email) {
          member_email = getUserEmail();
          console.log('Retrieved from token:', {
              member_email: member_email
          });
      }

      if (!member_email) {
          console.error('No member email found from any source');
          hideLoader();
          return;
      }

      // Fetch orders, transactions, and universal links
      const [ordersResponse, transactionsResponse, universalLinksResponse] = await Promise.all([
          fetch('https://bni-data-backend.onrender.com/api/allOrders'),
          fetch('https://bni-data-backend.onrender.com/api/allTransactions'),
          fetch('https://bni-data-backend.onrender.com/api/universalLinks'),
      ]);

      const orders = await ordersResponse.json();
      const transactions = await transactionsResponse.json();
      const universalLinks = await universalLinksResponse.json();

      populateDropdown(paymentTypeDropdown, universalLinks, "id", "universal_link_name", "Select Payment Type");


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
  const month = monthsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentStatus = paymentStatusDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentType = paymentTypeDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '';
  const paymentMethod = (paymentMethodDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value') || '').toLowerCase();


  // Construct the query string
  const queryParams = new URLSearchParams();

  if (month) queryParams.append('month', month);
  if (paymentStatus) queryParams.append('payment_status', paymentStatus);
  if (paymentType) queryParams.append('payment_type', paymentType);
  if (paymentMethod) queryParams.append('payment_method', paymentMethod);

  // Redirect to the filtered URL
  const filterUrl = `/m/member-allTransactions?${queryParams.toString()}`;
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

checkFiltersAndToggleResetButton();

      // Create a mapping of universal link IDs to names
      const universalLinkMap = universalLinks.reduce((map, link) => {
        map[link.id] = link.universal_link_name;
        return map;
      }, {});

      console.log('member email:', member_email);
      console.log('Filtering orders for member id:', member_id);
      // Filter orders and transactions for the logged-in user
      // const filteredOrders = orders.filter(order => order.customer_id === member_id);
      const filteredOrders = orders.filter(order => order.customer_email === member_email);

      console.log('Found filtered orders:', filteredOrders.length);

      // Get URL parameters for filtering
      const urlParams = new URLSearchParams(window.location.search);
      const selectedPaymentType = urlParams.get('payment_type');
      const selectedMonth = urlParams.get('month');
      const selectedPaymentStatus = urlParams.get('payment_status');
      const selectedPaymentMethod = urlParams.get('payment_method');

      // Filter transactions based on URL parameters
      let filteredTransactions = transactions.filter(transaction => {
        const order = orders.find(order => order.order_id === transaction.order_id);
        
        // Check if transaction matches all selected filters
        const matchesPaymentType = !selectedPaymentType || (order && order.universal_link_id.toString() === selectedPaymentType);
        
        // Month filter - check payment_time
        const transactionMonth = new Date(transaction.payment_time).getMonth() + 1; // Adding 1 because getMonth() returns 0-11
        const matchesMonth = !selectedMonth || transactionMonth.toString() === selectedMonth;
        
        // Payment status filter
        const matchesStatus = !selectedPaymentStatus || 
          transaction.payment_status.toUpperCase() === selectedPaymentStatus.toUpperCase();
        
        // Payment method filter
        const matchesMethod = !selectedPaymentMethod || 
          transaction.payment_group.toLowerCase() === selectedPaymentMethod.toLowerCase();

        // Return true only if all active filters match
        return matchesPaymentType && matchesMonth && matchesStatus && matchesMethod;
      }).filter(transaction =>
        filteredOrders.some(order => order.order_id === transaction.order_id)
      );

       // Calculate totals
    const totalAmount = filteredTransactions.reduce(
        (sum, transaction) => sum + parseFloat(transaction.payment_amount || 0),
        0
      );
  
      // Calculate total amount for successful payments
      const successPaymentsAmount = filteredTransactions
        .filter(transaction => transaction.payment_status === "SUCCESS")
        .reduce((sum, transaction) => sum + parseFloat(transaction.payment_amount || 0), 0);
  
        const pendingPaymentsAmount = filteredTransactions
        .filter(transaction => transaction.payment_status !== "SUCCESS")
        .reduce((sum, transaction) => sum + parseFloat(transaction.payment_amount || 0), 0);
  
      // Update the spans with calculated values
      document.getElementById('total_transactions_amount').textContent = `₹${totalAmount.toFixed(2)}`;
      localStorage.setItem('totalTransactionsAmount', totalAmount.toFixed(2)); // Save total amount in local storage
      document.getElementById('success_payments').textContent = `₹${successPaymentsAmount.toFixed(2)}`;
      document.getElementById('pending_payments').textContent = `₹${pendingPaymentsAmount.toFixed(2)}`;
  
      // Populate the transactions table
      const transactionsBody = document.querySelector('.member-all-transactions');
      transactionsBody.innerHTML = ''; // Clear existing rows
  
      filteredTransactions.forEach((transaction, index) => {
        const order = filteredOrders.find(order => order.order_id === transaction.order_id);
  
        // Determine payment method and its corresponding icon
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
  
        // Get the universal link name using the mapping
        const paymentType = universalLinkMap[order.universal_link_id] || "Unknown";
  
        // Create a new row for each transaction
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${new Date(transaction.payment_time).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</td>
          <td><b>+₹${parseFloat(transaction.payment_amount).toFixed(2)}</b><br><a href="/minv/view-memberInvoice?order_id=${
            transaction.order_id
          }" class="fw-medium text-success">View</a></td>
          <td>${paymentImage} ${paymentMethod}</td>
          <td><em>${order.order_id}</em></td>
          <td><b><em>${transaction.cf_payment_id}</em></b></td>
          <td><span class="badge ${
            transaction.payment_status === "SUCCESS"
              ? "bg-success"
              : "bg-danger"
          }">${transaction.payment_status.toLowerCase()}</span></td>
          <td><b><em>${paymentType}</em></b</td>
        `;
        transactionsBody.appendChild(row);
      });

      // Add search event listener
      searchInput.addEventListener('input', function(e) {
          const searchTerm = e.target.value.toLowerCase().trim();
          console.log('Searching for:', searchTerm);

          // Get all current table rows
          const tableRows = document.querySelectorAll('.member-all-transactions tr');
          console.log('Total rows to search:', tableRows.length);

          tableRows.forEach(row => {
              // Get the three searchable fields from the row
              const orderId = row.querySelector('td:nth-child(5)')?.textContent || '';
              const transactionId = row.querySelector('td:nth-child(6)')?.textContent || '';
              const paymentType = row.querySelector('td:nth-child(8)')?.textContent || '';

              console.log('Checking row:', {
                  orderId,
                  transactionId,
                  paymentType
              });

              // Check if any field matches the search term
              const matches = 
                  orderId.toLowerCase().includes(searchTerm) ||
                  transactionId.toLowerCase().includes(searchTerm) ||
                  paymentType.toLowerCase().includes(searchTerm);

              // Show/hide row based on match
              row.style.display = matches ? '' : 'none';

              console.log(`Row ${orderId}: ${matches ? 'matches' : 'does not match'}`);
          });
      });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    alert('An error occurred while fetching transactions.');
  } finally {
    hideLoader();
  }
})();
