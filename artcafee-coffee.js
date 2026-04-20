const { useEffect } = require("react");

function total() {
  // Prices
  let price1 = 250;
  let price2 = 300;
  let price3 = 150;

  // Quantities entered by user
  let qty1 = document.getElementById("qty1").value;
  let qty2 = document.getElementById("qty2").value;
  let qty3 = document.getElementById("qty3").value;

  // Calculate cost
  let totalCost = price1 * qty1 + price2 * qty2 + price3 * qty3;

  // Display total
  document.getElementById("total").innerText = "Ksh." + totalCost.toFixed(2);
}

function submitOrder() {
  alert("Your order has been submitted successfully ☕");
}

// receipt area

function submitOrder() {
  let qty1 = parseInt(document.getElementById("qty1").value) || 0;
  let qty2 = parseInt(document.getElementById("qty2").value) || 0;
  let qty3 = parseInt(document.getElementById("qty3").value) || 0;

  let receipt = "";
  let total = 0;

  if (qty1 > 0) {
    let cost = qty1 * 250;
    receipt += "Cappuccino x " + qty1 + " = Ksh. " + cost + "<br>";
    total += cost;
  }

  if (qty2 > 0) {
    let cost = qty2 * 300;
    receipt += "Caffe Latte x " + qty2 + " = Ksh. " + cost + "<br>";
    total += cost;
  }

  if (qty3 > 0) {
    let cost = qty3 * 150;
    receipt += "White Coffee x " + qty3 + " = Ksh. " + cost + "<br>";
    total += cost;
  }

  if (total === 0) {
    receipt = "No items selected.";
  }

  document.getElementById("receiptItems").innerHTML = receipt;
  document.getElementById("receiptTotal").innerHTML =
    "<b>Total: Ksh. " + total.toFixed(2) + "</b>";

  // show receipt
  document.getElementById("receipt").style.display = "block";
}

// print Receipt

function printReceipt() {
  window.print();
}


