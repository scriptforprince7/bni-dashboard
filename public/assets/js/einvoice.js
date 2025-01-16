// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex'; // Show loader
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById('loader').style.display = 'none'; // Hide loader
  }



// Function to retrieve query parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
// Retrieve and parse the JSON data
const invoiceData = JSON.parse(decodeURIComponent(getQueryParam("invoiceData")));
const einvoiceData = JSON.parse(decodeURIComponent(getQueryParam("einvoiceData")));
// Use `invoiceData` and `einvoiceData` as needed
const ackDate = einvoiceData.ack_dt ? new Date(einvoiceData.ack_dt) : null;
const orderAmount = invoiceData.orderId.order_amount || 0;
const taxAmount = invoiceData.orderId.tax || 0;
const memberId = invoiceData.orderId.customer_id;
const delhiZipCodes = ["110080", "110081", "110082", "110083", "110084", "110085", "110086", "110087", "110088", "110089", "110090", "110091", "110092", "110093", "110094", "110095", "110096", "110097", "110099", "110110", "110001", "110002", "110003", "110004", "110005", "110006", "110007", "110008", "110009", "110010", "110011", "110012", "110013", "110014", "110015", "110016", "110017", "110018", "110019", "110020", "110021", "110022", "110023", "110024", "110025", "110026", "110027", "110028", "110029", "110030", "110031", "110032", "110033", "110034", "110035", "110036", "110037", "110038", "110039", "110040", "110041", "110042", "110043", "110044", "110045", "110046", "110047", "110048", "110049", "110051", "110052", "110053", "110054", "110055", "110056", "110057", "110058", "110059", "110060", "110061", "110062", "110063", "110064", "110065", "110066", "110067", "110068", "110069", "110070", "110071", "110072", "110073", "110074", "110075", "110076", "110077", "110078"];

async function fetchMemberDetails(memberId) {
    showLoader();
  try {
    const response = await fetch("https://bni-data-backend.onrender.com/api/members");
    const members = await response.json();  // Assuming the response is a list of all members

    if (response.ok) {
      // Find the member with the given customer_id
      const member = members.find(m => m.member_id === memberId);

      if (member) {
        // Process the member details here, for example:
		const memberPincode = member.address_pincode; // Assuming the pincode is in this field
        const isDelhiPincode = delhiZipCodes.includes(memberPincode);

		if (isDelhiPincode) {
          // If Delhi, split tax equally into CGST and SGST
          const dividedTax = taxAmount / 2;
          document.querySelector(".igst-row").style.display = "none";
          document.querySelector(".cgst-row").style.display = "table-row";
          document.querySelector(".sgst-row").style.display = "table-row";
          document.querySelector(".cgst").textContent = `₹${dividedTax.toFixed(2)}`;
          document.querySelector(".sgst").textContent = `₹${dividedTax.toFixed(2)}`;
        } else {
          // If outside Delhi, show full tax as IGST
          document.querySelector(".igst-row").style.display = "table-row";
          document.querySelector(".cgst-row").style.display = "none";
          document.querySelector(".sgst-row").style.display = "none";
          document.querySelector(".igst").textContent = `₹${taxAmount.toFixed(2)}`;
        }

		calculateTax(taxAmount, isDelhiPincode);

        // Now you can display or use the member data as needed
		displayMemberDetails(member);
        
      } else {
        console.log("Member not found!");
      }
    } else {
      console.error("Error fetching members:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching member data:", error);
  } finally {
    hideLoader();
  }
}
function calculateTax(taxAmount, isDelhiPincode) {
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isDelhiPincode) {
        // If the pincode is from Delhi, divide the tax equally between CGST and SGST
        cgst = sgst = taxAmount / 2;
        document.querySelector(".cgst").textContent = `₹ ${cgst.toFixed(2)}`;
        document.querySelector(".sgst").textContent = `₹ ${sgst.toFixed(2)}`;
    } else {
        // Else, apply the full tax as IGST
        igst = taxAmount;
        document.querySelector(".igst").textContent = `₹ ${igst.toFixed(2)}`;
    }
}
function displayMemberDetails(member) {
  // You can now use the member details in your UI
  document.querySelector(".ship_to_address").textContent = member.member_company_address || "N/A";
  document.querySelector(".bill_to_address").textContent = member.member_company_address || "N/A";
  document.querySelector(".ship_to_state").textContent = member.member_company_state|| "N/A";
  document.querySelector(".bill_to_state").textContent = member.member_company_state || "N/A";
  // Add other fields as required
}
fetchMemberDetails(memberId);
function numberToWords(num) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const thousands = ["", "Thousand", "Million", "Billion"];

    if (num === 0) return "Zero";

    let word = '';
    let i = 0;

    // Process the integer part of the number
    while (num > 0) {
        if (num % 1000 !== 0) {
            word = helper(num % 1000) + thousands[i] + " " + word;
        }
        num = Math.floor(num / 1000);
        i++;
    }

    return word.trim();

    // Helper function to convert numbers less than 1000
    function helper(num) {
        if (num === 0) return '';
        else if (num < 20) return ones[num] + " ";
        else if (num < 100) return tens[Math.floor(num / 10)] + " " + helper(num % 10);
        else return ones[Math.floor(num / 100)] + " Hundred " + helper(num % 100);
    }
}
function convertDecimalToWords(decimal) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    let word = '';

    // Convert each decimal digit to words
    for (let i = 0; i < decimal.length; i++) {
        word += ones[parseInt(decimal[i])] + " ";
    }

    return word.trim();
}
function formatAmount(amount) {
  const [integerPart, decimalPart] = amount.toString().split(".");
  let integerInWords = numberToWords(parseInt(integerPart));

  if (decimalPart) {
      let decimalInWords = convertDecimalToWords(decimalPart);
      return `Rupees ${integerInWords} and ${decimalInWords} Paise`;  
      // For example: "Rupees Forty Eight Thousand Seven Hundred Forty Three and Forty Four Paise"
  }

  return `Rupees ${integerInWords} Only`;
}

