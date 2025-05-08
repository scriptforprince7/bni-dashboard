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
        // Initially show message in table
        const tableBody = document.getElementById('chaptersTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; font-weight: bold; padding: 20px;">
                    Please Select Region and Chapter to view members
                </td>
            </tr>
        `;

        // Populate Region Filter
        const regionFilter = document.getElementById('regionFilter');
        const regionsResponse = await fetch('https://backend.bninewdelhi.com/api/regions');
        const regions = await regionsResponse.json();
        
        regions.forEach(region => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = 'javascript:void(0);';
            a.textContent = region.region_name;
            a.setAttribute('data-region-id', region.region_id);
            li.appendChild(a);
            regionFilter.appendChild(li);
        });

        // Handle Region Selection
        regionFilter.addEventListener('click', async (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const regionId = e.target.getAttribute('data-region-id');
                const regionName = e.target.textContent;
                
                // Update region button text
                const regionBtn = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
                regionBtn.textContent = regionName;

                // Clear chapter filter and table
                const chapterFilter = document.getElementById('chapterFilter');
                chapterFilter.innerHTML = '';
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; font-weight: bold; padding: 20px;">
                            Please Select Chapter to view members
                        </td>
                    </tr>
                `;

                // Fetch and populate chapters for selected region
                const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
                const chapters = await chaptersResponse.json();
                const filteredChapters = chapters.filter(chapter => chapter.region_id === parseInt(regionId));

                filteredChapters.forEach(chapter => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = 'dropdown-item';
                    a.href = 'javascript:void(0);';
                    a.textContent = chapter.chapter_name;
                    a.setAttribute('data-chapter-id', chapter.chapter_id);
                    li.appendChild(a);
                    chapterFilter.appendChild(li);
                });
            }
        });

        // Handle Chapter Selection
        document.getElementById('chapterFilter').addEventListener('click', async (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const chapterId = e.target.getAttribute('data-chapter-id');
                const chapterName = e.target.textContent;

                // Update chapter button text
                const chapterBtn = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
                chapterBtn.textContent = chapterName;

                // Fetch and display members for selected chapter
                const membersResponse = await fetch(memberApiUrl);
                const members = await membersResponse.json();
                const filteredMembers = members.filter(member => member.chapter_id === parseInt(chapterId));

                // Get late payment data
                const lateNOResponse = await fetch(lateNOApiUrl);
                const memberLateData = await lateNOResponse.json();

                // Store filtered members globally
                window.allMembers = filteredMembers;

                // Populate table with filtered members
                if (filteredMembers.length > 0) {
                    tableBody.innerHTML = '';
                    filteredMembers.forEach((member, index) => {
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
                            <td colspan="6" style="text-align: center; font-weight: bold; padding: 20px;">
                                No members found in this chapter
                            </td>
                        </tr>
                    `;
                }
            }
        });

        // Handle Reset Filters
        document.getElementById('reset-filters-btn').addEventListener('click', () => {
            // Reset dropdown texts
            document.querySelector('[data-bs-toggle="dropdown"]').textContent = 'Region';
            document.querySelectorAll('[data-bs-toggle="dropdown"]')[1].textContent = 'Chapter';
            
            // Clear chapter filter
            document.getElementById('chapterFilter').innerHTML = '';
            
            // Reset table
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; font-weight: bold; padding: 20px;">
                        Please Select Region and Chapter to view members
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('chaptersTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; font-weight: bold; padding: 20px;">
                    Error loading data
                </td>
            </tr>
        `;
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