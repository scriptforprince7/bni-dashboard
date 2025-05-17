// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex"; // Show loader
}

function hideLoader() {
  document.getElementById("loader").style.display = "none"; // Hide loader
}

function formatDate(dateStr) {
  // Create a new Date object from the string
  const date = new Date(dateStr);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error("Error: incoming date is not valid");
    return "Invalid Date";
  }

  // Format the date to 'DD/MM/YYYY'
  const day = String(date.getUTCDate()).padStart(2, "0"); // Use getUTCDate() for UTC date
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Use getUTCMonth() for UTC month
  const year = date.getUTCFullYear(); // Use getUTCFullYear() for UTC year

  return `${day}/${month}/${year}`;
}

// Global variable for ledger data
let ledgerData = [];

(async function generateLedger() {
  // Add these variables at the top with other declarations
  let currentBalance = 0;
  let paid_amount_show = 0;
  let total_credit_note_amount = 0;
  let no_of_late_payment = 0;
  let memberWriteOff = null;

  try {
    showLoader();

    // Step 1: Try getting member details from multiple sources
    let member_id = localStorage.getItem("current_member_id");
    let member_email = localStorage.getItem("current_member_email");

    console.log("=== Starting Member Transactions ===");
    console.log("Initial check from localStorage:", {
      member_id: member_id,
      member_email: member_email
    });

    // If not in localStorage, try getting from token
    if (!member_email) {
      member_email = getUserEmail();
      console.log("Retrieved from token:", {
        member_email: member_email
      });
    }

    if (!member_email) {
      console.error("No member email found from any source");
      hideLoader();
      return;
    }

    // Step 2: Fetch member data using the email
    const memberResponse = await fetch(
      "http://localhost:5000/api/members"
    );
    const members = await memberResponse.json();

    console.log("Looking for member with email:", member_email);
    const userData = members.find(
      member => member.member_email_address === member_email
    );

    if (!userData) {
      console.error("No member found with email:", member_email);
      hideLoader();
      return;
    }

    console.log("Found member data:", userData);

    // Continue with your existing logic using userData
    const {
      meeting_opening_balance,
      meeting_payable_amount,
      chapter_id
    } = userData;
    // // currentAvailable
    // let currentBalance = 0;

    const AllTimeRaisedKittyResponse = await fetch(
      "http://localhost:5000/api/getAllKittyPayments"
    );
    const AllTimeRaisedKitty = await AllTimeRaisedKittyResponse.json();
    const allTimeRaisedKitty = AllTimeRaisedKitty.filter(
      kitty => kitty.chapter_id === chapter_id
    );
    console.log("heree", allTimeRaisedKitty);
    // Declare variables for activeKittyEntries and remainingKittyEntries
    let activeKittyEntries = [];
    let remainingKittyEntries = [];
    const allAvailableOrdersResponse = await fetch(
      "http://localhost:5000/api/allOrders"
    );
    const allAvailableOrders = await allAvailableOrdersResponse.json();
    const allAvailableTransactionsResponse = await fetch(
      "http://localhost:5000/api/allTransactions"
    );
    const allAvailableTransactions = await allAvailableTransactionsResponse.json();

    // Fetch all member credits
    const memberCreditResponse = await fetch(
      "http://localhost:5000/api/getAllMemberCredit"
    );
    const memberCredits = await memberCreditResponse.json();
    let filteredCredits = memberCredits.filter(
      credit =>
        credit.member_id === userData.member_id &&
        credit.chapter_id === chapter_id
    );
    console.log("filteredCredits", filteredCredits);

    // here need op balance entry done
    currentBalance =
      parseFloat(currentBalance) - parseFloat(meeting_opening_balance);
    // Initialize ledgerData within the function
    ledgerData = [
      {
        sNo: 1,
        date: formatDate(userData.member_induction_date), //date wtf
        description: "Opening Balance",
        billAmount: 0,
        debit: meeting_opening_balance,
        credit: 0,
        gst: 0,
        balance: currentBalance, // Display opening balance here
        balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
      }
    ];
    // let opcreditsBeforeTransaction= [];

    let opening_bill_entry_shown = 0;

    // // Filter orders for meeting payments opening only
    const meetingOpeningOrders = allAvailableOrders.filter(
      filtereddata =>
        filtereddata.customer_id === userData.member_id &&
        filtereddata.payment_note === "meeting-payments-opening-only"
    );

    console.log("Meeting Opening Orders:", meetingOpeningOrders);

    if (allTimeRaisedKitty.length > 0) {
      // sort all available kity
      allTimeRaisedKitty.sort(
        (a, b) => new Date(a.raised_on) - new Date(b.raised_on)
      );
      // opcreditsBeforeTransaction = filteredCredits.filter(credit => new Date(credit.credit_date) <= new Date(allTimeRaisedKitty[0].raised_on));
      activeKittyEntries = allTimeRaisedKitty.filter(
        kitty => kitty.delete_status === 0
      );
      console.log("Active Kitty Entries:", activeKittyEntries);

      // Remove activeKittyEntries from allTimeRaisedKitty
      remainingKittyEntries = allTimeRaisedKitty.filter(
        kitty => kitty.delete_status !== 0
      );
      console.log("Remaining Kitty Entries:", remainingKittyEntries);
    } else {
      console.log("no bill");
      // when there is no kitty found
      // now hwew i need to do credir and transaction
      meetingOpeningOrders.forEach(order => {
        const successfulTransactions = allAvailableTransactions.filter(
          transaction =>
            transaction.order_id === order.order_id &&
            transaction.payment_status === "SUCCESS"
        );
        console.log(
          "orders details:-=================================================== ",
          order
        );
        if (successfulTransactions.length > 0) {
          successfulTransactions.forEach(transaction => {
            const creditsBeforeTransaction = filteredCredits.filter(
              credit =>
                new Date(credit.credit_date) <=
                new Date(transaction.payment_time)
            );

            if (creditsBeforeTransaction.length > 0) {
              creditsBeforeTransaction.forEach(credit => {
                console.log(
                  `Credit Date before Transaction: ${formatDate(
                    credit.credit_date
                  )}`,
                  credit
                );
                total_credit_note_amount += parseFloat(credit.credit_amount);
                currentBalance += parseFloat(credit.credit_amount);
                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(credit.credit_date),
                  description: "Credit Note",
                  billAmount: 0,
                  debit: 0,
                  credit: parseFloat(credit.credit_amount),
                  gst: 0,
                  balance: parseFloat(currentBalance),
                  balanceColor:
                    parseFloat(currentBalance) >= 0 ? "green" : "red"
                });
              });

              // Remove the found entries from the original filteredCredits array
              filteredCredits = filteredCredits.filter(
                credit =>
                  new Date(credit.credit_date) >
                  new Date(transaction.payment_time)
              );
            } else {
              console.log("No credits before this transaction.");
            }

            opening_bill_entry_shown = 1;

            // console.log(`Transaction Date: ${formatDate(transaction.transaction_date)}`);
            paid_amount_show += parseFloat(
              parseFloat(transaction.payment_amount) - parseFloat(order.tax)
            );
            currentBalance += parseFloat(
              parseFloat(transaction.payment_amount) - parseFloat(order.tax)
            );

            ledgerData.push({
              sNo: ledgerData.length + 1,
              date: formatDate(transaction.payment_time),
              description: "Opening Balance Paid",
              billAmount: Math.round(transaction.payment_amount),
              debit: 0,
              credit:
                parseFloat(transaction.payment_amount) - parseFloat(order.tax),
              gst: Math.round(parseFloat(order.tax)),
              balance: parseFloat(currentBalance),
              balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
            });
          });
        } else {
          console.log(
            "No successful transactions for this meeting opening order."
          );
        }
      });

      // then  all remain show credit here and need return here also
      if (filteredCredits.length > 0) {
        filteredCredits.forEach(credit => {
          console.log(`Credit Date: ${formatDate(credit.credit_date)}`);
          total_credit_note_amount += parseFloat(credit.credit_amount);
          currentBalance += parseFloat(credit.credit_amount);
          ledgerData.push({
            sNo: ledgerData.length + 1,
            date: formatDate(credit.credit_date),
            description: "Credit Note",
            billAmount: 0,
            debit: 0,
            credit: parseFloat(credit.credit_amount),
            gst: 0,
            balance: parseFloat(currentBalance),
            balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
          });
        });
        filteredCredits = [];
      }
      // return;
    }


    if (opening_bill_entry_shown !== 1) {
      // here i need to add credit before it and removed used entry of credit and credit filterd on base of all time kitty [0]
      meetingOpeningOrders.forEach(order => {
        const successfulTransactions = allAvailableTransactions.filter(
          transaction =>
            transaction.order_id === order.order_id &&
            transaction.payment_status === "SUCCESS"
        );
        if (successfulTransactions.length > 0) {
          successfulTransactions.forEach(transaction => {
            const creditsBeforeTransaction = filteredCredits.filter(
              credit =>
                new Date(credit.credit_date) <=
                new Date(transaction.payment_time)
            );

            if (creditsBeforeTransaction.length > 0) {
              creditsBeforeTransaction.forEach(credit => {
                console.log(
                  `Credit Date before Transaction: ${formatDate(
                    credit.credit_date
                  )}`,
                  credit
                );
                total_credit_note_amount += parseFloat(credit.credit_amount);
                currentBalance += parseFloat(credit.credit_amount);
                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(credit.credit_date),
                  description: "Credit Note",
                  billAmount: 0,
                  debit: 0,
                  credit: parseFloat(credit.credit_amount),
                  gst: 0,
                  balance: parseFloat(currentBalance),
                  balanceColor:
                    parseFloat(currentBalance) >= 0 ? "green" : "red"
                });
              });

              // Remove the found entries from the original filteredCredits array
              filteredCredits = filteredCredits.filter(
                credit =>
                  new Date(credit.credit_date) >
                  new Date(transaction.payment_time)
              );
            } else {
              console.log("No credits before this transaction.");
            }

            // console.log(`Transaction Date: ${formatDate(transaction.transaction_date)}`);
            paid_amount_show += parseFloat(
              parseFloat(transaction.payment_amount) - parseFloat(order.tax)
            );
            currentBalance += parseFloat(
              parseFloat(transaction.payment_amount) - parseFloat(order.tax)
            );

            ledgerData.push({
              sNo: ledgerData.length + 1,
              date: formatDate(transaction.payment_time),
              description: "Opening Balance Paid",
              billAmount: Math.round(transaction.payment_amount),
              debit: 0,
              credit:
                parseFloat(transaction.payment_amount) - parseFloat(order.tax),
              gst: Math.round(parseFloat(order.tax)),
              balance: parseFloat(currentBalance),
              balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
            });
          });
        } else {
          console.log(
            "No successful transactions for this meeting opening order."
          );
        }
      });
    }

    // const memberInductionDate = new Date(userData.member_induction_date);
    const memberInductionDate = new Date(userData.date_of_publishing);

    // Sort remainingKittyEntries based on raised_on date in ascending order
    remainingKittyEntries.sort(
      (a, b) => new Date(a.raised_on) - new Date(b.raised_on)
    );
    console.log("Sorted Remaining Kitty Entries:", remainingKittyEntries);

    remainingKittyEntries.forEach(kitty => {
      console.log(`Kitty Raised on: ${formatDate(kitty.raised_on)}`);

      const kittyRaisedOnDate = new Date(kitty.raised_on);

      // Compare the dates
      if (memberInductionDate <= kittyRaisedOnDate) {
        // Filter credits based on kitty.raised_on date
        const creditsBeforeKitty = filteredCredits.filter(
          credit => new Date(credit.credit_date) <= new Date(kitty.raised_on)
        );

        // Log each credit_date that is smaller or equal to kitty.raised_on date
        if (creditsBeforeKitty.length > 0) {
          creditsBeforeKitty.forEach(credit => {
            console.log(`Credit Date: ${formatDate(credit.credit_date)}`);
            total_credit_note_amount += parseFloat(credit.credit_amount);
            currentBalance += parseFloat(credit.credit_amount);
            ledgerData.push({
              sNo: ledgerData.length + 1,
              date: formatDate(credit.credit_date),
              description: "Credit Note",
              billAmount: 0,
              debit: 0,
              credit: parseFloat(credit.credit_amount),
              gst: 0,
              balance: parseFloat(currentBalance),
              balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
            });
          });
        } else {
          console.log("No credits before this kitty entry.");
        }
        // kitty bill entry here start
        // if (remainingKittyEntries.length > 0) {
        currentBalance -= parseFloat(kitty.total_bill_amount);
        const gstAmount = parseFloat(kitty.total_bill_amount) * 0.18;
        const billAmountWithoutGst = parseFloat(kitty.total_bill_amount);

        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(kitty.raised_on),
          description: `
                <b>Meeting Payable Amount</b><br>
                <em>(bill for: ${kitty.bill_type})</em> - 
                <em>(${kitty.description})</em>
                `,
          billAmount: Math.round(
            parseFloat(kitty.total_bill_amount) +
              parseFloat(kitty.total_bill_amount) * 0.18
          ),
          debit: billAmountWithoutGst,
          credit: 0,
          gst: Math.round(gstAmount),
          balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
          balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
        });
        // }
        // Remove the found entries from the original filteredCredits array
        filteredCredits = filteredCredits.filter(
          credit => new Date(credit.credit_date) > new Date(kitty.raised_on)
        );

        // here find its all ordr hten its corresponding success transaction then if founded then show

        const filteredOrders = allAvailableOrders.filter(
          order =>
            order.kitty_bill_id === kitty.kitty_bill_id &&
            order.customer_id === userData.member_id
        );
        console.log("Filtered Orders:", filteredOrders);
        let bool_payment_received = false;
        let one_time = false;

        filteredOrders.forEach(order => {
          const successfulTransactions = allAvailableTransactions.filter(
            transaction =>
              transaction.order_id === order.order_id &&
              transaction.payment_status === "SUCCESS"
          );
          console.log("successfulTransactions", successfulTransactions);
          if (successfulTransactions.length > 0) {
            console.log(
              "Successful Transactions for Order ID",
              order.order_id,
              ":",
              successfulTransactions
            );
            successfulTransactions.forEach(transaction => {
              const creditsBeforeTransaction = filteredCredits.filter(
                credit =>
                  new Date(credit.credit_date) <=
                  new Date(transaction.payment_time)
              );
              bool_payment_received = true;

              // here penalty fee check
              if (
                transaction.payment_time > kitty.kitty_due_date &&
                one_time === false
              ) {
                one_time = true;
                no_of_late_payment++;
                console.log(
                  "late payment",
                  transaction.payment_time,
                  kitty.kitty_due_date
                );

                currentBalance -= parseFloat(kitty.penalty_fee);
                console.log("penalty adding ========-=-=---------");
                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(kitty.kitty_due_date),
                  description: `
                  Late Fee Penalty <span><img src="../assets/images/late.jpg" alt="late payment image" style="width: 15px; height: 15px; border-radius: 50%;"></span>`,
                  billAmount: 0,
                  debit: parseFloat(kitty.penalty_fee),
                  credit: 0,
                  gst: 0,
                  balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
                  balanceColor:
                    parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
                });
              }

              if (creditsBeforeTransaction.length > 0) {
                creditsBeforeTransaction.forEach(credit => {
                  console.log(
                    `Credit Date before Transaction: ${formatDate(
                      credit.credit_date
                    )}`,
                    credit
                  );
                  total_credit_note_amount += parseFloat(credit.credit_amount);
                  currentBalance += parseFloat(credit.credit_amount);
                  ledgerData.push({
                    sNo: ledgerData.length + 1,
                    date: formatDate(credit.credit_date),
                    description: "Credit Note",
                    billAmount: 0,
                    debit: 0,
                    credit: parseFloat(credit.credit_amount),
                    gst: 0,
                    balance: parseFloat(currentBalance),
                    balanceColor:
                      parseFloat(currentBalance) >= 0 ? "green" : "red"
                  });
                });

                // Remove the found entries from the original filteredCredits array
                filteredCredits = filteredCredits.filter(
                  credit =>
                    new Date(credit.credit_date) >
                    new Date(transaction.payment_time)
                );
              } else {
                console.log("No credits before this transaction.");
              }
              console.log("transaction.payment_time", transaction.payment_time);
              console.log("kitty.kitty_due_date", kitty.kitty_due_date);


              if (
                transaction.payment_time > kitty.kitty_due_date &&
                one_time === false
              ) {
                one_time = true;
                no_of_late_payment++;
                console.log(
                  "late payment",
                  transaction.payment_time,
                  kitty.kitty_due_date
                );

                currentBalance -= parseFloat(kitty.penalty_fee);
                console.log("penalty adding ========-=-=---------");

                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(kitty.kitty_due_date),
                  description: `
                  Late Fee Penalty <span><img src="../assets/images/late.jpg" alt="late payment image" style="width: 15px; height: 15px; border-radius: 50%;"></span>`,
                  billAmount: 0,
                  debit: parseFloat(kitty.penalty_fee),
                  credit: 0,
                  gst: 0,
                  balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
                  balanceColor:
                    parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
                });

              }
              // else {
              paid_amount_show += parseFloat(
                parseFloat(transaction.payment_amount) - parseFloat(order.tax)
              );
              currentBalance += parseFloat(
                parseFloat(transaction.payment_amount) - parseFloat(order.tax)
              );

              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transaction.payment_time),
                description: "Meeting Fee Paid",
                billAmount: Math.round(transaction.payment_amount),
                debit: 0,
                credit:
                  parseFloat(transaction.payment_amount) -
                  parseFloat(order.tax),
                gst: Math.round(parseFloat(order.tax)),
                balance: parseFloat(currentBalance),
                balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
              });
              // }

              // here penalty fee check
              if (
                transaction.payment_time > kitty.kitty_due_date &&
                one_time === false
              ) {
                one_time = true;
                no_of_late_payment++;
                console.log(
                  "late payment",
                  transaction.payment_time,
                  kitty.kitty_due_date
                );

                currentBalance -= parseFloat(kitty.penalty_fee);
                console.log("penalty adding ========-=-=---------");

                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(kitty.kitty_due_date),
                  description: `
                  Late Fee Penalty <span><img src="../assets/images/late.jpg" alt="late payment image" style="width: 15px; height: 15px; border-radius: 50%;"></span>`,
                  billAmount: 0,
                  debit: parseFloat(kitty.penalty_fee),
                  credit: 0,
                  gst: 0,
                  balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
                  balanceColor:
                    parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
                });
              }
            });
          } else {
            console.log("no transaction found");
          }
        });
        if (bool_payment_received === false && one_time === false) {
          one_time = true;
          no_of_late_payment++;
          currentBalance -= parseFloat(kitty.penalty_fee);
          console.log("penalty adding ========-=-=---------");

          ledgerData.push({
            sNo: ledgerData.length + 1,
            date: formatDate(kitty.kitty_due_date),
            description: `
                  Late Fee Penalty <span><img src="../assets/images/late.jpg" alt="late payment image" style="width: 15px; height: 15px; border-radius: 50%;"></span>`,
            billAmount: 0,
            debit: parseFloat(kitty.penalty_fee),
            credit: 0,
            gst: 0,
            balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
            balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
          });
        }
      }
    });

    // Process activeKittyEntries similar to remainingKittyEntries
    activeKittyEntries.forEach(kitty => {
      console.log(`Active Kitty Raised on: ${formatDate(kitty.raised_on)}`);
      const kittyRaisedOnDate = new Date(kitty.raised_on);

      // Compare the dates
      if (memberInductionDate <= kittyRaisedOnDate) {
        // Filter credits based on kitty.raised_on date
        const creditsBeforeKitty = filteredCredits.filter(
          credit => new Date(credit.credit_date) <= new Date(kitty.raised_on)
        );

        // Log each credit_date that is smaller or equal to kitty.raised_on date
        if (creditsBeforeKitty.length > 0) {
          creditsBeforeKitty.forEach(credit => {
            console.log(`Credit Date: ${formatDate(credit.credit_date)}`);
            total_credit_note_amount += parseFloat(credit.credit_amount);
            currentBalance += parseFloat(credit.credit_amount);
            ledgerData.push({
              sNo: ledgerData.length + 1,
              date: formatDate(credit.credit_date),
              description: "Credit Note",
              billAmount: 0,
              debit: 0,
              credit: parseFloat(credit.credit_amount),
              gst: 0,
              balance: parseFloat(currentBalance),
              balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
            });
          });
        } else {
          console.log("No credits before this active kitty entry.");
        }

        // Remove the found entries from the original filteredCredits array
        filteredCredits = filteredCredits.filter(
          credit => new Date(credit.credit_date) > new Date(kitty.raised_on)
        );

        // Active kitty bill entry
        // currentBalance -= parseFloat(kitty.total_bill_amount);
        currentBalance -= parseFloat(kitty.total_bill_amount);
        const gstAmount = parseFloat(kitty.total_bill_amount) * 0.18;
        const billAmountWithoutGst = parseFloat(kitty.total_bill_amount);
        let active_bool_late_payment = false;
        let one_time = false;

        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(kitty.raised_on),
          description: `
            <b>Meeting Payable Amount</b><br>
            <em>(bill for: ${kitty.bill_type})</em> - 
            <em>(${kitty.description})</em>
            `,
          billAmount: Math.round(
            parseFloat(kitty.total_bill_amount) +
              parseFloat(kitty.total_bill_amount) * 0.18
          ),
          debit: billAmountWithoutGst,
          credit: 0,
          gst: Math.round(gstAmount),
          balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
          balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
        });

        // Process orders and transactions for active kitty entries
        const filteredOrders = allAvailableOrders.filter(
          order =>
            order.kitty_bill_id === kitty.kitty_bill_id &&
            order.customer_id === userData.member_id
        );
        console.log("Filtered Orders for Active Kitty:", filteredOrders);

        filteredOrders.forEach(order => {
          const successfulTransactions = allAvailableTransactions.filter(
            transaction =>
              transaction.order_id === order.order_id &&
              transaction.payment_status === "SUCCESS"
          );
          if (successfulTransactions.length > 0) {
            console.log(
              "Successful Transactions for Order ID",
              order.order_id,
              ":",
              successfulTransactions
            );
            successfulTransactions.forEach(transaction => {
              const creditsBeforeTransaction = filteredCredits.filter(
                credit =>
                  new Date(credit.credit_date) <=
                  new Date(transaction.payment_time)
              );

              // here penalty fee check

              if (
                transaction.payment_time > kitty.kitty_due_date &&
                one_time === false
              ) {
                one_time = true;
                no_of_late_payment++;
                console.log(
                  "late payment",
                  transaction.payment_time,
                  kitty.kitty_due_date
                );

                currentBalance -= parseFloat(kitty.penalty_fee);
                console.log("penalty adding ========-=-=---------");

                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(kitty.kitty_due_date),
                  description: `
                  Late Fee Penalty <span><img src="../assets/images/late.jpg" alt="late payment image" style="width: 15px; height: 15px; border-radius: 50%;"></span>`,
                  billAmount: 0,
                  debit: parseFloat(kitty.penalty_fee),
                  credit: 0,
                  gst: 0,
                  balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
                  balanceColor:
                    parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
                });
              }

              if (creditsBeforeTransaction.length > 0) {
                creditsBeforeTransaction.forEach(credit => {
                  console.log(
                    `Credit Date before Transaction: ${formatDate(
                      credit.credit_date
                    )}`,
                    credit
                  );
                  total_credit_note_amount += parseFloat(credit.credit_amount);
                  currentBalance += parseFloat(credit.credit_amount);
                  ledgerData.push({
                    sNo: ledgerData.length + 1,
                    date: formatDate(credit.credit_date),
                    description: "Credit Note",
                    billAmount: 0,
                    debit: 0,
                    credit: parseFloat(credit.credit_amount),
                    gst: 0,
                    balance: parseFloat(currentBalance),
                    balanceColor:
                      parseFloat(currentBalance) >= 0 ? "green" : "red"
                  });
                });

                // Remove the found entries from the original filteredCredits array
                filteredCredits = filteredCredits.filter(
                  credit =>
                    new Date(credit.credit_date) >
                    new Date(transaction.payment_time)
                );
              } else {
                console.log("No credits before this transaction.");
              }
              active_bool_late_payment = true;
              if (
                transaction.payment_time > kitty.kitty_due_date &&
                one_time === false
              ) {
                // active_bool_late_payment = true;
                console.log(
                  "late payment",
                  transaction.payment_time,
                  kitty.kitty_due_date
                );
                no_of_late_payment++;
                one_time = true;
                currentBalance -= parseFloat(kitty.penalty_fee);
                console.log("penalty adding ========-=-=---------");

                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(kitty.kitty_due_date),
                  description: `
                    Late Fee Penalty <span><img src="../assets/images/late.jpg" alt="late payment image" style="width: 15px; height: 15px; border-radius: 50%;"></span>
                    `,
                  billAmount: 0,
                  debit: parseFloat(kitty.penalty_fee),
                  credit: 0,
                  gst: 0,
                  balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
                  balanceColor:
                    parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
                });

              }
              // else{
              currentBalance += parseFloat(
                parseFloat(transaction.payment_amount) - parseFloat(order.tax)
              );
              paid_amount_show += parseFloat(
                parseFloat(transaction.payment_amount) - parseFloat(order.tax)
              );
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transaction.payment_time),
                description: "Meeting Fee Paid",
                billAmount: Math.round(transaction.payment_amount),
                debit: 0,
                credit:
                  parseFloat(transaction.payment_amount) -
                  parseFloat(order.tax),
                gst: Math.round(parseFloat(order.tax)),
                balance: parseFloat(currentBalance),
                balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
              });
              // }
            });
          } else {
            console.log("no transaction found");
            // no_of_late_payment++;
          }
        });
        if (
          active_bool_late_payment === false &&
          Date.now() > new Date(kitty.kitty_due_date).getTime() &&
          one_time === false
        ) {
          no_of_late_payment++;
          one_time = true;
          currentBalance -= parseFloat(kitty.penalty_fee);
          console.log("penalty adding ========-=-=---------");

          ledgerData.push({
            sNo: ledgerData.length + 1,
            date: formatDate(kitty.kitty_due_date),
            description: `Late Fee Penalty <span><img src="../assets/images/late.jpg" alt="late payment image" style="width: 15px; height: 15px; border-radius: 50%;"></span>`,
            billAmount: 0,
            debit: parseFloat(kitty.penalty_fee),
            credit: 0,
            gst: 0,
            balance: parseFloat(currentBalance), // Show sum in Meeting Payable Amount row
            balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red" // Set balance color to red
          });
        }
      }
    });
    let kittyRaisedOnDate = null;
    if (activeKittyEntries.length !== 0) {
      kittyRaisedOnDate = new Date(activeKittyEntries[0].raised_on);
    }
    if (
      activeKittyEntries.length !== 0 &&
      memberInductionDate <= kittyRaisedOnDate
    ) {
      const fullYear = kittyRaisedOnDate.getFullYear();
      console.log("Full Year from raised_on:", fullYear);
      document.getElementById("total-kitty-amount").textContent =
        activeKittyEntries[0].total_bill_amount;
      document.getElementById("billType").textContent =
        activeKittyEntries[0].bill_type;
      document.getElementById("tot_weeks").textContent =
        activeKittyEntries[0].total_weeks;
      document.querySelector(".description").innerHTML =
        activeKittyEntries[0].description + " " + fullYear;
      document.getElementById("due_date").textContent = formatDate(
        activeKittyEntries[0].kitty_due_date
      );
    } else {
      console.log("-----------------------------", activeKittyEntries);
      document.getElementById("total-kitty-amount").textContent =
        "No Bill Raised.";
      document.getElementById("billType").textContent = "-";
      document.getElementById("tot_weeks").textContent = "-";
      document.querySelector(".description").innerHTML = "-";
      document.getElementById("due_date").textContent = "-";
    }

    // If there are any remaining entries in filteredCredits, log them
    if (filteredCredits.length > 0) {
      console.log("Remaining Credits:", filteredCredits);
      filteredCredits.forEach(credit => {
        currentBalance += parseFloat(credit.credit_amount);
        total_credit_note_amount += parseFloat(credit.credit_amount);
        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(credit.credit_date),
          description: "Credit Note",
          billAmount: 0,
          debit: 0,
          credit: parseFloat(credit.credit_amount),
          gst: 0,
          balance: parseFloat(currentBalance),
          balanceColor: parseFloat(currentBalance) >= 0 ? "green" : "red"
        });
      });
    }

    // Fetch write-off data and check for write-off status
    const writeOffResponse = await fetch("http://localhost:5000/api/getAllMemberWriteOff");
    const writeOffData = await writeOffResponse.json();
    memberWriteOff = writeOffData.find(wo => wo.member_id === userData.member_id);
    console.log("memberWriteOff", memberWriteOff);
    console.log("writeOffData", writeOffData);
    console.log("userData.member_id", userData.member_id);

    // Check if member has been written off and add entry
    if (memberWriteOff) {
      ledgerData.push({
        sNo: ledgerData.length + 1,
        date: formatDate(memberWriteOff.rightoff_date),
        description: `Member Write Off${memberWriteOff.writeoff_comment ? ` - <br> ${memberWriteOff.writeoff_comment}` : ''}`,
        billAmount: 0,
        debit: 0,
        credit: parseFloat(memberWriteOff.total_pending_amount),
        gst: 0,
        balance: 0,
        balanceColor: "green"
      });
      
      // Reset all amounts to 0 for written off member
      currentBalance = 0;
      paid_amount_show = 0;
      total_credit_note_amount = 0;
      no_of_late_payment = 0;

      // Reset the display fields for active kitty
      document.getElementById("total-kitty-amount").textContent = "0";
      document.getElementById("billType").textContent = "-";
      document.getElementById("tot_weeks").textContent = "-";
      document.querySelector(".description").innerHTML = "Member Written Off";
      document.getElementById("due_date").textContent = "-";
    }

    // Update the final balance display
    if (parseFloat(currentBalance) >= 0) {
      document.getElementById("pending_payment_amount").innerHTML = 
        `<span style="color: green;">${currentBalance.toFixed(2)}</span>`;
    } else {
      document.getElementById("pending_payment_amount").innerHTML = 
        `<span style="color: red;">${currentBalance.toFixed(2)}</span>`;
    }
  } catch (error) {
    console.error("Error generating ledger:", error);
    alert("An error occurred while generating the ledger.");
  } finally {
    const ledgerBody = document.getElementById("ledger-body");
    ledgerBody.innerHTML = ""; // Clear existing rows
    ledgerData.forEach(entry => {
      const row = document.createElement("tr");

      // Define balanceColor and balanceValue correctly
      const balanceColor = entry.balanceColor;
      const balanceValue = entry.balance;

      row.innerHTML = `
      <td>${entry.sNo}</td>
      <td><b>${entry.date}</b></td>
      <td><b>${entry.description}</b></td>
      <td><b>${entry.billAmount
        ? parseFloat(entry.billAmount).toFixed(2)
        : "-"}</b></td>
      <td><b style="color: ${entry.debit ? "red" : "inherit"}">${entry.debit
        ? parseFloat(entry.debit).toFixed(2)
        : "-"}</b></td>
      <td><b style="color: ${entry.credit ? "green" : "inherit"}">${entry.credit
        ? parseFloat(entry.credit).toFixed(2)
        : "-"}</b></td>
      <td>${entry.gst ? parseFloat(entry.gst).toFixed(2) : "-"}</td>
      <td>
        <b style="color: ${balanceColor}">
          ${parseFloat(balanceValue).toFixed(2)}
        </b>
      </td>
    `;

      ledgerBody.appendChild(row);
    });
    document.getElementById("success_kitty_amount").textContent = 
      memberWriteOff ? "0.00" : paid_amount_show.toFixed(2);
    document.getElementById("total_credit_note_amount").textContent = 
      memberWriteOff ? "0.00" : total_credit_note_amount.toFixed(2);
    document.getElementById("no_of_late_payment").textContent = 
      memberWriteOff ? "0" : no_of_late_payment;
    hideLoader();
  }
})();
