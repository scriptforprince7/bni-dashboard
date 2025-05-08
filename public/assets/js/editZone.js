document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Edit Zone page initialization started');

    // Get zone_id from URL path
    const pathParts = window.location.pathname.split('/');
    const zoneId = pathParts[pathParts.length - 1]; // This will get the last part of the URL path
    console.log('🔑 Zone ID from URL path:', zoneId);

    if (!zoneId || isNaN(zoneId)) {
        console.error('❌ No valid zone ID provided');
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No valid zone ID provided',
            confirmButtonColor: '#3085d6'
        }).then(() => {
            window.location.href = '/z/view-zones';
        });
        return;
    }

    // Function to fetch zone details
    async function fetchZoneDetails() {
        try {
            console.log('📥 Fetching zone details for ID:', zoneId);
            const response = await fetch(`https://backend.bninewdelhi.com/api/getZone/${zoneId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Received zone data:', data);

            if (data.success) {
                // Populate form fields
                document.getElementById('zone_name').value = data.data.zone_name || '';
                document.getElementById('zone_status').value = data.data.zone_status || '';
                document.getElementById('zone_launched_by').value = data.data.zone_launched_by || '';
                document.getElementById('zone_contact_number').value = data.data.zone_contact_number || '';
                document.getElementById('zone_email_id').value = data.data.zone_email_id || '';
                document.getElementById('date_of_publishing').value = data.data.date_of_publishing ? 
                    new Date(data.data.date_of_publishing).toISOString().split('T')[0] : '';

                // Show existing logo if available
                if (data.data.zone_logo) {
                    const imagePreview = document.getElementById('imagePreview');
                    const preview = document.getElementById('preview');
                    preview.src = data.data.zone_logo; // Using the full URL from backend
                    imagePreview.style.display = 'block';
                    console.log('🖼️ Loaded existing logo:', data.data.zone_logo);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching zone details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch zone details',
                confirmButtonColor: '#3085d6'
            });
        }
    }

    // Preview new image when selected
    const logoInput = document.getElementById('zone_logo');
    const imagePreview = document.getElementById('imagePreview');
    const preview = document.getElementById('preview');

    logoInput.addEventListener('change', function(e) {
        console.log('🖼️ New logo file selected');
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Handle form submission
    const form = document.getElementById('editZoneForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('📝 Starting form submission');

        // Form validation
        const requiredFields = ['zone_name', 'zone_status', 'zone_contact_number', 'zone_email_id'];
        let isValid = true;

        for (const field of requiredFields) {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                isValid = false;
                await Swal.fire({
                    icon: 'error',
                    title: 'Required Field Missing',
                    text: `Please enter ${field.replace(/_/g, ' ')}`,
                    confirmButtonColor: '#3085d6'
                });
                break;
            }
        }

        if (!isValid) {
            console.log('❌ Form validation failed');
            return;
        }

        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to update this zone?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'Cancel'
        });

        // If user confirms, proceed with update
        if (result.isConfirmed) {
            try {
                const formData = new FormData(form);
                console.log('📤 Sending update request');

                const response = await fetch(`https://backend.bninewdelhi.com/api/updateZone/${zoneId}`, {
                    method: 'PUT',
                    body: formData
                });

                const data = await response.json();
                console.log('📥 Server response:', data);

                if (data.success) {
                    console.log('✅ Zone updated successfully');
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Zone updated successfully!',
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: 'OK',
                        allowOutsideClick: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/z/view-zones';
                        }
                    });
                } else {
                    throw new Error(data.message || 'Failed to update zone');
                }
            } catch (error) {
                console.error('❌ Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: error.message || 'Failed to update zone',
                    confirmButtonColor: '#3085d6'
                });
            }
        }
    });

    // Fetch zone details when page loads
    fetchZoneDetails();
});
