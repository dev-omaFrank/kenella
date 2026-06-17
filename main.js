/* ============================================
   KENELLA HEALTH — EYE COMFORT COMBO SCRIPTS
   ============================================ */

// Phone validation regex for Nigerian numbers
const PHONE_REGEX = /^(?:\+?234|0)[789][01]\d{8}$/;

function validatePhone(phone) {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
        return PHONE_REGEX.test(phone);
    }
    if ((digitsOnly.length === 13 || digitsOnly.length === 14) && digitsOnly.startsWith('234')) {
        return PHONE_REGEX.test(phone);
    }
    return false;
}

function formatPhoneError(phone) {
    const digitsOnly = (phone || '').replace(/\D/g, '');
    
    if (!phone || digitsOnly.length === 0) {
        return "Please enter your phone number";
    }
    if (digitsOnly.length < 10) {
        return "Phone number is too short. Must be 11 digits (e.g. 08012345678)";
    }
    if (digitsOnly.length > 14) {
        return "Phone number is too long.";
    }
    if (!digitsOnly.startsWith('0') && !digitsOnly.startsWith('234')) {
        return "Phone must start with 0 or +234 (e.g. 08012345678)";
    }
    return "Please enter a valid Nigerian phone number";
}

// Email validation
function validateEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Countdown Timer
function updateCountdown() {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let diff = endOfDay - now;
    
    if (diff < 0) {
        endOfDay.setDate(endOfDay.getDate() + 1);
        diff = endOfDay - now;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        countdownEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Bundle Selection
const bundles = {
    1: { name: 'Quantum Glasses Only — ₦100,000', price: 100000 },
    2: { name: 'Nano Ionic Eye Moistener Only — ₦50,000', price: 50000 },
    3: { name: 'Complete 5-in-1 Combo — ₦160,000', price: 160000 },
    4: { name: 'Therapeutic Eye Massager Only — ₦50,000', price: 50000 }
};

function selectBundle(bundleId) {
    const bundle = bundles[bundleId];
    const bundleNameEl = document.getElementById('bundleName');
    const bundleSelect = document.getElementById('bundle');
    
    if (bundleNameEl) bundleNameEl.textContent = bundle.name;
    if (bundleSelect) bundleSelect.value = bundleId;
    
    document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' });
    
    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_ids: ['kenella_bundle_' + bundleId],
            content_type: 'product',
            value: bundle.price,
            currency: 'NGN'
        });
    }
}

// Show field error
function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const parent = input.closest('.form-group') || input.parentElement;
    const existingError = parent.querySelector('.field-error');
    
    if (existingError) existingError.remove();
    
    input.classList.add('input-error');
    input.classList.remove('input-success');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    parent.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const parent = input.closest('.form-group') || input.parentElement;
    input.classList.remove('input-error');
    input.classList.add('input-success');
    
    const existingError = parent.querySelector('.field-error');
    if (existingError) existingError.remove();
}

// Clear all errors
function clearAllErrors() {
    ['fullName', 'email', 'phone', 'address', 'bundle', 'eyeCondition'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.classList.remove('input-error');
            input.classList.remove('input-success');
            const parent = input.closest('.form-group') || input.parentElement;
            const existingError = parent.querySelector('.field-error');
            if (existingError) existingError.remove();
        }
    });
}

// MONEY CONSENT LOGIC
let pendingFormData = null;

function showConsentModal(bundleId) {
    const bundle = bundles[bundleId];
    const amountEl = document.getElementById('consentAmount');
    if (amountEl) amountEl.textContent = bundle.price.toLocaleString();
    
    const modal = document.getElementById('consentModal');
    if (modal) modal.classList.add('active');
}

function hideConsentModal() {
    const modal = document.getElementById('consentModal');
    if (modal) modal.classList.remove('active');
}

function confirmConsent(hasMoney) {
    if (hasMoney) {
        hideConsentModal();
        processOrder(pendingFormData);
    } else {
        const modalContent = document.querySelector('#consentModal .modal-content');
        
        modalContent.innerHTML = `
            <div class="decline-message">
                <div class="modal-icon">😔</div>
                <h4>No Problem!</h4>
                <p>We understand. Come back when you're ready to order. Our promo prices are available for a limited time only.</p>
                <button type="button" class="btn btn-outline" onclick="closeDeclineMessage()">
                    Close
                </button>
            </div>
        `;
    }
}

function closeDeclineMessage() {
    hideConsentModal();
    setTimeout(() => {
        location.reload();
    }, 300);
}

