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
        const response = await fetch("https://bni-data-backend.onrender.com/api/members");
        membersData = await response.json();
    } catch (error) {
        console.error("Error fetching members data:", error);
    }
}

// Function to fetch, filter data into three categories, and count unique dates
async function fetchAndFilterData() {
    try {
        showLoader();
        await fetchMembersData();
        const response = await fetch("https://bni-data-backend.onrender.com/api/getAllMemberCredit");
        const data = await response.json();
        
        const allSelectedData = data.filter(item => item.credit_type === "allselected");
        const particularData = data.filter(item => item.credit_type === "particular");
        const singleData = data.filter(item => item.credit_type === "single");
        
        console.log("All Selected Data:", allSelectedData);
        console.log("Particular Data:", particularData);
        console.log("Single Data:", singleData);

        const getUniqueDates = (data) => {
            const dates = new Set(data.map(item => item.credit_date));
            return Array.from(dates);
        };

        const uniqueDatesAllSelected = getUniqueDates(allSelectedData);
        const uniqueDatesParticular = getUniqueDates(particularData);
        const uniqueDatesSingle = getUniqueDates(singleData);

        console.log("Unique Dates in All Selected Data:", uniqueDatesAllSelected);
        console.log("Unique Dates in Particular Data:", uniqueDatesParticular);
        console.log("Unique Dates in Single Data:", uniqueDatesSingle);

        const filterDataByUniqueDates = (data, uniqueDates) => {
            return uniqueDates.map(date => data.filter(item => item.credit_date === date));
        };

        const filteredAllSelectedData = filterDataByUniqueDates(allSelectedData, uniqueDatesAllSelected);
        const filteredParticularData = filterDataByUniqueDates(particularData, uniqueDatesParticular);
        const filteredSingleData = filterDataByUniqueDates(singleData, uniqueDatesSingle);

        console.log("Filtered All Selected Data by Unique Dates:", filteredAllSelectedData);
        console.log("Filtered Particular Data by Unique Dates:", filteredParticularData);
        console.log("Filtered Single Data by Unique Dates:", filteredSingleData);

        const userEmail = getUserEmail();
        const userName = userEmail.split('@')[0];

        let index = 0;
        let totalCreditAmountSum = 0;
        const insertRowsIntoTable = (filteredData, tableBodyId) => {
            const tableBody = document.getElementById(tableBodyId);
            filteredData.forEach((entries) => {
                if (entries.length > 0) {
                    const entry = entries[0];
                    const totalCreditAmount = entries.length * parseFloat(entry.credit_amount);
                    totalcreditamount += totalCreditAmount;
                    totalCreditAmountSum += totalCreditAmount;
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
                        <td><b>${userName}</b></td>
                    `;
                    tableBody.appendChild(row);
                }
            });
        };

        insertRowsIntoTable(filteredAllSelectedData, 'chaptersTableBody');
        insertRowsIntoTable(filteredParticularData, 'chaptersTableBody');
        insertRowsIntoTable(filteredSingleData, 'chaptersTableBody');
        console.log('Total credit amount:', totalcreditamount);
        console.log('Sum of all total credit amounts:', totalCreditAmountSum);
        document.getElementById('total_credit_amount').innerHTML = totalcreditamount;
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

// Example usage
fetchAndFilterData();

