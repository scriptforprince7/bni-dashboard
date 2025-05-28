// Function to show the loader
function showLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "flex";
    } else {
        console.error("Loader element not found");
    }
}

// Function to hide the loader
function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "none";
    } else {
        console.error("Loader element not found");
    }
}

let totalcreditamount = 0;
let membersData = [];
let chaptersData = []; // Added to store chapters data
let selectedRegionId = null;
let selectedChapterId = null;

// Function to fetch member data
async function fetchMembersData() {
    try {
        const response = await fetch("https://backend.bninewdelhi.com/api/members");
        membersData = await response.json();
    } catch (error) {
        console.error("Error fetching members data:", error);
    }
}

// Added new function to fetch chapters data
async function fetchChaptersData() {
    try {
        const response = await fetch("https://backend.bninewdelhi.com/api/chapters");
        chaptersData = await response.json();
        console.log("📚 Fetched chapters data:", chaptersData);
    } catch (error) {
        console.error("❌ Error fetching chapters data:", error);
    }
}

// Add event listeners for filters
function setupFilterListeners() {
    // Region filter click handler
    document.getElementById('regionFilter').addEventListener('click', async (e) => {
        if (e.target.classList.contains('dropdown-item')) {
            selectedRegionId = parseInt(e.target.dataset.regionId);
            console.log('🌍 Selected Region ID:', selectedRegionId);
            await fetchAndFilterData();
        }
    });

    // Chapter filter click handler
    document.getElementById('chapterFilter').addEventListener('click', async (e) => {
        if (e.target.classList.contains('dropdown-item')) {
            selectedChapterId = parseInt(e.target.dataset.chapterId);
            console.log('🏢 Selected Chapter ID:', selectedChapterId);
            await fetchAndFilterData();
        }
    });

    // Reset filters
    document.getElementById('reset-filters-btn').addEventListener('click', async () => {
        console.log('🔄 Resetting filters');
        selectedRegionId = null;
        selectedChapterId = null;
        await fetchAndFilterData();
    });
}

