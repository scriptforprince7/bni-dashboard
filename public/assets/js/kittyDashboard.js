document.addEventListener("DOMContentLoaded", () => {
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
    const [regions, chapters, kittyPayments, expenses, orders, transactions, members] = await Promise.all([ 
      fetch('https://bni-data-backend.onrender.com/api/regions').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/chapters').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/getAllKittyPayments').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/allExpenses').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/allOrders').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/allTransactions').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/members').then(res => res.json())
    ]);

    console.log('Fetched all data successfully');
    console.log('Members data:', members);

    // Calculate received payments by chapter
    const chapterPayments = {};
    
    // Initialize chapterPayments object for all chapters
    chapters.forEach(chapter => {
      chapterPayments[chapter.chapter_id] = 0;
    });

    // Process orders and transactions
    orders.forEach(order => {
      console.log(`Processing order for chapter ${order.chapter_id}:`, order);
      
      // Find all successful transactions for this order
      const orderTransactions = transactions.filter(trans => 
        trans.order_id === order.order_id && 
        trans.payment_status === 'SUCCESS'
      );

      console.log(`Found ${orderTransactions.length} successful transactions for order ${order.order_id}`);

      // Sum up successful payments for this order
      orderTransactions.forEach(trans => {
        const amount = parseFloat(trans.payment_amount);
        chapterPayments[order.chapter_id] += amount;
        console.log(`Added payment ${amount} to chapter ${order.chapter_id}. New total: ${chapterPayments[order.chapter_id]}`);
      });
    });

    console.log('Final chapter payments:', chapterPayments);

    // Calculate expenses as before
    let totalExpenses = 0;
    let pendingExpenses = 0;

    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      if (expense.payment_status === 'paid') {
        totalExpenses += amount;
      } else if (expense.payment_status === 'pending') {
        pendingExpenses += amount;
      }
    });

    // Add members data to detailed kittys
    const detailedKittys = kittyPayments.map(kitty => {
      const relatedchapter = chapters.find(chap => chap.chapter_id === kitty.chapter_id);
      if (!relatedchapter) {
        console.warn(`No chapter found for kitty with chapter_id: ${kitty.chapter_id}`);
        return { ...kitty };
      }

      // Calculate total pending for this chapter
      const chapterMembers = members.filter(member => member.chapter_id === kitty.chapter_id);
      console.log(`Found ${chapterMembers.length} members for chapter ${kitty.chapter_id}`);
      
      const totalPending = chapterMembers.reduce((sum, member) => {
        const balance = parseFloat(member.meeting_opening_balance) || 0;
        console.log(`Member ${member.member_name}: Balance = ${balance}`);
        return sum + balance;
      }, 0);

      console.log(`Chapter ${relatedchapter.chapter_name}: Total Pending = ${totalPending}`);

      const { delete_status, ...chapterWithoutDeleteStatus } = relatedchapter;
      return { 
        ...kitty, 
        ...chapterWithoutDeleteStatus,
        totalExpenses: totalExpenses,
        pendingExpenses: pendingExpenses,
        receivedPayments: chapterPayments[kitty.chapter_id] || 0,
        totalPending: totalPending
      };
    });

    allKittys = detailedKittys;
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
let selectedRegionId = null;
function handleRegionSelection(event) {
  if (event.target && event.target.matches("a.dropdown-item")) {
    selectedRegionId = event.target.dataset.id;
    // Select the clicked region in dropdown
    setSelectedRegion(event.target);
    filterChaptersByRegion(selectedRegionId);
  }
}

// Function to filter chapters based on region
function filterChaptersByRegion(regionId) {
  const chapterFilter = document.getElementById('chapter-filter');
  const chapters = Array.from(chapterFilter.querySelectorAll('a.dropdown-item'));
  
  chapters.forEach(chapter => {
    const chapterRegionId = chapter.dataset.regionId;
    chapter.style.display = (chapterRegionId === regionId) ? 'block' : 'none';
  });
}

