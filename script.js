// ===== PRELOADER =====
const preloader = document.getElementById('preloader');

function hidePreloader() {
    if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
    }
}

// Hide preloader as soon as DOM is ready (don't wait for images)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(hidePreloader, 300);
});

// Fallback: force hide after 2 seconds no matter what
setTimeout(hidePreloader, 2000);

// ===== STICKY NAVBAR =====
const stickyNav = document.getElementById('stickyNav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 300) {
        stickyNav.classList.add('show');
    } else {
        stickyNav.classList.remove('show');
    }

    lastScroll = currentScroll;
});

// ===== MOBILE MENU TOGGLE =====
// Handle all mobile toggle buttons (main nav + sticky nav)
document.querySelectorAll('.mobile-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        // Find the sibling nav-menu within the same nav-container
        const navContainer = toggle.closest('.nav-container');
        const menu = navContainer ? navContainer.querySelector('.nav-menu') : document.getElementById('navMenu');
        if (menu) {
            menu.classList.toggle('open');
            // Close other menus
            document.querySelectorAll('.nav-menu.open').forEach(m => {
                if (m !== menu) m.classList.remove('open');
            });
        }
    });
});

// Mobile dropdown toggle
document.querySelectorAll('.has-dropdown > a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            // Close sibling dropdowns
            const parent = link.parentElement;
            const siblings = parent.parentElement.querySelectorAll('.has-dropdown');
            siblings.forEach(s => {
                if (s !== parent) s.classList.remove('open');
            });
            parent.classList.toggle('open');
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const isNavClick = e.target.closest('.navbar');
        if (!isNavClick) {
            document.querySelectorAll('.nav-menu.open').forEach(m => m.classList.remove('open'));
        }
    }
});

// Close mobile menu on window resize to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelectorAll('.nav-menu.open').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.has-dropdown.open').forEach(d => d.classList.remove('open'));
    }
});

// ===== SCROLL ANIMATIONS =====
const animateElements = document.querySelectorAll('.animate-on-scroll');

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

animateElements.forEach(el => observer.observe(el));

// ===== TESTIMONIAL SLIDER =====
const testimonialCards = document.querySelectorAll('.testimonial-card');
const dots = document.querySelectorAll('.dot');
let currentSlide = 0;
let autoSlideInterval;

if (testimonialCards.length > 0) {
    function showSlide(index) {
        testimonialCards.forEach(card => card.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        testimonialCards[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            showSlide(index);
            resetAutoSlide();
        });
    });

    function autoSlide() {
        const next = (currentSlide + 1) % testimonialCards.length;
        showSlide(next);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(autoSlide, 5000);
    }

    autoSlideInterval = setInterval(autoSlide, 5000);

    // Touch swipe support for testimonials
    let touchStartX = 0;
    let touchEndX = 0;
    const slider = document.getElementById('testimonialSlider');

    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    // Swipe left - next slide
                    showSlide((currentSlide + 1) % testimonialCards.length);
                } else {
                    // Swipe right - prev slide
                    showSlide((currentSlide - 1 + testimonialCards.length) % testimonialCards.length);
                }
                resetAutoSlide();
            }
        }, { passive: true });
    }
}

// ===== ACCORDION =====
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const isActive = item.classList.contains('active');

        // Close all
        document.querySelectorAll('.accordion-item').forEach(i => {
            i.classList.remove('active');
        });

        // Open clicked (if it wasn't already open)
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// ===== BACK TO TOP =====
const goToTop = document.getElementById('goToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        goToTop.classList.add('show');
    } else {
        goToTop.classList.remove('show');
    }
});

goToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== COUNTER ANIMATION (About page) =====
const statNumbers = document.querySelectorAll('.stat-number[data-target]');

if (statNumbers.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                let current = 0;
                const increment = Math.ceil(target / 80);
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = current.toLocaleString();
                }, 20);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));
}

