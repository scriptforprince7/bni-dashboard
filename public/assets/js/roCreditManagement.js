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

// Function to fetch member data
async function fetchMembersData() {
    try {
        const response = await fetch("https://backend.bninewdelhi.com/api/members");
        membersData = await response.json();
    } catch (error) {
        console.error("Error fetching members data:", error);
    }
}

async function fetchAndFilterData() {
    try {
        showLoader();
        await fetchMembersData();

        // Get logged-in chapter info
        const loginType = getUserLoginType();
        let chapterEmail, chapter_id;

        if (loginType === 'ro_admin') {
            chapterEmail = localStorage.getItem('current_chapter_email');
            chapter_id = localStorage.getItem('current_chapter_id');
            if (!chapterEmail || !chapter_id) {
                console.error('Missing required data for RO Admin');
                hideLoader();
                return;
            }
        } else {
            chapterEmail = getUserEmail();
            const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters'); 
            const chapters = await chaptersResponse.json();
            const chapter = chapters.find(ch => ch.email_id === chapterEmail);
            if (chapter) {
                chapter_id = chapter.chapter_id;
                console.log("Chapter ID:", chapter_id);
            } else {
                console.error('Chapter not found');
                hideLoader();
                return;
            }
        }

        // Fetch credit data
        const response = await fetch("https://backend.bninewdelhi.com/api/getAllMemberCredit");
        const data = await response.json();
        
        // Filter data for current chapter
        const chapterData = data.filter(item => parseInt(item.chapter_id) === parseInt(chapter_id));
        console.log("Chapter Data:", chapterData);
        
        // Clear existing table content
        const tableBody = document.getElementById('chaptersTableBody');
        console.log("Table Body Element:", tableBody);
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            let index = 0;
            totalcreditamount = 0;

            // Group data by credit_date and credit_type
            const groupedData = chapterData.reduce((acc, curr) => {
                const key = `${curr.credit_date}_${curr.credit_type}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(curr);
                return acc;
            }, {});

            // Process each group
            Object.values(groupedData).forEach(entries => {
                if (entries.length > 0) {
                    const entry = entries[0];
                    const totalCreditAmount = entries.length * parseFloat(entry.credit_amount);
                    totalcreditamount += totalCreditAmount;
                    index += 1;

                    const row = document.createElement('tr');
                    const formattedDate = new Date(entry.credit_date).toLocaleDateString('en-US');
                    row.innerHTML = `
                        <td><b>${index}</b></td>
                        <td><b>${formattedDate}</b></td>
                        <td><b>${entry.credit_type}</b></td>
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
                    console.log('Created row:', row);
                    tableBody.appendChild(row);
                }
            });

            // Update total credit amount display
            const totalElement = document.getElementById('total_credit_amount');
            if (totalElement) {
                totalElement.textContent = totalcreditamount;
            }
        } else {
            console.error("Table body element not found");
        }

    } catch (error) {
        console.error("Error fetching data:", error);
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

// Initialize the data fetch
fetchAndFilterData();

