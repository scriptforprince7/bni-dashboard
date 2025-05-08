// Get visitor_id from query params and declare orderId as let
const visitorId = new URLSearchParams(window.location.search).get('visitor_id');
let orderId = null; // Changed from const to let
let universalLinkName = 'Unknown'; // Default value for universal link name
// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Function to get order ID from membership pending
async function getMembershipOrderId(visitorId) {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/getMembershipPending');
        if (!response.ok) {
            throw new Error('Failed to fetch membership data');
        }
        
        const membershipData = await response.json();
        const membershipRecord = membershipData.find(record => {
            // First check if visitor_id matches
            if (record.visitor_id !== parseInt(visitorId)) return false;
            
            // Handle NaN or invalid due_balance
            const dueBalance = parseFloat(record.due_balance);
            if (isNaN(dueBalance)) {
                // If due_balance is NaN, check if paid_amount is greater than or equal to total_amount
                const paidAmount = parseFloat(record.paid_amount) || 0;
                const totalAmount = parseFloat(record.total_amount) || 0;
                return paidAmount >= totalAmount;
            }
            
            // Otherwise check if due_balance is less than 1
            return dueBalance < 1;
        });

        if (!membershipRecord) {
            throw new Error('No valid payment record found or payment is pending');
        }

        return membershipRecord.order_id;
    } catch (error) {
        console.error('Error fetching membership data:', error);
        throw error;
    }
}

// Fetch all orders and display details
async function fetchAllOrders() {
    console.log('Starting fetchAllOrders');
    showLoader();
    try {
        // First get the correct order_id from membership pending
        const targetOrderId = await getMembershipOrderId(visitorId);
        console.log('Target Order ID:', targetOrderId);

        // Then fetch all orders
        const response = await fetch('https://backend.bninewdelhi.com/api/allOrders');
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const allOrders = await response.json();
        console.log("All Orders:", allOrders);

        // Find order with matching order_id
        const order = allOrders.find(order => order.order_id === targetOrderId);
        console.log("Found order:", order);

        if (order) {
            orderId = order.order_id;
            
            // Fetch transactions first to get cf_payment_id
            const transactions = await fetchTransactionsForOrder(orderId);
            console.log("Fetched transactions:", transactions);
            
            const transaction = transactions[0]; // Get the first transaction
            console.log("Using transaction:", transaction);
            
            // Update displayOrderDetails to include transaction details
            displayOrderDetails(order, transaction);

            if (order.universal_link_id) {
                universalLinkName = await fetchUniversalLinkName(order.universal_link_id);
                displayTransactionDetails(order);
            }

            // Display visitor details
            document.getElementById('member-name').textContent = order.visitor_name || "N/A";
            document.getElementById('customer-email').textContent = order.visitor_email || "N/A";
            document.getElementById('company-name').textContent = order.visitor_company || "N/A";
            document.getElementById('company-gst').textContent = order.visitor_gstin || "N/A";
            document.getElementById('order-number').textContent = orderId || "N/A";
        } else {
            console.error('Order not found with order_id:', targetOrderId);
            throw new Error('Order details not found');
        }
    } catch (error) {
        console.error('Error in fetchAllOrders:', error);
        console.error('Error stack:', error.stack);
        // Show error message to user
        alert('Unable to fetch receipt details. ' + error.message);
    } finally {
        hideLoader();
    }
}

// Function to fetch and display member address
// async function fetchMemberAddress(customerId) {
//     showLoader();
//     try {
//         const response = await fetch('https://backend.bninewdelhi.com/api/members');
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         const members = await response.json();
//         const member = members.find(member => member.member_id === customerId);

//         if (member) {
//             document.querySelector('.billing-to-address').textContent = member.street_address_line_1 || "N/A"; // Display address
//         } else {
//             console.error('Member not found');
//         }
//     } catch (error) {
//         console.error('Error fetching member address:', error);
//     }
// }

// Function to fetch transactions for a specific order
async function fetchTransactionsForOrder(orderId) {
    showLoader();
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/allTransactions');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const allTransactions = await response.json();
        console.log("All Transactions:", allTransactions); // Log all transactions
        return allTransactions.filter(transaction => transaction.order_id === orderId); // Return filtered transactions
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return [];
    } finally {
        hideLoader();
    }
}

// Function to fetch the universal link name
async function fetchUniversalLinkName(universalLinkId) {
    showLoader();
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/universalLinks');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const universalLinks = await response.json();
        const link = universalLinks.find(link => link.id === universalLinkId);

        if (link) {
            return link.universal_link_name;
        } else {
            console.error('Universal link not found');
            return 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching universal link name:', error);
        return 'Unknown';
    } finally {
        hideLoader();
    }
}

