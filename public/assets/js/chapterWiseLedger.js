// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.error("Error: incoming date is not valid");
    return "Invalid Date";
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Global variable for ledger data
let ledgerData = [];

(async function generateChapterLedger() {
  let currentBalance = 0;
  let totalKittyAmount = 0;
  let totalExpenseAmount = 0;
  let totalVisitorAmount = 0;
  let cashExpenseAmount = 0;
  let onlineExpenseAmount = 0;
  let cashVisitorAmount = 0;
  let onlineVisitorAmount = 0;

  try {
    showLoader();
    console.log("=== Chapter Ledger Loading Process Started ===");

    // Step 1: Get logged-in chapter email and type
    console.log("Step 1: Getting user login type...");
    const loginType = getUserLoginType();
    console.log("Detected login type:", loginType);

    let chapterEmail;
    let chapterId;

    if (loginType === "ro_admin") {
      console.log("RO Admin detected, fetching from localStorage...");
      chapterEmail = localStorage.getItem("current_chapter_email");
      chapterId = parseInt(localStorage.getItem("current_chapter_id"));

      console.log("localStorage data found:", {
        email: chapterEmail,
        id: chapterId
      });

      if (!chapterEmail || !chapterId) {
        console.error("CRITICAL: Missing localStorage data for RO Admin");
        hideLoader();
        return;
      }
    } else {
      console.log("Regular chapter login detected, getting email from token...");
      chapterEmail = getUserEmail();
    }

    // Step 2: Fetch chapter details
    console.log("Step 2: Fetching chapter details...");
    const chaptersResponse = await fetch("https://backend.bninewdelhi.com/api/chapters");
    const chapters = await chaptersResponse.json();
    console.log("Chapters data received:", chapters.length, "chapters");

    let loggedInChapter;
    if (loginType === "ro_admin") {
      loggedInChapter = chapters.find(chapter => chapter.chapter_id === chapterId);
    } else {
      loggedInChapter = chapters.find(chapter =>
        chapter.email_id === chapterEmail ||
        chapter.vice_president_mail === chapterEmail ||
        chapter.president_mail === chapterEmail ||
        chapter.treasurer_mail === chapterEmail
      );
      if (loggedInChapter) {
        chapterId = loggedInChapter.chapter_id;
      }
    }

    console.log("Found chapter:", loggedInChapter);

    if (!loggedInChapter) {
      console.error("ERROR: No chapter found");
      hideLoader();
      return;
    }

    // Initialize ledger with opening balance (available_fund)
    currentBalance = parseFloat(loggedInChapter.available_fund) || 0;
    console.log("Initial balance:", currentBalance);

    // Update opening balance display
    document.getElementById("opening-balance").textContent = formatCurrency(currentBalance);

    ledgerData = [{
      sNo: 1,
      date: formatDate(loggedInChapter.date_of_publishing || new Date()),
      description: "Opening Balance",
      billAmount: 0,
      debit: 0,
      credit: currentBalance,
      gst: 0,
      balance: currentBalance,
      balanceColor: currentBalance >= 0 ? "green" : "red"
    }];

    // Fetch all orders, transactions and expenses
    console.log("Fetching transactions data...");
    const [ordersResponse, transactionsResponse, expensesResponse] = await Promise.all([
      fetch("https://backend.bninewdelhi.com/api/allOrders"),
      fetch("https://backend.bninewdelhi.com/api/allTransactions"),
      fetch("https://backend.bninewdelhi.com/api/allExpenses")
    ]);

    const [allOrders, allTransactions, allExpenses] = await Promise.all([
      ordersResponse.json(),
      transactionsResponse.json(),
      expensesResponse.json()
    ]);

    // Filter orders for current chapter
    console.log("Filtering orders for chapter:", chapterId);
    const chapterOrders = allOrders.filter(order => 
      parseInt(order.chapter_id) === chapterId && 
      (order.payment_note === "meeting-payments" || 
       order.payment_note === "visitor-payment" ||
       order.payment_note === "Visitor Payment")
    );
    console.log("Found chapter orders:", chapterOrders.length);

    // Process all orders chronologically
    const allTransactionItems = [];

    // Add kitty and visitor payments
    chapterOrders.forEach(order => {
      const successfulTransaction = allTransactions.find(
        transaction => 
          transaction.order_id === order.order_id && 
          transaction.payment_status === "SUCCESS"
      );

      if (successfulTransaction) {
        const amount = parseFloat(successfulTransaction.payment_amount) - parseFloat(order.tax);
        const gst = parseFloat(order.tax);
        const isKittyPayment = order.payment_note === "meeting-payments";
        const isVisitorPayment = order.payment_note === "visitor-payment" || order.payment_note === "Visitor Payment";
        
        // Determine payment method
        let paymentMethod = "N/A";
        if (successfulTransaction.payment_method) {
          if (typeof successfulTransaction.payment_method === 'string') {
            try {
              const paymentMethodObj = JSON.parse(successfulTransaction.payment_method);
              if (paymentMethodObj.upi) paymentMethod = "UPI";
              else if (paymentMethodObj.netbanking) paymentMethod = "Net Banking";
              else if (paymentMethodObj.card) paymentMethod = "Card";
              else if (paymentMethodObj.cash) paymentMethod = "Cash";
            } catch (e) {
              paymentMethod = successfulTransaction.payment_method;
            }
          } else {
            if (successfulTransaction.payment_method.upi) paymentMethod = "UPI";
            else if (successfulTransaction.payment_method.netbanking) paymentMethod = "Net Banking";
            else if (successfulTransaction.payment_method.card) paymentMethod = "Card";
            else if (successfulTransaction.payment_method.cash) paymentMethod = "Cash";
          }
        }

        let description;
        if (isKittyPayment) {
          description = `Meeting Fee - ${order.member_name}<br>
                        <small class="text-muted">
                          ${order.company || 'N/A'} | ${paymentMethod}
                        </small>`;
        } else if (isVisitorPayment) {
          description = `<div style="display: flex; align-items: center; gap: 8px;">
                          <div style="background-color: #4CAF50; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            V
                          </div>
                          <div>
                            <span style="color: #4CAF50; font-weight: 500;">Visitor Fee - ${order.visitor_name || 'N/A'}</span><br>
                            <small class="text-muted">
                              Invited by ${order.member_name || 'N/A'} | ${paymentMethod}
                            </small>
                          </div>
                        </div>`;
        }

        allTransactionItems.push({
          date: new Date(successfulTransaction.payment_time),
          type: isKittyPayment ? "kitty" : "visitor",
          description: description,
          amount: amount,
          gst: gst,
          totalAmount: amount + gst,
          paymentMethod: paymentMethod
        });

        if (isKittyPayment) {
          totalKittyAmount += amount;
        } else if (isVisitorPayment) {
          totalVisitorAmount += amount;
          // Track visitor payments by mode
          if (successfulTransaction.payment_method?.cash || paymentMethod.toLowerCase() === 'cash') {
            cashVisitorAmount += amount;
          } else {
            onlineVisitorAmount += amount;
          }
          console.log("Added visitor payment:", {
            visitorName: order.visitor_name,
            amount: amount,
            totalVisitorAmount: totalVisitorAmount,
            paymentMethod: paymentMethod
          });
        }
      }
    });

    // Add expenses
    console.log("Processing expenses for chapter:", chapterId);
    const chapterExpenses = allExpenses.filter(expense => 
      parseInt(expense.chapter_id) === chapterId && 
      expense.delete_status === 0 && 
      expense.payment_status === "paid"
    );
    console.log("Found chapter expenses:", chapterExpenses.length);

    chapterExpenses.forEach(expense => {
      // Parse amounts from expense data
      const baseAmount = parseFloat(expense.amount) || 0;
      const gstAmount = parseFloat(expense.gst_amount) || 0;
      const totalAmount = parseFloat(expense.total_amount) || 0;
      
      // Track expenses by payment mode
      if (expense.mode_of_payment.toLowerCase() === 'cash') {
        cashExpenseAmount += totalAmount;
      } else {
        onlineExpenseAmount += totalAmount;
      }

      totalExpenseAmount += totalAmount;
      
      allTransactionItems.push({
        date: new Date(expense.bill_date),
        type: "expense",
        description: `<div style="display: flex; align-items: center; gap: 8px;">
                       <div style="background-color: #ff4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                         E
                       </div>
                       <div>
                         <span style="color: #ff4444; font-weight: 500;">${expense.description}</span><br>
                         <small class="text-muted">
                           By: ${expense.submitted_by} | ${expense.mode_of_payment}
                           ${expense.bill_no ? ' | Bill #' + expense.bill_no : ''}
                         </small>
                       </div>
                     </div>`,
        amount: baseAmount,
        gst: gstAmount,
        totalAmount: totalAmount,
        modeOfPayment: expense.mode_of_payment,
        submittedBy: expense.submitted_by
      });
    });

    // Sort all items by date
    allTransactionItems.sort((a, b) => a.date - b.date);
    console.log("Total transaction items:", allTransactionItems.length);

    // Generate ledger entries
    allTransactionItems.forEach(item => {
      if (item.type === "expense") {
        currentBalance -= item.totalAmount;
        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(item.date),
          description: item.description,
          billAmount: Math.round(item.totalAmount * 100) / 100,
          debit: Math.round(item.amount * 100) / 100,
          credit: 0,
          gst: Math.round(item.gst * 100) / 100,
          balance: currentBalance,
          balanceColor: currentBalance >= 0 ? "green" : "red"
        });
      } else {
        currentBalance += (item.amount + item.gst);
        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(item.date),
          description: item.description,
          billAmount: Math.round(item.totalAmount * 100) / 100,
          debit: 0,
          credit: item.amount,
          gst: Math.round(item.gst * 100) / 100,
          balance: currentBalance,
          balanceColor: currentBalance >= 0 ? "green" : "red"
        });
      }
    });

    console.log("Updating UI with totals...");
    // Update UI with totals
    document.getElementById("total-kitty-amount").textContent = formatCurrency(totalKittyAmount);
    
    // Update visitor amount with bifurcation
    const visitorElement = document.getElementById("total-visitor-amount");
    visitorElement.innerHTML = `
      <div>
        ${formatCurrency(totalVisitorAmount)}
        <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
          <span>
            <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(cashVisitorAmount)}
          </span>
          <span style="margin-left: 8px;">
            <i class="ri-bank-card-line"></i> Online: ${formatCurrency(onlineVisitorAmount)}
          </span>
        </div>
      </div>
    `;
    
    // Update expense amount with bifurcation
    const expenseElement = document.getElementById("total-expense-amount");
    expenseElement.innerHTML = `
      <div>
        ${formatCurrency(totalExpenseAmount)}
        <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
          <span>
            <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(cashExpenseAmount)}
          </span>
          <span style="margin-left: 8px;">
            <i class="ri-bank-card-line"></i> Online: ${formatCurrency(onlineExpenseAmount)}
          </span>
        </div>
      </div>
    `;
    
    document.getElementById("current-balance").textContent = formatCurrency(currentBalance);

    // Render ledger table
    console.log("Rendering ledger table...");
    const ledgerBody = document.getElementById("ledger-body");
    ledgerBody.innerHTML = "";
    
    ledgerData.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.sNo}</td>
        <td><b>${entry.date}</b></td>
        <td><b>${entry.description}</b></td>
        <td><b>${entry.billAmount ? formatCurrency(entry.billAmount) : "-"}</b></td>
        <td><b style="color: ${entry.debit ? "red" : "inherit"}">${entry.debit ? formatCurrency(entry.debit) : "-"}</b></td>
        <td><b style="color: ${entry.credit ? "green" : "inherit"}">${entry.credit ? formatCurrency(entry.credit) : "-"}</b></td>
        <td>${entry.gst ? formatCurrency(entry.gst) : "-"}</td>
        <td><b style="color: ${entry.balanceColor}">${formatCurrency(entry.balance)}</b></td>
      `;
      ledgerBody.appendChild(row);
    });

    console.log("Ledger generation completed successfully");

  } catch (error) {
    console.error("Error generating chapter ledger:", error);
    alert("An error occurred while generating the ledger.");
  } finally {
    hideLoader();
    console.log("=== Chapter Ledger Loading Process Completed ===");
  }
})();
