document.addEventListener("DOMContentLoaded", () => {
  populateRegionFilter(); // Populate region filter
  fetchPayments(); // Call fetchPayments when the document is fully loaded
});



function formatInIndianStyle(number) {
  return new Intl.NumberFormat('en-IN').format(number);
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

let allKittys = []; // Store all kitty payments globally
let filteredKittys = []; // Store filtered kitty payments globally after region/chapter filtering
let allCredits = []; // Store all credit notes globally
let allOrders = []; // Store all orders globally
let allTransactions = []; // Store all transactions globally
let allvisi = [];
let allTotal = 0;
let allreceived = 0;
let allpending = 0;
let totalLatePayment = 0;
let selectedChapterId = null;
let totalWriteOffAmount = 0;
let isAscending = true;

// Function to show loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex';
}

// Function to hide loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

async function fetchPayments() {
  try {
    showLoader();
    const [regions, chapters, kittyPayments, expenses, orders, transactions, members, credits, bankOrders, activeBill, writeOffs] = await Promise.all([ 
      fetch('http://localhost:5000/api/regions').then(res => res.json()),
      fetch('http://localhost:5000/api/chapters').then(res => res.json()),
      fetch('http://localhost:5000/api/getAllKittyPayments').then(res => res.json()),
      fetch('http://localhost:5000/api/allExpenses').then(res => res.json()),
      fetch('http://localhost:5000/api/allOrders').then(res => res.json()),
      fetch('http://localhost:5000/api/allTransactions').then(res => res.json()),
      fetch('http://localhost:5000/api/members').then(res => res.json()),
      fetch('http://localhost:5000/api/getAllMemberCredit').then(res => res.json()),
      fetch('http://localhost:5000/api/getbankOrder').then(res => res.json()),
      fetch('http://localhost:5000/api/getKittyPayments').then(res => res.json()),
      fetch('http://localhost:5000/api/getAllMemberWriteOff').then(res => res.json())
    ]);
    
    // Store orders and transactions globally
    allOrders = orders;
    allTransactions = transactions;

    // Calculate total write-off amount (default view)
    totalWriteOffAmount = writeOffs.reduce((sum, writeOff) => {
      return sum + parseFloat(writeOff.total_pending_amount || 0);
    }, 0);

    // Update write-off display
    document.querySelector('#total_expse_amount').textContent = 
      `₹ ${formatInIndianStyle(totalWriteOffAmount)}`;

    console.log('Fetched all data successfully');
    console.log('------===------==-=----=-=-=-=-= active bill ',activeBill);
    const totalActiveBillAmount = activeBill.reduce((sum, bill) => {
      return sum + parseFloat(bill.total_bill_amount);
    }, 0);
    console.log('Total Active Bill Amount:', formatInIndianStyle(totalActiveBillAmount));
    document.querySelector('#totalKittyDetails').textContent = `₹ ${formatInIndianStyle(Math.ceil(totalActiveBillAmount))}`;
    // Calculate visitor payments
    // console.log('Calculating visitor payments...');
    // const visitorOrders = orders.filter(order => order.universal_link_id === 4);
    // const totalVisitorAmount = visitorOrders.reduce((sum, order) => {
    //   const amount = parseFloat(order.order_amount || 0);
      // console.log(`Visitor Order ${order.order_id}: ₹${formatInIndianStyle(amount)}`);
      // return sum + amount;
    // }, 0);
    // console.log(`Total Visitor Amount: ₹${formatInIndianStyle(totalVisitorAmount)}`);

    // Update visitor payment display
    // const visitorAmountElement = document.querySelector('.total_V_amount');
    // if (visitorAmountElement) {
      // visitorAmountElement.textContent = `₹ ${formatInIndianStyle(totalVisitorAmount)}`;
    // }

    // Calculate received payments by chapter
    const chapterPayments = {};
    
    // Initialize chapterPayments object for all chapters
    chapters.forEach(chapter => {
      chapterPayments[chapter.chapter_id] = 0;
    });

    // Process orders and transactions
    orders.forEach(order => {
      // console.log(`Processing order for chapter ${order.chapter_id}:`, order);
      
      // Find all successful transactions for this order
      const orderTransactions = transactions.filter(trans => 
        trans.order_id === order.order_id && 
        trans.payment_status === 'SUCCESS' &&
        (order.payment_note === "meeting-payments" || order.payment_note === "meeting-payments-opening-only" )
      );

      // console.log(`------------------Found ${orderTransactions.length} successful transactions for order ${order.order_id}`);

      // Sum up successful payments for this order
      orderTransactions.forEach(trans => {
        const amount = Math.ceil(parseFloat(trans.payment_amount) - ( (parseFloat(trans.payment_amount)*18) / 118));
        allreceived += amount;
        chapterPayments[order.chapter_id] += amount;
        // console.log(`=======Added payment ${amount} to chapter ${order.chapter_id}. New total: ${chapterPayments[order.chapter_id]}`);
      });
    });

    // console.log('Final chapter payments:', chapterPayments);

    // Add members data to detailed kittys
    const detailedKittys = chapters.map(chapter => {
      const relatedKitty = kittyPayments.find(kitty => kitty.chapter_id === chapter.chapter_id) || {};
      const chapterMembers = members.filter(member => member.chapter_id === chapter.chapter_id);
      const filteredBankOrders = bankOrders.filter(order => order.chapter_id === chapter.chapter_id);
      let totalBankOrderAmount = 0;
      let noOfLatePayemnt=0;

      filteredBankOrders.forEach(order => {
        if (order.amount_to_pay > 0) {
          totalBankOrderAmount += parseFloat(order.amount_to_pay);
          
        }
        noOfLatePayemnt += parseInt(order.no_of_late_payment);
      });

      // console.log(`Total Bank Order Amount for chapter ${chapter.chapter_id}: ₹${formatInIndianStyle(totalBankOrderAmount)}`);
      allpending += parseFloat(totalBankOrderAmount);
      totalLatePayment += parseInt(noOfLatePayemnt);
      // const totalPending = chapterMembers.reduce((sum, member) => {
      //   const balance = parseFloat(member.meeting_opening_balance) || 0;
      //   return sum + balance;
      // }, 0);

      // Filter expenses for the current chapter
      const chapterExpenses = expenses.filter(expense => expense.chapter_id === chapter.chapter_id);
      const totalPaidExpenses = chapterExpenses
        .filter(expense => expense.payment_status === 'paid')
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const totalPendingExpenses = chapterExpenses
        .filter(expense => expense.payment_status === 'pending')
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      return { 
        ...relatedKitty, 
        ...chapter,
        totalExpenses: totalPaidExpenses,
        pendingExpenses: totalPendingExpenses,
        receivedPayments: chapterPayments[chapter.chapter_id] || 0,
        totalPending: totalBankOrderAmount,
        memberCount: chapterMembers.length, // Add member count
        latePayment: noOfLatePayemnt
      };
    });

    allKittys = detailedKittys;
    allCredits = credits; // Store credits globally for use in displayPayments
    populateMonthDropdown(allKittys);
    displayPayments(allKittys);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    hideLoader();
  }
}

