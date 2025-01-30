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
  const regionFilter = document.getElementById('region-filter');
  const chapterFilter = document.getElementById('chapter-filter');
  const regionButton = document.querySelector('.region-button');
  
  // Fetch regions, chapters, and kitty payments data
  const [regions, chapters, kittyPayments] = await Promise.all([ 
    fetch('https://bni-data-backend.onrender.com/api/regions').then(res => res.json()),
    fetch('https://bni-data-backend.onrender.com/api/chapters').then(res => res.json()),
    fetch('https://bni-data-backend.onrender.com/api/getAllKittyPayments').then(res => res.json())
  ]);

  // Populate region dropdown
  regions.forEach(region => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="dropdown-item" href="javascript:void(0);" data-id="${region.region_id}">${region.region_name}</a>`;
    regionFilter.appendChild(li);
  });

  // Populate chapter dropdown
  chapters.forEach(chapter => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="dropdown-item" href="javascript:void(0);" data-id="${chapter.chapter_id}" data-region-id="${chapter.region_id}">${chapter.chapter_name}</a>`;
    chapterFilter.appendChild(li);
  });

  regionFilter.addEventListener('click', handleRegionSelection);
  chapterFilter.addEventListener('click', handleChapterSelection);
  
  const detailedKittys = kittyPayments.map(kitty => {
    const relatedchapter = chapters.find(chap => chap.chapter_id === kitty.chapter_id);
    if (!relatedchapter) {
      console.warn(`No chapter found for kitty with chapter_id: ${kitty.chapter_id}`);
      return { ...kitty }; // Just return the kitty object as is
    }
    const { delete_status, ...chapterWithoutDeleteStatus } = relatedchapter;
    return { ...kitty, ...chapterWithoutDeleteStatus };
  });
  allKittys = detailedKittys;

  // Display all entries initially
  populateMonthDropdown(allKittys);
  displayPayments(allKittys);
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
  const tableBody = document.getElementById("paymentsTableBody");
  tableBody.innerHTML = kittys
    .map((kitty, index) => `
      <tr>
        <td style="border: 1px solid lightgrey; text-align: center;"><strong>${index + 1}</strong></td>
        <td style="border: 1px solid lightgrey; text-align: center;"><strong>${new Date(kitty.raised_on).toLocaleDateString()}</strong></td>
        <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.chapter_name || "N/A"}</strong></td>
        <td style="border: 1px solid lightgrey; text-align: center;"><strong>${formatInIndianStyle(kitty.total_bill_amount) || "N/A"}</strong></td>
        <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.description || "N/A"}</strong></td>
        <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.bill_type || "N/A"}</strong></td>
        <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.total_weeks || "N/A"}</strong></td>
        <td style="border: 1px solid lightgrey; text-align: center;">
          <strong style="color: ${kitty.delete_status === 0 ? 'green' : 'red'};">
            ${kitty.delete_status === 0 ? 'Active' : 'Inactive'}
          </strong>
        </td>
      </tr>
    `)
    .join("");

  // Calculate and display the total bill raised
  const totalBillRaised = kittys.reduce((acc, kitty) => acc + (parseFloat(kitty.total_bill_amount) || 0), 0);
  const total = document.getElementById("totalRaised");
  total.innerHTML = formatInIndianStyle(totalBillRaised);
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


// ------endd--
// document.addEventListener("DOMContentLoaded", () => {
//   fetchPayments(); // Call fetchPayments when the document is fully loaded
// });

// function formatInIndianStyle(number) {
//   return new Intl.NumberFormat('en-IN').format(number);
// }

// const monthNames = [
//   "January", "February", "March", "April", "May", "June",
//   "July", "August", "September", "October", "November", "December"
// ];

// let allKittys = []; // Store all kitty payments globally
// let filteredKittys = []; // Store filtered kitty payments globally after region/chapter filtering
// let selectedMonth = null; // Track the selected month filter

// // Function to show loader
// function showLoader() {
//   document.getElementById('loader').style.display = 'flex';
// }

// // Function to hide loader
// function hideLoader() {
//   document.getElementById('loader').style.display = 'none';
// }

// async function fetchPayments() {
//   const regionFilter = document.getElementById('region-filter');
//   const chapterFilter = document.getElementById('chapter-filter');
  
