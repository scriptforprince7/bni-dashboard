// Add these variables at the top of your code to store filter selections
let selectedGateway = null;
let selectedMonth = null;
let selectedPgStatus = null;
let selectedMethod = null;
let total_pending_expense = 0;
let total_paid_expense = 0;
let pendingAmount = 0;

// Function to populate Gateway filter dropdown
async function populateGatewayFilter() {
  try {
    const response = await fetch(
      "https://backend.bninewdelhi.com/api/paymentGateway"
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
        "https://backend.bninewdelhi.com/api/chapters"
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

    // Fetch write-off data and calculate total
    console.log("Fetching write-off data for chapter:", chapter_id);
    const writeoffResponse = await fetch(
      "https://backend.bninewdelhi.com/api/getAllMemberWriteOff"
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
      "https://backend.bninewdelhi.com/api/chapters"
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
    let visitorAmountTotal = 0;
    async function fetchVisitorAmountTotal(chapterId) {
      try {
        // Fetch all orders
        const ordersResponse = await fetch("https://backend.bninewdelhi.com/api/allOrders");
        const allOrders = await ordersResponse.json();
    
        // Filter orders based on chapter_id, universal_link_id, and payment_note
        const filteredOrders = allOrders.filter(order =>
          order.chapter_id == chapterId &&    // Use == not === because API may return string
          order.universal_link_id == 5 &&
          order.payment_note === 'visitor-payment'
        );
    
        // Fetch all transactions
        const transactionsResponse = await fetch("https://backend.bninewdelhi.com/api/allTransactions");
        const allTransactions = await transactionsResponse.json();
    
        // Find successful order IDs
        const successfulOrderIds = new Set(
          allTransactions
            .filter(txn => txn.payment_status === 'SUCCESS')
            .map(txn => txn.order_id)   // Assuming transaction has 'order_id'
        );
    
        // Filter successful orders
        const successfulOrders = filteredOrders.filter(order =>
          successfulOrderIds.has(order.order_id)
        );
    
        // Sum the order_amount of successful orders
        const visitorAmountTotal = successfulOrders.reduce((sum, order) => {
          return sum + parseFloat(order.order_amount || 0);
        }, 0);
    
        console.log("Visitor Amount Total:", visitorAmountTotal); // Check if it comes correctly
    
        // Update the DOM safely
        const amountElement = document.querySelector('#total_V_amount');
        if (amountElement) {
          amountElement.textContent = `₹ ${visitorAmountTotal}`;
        } else {
          console.error("Element #total_V_amount not found");
        }
    
      } catch (error) {
        console.error("Error fetching visitor amount total:", error);
      }
    }
    
    // Now call this function safely after DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      fetchVisitorAmountTotal(chapterId);  // Make sure chapterId is defined
    });
    
    

    // Add calculation here
    console.log("📊 Starting member opening balance calculation");
    const membersResponse = await fetch(
      "https://backend.bninewdelhi.com/api/members"
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
      "https://backend.bninewdelhi.com/api/getbankOrder"
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
      "https://backend.bninewdelhi.com/api/allExpenses"
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

    const creditResponse = await fetch(
      "https://backend.bninewdelhi.com/api/getAllMemberCredit"
    );
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
      totalCreditAmount += parseFloat(credit.credit_amount);
    });
    console.log("Total Credit Amount:", totalCreditAmount);


    // Step 3: Fetch kitty payments using chapter_id
    const kittyResponse = await fetch(
      "https://backend.bninewdelhi.com/api/getKittyPayments"
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
          "https://backend.bninewdelhi.com/api/allOrders"
        );
        const allOrders = await ordersResponse.json();

        // Filter orders for the chapter with universal_link_id === 4
        const chapterOrders = allOrders.filter(
          (order) =>
            order.chapter_id === chapterId &&
            order.universal_link_id === 4 &&
            (order.kitty_bill_id === chapterKittyPayment?.kitty_bill_id ||
              order.kitty_bill_id === null) &&
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
            "https://backend.bninewdelhi.com/api/allTransactions"
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
                    <td style="font-weight: 600">${
                      order.member_name || "N/A"
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

          let availableAmount =
            parseFloat(available_fund) -
            parseFloat(total_paid_expense) +
            parseFloat(ReceivedAmount) + parseFloat(visitorAmountTotal);
          const formattedAvailableAmount =
            indianCurrencyFormatter.format(availableAmount);
          document.getElementById("totalKittyAmountReceived").textContent =
            indianCurrencyFormatter.format(
              parseFloat(totalKittyAmountReceived)
            );
          document.querySelector("#total_available_amount").textContent =
            formattedAvailableAmount;

          return;
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
      "https://backend.bninewdelhi.com/api/allOrders"
    );
    const allOrders = await ordersResponse.json();

    // Filter orders for the chapter with universal_link_id === 4
    const chapterOrders = allOrders.filter(
      (order) =>
        order.chapter_id === chapterId &&
        order.universal_link_id === 4 &&
        (order.kitty_bill_id === kitty_bill_id ||
          order.kitty_bill_id === null) &&
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
      "https://backend.bninewdelhi.com/api/allTransactions"
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

    // const pendingBalanceResponse = await fetch('https://backend.bninewdelhi.com/api/memberPendingKittyOpeningBalance');
    // const pendingBalances = await pendingBalanceResponse.json();

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
                    <td style="font-weight: 600">${
                      order.member_name || "N/A"
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
    const formattedTotalRaised =
      indianCurrencyFormatter.format(totalAmountRaised);
    const formattedKittyReceived = indianCurrencyFormatter.format(
      totalKittyAmountReceived
    );
    // const formattedKittyPending = indianCurrencyFormatter.format(totalKittyAmountPending);
    const formattedMiscellaneousAmount = indianCurrencyFormatter.format(
      totalPendingMiscellaneousAmount
    );
    const formattedTotalPaidExpense =
      indianCurrencyFormatter.format(total_paid_expense);
    let availableAmount =
      parseFloat(available_fund) -
      parseFloat(total_paid_expense) + parseFloat(visitorAmountTotal) +
      parseFloat(ReceivedAmount);
    const formattedAvailableAmount =
      indianCurrencyFormatter.format(availableAmount);

    // Step 9: Update the UI with fetched values
    document.querySelector(".total_bill_amount").textContent =
      formattedBillAmount;
    document.querySelector(".total_kitty_amount_received").textContent =
      formattedKittyReceived;
    // document.querySelector('.total_kitty_amount_pending').textContent = formattedKittyPending;
    document.querySelector(".bill_type").textContent = bill_type;
    document.querySelector(".description").textContent = description;
    document.querySelector(".total_weeks").textContent = total_weeks;
    document.querySelector(".member_count").textContent = memberCount;
    document.querySelector(".total_miscellaneous_amount").textContent =
      formattedMiscellaneousAmount;
    document.querySelector("#total_expense_amount").textContent =
      formattedTotalPaidExpense;
    document.querySelector("#total_pexpense_amount").textContent =
      indianCurrencyFormatter.format(total_pending_expense);
    document.querySelector("#total_available_amount").textContent =
      formattedAvailableAmount;
    document.querySelector("#total_credit_amount").textContent =
      indianCurrencyFormatter.format(totalCreditAmount);
    document.querySelector("#no_of_late_payment").textContent =
      totalLatePayment;

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
          sortTable(idx, type, true);
        });
      }
      // Down arrow (descending)
      const down = sortIcons.querySelector('.ti-arrow-down');
      if (down) {
        down.style.cursor = 'pointer';
        down.addEventListener('click', function (e) {
          e.stopPropagation();
          sortTable(idx, type, false);
        });
      }
    });

    function sortTable(idx, type, asc) {
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => row.style.display !== 'none');
      rows.sort(comparer(idx, type, asc));
      // Remove all rows and re-append in sorted order
      rows.forEach(row => tbody.appendChild(row));
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
      <td style="font-weight: 600">${order?.member_name || "N/A"}</td>
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