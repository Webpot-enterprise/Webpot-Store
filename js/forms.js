// Forms Module - Form handling and submission

/**
 * Submit contact form
 * @param {Event} event - Form submission event
 */
async function submitForm(event) {
  event.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    message: document.getElementById('message').value
  };
  
  const result = await submitContact(formData);
  
  if (result.success) {
    showSuccessMessage();
    document.getElementById('contactForm').reset();
  } else {
    alert('Error submitting form. Please try again.');
  }
}