//   // Fetch regions, chapters, and kitty payments data
//   const [regions, chapters, kittyPayments] = await Promise.all([ 
//     fetch('https://bni-data-backend.onrender.com/api/regions').then(res => res.json()),
//     fetch('https://bni-data-backend.onrender.com/api/chapters').then(res => res.json()),
//     fetch('https://bni-data-backend.onrender.com/api/getAllKittyPayments').then(res => res.json())
//   ]);

//   // Populate region dropdown
//   regions.forEach(region => {
//     const li = document.createElement('li');
//     li.innerHTML = `<a class="dropdown-item" href="javascript:void(0);" data-id="${region.region_id}">${region.region_name}</a>`;
//     regionFilter.appendChild(li);
//   });

//   // Populate chapter dropdown
//   chapters.forEach(chapter => {
//     const li = document.createElement('li');
//     li.innerHTML = `<a class="dropdown-item" href="javascript:void(0);" data-id="${chapter.chapter_id}" data-region-id="${chapter.region_id}">${chapter.chapter_name}</a>`;
//     chapterFilter.appendChild(li);
//   });

//   regionFilter.addEventListener('click', handleRegionSelection);
//   chapterFilter.addEventListener('click', handleChapterSelection);
  
//   const detailedKittys = kittyPayments.map(kitty => {
//     const relatedchapter = chapters.find(chap => chap.chapter_id === kitty.chapter_id);
//     if (!relatedchapter) {
//       console.warn(`No chapter found for kitty with chapter_id: ${kitty.chapter_id}`);
//       return { ...kitty }; // Just return the kitty object as is
//     }
//     const { delete_status, ...chapterWithoutDeleteStatus } = relatedchapter;
//     return { ...kitty, ...chapterWithoutDeleteStatus };
//   });
//   allKittys = detailedKittys;

//   // Display all entries initially
//   populateMonthDropdown(allKittys);
//   displayPayments(allKittys);
// }

// // ---------------------------------------------------------------------------------------------------------
// // Function to populate the month dropdown with month names (January, February, etc.)
// function populateMonthDropdown(kittys) {
//   const monthFilterElement = document.getElementById("month-filter");
//   const uniqueMonths = new Set();

//   kittys.forEach(item => {
//     const date = new Date(item.raised_on);
//     const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`; // Format: Month YYYY
//     uniqueMonths.add(monthYear);
//   });

//   uniqueMonths.forEach(monthYear => {
//     const li = document.createElement("li");
//     const a = document.createElement("a");
//     a.classList.add("dropdown-item");
//     a.href = "#";
//     a.textContent = monthYear;

//     a.addEventListener("click", function() {
//       // Select this month in dropdown
//       setSelectedMonth(monthYear);
      
//       // Apply the month filter based on already filtered data (from chapter selection)
//       const currentFilteredData = filterTable(); // Get already filtered data
//       filterTableByMonth(monthYear, currentFilteredData); // Now filter by month on the filtered data
//     });

//     li.appendChild(a);
//     monthFilterElement.appendChild(li);
//   });
// }

// // Function to filter the table based on the selected month
// function filterTableByMonth(monthYear, kittys) {
//   // If month is not selected, return the unfiltered data
//   if (!monthYear) {
//     displayPayments(kittys); // Show the original filtered data without month filtering
//     return;
//   }

//   const filteredData = kittys.filter(item => {
//     const date = new Date(item.raised_on);
//     const itemMonthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`; // Format: Month YYYY
//     return itemMonthYear === monthYear;
//   });

//   displayPayments(filteredData); // Display the filtered payments for selected month
// }

// // -----------------------------------------------------------------------------------------------------

// // Function to handle region selection
// let selectedRegionId = null;
// function handleRegionSelection(event) {
//   if (event.target && event.target.matches("a.dropdown-item")) {
//     selectedRegionId = event.target.dataset.id;
//     // Select the clicked region in dropdown
//     setSelectedRegion(event.target);
//     filterChaptersByRegion(selectedRegionId);
//   }
// }

// // Function to filter chapters based on region
// function filterChaptersByRegion(regionId) {
//   const chapterFilter = document.getElementById('chapter-filter');
//   const chapters = Array.from(chapterFilter.querySelectorAll('a.dropdown-item'));
  