// Add new function to fetch training name
async function fetchTrainingName(trainingId) {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/allTrainings');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const trainings = await response.json();
        const training = trainings.find(t => t.training_id === trainingId);
        return training ? training.training_name : 'Unknown Training';
    } catch (error) {
        console.error('Error fetching training name:', error);
        return 'Unknown Training';
    }
}

// Function to display transaction details in the table
async function displayTransactionDetails(order) {
    console.log('Starting displayTransactionDetails with order:', order);
    console.log('Payment Note:', order?.payment_note);
    console.log('Training ID:', order?.training_id);
    console.log('Kitty Bill ID:', order?.kitty_bill_id);
    
    try {
        const paymentType = document.querySelector('.payment-type');
        const paymentDate = document.querySelector('.payment-date');
        const paymentAmount = document.querySelector('.payment-amount');
        const taxAmount = document.querySelector('.tax-amount');
        const totalAmount = document.querySelector('.total-amount');
        const paymentMethodSpan = document.querySelector('.payment-method');

        if (paymentType && paymentDate && paymentAmount && taxAmount && totalAmount && paymentMethodSpan) {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            const tax = parseFloat(order.tax) || 0;
            const orderAmount = parseFloat(order.order_amount) || 0;
            const baseAmount = orderAmount - tax;

            let descriptionHTML = '';
            let paymentNote = order.payment_note;

            console.log('Processing payment type determination...');

            // Handle "All Training Payments" case
            if (paymentNote === "All Training Payments") {
                console.log('Handling All Training Payments case');
                paymentNote = "Training Payments";
                descriptionHTML = `<strong>${paymentNote}</strong>`;
            }
            // Handle Training Payments
            else if (order.training_id) {
                console.log('Fetching training details for ID:', order.training_id);
                try {
                    const res = await fetch('https://backend.bninewdelhi.com/api/allTrainings');
                    const trainings = await res.json();
                    console.log('Fetched trainings:', trainings);
                    
                    const training = trainings.find(t => t.training_id === order.training_id);
                    console.log('Found training:', training);
                    
                    if (training) {
                        descriptionHTML = `<strong>${paymentNote}-${training.training_name}</strong>`;
                    }
                } catch (error) {
                    console.error('Error fetching training details:', error);
                    descriptionHTML = `<strong>${paymentNote}</strong>`;
                }
            }
            // Handle Kitty Payments
            else if (order.kitty_bill_id) {
                console.log('Fetching kitty details for ID:', order.kitty_bill_id);
                try {
                    const res = await fetch('https://backend.bninewdelhi.com/api/getAllKittyPayments');
                    const kittyPayments = await res.json();
                    console.log('Fetched kitty payments:', kittyPayments);
                    
                    const kittyDetails = kittyPayments.find(k => k.kitty_bill_id === order.kitty_bill_id);
                    console.log('Found kitty details:', kittyDetails);
                    
                    if (kittyDetails) {
                        descriptionHTML = `<strong>${paymentNote}<br>
                            (${kittyDetails.bill_type}, ${kittyDetails.total_weeks} - weeks<br>
                            ${kittyDetails.description})</strong>`;
                    }
                } catch (error) {
                    console.error('Error fetching kitty details:', error);
                    descriptionHTML = `<strong>${paymentNote}</strong>`;
                }
            }
            // Default case (Meeting Payments, etc.)
            else {
                console.log('Using default payment description');
                descriptionHTML = `<strong>${universalLinkName || 'Meeting Payment'}</strong>`;
            }

            console.log('Final description HTML:', descriptionHTML);

            // Set all values
            paymentType.innerHTML = descriptionHTML;
            paymentDate.textContent = date;
            paymentAmount.textContent = `₹${baseAmount.toFixed(2)}`;
            taxAmount.textContent = `₹${tax.toFixed(2)}`;
            totalAmount.textContent = `₹${orderAmount.toFixed(2)}`;

            console.log('Set payment details:', {
                description: descriptionHTML,
                date: paymentDate.textContent,
                baseAmount: paymentAmount.textContent,
                tax: taxAmount.textContent,
                total: totalAmount.textContent
            });

            console.log('Full transaction response:', transaction); // Changed from order to transaction

            if (transaction && transaction.payment_method) {
                console.log('Payment method object:', transaction.payment_method);
                console.log('Payment group:', transaction.payment_group);
                
                if (transaction.payment_group === 'net_banking') {
                    console.log('Netbanking payment detected:', transaction.payment_method.netbanking);
                    const netbanking = transaction.payment_method.netbanking;
                    paymentMethodSpan.innerHTML = `
                        <strong>Netbanking</strong><br>
                        <span style="font-size: 0.9em; color: #666;">
                            Bank: ${netbanking.netbanking_bank_name}<br>
                            IFSC: ${netbanking.netbanking_ifsc || 'N/A'}<br>
                            Account: ${netbanking.netbanking_account_number || 'N/A'}<br>
                        </span>
                    `;
                } else if (transaction.payment_group === 'upi') {
                    console.log('UPI payment detected:', transaction.payment_method.upi);
                    const upiId = transaction.payment_method.upi.upi_id;
                    paymentMethodSpan.textContent = `UPI (${upiId})`;
                } else {
                    console.log('Unknown payment method:', transaction.payment_group);
                    paymentMethodSpan.textContent = transaction.payment_group || 'Unknown';
                }
            } else {
                console.log('No payment method found in transaction data');
                paymentMethodSpan.textContent = 'Not Available';
            }
        } else {
            console.error('Missing required elements:', {
                paymentType: !!paymentType,
                paymentDate: !!paymentDate,
                paymentAmount: !!paymentAmount,
                taxAmount: !!taxAmount,
                totalAmount: !!totalAmount,
                paymentMethodSpan: !!paymentMethodSpan
            });
        }
    } catch (error) {
        console.error('Error in displayTransactionDetails:', error);
        console.error('Error stack:', error.stack);
    }
}

