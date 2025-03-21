function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

const memberApiUrl = 'https://backend.bninewdelhi.com/api/members';
const lateNOApiUrl = 'https://backend.bninewdelhi.com/api/getbankOrder';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get late payment data
        const lateNOResponse = await fetch(lateNOApiUrl);
        if (!lateNOResponse.ok) throw new Error('Network response was not ok');
        const memberLateData = await lateNOResponse.json();
        console.log('Member credit data fetched successfully:', memberLateData);

        // Get all members
        const MembersResponse = await fetch(memberApiUrl);
        if (!MembersResponse.ok) throw new Error('Network response was not ok');
        const Members = await MembersResponse.json();
        console.log('members Found:', Members.length);

        // Store members data globally
        window.allMembers = Members;

        const tableBody = document.getElementById('chaptersTableBody');
        if (Members.length > 0) {
            tableBody.innerHTML = '';

            Members.forEach((member, index) => {
                const row = document.createElement('tr');

                const latePaymentData = memberLateData.find(lateData => lateData.member_id === member.member_id);
                const latePaymentCount = latePaymentData ? latePaymentData.no_of_late_payment : 0;

                // Checkbox cell
                const checkboxCell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = member.member_id;
                checkbox.style.fontWeight = 'bold';
                checkboxCell.appendChild(checkbox);
                row.appendChild(checkboxCell);

                // Serial number cell
                const serialNumberCell = document.createElement('td');
                serialNumberCell.textContent = index + 1;
                serialNumberCell.style.fontWeight = 'bold';
                row.appendChild(serialNumberCell);

                // Name cell with image
                const nameCell = document.createElement('td');
                nameCell.style.fontWeight = 'bold';
                
                const img = document.createElement('img');
                img.src = 'https://cdn-icons-png.flaticon.com/512/194/194828.png';
                img.alt = '';
                img.style.width = '30px';
                img.style.height = '30px';
                img.style.borderRadius = '50%';
                img.style.marginRight = '10px';
                
                nameCell.appendChild(img);
                nameCell.appendChild(document.createTextNode(member.member_first_name + ' ' + member.member_last_name));
                row.appendChild(nameCell);

                // Phone cell
                const phoneCell = document.createElement('td');
                phoneCell.textContent = member.member_phone_number;
                phoneCell.style.fontWeight = 'bold';
                row.appendChild(phoneCell);

                // Status cell
                const statusCell = document.createElement('td');
                statusCell.textContent = member.member_status;
                statusCell.style.fontWeight = 'bold';
                row.appendChild(statusCell);

                // Late Payment cell
                const latePaymentCell = document.createElement('td');
                latePaymentCell.textContent = latePaymentCount;
                latePaymentCell.style.fontWeight = 'bold';
                row.appendChild(latePaymentCell);

                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="font-weight: bold;">No members found</td>
                </tr>`;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('chaptersTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="font-weight: bold;">Error loading members</td>
            </tr>`;
    }
});

document.querySelector('.add_bill').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('#chaptersTableBody input[type="checkbox"]:checked');
    const selectedMembers = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);

    if (selectedMembers.length === 0) {
        alert('Please select at least one member.');
        return;
    }

    const creditAmount = document.querySelector('#total_bill_amount').value.trim();
    const creditDate = document.querySelector('#region_name').value.trim();

    if (!creditAmount || !creditDate) {
        alert('Please fill in all required fields.');
        return;
    }

    // Find the first selected member to get chapter_id
    const firstSelectedMemberId = selectedMembers[0];
    const selectedMember = window.allMembers.find(member => member.member_id.toString() === firstSelectedMemberId);

    if (!selectedMember) {
        console.error('Selected member not found');
        return;
    }

    let creditType;
    const totalEntries = document.querySelectorAll('#chaptersTableBody input[type="checkbox"]').length;
    if (selectedMembers.length === totalEntries) {
        creditType = "allselected";
    } else if (selectedMembers.length === 1) {
        creditType = "single";
    } else {
        creditType = "particular";
    }

    const data = {
        member_id: selectedMembers,
        chapter_id: selectedMember.chapter_id,
        credit_amount: creditAmount,
        credit_date: creditDate,
        credit_type: creditType
    };

    console.log('Sending data:', data);

    try {
        showLoader();
        const response = await fetch('https://backend.bninewdelhi.com/api/addMemberCredit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            Swal.fire({
                title: 'Success!',
                text: 'Credit added successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
                timer: 3000,
                timerProgressBar: true,
                willClose: () => {
                    window.location.href = "/k/credit-management";
                }
            });
            console.log('Credit added successfully:', result);
        } else {
            const errorResult = await response.json();
            console.error('Error adding credit:', response.statusText);
            alert(`Error: ${errorResult.message}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        hideLoader();
    }
});