// Process order via Web3Forms — redirects to thank-you.html on success
async function processOrder(data) {
    const bundle = bundles[data.bundle];
    
    // Track with Meta Pixel
    if (typeof fbq !== 'undefined') {
        try {
            fbq('track', 'Purchase', {
                content_ids: ['kenella_bundle_' + data.bundle],
                content_type: 'product',
                value: bundle.price,
                currency: 'NGN'
            });
        } catch (err) {
            console.log('Pixel tracking skipped');
        }
    }
    
    // Build Web3Forms data
    const formData = new FormData();
    formData.append("access_key", "d7978001-e9ca-4117-8d8a-69b85f243447");
    formData.append("name", data.fullName);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("address", data.address);
    formData.append("bundle", bundle.name);
    formData.append("price", "₦" + bundle.price.toLocaleString());
    formData.append("eye_condition", data.eyeCondition);
    formData.append("notes", data.notes || "None");
    formData.append("subject", "NEW KENELLA ORDER — " + bundle.name);
    
    // Show loading state on button
    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.innerHTML = '<span class="btn-text">SENDING ORDER...</span>';
        submitBtn.disabled = true;
    }
    
    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // ✅ REDIRECT TO THANK YOU PAGE
            window.location.href = 'thank-you.html';
            
        } else {
            alert("Failed to send order. Please email us directly at orders@kenellahealth.com");
            if (submitBtn) {
                submitBtn.innerHTML = '<span class="btn-text">PLACE ORDER NOW</span><span class="btn-sub">We\'ll Email to Confirm Before Delivery</span>';
                submitBtn.disabled = false;
            }
        }
        
    } catch (error) {
        console.error('Order submission failed:', error);
        alert("Network error. Please try again or email us: orders@kenellahealth.com");
        if (submitBtn) {
            submitBtn.innerHTML = '<span class="btn-text">PLACE ORDER NOW</span><span class="btn-sub">We\'ll Email to Confirm Before Delivery</span>';
            submitBtn.disabled = false;
        }
    }
}

// Order Form Handler
function handleOrder(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    const form = document.getElementById('orderForm');
    if (!form) return false;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    clearAllErrors();
    
    let hasError = false;
    let firstErrorField = null;
    
    // Validate full name
    if (!data.fullName || data.fullName.trim().length < 3) {
        showFieldError('fullName', 'Please enter your full name (at least 3 characters)');
        if (!firstErrorField) firstErrorField = 'fullName';
        hasError = true;
    }
    
    // Validate email
    if (!data.email || !validateEmail(data.email)) {
        showFieldError('email', 'Please enter a valid email address');
        if (!firstErrorField) firstErrorField = 'email';
        hasError = true;
    }
    
    // Validate phone
    if (!data.phone || !validatePhone(data.phone)) {
        showFieldError('phone', formatPhoneError(data.phone));
        if (!firstErrorField) firstErrorField = 'phone';
        hasError = true;
    }
    
    // Validate address
    if (!data.address || data.address.trim().length < 10) {
        showFieldError('address', 'Please enter a complete delivery address (at least 10 characters)');
        if (!firstErrorField) firstErrorField = 'address';
        hasError = true;
    }
    
    // Validate bundle
    if (!data.bundle) {
        showFieldError('bundle', 'Please select a package');
        if (!firstErrorField) firstErrorField = 'bundle';
        hasError = true;
    }
    
    // Validate eye condition
    if (!data.eyeCondition) {
        showFieldError('eyeCondition', 'Please select your primary eye concern');
        if (!firstErrorField) firstErrorField = 'eyeCondition';
        hasError = true;
    }
    
    // If validation fails, stop here
    if (hasError) {
        if (firstErrorField) {
            const errorInput = document.getElementById(firstErrorField);
            if (errorInput) {
                setTimeout(() => {
                    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorInput.focus();
                }, 100);
            }
        }
        return false;
    }
    
    // ALL VALID: Store data and show consent modal
    pendingFormData = data;
    showConsentModal(data.bundle);
    
    return false;
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('active');
}

// FAQ Toggle
function toggleFaq(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');
    
    document.querySelectorAll('.faq-item').forEach(faq => faq.classList.remove('active'));
    
    if (!isActive) item.classList.add('active');
}