// Function to handle chapter selection
let selectedChapterId = null;
function handleChapterSelection(event) {
  if (event.target && event.target.matches("a.dropdown-item")) {
    selectedChapterId = event.target.dataset.id;
    // Select the clicked chapter in dropdown
    setSelectedChapter(event.target);
    filterTable(); // Only filter the table when a chapter is selected
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
  console.log('Calculating totals for all chapters:');
  
  // Initialize total variables
  let grandTotalAvailableFund = 0;
  let grandTotalReceivedPayments = 0;
  let grandTotalPaidExpenses = 0;
  let grandTotalPendingExpenses = 0;
  let grandTotalPendingAmount = 0;  // New variable for total pending amount

  const tableBody = document.getElementById("paymentsTableBody");
  tableBody.innerHTML = kittys
    .map((kitty, index) => {
      // Calculate Available Fund for each row
      const availableFund = kitty.receivedPayments - kitty.totalExpenses;
      
      // Add to grand totals
      grandTotalAvailableFund += availableFund;
      grandTotalReceivedPayments += kitty.receivedPayments;
      grandTotalPaidExpenses += kitty.totalExpenses;
      grandTotalPendingExpenses += kitty.pendingExpenses;
      grandTotalPendingAmount += (kitty.totalPending || 0);  // Add to total pending amount

      console.log(`Chapter: ${kitty.chapter_name}`);
      console.log(`Available Fund: ₹${formatInIndianStyle(availableFund)}`);
      console.log(`Received Payments: ₹${formatInIndianStyle(kitty.receivedPayments)}`);
      console.log(`Paid Expenses: ₹${formatInIndianStyle(kitty.totalExpenses)}`);
      console.log(`Pending Expenses: ₹${formatInIndianStyle(kitty.pendingExpenses)}`);
      console.log(`Total Pending: ₹${formatInIndianStyle(kitty.totalPending || 0)}`);
      console.log('------------------------');

      return `
        <tr>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${index + 1}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.chapter_name || ""}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(availableFund || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.receivedPayments || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.totalPending || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.totalExpenses || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.pendingExpenses || 0)}</strong></td>
        </tr>
      `;
    })
    .join("");

  // Log grand totals
  console.log('Grand Totals:');
  console.log(`Total Available Fund: ₹${formatInIndianStyle(grandTotalAvailableFund)}`);
  console.log(`Total Received Payments: ₹${formatInIndianStyle(grandTotalReceivedPayments)}`);
  console.log(`Total Paid Expenses: ₹${formatInIndianStyle(grandTotalPaidExpenses)}`);
  console.log(`Total Pending Expenses: ₹${formatInIndianStyle(grandTotalPendingExpenses)}`);
  console.log(`Total Pending Amount: ₹${formatInIndianStyle(grandTotalPendingAmount)}`);

  // Update all boxes
  document.getElementById('totalRaised').textContent = formatInIndianStyle(grandTotalAvailableFund || 0);
  
  const receivedPaymentsElement = document.querySelector('[id*="receivedPayments"]');
  if (receivedPaymentsElement) {
    receivedPaymentsElement.textContent = formatInIndianStyle(grandTotalReceivedPayments || 0);
  }

  const paidExpensesElement = document.querySelector('[id*="paidExpenses"]');
  if (paidExpensesElement) {
    paidExpensesElement.textContent = formatInIndianStyle(grandTotalPaidExpenses || 0);
  }

  const pendingExpensesElement = document.querySelector('[id*="pendingExpenses"]');
  if (pendingExpensesElement) {
    pendingExpensesElement.textContent = formatInIndianStyle(grandTotalPendingExpenses || 0);
  }

  const totalPendingAmountElement = document.getElementById('totalPendingAmount');
  if (totalPendingAmountElement) {
    totalPendingAmountElement.textContent = formatInIndianStyle(grandTotalPendingAmount || 0);
  }
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
