// Forms Module - Form handling and submission

/**
 * Submit contact form
 * @param {Event} event - Form submission event
 */
async function submitForm(event) {
  event.preventDefault();
  
  // Check authentication - if not authenticated, redirect to auth page
  if (!isAuthenticated()) {
    showErrorMessage('Please login first to submit a contact form');
    setTimeout(() => {
      window.location.href = '/auth.html';
    }, 500);
    return;
  }
  
  // Get form data
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');
  
  if (!nameInput || !emailInput || !messageInput) {
    showErrorMessage('Form elements not found');
    return;
  }
  
  const formData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput ? phoneInput.value.trim() : '',
    message: messageInput.value.trim()
  };
  
  // Validate form data
  if (!formData.name || !formData.email || !formData.message) {
    showErrorMessage('Please fill in all required fields');
    return;
  }
  
  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : 'Send Message';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  }
  
  try {
    const result = await submitContact(formData);
    
    if (result.success) {
      showSuccessMessage('Message sent successfully!');
      document.getElementById('contactForm').reset();
      // Clear success message after 3 seconds
      setTimeout(() => {
        const successMsg = document.querySelector('.success-message');
        if (successMsg) successMsg.textContent = '';
      }, 3000);
    } else {
      showErrorMessage(result.data?.error || 'Error submitting form. Please try again.');
    }
  } catch (error) {
    showErrorMessage('Failed to send message. Please try again.');
    console.error('Form submission error:', error);
  } finally {
    // Restore button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