// ===== PREFETCH PREDICTOR DATA =====
// Wait until the page is FULLY loaded (images, fonts, everything),
// then prefetch CSV in the background so it doesn't compete with page assets.
window.addEventListener("load", function() {
  // Extra 2s delay so the page feels snappy first
  setTimeout(function prefetchPredictorData() {
    var CACHE_KEY = "cp_cached_data";
    var CACHE_VER = "v1";

    // Already cached? Skip entirely.
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && parsed._v === CACHE_VER) return;
      }
    } catch (e) { /* ignore */ }

    // CSV parser (same logic as predictor-script)
    function parseCSVLine(line) {
      var fields = [], current = "", inQuotes = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (inQuotes) { if (ch === '"') inQuotes = false; else current += ch; }
        else if (ch === '"') inQuotes = true;
        else if (ch === ',') { fields.push(current.trim()); current = ""; }
        else current += ch;
      }
      fields.push(current.trim());
      return fields;
    }

    function processCSV(csvText) {
      var lines = csvText.split("\n");
      var jeeAdvanced = [], jeeMain = [];
      for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var f = parseCSVLine(line);
        if (f.length < 8) continue;
        if (f[0] !== "5" || f[3] !== "AI" || f[5] !== "Gender-Neutral") continue;
        var closingRank = parseInt(f[7]);
        if (isNaN(closingRank)) continue;
        var program = f[2];
        var branch = program.indexOf("(") !== -1 ? program.substring(0, program.indexOf("(")).trim() : program.trim();
        var entry = { n: f[1], b: branch, r: closingRank, c: f[4] };
        if (f[1].indexOf("Indian Institute") !== -1 && f[1].indexOf("of Technology") !== -1)
          jeeAdvanced.push(entry);
        else
          jeeMain.push(entry);
      }
      return { jeeAdvanced: jeeAdvanced, jeeMain: jeeMain };
    }

    Promise.all([
      fetch("data/cutoffs.json").then(function(r) { return r.ok ? r.json() : Promise.reject(); }),
      fetch("data/josaa_all_rounds.csv").then(function(r) { return r.ok ? r.text() : Promise.reject(); })
    ]).then(function(results) {
      var json = results[0], csvText = results[1];
      var csv = processCSV(csvText);
      var toCache = { _v: CACHE_VER, exams: json.exams, colleges: { adv: csv.jeeAdvanced, main: csv.jeeMain } };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(toCache)); } catch (e) { /* quota exceeded — skip */ }
    }).catch(function() { /* silent fail on non-predictor pages */ });
  }, 2000);
});

// ===== CONTACT FORM (Contact page) =====
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
    });
}

