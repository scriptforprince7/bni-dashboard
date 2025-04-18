document.addEventListener('DOMContentLoaded', async function() {
    // Function to show loader
    function showLoader() {
        document.getElementById('loader').style.display = 'flex';
    }

    // Function to hide loader
    function hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }

    // Function to create star rating
    function createStarRating(rating) {
        console.log('⭐ Creating stars for rating:', rating);
        const stars = '★'.repeat(rating);
        return `<span style="color: gold; font-size: 18px;">${stars}</span>`;
    }

    // Function to create check mark - updated with more visible icons
    function createCheckMark(value) {
        console.log('✓ Creating checkmark for value:', value);
        if (value) {
            return `<span style="color: #22c55e; font-size: 20px;">✓</span>`;
        } else {
            return `<span style="color: #ef4444; font-size: 20px;">✗</span>`;
        }
    }

    // Function to format date to dd/mm/yyyy
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Add CSS for name styling
    const style = document.createElement('style');
    style.textContent = `
        .visitor-name {
            color: #d01f2f;
            text-decoration: none;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.3s ease;
            display: inline-block;
            position: relative;
        }

        .visitor-name:hover {
            color: #fff;
            background: #d01f2f;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(208, 31, 47, 0.2);
        }

        .visitor-name::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: #d01f2f;
            transform: scaleX(0);
            transform-origin: bottom right;
            transition: transform 0.3s ease;
        }

        .visitor-name:hover::after {
            transform: scaleX(1);
            transform-origin: bottom left;
        }

        /* Animation for modal opening */
        .modal.fade .modal-dialog {
            transform: scale(0.8);
            transition: transform 0.3s ease-in-out;
        }

        .modal.show .modal-dialog {
            transform: scale(1);
        }

        /* Pulse animation for new entries */
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .new-entry {
            animation: pulse 1s ease-in-out;
        }
    `;
    document.head.appendChild(style);

    try {
        showLoader();
        console.log('🔄 Fetching EOI data...');

        // Fetch all required data
        const [eoiResponse, regionsResponse, chaptersResponse, membersResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/getEoiForms'),
            fetch('https://backend.bninewdelhi.com/api/regions'),
            fetch('https://backend.bninewdelhi.com/api/chapters'),
            fetch('https://backend.bninewdelhi.com/api/members')
        ]);

        const [eoiForms, regions, chapters, members] = await Promise.all([
            eoiResponse.json(),
            regionsResponse.json(),
            chaptersResponse.json(),
            membersResponse.json()
        ]);

        console.log('📝 EOI Forms:', eoiForms);
        console.log('🌍 Regions:', regions);
        console.log('🏢 Chapters:', chapters);
        console.log('👥 Members:', members);

        // Create lookup maps for faster access
        const regionMap = new Map(regions.map(r => [r.region_id, r.region_name]));
        const chapterMap = new Map(chapters.map(c => [c.chapter_id, c.chapter_name]));
        const memberMap = new Map(members.map(m => [
            m.member_id, 
            `${m.member_first_name} ${m.member_last_name}`
        ]));

        // Get table body
        const tableBody = document.getElementById('chaptersTableBody');
        
        // Update total count
        document.getElementById('total-visitors-count').textContent = eoiForms.length;

        // Populate table
        eoiForms.forEach((eoi, index) => {
            console.log('🔄 Processing EOI form:', eoi);
            console.log('Visit Date:', eoi.chapter_visit_date);
            
            const formattedDate = formatDate(eoi.chapter_visit_date);
            console.log('Formatted Date:', formattedDate);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><b>${index + 1}</b></td>
                <td>
                    <b>
                        <a href="javascript:void(0);" 
                           class="visitor-name" 
                           data-eoi-index="${index}"
                           title="Click to view details">
                            <i class="ti ti-user-circle me-1"></i>
                            ${eoi.first_name} ${eoi.last_name}
                        </a>
                    </b>
                </td>
                <td><b>${regionMap.get(eoi.region_id) || 'N/A'}</b></td>
                <td><b>${chapterMap.get(eoi.chapter_id) || 'N/A'}</b></td>
                <td><b>${eoi.company_name}</b></td>
                <td><b>${eoi.company_gstin}</b></td>
                <td><b>+91-${eoi.phone_no}</b></td>
                <td><b>${formattedDate}</b></td>
                <td><b>${eoi.best_time_to_reach}</b></td>
                <td style="text-align: center;">${createCheckMark(eoi.previous_member === true)}</td>
                <td style="text-align: center;">${createStarRating(eoi.exp_rating)}</td>
                <td><b>${memberMap.get(eoi.invited_by_member_id) || 'N/A'}</b></td>
                <td style="text-align: center;">${createCheckMark(eoi.is_interested === "Yes")}</td>
            `;

            // Add new entry animation
            row.classList.add('new-entry');
            tableBody.appendChild(row);
        });

        // Add click event listener for visitor names
        document.querySelectorAll('.visitor-name').forEach(link => {
            link.addEventListener('click', function() {
                const index = this.getAttribute('data-eoi-index');
                const eoi = eoiForms[index];
                
                // Add loading animation to modal
                const modal = new bootstrap.Modal(document.getElementById('visitorDetailsModal'));
                document.getElementById('visitorDetailsModal').classList.add('loading');
                
                // Populate modal with visitor details
                document.getElementById('modal-visitor-name').textContent = `${eoi.first_name} ${eoi.last_name}`;
                document.getElementById('modal-is-interested').innerHTML = `
                    <span class="badge ${getInterestBadgeClass(eoi.is_interested)}">
                        ${eoi.is_interested}
                    </span>`;
                document.getElementById('modal-region').textContent = regionMap.get(eoi.region_id) || 'N/A';
                document.getElementById('modal-chapter').textContent = chapterMap.get(eoi.chapter_id) || 'N/A';
                document.getElementById('modal-invited-by').textContent = memberMap.get(eoi.invited_by_member_id) || 'N/A';
                document.getElementById('modal-visit-date').textContent = formatDate(eoi.chapter_visit_date);
                document.getElementById('modal-company-name').textContent = eoi.company_name;
                document.getElementById('modal-company-address').textContent = eoi.company_address || 'N/A';
                document.getElementById('modal-gstin').textContent = eoi.company_gstin;
                document.getElementById('modal-business').textContent = eoi.business;
                document.getElementById('modal-email').textContent = eoi.email;
                document.getElementById('modal-phone').textContent = `+91-${eoi.phone_no}`;
                document.getElementById('modal-best-time').textContent = eoi.best_time_to_reach;
                document.getElementById('modal-hear-about').textContent = eoi.hear_about_us;
                document.getElementById('modal-previous-member').innerHTML = `
                    <span class="badge ${eoi.previous_member ? 'bg-success' : 'bg-danger'}">
                        ${eoi.previous_member ? 'Yes' : 'No'}
                    </span>`;
                document.getElementById('modal-exp-rating').innerHTML = createStarRating(eoi.exp_rating);

                // Remove loading class and show modal
                document.getElementById('visitorDetailsModal').classList.remove('loading');
                modal.show();
            });
        });

        // Helper function to get badge class based on interest status
        function getInterestBadgeClass(status) {
            switch(status) {
                case 'Yes':
                    return 'bg-success';
                case 'Maybe':
                    return 'bg-warning';
                case 'No':
                    return 'bg-danger';
                default:
                    return 'bg-secondary';
            }
        }

        // Function to populate filter dropdowns
        function populateFilters(eoiForms, regions, chapters) {
            // Get unique months from EOI dates
            const months = [...new Set(eoiForms.map(eoi => {
                const date = new Date(eoi.chapter_visit_date);
                return `${date.getMonth() + 1}/${date.getFullYear()}`;
            }))].sort();

            // Populate Region Filter
            const regionFilter = document.getElementById('region-filter');
            const uniqueRegions = [...new Set(eoiForms.map(eoi => eoi.region_id))];
            regionFilter.innerHTML = uniqueRegions.map(id => `
                <li><a class="dropdown-item" href="javascript:void(0);" data-region-id="${id}">
                    ${regionMap.get(id)}
                </a></li>
            `).join('');

            // Populate Chapter Filter
            const chapterFilter = document.getElementById('chapter-filter');
            const uniqueChapters = [...new Set(eoiForms.map(eoi => eoi.chapter_id))];
            chapterFilter.innerHTML = uniqueChapters.map(id => `
                <li><a class="dropdown-item" href="javascript:void(0);" data-chapter-id="${id}">
                    ${chapterMap.get(id)}
                </a></li>
            `).join('');

            // Populate Month Filter
            const monthFilter = document.getElementById('month-filter');
            monthFilter.innerHTML = months.map(month => `
                <li><a class="dropdown-item" href="javascript:void(0);" data-month="${month}">
                    ${month}
                </a></li>
            `).join('');

            // Add filter buttons container if not exists
            if (!document.getElementById('filter-buttons')) {
                const buttonContainer = document.createElement('div');
                buttonContainer.id = 'filter-buttons';
                buttonContainer.className = 'ms-2 d-none';
                buttonContainer.innerHTML = `
                    <button class="btn btn-primary btn-sm me-2" id="apply-filters">
                        <i class="ti ti-filter me-1"></i> Apply Filters
                    </button>
                    <button class="btn btn-danger btn-sm" id="reset-filters">
                        <i class="ti ti-x me-1"></i> Reset
                    </button>
                `;
                document.querySelector('.d-flex.gap-3').appendChild(buttonContainer);
            }

            // Track selected filters
            let selectedFilters = {
                region: null,
                chapter: null,
                month: null
            };

            // Add click handlers for filter items
            ['region', 'chapter', 'month'].forEach(filterType => {
                document.querySelectorAll(`#${filterType}-filter .dropdown-item`).forEach(item => {
                    item.addEventListener('click', function() {
                        // Update selected item styling
                        document.querySelectorAll(`#${filterType}-filter .dropdown-item`).forEach(i => 
                            i.classList.remove('active'));
                        this.classList.add('active');

                        // Update selected filters
                        selectedFilters[filterType] = this.dataset[`${filterType}Id`] || this.dataset.month;

                        // Show filter buttons
                        document.getElementById('filter-buttons').classList.remove('d-none');
                    });
                });
            });

            // Apply Filters button click handler
            document.getElementById('apply-filters').addEventListener('click', function() {
                const rows = tableBody.getElementsByTagName('tr');
                Array.from(rows).forEach(row => {
                    const eoiIndex = row.firstElementChild.textContent - 1;
                    const eoi = eoiForms[eoiIndex];
                    
                    if (!eoi) return;

                    const monthStr = new Date(eoi.chapter_visit_date)
                        .toLocaleDateString('en-US', { month: 'numeric', year: 'numeric' });

                    const showRow = (!selectedFilters.region || eoi.region_id.toString() === selectedFilters.region) &&
                                  (!selectedFilters.chapter || eoi.chapter_id.toString() === selectedFilters.chapter) &&
                                  (!selectedFilters.month || monthStr === selectedFilters.month);

                    row.style.display = showRow ? '' : 'none';
                });

                // Update visible count
                const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
                document.getElementById('total-visitors-count').textContent = visibleRows;
            });

            // Reset Filters button click handler
            document.getElementById('reset-filters').addEventListener('click', function() {
                // Clear all selections
                selectedFilters = { region: null, chapter: null, month: null };
                document.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));
                
                // Show all rows
                Array.from(tableBody.getElementsByTagName('tr')).forEach(row => row.style.display = '');
                
                // Update count
                document.getElementById('total-visitors-count').textContent = eoiForms.length;
                
                // Hide filter buttons
                document.getElementById('filter-buttons').classList.add('d-none');
            });
        }

        // Call populateFilters after fetching data
        populateFilters(eoiForms, regions, chapters);

        // Add search functionality
        const searchInput = document.getElementById('searchAccolades');
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            console.log('🔍 Searching for:', searchTerm);

            const rows = tableBody.getElementsByTagName('tr');
            Array.from(rows).forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length > 0) {
                    // Concatenate all cell text content for searching
                    const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');

                    console.log('Checking:', {
                        rowText: rowText,
                        searchTerm: searchTerm
                    });

                    // Show row if any cell text matches the search term
                    const matches = rowText.includes(searchTerm);
                    row.style.display = matches ? '' : 'none';
                }
            });

            // Update the visible count
            const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
            document.getElementById('total-visitors-count').textContent = visibleRows;
            console.log('👥 Visible rows after search:', visibleRows);
        });

        // Add search icon click handler
        const searchIcon = document.querySelector('.custom-form-btn');
        searchIcon.addEventListener('click', function() {
            // Trigger search if there's text in the input
            if (searchInput.value.trim() !== '') {
                const event = new Event('input');
                searchInput.dispatchEvent(event);
            }
        });

        // Function to apply EOI status filter
        async function applyEOIStatusFilter(status) {
            console.log('🔄 Applying EOI status filter:', status);
            const rows = tableBody.getElementsByTagName('tr');

            try {
                // Fetch all visitors data first
                console.log('📊 Fetching all visitors data...');
                const visitorsResponse = await fetch('https://backend.bninewdelhi.com/api/getallVisitors');
                const visitorsData = await visitorsResponse.json();
                console.log('👥 All visitors data:', visitorsData);

                Array.from(rows).forEach(row => {
                    const cells = row.getElementsByTagName('td');
                    if (cells.length > 0) {
                        // Get the EOI index to access the original data
                        const eoiIndex = parseInt(cells[0].textContent) - 1;
                        const eoiData = eoiForms[eoiIndex];

                        if (!eoiData) return;

                        console.log('Checking EOI:', {
                            index: eoiIndex,
                            status: eoiData.is_interested,
                            filterStatus: status,
                            visitor_id: eoiData.visitor_id
                        });

                        let showRow = true;
                        switch(status) {
                            case 'ready':
                                showRow = eoiData.is_interested === 'Yes';
                                break;
                            case 'maybe':
                                showRow = eoiData.is_interested === 'Maybe';
                                break;
                            case 'no':
                                showRow = eoiData.is_interested === 'No';
                                break;
                            case 'converted':
                                // Check if visitor exists and has new_member_form as true
                                const visitor = visitorsData.find(v => v.visitor_id === eoiData.visitor_id);
                                console.log('🔍 Checking visitor conversion:', {
                                    visitor_id: eoiData.visitor_id,
                                    visitor_found: !!visitor,
                                    new_member_form: visitor?.new_member_form
                                });
                                showRow = visitor && visitor.new_member_form === true;
                                break;
                            case 'all':
                                showRow = true;
                                break;
                        }

                        row.style.display = showRow ? '' : 'none';
                    }
                });

                // Update the visible count
                const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
                document.getElementById('total-visitors-count').textContent = visibleRows;
                console.log('👥 Visible rows after filter:', visibleRows);

            } catch (error) {
                console.error('❌ Error applying filter:', error);
            }
        }

        // Add event listeners for radio buttons
        document.querySelectorAll('input[name="eoi-status"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const selectedStatus = this.id;
                console.log('📻 Radio button changed to:', selectedStatus);
                applyEOIStatusFilter(selectedStatus);
            });
        });

        // Initialize with 'all' filter
        applyEOIStatusFilter('all');

        // Add sorting functionality
        let currentSort = {
            column: null,
            asc: true
        };

        // Function to sort table
        function sortTable(columnIndex) {
            const rows = Array.from(tableBody.getElementsByTagName('tr'));
            const headers = document.querySelectorAll('th');
            
            // Toggle sort direction if clicking same column
            if (currentSort.column === columnIndex) {
                currentSort.asc = !currentSort.asc;
            } else {
                currentSort.column = columnIndex;
                currentSort.asc = true;
            }

            // Update sort icons
            headers.forEach(header => {
                const icon = header.querySelector('i');
                icon.className = 'ti ti-arrows-sort';
            });

            const currentIcon = headers[columnIndex].querySelector('i');
            currentIcon.className = `ti ${currentSort.asc ? 'ti-sort-ascending' : 'ti-sort-descending'}`;

            // Sort rows
            rows.sort((a, b) => {
                let aVal = a.cells[columnIndex].textContent.trim();
                let bVal = b.cells[columnIndex].textContent.trim();

                // Special handling for different column types
                switch(columnIndex) {
                    case 0: // S.No.
                        return currentSort.asc ? 
                            parseInt(aVal) - parseInt(bVal) : 
                            parseInt(bVal) - parseInt(aVal);

                    case 7: // EOI Filled On (dd/mm/yyyy)
                        const [aDay, aMonth, aYear] = aVal.split('/');
                        const [bDay, bMonth, bYear] = bVal.split('/');
                        const aDate = new Date(aYear, aMonth - 1, aDay);
                        const bDate = new Date(bYear, bMonth - 1, bDay);
                        return currentSort.asc ? aDate - bDate : bDate - aDate;

                    case 9: // Is Previous Member
                    case 12: // Is Interested
                        const aCheck = aVal.includes('✓');
                        const bCheck = bVal.includes('✓');
                        return currentSort.asc ? 
                            aCheck - bCheck : 
                            bCheck - aCheck;

                    case 10: // Experience Rating
                        const aStars = (aVal.match(/★/g) || []).length;
                        const bStars = (bVal.match(/★/g) || []).length;
                        return currentSort.asc ? 
                            aStars - bStars : 
                            bStars - aStars;

                    default: // Text columns
                        return currentSort.asc ? 
                            aVal.localeCompare(bVal) : 
                            bVal.localeCompare(aVal);
                }
            });

            // Clear and repopulate table
            while (tableBody.firstChild) {
                tableBody.removeChild(tableBody.firstChild);
            }
            rows.forEach(row => tableBody.appendChild(row));
        }

        // Add click handlers to table headers
        document.querySelectorAll('th').forEach((th, index) => {    
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => sortTable(index));
        });

        // Add CSS for sort icons
        const style = document.createElement('style');
        style.textContent = `
            .ti-sort-ascending,
            .ti-sort-descending {
                color: #d01f2f;
            }
            th:hover {
                background-color: #f1f5f9;
            }
            th {
                transition: background-color 0.2s;
            }
        `;
        document.head.appendChild(style);

    } catch (error) {
        console.error('❌ Error fetching data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong while fetching the data!'
        });
    } finally {
        hideLoader();
    }
});
