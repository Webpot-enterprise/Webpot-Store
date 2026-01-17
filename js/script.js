// Main Application Entry Point
// Initializes all modules and sets up page on load

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
  // Update authentication UI
  updateAuthUI();
  
  // Load testimonials if feature is enabled and function exists
  if (API_CONFIG.FEATURES.ENABLE_TESTIMONIALS && typeof loadTestimonials === 'function') {
    loadTestimonials();
  }
  
  // Load notifications if feature is enabled and function exists
  if (API_CONFIG.FEATURES.ENABLE_NOTIFICATIONS && typeof loadNotifications === 'function') {
    loadNotifications();
  }
  
  // Update copyright year dynamically
  updateCopyrightYear();
  
  // Initialize tooltips or other global features
  initializeGlobalFeatures();
  
  // Initialize interactive pricing
  initializePricingComparison();
});

/**
 * Update copyright year to current year
 */
function updateCopyrightYear() {
  const currentYear = new Date().getFullYear();
  const copyrightElements = document.querySelectorAll('footer p');
  copyrightElements.forEach(el => {
    if (el.textContent.includes('2025')) {
      el.textContent = el.textContent.replace('2025', currentYear);
    }
  });
}

/**
 * Initialize any global features or polyfills
 */
function initializeGlobalFeatures() {
  // Add any global initialization code here
  console.log('Webpot Application Initialized');
}

/**
 * Auto-refresh testimonials every 30 minutes
 */
setInterval(() => {
  if (API_CONFIG.FEATURES.ENABLE_TESTIMONIALS && typeof loadTestimonials === 'function') {
    loadTestimonials();
  }
}, 30 * 60 * 1000);

/**
 * Auto-refresh notifications every 5 minutes
 */
setInterval(() => {
  if (API_CONFIG.FEATURES.ENABLE_NOTIFICATIONS && typeof loadNotifications === 'function') {
    loadNotifications();
  }
}, 5 * 60 * 1000);
// ============================================
// INTERACTIVE PRICING COMPARISON
// ============================================

/**
 * Initialize pricing comparison with toggles
 */
function initializePricingComparison() {
  const billingBtns = document.querySelectorAll('.billing-btn');
  const planBtns = document.querySelectorAll('.plan-btn');
  
  // Billing toggle listeners
  billingBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const billingType = this.dataset.billing;
      billingBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updatePricingDisplay(billingType);
    });
  });
  
  // Plan type toggle listeners
  planBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const planType = this.dataset.type;
      planBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      switchPricingPlan(planType);
    });
  });
  
  // Initialize plan card selection with localStorage
  initializePlanSelection();
  
  // Initialize sticky CTA
  initializeStickyClA();
  
  // Watch scroll for sticky CTA visibility
  window.addEventListener('scroll', handleStickyCTAScroll);
}

/**
 * Initialize plan card selection with localStorage persistence
 */
function initializePlanSelection() {
  const serviceCards = document.querySelectorAll('.service-card');
  
  // Load previously selected plan
  const savedPlanType = localStorage.getItem('webpot_selected_plan_type');
  const savedPlanName = localStorage.getItem('webpot_selected_plan_name');
  
  if (savedPlanType && savedPlanName) {
    // Restore selection on page load
    const savedCard = document.querySelector(
      '.pricing-section[data-type="' + savedPlanType + '"] .service-card[data-plan="' + savedPlanName + '"]'
    );
    if (savedCard) {
      applyPlanSelection(savedCard, savedPlanType, savedPlanName);
    }
  }
  
  // Add click handlers to plan cards
  serviceCards.forEach(card => {
    card.addEventListener('click', function() {
      const planName = this.dataset.plan;
      const planSection = this.closest('.pricing-section');
      const planType = planSection ? planSection.dataset.type : 'startup';
      
      // Clear previous selections in this section
      if (planSection) {
        planSection.querySelectorAll('.service-card').forEach(c => {
          c.classList.remove('selected');
        });
      }
      
      // Apply new selection
      applyPlanSelection(this, planType, planName);
    });
  });
}

/**
 * Apply plan selection styling and save to localStorage
 */
function applyPlanSelection(card, planType, planName) {
  card.classList.add('selected');
  
  // Save selection to localStorage
  localStorage.setItem('webpot_selected_plan_type', planType);
  localStorage.setItem('webpot_selected_plan_name', planName);
  
  // Scroll card into view with smooth animation
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Update pricing display (Monthly vs One-time)
 */
function updatePricingDisplay(billingType) {
  const priceElements = document.querySelectorAll('.price-display');
  const billingTexts = document.querySelectorAll('.billing-text');
  
  priceElements.forEach(element => {
    const amount = element.querySelector('.amount');
    if (!amount) return;
    
    const currentPrice = parseFloat(amount.textContent.replace('₹', '').replace(',', ''));
    
    if (billingType === 'onetime') {
      // One-time pricing is 2x the monthly price (simple calculation)
      const onetimePrice = (currentPrice * 12).toLocaleString('en-IN');
      amount.textContent = '₹' + onetimePrice;
    } else {
      // Reset to monthly pricing
      const monthlyPrice = (currentPrice / 12).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      amount.textContent = '₹' + monthlyPrice;
    }
  });
  
  // Update billing text
  billingTexts.forEach(text => {
    text.textContent = billingType === 'monthly' ? '/month' : '/year';
  });
}

/**
 * Switch between Startup and Business plan types
 */
function switchPricingPlan(planType) {
  const pricingSections = document.querySelectorAll('.pricing-section');
  
  pricingSections.forEach(section => {
    const sectionType = section.dataset.type;
    if (sectionType === planType) {
      section.style.display = 'grid';
      section.style.animation = 'fadeInUp 0.6s ease';
    } else {
      section.style.display = 'none';
    }
  });
}

/**
 * Initialize sticky CTA banner
 */
function initializeStickyClA() {
  const stickyCTA = document.getElementById('stickyCTA');
  if (!stickyCTA) return;
  
  // Show sticky CTA after user scrolls down
  const servicesSection = document.getElementById('services');
  if (servicesSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Show CTA when services section is not fully visible
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          stickyCTA.style.display = 'block';
          stickyCTA.classList.remove('hidden');
        } else if (entry.boundingClientRect.top > 200) {
          stickyCTA.style.display = 'none';
          stickyCTA.classList.add('hidden');
        }
      });
    }, { threshold: 0 });
    
    observer.observe(servicesSection);
  }
}

/**
 * Handle sticky CTA scroll visibility
 */
function handleStickyCTAScroll() {
  const stickyCTA = document.getElementById('stickyCTA');
  const servicesSection = document.getElementById('services');
  
  if (!stickyCTA || !servicesSection) return;
  
  const sectionRect = servicesSection.getBoundingClientRect();
  
  // Hide CTA when pricing section is in view or user is above it
  if (sectionRect.top >= 0 || sectionRect.bottom >= window.innerHeight) {
    stickyCTA.style.display = 'none';
  } else {
    stickyCTA.style.display = 'block';
  }
}

/**
 * Scroll to pricing section
 */
function scrollToPricing() {
  const servicesSection = document.getElementById('services');
  if (servicesSection) {
    servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}