const amountInWords = formatAmount(invoiceData.amount);
console.log(invoiceData);
// Calculate base amount
const baseAmount = orderAmount - taxAmount;
const currentDate = new Date();
const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
// Populate each field
document.querySelector(".irn_number").textContent = einvoiceData.irn || "N/A";
document.querySelector(".ack_no").textContent = einvoiceData.ack_no || "N/A";
document.querySelector(".ack_date").textContent = ackDate 
    ? `${ackDate.getDate().toString().padStart(2, '0')}-${(ackDate.getMonth() + 1).toString().padStart(2, '0')}-${ackDate.getFullYear().toString().slice(-2)}` 
    : "N/A";
    document.querySelector(".payment_type").innerHTML = 
    `<strong>${invoiceData.universalLinkName || "N/A"} - ${invoiceData.orderId?.renewal_year || "N/A"}</strong>`;
  
document.querySelector(".base_amount").textContent = `₹ ${baseAmount.toFixed(2)}`;
document.querySelector(".base_amountt").textContent = `₹${baseAmount.toFixed(2)}`;
document.querySelector(".sub_total").innerHTML = `<strong>₹ ${baseAmount.toFixed(2)}</strong>`;
document.querySelector(".ship_to_company").innerHTML = `<strong>${invoiceData.orderId.company || "N/A"}</strong>`;
document.querySelector(".ship_to_gst").textContent = invoiceData.orderId.gstin || "N/A";
document.querySelector(".bill_to_company").innerHTML = `<strong>${invoiceData.orderId.company || "N/A"}</strong>`;
document.querySelector(".order_id").innerHTML = `${invoiceData.orderId.order_id || "N/A"}`;
document.querySelector(".transaction_id").innerHTML = `${invoiceData.transactionId.cf_payment_id || "N/A"}`;
document.querySelector(".payment_mode").innerHTML = `${invoiceData.transactionId.payment_group || "N/A"}`;
document.querySelector(".buyer_email").innerHTML = `${invoiceData.orderId.customer_email || "N/A"}`;
document.querySelector(".buyer_phone").innerHTML = `${invoiceData.orderId.customer_phone || "N/A"}`;
// document.querySelector(".payment_time").innerHTML = `${invoiceData.transactionId.payment_time || "N/A"}`;
document.querySelector(".bill_to_name").innerHTML = `<strong>${invoiceData.orderId.member_name || "N/A"}</strong>`;
document.querySelector(".bill_to_gst").textContent = invoiceData.orderId.gstin || "N/A";
document.querySelector(".invoice_date").textContent = formattedDate;
document.querySelector(".grand_total").innerHTML = `<b>₹ ${invoiceData.amount || 0}</b>`;
document.querySelector(".amount_in_words").innerHTML = `<b><i>${amountInWords || "N/A"}</i></b>`;
const qrCodeData = einvoiceData.qrcode;
// Generate the QR code and set it as an image
QRCode.toDataURL(qrCodeData, { width: 100, height: 100 }, (err, url) => {
  if (err) {
    console.error('Error generating QR Code:', err);
    document.querySelector(".qr_code").src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAMqZnH06aHaLByvcc_8rX1901i-KaLmbYrA&s"; // Fallback image in case of error
  } else {
    // Display the generated QR code by setting the image src to the generated URL
    document.querySelector(".qr_code").src = url;
    
    // Optionally, store the QR code URL in localStorage if you want to cache it
    const qrCodeKey = `qrCode_${einvoiceData.orderId}`; // Unique key for this QR code
    localStorage.setItem(qrCodeKey, url);
  }
});
	