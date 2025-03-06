document.addEventListener('DOMContentLoaded', async function() {
    const tableBody = document.getElementById('chaptersTableBody');
    const loader = document.getElementById('loader');
    const regionFilter = document.getElementById('region-filter');
    const chapterFilter = document.getElementById('chapter-filter');
    const monthFilter = document.getElementById('month-filter');

    // Show loader
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';

    // Add filter buttons container after the dropdowns
    const filterButtonsContainer = document.createElement('div');
    filterButtonsContainer.className = 'ms-2';
    filterButtonsContainer.innerHTML = `
        <button id="applyFilter" class="btn btn-sm btn-primary" style="display: none;">
            Apply Filter
        </button>
        <button id="resetFilter" class="btn btn-sm btn-danger" style="display: none;">
            Reset Filter
        </button>
    `;
    document.querySelector('.d-flex.gap-3').appendChild(filterButtonsContainer);

    const applyFilterBtn = document.getElementById('applyFilter');
    const resetFilterBtn = document.getElementById('resetFilter');

    // Add CSS for table styling
    const style = document.createElement('style');
    style.textContent = `
        .table td, .table th {
            border-right: 1px solid #dee2e6 !important;
            vertical-align: middle !important;
        }
        
        .table td:last-child, .table th:last-child {
            border-right: none !important;
        }

        .table thead th {
            border-bottom: 2px solid #dee2e6 !important;
        }

        .table tbody tr {
            border-bottom: 1px solid #dee2e6 !important;
        }
    `;
    document.head.appendChild(style);

    try {
        showLoader();

        // Fetch all required data
        const [visitorsResponse, regionsResponse, chaptersResponse] = await Promise.all([
            fetch('https://bni-data-backend.onrender.com/api/getallVisitors'),
            fetch('https://bni-data-backend.onrender.com/api/regions'),
            fetch('https://bni-data-backend.onrender.com/api/chapters')
        ]);

        const visitors = await visitorsResponse.json();
        const regions = await regionsResponse.json();
        const chapters = await chaptersResponse.json();

        console.log('Fetched Data:', {
            visitors: visitors,
            regions: regions,
            chapters: chapters
        });

        // Function to format date
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
        };

        // Function to create status icon
        const getStatusIcon = (status) => {
            return status ? 
                '<i class="ri-checkbox-circle-fill text-success" style="font-size: 1.5em;"></i>' : 
                '<i class="ri-close-circle-fill text-danger" style="font-size: 1.5em;"></i>';
        };

        // Populate filter dropdowns
        // Regions dropdown
        const uniqueRegions = [...new Set(regions.map(r => r.region_name))].sort();
        regionFilter.innerHTML = uniqueRegions.map(region => 
            `<li><a class="dropdown-item" href="javascript:void(0);">${region}</a></li>`
        ).join('');

        // Chapters dropdown
        const uniqueChapters = [...new Set(chapters.map(c => c.chapter_name))].sort();
        chapterFilter.innerHTML = uniqueChapters.map(chapter => 
            `<li><a class="dropdown-item" href="javascript:void(0);">${chapter}</a></li>`
        ).join('');

        // Months dropdown (from visitor dates)
        const months = [...new Set(visitors.map(v => {
            const date = new Date(v.visited_date);
            return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        }))].sort();
        monthFilter.innerHTML = months.map(month => 
            `<li><a class="dropdown-item" href="javascript:void(0);">${month}</a></li>`
        ).join('');

        // Track selected filters
        let selectedFilters = {
            region: '',
            chapter: '',
            month: ''
        };

        // Add click handlers for filter items
        const dropdowns = {
            region: regionFilter,
            chapter: chapterFilter,
            month: monthFilter
        };

        Object.entries(dropdowns).forEach(([key, dropdown]) => {
            dropdown.addEventListener('click', (e) => {
                if (e.target.classList.contains('dropdown-item')) {
                    selectedFilters[key] = e.target.textContent;
                    e.target.closest('.dropdown').querySelector('.dropdown-toggle').textContent = e.target.textContent;
                    applyFilterBtn.style.display = 'inline-block';
                    resetFilterBtn.style.display = 'inline-block';
                }
            });
        });

        // Apply filter function
        applyFilterBtn.addEventListener('click', () => {
            const filteredVisitors = visitors.filter(visitor => {
                const region = regions.find(r => r.region_id === visitor.region_id);
                const chapter = chapters.find(c => c.chapter_id === visitor.chapter_id);
                const visitorMonth = new Date(visitor.visited_date)
                    .toLocaleString('default', { month: 'long', year: 'numeric' });

                return (!selectedFilters.region || region?.region_name === selectedFilters.region) &&
                       (!selectedFilters.chapter || chapter?.chapter_name === selectedFilters.chapter) &&
                       (!selectedFilters.month || visitorMonth === selectedFilters.month);
            });

            renderVisitors(filteredVisitors);
        });

        // Reset filter function
        resetFilterBtn.addEventListener('click', () => {
            // Reset selected filters object
            selectedFilters = { region: '', chapter: '', month: '' };
            
            // Reset all dropdown toggles to their default text
            Object.entries(dropdowns).forEach(([key, dropdown]) => {
                const toggleButton = dropdown.closest('.dropdown').querySelector('.dropdown-toggle');
                // Reset text and add back the icons
                switch(key) {
                    case 'region':
                        toggleButton.innerHTML = '<i class="ti ti-map-pin me-1"></i> Region';
                        break;
                    case 'chapter':
                        toggleButton.innerHTML = '<i class="ti ti-building me-1"></i> Chapter';
                        break;
                    case 'month':
                        toggleButton.innerHTML = '<i class="ti ti-calendar me-1"></i> Month';
                        break;
                }
            });

            // Reset any active selections in dropdowns
            document.querySelectorAll('.dropdown-item.active').forEach(item => {
                item.classList.remove('active');
            });

            // Hide filter buttons
            applyFilterBtn.style.display = 'none';
            resetFilterBtn.style.display = 'none';

            // Reset the table to show all visitors
            renderVisitors(visitors);
        });

        // Add real-time search functionality
        const searchInput = document.getElementById('searchAccolades');
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // If search term is empty, show all visitors or current filtered results
            if (!searchTerm) {
                renderVisitors(visitors);
                return;
            }

            // Filter visitors based on search term
            const filteredVisitors = visitors.filter(visitor => {
                return (
                    (visitor.visitor_name && visitor.visitor_name.toLowerCase().includes(searchTerm)) ||
                    (visitor.visitor_company_name && visitor.visitor_company_name.toLowerCase().includes(searchTerm)) ||
                    (visitor.visitor_phone && visitor.visitor_phone.includes(searchTerm)) ||
                    (visitor.invited_by_name && visitor.invited_by_name.toLowerCase().includes(searchTerm))
                );
            });

            console.log('Search Term:', searchTerm);
            console.log('Filtered Results:', filteredVisitors.length);

            // Render filtered results
            renderVisitors(filteredVisitors);
        });

        // Add sorting state
        let sortState = {
            column: null,
            ascending: true
        };

        // Function to update total count
        const updateTotalCount = (count) => {
            document.getElementById('total-visitors-count').innerHTML = `<b>${count}</b>`;
        };

        // Function to sort data
        const sortData = (data, column, ascending) => {
            return [...data].sort((a, b) => {
                let aValue, bValue;

                switch(column) {
                    case 'visitor_name':
                    case 'invited_by_name':
                    case 'visitor_company_name':
                    case 'visitor_phone':
                        aValue = (a[column] || '').toLowerCase();
                        bValue = (b[column] || '').toLowerCase();
                        break;
                    case 'region':
                        aValue = (regions.find(r => r.region_id === a.region_id)?.region_name || '').toLowerCase();
                        bValue = (regions.find(r => r.region_id === b.region_id)?.region_name || '').toLowerCase();
                        break;
                    case 'chapter':
                        aValue = (chapters.find(c => c.chapter_id === a.chapter_id)?.chapter_name || '').toLowerCase();
                        bValue = (chapters.find(c => c.chapter_id === b.chapter_id)?.chapter_name || '').toLowerCase();
                        break;
                    case 'visited_date':
                        aValue = new Date(a.visited_date);
                        bValue = new Date(b.visited_date);
                        break;
                    case 'forms':
                        aValue = (a.visitor_form ? 1 : 0) + (a.eoi_form ? 1 : 0) + (a.new_member_form ? 1 : 0);
                        bValue = (b.visitor_form ? 1 : 0) + (b.eoi_form ? 1 : 0) + (b.new_member_form ? 1 : 0);
                        break;
                    default:
                        aValue = a[column];
                        bValue = b[column];
                }

                if (aValue < bValue) return ascending ? -1 : 1;
                if (aValue > bValue) return ascending ? 1 : -1;
                return 0;
            });
        };

        // Add click handlers for sorting
        document.querySelectorAll('th').forEach(th => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                const column = th.textContent.trim().toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

                // Toggle sort direction if same column, else default to ascending
                if (sortState.column === column) {
                    sortState.ascending = !sortState.ascending;
                } else {
                    sortState.column = column;
                    sortState.ascending = true;
                }

                // Update sort icons
                document.querySelectorAll('th i').forEach(icon => {
                    icon.className = 'ti ti-arrows-sort';
                });
                th.querySelector('i').className = `ti ti-sort-${sortState.ascending ? 'ascending' : 'descending'}`;

                // Sort and render
                const sortedData = sortData(visitors, column, sortState.ascending);
                renderVisitors(sortedData);
            });
        });

        // Update renderVisitors function
        function renderVisitors(visitorsToShow) {
            // Update total count
            updateTotalCount(visitorsToShow.length);

            if (!visitorsToShow.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="11" class="text-center">No visitors found matching your search</td>
                    </tr>`;
                return;
            }

            const tableContent = visitorsToShow.map((visitor, index) => {
                const region = regions.find(r => r.region_id === visitor.region_id);
                const chapter = chapters.find(c => c.chapter_id === visitor.chapter_id);
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><b>${visitor.visitor_name || 'N/A'}</b></td>
                        <td><b>${visitor.invited_by_name || 'N/A'}</b></td>
                        <td><b>${region?.region_name || 'N/A'}</b></td>
                        <td><b>${chapter?.chapter_name || 'N/A'}</b></td>
                        <td><b>${formatDate(visitor.visited_date)}</b></td>
                        <td><b>${visitor.visitor_phone || 'N/A'}</b></td>
                        <td><b>${visitor.visitor_company_name || 'N/A'}</b></td>
                        <td class="text-center">${getStatusIcon(visitor.visitor_form)}</td>
                        <td class="text-center">${getStatusIcon(visitor.eoi_form)}</td>
                        <td class="text-center">${getStatusIcon(visitor.new_member_form)}</td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = tableContent;
        }

        // Initial render with total count
        renderVisitors(visitors);

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-danger">Error loading visitors data</td>
            </tr>
        `;
    } finally {
        hideLoader();
    }
});