// ===== POPUP LEAD CAPTURE FORM =====
(function () {
    // If user already submitted the form, do nothing
    if (localStorage.getItem('formFilled') === 'true') return;

    // Popup attempt tracking
    var popupCloseCount = 0;
    var popupTimers = [10000, 30000, 120000]; // 10s, 30s, 2min
    var popupOverlay = null;

    // Inject CSS
    var popupStyle = document.createElement('style');
    popupStyle.textContent = '' +
        '#mag-popup-overlay {' +
        '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;' +
        '  background: rgba(0, 0, 0, 0.6);' +
        '  z-index: 100000;' +
        '  display: flex; align-items: center; justify-content: center;' +
        '  opacity: 0; transition: opacity 0.4s ease;' +
        '  pointer-events: none;' +
        '}' +
        '#mag-popup-overlay.mag-popup-visible {' +
        '  opacity: 1; pointer-events: auto;' +
        '}' +
        '#mag-popup-card {' +
        '  background: #fff; border-radius: 16px; padding: 36px 32px 28px;' +
        '  max-width: 420px; width: 90%; position: relative;' +
        '  box-shadow: 0 20px 60px rgba(0,0,0,0.3);' +
        '  transform: translateY(30px); transition: transform 0.4s ease;' +
        '  font-family: "Inter", "Poppins", sans-serif;' +
        '}' +
        '#mag-popup-overlay.mag-popup-visible #mag-popup-card {' +
        '  transform: translateY(0);' +
        '}' +
        '#mag-popup-close {' +
        '  position: absolute; top: 12px; right: 16px;' +
        '  background: none; border: none; font-size: 24px;' +
        '  color: #888; cursor: pointer; line-height: 1;' +
        '  width: 32px; height: 32px; display: flex;' +
        '  align-items: center; justify-content: center;' +
        '  border-radius: 50%; transition: background 0.2s, color 0.2s;' +
        '}' +
        '#mag-popup-close:hover { background: #f0f0f0; color: #333; }' +
        '#mag-popup-card h2 {' +
        '  margin: 0 0 6px; font-size: 22px; font-weight: 700;' +
        '  color: #1a1a2e; text-align: center;' +
        '}' +
        '#mag-popup-card .mag-popup-sub {' +
        '  margin: 0 0 22px; font-size: 14px; color: #666;' +
        '  text-align: center; line-height: 1.5;' +
        '}' +
        '.mag-popup-field { margin-bottom: 14px; }' +
        '.mag-popup-field label {' +
        '  display: block; font-size: 13px; font-weight: 600;' +
        '  color: #333; margin-bottom: 5px;' +
        '}' +
        '.mag-popup-field input,' +
        '.mag-popup-field select {' +
        '  width: 100%; padding: 10px 12px; font-size: 14px;' +
        '  border: 1.5px solid #ddd; border-radius: 8px;' +
        '  outline: none; transition: border-color 0.2s;' +
        '  font-family: inherit; background: #fff;' +
        '  box-sizing: border-box; -webkit-appearance: none;' +
        '}' +
        '.mag-popup-field input:focus,' +
        '.mag-popup-field select:focus { border-color: #0ea960; }' +
        '#mag-popup-submit {' +
        '  width: 100%; padding: 12px; font-size: 15px;' +
        '  font-weight: 600; color: #fff; background: #0ea960;' +
        '  border: none; border-radius: 8px; cursor: pointer;' +
        '  margin-top: 6px; transition: background 0.2s;' +
        '  font-family: inherit;' +
        '}' +
        '#mag-popup-submit:hover { background: #0c9453; }' +
        '#mag-popup-thankyou {' +
        '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;' +
        '  background: rgba(0,0,0,0.6); z-index: 100001;' +
        '  display: flex; align-items: center; justify-content: center;' +
        '  opacity: 0; transition: opacity 0.4s ease;' +
        '  pointer-events: none;' +
        '}' +
        '#mag-popup-thankyou.mag-popup-visible {' +
        '  opacity: 1; pointer-events: auto;' +
        '}' +
        '#mag-popup-thankyou-card {' +
        '  background: #fff; border-radius: 16px; padding: 40px 32px;' +
        '  max-width: 380px; width: 90%; text-align: center;' +
        '  box-shadow: 0 20px 60px rgba(0,0,0,0.3);' +
        '  font-family: "Inter", "Poppins", sans-serif;' +
        '}' +
        '#mag-popup-thankyou-card .mag-ty-icon {' +
        '  font-size: 48px; margin-bottom: 12px;' +
        '}' +
        '#mag-popup-thankyou-card h3 {' +
        '  margin: 0 0 8px; font-size: 20px; color: #0ea960; font-weight: 700;' +
        '}' +
        '#mag-popup-thankyou-card p {' +
        '  margin: 0; font-size: 14px; color: #555; line-height: 1.5;' +
        '}' +
        '@media (max-width: 480px) {' +
        '  #mag-popup-card { padding: 28px 20px 22px; }' +
        '  #mag-popup-card h2 { font-size: 19px; }' +
        '}';
    document.head.appendChild(popupStyle);

    // Inject HTML
    var popupHTML = '' +
        '<div id="mag-popup-overlay">' +
        '  <div id="mag-popup-card">' +
        '    <button id="mag-popup-close" type="button" aria-label="Close">&times;</button>' +
        '    <h2>Get Free Admission Guidance</h2>' +
        '    <p class="mag-popup-sub">Fill in your details and our counselor will contact you</p>' +
        '    <form id="mag-popup-form" novalidate>' +
        '      <div class="mag-popup-field">' +
        '        <label for="mag-popup-name">Name</label>' +
        '        <input type="text" id="mag-popup-name" placeholder="Your full name" required>' +
        '      </div>' +
        '      <div class="mag-popup-field">' +
        '        <label for="mag-popup-phone">Phone Number</label>' +
        '        <input type="tel" id="mag-popup-phone" placeholder="10-digit mobile number" required>' +
        '      </div>' +
        '      <div class="mag-popup-field">' +
        '        <label for="mag-popup-email">Email</label>' +
        '        <input type="email" id="mag-popup-email" placeholder="you@example.com">' +
        '      </div>' +
        '      <div class="mag-popup-field">' +
        '        <label for="mag-popup-course">Course Interested In</label>' +
        '        <select id="mag-popup-course">' +
        '          <option value="">Select a course</option>' +
        '          <option value="B.Tech / B.E.">B.Tech / B.E.</option>' +
        '          <option value="M.Tech / M.E.">M.Tech / M.E.</option>' +
        '          <option value="BBA">BBA</option>' +
        '          <option value="MBA">MBA</option>' +
        '          <option value="B.Sc">B.Sc</option>' +
        '          <option value="M.Sc">M.Sc</option>' +
        '          <option value="BCA">BCA</option>' +
        '          <option value="MCA">MCA</option>' +
        '          <option value="B.Com">B.Com</option>' +
        '          <option value="Other">Other</option>' +
        '        </select>' +
        '      </div>' +
        '      <button type="submit" id="mag-popup-submit">Submit</button>' +
        '    </form>' +
        '  </div>' +
        '</div>' +
        '<div id="mag-popup-thankyou">' +
        '  <div id="mag-popup-thankyou-card">' +
        '    <div class="mag-ty-icon">&#10004;&#65039;</div>' +
        '    <h3>Thank you!</h3>' +
        '    <p>We\'ll contact you soon.</p>' +
        '  </div>' +
        '</div>';

    var popupContainer = document.createElement('div');
    popupContainer.innerHTML = popupHTML;
    document.body.appendChild(popupContainer);

    popupOverlay = document.getElementById('mag-popup-overlay');
    var popupCloseBtn = document.getElementById('mag-popup-close');
    var popupForm = document.getElementById('mag-popup-form');
    var thankYouOverlay = document.getElementById('mag-popup-thankyou');

    function showPopup() {
        // Check again in case form was filled between timer set and fire
        if (localStorage.getItem('formFilled') === 'true') return;
        popupOverlay.classList.add('mag-popup-visible');
    }

    function hidePopup() {
        popupOverlay.classList.remove('mag-popup-visible');
    }

    function schedulePopup(index) {
        if (index >= popupTimers.length) return; // no more attempts
        if (localStorage.getItem('formFilled') === 'true') return;
        setTimeout(function () {
            showPopup();
        }, popupTimers[index]);
    }

    // Close button handler
    popupCloseBtn.addEventListener('click', function () {
        hidePopup();
        popupCloseCount++;
        schedulePopup(popupCloseCount);
    });

    // Close on overlay click (outside the card)
    popupOverlay.addEventListener('click', function (e) {
        if (e.target === popupOverlay) {
            hidePopup();
            popupCloseCount++;
            schedulePopup(popupCloseCount);
        }
    });

    // Form submit handler
    popupForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var name = document.getElementById('mag-popup-name').value.trim();
        var phone = document.getElementById('mag-popup-phone').value.trim();
        var email = document.getElementById('mag-popup-email').value.trim();
        var course = document.getElementById('mag-popup-course').value;

        if (!name) { document.getElementById('mag-popup-name').style.borderColor = '#ef4444'; return; }
        document.getElementById('mag-popup-name').style.borderColor = '';
        if (!phone || !/^\d{10}$/.test(phone)) { document.getElementById('mag-popup-phone').style.borderColor = '#ef4444'; return; }
        document.getElementById('mag-popup-phone').style.borderColor = '';

        var submitBtn = document.getElementById('mag-popup-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        fetch('https://myadmissionguide.vercel.app/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                phone: phone,
                email: email,
                course: course,
                source: 'popup'
            })
        })
        .then(function () {
            localStorage.setItem('formFilled', 'true');
            hidePopup();
            thankYouOverlay.classList.add('mag-popup-visible');
            setTimeout(function () {
                thankYouOverlay.classList.remove('mag-popup-visible');
            }, 3000);
        })
        .catch(function () {
            // Save locally as fallback and proceed
            localStorage.setItem('formFilled', 'true');
            hidePopup();
            thankYouOverlay.classList.add('mag-popup-visible');
            setTimeout(function () {
                thankYouOverlay.classList.remove('mag-popup-visible');
            }, 3000);
        })
        .finally(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        });
    });

    // Start the first timer (10 seconds)
    schedulePopup(0);
})();