// ---------------------------------------------------------------------------------------------------------
// Function to populate the month dropdown with month names (January, February, etc.)
function populateMonthDropdown(kittys) {
  const monthFilterElement = document.getElementById("month-filter");
  const uniqueMonths = new Set();

  kittys.forEach(item => {
    const date = new Date(item.raised_on);
    const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`; // Format: Month YYYY
    uniqueMonths.add(monthYear);
  });

  uniqueMonths.forEach(monthYear => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.classList.add("dropdown-item");
    a.href = "#";
    a.textContent = monthYear;

    a.addEventListener("click", function() {
      // Select this month in dropdown
      setSelectedMonth(monthYear);
      
      // Apply the month filter based on already filtered data (from chapter selection)
      const currentFilteredData = filterTable(); // Get already filtered data
      filterTableByMonth(monthYear, currentFilteredData); // Now filter by month on the filtered data
    });

    li.appendChild(a);
    monthFilterElement.appendChild(li);
  });
}

// Function to filter the table based on the selected month
function filterTableByMonth(monthYear, kittys) {
  const filteredData = kittys.filter(item => {
    const date = new Date(item.raised_on);
    const itemMonthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`; // Format: Month YYYY
    return itemMonthYear === monthYear;
  });

  displayPayments(filteredData); // Display the filtered payments for selected month
}

