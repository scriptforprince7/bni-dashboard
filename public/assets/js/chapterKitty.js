// Add these variables at the top of your code to store filter selections
let selectedGateway = null;
let selectedMonth = null;
let selectedPgStatus = null;
let selectedMethod = null;
let total_pending_expense = 0;
let total_paid_expense = 0;
let pendingAmount = 0;
let visitorAmountTotal = 0;
let otherPaymentsTotal = 0;

// Function to populate Gateway filter dropdown
async function populateGatewayFilter() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/paymentGateway"
    );
    const gateways = await response.json();

    const gatewayFilter = document.getElementById("payment-gateway-filter");
    gatewayFilter.innerHTML = ""; // Clear existing options

    gateways.forEach((gateway) => {
      const li = document.createElement("li");
      const gatewayName = getGatewayName(gateway.gateway_id);
      li.innerHTML = `
                <a class="dropdown-item" href="javascript:void(0);" data-gateway-name="${gatewayName}">
                    ${gatewayName}
                </a>
            `;
      gatewayFilter.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching payment gateways:", error);
  }
}

// Function to populate Month filter dropdown
function populateMonthFilter() {
  const months = [
    { number: "01", name: "January" },
    { number: "02", name: "February" },
    { number: "03", name: "March" },
    { number: "04", name: "April" },
    { number: "05", name: "May" },
    { number: "06", name: "June" },
    { number: "07", name: "July" },
    { number: "08", name: "August" },
    { number: "09", name: "September" },
    { number: "10", name: "October" },
    { number: "11", name: "November" },
    { number: "12", name: "December" },
  ];

  const monthFilter = document.getElementById("month-filter");
  monthFilter.innerHTML = ""; // Clear existing options

  months.forEach((month) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-month-number="${month.number}">
                ${month.name}
            </a>
        `;
    monthFilter.appendChild(li);
  });

  // Add click event listener for month filter items
  monthFilter.addEventListener("click", function (e) {
    if (e.target.classList.contains("dropdown-item")) {
      selectedMonth = e.target.dataset.monthNumber;
      console.log("Selected Month:", selectedMonth); // Debug log

      // Update dropdown button text
      const dropdownButton = e.target
        .closest(".dropdown")
        .querySelector(".dropdown-toggle");
      dropdownButton.textContent = e.target.textContent;
    }
  });
}

// Function to populate PG Status filter dropdown
function populatePgStatusFilter() {
  const statuses = ["SUCCESS", "PENDING", "NOT_ATTEMPTED"];
  const statusFilter = document.getElementById("payment-status-filter");
  statusFilter.innerHTML = ""; // Clear existing options

  statuses.forEach((status) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-status="${status}">
                ${status}
            </a>
        `;
    statusFilter.appendChild(li);
  });
}

