exports.manageMemberAccolades = (req, res) => {
    res.render('m-member-accolade/manage-member-accolades', { title: 'Manage Member Accolades' });
};
exports.requestMemberAccolades = (req, res) => {
    res.render('m-member-accolade/request-member-accolades', { title: 'Request Member Accolades' });
};
exports.viewAllAccolades = (req, res) => {
    res.render('m-member-accolade/view-all-accolades', { title: 'View All Accolades' });
};
exports.DisapprovedAccolades = (req, res) => {
    res.render('m-member-accolade/Disapproved-Accolades', { title: 'Disapproved accolades' });
};

exports.memberAccoladePaymentReceipt = async (req, res) => {
    try {
        const { order_id } = req.query;
        
        if (!order_id) {
            return res.status(400).render('error', { 
                title: 'Error', 
                message: 'Order ID is required' 
            });
        }

        // Fetch payment details from database
        const paymentDetails = await fetchPaymentDetails(order_id);
        
        if (!paymentDetails) {
            return res.status(404).render('error', { 
                title: 'Not Found', 
                message: 'Payment details not found' 
            });
        }

        res.render('m-member-accolade/memberAccoladePaymentReceipt', { 
            title: 'Member Accolade Payment Receipt',
            paymentDetails: paymentDetails
        });
    } catch (error) {
        console.error('Error fetching payment receipt:', error);
        res.status(500).render('error', { 
            title: 'Error', 
            message: 'Failed to load payment receipt' 
        });
    }
};

// Helper function to fetch payment details
async function fetchPaymentDetails(orderId) {
    let con;
    try {
        const { Client } = require('pg');
        con = new Client({
            host: 'bnidbserver.postgres.database.azure.com',
            user: 'dbuser',
            port: 5432,
            password: '5!72F4(bvKzP',
            database: 'flexibleserverdb',
            ssl: {
                rejectUnauthorized: false, // Required for secure connections to Render
            },
        });

        await con.connect();

        // Query to get payment details from Orders and Transactions tables
        const query = `
            SELECT 
                o.order_id,
                o.order_amount,
                o.order_currency,
                o.tax,
                o.member_name,
                o.customer_email,
                o.customer_phone,
                o.payment_note,
                o.customer_id,
                o.accolade_id,
                o.created_at as order_created_at,
                t.payment_status,
                t.payment_time,
                t.payment_completion_time,
                t.payment_method,
                t.cf_payment_id,
                t.payment_amount,
                t.payment_currency,
                t.payment_group,
                t.bank_reference,
                t.gateway_order_id,
                t.gateway_payment_id
            FROM Orders o
            LEFT JOIN Transactions t ON o.order_id = t.order_id
            WHERE o.order_id = $1
        `;

        const result = await con.query(query, [orderId]);

        if (result.rows.length === 0) {
            await con.end();
            return null;
        }

        const payment = result.rows[0];
        
        // Calculate amounts
        const totalAmount = parseFloat(payment.order_amount) || 0;
        const taxAmount = parseFloat(payment.tax) || 0;
        const baseAmount = parseFloat((totalAmount - taxAmount).toFixed(2));

        // Get member details from the order
        const memberName = payment.member_name || 'Unknown';
        const memberEmail = payment.customer_email || 'N/A';
        const memberPhone = payment.customer_phone || 'N/A';

        // Get accolade details if accolade_id is available
        let accoladeName = 'Accolade Payment';
        let itemType = 'N/A';
        let requestComment = 'Payment completed via Cashfree';

        if (payment.accolade_id) {
            try {
                // Get accolade details from accolades table
                const accoladeQuery = `
                    SELECT 
                        accolade_name,
                        item_type
                    FROM accolades
                    WHERE accolade_id = $1
                `;
                
                const accoladeResult = await con.query(accoladeQuery, [payment.accolade_id]);
                if (accoladeResult.rows.length > 0) {
                    const accoladeData = accoladeResult.rows[0];
                    accoladeName = accoladeData.accolade_name || 'Accolade Payment';
                    itemType = accoladeData.item_type || 'N/A';
                }

                // Try to get comment from member_requisition_request table
                const commentQuery = `
                    SELECT request_comment
                    FROM member_requisition_request
                    WHERE member_id = $1 AND accolade_id = $2
                    ORDER BY created_at DESC
                    LIMIT 1
                `;
                
                const commentResult = await con.query(commentQuery, [payment.customer_id, payment.accolade_id]);
                if (commentResult.rows.length > 0) {
                    requestComment = commentResult.rows[0].request_comment || 'Payment completed via Cashfree';
                }
            } catch (accoladeError) {
                console.log('Could not fetch accolade details:', accoladeError.message);
            }
        }

        // Format payment method
        let paymentMethod = 'N/A';
        if (payment.payment_method) {
            try {
                const methodData = typeof payment.payment_method === 'string' 
                    ? JSON.parse(payment.payment_method) 
                    : payment.payment_method;
                
                if (methodData.netbanking) {
                    paymentMethod = `${methodData.netbanking.netbanking_bank_name} (Net Banking)`;
                } else if (methodData.card) {
                    paymentMethod = `${methodData.card.card_bank_name} (Card)`;
                } else if (methodData.upi) {
                    paymentMethod = 'UPI';
                } else if (methodData.cash) {
                    paymentMethod = 'Cash';
                } else {
                    paymentMethod = payment.payment_group || 'N/A';
                }
            } catch (parseError) {
                paymentMethod = payment.payment_group || 'N/A';
            }
        }

        await con.end();

        return {
            orderId: payment.order_id,
            memberName: memberName,
            memberEmail: memberEmail,
            memberPhone: memberPhone,
            accoladeName: accoladeName,
            itemType: itemType,
            baseAmount: baseAmount,
            taxAmount: taxAmount,
            totalAmount: totalAmount,
            requestComment: requestComment,
            requestDate: payment.order_created_at,
            paymentDate: payment.payment_completion_time || payment.payment_time,
            paymentStatus: payment.payment_status,
            paymentMethod: paymentMethod,
            cfPaymentId: payment.cf_payment_id,
            bankReference: payment.bank_reference,
            gatewayOrderId: payment.gateway_order_id,
            gatewayPaymentId: payment.gateway_payment_id
        };

    } catch (error) {
        console.error('Database error:', error);
        if (con) {
            await con.end();
        }
        throw error;
    }
}

