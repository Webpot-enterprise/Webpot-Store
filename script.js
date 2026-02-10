function revealOnScroll() {
  document.querySelectorAll(".reveal").forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

function openTemplate() {
  document.getElementById("templateModal").style.display = "flex";
}
function closeTemplate() {
  document.getElementById("templateModal").style.display = "none";
}
// FAQ Toggle
document.querySelectorAll(".faq-question").forEach(button => {
  button.addEventListener("click", () => {
    const item = button.parentElement;

    // Close other open FAQs (accordion behavior)
    document.querySelectorAll(".faq-item").forEach(faq => {
      if (faq !== item) faq.classList.remove("active");
    });

    // Toggle current
    item.classList.toggle("active");
  });
});
