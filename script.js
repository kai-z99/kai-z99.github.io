// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {
    // Sticky header
    const header = document.querySelector('header');
    const heroSection = document.querySelector('#hero');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
            header.style.backgroundColor = 'rgba(34, 34, 34, 0.95)';
        } else {
            header.classList.remove('scrolled');
            header.style.backgroundColor = 'var(--black)';
        }
    });
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        const headerHeight = header.offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      });
    });
    
    // ================================================
    // Form Handling & Notifications (Unchanged)
    // ================================================
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (name === '' || email === '' || message === '') {
                showNotification('Please fill out all fields', 'error');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Simulate sending data
            console.log('Form Submitted:', { name, email, message });
            showNotification('Your message has been sent successfully!', 'success');
            
            contactForm.reset();
        });
    }
    
    // Notification function
    function showNotification(message, type) {
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            // Basic styles for positioning
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.bottom = '20px';
            notificationContainer.style.right = '20px';
            notificationContainer.style.zIndex = '1000';
            document.body.appendChild(notificationContainer);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`; // Use classes for styling if defined in CSS
        notification.textContent = message;
        
        // Apply basic inline styles (fallback if CSS classes aren't defined)
        notification.style.backgroundColor = type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.marginTop = '10px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.opacity = '0'; // Start hidden for transition
        notification.style.transition = 'opacity 0.3s ease-in-out';
        
        notificationContainer.appendChild(notification);
        
        // Trigger fade in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
        });


        setTimeout(() => {
            notification.style.opacity = '0';
            notification.addEventListener('transitionend', () => {
                 if (notification.parentNode === notificationContainer) { // Check if still attached
                    notificationContainer.removeChild(notification);
                 }
                 // Optional: remove container if empty
                 // if (notificationContainer.children.length === 0) {
                 //     notificationContainer.remove();
                 // }
            }, { once: true }); // Ensure listener runs only once
        }, 5000);
    }
    
    // ================================================
    // Reveal Animations (Unchanged)
    // ================================================
    const revealSections = document.querySelectorAll('section');
    
    function checkScroll() {
        const triggerBottom = window.innerHeight * 1.0; 

        revealSections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;

            // Reveal if top edge is above the trigger line
            if (sectionTop < triggerBottom) {
                section.classList.add('revealed'); // Add class for CSS transition
            } else {
                 section.classList.remove('revealed'); // Remove class when scrolled out
            }
        });
    }
    
    // Set initial state using CSS for better performance
    // Add this to your CSS:
    /*
    section {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    section.revealed {
        opacity: 1;
        transform: translateY(0);
    }
    */
    
    // Check scroll position on load and scroll
    // Debounce scroll handler for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(checkScroll, 50); // Adjust debounce time as needed
    });
    // Initial check in case sections are already in view on load
    checkScroll();


    // ================================================
    // Project Card Hover Effect (Unchanged)
    // ================================================
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        // Using CSS for hover is generally preferred for performance,
        // but this JS approach works too.
        card.style.transition = card.style.transition ? card.style.transition + ', border-left-width 0.2s ease' : 'border-left-width 0.2s ease'; // Ensure transition includes border-width

        card.addEventListener('mouseenter', () => {
            card.style.borderLeftWidth = '8px';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.borderLeftWidth = '4px'; // Assuming initial width is 4px
        });
    });
    
    // ================================================
    // Update Copyright Year (Unchanged)
    // ================================================
    const footerYear = document.querySelector('footer p'); // More specific selector might be needed
    if (footerYear && footerYear.textContent.includes('©')) { // Check if it looks like a copyright notice
        const currentYear = new Date().getFullYear();
        // Replace any 4-digit year with the current year
        footerYear.textContent = footerYear.textContent.replace(/\d{4}/, currentYear);
    }

    // --- Add Flowing Cubes Logic ---
    const cubeFlowContainer = document.querySelector('.cube-flow-container');
    const numberOfCubes = 30; // Adjust how many cubes you want

    function createFlowingCubes() {
        if (!cubeFlowContainer) return;

        const faceClasses = ['front', 'back', 'left', 'right', 'top', 'bottom'];

        for (let i = 0; i < numberOfCubes; i++) {
            const cube = document.createElement('div');
            cube.classList.add('flowing-cube');

            // --- Create inner rotator ---
            const rotator = document.createElement('div');
            rotator.classList.add('cube-rotator');
            // --- Append rotator to cube ---
            cube.appendChild(rotator);

            // --- Add faces inside the rotator ---
            faceClasses.forEach(faceClass => {
                const face = document.createElement('div');
                face.classList.add('face', faceClass);
                // --- Append faces to rotator ---
                rotator.appendChild(face);
            });
            // --- End of adding faces ---

            // Randomize vertical position for the outer cube
            const minTopPercent = 5;  // Minimum top padding %
            const maxTopPercent = 85; // Maximum top position % (leaving space at bottom)
            const randomTop = Math.random() * (maxTopPercent - minTopPercent) + minTopPercent; // New range
            cube.style.top = `${randomTop}%`;

            // Randomize animation durations
            const randomFlowDuration = Math.random() * 15 + 10; // 10s to 25s
            const randomRotateDuration = Math.random() * 20 + 15; // 15s to 35s
            
            // Apply flow duration/delay to the OUTER cube
            cube.style.animationDuration = `${randomFlowDuration}s`;
            const randomFlowDelay = Math.random() * -randomFlowDuration; 
            cube.style.animationDelay = `${randomFlowDelay}s`;

            // Apply rotation duration/delay to the INNER rotator
            rotator.style.animationDuration = `${randomRotateDuration}s`;
            // Optionally, give rotation a different random delay or sync it
            // const randomRotateDelay = Math.random() * -randomRotateDuration;
            rotator.style.animationDelay = `${randomFlowDelay}s`; // Sync delay with flow for simplicity

            // Randomize opacity slightly (apply to outer cube)
            cube.style.opacity = Math.random() * 0.4 + 0.3; 

            cubeFlowContainer.appendChild(cube);
        }
    }

    createFlowingCubes(); // Call the function to generate the cubes
}); 