// Sticky CTA
window.addEventListener('scroll', function() {
    const stickyCta = document.getElementById('stickyCta');
    const orderSection = document.getElementById('order');
    if (!stickyCta || !orderSection) return;
    
    const orderRect = orderSection.getBoundingClientRect();
    const scrollY = window.scrollY;
    
    if (scrollY > 600 && orderRect.top > window.innerHeight) {
        stickyCta.style.display = 'block';
    } else {
        stickyCta.style.display = 'none';
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// Scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

// FAKE PURCHASE POPUP
const fakeNames = [
    { name: 'Chinedu', location: 'Lagos', item: 'Complete Combo' },
    { name: 'Amina', location: 'Kano', item: 'Complete Combo' },
    { name: 'Emeka', location: 'Enugu', item: 'Quantum Glasses' },
    { name: 'Fatima', location: 'Abuja', item: 'Complete Combo' },
    { name: 'Ibrahim', location: 'Kaduna', item: 'Nano Ionic Eye Moistener + Plan' },
    { name: 'Ngozi', location: 'PH', item: 'Complete Combo' },
    { name: 'Yusuf', location: 'Ibadan', item: 'Quantum Glasses' },
    { name: 'Blessing', location: 'Lagos', item: 'Complete Combo' },
    { name: 'Abdul', location: 'Kano', item: 'Nano Ionic Eye Moistener + Plan' },
    { name: 'Chioma', location: 'Owerri', item: 'Complete Combo' }
];

const fakeTimes = ['just now', '2 mins ago', '5 mins ago', '8 mins ago', '12 mins ago', '15 mins ago'];

function showFakePopup() {
    const popup = document.getElementById('fakePopup');
    const nameEl = document.getElementById('fakeName');
    const locationEl = document.getElementById('fakeLocation');
    const itemEl = document.getElementById('fakeItem');
    const timeEl = document.getElementById('fakeTime');
    
    if (!popup || !nameEl || !locationEl || !itemEl || !timeEl) return;
    
    const randomPerson = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const randomTime = fakeTimes[Math.floor(Math.random() * fakeTimes.length)];
    
    nameEl.textContent = randomPerson.name;
    locationEl.textContent = randomPerson.location;
    itemEl.textContent = randomPerson.item;
    timeEl.textContent = randomTime;
    
    popup.classList.add('active');
    
    setTimeout(() => {
        popup.classList.remove('active');
    }, 5000);
}

function startFakePopups() {
    const randomDelay = Math.floor(Math.random() * 10000) + 10000;
    setTimeout(() => {
        showFakePopup();
        startFakePopups();
    }, randomDelay);
}

document.addEventListener('DOMContentLoaded', function() {
    // Form handler
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrder);
    }
    
    // Bundle select listener
    const bundleSelect = document.getElementById('bundle');
    if (bundleSelect) {
        bundleSelect.addEventListener('change', function() {
            const bundleId = this.value;
            const bundle = bundles[bundleId];
            const bundleNameEl = document.getElementById('bundleName');
            if (bundleNameEl && bundle) bundleNameEl.textContent = bundle.name;
        });
    }
    
    // Modal backdrop clicks
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
    
    const consentModal = document.getElementById('consentModal');
    if (consentModal) {
        consentModal.addEventListener('click', function(e) {
            if (e.target === consentModal) {
                // Optional: allow clicking outside to close
            }
        });
    }
    
    // Phone input: numbers only + live validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9+]/g, '');
            const parent = this.closest('.form-group') || this.parentElement;
            const existingError = parent.querySelector('.field-error');
            if (existingError) {
                this.classList.remove('input-error');
                existingError.remove();
            }
        });
        
        phoneInput.addEventListener('blur', function() {
            if (this.value && !validatePhone(this.value)) {
                showFieldError('phone', formatPhoneError(this.value));
            } else if (this.value && validatePhone(this.value)) {
                clearFieldError('phone');
            }
        });
    }
    
    // Email live validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const parent = this.closest('.form-group') || this.parentElement;
            const existingError = parent.querySelector('.field-error');
            if (existingError && validateEmail(this.value)) {
                this.classList.remove('input-error');
                existingError.remove();
            }
        });
        
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showFieldError('email', 'Please enter a valid email address');
            } else if (this.value && validateEmail(this.value)) {
                clearFieldError('email');
            }
        });
    }
    
    // Name live validation
    const nameInput = document.getElementById('fullName');
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            const parent = this.closest('.form-group') || this.parentElement;
            const existingError = parent.querySelector('.field-error');
            if (existingError && this.value.trim().length >= 3) {
                this.classList.remove('input-error');
                existingError.remove();
            }
        });
    }
    
    // Address live validation
    const addressInput = document.getElementById('address');
    if (addressInput) {
        addressInput.addEventListener('input', function() {
            const parent = this.closest('.form-group') || this.parentElement;
            const existingError = parent.querySelector('.field-error');
            if (existingError && this.value.trim().length >= 10) {
                this.classList.remove('input-error');
                existingError.remove();
            }
        });
    }
    
    // Eye condition select
    const eyeSelect = document.getElementById('eyeCondition');
    if (eyeSelect) {
        eyeSelect.addEventListener('change', function() {
            if (this.value) clearFieldError('eyeCondition');
        });
    }
    
    // Scroll animations
    document.querySelectorAll('.problem-card, .cause-card, .combo-card, .phase-card, .pricing-card, .testimonial-card, .screenshot-card').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
        observer.observe(el);
    });
    
    // Start fake popups after 5 seconds
    setTimeout(startFakePopups, 5000);
});