// Function to display order details
function displayOrderDetails(order, transaction) {
    console.log('DisplayOrderDetails called with:', { order, transaction });

    try {
        // Log order details
        console.log('Order ID:', order?.order_id);
        console.log('Member Name:', order?.member_name);
        console.log('Invited By:', order?.member_name || 'Unknown');
        console.log('Customer Email:', order?.customer_email);
        console.log('Company:', order?.company);
        console.log('GSTIN:', order?.gstin);
        
        // Populate member details
        const memberName = document.getElementById('member-name');
        const invitedBy = document.getElementById('invited-by');
        const customerEmail = document.getElementById('customer-email');
        const companyName = document.getElementById('company-name');
        const companyGst = document.getElementById('company-gst');
        const orderNumber = document.getElementById('order-number');

        console.log('Found DOM elements:', {
            memberName,
            invitedBy,
            customerEmail,
            companyName,
            companyGst,
            orderNumber
        });

        // Set values with error checking
        if (memberName) {
            memberName.textContent = order?.member_name || "N/A";
            console.log('Set member name to:', memberName.textContent);
        } else {
            console.error('member-name element not found');
        }

        // Add invited by handling
        if (invitedBy) {
            invitedBy.textContent = order?.member_name === "Unknown" ? "Self Invited" : (order?.member_name || "Self Invited");
            console.log('Set invited by to:', invitedBy.textContent);
        } else {
            console.error('invited-by element not found');
        }

        if (customerEmail) {
            customerEmail.textContent = order?.customer_email || "N/A";
            console.log('Set customer email to:', customerEmail.textContent);
        } else {
            console.error('customer-email element not found');
        }

        if (companyName) {
            companyName.textContent = order?.company || "N/A";
            console.log('Set company name to:', companyName.textContent);
        } else {
            console.error('company-name element not found');
        }

        if (companyGst) {
            companyGst.textContent = order?.gstin || "N/A";
            console.log('Set company GST to:', companyGst.textContent);
        } else {
            console.error('company-gst element not found');
        }

        if (orderNumber) {
            orderNumber.textContent = order?.order_id || "N/A";
            console.log('Set order number to:', orderNumber.textContent);
        } else {
            console.error('order-number element not found');
        }

        // Add payment status and transaction number
        const paymentStatus = document.querySelector('.payment-status');
        const transactionNo = document.querySelector('.transaction-no');

        console.log('Payment Status Element:', paymentStatus);
        console.log('Transaction Number Element:', transactionNo);
        console.log('Transaction Data:', transaction);

        if (paymentStatus) {
            paymentStatus.textContent = transaction?.payment_status === "SUCCESS" ? "Success" : "Failed";
            console.log('Set payment status to:', paymentStatus.textContent);
        } else {
            console.error('payment-status element not found');
        }

        if (transactionNo) {
            transactionNo.textContent = transaction?.cf_payment_id || "N/A";
            console.log('Set transaction number to:', transactionNo.textContent);
        } else {
            console.error('transaction-no element not found');
        }

        // Add payment method handling
        const paymentMethodSpan = document.querySelector('.payment-method');
        if (paymentMethodSpan && transaction) {
            console.log('Processing payment method from transaction:', transaction);
            console.log('Payment group:', transaction.payment_group);
            console.log('Payment method details:', transaction.payment_method);

            // Simply display whether it's netbanking or upi
            if (transaction.payment_group === 'net_banking') {
                console.log('Netbanking payment detected:', transaction.payment_method.netbanking);
                const netbanking = transaction.payment_method.netbanking;
                paymentMethodSpan.innerHTML = `
                    <strong>Netbanking</strong><br>
                    <span style="font-size: 0.9em; color: #666;">
                        Bank: ${netbanking.netbanking_bank_name}<br>
                        IFSC: ${netbanking.netbanking_ifsc || 'N/A'}<br>
                        Account: ${netbanking.netbanking_account_number || 'N/A'}<br>
                    </span>
                `;
            } else if (transaction.payment_group === 'upi') {
                console.log('UPI payment detected:', transaction.payment_method.upi);
                const upiId = transaction.payment_method.upi.upi_id;
                paymentMethodSpan.textContent = `UPI (${upiId})`;
            } else {
                paymentMethodSpan.textContent = transaction.payment_group || 'Not Available';
                console.log('Set payment method to:', transaction.payment_group || 'Not Available');
            }
        }

        // Keep existing code
        document.querySelector('.invoice-id').textContent = order.order_id;
        document.querySelector('.date-issued').textContent = new Date(order.created_at).toLocaleString();
        
        // Set member name without GSTIN
        document.querySelector('.billing-to-name').textContent = order.member_name || "N/A";
        document.querySelector('.due-amount').textContent = `₹${order.order_amount}`;
        
        // Create billing to section with GSTIN at the end
        document.querySelector('.billing-to-email').textContent = order.customer_email || "N/A";
        document.querySelector('.billing-to-phone').textContent = order.customer_phone || "N/A";
        document.querySelector('.billing-to-gstin').textContent = `GSTIN: ${order.gstin || "N/A"}`;
        
        // Set the transaction ID (cf_payment_id) if available
        if (transaction && transaction.cf_payment_id) {
            document.querySelector('.due-date').textContent = transaction.cf_payment_id;
        } else {
            document.querySelector('.due-date').textContent = "N/A";
        }

    } catch (error) {
        console.error('Error in displayOrderDetails:', error);
        console.error('Error stack:', error.stack);
    }
}

