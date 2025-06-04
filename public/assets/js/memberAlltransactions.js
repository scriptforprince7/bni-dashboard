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
      
      // Step 1: Determine member details based on login type
      let member_id;
      let member_email;

      const loginType = getUserLoginType();
      console.log('User login type:', loginType);

      if (loginType === "member") {
          // If the user is a member, get the email from the token
          member_email = getUserEmail();
          console.log('Retrieved member email from token for member login:', member_email);

          // Fetch member details to get member_id
          console.log('Fetching members data from API..');
          const response = await fetch('http://localhost:5000/api/members');
          if (!response.ok) {
              throw new Error('Failed to fetch member details');
          }
          const members = await response.json();
          console.log('Received members data:', members);
          console.log('Searching for member with email:', member_email);

          const member = members.find(m => m.member_email_address === member_email);
          if (member) {
              member_id = member.member_id;
              console.log('✅ Found matching member:', member);
              console.log('Retrieved member_id from API:', member_id);
          } else {
              console.error('❌ No member found matching email:', member_email);
              hideLoader();
              return;
          }
      } else {
          // Otherwise, use the email and ID from localStorage
          member_id = localStorage.getItem('current_member_id');
          member_email = localStorage.getItem('current_member_email');
          console.log('Using member email and ID from localStorage for non-member login:', {
              member_id: member_id,
              member_email: member_email
          });
      }

      if (!member_email || !member_id) {
          console.error('No member email or ID found from any source');
          hideLoader();
          return;
      }

      console.log('member email:', member_email);
      console.log('Filtering orders for member id:', member_id);

      // Fetch orders, transactions, and universal links
      const [ordersResponse, transactionsResponse, universalLinksResponse] = await Promise.all([
          fetch('http://localhost:5000/api/allOrders'),
          fetch('http://localhost:5000/api/allTransactions'),
          fetch('http://localhost:5000/api/universalLinks'),
      ]);

      if (!ordersResponse.ok || !transactionsResponse.ok || !universalLinksResponse.ok) {
          throw new Error('Failed to fetch data from one or more APIs');
      }

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

      // Filter orders and transactions for the logged-in user
      console.log('here starting member id:', member_id);

      const filteredOrders = orders.filter(order => Number(order.customer_id) === Number(member_id));
      // const filteredOrders = orders.filter(order => order.customer_email === member_email);
      console.log('member email:', member_email);
      console.log('Filtering orders for member id:', member_id);
      console.log('Found filtered orders:', filteredOrders.length);

      // Create a map of orders for quick lookup
      const ordersMap = new Map(filteredOrders.map(order => [order.order_id, order]));

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
        const order = ordersMap.get(transaction.order_id);
  
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
          <td><b><em>${paymentType}</em></b></td>
          <td>
            <button class="btn btn-sm btn-primary view-invoice-btn" 
                    data-order-id="${order.order_id}"
                    data-transaction-id="${transaction.cf_payment_id}"
                    data-amount="${transaction.payment_amount}"
                    data-chapter-name="${order.chapter_name || 'N/A'}"
                    data-payment-type="${paymentType}">
              <i class="ti ti-download me-1"></i>Download Invoice
            </button>
          </td>
        `;
        transactionsBody.appendChild(row);
      });

      // Add event listeners for invoice buttons
      document.querySelectorAll('.view-invoice-btn').forEach(button => {
        button.addEventListener('click', async function() {
          const orderId = this.dataset.orderId;
          const transactionId = this.dataset.transactionId;
          const amount = this.dataset.amount;
          const chapterName = this.dataset.chapterName;
          const paymentType = this.dataset.paymentType;

          // Get the full order and transaction data
          const order = ordersMap.get(orderId);
          const transaction = transactions.find(t => t.order_id === orderId);

          // Get the token from localStorage
          const token = localStorage.getItem('token');

          try {
            // First fetch all einvoice data
            const allEinvoiceResponse = await fetch('http://localhost:5000/api/einvoiceData');
            const allEinvoiceData = await allEinvoiceResponse.json();
            
            // Find einvoice data for this specific order
            const einvoiceData = allEinvoiceData.find(e => e.order_id === orderId);

            // Get chapter name from chapters data
            const chapterResponse = await fetch('http://localhost:5000/api/chapters');
            const chaptersData = await chapterResponse.json();
            const chapter = chaptersData.find(c => c.chapter_id === order.chapter_id);
            const chapterName = chapter ? chapter.chapter_name : 'N/A';

            // Get universal link name
            const universalLinkResponse = await fetch('http://localhost:5000/api/universalLinks');
            const universalLinksData = await universalLinkResponse.json();
            const universalLink = universalLinksData.find(ul => ul.id === order.universal_link_id);
            const universalLinkName = 'Not Applicable'; // Always set to Not Applicable as per desired format

            // Structure the data exactly like einvoiceManagement.js
            const invoiceData = {
              orderId: {
                order_id: order.order_id,
                order_amount: order.order_amount,
                order_currency: order.order_currency,
                payment_gateway_id: order.payment_gateway_id,
                customer_id: order.customer_id,
                chapter_id: order.chapter_id,
                region_id: order.region_id,
                universal_link_id: order.universal_link_id,
                ulid: order.ulid,
                order_status: order.order_status,
                payment_session_id: order.payment_session_id,
                created_at: order.created_at,
                updated_at: order.updated_at,
                one_time_registration_fee: order.one_time_registration_fee,
                membership_fee: order.membership_fee,
                tax: order.tax,
                member_name: order.member_name,
                customer_email: order.customer_email,
                customer_phone: order.customer_phone,
                gstin: order.gstin,
                company: order.company,
                mobile_number: order.mobile_number,
                renewal_year: order.renewal_year,
                payment_note: order.payment_note,
                training_id: order.training_id,
                event_id: order.event_id,
                kitty_bill_id: order.kitty_bill_id,
                visitor_id: order.visitor_id,
                visitor_name: order.visitor_name,
                visitor_email: order.visitor_email,
                visitor_mobilenumber: order.visitor_mobilenumber,
                visitor_address: order.visitor_address,
                visitor_company: order.visitor_company,
                visitor_gstin: order.visitor_gstin,
                visitor_business: order.visitor_business,
                visitor_company_address: order.visitor_company_address,
                accolade_id: order.accolade_id
              },
              transactionId: {
                transaction_id: transaction.transaction_id,
                cf_payment_id: transaction.cf_payment_id,
                order_id: transaction.order_id,
                payment_gateway_id: transaction.payment_gateway_id,
                payment_amount: transaction.payment_amount,
                payment_currency: transaction.payment_currency,
                payment_status: transaction.payment_status,
                payment_message: transaction.payment_message,
                payment_time: transaction.payment_time,
                payment_completion_time: transaction.payment_completion_time,
                bank_reference: transaction.bank_reference,
                auth_id: transaction.auth_id,
                payment_method: transaction.payment_method,
                error_details: transaction.error_details,
                auth_details: transaction.auth_details,
                gateway_order_id: transaction.gateway_order_id,
                gateway_payment_id: transaction.gateway_payment_id,
                payment_group: transaction.payment_group
              },
              amount: order.order_amount,
              chapterName: chapterName,
              gatewayName: 'Unknown',
              universalLinkName: universalLinkName
            };

            // Use the einvoice data if it exists, otherwise create a default structure
            const formattedEinvoiceData = einvoiceData ? {
              invoice_id: einvoiceData.invoice_id,
              order_id: orderId,
              transaction_id: transaction.transaction_id.toString(),
              member_id: order.customer_id,
              ack_no: einvoiceData.ack_no,
              ack_dt: einvoiceData.ack_dt,
              irn: einvoiceData.irn,
              qrcode: einvoiceData.qrcode,
              invoice_dt: einvoiceData.invoice_dt
            } : {
              invoice_id: null,
              order_id: orderId,
              transaction_id: transaction.transaction_id.toString(),
              member_id: order.customer_id,
              ack_no: null,
              ack_dt: null,
              irn: null,
              qrcode: null,
              invoice_dt: new Date().toISOString()
            };

            const url = `https://dashboard.bninewdelhi.com/v/einvoice?invoiceData=${encodeURIComponent(JSON.stringify(invoiceData))}&einvoiceData=${encodeURIComponent(JSON.stringify(formattedEinvoiceData))}`;
            
            // Open in new tab
            window.open(url, '_blank');
          } catch (error) {
            console.error('Error fetching data:', error);
            // If fetch fails, use default structure
            const einvoiceData = {
              invoice_id: null,
              order_id: orderId,
              transaction_id: transaction.transaction_id.toString(),
              member_id: order.customer_id,
              ack_no: null,
              ack_dt: null,
              irn: null,
              qrcode: null,
              invoice_dt: new Date().toISOString()
            };

            const invoiceData = {
              orderId: order,
              transactionId: transaction,
              amount: order.order_amount,
              chapterName: 'N/A',
              gatewayName: 'Unknown',
              universalLinkName: 'Not Applicable'
            };

            const url = `https://dashboard.bninewdelhi.com/v/einvoice?invoiceData=${encodeURIComponent(JSON.stringify(invoiceData))}&einvoiceData=${encodeURIComponent(JSON.stringify(einvoiceData))}`;
            
            // Open in new tab
            window.open(url, '_blank');
          }
        });
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

