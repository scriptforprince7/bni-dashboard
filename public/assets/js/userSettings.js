// Function to get logged in email from token
function getLoggedInEmail() {
    console.log('Getting logged in email from token...');
    const email = getUserEmail();
    console.log('Email from token:', email);
    return email;
}

// Function to check if user is authorized
async function checkUserAuthorization() {
    try {
        console.log('Checking user authorization...');
        const loggedInEmail = getUserEmail();
        const loginType = getUserLoginType();
        
        if (!loggedInEmail || !loginType) {
            console.error('No valid token found');
            return false;
        }

        // Only proceed with authorization check for ro_admin
        if (loginType !== 'ro_admin') {
            console.log('User is not ro_admin');
            return false;
        }

        const response = await fetch('http://backend.bninewdelhi.com/api/getUsers');
        const users = await response.json();
        console.log('Users data:', users);
        
        const isAuthorized = users.some(user => user.email === loggedInEmail);
        console.log('Is user authorized:', isAuthorized);
        return isAuthorized;
    } catch (error) {
        console.error('Error checking authorization:', error);
        return false;
    }
}

// Function to populate company info fields
function populateCompanyInfo(data) {
    console.log('Populating company info with:', data);
    document.getElementById('company-name').value = data.company_name || '';
    document.getElementById('company-address').value = data.company_address || '';
    document.getElementById('company-gstin').value = data.company_gst || '';
    document.getElementById('company-email').value = data.company_email || '';
    document.getElementById('company-phone').value = data.company_phone || '';
    document.getElementById('company-account').value = data.company_account_number || '';
    document.getElementById('company-ifsc').value = data.company_ifsc_code || '';
    document.getElementById('company-branch').value = data.company_bank_branch || '';
    document.getElementById('company-instagram').value = data.company_instagram || '';
    document.getElementById('company-facebook').value = data.company_facebook || '';
    document.getElementById('company-twitter').value = data.company_twitter || '';
    document.getElementById('company-youtube').value = data.company_youtube || '';
}

