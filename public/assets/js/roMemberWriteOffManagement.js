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
let writeOffData = [];

// Function to fetch member data
async function fetchMembersData() {
    try {
        const response = await fetch("http://backend.bninewdelhi.com/api/members");
        membersData = await response.json();
    } catch (error) {
        console.error("Error fetching members data:", error);
    }
}

async function fetchWriteOffData() {
    try {
        const response = await fetch('http://backend.bninewdelhi.com/api/getAllMemberWriteOff');
        writeOffData = await response.json();
    } catch (error) {
        console.error('Error fetching write-off data:', error);
    }
}

async function fetchAndFilterData() {
    showLoader();
    try {
        await Promise.all([
            fetchWriteOffData(),
            fetchMembersData(),
            // Fetch chapters data
            fetch("http://backend.bninewdelhi.com/api/chapters")
        ]);

        // Fetch write-off data
        const response = await fetch("http://backend.bninewdelhi.com/api/getAllMemberWriteOff");
        const data = await response.json();
        console.log("Write-off Data:", data);

        // Fetch chapters data
        const chaptersResponse = await fetch("http://backend.bninewdelhi.com/api/chapters");
        const chaptersData = await chaptersResponse.json();
        console.log("Chapters Data:", chaptersData);

        // Clear existing table content
        const tableBody = document.getElementById("chaptersTableBody");
        console.log("Table Body Element:", tableBody);

        if (tableBody) {
            tableBody.innerHTML = "";
            let index = 0;
            totalcreditamount = 0;

            // Group data by rightoff_date and credit_type
            const groupedData = data.reduce((acc, curr) => {
                const key = `${curr.rightoff_date}_${curr.credit_type}`;
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
                    const totalCreditAmount = entries.length * parseFloat(entry.total_pending_amount);
                    totalcreditamount += totalCreditAmount;
                    index += 1;

                    // Find chapter name
                    const chapter = chaptersData.find(ch => String(ch.chapter_id) === String(entry.chapter_id));
                    const chapterName = chapter ? chapter.chapter_name : `Chapter ${entry.chapter_id}`;

                    const row = document.createElement("tr");
                    const formattedDate = new Date(entry.rightoff_date).toLocaleDateString("en-US");
                    row.innerHTML = `
                        <td><b>${index}</b></td>
                        <td><b>${formattedDate}</b></td>
                        <td><b>${entry.writeoff_comment}</b></td>
                        <td><b>
                            ${entries.length}
                            <button onclick="viewMembers(${JSON.stringify(entries.map(e => e.member_id))})" style="border:none;background:none;">
                                <img width="16" height="16" src="https://img.icons8.com/material-rounded/16/visible.png" alt="View" style="border-radius:50%;"/>
                            </button>
                            </b>
                        </td>
                        <td><b>${totalCreditAmount}</b></td>
                        <td><b>${chapterName}</b></td>
                    `;
                    console.log("Created row:", row);
                    tableBody.appendChild(row);
                }
            });

            // Update total credit amount display
            const totalElement = document.getElementById("total_credit_amount");
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
        const writeOffMember = writeOffData.find(w => w.member_id === id);
        return writeOffMember
            ? {
                name: writeOffMember.member_name,
                phone: writeOffMember.member_phone,
                email: writeOffMember.member_email,
                status: 'Inactive'  // Static status as requested
            }
            : { name: id, phone: "N/A", email: "N/A", status: "N/A" };
    });

    let tableContent = "<table><tr><th>Index</th><th>Member Name</th><th>Phone Number</th><th>Email</th><th>Status</th></tr>";
    memberDetails.forEach((detail, index) => {
        tableContent += `<tr style="border: 1px solid #ddd; margin: 5px 0; text-align: center;">
            <td>${index + 1}</td>
            <td style="display: flex; align-items: center;">
                <img src="https://cdn-icons-png.flaticon.com/512/194/194828.png" alt="Member" 
                    style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;">
                ${detail.name}
            </td>
            <td>${detail.phone}</td>
            <td>${detail.email}</td>
            <td>${detail.status}</td>
        </tr>`;
    });
    tableContent += "</table>";

    Swal.fire({
        title: "Members that write-off are:",
        html: tableContent,
        width: '800px'
    });
}

// Initialize the data fetch
fetchAndFilterData();
  