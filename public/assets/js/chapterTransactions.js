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
        
        // Get login type first
        const loginType = getUserLoginType();
        console.log('👤 User Login Type:', loginType);

        // Get the appropriate email based on login type
        let userEmail;
        if (loginType === 'ro_admin') {
            userEmail = localStorage.getItem('current_chapter_email');
            console.log('🔍 RO Admin accessing chapter email:', userEmail);
        } else {
            userEmail = getUserEmail();
            console.log('🔍 Chapter User Email:', userEmail);
        }

        if (!userEmail) {
            console.error('❌ No valid email found');
            hideLoader();
            return;
        }

        // First fetch chapters to get chapter_id
        console.log('📊 Fetching chapters data...');
        const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
        const chapters = await chaptersResponse.json();
        
        // Find matching chapter based on email
        const matchingChapter = chapters.find(chapter => chapter.email_id === userEmail);
        if (!matchingChapter) {
            console.error('❌ No matching chapter found for email:', userEmail);
            hideLoader();
            return;
        }
        
        const chapterId = matchingChapter.chapter_id;
        console.log('✅ Found matching chapter:', {
            chapter_name: matchingChapter.chapter_name,
            chapter_id: chapterId
        });

        // Fetch all required data in parallel
        const [ordersResponse, transactionsResponse, universalLinksResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/allOrders'),
            fetch('https://backend.bninewdelhi.com/api/allTransactions'),
            fetch('https://backend.bninewdelhi.com/api/universalLinks')
        ]);

        const orders = await ordersResponse.json();
        const transactions = await transactionsResponse.json();
        const universalLinks = await universalLinksResponse.json();

        // Filter orders by chapter_id
        const chapterOrders = orders.filter(order => order.chapter_id === chapterId);
        console.log(`📦 Found ${chapterOrders.length} orders for chapter ID ${chapterId}`);

        // Get order IDs for this chapter
        const chapterOrderIds = chapterOrders.map(order => order.order_id);
        console.log('🔑 Order IDs for this chapter:', chapterOrderIds);

        // Filter transactions
        const filteredTransactions = transactions.filter(transaction => 
            chapterOrderIds.includes(transaction.order_id)
        );

        console.log(`💰 Found ${filteredTransactions.length} transactions for this chapter`);

        // Update the transactions table
        const transactionsBody = document.querySelector('.member-all-transactions');
        if (!transactionsBody) {
            console.error('❌ Could not find transactions table body');
            return;
        }

        transactionsBody.innerHTML = ''; // Clear existing rows

        // Populate table with filtered transactions
        filteredTransactions.forEach((transaction, index) => {
            const order = chapterOrders.find(order => order.order_id === transaction.order_id);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${new Date(transaction.payment_time).toLocaleDateString('en-IN')}</td>
                <td><b>+₹${parseFloat(transaction.payment_amount).toFixed(2)}</b><br>
                    <a href="/minv/view-memberInvoice?order_id=${transaction.order_id}" 
                       class="fw-medium text-success">View</a></td>
                <td>${getPaymentMethodDisplay(transaction.payment_method)}</td>
                <td><em>${transaction.order_id}</em></td>
                <td><b><em>${transaction.cf_payment_id}</em></b></td>
                <td><span class="badge ${
                    transaction.payment_status === "SUCCESS" ? "bg-success" : "bg-danger"
                }">${transaction.payment_status.toLowerCase()}</span></td>
                <td><b><em>${getDisplayName(order)}</em></b></td>
                <td><b><em>${order ? order.payment_note : 'Unknown'}</em></b></td>
            `;
            
            transactionsBody.appendChild(row);
        });

        // Calculate and update totals
        const totalAmount = filteredTransactions.reduce(
            (sum, transaction) => sum + parseFloat(transaction.payment_amount || 0),
            0
        );

        const successPaymentsAmount = filteredTransactions
            .filter(transaction => transaction.payment_status === "SUCCESS")
            .reduce((sum, transaction) => sum + parseFloat(transaction.payment_amount || 0), 0);

        const pendingPaymentsAmount = filteredTransactions
            .filter(transaction => transaction.payment_status !== "SUCCESS")
            .reduce((sum, transaction) => sum + parseFloat(transaction.payment_amount || 0), 0);

        // Update the totals display
        document.getElementById('total_transactions_amount').textContent = `₹${totalAmount.toFixed(2)}`;
        document.getElementById('success_payments').textContent = `₹${successPaymentsAmount.toFixed(2)}`;
        document.getElementById('pending_payments').textContent = `₹${pendingPaymentsAmount.toFixed(2)}`;

    } catch (error) {
        console.error('❌ Error:', error);
        alert('An error occurred while fetching transactions.');
    } finally {
        hideLoader();
    }
})();

// Helper function for payment method display
function getPaymentMethodDisplay(paymentMethod) {
    if (!paymentMethod) return "N/A";
    
    if (paymentMethod.upi) {
        return '<img src="https://economictimes.indiatimes.com/thumb/msid-74960608,width-1200,height-900,resizemode-4,imgsize-49172/upi-twitter.jpg?from=mdr" alt="UPI" width="30" height="30"> UPI';
    } else if (paymentMethod.card) {
        return '<img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" alt="Card" width="20" height="20"> Card';
    } else if (paymentMethod.netbanking) {
        return '<img src="https://cdn.prod.website-files.com/64199d190fc7afa82666d89c/648b63af41676287e601542d_regular-bank-transfer.png" alt="Net Banking" width="20" height="20"> Net Banking';
    } else if (paymentMethod.wallet) {
        return '<img src="https://ibsintelligence.com/wp-content/uploads/2024/01/digital-wallet-application-mobile-internet-banking-online-payment-security-via-credit-card_228260-825.jpg" alt="Wallet" width="20" height="20"> Wallet';
    }
    return "Other";
}

// Helper function to get the correct name based on payment note
const getDisplayName = (order) => {
  if (order?.payment_note === 'visitor-payment') {
    return order.visitor_name || 'Unknown Visitor';
  }
  return order?.member_name || 'Unknown';
};
  