async function fetchAndFilterData() {
    try {
        showLoader();
        await Promise.all([fetchMembersData(), fetchChaptersData()]);

        const response = await fetch("https://backend.bninewdelhi.com/api/getAllMemberCredit");
        const creditData = await response.json();
        console.log("📊 All credit data:", creditData);

        // Apply filters
        let filteredData = creditData;

        if (selectedRegionId) {
            console.log('🔍 Filtering by Region ID:', selectedRegionId);
            // Filter chapters by selected region
            const chaptersInRegion = chaptersData.filter(ch => ch.region_id === selectedRegionId);
            console.log('📍 Chapters in selected region:', chaptersInRegion);

            // Filter credit data for chapters in selected region
            filteredData = filteredData.filter(credit => 
                chaptersInRegion.some(ch => ch.chapter_id === credit.chapter_id)
            );
            console.log('🎯 Data after region filter:', filteredData);
        }

        if (selectedChapterId) {
            console.log('🔍 Filtering by Chapter ID:', selectedChapterId);
            // Filter credit data for selected chapter
            filteredData = filteredData.filter(credit => credit.chapter_id === selectedChapterId);
            console.log('🎯 Data after chapter filter:', filteredData);
        }

        // Group filtered data
        const groupedData = filteredData.reduce((acc, curr) => {
            const key = `${curr.credit_date}_${curr.credit_type}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(curr);
            return acc;
        }, {});

        console.log("🔍 Grouped filtered data:", groupedData);

        // Update table
        const tableBody = document.getElementById('chaptersTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            let index = 0;
            totalcreditamount = 0;

            Object.values(groupedData).forEach(entries => {
                if (entries.length > 0) {
                    const entry = entries[0];
                    const totalCreditAmount = entries.length * parseFloat(entry.credit_amount);
                    totalcreditamount += totalCreditAmount;
                    index += 1;

                    const chapter = chaptersData.find(ch => ch.chapter_id === entry.chapter_id);
                    const chapterName = chapter ? chapter.chapter_name : 'Unknown Chapter';
                    console.log(`🏢 Displaying chapter: ${chapterName} (ID: ${entry.chapter_id})`);

                    const row = document.createElement('tr');
                    const formattedDate = new Date(entry.credit_date).toLocaleDateString('en-US');
                    row.innerHTML = `
                        <td><b>${index}</b></td>
                        <td><b>${formattedDate}</b></td>
                        <td><b>${entry.credit_type}</b></td>    
                        <td><b>${chapterName}</b></td>
                        <td><b>
                            ${entries.length}
                            <button onclick="viewMembers(${JSON.stringify(entries.map(e => e.member_id))})" style="border:none;background:none;">
                                <img width="16" height="16" src="https://img.icons8.com/material-rounded/16/visible.png" alt="View" style="border-radius:50%;"/>
                            </button>
                            </b>
                        </td>
                        <td><b>${entry.credit_amount}</b></td>
                        <td><b>${totalCreditAmount}</b></td>
                        <td><b>${getUserEmail().split('@')[0]}</b></td>
                    `;
                    tableBody.appendChild(row);
                }
            });

            // Update total
            const totalElement = document.getElementById('total_credit_amount');
            if (totalElement) {
                totalElement.textContent = totalcreditamount;
                console.log('💰 Updated total credit amount:', totalcreditamount);
            }
        }

    } catch (error) {
        console.error("❌ Error in fetchAndFilterData:", error);
    } finally {
        hideLoader();
    }
}

// Function to view members in a popup
function viewMembers(memberIds) {
    const memberDetails = memberIds.map(id => {
        const member = membersData.find(m => m.member_id === id);
        return member ? { name: member.member_first_name, phone: member.member_phone_number, status: member.member_status } : { name: id, phone: 'N/A', status: 'N/A' };
    });
    
    let tableContent = '<table><tr><th>Index</th><th>Member Name</th><th>Phone Number</th><th>Status</th></tr>';
    memberDetails.forEach((detail, index) => {
        tableContent += `<tr style="border: 1px solid #ddd; margin: 5px 0; text-align: center;"><td>${index + 1}</td><td style="display: flex; align-items: center;"><img src="https://cdn-icons-png.flaticon.com/512/194/194828.png" alt="Member" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;">${detail.name}</td><td>${detail.phone}</td><td>${detail.status}</td></tr>`;
    });
    tableContent += '</table>';

    Swal.fire({
        title: "Members that received credit are:",
        html: tableContent
    });
}

// Function to populate region and chapter filters
async function populateFilters() {
    try {
        console.log('🔄 Starting to populate filters...');

        // Fetch regions and chapters in parallel
        const [regionsResponse, chaptersResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/regions'),
            fetch('https://backend.bninewdelhi.com/api/chapters')
        ]);

        const regions = await regionsResponse.json();
        const chapters = await chaptersResponse.json();

        console.log('📍 Fetched Regions:', regions);
        console.log('🏢 Fetched Chapters:', chapters);

        // Populate Region Filter
        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
            regionFilter.innerHTML = regions.map(region => `
                <li>
                    <a class="dropdown-item" href="javascript:void(0);" data-region-id="${region.region_id}">
                        ${region.region_name}
                    </a>
                </li>
            `).join('');
            console.log('✅ Populated Region Filter');
        }

        // Populate Chapter Filter
        const chapterFilter = document.getElementById('chapterFilter');
        if (chapterFilter) {
            chapterFilter.innerHTML = chapters.map(chapter => `
                <li>
                    <a class="dropdown-item" href="javascript:void(0);" data-chapter-id="${chapter.chapter_id}">
                        ${chapter.chapter_name}
                    </a>
                </li>
            `).join('');
            console.log('✅ Populated Chapter Filter');
        }

    } catch (error) {
        console.error('❌ Error populating filters:', error);
    }
}

// Initialize filters when document loads
document.addEventListener('DOMContentLoaded', () => {
    setupFilterListeners();
    populateFilters();
    fetchAndFilterData();
});