//   chapters.forEach(chapter => {
//     const chapterRegionId = chapter.dataset.regionId;
//     chapter.style.display = (chapterRegionId === regionId) ? 'block' : 'none';
//   });
// }

// // Function to handle chapter selection
// let selectedChapterId = null;
// function handleChapterSelection(event) {
//   if (event.target && event.target.matches("a.dropdown-item")) {
//     selectedChapterId = event.target.dataset.id;
//     // Select the clicked chapter in dropdown
//     setSelectedChapter(event.target);
//     filterTable(); // Only filter the table when a chapter is selected
//   }
// }

// // Function to filter the table based on selected region and chapter
// function filterTable() {
//   let filteredData = allKittys;

//   // If a chapter is selected, filter by chapter
//   if (selectedChapterId) {
//     filteredData = filteredData.filter(item => item.chapter_id === parseInt(selectedChapterId));
//   }

//   filteredKittys = filteredData; // Save the filtered data for later month filtering

//   // Apply month filter if selected
//   if (selectedMonth) {
//     filterTableByMonth(selectedMonth, filteredData);
//   } else {
//     // Display the filtered data without month filter
//     displayPayments(filteredData);
//   }
  
//   return filteredData; // Return the filtered data to be used by the month filter
// }

// // Function to display payments in the table
// function displayPayments(kittys) {
//   const tableBody = document.getElementById("paymentsTableBody");
//   tableBody.innerHTML = kittys
//     .map((kitty, index) => `
//       <tr>
//         <td style="border: 1px solid lightgrey; text-align: center;"><strong>${index + 1}</strong></td>
//         <td style="border: 1px solid lightgrey; text-align: center;"><strong>${new Date(kitty.raised_on).toLocaleDateString()}</strong></td>
//         <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.chapter_name || "N/A"}</strong></td>
//         <td style="border: 1px solid lightgrey; text-align: center;"><strong>${formatInIndianStyle(kitty.total_bill_amount) || "N/A"}</strong></td>
//         <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.description || "N/A"}</strong></td>
//         <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.bill_type || "N/A"}</strong></td>
//         <td style="border: 1px solid lightgrey; text-align: center;"><strong>${kitty.total_weeks || "N/A"}</strong></td>
//         <td style="border: 1px solid lightgrey; text-align: center;">
//           <strong style="color: ${kitty.delete_status === 0 ? 'green' : 'red'};">
//             ${kitty.delete_status === 0 ? 'Active' : 'Inactive'}
//           </strong>
//         </td>
//       </tr>
//     `)
//     .join("");

//   // Calculate and display the total bill raised
//   const totalBillRaised = kittys.reduce((acc, kitty) => acc + (parseFloat(kitty.total_bill_amount) || 0), 0);
//   const total = document.getElementById("totalRaised");
//   total.innerHTML = formatInIndianStyle(totalBillRaised);
// }

// // Function to set selected region in dropdown
// function setSelectedRegion(regionElement) {
//   const regionFilter = document.getElementById('region-filter');
//   // Remove "active" class from any previously selected region
//   const activeRegion = regionFilter.querySelector(".dropdown-item.active");
//   if (activeRegion) activeRegion.classList.remove("active");

//   // Add "active" class to the selected region
//   regionElement.classList.add("active");
// }

// // Function to set selected chapter in dropdown
// function setSelectedChapter(chapterElement) {
//   const chapterFilter = document.getElementById('chapter-filter');
//   // Remove "active" class from any previously selected chapter
//   const activeChapter = chapterFilter.querySelector(".dropdown-item.active");
//   if (activeChapter) activeChapter.classList.remove("active");

//   // Add "active" class to the selected chapter
//   chapterElement.classList.add("active");
// }

// // Function to set selected month in dropdown
// function setSelectedMonth(monthYear) {
//   const monthFilterElement = document.getElementById("month-filter");
//   // Remove "active" class from any previously selected month
//   const activeMonth = monthFilterElement.querySelector(".dropdown-item.active");
//   if (activeMonth) activeMonth.classList.remove("active");

//   // Add "active" class to the selected month
//   const selectedMonthElement = Array.from(monthFilterElement.querySelectorAll('.dropdown-item'))
//                                       .find(item => item.textContent === monthYear);
//   if (selectedMonthElement) {
//     selectedMonthElement.classList.add("active");
//   }

//   selectedMonth = monthYear; // Update the selected month global variable
// }