// Call the function to fetch order details on page load
fetchAllOrders();

document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadInvoice');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            console.log('Download button clicked');
            
            // Get the element to be downloaded
            const element = document.querySelector('.card.custom-card');
            console.log('Found element to download:', element);

            // Get the order ID for the filename
            const orderId = document.getElementById('order-number').textContent;
            console.log('Using order ID for filename:', orderId);

            // Configure the PDF options
            const opt = {
                margin: 1,
                filename: `BNI-Invoice-${orderId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: true
                },
                jsPDF: { 
                    unit: 'in', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };

            console.log('Starting PDF generation with options:', opt);

            // Generate and download PDF
            html2pdf().set(opt).from(element).save().then(() => {
                console.log('PDF generation completed');
            }).catch(error => {
                console.error('Error generating PDF:', error);
            });
        });
    } else {
        console.error('Download button not found in the DOM');
    }
});

// Add a function to handle images loading
function ensureImagesLoaded() {
    console.log('Checking for images to load');
    const images = document.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) {
            return Promise.resolve();
        } else {
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Handle error case as well
            });
        }
    });
    return Promise.all(imagePromises);
}

// Update the download click handler to wait for images
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadInvoice');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async function() {
            console.log('Download initiated');
            try {
                // Show loading state
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = 'Generating PDF...';

                // Wait for all images to load
                await ensureImagesLoaded();
                console.log('All images loaded');

                const element = document.querySelector('.card.custom-card');
                const orderId = document.getElementById('order-number').textContent;

                const opt = {
                    margin: [0.5, 0.5, 0.5, 0.5],
                    filename: `BNI-Invoice-${orderId}.pdf`,
                    image: { type: 'jpeg', quality: 1 },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        logging: true,
                        letterRendering: true
                    },
                    jsPDF: { 
                        unit: 'in', 
                        format: 'a4', 
                        orientation: 'portrait'
                    }
                };

                await html2pdf().set(opt).from(element).save();
                console.log('PDF generated successfully');

            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF. Please try again.');
            } finally {
                // Reset button state
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = 'Download <i class="ri-download-2-line ms-1 align-middle"></i>';
            }
        });
    }
});
