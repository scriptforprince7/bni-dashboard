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
    const [regions, chapters, kittyPayments, expenses, orders, transactions, members, credits] = await Promise.all([ 
      fetch('https://bni-data-backend.onrender.com/api/regions').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/chapters').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/getAllKittyPayments').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/allExpenses').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/allOrders').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/allTransactions').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/members').then(res => res.json()),
      fetch('https://bni-data-backend.onrender.com/api/getAllMemberCredit').then(res => res.json())
    ]);

    console.log('Fetched all data successfully');

    // Calculate visitor payments
    console.log('Calculating visitor payments...');
    const visitorOrders = orders.filter(order => order.universal_link_id === 4);
    const totalVisitorAmount = visitorOrders.reduce((sum, order) => {
      const amount = parseFloat(order.order_amount || 0);
      console.log(`Visitor Order ${order.order_id}: ₹${formatInIndianStyle(amount)}`);
      return sum + amount;
    }, 0);
    console.log(`Total Visitor Amount: ₹${formatInIndianStyle(totalVisitorAmount)}`);

    // Update visitor payment display
    const visitorAmountElement = document.querySelector('.total_V_amount');
    if (visitorAmountElement) {
      visitorAmountElement.textContent = `₹ ${formatInIndianStyle(totalVisitorAmount)}`;
    }

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

    // Add members data to detailed kittys
    const detailedKittys = chapters.map(chapter => {
      const relatedKitty = kittyPayments.find(kitty => kitty.chapter_id === chapter.chapter_id) || {};
      const chapterMembers = members.filter(member => member.chapter_id === chapter.chapter_id);
      
      const totalPending = chapterMembers.reduce((sum, member) => {
        const balance = parseFloat(member.meeting_opening_balance) || 0;
        return sum + balance;
      }, 0);

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
        totalPending: totalPending,
        memberCount: chapterMembers.length // Add member count
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
      const response = await fetch('https://bni-data-backend.onrender.com/api/chapters');
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
  console.log('Starting to calculate totals for all chapters...');
  
  // Initialize total variables
  let grandTotalAvailableFund = 0;
  let grandTotalPaidExpenses = 0;
  let grandTotalPendingExpenses = 0;
  let grandTotalCreditNoteAmount = 0;

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
      console.log('------------------------');

      return `
        <tr>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${index + 1}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.chapter_name || ""}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.memberCount || 0}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(availableFund)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.receivedPayments || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.totalPending || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.totalExpenses || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(kitty.pendingExpenses || 0)}</strong></td>
          <td style="border: 1px solid lightgrey; text-align: center;"><strong>-</strong></td>
        </tr>
      `;
    })
    .join("");

  // Log final totals
  console.log('=== Final Totals ===');
  console.log(`Total Available Fund: ₹${formatInIndianStyle(grandTotalAvailableFund)}`);
  console.log(`Total Paid Expenses: ₹${formatInIndianStyle(grandTotalPaidExpenses)}`);
  console.log(`Total Pending Expenses: ₹${formatInIndianStyle(grandTotalPendingExpenses)}`);
  console.log(`Total Credit Note Amount: ₹${formatInIndianStyle(grandTotalCreditNoteAmount)}`);

  // Update the Total Available Fund display
  const totalAvailableFundElement = document.querySelector('.total_Available_amount');
  if (totalAvailableFundElement) {
    console.log('Updating Total Available Fund display...');
    totalAvailableFundElement.textContent = `₹ ${formatInIndianStyle(grandTotalAvailableFund)}`;
    console.log('Total Available Fund display updated successfully');
  } else {
    console.error('Total Available Fund element not found in DOM');
  }

  // Update expense totals displays
  document.querySelector('.total_Expense_amount').textContent = `₹ ${formatInIndianStyle(grandTotalPaidExpenses)}`;
  document.querySelector('.total_pExpense_amount').textContent = `₹ ${formatInIndianStyle(grandTotalPendingExpenses)}`;
  document.querySelector('.total_Exnse_amount').textContent = `₹ ${formatInIndianStyle(grandTotalCreditNoteAmount)}`;
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
    fetch('https://bni-data-backend.onrender.com/api/regions')
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
