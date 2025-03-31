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
    console.log('🚀 Starting application...');
    showLoader();
    
    // Get login type and appropriate email/chapter_id
    const loginType = getUserLoginType();
    let chapterEmail, chapterId;

    if (loginType === 'ro_admin') {
        chapterEmail = localStorage.getItem('current_chapter_email');
        chapterId = localStorage.getItem('current_chapter_id');
        console.log('👤 RO Admin accessing chapter:', { chapterEmail, chapterId });
    } else {
        chapterEmail = getUserEmail();
        console.log('👤 Chapter user email:', chapterEmail);
    }

    if (!chapterEmail) {
        console.error('❌ No chapter email found');
        return;
    }

    console.log('📡 Fetching data from APIs...');
    const [
      ordersResponse,
      transactionsResponse,
      chaptersResponse,
      paymentGatewayResponse,
      universalLinksResponse,
      regionsResponse,
      paymentTypeResponse,
      visitorsResponse
    ] = await Promise.all([
      fetch("https://backend.bninewdelhi.com/api/allOrders"),
      fetch("https://backend.bninewdelhi.com/api/allTransactions"),
      fetch("https://backend.bninewdelhi.com/api/chapters"),
      fetch("https://backend.bninewdelhi.com/api/paymentGateway"),
      fetch("https://backend.bninewdelhi.com/api/universalLinks"),
      fetch("https://backend.bninewdelhi.com/api/regions"),
      fetch("https://backend.bninewdelhi.com/api/universalLinks"),
      fetch("https://backend.bninewdelhi.com/api/getallVisitors")
    ]);

    console.log('✅ All API calls completed');

    const orders = await ordersResponse.json();
    const transactions = await transactionsResponse.json();
    const chapters = await chaptersResponse.json();
    const paymentGateways = await paymentGatewayResponse.json();
    const universalLinks = await universalLinksResponse.json();
    const regions = await regionsResponse.json();
    const paymentType = await paymentTypeResponse.json();
    const visitors = await visitorsResponse.json();

    // Find chapter based on login type
    let loggedInChapter;
    if (loginType === 'ro_admin') {
        loggedInChapter = chapters.find(chapter => 
            chapter.chapter_id === parseInt(chapterId) && 
            chapter.email_id === chapterEmail
        );
    } else {
        loggedInChapter = chapters.find(chapter => chapter.email_id === chapterEmail);
    }

    if (!loggedInChapter) {
        console.error('❌ No matching chapter found for:', { chapterEmail, chapterId });
        return;
    }
    console.log('📍 Active chapter:', loggedInChapter);

    // Filter orders for current chapter
    const chapterOrders = orders.filter(order => order.chapter_id === loggedInChapter.chapter_id);
    console.log('📦 Chapter orders:', chapterOrders.length);

    // First filter orders for new member payments (universal_link_id === 1)
    const newMemberOrders = chapterOrders.filter(order => order.universal_link_id === 1);
    console.log('🎯 New Member Orders found:', newMemberOrders.length);

    // Then filter transactions based on these orders and SUCCESS status
    const allNewMemberTransactions = transactions.filter(transaction => {
      return newMemberOrders.some(order => order.order_id === transaction.order_id);
    });

    console.log('💰 Total New Member Transactions:', allNewMemberTransactions.length);

    // Filter for only SUCCESS transactions
    const successfulTransactions = allNewMemberTransactions.filter(transaction => 
      transaction.payment_status === "SUCCESS"
    );

    console.log('✨ Payment Status Breakdown:', {
      successful: successfulTransactions.length,
      others: allNewMemberTransactions.length - successfulTransactions.length,
      successPercentage: ((successfulTransactions.length / allNewMemberTransactions.length) * 100).toFixed(2) + '%'
    });

    // Create maps for quick lookups
    const chapterMap = new Map(chapters.map(chapter => [chapter.chapter_id, chapter.chapter_name]));
    const paymentGatewayMap = new Map(paymentGateways.map(gateway => [gateway.gateway_id, gateway.gateway_name]));
    const universalLinkMap = new Map(universalLinks.map(link => [link.id, link.universal_link_name]));

    console.log('🗺️ Lookup maps created');

    // Get the table body
    const tableBody = document.querySelector(".table tbody");
    if (!tableBody) {
      console.error('❌ Table body not found in DOM');
      return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';
    console.log('🧹 Cleared existing table rows');

    // Sort successful transactions by payment time (latest first)
    successfulTransactions.sort((a, b) => new Date(b.payment_time) - new Date(a.payment_time));
    console.log('📅 Successful transactions sorted by date');

    // Initialize totals (only for successful transactions)
    let totalTransactionAmount = 0;
    let settledPayments = 0;

    // Function to check form completion status
    const getFormStatus = (visitor) => {
      if (!visitor) return 'pending';

      const requiredForms = [
          'visitor_form',
          'eoi_form',
          'new_member_form',
          'interview_sheet',
          'commitment_sheet',
          'inclusion_exclusion_sheet',
          'member_application_form'
      ];

      // Only return 'completed' if ALL forms are true
      return requiredForms.every(form => visitor[form] === true) ? 'completed' : 'pending';
  };

    // Populate table with successful transactions only
    successfulTransactions.forEach((transaction, index) => {
      const order = newMemberOrders.find(o => o.order_id === transaction.order_id);
      if (!order) {
        console.warn(`⚠️ No matching order found for transaction ${transaction.order_id}`);
        return;
      }

      console.log(`📝 Processing successful transaction ${index + 1}/${successfulTransactions.length}:`, {
        orderId: order.order_id,
        amount: transaction.payment_amount,
        memberName: order.member_name
      });

      // Update totals
      const transactionAmount = parseFloat(transaction.payment_amount);
      totalTransactionAmount += transactionAmount;
      settledPayments += transactionAmount;

      // Get chapter name from chapterMap
      const chapterName = chapterMap.get(order?.chapter_id) || "N/A";

      // Get gateway name from paymentGatewayMap using order's gateway_id
      const gatewayName =
        paymentGatewayMap.get(order?.payment_gateway_id) || "Unknown";

      // Get universal link name from universalLinkMap using order's universal_link_id
      const universalLinkName =
        universalLinkMap.get(order?.universal_link_id) || "Not Applicable";

      // Format date and amount
      const formattedDate = new Date(
        transaction.payment_time
      ).toLocaleDateString("en-GB");
      const formattedAmount = `+ ₹${transactionAmount.toLocaleString("en-IN")}`;

      // Find matching visitor
      const visitor = visitors.find(v => v.order_id === order.order_id);
      const formStatus = getFormStatus(visitor);

      // Create a new row for the table
      const row = document.createElement("tr");
      row.classList.add("invoice-list");

      // Determine payment method and image
      let paymentMethod = "N/A";
      let paymentImage = "";
      
      if (transaction.payment_method) {
        console.log('Payment method details:', transaction.payment_method);
        
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

      console.log('Determined payment method:', {
        method: paymentMethod,
        hasImage: !!paymentImage
      });

      // Update how we generate the joining form column in your table row
      const joiningFormColumn = `
        <td class="joining-form-column" data-order-id="${transaction.order_id}">
            <div style="display: grid; grid-template-columns: auto 20px; gap: 5px; align-items: start;">
                <div style="display: flex; flex-direction: column; gap: 9px;">
                    <span onclick="showJoiningFormStatus('completed', '${transaction.order_id}')" 
                          style="color: #0d6efd; text-decoration: underline; font-size: 13px; cursor: pointer;">
                        Completed
                    </span>
                    <span onclick="showJoiningFormStatus('pending', '${transaction.order_id}')" 
                          style="color: #0d6efd; text-decoration: underline; font-size: 13px; cursor: pointer;">
                        Pending
                    </span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                    <i class="ri-checkbox-circle-line" style="color: #ccc; font-size: 16px;"></i>
                    <i class="ri-checkbox-circle-line" style="color: #ccc; font-size: 16px;"></i>
                </div>
            </div>
        </td>
      `;

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
               
                 
               
                
                <td>
                <a href="#" data-transaction-id="${transaction.order_id}" class="btn btn-sm btn-outline-danger btn-wave waves-light track-settlement">Track Settlement</a>
                </td>
                <td class="utr-cell"><em>Not Available</em></td>
                <td class="settlement-time"><em>Not Available</em></td>
                <td class="irn"><em>Not Applicable</em></td>
                <td class="qrcode"><em>Not Applicable</em></td>
                <td class="generate-invoice-btn">Not Applicable</td>
                ${joiningFormColumn}
                <td class="induction-status">
                    ${formStatus === 'completed' ? `
                        <button class="btn btn-sm btn-success btn-wave waves-light induct-member-btn">
                            <i class="ri-checkbox-circle-line me-1"></i>Induct Member
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-secondary btn-wave waves-light" disabled>
                            <i class="ri-time-line me-1"></i>Forms Pending
                        </button>
                    `}
                </td>
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
              button.addAttribute('disabled', 'true');
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
                  if (backendResponse.ok) {
                    // Success response handling
                    Swal.fire("Success", responseData.message, "success");
                  
                    // Fetch IRN and QR code details after successful generation
                    const einvoiceResponse = await fetch(
                      `https://backend.bninewdelhi.com/api/einvoice/${orderId}`
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

    // After the table is populated, check all form statuses
    await checkAllFormStatuses();
  } catch (error) {
    console.error("❌ Error in application:", error);
    toastr.error("Failed to load transaction data");
  } finally {
    console.log('🏁 Application initialization completed');
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

// Add this function outside the row.innerHTML
function showJoiningFormStatus(status, orderId) {
  let title = `<div style="font-size: 28px; font-weight: 600;">${status.charAt(0).toUpperCase() + status.slice(1)}</div>`; 
  
  const formList = `
      <div style="text-align: left; margin-top: 15px;">
          <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <i class="ri-file-list-line" style="margin-right: 8px; color: #0d6efd;"></i>
                      <a href="https://bninewdelhi.com/eoi-form" target="_blank" style="color: inherit; text-decoration: none;">EOI Form</a>
                  </div>
                  <i class="ri-close-circle-line" style="color: #dc3545; font-size: 16px;"></i>
              </li>
              <li style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <i class="ri-file-list-line" style="margin-right: 8px; color: #0d6efd;"></i>
                      <a href="#" onclick="showPDF('/assets/pdf/commitment (1).pdf')" style="color: inherit; text-decoration: none;">Commitment Sheet</a>
                  </div>
                  <i class="ri-close-circle-line" style="color: #dc3545; font-size: 16px;"></i>
              </li>
              <li style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <i class="ri-file-list-line" style="margin-right: 8px; color: #0d6efd;"></i>
                      <a href="https://bninewdelhi.com/member-application" target="_blank" style="color: inherit; text-decoration: none;">Member Application Form</a>
                  </div>
                  <i class="ri-close-circle-line" style="color: #dc3545; font-size: 16px;"></i>
              </li>
              <li style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <i class="ri-file-list-line" style="margin-right: 8px; color: #0d6efd;"></i>
                      <a href="#" onclick="showPDF('/assets/pdf/inesheet.pdf')" style="color: inherit; text-decoration: none;">Inclusion & Exclusion Form</a>
                  </div>
                  <i class="ri-close-circle-line" style="color: #dc3545; font-size: 16px;"></i>
              </li>
              <li style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <i class="ri-file-list-line" style="margin-right: 8px; color: #0d6efd;"></i>
                      <a href="https://bninewdelhi.com/" target="_blank" style="color: inherit; text-decoration: none;">ID Proof</a>
                  </div>
                  <i class="ri-close-circle-line" style="color: #dc3545; font-size: 16px;"></i>
              </li>
              <li style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <i class="ri-file-list-line" style="margin-right: 8px; color: #0d6efd;"></i>
                      <a href="#" onclick="showPDF('/assets/pdf/interview.pdf')" style="color: inherit; text-decoration: none;">Interview Sheet</a>
                  </div>
                  <i class="ri-close-circle-line" style="color: #dc3545; font-size: 16px;"></i>
              </li>
          </ul>
      </div>
  `;

  Swal.fire({
      title: title,
      html: formList,
      showCancelButton: false,
      confirmButtonText: "Close",
      customClass: {
          container: 'custom-swal-container',
          popup: 'custom-swal-popup',
          confirmButton: 'btn btn-primary'
      }
  });
}

// Function to show PDF in modal
function showPDF(pdfPath) {
  event.preventDefault(); // Prevent default link behavior
  
  Swal.fire({
      title: '',
      html: `<iframe src="${pdfPath}" width="100%" height="600px" frameborder="0"></iframe>`,
      width: '80%',
      height: '80%',
      showCloseButton: true,
      showConfirmButton: false,
      backdrop: `rgba(0,0,0,0.4)`,
      customClass: {
          container: 'pdf-modal-container'
      }
  });
}

function updateTransactionCounts() {
  try {
      // Count total transactions
      const tableRows = document.querySelectorAll('.table tbody tr');
      const totalTransactions = tableRows.length;
      console.log('Total number of transactions found:', totalTransactions);
      
      // Update transaction count
      document.getElementById('no_of_transaction').textContent = totalTransactions;

      // Calculate total payment received
      let totalAmount = 0;
      tableRows.forEach((row, index) => {
          // Find the amount cell (td with the formatted amount)
          const amountCell = row.querySelector('td:nth-child(5) b');
          if (amountCell) {
              // Extract amount from format: "+ ₹1,234.56"
              const amountText = amountCell.textContent;
              console.log(`Row ${index + 1} raw amount text:`, amountText);
              
              // Remove "+ ₹" and commas, then parse to float
              const cleanAmount = amountText.replace(/[+₹,\s]/g, '');
              const amount = parseFloat(cleanAmount) || 0;
              
              console.log(`Row ${index + 1} parsed amount:`, amount);
              totalAmount += amount;
          }
      });

      console.log('Total accumulated amount:', totalAmount);

      // Format total amount with Indian number format
      const formattedTotal = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
      }).format(totalAmount);

      console.log('Formatted total amount:', formattedTotal);

      // Update payment received display
      document.getElementById('settled_transaction').textContent = formattedTotal;

  } catch (error) {
      console.error('Error in updateTransactionCounts:', error);
  }
}

// Call after table population
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing counts...');
  updateTransactionCounts();
});

// Observe table changes
const observer = new MutationObserver(() => {
  console.log('Table content changed, updating counts...');
  updateTransactionCounts();
});

// Start observing the table
const tableBody = document.querySelector('.table tbody');
if (tableBody) {
  observer.observe(tableBody, { childList: true, subtree: true });
  console.log('Observer attached to table');
}

// Function to populate dropdowns from table data
const populateDropdownsFromTable = () => {
  console.log('Starting to populate dropdowns from table data');

  // Get all table rows
  const tableRows = document.querySelectorAll('#transactionsTableBody tr:not(#no-transactions-row)');
  console.log('Total rows found:', tableRows.length);

  // Initialize Sets for unique values
  const chapters = new Set();
  const months = new Set();
  const methods = new Set();

  // Extract values from table
  tableRows.forEach((row, index) => {
      // Get chapter name from <b><em> tags
      const chapterElement = row.querySelector('td:nth-child(4) b em');
      if (chapterElement) {
          const chapterName = chapterElement.textContent.trim();
          if (chapterName && chapterName !== 'N/A') {
              chapters.add(chapterName);
              console.log(`Row ${index + 1} - Found chapter:`, chapterName);
          }
      }

      // Get date and format to month-year
      const dateCell = row.querySelector('td:nth-child(2)');
      if (dateCell) {
          const date = new Date(dateCell.textContent.trim());
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          months.add(monthYear);
          console.log(`Row ${index + 1} - Found month:`, monthYear);
      }

      // Get payment method (after the image)
      const methodCell = row.querySelector('td:nth-child(6)');
      if (methodCell) {
          const methodText = methodCell.textContent.trim().split(' ').slice(1).join(' ');
          if (methodText && methodText !== 'N/A') {
              methods.add(methodText);
              console.log(`Row ${index + 1} - Found method:`, methodText);
          }
      }
  });

  // Populate Chapter Dropdown
  const chapterDropdown = document.getElementById('chapter-filter');
  chapterDropdown.innerHTML = '<li><a class="dropdown-item" href="javascript:void(0);" data-value="">All Chapters</a></li>';
  [...chapters].sort().forEach(chapter => {
      chapterDropdown.innerHTML += `
          <li><a class="dropdown-item" href="javascript:void(0);" data-value="${chapter}">${chapter}</a></li>
      `;
  });

  // Populate Month Dropdown
  const monthDropdown = document.getElementById('month-filter');
  monthDropdown.innerHTML = '<li><a class="dropdown-item" href="javascript:void(0);" data-value="">All Months</a></li>';
  [...months].sort().forEach(month => {
      monthDropdown.innerHTML += `
          <li><a class="dropdown-item" href="javascript:void(0);" data-value="${month}">${month}</a></li>
      `;
  });

  // Populate Payment Method Dropdown
  const methodDropdown = document.getElementById('payment-method-filter');
  methodDropdown.innerHTML = '<li><a class="dropdown-item" href="javascript:void(0);" data-value="">All Methods</a></li>';
  [...methods].sort().forEach(method => {
      methodDropdown.innerHTML += `
          <li><a class="dropdown-item" href="javascript:void(0);" data-value="${method}">${method}</a></li>
      `;
  });

  // Add click handlers for dropdown items
  document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
          item.addEventListener('click', (e) => {
              const dropdownToggle = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
              
              // Remove active class from all items in this dropdown
              dropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
              
              // Add active class to clicked item
              e.target.classList.add('active');
              
              // Update dropdown button text with icon
              if (dropdownToggle) {
                  dropdownToggle.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${e.target.textContent}`;
              }
              
              console.log(`Selected ${dropdown.id}:`, e.target.getAttribute('data-value'));
          });
      });
  });

  console.log('Dropdowns populated with values:', {
      chapters: [...chapters],
      months: [...months],
      methods: [...methods]
  });
};

// Call the function after table is populated
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
      populateDropdownsFromTable();
  }, 1000); // Small delay to ensure table is loaded
});

// Add event listener for all Induct Member buttons
document.addEventListener('click', function(event) {
  if (event.target.closest('.induct-member-btn')) {
      const button = event.target.closest('.induct-member-btn');
      const row = button.closest('tr');
      const memberName = row.querySelector('td:nth-child(3)').textContent.trim();

      Swal.fire({
          title: 'Confirm Induction',
          text: `Are you sure you want to induct ${memberName}?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Induct',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#28a745',
          cancelButtonColor: '#dc3545'
      }).then((result) => {
          if (result.isConfirmed) {
              // Show success message
              Swal.fire({
                  title: 'Success!',
                  text: `${memberName} has been inducted successfully!`,
                  icon: 'success',
                  confirmButtonColor: '#28a745'
              }).then(() => {
                  // Update button state after successful induction
                  button.innerHTML = '<i class="ri-checkbox-circle-line me-1"></i>Inducted';
                  button.disabled = true;
                  button.classList.remove('btn-success');
                  button.classList.add('btn-secondary');
              });
          }
      });
  }
});

// First, add our form status functions at the top
async function checkVisitorFormStatus(orderId) {
    console.log('🔍 Checking form status for order:', orderId);
    
    try {
        // First get the order details
        const orderResponse = await fetch("https://backend.bninewdelhi.com/api/allOrders");
        const orders = await orderResponse.json();
        
        console.log('📦 Found orders:', orders.length);
        
        // Find the specific order
        const order = orders.find(o => o.order_id === orderId);
        if (!order) {
            console.log('❌ No order found for ID:', orderId);
            return null;
        }
        
        console.log('📄 Order details:', order);
        
        // Check if it's a new member payment
        if (order.payment_note !== "New Member Payment") {
            console.log('⚠️ Not a new member payment');
            return null;
        }

        // Get visitor details
        const visitorsResponse = await fetch("https://backend.bninewdelhi.com/api/getallvisitors");
        const visitors = await visitorsResponse.json();
        
        console.log('👥 Total visitors:', visitors.length);
        
        let visitor;
        if (order.visitor_id) {
            visitor = visitors.find(v => v.visitor_id === order.visitor_id);
            console.log('🎯 Found visitor by visitor_id:', order.visitor_id);
        } else {
            visitor = visitors.find(v => v.order_id === orderId);
            console.log('🎯 Found visitor by order_id:', orderId);
        }

        if (!visitor) {
            console.log('❌ No visitor found');
            return null;
        }

        console.log('📋 Visitor form status:', visitor);

        return {
            isComplete: visitor.visitor_form && 
                       visitor.eoi_form && 
                       visitor.new_member_form && 
                       visitor.interview_sheet && 
                       visitor.commitment_sheet && 
                       visitor.inclusion_exclusion_sheet && 
                       visitor.member_application_form,
            forms: {
                visitor_form: visitor.visitor_form,
                eoi_form: visitor.eoi_form,
                new_member_form: visitor.new_member_form,
                interview_sheet: visitor.interview_sheet,
                commitment_sheet: visitor.commitment_sheet,
                inclusion_exclusion_sheet: visitor.inclusion_exclusion_sheet,
                member_application_form: visitor.member_application_form
            }
        };
    } catch (error) {
        console.error('❌ Error checking visitor status:', error);
        return null;
    }
}

// Add this function to check all form statuses
async function checkAllFormStatuses() {
    console.log('🔄 Checking all form statuses on page load...');
    
    const rows = document.querySelectorAll('[data-order-id]');
    console.log(`📋 Found ${rows.length} rows to check`);

    for (const row of rows) {
        const orderId = row.getAttribute('data-order-id');
        console.log(`🔍 Checking status for order: ${orderId}`);
        
        try {
            const formStatus = await checkVisitorFormStatus(orderId);
            const inductionCell = row.closest('tr').querySelector('.induction-status');
            
            if (inductionCell) {
                if (formStatus?.isComplete) {
                    console.log(`✅ All forms complete for order: ${orderId}`);
                    inductionCell.innerHTML = `
                        <button class="btn btn-sm btn-success btn-wave waves-light induct-member-btn">
                            <i class="ri-checkbox-circle-line me-1"></i>Induct Member
                        </button>
                    `;
                } else {
                    console.log(`⏳ Forms pending for order: ${orderId}`);
                    inductionCell.innerHTML = `
                        <button class="btn btn-sm btn-secondary btn-wave waves-light" disabled>
                            <i class="ri-time-line me-1"></i>Forms Pending
                        </button>
                    `;
                }
            }
        } catch (error) {
            console.error(`❌ Error checking status for order ${orderId}:`, error);
        }
    }
    console.log('✨ Finished checking all form statuses');
}

// Keep the original showJoiningFormStatus function exactly as it was
async function showJoiningFormStatus(status, orderId) {
    console.log('📊 Showing form status:', status, 'for order:', orderId);
    
    const formStatus = await checkVisitorFormStatus(orderId);
    console.log('📋 Form status result:', formStatus);

    let formList = `
        <div style="text-align: left; margin-top: 15px;">
            <ul style="list-style: none; padding: 0;">
    `;

    if (formStatus) {
        const forms = [
            { name: 'EOI Form', key: 'eoi_form', link: 'https://bninewdelhi.com/eoi-form' },
            { name: 'Commitment Sheet', key: 'commitment_sheet', link: '#', onclick: "showPDF('/assets/pdf/commitment (1).pdf')" },
            { name: 'Member Application Form', key: 'member_application_form', link: 'https://bninewdelhi.com/member-application' },
            { name: 'Inclusion & Exclusion Form', key: 'inclusion_exclusion_sheet', link: '#', onclick: "showPDF('/assets/pdf/inesheet.pdf')" },
            { name: 'Interview Sheet', key: 'interview_sheet', link: '#', onclick: "showPDF('/assets/pdf/interview.pdf')" },
            { name: 'Visitor Form', key: 'visitor_form', link: '#' }
        ];

        const completedForms = forms.filter(form => formStatus.forms[form.key]).length;
        const totalForms = forms.length;

        formList += `
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <strong>Progress:</strong> ${completedForms}/${totalForms} forms completed
                <div class="progress" style="height: 10px; margin-top: 8px;">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${(completedForms/totalForms)*100}%">
                    </div>
                </div>
            </div>
        `;

        forms.forEach(form => {
            const isComplete = formStatus.forms[form.key];
            const icon = isComplete ? 'ri-checkbox-circle-line' : 'ri-close-circle-line';
            const color = isComplete ? '#28a745' : '#dc3545';
            const opacity = isComplete ? '1' : '0.7';
            
            formList += `
                <li style="margin: 10px 0; padding: 8px; border-radius: 4px; background: #f8f9fa; 
                          display: flex; justify-content: space-between; align-items: center; opacity: ${opacity};">
                    <div>
                        <i class="ri-file-list-line" style="margin-right: 8px; color: #0d6efd;"></i>
                        <a href="${form.link}" ${form.onclick ? `onclick="${form.onclick}"` : 'target="_blank"'} 
                           style="color: inherit; text-decoration: none;">
                            ${form.name}
                        </a>
                    </div>
                    <i class="${icon}" style="color: ${color}; font-size: 16px;"></i>
                </li>
            `;
        });
    }

    formList += `</ul></div>`;

    // Show the SweetAlert
    Swal.fire({
        title: `<div style="font-size: 28px; font-weight: 600;">
            Form Status
            ${formStatus?.isComplete ? 
                '<i class="ri-checkbox-circle-line" style="color: #28a745; margin-left: 10px;"></i>' : 
                '<i class="ri-time-line" style="color: #dc3545; margin-left: 10px;"></i>'}
        </div>`,
        html: formList,
        showCancelButton: false,
        confirmButtonText: "Close",
        customClass: {
            container: 'custom-swal-container',
            popup: 'custom-swal-popup',
            confirmButton: 'btn btn-primary'
        }
    });

    // Update the induction status button
    const row = document.querySelector(`[data-order-id="${orderId}"]`).closest('tr');
    const inductionCell = row.querySelector('.induction-status');
    if (inductionCell) {
        if (formStatus?.isComplete) {
            inductionCell.innerHTML = `
                <button class="btn btn-sm btn-success btn-wave waves-light induct-member-btn">
                    <i class="ri-checkbox-circle-line me-1"></i>Induct Member
                </button>
            `;
        } else {
            inductionCell.innerHTML = `
                <button class="btn btn-sm btn-secondary btn-wave waves-light" disabled>
                    <i class="ri-time-line me-1"></i>Forms Pending
                </button>
            `;
        }
    }
}

// Make functions available globally
window.checkVisitorFormStatus = checkVisitorFormStatus;
window.showJoiningFormStatus = showJoiningFormStatus;