// -----------------------------------------------------------------------------------------------------

// Function to handle region selection
async function handleRegionSelection(event) {
  if (event.target && event.target.matches("a.dropdown-item")) {
    const selectedRegionId = event.target.dataset.id;
    console.log('Selected Region ID:', selectedRegionId);
    
    try {
      // Fetch chapters from API
      const response = await fetch('http://localhost:5000/api/chapters');
      const chapters = await response.json();
      
      console.log('All chapters:', chapters);

      // Filter chapters based on selected region_id
      const filteredChapters = chapters.filter(chapter => 
        chapter.region_id === parseInt(selectedRegionId)
      );
      
      console.log('Filtered chapters for region_id', selectedRegionId, ':', filteredChapters);

      // Populate chapter dropdown with filtered chapters
      const chapterFilter = document.getElementById('chapter-filter');
      if (!chapterFilter) {
        console.error('Chapter filter element not found');
        return;
      }

      // Clear existing options
      chapterFilter.innerHTML = '';

      // Add filtered chapters to dropdown
      filteredChapters.forEach(chapter => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.classList.add('dropdown-item');
        a.href = '#';
        a.textContent = chapter.chapter_name;
        a.dataset.id = chapter.chapter_id;
        a.dataset.regionId = chapter.region_id;
        
        // Add click handler for chapter selection
        a.addEventListener('click', function(e) {
          e.preventDefault();
          const selectedChapter = this.textContent;
          
          // Update chapter button text
          const chapterButton = document.querySelector('.chapter-button');
          if (chapterButton) {
            chapterButton.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i>${selectedChapter}`;
          }
          
          console.log('Selected chapter:', selectedChapter, 'with ID:', this.dataset.id);
          handleChapterSelection(e);
        });

        li.appendChild(a);
        chapterFilter.appendChild(li);
      });

      console.log('Chapter filter populated with', filteredChapters.length, 'chapters');

    } catch (error) {
      console.error('Error fetching or filtering chapters:', error);
    }
  }
}

// Function to handle chapter selection
function handleChapterSelection(event) {
  if (event.target && event.target.matches("a.dropdown-item")) {
    selectedChapterId = event.target.dataset.id;
    // Select the clicked chapter in dropdown
    setSelectedChapter(event.target);
    filterTable();
    updateTotalKittyAmount();
  }
}

// Function to filter the table based on selected region and chapter
function filterTable() {
  let filteredData = allKittys;

  // If a chapter is selected, filter by chapter
  if (selectedChapterId) {
    filteredData = filteredData.filter(item => item.chapter_id === parseInt(selectedChapterId));
  }

  filteredKittys = filteredData; // Save the filtered data for later month filtering

  // Display the filtered table
  displayPayments(filteredData);
  
  return filteredData; // Return the filtered data to be used by the month filter
}

// Function to display payments in the table
function displayPayments(kittys) {
  console.log('Starting to calculate totals for all chapters...');
  
  // Initialize total variables
  let grandTotalAvailableFund = 0;
  let grandTotalPaidExpenses = 0;
  let grandTotalPendingExpenses = 0;
  let grandTotalCreditNoteAmount = 0;
  let totalvisi = 0;

  let singleEntryAvailableFund = 0;
  let singleEntrypending = 0;
  let singleEntryrecived = 0;
  let singleEntrypaidEx = 0;
  let singleEntrypendEx = 0;

  // Get all chapter IDs from the current table
  const tableChapterIds = kittys.map(kitty => kitty.chapter_id);
  console.log('Chapter IDs in current table:', tableChapterIds);

  // Calculate total credit amount for matching chapters
  tableChapterIds.forEach(chapterId => {
    const chapterCredits = allCredits.filter(credit => credit.chapter_id === chapterId);
    const chapterCreditTotal = chapterCredits.reduce((sum, credit) => {
      return sum + parseFloat(credit.credit_amount || 0);
    }, 0);
    
    console.log(`Chapter ${chapterId} total credits: ₹${formatInIndianStyle(chapterCreditTotal)}`);
    grandTotalCreditNoteAmount += chapterCreditTotal;
  });

  console.log('Total Credit Note Amount:', grandTotalCreditNoteAmount);

  const tableBody = document.getElementById("paymentsTableBody");
  tableBody.innerHTML = kittys
    .map((kitty, index) => {
      // Calculate Available Fund for each row
      const availableFund = parseFloat(kitty.available_fund || 0);
      
      // Add to grand totals
      grandTotalAvailableFund += availableFund;
      grandTotalPaidExpenses += kitty.totalExpenses || 0;
      grandTotalPendingExpenses += kitty.pendingExpenses || 0;

      console.log(`Chapter ${index + 1}: ${kitty.chapter_name}`);
      console.log(`Available Fund: ₹${formatInIndianStyle(availableFund)}`);
      console.log(`Running Total Available Fund: ₹${formatInIndianStyle(grandTotalAvailableFund)}`);
      console.log('------------------------',kitty);
      const creditAmount = allCredits.filter(credit => credit.chapter_id === kitty.chapter_id);
      const chapterCreditTotal = creditAmount.reduce((sum, credit) => {
        return sum + parseFloat(credit.credit_amount || 0);
      }, 0);

      // Calculate visitor payments for this chapter
      const visitorOrders = allOrders.filter(order => 
        order.chapter_id === kitty.chapter_id && 
        order.universal_link_id === 5 && 
        order.payment_note === 'visitor-payment'
      );
      const visitorAmountTotal = visitorOrders.reduce((sum, order) => {
        const successfulTransactions = allTransactions.filter(trans => 
          trans.order_id === order.order_id && 
          trans.payment_status === 'SUCCESS'
        );
        const orderTotal = successfulTransactions.reduce((transSum, trans) => 
          transSum + parseFloat(trans.payment_amount || 0), 0
        );
        return sum + orderTotal;
      }, 0);

      totalvisi += parseInt(visitorAmountTotal);

      return `
        <tr>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${index + 1}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.chapter_name || ""}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.memberCount || 0}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(parseFloat(parseFloat(availableFund)+parseFloat(kitty.receivedPayments)- parseFloat(kitty.totalExpenses) + parseFloat(visitorAmountTotal)))}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.receivedPayments || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.totalPending || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.totalExpenses || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.pendingExpenses || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.latePayment}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${chapterCreditTotal}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${visitorAmountTotal}</strong></td>


        </tr>
      `;
    })
    .join("");

  // Log final totals
  console.log('=== Final Totals ===');
  // console.log(`Total Available Fund: ₹${formatInIndianStyle(grandTotalAvailableFund)}`);
  // console.log(`Total Paid Expenses: ₹${formatInIndianStyle(grandTotalPaidExpenses)}`);
  // console.log(`Total Pending Expenses: ₹${formatInIndianStyle(grandTotalPendingExpenses)}`);
  // console.log(`Total Credit Note Amount: ₹${formatInIndianStyle(grandTotalCreditNoteAmount)}`);
    console.log('all pending --------: ',allpending);
  allTotal = parseFloat(grandTotalAvailableFund) + parseFloat(allreceived) - parseFloat(grandTotalPaidExpenses) + parseFloat(totalvisi) ;


  // Calculate the available fund for only the currently displayed (filtered) entries
  let filteredTotalAvailableFund = 0;
  let filteredTotalReceived = 0;
  let filteredTotalPaidExpenses = 0;
  let filteredTotalVisitor = 0;

  kittys.forEach(kitty => {
    const availableFund = parseFloat(kitty.available_fund || 0);
    filteredTotalAvailableFund += availableFund;
    filteredTotalReceived += parseFloat(kitty.receivedPayments || 0);
    filteredTotalPaidExpenses += parseFloat(kitty.totalExpenses || 0);

    // Calculate visitor payments for this chapter
    const visitorOrders = allOrders.filter(order => 
      order.chapter_id === kitty.chapter_id && 
      order.universal_link_id === 5 && 
      order.payment_note === 'visitor-payment'
    );
    const visitorAmountTotal = visitorOrders.reduce((sum, order) => {
      const successfulTransactions = allTransactions.filter(trans => 
        trans.order_id === order.order_id && 
        trans.payment_status === 'SUCCESS'
      );
      const orderTotal = successfulTransactions.reduce((transSum, trans) => 
        transSum + parseFloat(trans.payment_amount || 0), 0
      );
      return sum + orderTotal;
    }, 0);
    filteredTotalVisitor += visitorAmountTotal;
  });

  // This is the total for only the filtered/visible entries
  const filteredAllTotal = filteredTotalAvailableFund + filteredTotalReceived - filteredTotalPaidExpenses + filteredTotalVisitor;

  // Update the Total Available Fund display for filtered data
  const totalAvailableFundElement = document.querySelector('.total_Available_amount');
  if (totalAvailableFundElement) {
    console.log('Updating Total Available Fund display...');
    totalAvailableFundElement.textContent = `₹ ${formatInIndianStyle(filteredAllTotal)}`;
    
    console.log('Total Available Fund display updated successfully');
  } else {
    console.error('Total Available Fund element not found in DOM');
  }

  // Calculate filtered total pending for only the visible/filtered entries
  const filteredTotalPending = kittys.reduce((sum, kitty) => sum + parseFloat(kitty.totalPending || 0), 0);

  // Update the Total Kitty Amount Pending display for filtered data
  const totalKittyExpenseElement = document.querySelector('#totalKittyExpense');
  if (totalKittyExpenseElement) {
    totalKittyExpenseElement.textContent = `₹ ${formatInIndianStyle(filteredTotalPending)}`;
  }

  // Calculate filtered total late payments for only the visible/filtered entries
  const filteredTotalLatePayment = kittys.reduce((sum, kitty) => sum + parseInt(kitty.latePayment || 0), 0);

  // Update the No. of Late Payment display for filtered data
  const totalLateAmountElement = document.querySelector('#total_late_amount');
  if (totalLateAmountElement) {
    totalLateAmountElement.textContent = filteredTotalLatePayment;
  }

  // Update expense totals displays
  document.querySelector('.total_Expense_amount').textContent = `₹ ${formatInIndianStyle(grandTotalPaidExpenses)}`;
  document.querySelector('.total_pExpense_amount').textContent = `₹ ${formatInIndianStyle(grandTotalPendingExpenses)}`;
  document.querySelector('.total_Exnse_amount').textContent = `₹ ${formatInIndianStyle(grandTotalCreditNoteAmount)}`;
  document.querySelector('#totalKittyAmountReceived').textContent = `₹ ${formatInIndianStyle(allreceived)}`;
  document.querySelector('#total_V_amount').textContent = `₹ ${formatInIndianStyle(totalvisi)}`;
  
}

// Function to set selected region in dropdown
function setSelectedRegion(regionElement) {
  const regionFilter = document.getElementById('region-filter');
  // Remove "active" class from any previously selected region
  const activeRegion = regionFilter.querySelector(".dropdown-item.active");
  if (activeRegion) activeRegion.classList.remove("active");

  // Add "active" class to the selected region
  regionElement.classList.add("active");
}

// Function to set selected chapter in dropdown
function setSelectedChapter(chapterElement) {
  const chapterFilter = document.getElementById('chapter-filter');
  // Remove "active" class from any previously selected chapter
  const activeChapter = chapterFilter.querySelector(".dropdown-item.active");
  if (activeChapter) activeChapter.classList.remove("active");

  // Add "active" class to the selected chapter
  chapterElement.classList.add("active");
}

// Function to set selected month in dropdown
function setSelectedMonth(monthYear) {
  const monthFilterElement = document.getElementById("month-filter");
  // Remove "active" class from any previously selected month
  const activeMonth = monthFilterElement.querySelector(".dropdown-item.active");
  if (activeMonth) activeMonth.classList.remove("active");

  // Add "active" class to the selected month
  const selectedMonth = Array.from(monthFilterElement.querySelectorAll('.dropdown-item'))
                              .find(item => item.textContent === monthYear);
  if (selectedMonth) {
    selectedMonth.classList.add("active");
  }
}

// Function to populate region filter dropdown
function populateRegionFilter() {
  try {
    const regionFilter = document.getElementById('region-filter');
    if (!regionFilter) {
      console.error('Region filter element not found');
      return;
    }

    // Fetch regions from API
    fetch('http://localhost:5000/api/regions')
      .then(res => res.json())
      .then(regions => {
        console.log('Fetched regions:', regions);

        // Clear existing options
        regionFilter.innerHTML = '';

        // Add regions to dropdown
        regions.forEach(region => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.classList.add('dropdown-item');
          a.href = '#';
          a.textContent = region.region_name;
          a.dataset.id = region.region_id;
          
          // Add click handler
          a.addEventListener('click', handleRegionSelection);

          li.appendChild(a);
          regionFilter.appendChild(li);
        });

        console.log('Region filter populated successfully');
      });
  } catch (error) {
    console.error('Error populating region filter:', error);
  }
}

// Function to update both kitty total and received amounts
async function updateTotalKittyAmount() {
  try {
    // Get kitty payments
    const kittyResponse = await fetch('http://localhost:5000/api/getAllKittyPayments');
    const kittyPayments = await kittyResponse.json();
    
    // Get orders and transactions
    const [orders, transactions] = await Promise.all([
      fetch('http://localhost:5000/api/allOrders').then(res => res.json()),
      fetch('http://localhost:5000/api/allTransactions').then(res => res.json())
    ]);

    let totalActiveBillAmount = 0;
    let chapterReceivedAmount = 0;

    if (selectedChapterId) {
      // Filter kitty payments for selected chapter
      totalActiveBillAmount = kittyPayments
        .filter(bill => bill.chapter_id === parseInt(selectedChapterId))
        .reduce((sum, bill) => sum + parseFloat(bill.total_bill_amount), 0);

      // Get kitty bill IDs for the selected chapter
      const filteredKittyBills = kittyPayments.filter(bill => 
        bill.chapter_id === parseInt(selectedChapterId)
      );
      const kittyBillIds = filteredKittyBills.map(bill => bill.kitty_bill_id);

      // Filter orders for selected chapter
      const filteredOrders = orders.filter(order => 
        order.chapter_id === parseInt(selectedChapterId) &&
        (order.payment_note === "meeting-payments" || 
         order.payment_note === "meeting-payments-opening-only") &&
        kittyBillIds.includes(order.kitty_bill_id)
      );

      // Calculate received amount from successful transactions
      filteredOrders.forEach(order => {
        const orderTransactions = transactions.filter(trans => 
          trans.order_id === order.order_id && 
          trans.payment_status === 'SUCCESS'
        );

        orderTransactions.forEach(trans => {
          const amount = Math.ceil(parseFloat(trans.payment_amount) - 
            ((parseFloat(trans.payment_amount) * 18) / 118));
          chapterReceivedAmount += amount;
        });
      });

    } else {
      // Show totals for all chapters
      totalActiveBillAmount = kittyPayments
        .reduce((sum, bill) => sum + parseFloat(bill.total_bill_amount), 0);
      chapterReceivedAmount = allreceived;
    }

    // Update both displays
    document.querySelector('#totalKittyDetails').textContent = 
      `₹ ${formatInIndianStyle(Math.ceil(totalActiveBillAmount))}`;
    document.querySelector('#totalKittyAmountReceived').textContent = 
      `₹ ${formatInIndianStyle(chapterReceivedAmount)}`;

    // Get write-offs data
    const writeOffResponse = await fetch('http://localhost:5000/api/getAllMemberWriteOff');
    const writeOffs = await writeOffResponse.json();

    let filteredWriteOffAmount = 0;

    if (selectedChapterId) {
      // Filter write-offs for selected chapter
      filteredWriteOffAmount = writeOffs
        .filter(writeOff => writeOff.chapter_id === parseInt(selectedChapterId))
        .reduce((sum, writeOff) => sum + parseFloat(writeOff.total_pending_amount || 0), 0);
    } else {
      // Show total for all chapters
      filteredWriteOffAmount = writeOffs
        .reduce((sum, writeOff) => sum + parseFloat(writeOff.total_pending_amount || 0), 0);
    }

    // Update write-off display
    document.querySelector('#total_expse_amount').textContent = 
      `₹ ${formatInIndianStyle(filteredWriteOffAmount)}`;

  } catch (error) {
    console.error('Error updating amounts:', error);
  }
}
// Add sorting function
function handleSort(column) {
  isAscending = !isAscending;
  
  // Make a copy of the current table data
  let dataToSort = [...allKittys];
  
  // Sort the data
  dataToSort.sort((a, b) => {
    switch(column) {
      case 'chapter_name':
        return isAscending ? 
          a.chapter_name.localeCompare(b.chapter_name) : 
          b.chapter_name.localeCompare(a.chapter_name);
      
      case 'memberCount':
        return isAscending ? 
          (a.memberCount || 0) - (b.memberCount || 0) : 
          (b.memberCount || 0) - (a.memberCount || 0);
      
      case 'availableFund':
        const fundA = parseFloat(a.available_fund || 0);
        const fundB = parseFloat(b.available_fund || 0);
        return isAscending ? fundA - fundB : fundB - fundA;
      
      case 'receivedPayments':
        const recA = parseFloat(a.receivedPayments || 0);
        const recB = parseFloat(b.receivedPayments || 0);
        return isAscending ? recA - recB : recB - recA;
      
      case 'totalPending':
        const pendA = parseFloat(a.totalPending || 0);
        const pendB = parseFloat(b.totalPending || 0);
        return isAscending ? pendA - pendB : pendB - pendA;
      
      case 'totalExpenses':
        const expA = parseFloat(a.totalExpenses || 0);
        const expB = parseFloat(b.totalExpenses || 0);
        return isAscending ? expA - expB : expB - expA;
      
      case 'pendingExpenses':
        const pExpA = parseFloat(a.pendingExpenses || 0);
        const pExpB = parseFloat(b.pendingExpenses || 0);
        return isAscending ? pExpA - pExpB : pExpB - pExpA;
      
      case 'latePayment':
        return isAscending ? 
          (a.latePayment || 0) - (b.latePayment || 0) : 
          (b.latePayment || 0) - (a.latePayment || 0);
      
      default:
        return 0;
    }
  });

  // Update the table with sorted data
  displayPayments(dataToSort);
}

// Add event listeners for sort icons
document.addEventListener('DOMContentLoaded', function() {
  const sortIcons = document.querySelectorAll('.sort-icon');
  sortIcons.forEach(icon => {
    icon.addEventListener('click', function() {
      const column = this.getAttribute('data-column');
      handleSort(column);
    });
  });

  // Reset Filter Button Logic
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      // Clear selected chapter
      selectedChapterId = null;

      // Remove active class from dropdowns
      const activeRegion = document.querySelector('#region-filter .dropdown-item.active');
      if (activeRegion) activeRegion.classList.remove('active');
      const activeChapter = document.querySelector('#chapter-filter .dropdown-item.active');
      if (activeChapter) activeChapter.classList.remove('active');

      // Reset dropdown button text
      const regionButton = document.querySelector('.region-button');
      if (regionButton) regionButton.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i>Choose Region`;
      const chapterButton = document.querySelector('.chapter-button');
      if (chapterButton) chapterButton.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i>Choose Chapter`;

      // Show all entries again
      displayPayments(allKittys);
    });
  }
});
