function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

const chaptersApiUrl = 'http://localhost:5000/api/chapters'; 
const memberApiUrl = 'http://localhost:5000/api/members';
const getBankOrderApi = 'http://localhost:5000/api/getBankOrder';
let creditType;
let chapterEmail;
let current_User;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('=== Initializing Member Write-off Page ===');
        // Add initial message to the table
        const tableBody = document.getElementById('chaptersTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; font-weight: bold; padding: 20px;">
                    Please Select Region and Chapter to view members
                </td>
            </tr>
        `;

        const regionFilter = document.getElementById('region-filter');
        const chapterFilter = document.getElementById('chapter-filter');
        
        // Fetch regions
        console.log('Fetching regions from:', 'http://localhost:5000/api/regions');
        const regionsResponse = await fetch('http://localhost:5000/api/regions');
        const regions = await regionsResponse.json();
        console.log('Fetched regions:', regions);
        
        // Populate region dropdown
        regionFilter.innerHTML = '';
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
        console.log('Populated region dropdown');

        // Handle region selection
        regionFilter.addEventListener('click', async (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const regionId = e.target.getAttribute('data-region-id');
                const regionName = e.target.textContent;
                console.log('Selected Region:', { regionId, regionName });
                
                const regionBtn = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
                regionBtn.textContent = regionName;
                
                // Fetch chapters
                const chaptersUrl = `${chaptersApiUrl}?region_id=${regionId}`;
                console.log('Fetching chapters from:', chaptersUrl);
                const chaptersResponse = await fetch(chaptersUrl);
                const chapters = await chaptersResponse.json();
                console.log('Fetched chapters:', chapters);
                
                // Populate chapter dropdown
                chapterFilter.innerHTML = '';
                chapters.forEach(chapter => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = 'dropdown-item';
                    a.href = 'javascript:void(0);';
                    a.textContent = chapter.chapter_name;
                    a.setAttribute('data-chapter-id', chapter.chapter_id);
                    a.setAttribute('data-email', chapter.email_id);
                    li.appendChild(a);
                    chapterFilter.appendChild(li);
                });
                console.log('Populated chapter dropdown');
            }
        });

        // Handle chapter selection
        chapterFilter.addEventListener('click', async (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const chapterId = e.target.getAttribute('data-chapter-id');
                const chapterName = e.target.textContent;
                chapterEmail = e.target.getAttribute('data-email');
                
                console.log('Selected Chapter:', {
                    chapterId,
                    chapterName,
                    chapterEmail
                });
                
                const chapterBtn = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
                chapterBtn.textContent = chapterName;
                
                current_User = { 
                    chapter_id: chapterId, 
                    email_id: chapterEmail 
                };
                console.log('Set current_User:', current_User);

                // Fetch and display members
                await loadMembers(chapterId);
            }
        });

        // Apply filters button click handler
        document.getElementById('apply-filters-btn').addEventListener('click', async () => {
            if (current_User && current_User.chapter_id) {
                await loadMembers(current_User.chapter_id);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Selection Required',
                    text: 'Please select both region and chapter before applying filters.',
                    confirmButtonColor: '#dc3545'
                });
            }
        });

        // Reset filters button click handler
        document.getElementById('reset-filters-btn').addEventListener('click', () => {
            location.reload();
        });

        // Function to load members
        async function loadMembers(chapterId) {
            try {
                console.log('=== Loading Members Process Started ===');
                console.log('Loading members for chapter ID:', chapterId);
                showLoader();
                
                // Fetch writeoff data
                console.log('Fetching writeoff data...');
                const writeoffResponse = await fetch('http://localhost:5000/api/getAllMemberWriteOff');
                const writeoffData = await writeoffResponse.json();
                console.log('Writeoff data:', writeoffData);

                // Fetch all members first
                console.log('Fetching all members from:', memberApiUrl);
                const MembersResponse = await fetch(memberApiUrl);
                if (!MembersResponse.ok) throw new Error('Network response was not ok');
                const Members = await MembersResponse.json();
                console.log('All members fetched:', Members);

                // Filter members by chapter_id
                const filteredMembers = Members.filter(member => String(member.chapter_id) === String(chapterId));
                console.log('Filtered members for chapter:', filteredMembers);

                const tableBody = document.getElementById('chaptersTableBody');
                if (filteredMembers.length > 0) {
                    console.log(`Found ${filteredMembers.length} members for chapter`);
                    tableBody.innerHTML = '';

                    // Check if all members are written off
                    const allMembersWrittenOff = filteredMembers.every(member => 
                        writeoffData.some(wo => 
                            parseInt(wo.member_id) === parseInt(member.member_id) && 
                            parseInt(wo.chapter_id) === parseInt(current_User.chapter_id)
                        )
                    );
                    console.log('All members written off:', allMembersWrittenOff);

                    // Auto-check "Select All" if all members are written off
                    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
                    if (allMembersWrittenOff) {
                        selectAllCheckbox.checked = true;
                        selectAllCheckbox.disabled = true;
                    }

                    filteredMembers.forEach((member, index) => {
                        // Check if member is written off
                        const isWrittenOff = writeoffData.some(wo => 
                            parseInt(wo.member_id) === parseInt(member.member_id) && 
                            parseInt(wo.chapter_id) === parseInt(current_User.chapter_id)
                        );
                        console.log(`Member ${member.member_first_name} writeoff status:`, isWrittenOff);

                        const row = document.createElement('tr');
                        
                        // Checkbox cell
                        const checkboxCell = document.createElement('td');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.value = member.member_id;
                        checkbox.style.fontWeight = 'bold';
                        
                        if (isWrittenOff) {
                            checkbox.checked = true;
                            checkbox.disabled = true;
                            row.style.backgroundColor = '#e8f5e9'; // Light green background
                        }
                        
                        checkboxCell.appendChild(checkbox);
                        row.appendChild(checkboxCell);

                        // Serial number cell
                        const serialNumberCell = document.createElement('td');
                        serialNumberCell.textContent = index + 1;
                        serialNumberCell.style.fontWeight = 'bold';
                        row.appendChild(serialNumberCell);

                        // Name cell
                        const nameCell = document.createElement('td');
                        nameCell.style.fontWeight = 'bold';
                        nameCell.style.textAlign = 'left';
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

                        const member_permanent_id = member.member_id;

                        // Late Payment cell
                        const latePaymentCell = document.createElement('td');
                        latePaymentCell.textContent = '-';
                        latePaymentCell.style.fontWeight = 'bold';
                        row.appendChild(latePaymentCell);

                        // Total pending amount
                        const totalPendingAmount = document.createElement('td');
                        totalPendingAmount.textContent = '-';
                        totalPendingAmount.style.fontWeight = 'bold';
                        row.appendChild(totalPendingAmount);

                        // Fetch data from the API and update the cells
                        fetch(getBankOrderApi)
                            .then(response => response.json())
                            .then(data => {
                                const memberData = data.find(item => item.member_id === member_permanent_id);
                                if (memberData) {
                                    latePaymentCell.textContent = memberData.no_of_late_payment || '0';
                                    totalPendingAmount.textContent = memberData.amount_to_pay || '-';
                                }
                            })
                            .catch(error => {
                                console.error("Error fetching bank order data:", error);
                            });

                        tableBody.appendChild(row);
                    });

                } else {
                    console.log('No members found for chapter ID:', chapterId);
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; font-weight: bold;">
                                No members found
                            </td>
                        </tr>
                    `;
                }

                // Add click handler for Rightoff Member button
                document.querySelector('.add_bill').addEventListener('click', async () => {
                    try {
                        const allCheckboxes = document.querySelectorAll('#chaptersTableBody input[type="checkbox"]');
                        const allDisabled = Array.from(allCheckboxes).every(checkbox => checkbox.disabled);
                
                        if (allDisabled) {
                            Swal.fire({
                                icon: 'info',
                                title: 'Already Written Off',
                                text: 'All members have already been written off.',
                                confirmButtonColor: '#dc3545'
                            });
                            return;
                        }
                
                        const selectedMembers = Array.from(
                            document.querySelectorAll('#chaptersTableBody input[type="checkbox"]:checked:not([disabled])')
                        ).map(checkbox => {
                            // Find the member data from the filteredMembers array
                            const member = filteredMembers.find(m => String(m.member_id) === String(checkbox.value));
                            return {
                                member_id: checkbox.value,
                                member_name: `${member.member_first_name} ${member.member_last_name}`,
                                member_email: member.member_email_address,
                                member_phone: member.member_phone_number
                            };
                        });
                
                        console.log('Selected member IDs with details:', selectedMembers);
                
                        if (selectedMembers.length === 0) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'No Members Selected',
                                text: 'Please select at least one member to write off.',
                                confirmButtonColor: '#dc3545'
                            });
                            return;
                        }
                
                        const rightoffDate = document.querySelector('#region_name').value.trim();
                        const rightoffComment = document.querySelector('#writeoff_comment').value.trim();
                
                        if (!rightoffDate) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Date Required',
                                text: 'Please select a write-off date before proceeding.',
                                confirmButtonColor: '#dc3545'
                            });
                            return;
                        }
                
                        // Fetch bank order details and calculate totals
                        const bankOrderResponse = await fetch(getBankOrderApi);
                        const bankOrderData = await bankOrderResponse.json();

                        let totalLatePayments = 0;
                        let totalPendingAmount = 0;

                        const membersData = selectedMembers.map(member => {
                            const memberData = bankOrderData.find(item => Number(item.member_id) === Number(member.member_id)) || {};
                            const latePayments = memberData.no_of_late_payment || 0;
                            const pendingAmount = memberData.amount_to_pay || 0;

                            totalLatePayments += latePayments;
                            totalPendingAmount += pendingAmount;

                            return {
                                member_id: member.member_id,
                                member_name: member.member_name,
                                member_email: member.member_email,
                                member_phone: member.member_phone,
                                no_of_late_payment: latePayments,
                                total_pending_amount: pendingAmount
                            };
                        });

                        const data = {
                            members: membersData,
                            chapter_id: current_User.chapter_id,
                            rightoff_date: rightoffDate,
                            rightoff_comment: rightoffComment,
                            no_of_late_payment: totalLatePayments,
                            total_pending_amount: totalPendingAmount
                        };
                
                        showLoader();
                        const response = await fetch('http://localhost:5000/api/addMemberWriteOff', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data),
                        });
                
                        const result = await response.json();
                
                        if (response.ok) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Success!',
                                text: `Successfully wrote off ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}!`,
                                confirmButtonColor: '#28a745'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    location.reload();
                                }
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to write off members. Please try again.',
                                confirmButtonColor: '#dc3545'
                            });
                        }
                
                    } catch (error) {
                        console.error('Error in write-off process:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'An unexpected error occurred. Please try again.',
                            confirmButtonColor: '#dc3545'
                        });
                    } finally {
                        hideLoader();
                    }
                });

            } catch (error) {
                console.error('Error in loadMembers:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    type: error.name
                });
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load members. Please try again.',
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                hideLoader();
                console.log('=== Loading Members Process Completed ===');
            }
        }

        // Add select all checkbox functionality
        document.getElementById('selectAllCheckbox')?.addEventListener('change', function() {
            console.log('Select all checkbox clicked:', this.checked);
            const checkboxes = document.querySelectorAll('#chaptersTableBody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });

    } catch (error) {
        console.error('ERROR in initialization:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });
    }
});
