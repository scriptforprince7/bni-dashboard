document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const universalLinkId = urlParams.get("id");

    if (!universalLinkId) return;

    try {
        // Fetch universal link data
        const response = await fetch("https://bni-data-backend.onrender.com/api/universalLinks");
        const universalLinks = await response.json();

        const selectedLink = universalLinks.find(link => link.id == universalLinkId);

        if (!selectedLink) return;

        // If ID is 3, fetch training data and populate the dropdown
        if (selectedLink.id == 3) {
            const trainingResponse = await fetch("https://bni-data-backend.onrender.com/api/allTrainings");
            const trainings = await trainingResponse.json();

            const particularsField = document.getElementById("particulars");

            if (particularsField) {
                // Create a new select element
                const selectElement = document.createElement("select");
                selectElement.className = "form-control form-control-light";
                selectElement.name = "particulars";
                selectElement.id = "particulars";

                // Add default 'Select Training' option
                const defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.textContent = "Select Training";
                defaultOption.selected = true;
                defaultOption.disabled = true;
                selectElement.appendChild(defaultOption);

                // Populate options with training name as visible text
                trainings.forEach(training => {
                    const option = document.createElement("option");
                    option.value = training.training_price; // Store price in value
                    option.textContent = training.training_name; // Display training name
                    selectElement.appendChild(option);
                });

                // Replace textarea with the select element
                particularsField.parentNode.replaceChild(selectElement, particularsField);

                // Add event listener to update price fields on selection
                selectElement.addEventListener("change", function () {
                    const selectedTrainingPrice = parseFloat(this.value) || 0;

                    // Update rate, price, and taxable total amount
                    document.getElementById("rate").value = `₹ ${selectedTrainingPrice.toFixed(2)}`;
                    document.getElementById("price").value = `₹ ${selectedTrainingPrice.toFixed(2)}`;
                    document.getElementById("taxable-total-amount").value = `₹ ${selectedTrainingPrice.toFixed(2)}`;

                    // Calculate grand total with 18% GST
                    const grandTotal = selectedTrainingPrice * 1.18;
                    document.getElementById("grand_total").value = `₹ ${grandTotal.toFixed(2)}`;
                });
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
});