// Function to populate Payment Method filter dropdown
function populateMethodFilter() {
  const methods = ["upi", "netbanking"];
  const methodFilter = document.getElementById("payment-method-filter");
  methodFilter.innerHTML = ""; // Clear existing options

  methods.forEach((method) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-method="${method}">
                ${method.toUpperCase()}
            </a>
        `;
    methodFilter.appendChild(li);
  });
}

// Function to get gateway name from ID
function getGatewayName(gatewayId) {
  const gatewayMap = {
    1: "Cashfree",
    2: "Razorpay",
    3: "CCAvenue",
  };
  return gatewayMap[gatewayId] || "N/A";
}

// Function to get PG Status badge class
function getPgStatusBadge(status) {
  switch (status) {
    case "SUCCESS":
      return "badge bg-success";
    case "PENDING":
      return "badge bg-warning";
    case "NOT_ATTEMPTED":
      return "badge bg-danger";
    default:
      return "badge bg-danger";
  }
}

// Update the filter function to correctly handle gateway filtering
function filterTable() {
  console.log("Selected Gateway:", selectedGateway); // Debug log
  console.log("Selected Month:", selectedMonth); // Debug log for month

  const tableBody = document.getElementById("paymentsTableBody");
  const rows = tableBody.getElementsByTagName("tr");
  let hasVisibleRows = false;

  for (let row of rows) {
    const gatewayCell = row.cells[8];
    const dateCell = row.cells[1];
    const pgStatusCell = row.cells[7];
    const methodCell = row.cells[4];

    const gatewayText = gatewayCell.textContent.trim();

    // Extract and pad the month with leading zero if needed
    const dateParts = dateCell.textContent.trim().split("/");
    const monthFromDate = dateParts[1].padStart(2, "0");
    console.log("Table Month:", monthFromDate); // Debug log

    const pgStatus = pgStatusCell.textContent.trim();
    const method = methodCell.textContent.trim().toLowerCase();

    // Check all filters
    const matchesGateway = !selectedGateway || gatewayText === selectedGateway;
    const matchesMonth = !selectedMonth || monthFromDate === selectedMonth;
    const matchesPgStatus = !selectedPgStatus || pgStatus === selectedPgStatus;
    const matchesMethod = !selectedMethod || method === selectedMethod;

    if (matchesGateway && matchesMonth && matchesPgStatus && matchesMethod) {
      row.style.display = "";
      hasVisibleRows = true;
    } else {
      row.style.display = "none";
    }
  }

  // Show/hide no results message
  const noResultsMsg = document.getElementById("no-results-message");
  if (!hasVisibleRows) {
    if (!noResultsMsg) {
      const msg = document.createElement("div");
      msg.id = "no-results-message";
      msg.className = "alert alert-info m-3";
      msg.textContent = "No results found for applied filters";
      tableBody.parentElement.appendChild(msg);
    }
  } else if (noResultsMsg) {
    noResultsMsg.remove();
  }
}

// Update the gateway filter dropdown event listener
document
  .getElementById("payment-gateway-filter")
  .addEventListener("click", function (e) {
    if (e.target.classList.contains("dropdown-item")) {
      selectedGateway = e.target.dataset.gatewayName;
      console.log("Selected Gateway Name:", selectedGateway); // Debug log

      // Update dropdown button text
      const dropdownButton = e.target
        .closest(".dropdown")
        .querySelector(".dropdown-toggle");
      dropdownButton.textContent = selectedGateway;
    }
  });

document.addEventListener("DOMContentLoaded", async function () {
  console.log("=== Chapter Kitty Loading Process Started ===");

  // Function to show the loader
  function showLoader() {
    console.log("Showing loader...");
    document.getElementById("loader").style.display = "flex";
  }

  // Function to hide the loader
  function hideLoader() {
    console.log("Hiding loader...");
    document.getElementById("loader").style.display = "none";
  }

  try {
    showLoader();
    console.log("Initializing currency formatter...");
    const indianCurrencyFormatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });

    // Initialize totalCreditAmount at the beginning
    let totalCreditAmount = 0;

    // Step 1: Get logged-in chapter email and type
    console.log("Step 1: Getting user login type...");
    const loginType = getUserLoginType();
    console.log("Detected login type:", loginType);

    let chapterEmail;
    let chapter_id;

    if (loginType === "ro_admin") {
      console.log("RO Admin detected, fetching from localStorage...");
      chapterEmail = localStorage.getItem("current_chapter_email");
      chapter_id = localStorage.getItem("current_chapter_id");

      console.log("localStorage data found:", {
        email: chapterEmail,
        id: chapter_id,
      });

      if (!chapterEmail || !chapter_id) {
        console.error("CRITICAL: Missing localStorage data for RO Admin");
        hideLoader();
        return;
      }
    } else {
      console.log(
        "Regular chapter login detected, getting email from token..."
      );
      chapterEmail = getUserEmail();

      // Get chapter_id from chapters API
      const chaptersResponse = await fetch(
        "http://localhost:5000/api/chapters"
      );
      const chapters = await chaptersResponse.json();
      const chapter = chapters.find(ch =>
        ch.email_id === chapterEmail ||
        ch.vice_president_mail === chapterEmail ||
        ch.president_mail === chapterEmail ||
        ch.treasurer_mail === chapterEmail
    );
      if (chapter) {
        chapter_id = chapter.chapter_id;
      }
    }

    // Calculate total credit amount
    console.log("Fetching credit notes for chapter:", chapter_id);
    const creditResponse = await fetch("http://localhost:5000/api/getAllMemberCredit");
    const memberCredits = await creditResponse.json();
    console.log("All member credits:", memberCredits);
    
    // Convert chapter_id to number for comparison
    const numericChapterId = parseInt(chapter_id);
    console.log("Numeric chapter ID for comparison:", numericChapterId);

    const filteredMemberCredits = memberCredits.filter((credit) => {
      const creditChapterId = parseInt(credit.chapter_id);
      console.log("Comparing credit chapter ID:", creditChapterId, "with chapter ID:", numericChapterId);
      return creditChapterId === numericChapterId;
    });

    console.log("Filtered member credits:", filteredMemberCredits);
    
    totalCreditAmount = filteredMemberCredits.reduce((total, credit) => {
      const amount = parseFloat(credit.credit_amount || 0);
      console.log("Adding credit amount:", amount, "from credit:", credit);
      return total + amount;
    }, 0);
    
    console.log("Total Credit Amount:", totalCreditAmount);

    // Update credit note amount display
    const creditAmountElement = document.querySelector("#total_credit_amount");
    if (creditAmountElement) {
      creditAmountElement.textContent = indianCurrencyFormatter.format(totalCreditAmount);
      creditAmountElement.style.cursor = 'pointer';
      
      // Add click handler for credit note details
      creditAmountElement.addEventListener('click', async function() {
        try {
          // Fetch members to get member names
          const membersResponse = await fetch("http://localhost:5000/api/members");
          const allMembers = await membersResponse.json();
          
          // Prepare credit details
          const creditDetails = filteredMemberCredits.map(credit => {
            const member = allMembers.find(m => parseInt(m.member_id) === parseInt(credit.member_id));
            let dateStr = credit.credit_date ? new Date(credit.credit_date).toLocaleDateString("en-IN") : "N/A";
            if (dateStr === "Invalid Date") dateStr = "N/A";
            return {
              memberName: member ? (member.member_first_name + (member.member_last_name ? ' ' + member.member_last_name : '')) : "N/A",
              amount: parseFloat(credit.credit_amount || 0),
              date: dateStr,
              description: credit.credit_type || "N/A"
            };
          });

          // Populate credit note table
          const creditTableBody = document.getElementById('creditNoteTableBody');
          creditTableBody.innerHTML = creditDetails.map((credit, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${credit.memberName}</td>
              <td>₹${credit.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td>${credit.date}</td>
              <td>${credit.description}</td>
            </tr>
          `).join('');

          // Populate summary fields
          const creditNoteCount = document.getElementById('creditNoteCount');
          const creditNoteTotalAmount = document.getElementById('creditNoteTotalAmount');
          if (creditNoteCount) creditNoteCount.textContent = creditDetails.length;
          if (creditNoteTotalAmount) {
            const total = creditDetails.reduce((sum, c) => sum + c.amount, 0);
            creditNoteTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }

          // Show modal
          const creditNoteModal = new bootstrap.Modal(document.getElementById('creditNoteModal'));
          creditNoteModal.show();
        } catch (error) {
          console.error('Error showing credit note details:', error);
        }
      });
    } else {
      console.error("Credit amount element not found in DOM");
    }

    // Fetch write-off data and calculate total
    console.log("Fetching write-off data for chapter:", chapter_id);
    const writeoffResponse = await fetch(
      "http://localhost:5000/api/getAllMemberWriteOff"
    );
    const writeoffData = await writeoffResponse.json();

    // Calculate total write-off amount for this chapter
    let totalWriteoffAmount = 0;
    writeoffData.forEach((writeoff) => {
      if (parseInt(writeoff.chapter_id) === parseInt(chapter_id)) {
        totalWriteoffAmount += parseFloat(writeoff.total_pending_amount);
      }
    });

    console.log("Total write-off amount calculated:", totalWriteoffAmount);

    // Update the write-off amount display
    document.querySelector("#total_expse_amount").textContent =
      indianCurrencyFormatter.format(totalWriteoffAmount);

    // Step 2: Fetch chapter details
    console.log("Step 2: Fetching chapter details...");
    const chapterResponse = await fetch(
      "http://localhost:5000/api/chapters"
    );
    const chaptersData = await chapterResponse.json();
    console.log("Chapters data received:", chaptersData.length, "chapters");

    const loggedInChapter = chaptersData.find(
      (chapter) =>
        chapter.email_id === chapterEmail ||
        chapter.vice_president_mail === chapterEmail ||
        chapter.president_mail === chapterEmail ||
        chapter.treasurer_mail === chapterEmail
    );
    
    console.log("Found chapter:", loggedInChapter);

    if (!loggedInChapter) {
      console.error("ERROR: No chapter found for email:", chapterEmail);
      hideLoader();
      return;
    }

    const { chapter_id: chapterId, available_fund } = loggedInChapter;
    console.log("Chapter details extracted:", {
      chapter_id: chapterId,
      available_fund,
    });
    console.log("Logged-in chapter ID:", chapterId);

    // Ensure paid expense card is updated
    await fetchAndDisplayPaidExpenses(chapterId);

    // After you have the chapterId
    console.log('🔄 Fetching visitor amount for chapter:', chapterId);
    visitorAmountTotal = await fetchVisitorAmountTotal(chapterId);
    console.log('✅ Visitor amount fetched:', visitorAmountTotal);

    // Add calculation here
    console.log("📊 Starting member opening balance calculation");
    const membersResponse = await fetch(
      "http://localhost:5000/api/members"
    );
    const allMembers = await membersResponse.json();
    const chapterMembersWithBalance = allMembers.filter(
      (member) => member.chapter_id === chapterId
    );
    // console.log('👥 Found members for chapter:', chapterMembersWithBalance.length);
    // Step 4: Fetch members count using chapter_id
    const memberCount = chapterMembersWithBalance.length;
    // console.log("chapter member",chapterMembersWithBalance);

    const bankOrderResponse = await fetch(
      "http://localhost:5000/api/getbankOrder"
    );
    const bankOrders = await bankOrderResponse.json();
    console.log("Bank Orders Data:", bankOrders);
    const filteredBankOrders = bankOrders.filter(
      (order) => order.chapter_id === chapterId
    );
    console.log(
      "Filtered Bank Orders for Chapter ID:",
      chapterId,
      filteredBankOrders
    );
    let totalLatePayment = 0;
    filteredBankOrders.forEach((order) => {
      const latePayment = parseFloat(order.no_of_late_payment) || 0;
      const amount = parseFloat(order.amount_to_pay) || 0;
    
      totalLatePayment += latePayment;
      if (amount >= 0) {
        pendingAmount += amount;
      }
    });
    
    // pendingAmount -= totalWriteoffAmount || 0;
    
    console.log("Total Late Payment:", totalLatePayment);
    console.log("--------------------------------", pendingAmount);
    const formattedPendingAmount =
            indianCurrencyFormatter.format(pendingAmount);
          
    document.getElementById("totalKittypendingamount").textContent =
    formattedPendingAmount;

    // Process each entry in the filtered bank orders
    filteredBankOrders.forEach((order) => {
      // Example processing: log each order's details
      console.log(
        `Order ID: ${order.order_id}, Amount: ${order.amount}, Status: ${order.status}`
      );
      // You can add more processing logic here as needed
    });


    // Continue with existing code
    const expenseResponse = await fetch(
      "http://localhost:5000/api/allExpenses"
    );
    const expenses = await expenseResponse.json();
    console.log("expense", expenses);

    expenses.forEach((expense) => {
      if (expense.chapter_id === chapterId) {
        if (expense.payment_status === "pending") {
          total_pending_expense += parseFloat(expense.amount);
        } else if (expense.payment_status === "paid") {
          total_paid_expense += parseFloat(expense.amount);
        }
        console.log();
      }
    });

    console.log("Total Pending Expense:", total_pending_expense);
    console.log("Total Paid Expense:", total_paid_expense);

    // Step 3: Fetch kitty payments using chapter_id
    const kittyResponse = await fetch(
      "http://localhost:5000/api/getKittyPayments"
    );
    const kittyPayments = await kittyResponse.json();
    const chapterKittyPayment = kittyPayments.find(
      (payment) => payment.chapter_id === chapterId
    );

    if (!chapterKittyPayment) {
      console.error("Kitty bill not found for chapter ID:", chapterId);

      // here new changes
      if (memberCount === 0) {
        console.error(
          "No Kitty members and no bill not found for chapter ID:",
          chapterId
        );
        document.getElementById("totalKittyDetails").textContent =
          "No Bill Raised Yet";
        document.getElementById("totalKittyAmountReceived").textContent = "N/A";
        document.querySelector(".member_count").textContent = memberCount;
        document.querySelector("#total_available_amount").textContent =
          indianCurrencyFormatter.format(
            parseFloat(available_fund) - parseFloat(total_paid_expense) + parseFloat(visitorAmountTotal)
          );
        document.querySelector("#total_expense_amount").textContent =
          indianCurrencyFormatter.format(total_paid_expense);
        document.querySelector("#total_pexpense_amount").textContent =
          indianCurrencyFormatter.format(total_pending_expense);
        document.querySelector("#total_credit_amount").textContent =
          indianCurrencyFormatter.format(totalCreditAmount);
        document.querySelector("#no_of_late_payment").textContent =
          totalLatePayment;

        const tableBody = document.getElementById("paymentsTableBody");
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td colspan="11" style="text-align: center;"><b>No Bill Transaction Found.</b></td>
                `;
        tableBody.appendChild(row);
        return;
      } else {
        const ordersResponse = await fetch(
          "http://localhost:5000/api/allOrders"
        );
        const allOrders = await ordersResponse.json();

        // Filter orders for the chapter with universal_link_id === 4
        const chapterOrders = allOrders.filter(
          (order) =>
            order.chapter_id === chapterId &&
            (order.payment_note === "meeting-payments" ||
             order.payment_note === "meeting-payments-opening-only")
        );

        document.getElementById("totalKittyDetails").textContent =
          "No Bill Raised Yet";
        // need changes heere
        // document.getElementById('totalKittyAmountReceived').textContent = 'N/A';
        // document.querySelector('#total_available_amount').textContent = indianCurrencyFormatter.format(parseFloat(available_fund)- parseFloat(total_paid_expense));

        document.querySelector(".member_count").textContent = memberCount;

        document.querySelector("#total_expense_amount").textContent =
          indianCurrencyFormatter.format(total_paid_expense);
        document.querySelector("#total_pexpense_amount").textContent =
          indianCurrencyFormatter.format(total_pending_expense);
        document.querySelector("#total_credit_amount").textContent =
          indianCurrencyFormatter.format(totalCreditAmount);
        document.querySelector("#no_of_late_payment").textContent =
          totalLatePayment;
        // if oreder 1
        if (chapterOrders.length === 0) {
          document.getElementById("totalKittyAmountReceived").textContent =
            "N/A";
          document.querySelector("#total_available_amount").textContent =
            indianCurrencyFormatter.format(
              parseFloat(available_fund) - parseFloat(total_paid_expense) + parseFloat(visitorAmountTotal)
            );
          const tableBody = document.getElementById("paymentsTableBody");
          const row = document.createElement("tr");
          row.innerHTML = `
                        <td colspan="11" style="text-align: center;"><b>No Bill Transaction Found.</b></td>
                    `;
          tableBody.appendChild(row);
          return;
        }

        // else 0
        else {
          const transactionsResponse = await fetch(
            "http://localhost:5000/api/allTransactions"
          );
          const allTransactions = await transactionsResponse.json();
          console.log("Fetched Transactions:", allTransactions);

          const ordersWithTransactions = chapterOrders.map((order) => {
            const transaction = allTransactions.find(
              (tran) => tran.order_id === order.order_id
            );

            return {
              ...order,
              ...transaction, // Add transaction fields to the order object
            };
          });

          console.log("Orders with Transactions:", ordersWithTransactions);

          // Update table with order data
          const tableBody = document.querySelector("#paymentsTableBody");
          tableBody.innerHTML = ""; // Clear the table body

          let serialNumber = 1; // Initialize counter for displayed rows
          let currentChapterMember;
          let ReceivedAmount = 0;
          let MiscellaneousAmount = 0;

          chapterOrders.forEach(async (order) => {
            // Find matching transaction
            const transaction = allTransactions.find(
              (tran) => tran.order_id === order.order_id
            );

            // Skip this order if no transaction found
            if (!transaction) {
              return; // This will skip to the next iteration
            }

            // Format date
            const orderDate = order.created_at
              ? new Date(order.created_at).toLocaleDateString("en-IN")
              : "N/A";
            const transactionDate = new Date(
              transaction.payment_time
            ).toLocaleDateString("en-IN", { timeZone: "UTC" });
            console.log(
              "=====================================r===",
              transactionDate
            );
            // find current member
            currentChapterMember = chapterMembersWithBalance.find(
              (member) => member.member_email_address === order.customer_email
            );
            console.log("Current Member:", currentChapterMember);
            console.log("current member id:", currentChapterMember.member_id);
            console.log("current chapter id:", currentChapterMember.chapter_id);


            // Use the latest pending balance
            let payamount;
            if (transaction.length > 0) {
              //   const latestPendingBalance = filteredPendingBalances[0];
              payamount = Math.ceil(
                parseFloat(transaction.payment_amount) -
                  (parseFloat(transaction.payment_amount) * 18) / 118
              ); // Remove 18% GST and round up
              console.log("new data");
            } else {
              payamount = Math.ceil(
                parseFloat(transaction.payment_amount) -
                  (parseFloat(transaction.payment_amount) * 18) / 118
              );
              console.log("old data");
            }

            console.log("payamount:", payamount);
            console.log("order.order_amount:", order.order_amount);
            console.log(
              "chapterMembers.meeting_opening_balance:",
              currentChapterMember.meeting_opening_balance
            );
            const pgStatus = transaction.payment_status;
            if (pgStatus === "SUCCESS") {
              ReceivedAmount += parseFloat(payamount);
            } else {
              MiscellaneousAmount += parseFloat(payamount);
            }

            // Format amount
            let formattedAmount = transaction.payment_amount
              ? new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(payamount)
              : "N/A";

            // Get payment details from transaction
            const paymentMethod = transaction.payment_method?.netbanking
              ? "netbanking"
              : "upi";
            const transactionId = transaction.cf_payment_id;

            const row = `
                <tr>
                    <td>${serialNumber}</td>
                    <td style="font-weight: 600">${transactionDate}</td>
                    <td style="font-weight: 600">
                        ${(order?.payment_note === "visitor-payment" || order?.payment_note === "Visitor Payment") ? 
                            `<div style="display: flex; flex-direction: column; gap: 4px;">
                                <span>${order.visitor_name || "N/A"}</span>
                                <span style="font-size: 0.85em; color: #666; display: flex; align-items: center;">
                                    <i class="ri-user-follow-line" style="margin-right: 4px;"></i>
                                    Invited by - ${order.member_name || "N/A"}
                                </span>
                            </div>` 
                            : 
                            order?.member_name || "N/A"
                        }</td>
                    <td><b>${
                      transaction.payment_amount
                    }</b><br><a href="/ck/chapter-kittyInvoice?order_id=${
              transaction.order_id
            }" class="fw-medium text-success">View</a></td>
                    <td style="font-weight: 600">${paymentMethod}</td>
                    <td style="font-weight: 500; font-style: italic">${
                      order.order_id || "N/A"
                    }</td>
                    <td><b>${transactionId}</b></td>
                    <td><span class="${getPgStatusBadge(
                      pgStatus
                    )}">${pgStatus}</span></td>
                    <td><b>${getGatewayName(order.payment_gateway_id)}</b></td>
                    
                </tr>
            `;

            tableBody.insertAdjacentHTML("beforeend", row);
            serialNumber++; // Increment counter only for displayed rows
          });
          console.log("ReceivedAmount:", ReceivedAmount);
          const totalKittyAmountReceived = ReceivedAmount;

          let totalReceivedAmount = ReceivedAmount;
          let totalPendingMiscellaneousAmount = MiscellaneousAmount;

          // Initialize otherPaymentsTotal if not already set
          if (typeof otherPaymentsTotal === 'undefined') {
            otherPaymentsTotal = 0;
          }

          // Calculate total available amount including other payments
          let totalAvailableAmount = parseFloat(available_fund) + 
                                    parseFloat(totalReceivedAmount) + 
                                    parseFloat(visitorAmountTotal) + 
                                    parseFloat(otherPaymentsTotal) - 
                                    parseFloat(total_paid_expense);

          // Store the values as data attributes
          const totalAvailableElement = document.querySelector("#total_available_amount");
          if (totalAvailableElement) {
            totalAvailableElement.setAttribute('data-opening-balance', available_fund);
            totalAvailableElement.setAttribute('data-meeting-payments', totalReceivedAmount);
            totalAvailableElement.setAttribute('data-visitor-payments', visitorAmountTotal);
            totalAvailableElement.setAttribute('data-paid-expenses', total_paid_expense);
            totalAvailableElement.setAttribute('data-other-payments', otherPaymentsTotal);
            
            // Update UI with total available amount
            totalAvailableElement.textContent = indianCurrencyFormatter.format(totalAvailableAmount);

            // Add click handler for modal if not already added
            if (!totalAvailableElement.hasAttribute('data-modal-handler-added')) {
              totalAvailableElement.addEventListener('click', function() {
                // Get the current values
                const available_fund = parseFloat(this.getAttribute('data-opening-balance') || 0);
                const totalReceivedAmount = parseFloat(this.getAttribute('data-meeting-payments') || 0);
                const visitorAmountTotal = parseFloat(this.getAttribute('data-visitor-payments') || 0);
                const total_paid_expense = parseFloat(this.getAttribute('data-paid-expenses') || 0);
                const otherPaymentsTotal = parseFloat(this.getAttribute('data-other-payments') || 0);

                // Update the modal
                updateFundBreakdownModal(
                  available_fund,
                  totalReceivedAmount,
                  visitorAmountTotal,
                  total_paid_expense,
                  otherPaymentsTotal,
                  allOrders,
                  allTransactions,
                  chapterId // Pass the correct chapterId variable
                );
              });
              totalAvailableElement.setAttribute('data-modal-handler-added', 'true');
            }
          }

          // Update the fund breakdown modal
          updateFundBreakdownModal(
            available_fund,
            totalReceivedAmount,
            visitorAmountTotal,
            total_paid_expense,
            otherPaymentsTotal,
            allOrders,
            allTransactions,
            chapterId // Pass the correct chapterId variable
          );

          // Populate all filter dropdowns
          await populateGatewayFilter();
          populateMonthFilter();
          populatePgStatusFilter();
          populateMethodFilter();

          // Add click event listener for PG Status filter
          document
            .getElementById("payment-status-filter")
            .addEventListener("click", function (e) {
              if (e.target.classList.contains("dropdown-item")) {
                selectedPgStatus = e.target.dataset.status;

                // Update dropdown button text
                const dropdownButton = e.target
                  .closest(".dropdown")
                  .querySelector(".dropdown-toggle");
                dropdownButton.textContent = selectedPgStatus;
              }
            });

          // Add click event listener for Method filter
          document
            .getElementById("payment-method-filter")
            .addEventListener("click", function (e) {
              if (e.target.classList.contains("dropdown-item")) {
                selectedMethod = e.target.dataset.method;

                // Update dropdown button text
                const dropdownButton = e.target
                  .closest(".dropdown")
                  .querySelector(".dropdown-toggle");
                dropdownButton.textContent = selectedMethod.toUpperCase();
              }
            });

          // Add click event listener for apply filter button
          document
            .getElementById("apply-filters-btn")
            .addEventListener("click", function () {
              filterTable();
            });

          // Update reset filter button click handler
          document
            .getElementById("reset-filters-btn")
            .addEventListener("click", function () {
              // Reset all filter variables
              selectedGateway = null;
              selectedMonth = null;
              selectedPgStatus = null;
              selectedMethod = null;

              // Reset all dropdown texts
              const gatewayDropdown = document.querySelector(
                '[data-bs-toggle="dropdown"]'
              );
              gatewayDropdown.innerHTML =
                '<i class="ti ti-sort-descending-2 me-1"></i> Gateway';

              const monthDropdown = document
                .getElementById("month-filter")
                .closest(".dropdown")
                .querySelector(".dropdown-toggle");
              monthDropdown.innerHTML =
                '<i class="ti ti-sort-descending-2 me-1"></i> Month';

              const statusDropdown = document
                .getElementById("payment-status-filter")
                .closest(".dropdown")
                .querySelector(".dropdown-toggle");
              statusDropdown.innerHTML =
                '<i class="ti ti-sort-descending-2 me-1"></i> PG Status';

              const methodDropdown = document
                .getElementById("payment-method-filter")
                .closest(".dropdown")
                .querySelector(".dropdown-toggle");
              methodDropdown.innerHTML =
                '<i class="ti ti-sort-descending-2 me-1"></i> Method';

              // Show all rows
              const tableBody = document.getElementById("paymentsTableBody");
              const rows = tableBody.getElementsByTagName("tr");
              for (let row of rows) {
                row.style.display = "";
              }

              // Remove any "no results" message
              const noResultsMsg = document.getElementById("no-results-message");
              if (noResultsMsg) {
                noResultsMsg.remove();
              }
            });

          // Render recent successful payments
          renderRecentSuccessfulPayments(allTransactions, allOrders, document.getElementById("paymentsTableBody"), chapter_id);

          // --- Add sorting logic for table headers with icons ---
          const table = document.getElementById('paymentsTableBody').closest('table');
          if (!table) return;

          // Helper: get cell value
          function getCellValue(row, idx) {
            const cell = row.children[idx];
            if (!cell) return '';
            // Remove HTML tags for icon columns
            return cell.textContent.trim();
          }

          // Helper: compare function for sorting
          function comparer(idx, type, asc) {
            return function (a, b) {
              let v1 = getCellValue(asc ? a : b, idx);
              let v2 = getCellValue(asc ? b : a, idx);

              // Numeric sort for amount columns
              if (type === 'number') {
                v1 = parseFloat(v1.replace(/[^0-9.]/g, '')) || 0;
                v2 = parseFloat(v2.replace(/[^0-9.]/g, '')) || 0;
                return v1 - v2;
              }
              // Date sort for date columns (assume dd/mm/yyyy)
              if (type === 'date') {
                const parseDate = (str) => {
                  const [d, m, y] = str.split('/');
                  return new Date(`20${y.length === 2 ? y : y.slice(-2)}`, m - 1, d);
                };
                return parseDate(v1) - parseDate(v2);
              }
              // String sort
              return v1.localeCompare(v2);
            };
          }

          // Add click event to sort icons
          table.querySelectorAll('th').forEach((th, idx) => {
            const sortIcons = th.querySelector('.sort-icons');
            if (!sortIcons) return;

            // Detect column type
            let type = 'string';
            const headerText = th.textContent.toLowerCase();
            if (headerText.includes('date')) type = 'date';
            if (headerText.includes('amount') || headerText.includes('total')) type = 'number';

            // Up arrow (ascending)
            const up = sortIcons.querySelector('.ti-arrow-up');
            if (up) {
              up.style.cursor = 'pointer';
              up.addEventListener('click', function (e) {
                e.stopPropagation();
                sortTable(table, idx, type, true);
              });
            }
            // Down arrow (descending)
            const down = sortIcons.querySelector('.ti-arrow-down');
            if (down) {
              down.style.cursor = 'pointer';
              down.addEventListener('click', function (e) {
                e.stopPropagation();
                sortTable(table, idx, type, false);
              });
            }
          });

          function sortTable(table, idx, type, asc) {
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => row.style.display !== 'none');
            rows.sort(comparer(idx, type, asc));
            // Remove all rows and re-append in sorted order
            rows.forEach(row => tbody.appendChild(row));
          }

          // After fetching orders and transactions
          console.log('Calculating manual payments...');
          const manualPaymentAmount = await calculateManualPayments(
            chapterId, 
            allOrders, 
            allTransactions, 
            available_fund
          );
          console.log('Manual payment amount calculated:', manualPaymentAmount);

          // Update manual funds display
          const manualFundsElement = document.getElementById('manual-funds-amount');
          console.log('Manual funds element found:', !!manualFundsElement);
          
          if (manualFundsElement) {
            // Format the amount with Indian currency format
            const formattedManualAmount = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 2
            }).format(manualPaymentAmount);
            
            // Update the text content with the formatted amount
            manualFundsElement.textContent = formattedManualAmount;
            console.log('Updated manual funds display:', formattedManualAmount);

            // Also update the data attribute in the total available amount element
            const totalAvailableElement = document.querySelector("#total_available_amount");
            if (totalAvailableElement) {
              totalAvailableElement.setAttribute('data-manual-payments', manualPaymentAmount);
            }
          } else {
            console.error('Manual funds element not found in DOM. Available elements:', {
              byClass: document.getElementsByClassName('.manual-funds-amount').length,
              byId: document.getElementById('manual-funds-amount') ? 'exists' : 'not found'
            });
          }

          // Fetch other payments total
          otherPaymentsTotal = await fetchOtherPaymentsTotal(chapterId);
          console.log("Other Payments Total:", otherPaymentsTotal);

          // Calculate total available amount including other payments
          totalAvailableAmount = parseFloat(available_fund) + 
                                parseFloat(totalReceivedAmount) + 
                                parseFloat(visitorAmountTotal) + 
                                parseFloat(otherPaymentsTotal) - 
                                parseFloat(total_paid_expense);

          // Update the existing totalAvailableElement with new values
          if (totalAvailableElement) {
            totalAvailableElement.setAttribute('data-opening-balance', available_fund);
            totalAvailableElement.setAttribute('data-meeting-payments', totalReceivedAmount);
            totalAvailableElement.setAttribute('data-visitor-payments', visitorAmountTotal);
            totalAvailableElement.setAttribute('data-paid-expenses', total_paid_expense);
            totalAvailableElement.setAttribute('data-other-payments', otherPaymentsTotal);
            
            // Update UI with total available amount
            totalAvailableElement.textContent = indianCurrencyFormatter.format(totalAvailableAmount);
          }
        }

        // return;
      }
    }

    const {
      total_bill_amount,
      bill_type,
      description,
      total_weeks,
      kitty_bill_id,
    } = chapterKittyPayment;
    console.log("Kitty Payment Details:", {
      total_bill_amount,
      bill_type,
      description,
      total_weeks,
      kitty_bill_id,
    });

    // // Step 4: Fetch members count using chapter_id
    // const memberCount = chapterMembersWithBalance.length;
    // // console.log("chapter member",chapterMembersWithBalance);
    // add 18% gst on total_bill_amount
    const gst = total_bill_amount * 0.18;
    console.log("GST:", gst);
    let amountWithGst = parseFloat(total_bill_amount);
    console.log(
      "========================================================",
      total_bill_amount
    );

    console.log("Number of members:", memberCount);
    if (memberCount === 0) {
      console.error("Kitty members not found for chapter ID:", chapterId);
      document.getElementById("totalKittyDetails").textContent =
        indianCurrencyFormatter.format(amountWithGst);
      document.getElementById("totalKittyAmountReceived").textContent = "N/A";
      // document.getElementById('totalKittyExpense').textContent = 'N/A';
      document.querySelector(".member_count").textContent = memberCount;
      document.querySelector(".description").textContent = description;
      document.querySelector(".bill_type").textContent = bill_type;
      document.querySelector(".total_weeks").textContent = `${total_weeks}`;
      document.querySelector("#total_available_amount").textContent =
        indianCurrencyFormatter.format(
          parseFloat(available_fund) - parseFloat(total_paid_expense) + parseFloat(visitorAmountTotal)
        );
      // expense

      document.querySelector("#total_expense_amount").textContent =
        indianCurrencyFormatter.format(total_paid_expense);
      document.querySelector("#total_pexpense_amount").textContent =
        indianCurrencyFormatter.format(total_pending_expense);
      document.querySelector("#total_credit_amount").textContent =
        indianCurrencyFormatter.format(totalCreditAmount);
      document.querySelector("#no_of_late_payment").textContent =
        totalLatePayment;

      const tableBody = document.getElementById("paymentsTableBody");
      const row = document.createElement("tr");
      row.innerHTML = `
                <td colspan="11" style="text-align: center;"><b>No Bill Transaction Found.</b></td>
            `;
      tableBody.appendChild(row);
      return;
    }

    // Step 5: Calculate total amount raised
    const totalAmountRaised = parseFloat(amountWithGst) * memberCount;

    // Step 6: Fetch all orders for the chapter
    const ordersResponse = await fetch(
      "http://localhost:5000/api/allOrders"
    );
    const allOrders = await ordersResponse.json();

    // Filter orders for the chapter with universal_link_id === 4
    const chapterOrders = allOrders.filter(
      (order) =>
        order.chapter_id === chapterId &&
        (order.payment_note === "meeting-payments" ||
         order.payment_note === "meeting-payments-opening-only")
    );

    if (chapterOrders.length === 0) {
      console.error(
        "No orders found for the chapter with universal_link_id 4."
      );
      console.error("Kitty payment not found for chapter ID:", chapterId);
      document.getElementById("totalKittyDetails").textContent =
        indianCurrencyFormatter.format(amountWithGst);
      document.getElementById("totalKittyAmountReceived").textContent = "N/A";

      document.querySelector(".member_count").textContent = memberCount;
      document.querySelector(".description").textContent = description;
      document.querySelector(".bill_type").textContent = bill_type;
      document.querySelector(".total_weeks").textContent = `${total_weeks}`;
      document.querySelector("#total_available_amount").textContent =
        indianCurrencyFormatter.format(
          parseFloat(available_fund) - parseFloat(total_paid_expense) + parseFloat(visitorAmountTotal)
        );

      document.querySelector("#total_expense_amount").textContent =
        indianCurrencyFormatter.format(total_paid_expense);
      document.querySelector("#total_pexpense_amount").textContent =
        indianCurrencyFormatter.format(total_pending_expense);
      document.querySelector("#total_credit_amount").textContent =
        indianCurrencyFormatter.format(totalCreditAmount);
      document.querySelector("#no_of_late_payment").textContent =
        totalLatePayment;

      const tableBody = document.getElementById("paymentsTableBody");
      const row = document.createElement("tr");
      row.innerHTML = `
                <td colspan="11" style="text-align: center;"><b>No Bill Transaction Found.</b></td>
            `;
      tableBody.appendChild(row);
      return;
    }

    console.log("Fetched Orders:", chapterOrders);

    const transactionsResponse = await fetch(
      "http://localhost:5000/api/allTransactions"
    );
    const allTransactions = await transactionsResponse.json();
    console.log("Fetched Transactions:", allTransactions);

    const ordersWithTransactions = chapterOrders.map((order) => {
      const transaction = allTransactions.find(
        (tran) => tran.order_id === order.order_id
      );

      return {
        ...order,
        ...transaction, // Add transaction fields to the order object
      };
    });

    console.log("Orders with Transactions:", ordersWithTransactions);

    // Update table with order data
    const tableBody = document.querySelector("#paymentsTableBody");
    tableBody.innerHTML = ""; // Clear the table body

    let serialNumber = 1; // Initialize counter for displayed rows
    let currentChapterMember;
    let ReceivedAmount = 0;
    let MiscellaneousAmount = 0;

    chapterOrders.forEach(async (order) => {
      // Find matching transaction
      const transaction = allTransactions.find(
        (tran) => tran.order_id === order.order_id
      );

      // Skip this order if no transaction found
      if (!transaction) {
        return; // This will skip to the next iteration
      }

      // Format date
      const orderDate = order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-IN")
        : "N/A";
      const transactionDate = new Date(
        transaction.payment_time
      ).toLocaleDateString("en-IN", { timeZone: "UTC" });
      console.log("=====================================r===", transactionDate);
      // find current member
      currentChapterMember = chapterMembersWithBalance.find(
        (member) => member.member_id === order.customer_id
      );
      console.log("Current Member:", currentChapterMember);
      console.log("current member id:", currentChapterMember.member_id);
      console.log("current chapter id:", currentChapterMember.chapter_id);

      // Use the latest pending balance
      let payamount;
      if (transaction.length > 0) {
        //   const latestPendingBalance = filteredPendingBalances[0];
        payamount = Math.ceil(
          parseFloat(transaction.payment_amount) -
            (parseFloat(transaction.payment_amount) * 18) / 118
        ); // Remove 18% GST and round up
        console.log("new data");
      } else {
        payamount = Math.ceil(
          parseFloat(transaction.payment_amount) -
            (parseFloat(transaction.payment_amount) * 18) / 118
        );
        console.log("old data");
      }

      console.log("payamount:", payamount);
      console.log("order.order_amount:", order.order_amount);
      console.log(
        "chapterMembers.meeting_opening_balance:",
        currentChapterMember.meeting_opening_balance
      );
      const pgStatus = transaction.payment_status;
      if (pgStatus === "SUCCESS") {
        ReceivedAmount += parseFloat(payamount);
      } else {
        MiscellaneousAmount += parseFloat(payamount);
      }

      // Format amount
      let formattedAmount = transaction.payment_amount
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
          }).format(payamount)
        : "N/A";

      // Get payment details from transaction
      const paymentMethod = transaction.payment_method?.netbanking
        ? "netbanking"
        : "upi";
      const transactionId = transaction.cf_payment_id;

      const row = `
                <tr>
                    <td>${serialNumber}</td>
                    <td style="font-weight: 600">${transactionDate}</td>
                    <td style="font-weight: 600">
                        ${(order?.payment_note === "visitor-payment" || order?.payment_note === "Visitor Payment") ? 
                            `<div style="display: flex; flex-direction: column; gap: 4px;">
                                <span>${order.visitor_name || "N/A"}</span>
                                <span style="font-size: 0.85em; color: #666; display: flex; align-items: center;">
                                    <i class="ri-user-follow-line" style="margin-right: 4px;"></i>
                                    Invited by - ${order.member_name || "N/A"}
                                </span>
                            </div>` 
                            : 
                            order?.member_name || "N/A"
                        }</td>
                    <td><b>${
                      transaction.payment_amount
                    }</b><br><a href="/ck/chapter-kittyInvoice?order_id=${
        transaction.order_id
      }" class="fw-medium text-success">View</a></td>
                    <td style="font-weight: 600">${paymentMethod}</td>
                    <td style="font-weight: 500; font-style: italic">${
                      order.order_id || "N/A"
                    }</td>
                    <td><b>${transactionId}</b></td>
                    <td><span class="${getPgStatusBadge(
                      pgStatus
                    )}">${pgStatus}</span></td>
                    <td><b>${getGatewayName(order.payment_gateway_id)}</b></td>
                    
                </tr>
            `;

      tableBody.insertAdjacentHTML("beforeend", row);
      serialNumber++; // Increment counter only for displayed rows
    });
    console.log("ReceivedAmount:", ReceivedAmount);
    const totalKittyAmountReceived = ReceivedAmount;
    const totalPendingMiscellaneousAmount = MiscellaneousAmount;


    // Step 8: Format values in Indian currency format
    const formattedBillAmount = indianCurrencyFormatter.format(amountWithGst);
    const formattedTotalRaised = indianCurrencyFormatter.format(totalAmountRaised);
    const formattedKittyReceived = indianCurrencyFormatter.format(totalKittyAmountReceived);
    const formattedMiscellaneousAmount = indianCurrencyFormatter.format(totalPendingMiscellaneousAmount);
    const formattedTotalPaidExpense = indianCurrencyFormatter.format(total_paid_expense);
    
    let totalReceivedAmount = ReceivedAmount;
    
    // Calculate total available amount including other payments
    let totalAvailableAmount = parseFloat(available_fund) + 
                              parseFloat(totalReceivedAmount) + 
                              parseFloat(visitorAmountTotal) + 
                              parseFloat(otherPaymentsTotal) - 
                              parseFloat(total_paid_expense);
    // Set all dashboard values immediately (except available fund with otherPaymentsTotal)
    document.querySelector(".total_bill_amount").textContent = formattedBillAmount;
    document.querySelector(".total_kitty_amount_received").textContent = formattedKittyReceived;
    document.querySelector(".bill_type").textContent = bill_type;
    document.querySelector(".description").textContent = description;
    document.querySelector(".total_weeks").textContent = total_weeks;
    document.querySelector(".member_count").textContent = memberCount;
    document.querySelector(".total_miscellaneous_amount").textContent = formattedMiscellaneousAmount;
    document.querySelector("#total_pexpense_amount").textContent = indianCurrencyFormatter.format(total_pending_expense);
    document.querySelector("#total_credit_amount").textContent = indianCurrencyFormatter.format(totalCreditAmount);
    document.querySelector("#no_of_late_payment").textContent = totalLatePayment;

    // Set Total Available Fund (initial, without otherPaymentsTotal)
    const totalAvailableElement = document.querySelector("#total_available_amount");
    if (totalAvailableElement) {
      totalAvailableElement.textContent = indianCurrencyFormatter.format(totalAvailableAmount);
    }

    // After fetching orders and transactions
    const manualPaymentAmount = await calculateManualPayments(
      chapterId, 
      allOrders, 
      allTransactions, 
      available_fund
    );
    // Fetch other payments total
    otherPaymentsTotal = await fetchOtherPaymentsTotal(chapterId);
    console.log("Other Payments Total:", otherPaymentsTotal);

    // Calculate total available amount including other payments
    totalAvailableAmount = parseFloat(available_fund) + 
                          parseFloat(totalReceivedAmount) + 
                          parseFloat(visitorAmountTotal) + 
                          parseFloat(otherPaymentsTotal) - 
                          parseFloat(total_paid_expense);

    // Update the existing totalAvailableElement with new values
    if (totalAvailableElement) {
      totalAvailableElement.setAttribute('data-opening-balance', available_fund);
      totalAvailableElement.setAttribute('data-meeting-payments', totalReceivedAmount);
      totalAvailableElement.setAttribute('data-visitor-payments', visitorAmountTotal);
      totalAvailableElement.setAttribute('data-paid-expenses', total_paid_expense);
      totalAvailableElement.setAttribute('data-other-payments', otherPaymentsTotal);
      
      // Update UI with total available amount
      totalAvailableElement.textContent = indianCurrencyFormatter.format(totalAvailableAmount);
    }

    // Update the fund breakdown modal
    updateFundBreakdownModal(
      available_fund,
      totalReceivedAmount,
      visitorAmountTotal,
      total_paid_expense,
      otherPaymentsTotal,
      allOrders,
      allTransactions,
      chapterId // Pass the correct chapterId variable
    );

    // Add this function to handle credit note details
    async function fetchAndDisplayCreditNoteDetails(chapterId) {
        try {
            console.log('📊 Starting fetchAndDisplayCreditNoteDetails');
            
            // Fetch credit notes
            const creditResponse = await fetch("http://localhost:5000/api/getAllMemberCredit");
            const memberCredits = await creditResponse.json();
            console.log("Member Credits Data:", memberCredits);
            const filteredMemberCredits = memberCredits.filter(
              (credit) => credit.chapter_id === chapterId
            );
            console.log(
              "Filtered Member Credits for Chapter ID:",
              chapterId,
              filteredMemberCredits
            );
            let totalCreditAmount = 0;
            filteredMemberCredits.forEach((credit) => {
              totalCreditAmount += parseFloat(credit.credit_amount || 0);
            });
            console.log("Total Credit Amount:", totalCreditAmount);
            
            // Fetch members to get member names
            const membersResponse = await fetch("http://localhost:5000/api/members");
            const allMembers = await membersResponse.json();
            
            // Prepare credit details
            const creditDetails = filteredMemberCredits.map(credit => {
              const member = allMembers.find(m => m.member_id === credit.member_id);
              return {
                memberName: member ? member.member_name : "N/A",
                amount: parseFloat(credit.credit_amount || 0),
                date: new Date(credit.created_at).toLocaleDateString("en-IN"),
                description: credit.description || "N/A"
              };
            });

            // Populate credit note table
            const creditTableBody = document.getElementById('creditNoteTableBody');
            creditTableBody.innerHTML = creditDetails.map(credit => `
              <tr>
                <td>${credit.memberName}</td>
                <td>₹${credit.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                <td>${credit.date}</td>
                <td>${credit.description}</td>
              </tr>
            `).join('');

            // Populate summary fields
            const creditNoteCount = document.getElementById('creditNoteCount');
            const creditNoteTotalAmount = document.getElementById('creditNoteTotalAmount');
            if (creditNoteCount) creditNoteCount.textContent = creditDetails.length;
            if (creditNoteTotalAmount) {
              const total = creditDetails.reduce((sum, c) => sum + c.amount, 0);
              creditNoteTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
            }

            // Show modal
            const creditNoteModal = new bootstrap.Modal(document.getElementById('creditNoteModal'));
            creditNoteModal.show();
        } catch (error) {
            console.error('Error showing credit note details:', error);
        }
    }

    // Add this to the DOMContentLoaded event listener, after the existing credit note code
    document.addEventListener('DOMContentLoaded', async function() {
        // ... existing code ...
        
        // After the existing credit note code, add:
        const totalCreditElement = document.querySelector('#total_credit_amount');
        if (totalCreditElement) {
            totalCreditElement.style.cursor = 'pointer';
            totalCreditElement.addEventListener('click', async function() {
              try {
                // Fetch members to get member names
                const membersResponse = await fetch("http://localhost:5000/api/members");
                const allMembers = await membersResponse.json();
                
                // Prepare credit details
                const creditDetails = filteredMemberCredits.map(credit => {
                  const member = allMembers.find(m => parseInt(m.member_id) === parseInt(credit.member_id));
                  return {
                    memberName: member ? member.member_name : "N/A",
                    amount: parseFloat(credit.credit_amount || 0),
                    date: new Date(credit.created_at).toLocaleDateString("en-IN"),
                    description: credit.description || "N/A"
                  };
                });

                // Populate credit note table
                const creditTableBody = document.getElementById('creditNoteTableBody');
                creditTableBody.innerHTML = creditDetails.map(credit => `
                  <tr>
                    <td>${credit.memberName}</td>
                    <td>₹${credit.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td>${credit.date}</td>
                    <td>${credit.description}</td>
                  </tr>
                `).join('');

                // Populate summary fields
                const creditNoteCount = document.getElementById('creditNoteCount');
                const creditNoteTotalAmount = document.getElementById('creditNoteTotalAmount');
                if (creditNoteCount) creditNoteCount.textContent = creditDetails.length;
                if (creditNoteTotalAmount) {
                  const total = creditDetails.reduce((sum, c) => sum + c.amount, 0);
                  creditNoteTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
                }

                // Show modal
                const creditNoteModal = new bootstrap.Modal(document.getElementById('creditNoteModal'));
                creditNoteModal.show();
              } catch (error) {
                console.error('Error showing credit note details:', error);
              }
            });
        }
        
        // ... rest of existing code ...
    });

    // Add click handler for write off details
    const writeOffAmountElement = document.querySelector("#total_expse_amount");
    if (writeOffAmountElement) {
      writeOffAmountElement.style.cursor = 'pointer';
      writeOffAmountElement.addEventListener('click', async function() {
        try {
          // Fetch write off data
          const writeoffResponse = await fetch("http://localhost:5000/api/getAllMemberWriteOff");
          const writeoffData = await writeoffResponse.json();
          // Fetch members to get member names
          const membersResponse = await fetch("http://localhost:5000/api/members");
          const allMembers = await membersResponse.json();
          // Get current chapter id
          const numericChapterId = parseInt(chapter_id);
          // Filter write offs for this chapter
          const filteredWriteOffs = writeoffData.filter(w => parseInt(w.chapter_id) === numericChapterId);
          // Prepare details
          const writeOffDetails = filteredWriteOffs.map((w, idx) => {
            const member = allMembers.find(m => parseInt(m.member_id) === parseInt(w.member_id));
            let dateStr = w.rightoff_date ? new Date(w.rightoff_date).toLocaleDateString("en-IN") : "N/A";
            if (dateStr === "Invalid Date") dateStr = "N/A";
            return {
              srNo: idx + 1,
              memberName: member ? (member.member_first_name + (member.member_last_name ? ' ' + member.member_last_name : '')) : "N/A",
              amount: parseFloat(w.total_pending_amount || 0),
              date: dateStr,
              description: w.writeoff_comment || "N/A"
            };
          });
          // Populate table
          const writeOffTableBody = document.getElementById('writeOffTableBody');
          writeOffTableBody.innerHTML = writeOffDetails.map(w => `
            <tr>
              <td>${w.srNo}</td>
              <td>${w.memberName}</td>
              <td>₹${w.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td>${w.date}</td>
              <td>${w.description}</td>
            </tr>
          `).join('');
          // Populate summary
          const writeOffCount = document.getElementById('writeOffCount');
          const writeOffTotalAmount = document.getElementById('writeOffTotalAmount');
          if (writeOffCount) writeOffCount.textContent = writeOffDetails.length;
          if (writeOffTotalAmount) {
            const total = writeOffDetails.reduce((sum, w) => sum + w.amount, 0);
            writeOffTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }
          // Show modal
          const writeOffModal = new bootstrap.Modal(document.getElementById('writeOffModal'));
          writeOffModal.show();
        } catch (error) {
          console.error('Error showing write off details:', error);
        }
      });
    }

    // Add click handler for kitty amount received details
    const kittyReceivedAmountElement = document.querySelector("#totalKittyAmountReceived");
    if (kittyReceivedAmountElement) {
      kittyReceivedAmountElement.style.cursor = 'pointer';
      kittyReceivedAmountElement.addEventListener('click', async function() {
        try {
          // Fetch orders and transactions
          const ordersResponse = await fetch("http://localhost:5000/api/allOrders");
          const allOrders = await ordersResponse.json();
          const transactionsResponse = await fetch("http://localhost:5000/api/allTransactions");
          const allTransactions = await transactionsResponse.json();
          // Fetch members to get member names
          const membersResponse = await fetch("http://localhost:5000/api/members");
          const allMembers = await membersResponse.json();
          // Get current chapter id
          const numericChapterId = parseInt(chapter_id);
          // Filter orders for this chapter and meeting payments
          const chapterOrders = allOrders.filter(order =>
            parseInt(order.chapter_id) === numericChapterId &&
            (order.payment_note === "meeting-payments" || order.payment_note === "meeting-payments-opening-only")
          );
          // Find successful transactions for these orders
          const kittyReceivedDetails = chapterOrders.map((order, idx) => {
            const transaction = allTransactions.find(tran => tran.order_id === order.order_id && tran.payment_status === "SUCCESS");
            if (!transaction) return null;
            const member = allMembers.find(m => m.member_id === order.customer_id);
            let dateStr = transaction.payment_time ? new Date(transaction.payment_time).toLocaleDateString("en-IN") : "N/A";
            if (dateStr === "Invalid Date") dateStr = "N/A";
            // Payment method
            let paymentMethod = "N/A";
            if (transaction.payment_method) {
              let pm = transaction.payment_method;
              if (typeof pm === 'string') {
                try { pm = JSON.parse(pm); } catch (e) {}
              }
              if (typeof pm === 'object') {
                if (pm.upi) paymentMethod = "UPI";
                else if (pm.netbanking) paymentMethod = "Net Banking";
                else if (pm.card) paymentMethod = "Card";
                else if (pm.wallet) paymentMethod = "Wallet";
              } else if (typeof pm === 'string') {
                paymentMethod = pm;
              }
            }
            // Calculate amount without GST: order_amount - tax
            let amount = 0;
            if (order.order_amount && order.tax) {
              amount = parseFloat(order.order_amount) - parseFloat(order.tax);
            } else if (transaction.payment_amount && order.tax) {
              amount = parseFloat(transaction.payment_amount) - parseFloat(order.tax);
            } else {
              amount = parseFloat(transaction.payment_amount || 0);
            }
            return {
              srNo: idx + 1,
              memberName: member ? (member.member_first_name + (member.member_last_name ? ' ' + member.member_last_name : '')) : "N/A",
              amount: amount,
              date: dateStr,
              paymentMethod: paymentMethod,
              transactionId: transaction.cf_payment_id || "N/A"
            };
          }).filter(Boolean);
          // Populate table
          const kittyReceivedTableBody = document.getElementById('kittyReceivedTableBody');
          kittyReceivedTableBody.innerHTML = kittyReceivedDetails.map(k => `
            <tr>
              <td>${k.srNo}</td>
              <td>${k.memberName}</td>
              <td>₹${k.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td>${k.date}</td>
              <td>${k.paymentMethod}</td>
              <td>${k.transactionId}</td>
            </tr>
          `).join('');
          // Populate summary
          const kittyReceivedCount = document.getElementById('kittyReceivedCount');
          const kittyReceivedTotalAmount = document.getElementById('kittyReceivedTotalAmount');
          if (kittyReceivedCount) kittyReceivedCount.textContent = kittyReceivedDetails.length;
          if (kittyReceivedTotalAmount) {
            const total = kittyReceivedDetails.reduce((sum, k) => sum + k.amount, 0);
            kittyReceivedTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }
          // Show modal
          const kittyReceivedModal = new bootstrap.Modal(document.getElementById('kittyReceivedModal'));
          kittyReceivedModal.show();
        } catch (error) {
          console.error('Error showing kitty received details:', error);
        }
      });
    }

    // ... after fetching allOrders, allTransactions, and before setting totalKittyAmountReceived ...
    let kittyReceivedTotal = 0;
    const chapterOrdersForKitty = allOrders.filter(order =>
      parseInt(order.chapter_id) === parseInt(chapterId) &&
      (order.payment_note === "meeting-payments" || order.payment_note === "meeting-payments-opening-only")
    );
    chapterOrdersForKitty.forEach(order => {
      const transaction = allTransactions.find(tran => tran.order_id === order.order_id && tran.payment_status === "SUCCESS");
      if (transaction) {
        let amount = 0;
        if (order.order_amount && order.tax) {
          amount = parseFloat(order.order_amount) - parseFloat(order.tax);
        } else if (transaction.payment_amount && order.tax) {
          amount = parseFloat(transaction.payment_amount) - parseFloat(order.tax);
        } else {
          amount = parseFloat(transaction.payment_amount || 0);
        }
        kittyReceivedTotal += amount;
      }
    });
    document.getElementById("totalKittyAmountReceived").textContent = indianCurrencyFormatter.format(kittyReceivedTotal);

    const kittyPendingAmountElement = document.querySelector("#totalKittypendingamount");
    if (kittyPendingAmountElement) {
      kittyPendingAmountElement.style.cursor = 'pointer';
      kittyPendingAmountElement.addEventListener('click', async function() {
        try {
          // Fetch members and pending data
          const membersResponse = await fetch("http://localhost:5000/api/members");
          const allMembers = await membersResponse.json();
          const bankOrderResponse = await fetch("http://localhost:5000/api/getbankOrder");
          const bankOrders = await bankOrderResponse.json();

          // Get current chapter id
          const chapterId = localStorage.getItem('current_chapter_id');

          // Filter for this chapter and pending only
          const pendingOrders = bankOrders.filter(order =>
            String(order.chapter_id) === String(chapterId) && parseFloat(order.amount_to_pay) > 0
          );

          // Prepare details
          const pendingDetails = pendingOrders.map((order, idx) => {
            const member = allMembers.find(m => String(m.member_id) === String(order.member_id));
            return {
              srNo: idx + 1,
              memberName: member ? (member.member_first_name + (member.member_last_name ? ' ' + member.member_last_name : '')) : "N/A",
              amount: parseFloat(order.amount_to_pay || 0)
            };
          });

          // Populate table
          const kittyPendingTableBody = document.getElementById('kittyPendingTableBody');
          kittyPendingTableBody.innerHTML = pendingDetails.map(p => `
            <tr>
              <td>${p.srNo}</td>
              <td>${p.memberName}</td>
              <td>₹${p.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            </tr>
          `).join('');

          // Populate summary
          const kittyPendingCount = document.getElementById('kittyPendingCount');
          const kittyPendingTotalAmount = document.getElementById('kittyPendingTotalAmount');
          if (kittyPendingCount) kittyPendingCount.textContent = pendingDetails.length;
          if (kittyPendingTotalAmount) {
            const total = pendingDetails.reduce((sum, p) => sum + p.amount, 0);
            kittyPendingTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }

          // Show modal
          const kittyPendingModal = new bootstrap.Modal(document.getElementById('kittyPendingModal'));
          kittyPendingModal.show();
        } catch (error) {
          console.error('Error showing kitty pending details:', error);
        }
      });
    }

    const pendingExpenseAmountElement = document.querySelector("#total_pexpense_amount");
    if (pendingExpenseAmountElement) {
      pendingExpenseAmountElement.style.cursor = 'pointer';
      pendingExpenseAmountElement.addEventListener('click', async function() {
        try {
          // Fetch all expenses
          const expenseResponse = await fetch("http://localhost:5000/api/allExpenses");
          const expenses = await expenseResponse.json();

          // Get current chapter id
          const chapterId = localStorage.getItem('current_chapter_id');

          // Filter for this chapter and pending only
          const pendingExpenses = expenses.filter(expense =>
            String(expense.chapter_id) === String(chapterId) && expense.payment_status === "pending"
          );

          // Prepare details
          const pendingDetails = pendingExpenses.map((expense, idx) => ({
            srNo: idx + 1,
            title: expense.description || "N/A",
            amount: parseFloat(expense.amount || 0),
            date: expense.bill_date ? new Date(expense.bill_date).toLocaleDateString("en-IN") : "N/A",
            addedBy: expense.submitted_by || "N/A"
          }));

          // Populate table
          const pendingExpenseTableBody = document.getElementById('pendingExpenseTableBody');
          pendingExpenseTableBody.innerHTML = pendingDetails.map(e => `
            <tr>
              <td>${e.srNo}</td>
              <td>${e.title}</td>
              <td>₹${e.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td>${e.date}</td>
              <td>${e.addedBy}</td>
            </tr>
          `).join('');

          // Populate summary
          const pendingExpenseCount = document.getElementById('pendingExpenseCount');
          const pendingExpenseTotalAmount = document.getElementById('pendingExpenseTotalAmount');
          if (pendingExpenseCount) pendingExpenseCount.textContent = pendingDetails.length;
          if (pendingExpenseTotalAmount) {
            const total = pendingDetails.reduce((sum, e) => sum + e.amount, 0);
            pendingExpenseTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }

          // Show modal
          const pendingExpenseModal = new bootstrap.Modal(document.getElementById('pendingExpenseModal'));
          pendingExpenseModal.show();
        } catch (error) {
          console.error('Error showing pending expense details:', error);
        }
      });
    }

    const latePaymentElement = document.querySelector("#no_of_late_payment");
    if (latePaymentElement) {
      latePaymentElement.style.cursor = 'pointer';
      latePaymentElement.addEventListener('click', async function() {
        try {
          // Fetch all members and bank orders
          const membersResponse = await fetch("http://localhost:5000/api/members");
          const allMembers = await membersResponse.json();
          const bankOrderResponse = await fetch("http://localhost:5000/api/getbankOrder");
          const bankOrders = await bankOrderResponse.json();

          // Get current chapter id
          const chapterId = localStorage.getItem('current_chapter_id');

          // Filter for this chapter and late payments only
          const lateOrders = bankOrders.filter(order =>
            String(order.chapter_id) === String(chapterId) && parseInt(order.no_of_late_payment) > 0
          );

          // Prepare details
          const lateDetails = lateOrders.map((order, idx) => {
            const member = allMembers.find(m => String(m.member_id) === String(order.member_id));
            return {
              srNo: idx + 1,
              memberName: member ? (member.member_first_name + (member.member_last_name ? ' ' + member.member_last_name : '')) : "N/A",
              lateCount: order.no_of_late_payment || 0,
              amount: parseFloat(order.amount_to_pay || 0)
            };
          });

          // Populate table
          const latePaymentTableBody = document.getElementById('latePaymentTableBody');
          latePaymentTableBody.innerHTML = lateDetails.map(l => `
            <tr>
              <td>${l.srNo}</td>
              <td>${l.memberName}</td>
              <td>${l.lateCount}</td>
              <td>₹${l.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
            </tr>
          `).join('');

          // Populate summary
          const latePaymentCount = document.getElementById('latePaymentCount');
          const latePaymentTotalAmount = document.getElementById('latePaymentTotalAmount');
          if (latePaymentCount) latePaymentCount.textContent = lateDetails.length;
          if (latePaymentTotalAmount) {
            const total = lateDetails.reduce((sum, l) => sum + l.amount, 0);
            latePaymentTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }

          // Show modal
          const latePaymentModal = new bootstrap.Modal(document.getElementById('latePaymentModal'));
          latePaymentModal.show();
        } catch (error) {
          console.error('Error showing late payment details:', error);
        }
      });
    }

    const paidExpensesAmountElement = document.querySelector("#total_expense_amount_main");
    if (paidExpensesAmountElement) {
      paidExpensesAmountElement.style.cursor = 'pointer';
      paidExpensesAmountElement.addEventListener('click', async function() {
        try {
          // Fetch all expenses
          const expenseResponse = await fetch("http://localhost:5000/api/allExpenses");
          const expenses = await expenseResponse.json();

          // Get current chapter id
          const chapterId = localStorage.getItem('current_chapter_id');

          // Filter for this chapter and paid only
          const paidExpenses = expenses.filter(expense =>
            String(expense.chapter_id) === String(chapterId) && expense.payment_status === "paid"
          );

          // Prepare details
          const paidDetails = paidExpenses.map((expense, idx) => ({
            srNo: idx + 1,
            title: expense.description || "N/A",
            amount: parseFloat(expense.amount || 0),
            date: expense.bill_date ? new Date(expense.bill_date).toLocaleDateString("en-IN") : "N/A",
            paidBy: expense.submitted_by || "N/A",
            mode: expense.mode_of_payment || "N/A",
            billNo: expense.bill_no || "N/A"
          }));

          // Populate table
          const paidExpensesTableBody = document.getElementById('paidExpensesTableBody');
          paidExpensesTableBody.innerHTML = paidDetails.map(e => `
            <tr>
              <td>${e.srNo}</td>
              <td>${e.title}</td>
              <td>₹${e.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td>${e.date}</td>
              <td>${e.paidBy}</td>
              <td>${e.mode}</td>
              <td>${e.billNo}</td>
            </tr>
          `).join('');

          // Populate summary
          const paidExpensesCount = document.getElementById('paidExpensesCount');
          const paidExpensesTotalAmount = document.getElementById('paidExpensesTotalAmount');
          if (paidExpensesCount) paidExpensesCount.textContent = paidDetails.length;
          if (paidExpensesTotalAmount) {
            const total = paidDetails.reduce((sum, e) => sum + e.amount, 0);
            paidExpensesTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }

          // Show modal
          const paidExpensesModal = new bootstrap.Modal(document.getElementById('paidExpensesModal'));
          paidExpensesModal.show();
        } catch (error) {
          console.error('Error showing paid expenses details:', error);
        }
      });
    }

    const visitorPaymentAmountElement = document.querySelector("#total_V_amount");
    if (visitorPaymentAmountElement) {
      visitorPaymentAmountElement.style.cursor = 'pointer';
      visitorPaymentAmountElement.addEventListener('click', async function() {
        try {
          // Fetch all orders, transactions, and members
          const ordersResponse = await fetch("http://localhost:5000/api/allOrders");
          const allOrders = await ordersResponse.json();
          const transactionsResponse = await fetch("http://localhost:5000/api/allTransactions");
          const allTransactions = await transactionsResponse.json();
          const membersResponse = await fetch("http://localhost:5000/api/members");
          const allMembers = await membersResponse.json();

          // Get current chapter id
          const chapterId = localStorage.getItem('current_chapter_id');

          // Filter visitor orders for this chapter
          const visitorOrders = allOrders.filter(order =>
            String(order.chapter_id) === String(chapterId) &&
            (order.payment_note === "visitor-payment" || order.payment_note === "Visitor Payment")
          );

          // Prepare details
          const visitorDetails = visitorOrders.map((order, idx) => {
            const transaction = allTransactions.find(tran =>
              tran.order_id === order.order_id && tran.payment_status === "SUCCESS"
            );
            if (!transaction) return null;
            let amount = 0;
            if (order.payment_note === "visitor-payment") {
              amount = Math.ceil(parseFloat(order.order_amount || 0) - (parseFloat(order.order_amount || 0) * 18) / 118);
            } else if (order.payment_note === "Visitor Payment") {
              amount = parseFloat(order.order_amount || 0);
            }
            return {
              srNo: idx + 1,
              visitorName: order.visitor_name || "N/A",
              invitedBy: order.member_name || "N/A",
              amount: amount,
              date: transaction.payment_time ? new Date(transaction.payment_time).toLocaleDateString("en-IN") : "N/A",
              paymentMethod: transaction.payment_method?.upi ? "UPI" :
                             transaction.payment_method?.netbanking ? "Net Banking" :
                             transaction.payment_method?.card ? "Card" :
                             transaction.payment_method?.wallet ? "Wallet" : "N/A",
              transactionId: transaction.cf_payment_id || "N/A"
            };
          }).filter(Boolean);

          // Populate table
          const visitorPaymentTableBody = document.getElementById('visitorPaymentTableBody');
          visitorPaymentTableBody.innerHTML = visitorDetails.map(v => `
            <tr>
              <td>${v.srNo}</td>
              <td>${v.visitorName}</td>
              <td>${v.invitedBy}</td>
              <td>₹${v.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
              <td>${v.date}</td>
              <td>${v.paymentMethod}</td>
              <td>${v.transactionId}</td>
            </tr>
          `).join('');

          // Populate summary
          const visitorPaymentCount = document.getElementById('visitorPaymentCount');
          const visitorPaymentTotalAmount = document.getElementById('visitorPaymentTotalAmount');
          if (visitorPaymentCount) visitorPaymentCount.textContent = visitorDetails.length;
          if (visitorPaymentTotalAmount) {
            const total = visitorDetails.reduce((sum, v) => sum + v.amount, 0);
            visitorPaymentTotalAmount.textContent = '₹' + total.toLocaleString('en-IN', {maximumFractionDigits: 2});
          }

          // Show modal
          const visitorPaymentModal = new bootstrap.Modal(document.getElementById('visitorPaymentModal'));
          visitorPaymentModal.show();
        } catch (error) {
          console.error('Error showing visitor payment details:', error);
        }
      });
    }

    // After calculating and displaying totalKittyAmountReceived, add this:
    let cashKittyAmount = 0;
    let onlineKittyAmount = 0;

    const kittyOrders = allOrders.filter(order =>
      String(order.chapter_id) === String(chapterId) &&
      (order.payment_note === "meeting-payments" || order.payment_note === "meeting-payments-opening-only")
    );

    kittyOrders.forEach(order => {
      const transaction = allTransactions.find(
        tran => tran.order_id === order.order_id && tran.payment_status === "SUCCESS"
      );
      if (transaction) {
        // Determine payment mode
        let isCash = false;
        if (transaction.payment_method) {
          let pm = transaction.payment_method;
          if (typeof pm === 'string') {
            try { pm = JSON.parse(pm); } catch (e) {}
          }
          if (typeof pm === 'object' && pm.cash) {
            isCash = true;
          }
        }
        // Calculate amount (without GST)
        let amount = 0;
        if (order.order_amount && order.tax) {
          amount = parseFloat(order.order_amount) - parseFloat(order.tax);
        } else if (transaction.payment_amount && order.tax) {
          amount = parseFloat(transaction.payment_amount) - parseFloat(order.tax);
        } else {
          amount = parseFloat(transaction.payment_amount || 0);
        }
        if (isCash) {
          cashKittyAmount += amount;
        } else {
          onlineKittyAmount += amount;
        }
      }
    });

    const kittyBreakdownElem = document.getElementById('total_kitty_received_breakdown');
    if (kittyBreakdownElem) {
      kittyBreakdownElem.innerHTML = `
        Cash: ₹${cashKittyAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})} |
        Online: ₹${onlineKittyAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}
      `;
    }

    // After calculating and displaying total pending expense, add this:
    let cashPendingAmount = 0;
    let onlinePendingAmount = 0;

    const pendingExpenses = expenses.filter(expense =>
      String(expense.chapter_id) === String(chapterId) && expense.payment_status === "pending"
    );

    pendingExpenses.forEach(expense => {
      const amount = parseFloat(expense.amount || 0);
      if (expense.mode_of_payment === "cash") {
        cashPendingAmount += amount;
      } else {
        onlinePendingAmount += amount;
      }
    });

    const pendingBreakdownElem = document.getElementById('total_pending_expense_breakdown');
    if (pendingBreakdownElem) {
      pendingBreakdownElem.innerHTML = `
        Cash: ₹${cashPendingAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})} |
        Online: ₹${onlinePendingAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}
      `;
    }
  } catch (error) {
    console.error("ERROR in Chapter Kitty:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      type: error.name,
    });
  } finally {
    hideLoader();
    console.log("=== Chapter Kitty Loading Process Completed ===");
  }
});

// Add this function to handle table export
function exportTableToCSV() {
  // Get table data
  const tableRows = document.querySelectorAll('#paymentsTableBody tr');
  
  // Define headers
  const headers = [
    'S.No.',
    'Date',
    'Member Name',
    'Amount',
    'Payment Method',
    'Order ID',
    'Transaction ID',
    'PG Status',
    'Gateway'
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  // Add table data
  tableRows.forEach(row => {
    const columns = row.querySelectorAll('td');
    const rowData = Array.from(columns).map(column => {
      // Remove ₹ symbol and commas from amounts
      let data = column.textContent.trim();
      data = data.replace('₹', '').replace(/,/g, '');
      // Wrap in quotes to handle any commas in text
      return `"${data}"`;
    });
    csvContent += rowData.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Set download attributes
  link.setAttribute('href', url);
  link.setAttribute('download', `kitty_transactions_${new Date().toLocaleDateString()}.csv`);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Add event listener for export button
document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportTableBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportTableToCSV);
  }
});

/**
 * Renders table rows for recent successful payments, sorted by payment_time (most recent first).
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} orders - Array of order objects
 * @param {HTMLElement} tableBody - The table body element to render into
 */
function renderRecentSuccessfulPayments(transactions, orders, tableBody, chapter_id) {
  console.log("Starting renderRecentSuccessfulPayments with chapter_id:", chapter_id); // Debug log

  if (!chapter_id) {
    console.error("No chapter_id provided to renderRecentSuccessfulPayments");
    return;
  }

  // Filter orders for current chapter
  const ordersForChapter = orders.filter(order => String(order.chapter_id) === String(chapter_id));
  console.log("Filtered orders:", ordersForChapter.length); // Debug log

  const orderIdsForChapter = new Set(ordersForChapter.map(order => order.order_id));

  // Filter for SUCCESS transactions with order_id in current chapter
  const successful = transactions.filter(
    txn => orderIdsForChapter.has(txn.order_id)
  );
  console.log("Successful transactions:", successful.length); // Debug log

  // Sort by payment_time (most recent first)
  successful.sort((a, b) => {
    const dateA = a.payment_time ? new Date(a.payment_time) : new Date(0);
    const dateB = b.payment_time ? new Date(b.payment_time) : new Date(0);
    return dateB - dateA;
  });

  // Clear the table body
  tableBody.innerHTML = "";

  if (successful.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="9" class="text-center">No transactions found</td>
    `;
    tableBody.appendChild(row);
    return;
  }

  // Rest of your existing rendering code...
  successful.forEach((txn, idx) => {
    const order = ordersForChapter.find(order => order.order_id === txn.order_id);
    console.log("Processing transaction:", txn.order_id); // Debug log

    // Enhanced payment method detection logic
    let paymentMethod = "N/A";
    let paymentImage = "";
    
    console.log("Full transaction object:", txn); // Debug log
    console.log("Payment method data:", txn.payment_method); // Debug log

    if (txn.payment_method) {
      // First try to parse if it's a string
      let paymentMethodObj = txn.payment_method;
      if (typeof txn.payment_method === 'string') {
        try {
          paymentMethodObj = JSON.parse(txn.payment_method);
        } catch (e) {
          console.log("Payment method is string but not JSON:", txn.payment_method);
        }
      }

      // Now check for payment method
      if (typeof paymentMethodObj === 'object') {
        if (paymentMethodObj.upi || txn.payment_type === 'upi') {
          paymentMethod = "UPI";
          paymentImage = '<img src="https://economictimes.indiatimes.com/thumb/msid-74960608,width-1200,height-900,resizemode-4,imgsize-49172/upi-twitter.jpg?from=mdr" alt="UPI" width="30" height="30">';
        } else if (paymentMethodObj.card || txn.payment_type === 'card') {
          paymentMethod = "Card";
          paymentImage = '<img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" alt="Card" width="20" height="20">';
        } else if (paymentMethodObj.netbanking || txn.payment_type === 'netbanking') {
          paymentMethod = "Net Banking";
          paymentImage = '<img src="https://cdn.prod.website-files.com/64199d190fc7afa82666d89c/648b63af41676287e601542d_regular-bank-transfer.png" alt="Net Banking" width="20" height="20">';
        } else if (paymentMethodObj.wallet || txn.payment_type === 'wallet') {
          paymentMethod = "Wallet";
          paymentImage = '<img src="https://ibsintelligence.com/wp-content/uploads/2024/01/digital-wallet-application-mobile-internet-banking-online-payment-security-via-credit-card_228260-825.jpg" alt="Wallet" width="20" height="20">';
        }
      } else {
        // If payment_method is a direct string
        switch(txn.payment_method.toLowerCase()) {
          case 'upi':
            paymentMethod = "UPI";
            paymentImage = '<img src="https://economictimes.indiatimes.com/thumb/msid-74960608,width-1200,height-900,resizemode-4,imgsize-49172/upi-twitter.jpg?from=mdr" alt="UPI" width="30" height="30">';
            break;
          case 'card':
            paymentMethod = "Card";
            paymentImage = '<img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" alt="Card" width="20" height="20">';
            break;
          case 'netbanking':
            paymentMethod = "Net Banking";
            paymentImage = '<img src="https://cdn.prod.website-files.com/64199d190fc7afa82666d89c/648b63af41676287e601542d_regular-bank-transfer.png" alt="Net Banking" width="20" height="20">';
            break;
          case 'wallet':
            paymentMethod = "Wallet";
            paymentImage = '<img src="https://ibsintelligence.com/wp-content/uploads/2024/01/digital-wallet-application-mobile-internet-banking-online-payment-security-via-credit-card_228260-825.jpg" alt="Wallet" width="20" height="20">';
            break;
        }
      }
    }

    // Also check payment_type if payment_method didn't give us anything
    if (paymentMethod === "N/A" && txn.payment_type) {
      switch(txn.payment_type.toLowerCase()) {
        case 'upi':
          paymentMethod = "UPI";
          paymentImage = '<img src="https://economictimes.indiatimes.com/thumb/msid-74960608,width-1200,height-900,resizemode-4,imgsize-49172/upi-twitter.jpg?from=mdr" alt="UPI" width="30" height="30">';
          break;
        case 'card':
          paymentMethod = "Card";
          paymentImage = '<img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" alt="Card" width="20" height="20">';
          break;
        case 'netbanking':
          paymentMethod = "Net Banking";
          paymentImage = '<img src="https://cdn.prod.website-files.com/64199d190fc7afa82666d89c/648b63af41676287e601542d_regular-bank-transfer.png" alt="Net Banking" width="20" height="20">';
          break;
        case 'wallet':
          paymentMethod = "Wallet";
          paymentImage = '<img src="https://ibsintelligence.com/wp-content/uploads/2024/01/digital-wallet-application-mobile-internet-banking-online-payment-security-via-credit-card_228260-825.jpg" alt="Wallet" width="20" height="20">';
          break;
      }
    }

    // Render row...
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td style="font-weight: 600">${new Date(txn.payment_time).toLocaleDateString("en-IN", { timeZone: "UTC" })}</td>
      <td style="font-weight: 600">
        ${(order?.payment_note === "visitor-payment" || order?.payment_note === "Visitor Payment") ? 
            `<div style="display: flex; flex-direction: column; gap: 4px;">
                <span>${order.visitor_name || "N/A"}</span>
                <span style="font-size: 0.85em; color: #666; display: flex; align-items: center;">
                    <i class="ri-user-follow-line" style="margin-right: 4px;"></i>
                    Invited by - ${order.member_name || "N/A"}
                </span>
            </div>` 
            : 
            order?.member_name || "N/A"
        }</td>
      <td><b>₹${txn.payment_amount}</b><br><a href="/ck/chapter-kittyInvoice?order_id=${txn.order_id}" class="fw-medium text-success">View</a></td>
      <td style="font-weight: 600">${paymentImage} ${paymentMethod}</td>
      <td style="font-weight: 500; font-style: italic">${txn.order_id || "N/A"}</td>
      <td><b>${txn.cf_payment_id}</b></td>
      <td><span class="${getPgStatusBadge(txn.payment_status)}">${txn.payment_status}</span></td>
      <td><b>${order?.payment_gateway_id ? getGatewayName(order.payment_gateway_id) : "N/A"}</b></td>
    `;
    tableBody.appendChild(row);
  });

  // Initialize sorting
  const table = tableBody.closest('table');
  if (table) {
    initializeTableSorting(table);
  }
}

// Add this function to handle table sorting
function initializeTableSorting(table) {
  if (!table) return;

  table.querySelectorAll('th').forEach((th, idx) => {
    const sortIcons = th.querySelector('.sort-icons');
    if (!sortIcons) return;

    // Detect column type
    let type = 'string';
    const headerText = th.textContent.toLowerCase();
    if (headerText.includes('date')) type = 'date';
    if (headerText.includes('amount')) type = 'number';

    // Add click handlers for sort icons
    const up = sortIcons.querySelector('.ti-arrow-up');
    const down = sortIcons.querySelector('.ti-arrow-down');

    if (up) {
      up.style.cursor = 'pointer';
      up.addEventListener('click', () => sortTable(table, idx, type, true));
    }
    if (down) {
      down.style.cursor = 'pointer';
      down.addEventListener('click', () => sortTable(table, idx, type, false));
    }
  });
}

// First, define the function
async function fetchVisitorAmountTotal(chapterId) {
    console.log('🚀 Starting fetchVisitorAmountTotal');
    console.log('📍 Chapter ID received:', chapterId);
    
    if (!chapterId) {
        console.error('❌ No chapter ID provided!');
        return 0;
    }

    try {
        // 1. Fetch Orders
        console.log('📥 Fetching orders...');
        const ordersResponse = await fetch("http://localhost:5000/api/allOrders");
        const allOrders = await ordersResponse.json();
        console.log('📦 Total orders:', allOrders.length);

        // 2. Filter Visitor Orders
        const visitorOrders = allOrders.filter(order => {
            const matches = order.chapter_id == chapterId && (order.payment_note === "visitor-payment" || order.payment_note === "Visitor Payment");
            console.log(`Order ${order.order_id}:`, {
                chapter_id: order.chapter_id,
                payment_note: order.payment_note,
                matches: matches
            });
            return matches;
        });
        
        console.log('🎯 Filtered visitor orders:', visitorOrders.length);

        // 3. Fetch Transactions
        console.log('💳 Fetching transactions...');
        const transactionsResponse = await fetch("http://localhost:5000/api/allTransactions");
        const allTransactions = await transactionsResponse.json();
        console.log('Total transactions:', allTransactions.length);

        // 4. Get Successful Orders
        const successfulOrders = visitorOrders.filter(order => {
            const transaction = allTransactions.find(t => 
                t.order_id === order.order_id && 
                t.payment_status === 'SUCCESS'
            );
            if (transaction) {
                console.log(`✅ Found successful transaction for order ${order.order_id}`);
            }
            return transaction;
        });

        console.log('💫 Successful visitor orders:', successfulOrders.length);

        // 5. Calculate Total with GST handling and payment mode tracking
        let totalAmount = 0;
        let cashPayments = 0;
        let onlinePayments = 0;
        
        // Store payment details for modal
        const cashPaymentDetails = [];
        const onlinePaymentDetails = [];

        successfulOrders.forEach(order => {
            const transaction = allTransactions.find(t => t.order_id === order.order_id);
            let amount = parseFloat(order.order_amount || 0);
            
            // Handle GST and payment mode
            if (order.payment_note === "visitor-payment") {
                // Online payment - subtract GST
                amount = Math.ceil(amount - (amount * 18) / 118);
                onlinePayments += amount;
                console.log(`💰 Added online payment ${amount} from order ${order.order_id}`);
                
                // Store online payment details
                onlinePaymentDetails.push({
                    visitorName: order.visitor_name || "N/A",
                    invitedBy: order.member_name || "N/A",
                    amount: amount,
                    date: new Date(transaction.payment_time).toLocaleDateString("en-IN", { timeZone: "UTC" }),
                    transactionId: transaction.cf_payment_id || "N/A"
                });
            } else if (order.payment_note === "Visitor Payment") {
                // Cash payment - use full amount
                cashPayments += amount;
                console.log(`💰 Added cash payment ${amount} from order ${order.order_id}`);
                
                // Store cash payment details
                cashPaymentDetails.push({
                    visitorName: order.visitor_name || "N/A",
                    invitedBy: order.member_name || "N/A",
                    amount: amount,
                    date: new Date(order.created_at).toLocaleDateString("en-IN")
                });
            }
            
            totalAmount += amount;
        });

        console.log('📊 Final visitor amount total:', totalAmount);
        console.log('💵 Cash payments:', cashPayments);
        console.log('💳 Online payments:', onlinePayments);

        // 6. Update UI with payment mode breakdown
        const amountElement = document.querySelector('#total_V_amount');
        if (amountElement) {
            amountElement.innerHTML = `
                <div class="d-flex flex-column">
                    <span>₹ ${totalAmount.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                    })}</span>
                    <span class="ms-2 fs-12 fw-semibold" style="color: #666;">
                        Cash: ₹${cashPayments.toLocaleString('en-IN', {maximumFractionDigits: 2})} | 
                        Online: ₹${onlinePayments.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                    </span>
                </div>
            `;
            
            // Add click handler to show modal
            amountElement.style.cursor = 'pointer';
            amountElement.addEventListener('click', () => {
                // Populate cash payments table
                const cashTableBody = document.getElementById('cashPaymentsTable');
                cashTableBody.innerHTML = cashPaymentDetails.map(payment => `
                    <tr>
                        <td>${payment.visitorName}</td>
                        <td>${payment.invitedBy}</td>
                        <td>₹${payment.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                        <td>${payment.date}</td>
                    </tr>
                `).join('');

                // Populate online payments table
                const onlineTableBody = document.getElementById('onlinePaymentsTable');
                onlineTableBody.innerHTML = onlinePaymentDetails.map(payment => `
                    <tr>
                        <td>${payment.visitorName}</td>
                        <td>${payment.invitedBy}</td>
                        <td>₹${payment.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                        <td>${payment.date}</td>
                        <td>${payment.transactionId}</td>
                    </tr>
                `).join('');

                // Show modal
                const visitorPaymentModal = new bootstrap.Modal(document.getElementById('visitorPaymentModal'));
                visitorPaymentModal.show();
            });
            
            console.log('✨ UI updated successfully');
        } else {
            console.error('❌ Element #total_V_amount not found');
        }

        return totalAmount;

    } catch (error) {
        console.error('❌ Error:', error);
        return 0;
    }
}

// Now, let's make sure it's called at the right time
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM Content Loaded');
    
    // Get chapter ID from localStorage
    const chapterId = localStorage.getItem('current_chapter_id');
    console.log('📌 Retrieved chapter ID from localStorage:', chapterId);
    
    if (chapterId) {
        console.log('🚀 Calling fetchVisitorAmountTotal with chapter ID:', chapterId);
        fetchVisitorAmountTotal(chapterId);
    } else {
        console.error('❌ No chapter ID found in localStorage');
    }
});

// Function to calculate total received amount from all kitty payments
async function calculateTotalReceivedAmount(chapterId, allOrders, allTransactions) {
  let totalReceived = 0;
  
  // Filter orders only by chapter and payment note
  const kittyOrders = allOrders.filter(order =>
    order.chapter_id === chapterId &&
    (order.payment_note === "meeting-payments" ||
     order.payment_note === "meeting-payments-opening-only")
  );

  // Calculate total received from successful transactions
  kittyOrders.forEach(order => {
    const transaction = allTransactions.find(
      tran => tran.order_id === order.order_id && tran.payment_status === "SUCCESS"
    );

    if (transaction) {
      const payamount = Math.ceil(
        parseFloat(transaction.payment_amount) -
        (parseFloat(transaction.payment_amount) * 18) / 118
      );
      totalReceived += parseFloat(payamount);
    }
  });

  return totalReceived;
}

// Function to calculate manual/cash payments
async function calculateManualPayments(chapterId, allOrders, allTransactions, available_fund) {
  console.log('Starting calculateManualPayments with:', { chapterId, available_fund });
  let totalManualAmount = parseFloat(available_fund || 0);  // Start with available_fund
  console.log('Initial totalManualAmount:', totalManualAmount);
  
  // Filter orders for the chapter - include both meeting and visitor payments
  const chapterOrders = allOrders.filter(order =>
    order.chapter_id === chapterId &&
    (
      order.payment_note === "meeting-payments" ||
      order.payment_note === "meeting-payments-opening-only" ||
      order.payment_note === "visitor-payment" ||
      order.payment_note === "Visitor Payment"
    )
  );
  console.log('Filtered chapter orders:', chapterOrders.length);

  // Calculate total from successful cash transactions
  chapterOrders.forEach(order => {
    const transaction = allTransactions.find(
      tran => tran.order_id === order.order_id && 
              tran.payment_status === "SUCCESS" &&
              (tran.payment_method?.cash || order.payment_note === "Visitor Payment")
    );

    if (transaction) {
      // For cash payments, use full amount
      const amountToAdd = parseFloat(transaction.payment_amount || 0);
      totalManualAmount += amountToAdd;

      // Log for debugging
      console.log(`Added cash payment:`, {
        orderId: order.order_id,
        amount: transaction.payment_amount,
        paymentNote: order.payment_note,
        newTotal: totalManualAmount
      });
    }
  });

  // Fetch and add other payments
  try {
    const response = await fetch("http://localhost:5000/api/allOtherPayment");
    const otherPayments = await response.json();
    
    // Filter cash payments for current chapter
    const chapterOtherPayments = otherPayments.filter(payment => 
      payment.chapter_id === chapterId &&
      payment.mode_of_payment === 'cash'
    );
    
    console.log('Found cash other payments for chapter:', chapterOtherPayments.length);
    
    chapterOtherPayments.forEach(payment => {
      const amount = parseFloat(payment.total_amount || 0);
      totalManualAmount += amount;
      console.log(`Added other payment:`, {
        paymentId: payment.payment_id,
        amount: amount,
        newTotal: totalManualAmount
      });
    });
  } catch (error) {
    console.error('Error fetching other payments:', error);
  }

  console.log('Final totalManualAmount:', totalManualAmount);
  return totalManualAmount;
}

// Function to fetch and calculate other payments total
async function fetchOtherPaymentsTotal(chapterId) {
  try {
    console.log('Fetching other payments for chapter:', chapterId);
    const response = await fetch("http://localhost:5000/api/allOtherPayment");
    const otherPayments = await response.json();
    
    // Filter payments for current chapter
    const chapterOtherPayments = otherPayments.filter(payment => 
      payment.chapter_id === chapterId
    );
    
    console.log('Found other payments for chapter:', chapterOtherPayments.length);
    
    let totalOtherPayments = 0;
    let cashPayments = 0;
    let onlinePayments = 0;

    chapterOtherPayments.forEach(payment => {
      console.log('Processing payment:', payment);
      
      // Add total amount regardless of GST
      totalOtherPayments += parseFloat(payment.total_amount || 0);
      
      // Track payment mode
      if (payment.mode_of_payment === 'cash') {
        cashPayments += parseFloat(payment.total_amount || 0);
      } else {
        onlinePayments += parseFloat(payment.total_amount || 0);
      }
      
      console.log('Added payment amount:', payment.total_amount, 'Mode:', payment.mode_of_payment);
    });
    
    console.log('Total other payments calculated:', totalOtherPayments);
    console.log('Cash payments:', cashPayments);
    console.log('Online payments:', onlinePayments);

    // Update UI to show payment mode breakdown if needed
    const otherPaymentsElement = document.querySelector('#total_other_payments');
    if (otherPaymentsElement) {
      otherPaymentsElement.innerHTML = `
        <div class="d-flex flex-column">
          <span>Total: ₹${totalOtherPayments.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
          <small class="text-muted">
            Cash: ₹${cashPayments.toLocaleString('en-IN', {maximumFractionDigits: 2})} | 
            Online: ₹${onlinePayments.toLocaleString('en-IN', {maximumFractionDigits: 2})}
          </small>
        </div>
      `;
    }

    return totalOtherPayments;
  } catch (error) {
    console.error("Error fetching other payments:", error);
    return 0;
  }
}

// Update the fund breakdown modal function
function updateFundBreakdownModal(available_fund, totalReceivedAmount, visitorAmountTotal, total_paid_expense, otherPaymentsTotal, allOrders, allTransactions, chapterId) {
  // Get modal elements
  const openingBalance = document.getElementById('modal-opening-balance');
  const meetingPaymentsElem = document.getElementById('modal-meeting-payments');
  const visitorPayments = document.getElementById('modal-visitor-payments');
  const otherPayments = document.getElementById('modal-other-payments');
  const paidExpenses = document.getElementById('modal-paid-expenses');
  const totalAvailable = document.getElementById('modal-total-available');

  // Format currency
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });

  // Update modal values
  openingBalance.textContent = formatter.format(parseFloat(available_fund || 0));
  
  // Calculate meeting payments using the same logic as calculateTotalReceivedAmount
  let meetingPaymentsAmount = 0;
  const kittyOrders = allOrders.filter(order =>
    String(order.chapter_id) === String(chapterId) &&
    (order.payment_note === "meeting-payments" ||
     order.payment_note === "meeting-payments-opening-only")
  );
  kittyOrders.forEach(order => {
    const transaction = allTransactions.find(
      tran => tran.order_id === order.order_id && tran.payment_status === "SUCCESS"
    );
    if (transaction) {
      let amount = 0;
      if (order.order_amount && order.tax) {
        amount = parseFloat(order.order_amount) - parseFloat(order.tax);
      } else if (transaction.payment_amount && order.tax) {
        amount = parseFloat(transaction.payment_amount) - parseFloat(order.tax);
      } else {
        amount = parseFloat(transaction.payment_amount || 0);
      }
      meetingPaymentsAmount += amount;
    }
  });

  // Use meetingPaymentsAmount for both modal and dashboard card
  meetingPaymentsElem.textContent = formatter.format(meetingPaymentsAmount);
  visitorPayments.textContent = formatter.format(visitorAmountTotal || 0);
  otherPayments.textContent = formatter.format(otherPaymentsTotal || 0);
  paidExpenses.textContent = formatter.format(total_paid_expense || 0);
  
  // Calculate and display total using the calculated meeting payments
  const total = parseFloat(available_fund || 0) + 
                parseFloat(meetingPaymentsAmount || 0) + 
                parseFloat(visitorAmountTotal || 0) + 
                parseFloat(otherPaymentsTotal || 0) - 
                parseFloat(total_paid_expense || 0);
  totalAvailable.textContent = formatter.format(total);

  // Update the dashboard card as well
  const totalAvailableElement = document.querySelector("#total_available_amount");
  if (totalAvailableElement) {
    totalAvailableElement.textContent = formatter.format(total);
  }
}

// Add this function to handle paid expenses
async function fetchAndDisplayPaidExpenses(chapterId) {
    try {
        console.log('📊 Starting fetchAndDisplayPaidExpenses');
        
        // Fetch expenses
        const expenseResponse = await fetch("http://localhost:5000/api/allExpenses");
        const expenses = await expenseResponse.json();
        
        // Filter expenses for current chapter and paid status
        const chapterExpenses = expenses.filter(expense => 
            expense.chapter_id === chapterId && 
            expense.payment_status === "paid"
        );
        
        console.log('Found paid expenses:', chapterExpenses.length);
        
        // Separate cash and online expenses
        const cashExpenses = [];
        const onlineExpenses = [];
        let totalCashAmount = 0;
        let totalOnlineAmount = 0;
        
        chapterExpenses.forEach(expense => {
            const amount = parseFloat(expense.amount || 0);
            const expenseData = {
                title: expense.expense_title || "N/A",
                description: expense.description || "N/A",
                amount: amount,
                date: new Date(expense.created_at).toLocaleDateString("en-IN"),
                paidBy: expense.paid_by || "N/A",
                transactionId: expense.transaction_id || "N/A"
            };
            
            if (expense.payment_mode === "cash") {
                cashExpenses.push(expenseData);
                totalCashAmount += amount;
            } else {
                onlineExpenses.push(expenseData);
                totalOnlineAmount += amount;
            }
        });
        
        // Update the total paid expense display
        const totalPaidElementMain = document.querySelector('#total_expense_amount_main');
        const totalPaidBreakdown = document.querySelector('#total_expense_breakdown');
        if (totalPaidElementMain && totalPaidBreakdown) {
            const totalAmount = totalCashAmount + totalOnlineAmount;
            totalPaidElementMain.textContent = `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
            totalPaidBreakdown.innerHTML = `
                <span class="ms-2 fs-12 fw-semibold" style="color: #666;">
                    Cash: ₹${totalCashAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})} | 
                    Online: ₹${totalOnlineAmount.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                </span>
            `;
            // Add click handler to show modal on main amount
            totalPaidElementMain.style.cursor = 'pointer';
            totalPaidElementMain.addEventListener('click', () => {
                // Populate cash expenses table
                const cashTableBody = document.getElementById('cashExpensesTable');
                cashTableBody.innerHTML = cashExpenses.map(expense => `
                    <tr>
                        <td>${expense.title}</td>
                        <td>${expense.description}</td>
                        <td>₹${expense.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                        <td>${expense.date}</td>
                        <td>${expense.paidBy}</td>
                    </tr>
                `).join('');

                // Populate online expenses table
                const onlineTableBody = document.getElementById('onlineExpensesTable');
                onlineTableBody.innerHTML = onlineExpenses.map(expense => `
                    <tr>
                        <td>${expense.title}</td>
                        <td>${expense.description}</td>
                        <td>₹${expense.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                        <td>${expense.date}</td>
                        <td>${expense.paidBy}</td>
                        <td>${expense.transactionId}</td>
                    </tr>
                `).join('');

                // Show modal
                const paidExpensesModal = new bootstrap.Modal(document.getElementById('paidExpensesModal'));
                paidExpensesModal.show();
            });
        }
        
        return totalCashAmount + totalOnlineAmount;
    } catch (error) {
        console.error('Error fetching paid expenses:', error);
        return 0;
    }
}
