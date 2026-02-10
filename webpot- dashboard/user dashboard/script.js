// Status select event listener - Guard against missing elements
const statusSelects = document.querySelectorAll(".status-select");
if (statusSelects.length > 0) {
  statusSelects.forEach(select => {
    select.addEventListener("change", () => {
      alert("Order status updated to: " + select.value);
    });
  });
}