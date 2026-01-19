// Content Module - Content loading (testimonials, notifications, etc)

/**
 * Load testimonials from API or show fallback
 */
async function loadTestimonials() {
  const testimonialsGrid = document.getElementById('testimonialsGrid');
  
  if (!testimonialsGrid) return;
  
  try {
    const result = await getTestimonials();
    
    if (result.success && result.data.testimonials && result.data.testimonials.length > 0) {
      testimonialsGrid.innerHTML = result.data.testimonials
        .map(t => `
          <div class="testimonial-card">
            <div class="stars">${'★'.repeat(t.rating || 5)}</div>
            <p>"${t.message}"</p>
            <p><strong>${t.name}</strong></p>
            <p style="color: var(--text-muted);">${t.company || ''}</p>
          </div>
        `)
        .join('');
    } else {
      showFallbackTestimonials();
    }
  } catch (error) {
    console.error('Error loading testimonials:', error);
    showFallbackTestimonials();
  }
}

/**
 * Show fallback testimonials if API fails
 */
function showFallbackTestimonials() {
  const testimonialsGrid = document.getElementById('testimonialsGrid');
  
  if (!testimonialsGrid) return;
  
  const fallbackTestimonials = [
    {
      name: 'Jash Bhanderi',
      company: 'Tech Startup',
      message: 'Webpot delivered our website on time and exceeded our expectations. The team was professional and responsive.',
      rating: 5
    },
    {
      name: 'Miral Shabhaya',
      company: 'E-commerce Business',
      message: 'Great service! Our website is now converting visitors to customers. Highly recommend Webpot!',
      rating: 5
    },
    {
      name: 'Diya Bhanderi',
      company: 'Small Business Owner',
      message: 'The support team is excellent. They helped us with everything we needed and made the process smooth.',
      rating: 5
    }
  ];
  
  testimonialsGrid.innerHTML = fallbackTestimonials
    .map(t => `
      <div class="testimonial-card">
        <div class="stars">${'★'.repeat(t.rating)}</div>
        <p>"${t.message}"</p>
        <p><strong>${t.name}</strong></p>
        <p style="color: var(--text-muted);">${t.company || ''}</p>
      </div>
    `)
    .join('');
}

/**
 * Load notifications
 */
async function loadNotifications() {
  const notificationList = document.getElementById('notificationList');
  
  if (!notificationList) return;
  
  try {
    const result = await getNotifications();
    
    if (result.success && result.data.notifications && result.data.notifications.length > 0) {
      notificationList.innerHTML = result.data.notifications
        .map(n => `<div class="notification-item"><strong>${n.title}</strong><p>${n.message}</p></div>`)
        .join('');
      
      const badge = document.getElementById('notificationBadge');
      if (badge) {
        badge.style.display = 'inline-block';
      }
    } else {
      notificationList.innerHTML = '<p style="padding: 1rem; color: #999;">No new notifications</p>';
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    notificationList.innerHTML = '<p style="padding: 1rem; color: #999;">No new notifications</p>';
  }
}