// Function to decode JWT token
function getDecodedToken() {
    try {
        console.log('=== DECODING TOKEN START ===');
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No token found in localStorage');
            return null;
        }

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        console.log('Decoded token:', decoded);
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// Function to fetch company info with detailed debugging
async function fetchCompanyInfo() {
    try {
        console.log('=== FETCH COMPANY INFO START ===');
        
        // Get email from decoded token
        const decoded = getDecodedToken();
        if (!decoded || !decoded.email) {
            console.error('No valid token or email found');
            toastr.error('Authentication failed');
            return;
        }
        
        console.log('Token email:', decoded.email);

        // Fetch users and validate email
        // const usersResponse = await fetch('http://backend.bninewdelhi.com/api/getUsers');
        // const users = await usersResponse.json();
        // console.log('Checking authorization for email:', decoded.email);
        
        // const isAuthorized = users.some(user => user.email === decoded.email);
        // if (!isAuthorized) {
        //     console.error('User not authorized');
        //     toastr.error('You are not authorized to view these settings');
        //     return;
        // }

        // Fetch company info
        const response = await fetch('http://backend.bninewdelhi.com/api/company');
        if (!response.ok) {
            throw new Error('Failed to fetch company info');
        }

        const data = await response.json();
        const company = data.find(company => company.company_id === 1);
        
        if (!company) {
            throw new Error('Company not found');
        }

        console.log('Company info fetched successfully');
        populateCompanyInfo(company);
        
    } catch (error) {
        console.error('Error in fetchCompanyInfo:', error);
        toastr.error('Failed to load company information');
    }
}

// Function to update company settings with detailed debugging


// Function to fetch logo information
async function fetchLogoInfo() {
    try {
        console.log('=== FETCH LOGO INFO START ===');
        const response = await fetch('http://backend.bninewdelhi.com/api/getDisplayLogo');
        
        if (!response.ok) {
            throw new Error('Failed to fetch logo info');
        }

        const data = await response.json();
        console.log('Logo data received:', data);

        // Get the small text element
        const logoNameElement = document.getElementById('current-logo-name');
        
        if (data && data.length > 0 && logoNameElement) {
            console.log('Setting logo name:', data[0].display_image_name);
            logoNameElement.textContent = `Current logo: ${data[0].display_image_name}`;
        }
        
        console.log('=== FETCH LOGO INFO END ===');

    } catch (error) {
        console.error('Error fetching logo info:', error);
        toastr.error('Failed to load logo information');
    }
}

// Function to fetch GST types
async function fetchGstTypes() {
    try {
        console.log('=== FETCH GST TYPES START ===');
        const response = await fetch('http://backend.bninewdelhi.com/api/getGstType');
        
        if (!response.ok) {
            throw new Error('Failed to fetch GST types');
        }

        const data = await response.json();
        console.log('GST types received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching GST types:', error);
        toastr.error('Failed to load GST types');
        return [];
    }
}

// Function to fetch GST values
async function fetchGstValues() {
    try {
        console.log('=== FETCH GST VALUES START ===');
        const response = await fetch('http://backend.bninewdelhi.com/api/getGstTypeValues');
        
        if (!response.ok) {
            throw new Error('Failed to fetch GST values');
        }

        const data = await response.json();
        console.log('GST values received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching GST values:', error);
        toastr.error('Failed to load GST values');
        return [];
    }
}

// Function to populate GST and VAT dropdowns


// Function to fetch payment gateways
async function fetchPaymentGateways() {
    try {
        console.log('=== FETCH PAYMENT GATEWAYS START ===');
        const response = await fetch('http://backend.bninewdelhi.com/api/chapters');
        
        if (!response.ok) {
            throw new Error('Failed to fetch payment gateways');
        }

        const data = await response.json();
        console.log('Payment gateways received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching payment gateways:', error);
        toastr.error('Failed to load payment gateways');
        return [];
    }
}

// Simple function to fetch and populate payment gateway dropdown
async function handlePaymentGatewaySelection() {
    console.log('=== PAYMENT GATEWAY INITIALIZATION START ===');
    
    // Get the select element
    const gatewaySelect = document.getElementById('payment-gateway-select');
    if (!gatewaySelect) {
        console.error('Payment gateway select element not found');
        return;
    }

    try {
        // Fetch gateways
        console.log('Fetching payment gateways...');
        const response = await fetch('http://backend.bninewdelhi.com/api/paymentGateway');
        console.log('API Response status:', response.status);
        
        const gateways = await response.json();
        console.log('Fetched gateways:', gateways);

        // Clear and add default option
        gatewaySelect.innerHTML = '<option value="">Choose Payment Gateway</option>';

        // Add gateway options
        gateways.forEach(gateway => {
            console.log('Processing gateway:', gateway);
            
            const option = document.createElement('option');
            option.value = gateway.gateway_name;
            option.textContent = gateway.gateway_name;
            option.selected = gateway.status === 'active';  // Cashfree will be selected by default
            
            gatewaySelect.appendChild(option);
            console.log(`Added option: ${gateway.gateway_name}, Status: ${gateway.status}`);
        });

        console.log('Final dropdown options:', gatewaySelect.innerHTML);

    } catch (error) {
        console.error('Error setting up payment gateways:', error);
        toastr.error('Failed to load payment gateways');
    }
}

// Function to save payment gateway settings
async function savePaymentGatewaySettings(gateway) {
    try {
        const settings = {};
        
        switch(gateway) {
            case 'cashfree':
                settings.appId = document.getElementById('cashfree-app-id').value;
                settings.secretKey = document.getElementById('cashfree-secret-key').value;
                break;
            case 'razorpay':
                settings.keyId = document.getElementById('razorpay-key-id').value;
                settings.keySecret = document.getElementById('razorpay-key-secret').value;
                break;
            case 'ccavenue':
                settings.merchantId = document.getElementById('ccavenue-merchant-id').value;
                settings.accessCode = document.getElementById('ccavenue-access-code').value;
                settings.workingKey = document.getElementById('ccavenue-working-key').value;
                break;
        }

        console.log('Saving settings for:', gateway, settings);
        toastr.success('Payment gateway settings saved successfully');
        
        // TODO: Add API call to save settings
        
    } catch (error) {
        console.error('Error saving payment gateway settings:', error);
        toastr.error('Failed to save payment gateway settings');
    }
}

// Function to update payment gateway status
async function updatePaymentGatewayStatus(gatewayId) {
    console.log('Starting payment gateway update process...');
    
    try {
        // Check user authorization
        const loginType = getUserLoginType();
        console.log('User login type:', loginType);
        
        if (loginType !== 'ro_admin') {
            console.error('Unauthorized: User is not ro_admin');
            toastr.error('Only administrators can change payment gateway settings');
            return false;
        }

        // Get token
        const token = localStorage.getItem('token');
        console.log('Token available:', !!token);

        if (!token) {
            console.error('No token found');
            toastr.error('Authentication required');
            return false;
        }

        console.log('Making API call to update gateway status for ID:', gatewayId);
        const response = await fetch(`http://backend.bninewdelhi.com/api/payment-gateway/${gatewayId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'active'
            })
        });

        console.log('API response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update payment gateway');
        }

        return true;

    } catch (error) {
        console.error('Error updating payment gateway:', error);
        toastr.error('Failed to update payment gateway status');
        return false;
    }
}

// Updated confirmGatewayChange function
async function confirmGatewayChange(gateway) {
    console.log('Starting gateway change confirmation for:', gateway);
    
    try {
        // Get gateway ID from selected gateway name
        const response = await fetch('http://backend.bninewdelhi.com/api/paymentGateway');
        const gateways = await response.json();
        console.log('Fetched gateways:', gateways);

        const selectedGateway = gateways.find(g => g.gateway_name === gateway);
        console.log('Selected gateway:', selectedGateway);

        if (!selectedGateway) {
            console.error('Gateway not found');
            toastr.error('Selected gateway not found');
            return;
        }

        // Update gateway status
        const success = await updatePaymentGatewayStatus(selectedGateway.gateway_id);
        console.log('Update status:', success);

        if (success) {
            toastr.success(`${gateway} has been set as the active payment gateway`);
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmGatewayModal'));
            modal.hide();

            // Refresh the payment gateway list
            await handlePaymentGatewaySelection();
        }

    } catch (error) {
        console.error('Error in confirmGatewayChange:', error);
        toastr.error('Failed to update payment gateway');
    }
}

// Function to handle payment gateway activation
function handleSetActiveGateway() {
    console.log('Setting up payment gateway activation handler');
    
    const setActiveBtn = document.getElementById('setActiveGatewayBtn');
    const gatewaySelect = document.getElementById('payment-gateway-select');

    if (setActiveBtn) {
        setActiveBtn.addEventListener('click', function() {
            console.log('Set Active Gateway button clicked');
            
            // Check if a gateway is selected
            const selectedGateway = gatewaySelect.value;
            if (!selectedGateway) {
                toastr.error('Please select a payment gateway first');
                return;
            }

            // Check if user is ro_admin
            const loginType = getUserLoginType();
            console.log('User login type:', loginType);
            
            if (loginType !== 'ro_admin') {
                toastr.error('Only administrators can change payment gateway settings');
                return;
            }

            // Show confirmation modal
            const confirmHtml = `
                <div class="modal fade" id="confirmGatewayModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Confirm Payment Gateway Change</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                Are you sure you want to set ${selectedGateway} as the active payment gateway?
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-success" onclick="confirmGatewayChange('${selectedGateway}')">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>`;

            // Remove existing modal if any
            const existingModal = document.getElementById('confirmGatewayModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to document
            document.body.insertAdjacentHTML('beforeend', confirmHtml);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('confirmGatewayModal'));
            modal.show();
        });
    }
}

// Add to existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== PAGE INITIALIZATION START ===');
    try {
        await fetchCompanyInfo();
        await fetchLogoInfo();
        handlePaymentGatewaySelection(); // Initialize payment gateway handling
        handleSetActiveGateway();
        console.log('=== PAGE INITIALIZATION COMPLETE ===');
    } catch (error) {
        console.error('Error during initialization:', error);
        toastr.error('Error loading page data');
    }
});

// Tax Settings

