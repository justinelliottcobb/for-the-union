// Interactive functionality for the landing page

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.querySelector(`[data-tab="${tabId}"]`);
            if (targetContent && targetContent.classList.contains('tab-content')) {
                targetContent.classList.add('active');
            }
        });
    });

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = '#fff';
            header.style.backdropFilter = 'none';
        }
    });

    // Animate stats on scroll
    const stats = document.querySelectorAll('.stat-number');
    const animateStats = () => {
        stats.forEach(stat => {
            const finalValue = parseInt(stat.textContent);
            const increment = finalValue / 50;
            let currentValue = 0;
            
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    stat.textContent = finalValue;
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(currentValue);
                }
            }, 30);
        });
    };

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Animate stats when hero section comes into view
                if (entry.target.classList.contains('hero-stats')) {
                    animateStats();
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature, .exercise, .path-step');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Observe hero stats
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }

    // Add hover effects to exercises
    const exercises = document.querySelectorAll('.exercise');
    exercises.forEach(exercise => {
        exercise.addEventListener('mouseenter', () => {
            exercise.style.borderColor = '#3b82f6';
            exercise.style.transform = 'translateY(-4px)';
            exercise.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.15)';
        });

        exercise.addEventListener('mouseleave', () => {
            exercise.style.borderColor = '#e2e8f0';
            exercise.style.transform = 'translateY(0)';
            exercise.style.boxShadow = 'none';
        });
    });

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn, .tab-button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }

        @keyframes ripple-animation {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Keyboard navigation for tabs
    tabButtons.forEach((button, index) => {
        button.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const direction = e.key === 'ArrowLeft' ? -1 : 1;
                const newIndex = (index + direction + tabButtons.length) % tabButtons.length;
                tabButtons[newIndex].focus();
                tabButtons[newIndex].click();
            }
        });
    });

    // Copy to clipboard functionality for code snippets
    const codeElements = document.querySelectorAll('code');
    codeElements.forEach(code => {
        if (code.textContent.trim().startsWith('git ') || code.textContent.trim().startsWith('npm ')) {
            code.style.cursor = 'pointer';
            code.title = 'Click to copy';
            
            code.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(code.textContent);
                    const originalText = code.textContent;
                    code.textContent = 'Copied!';
                    code.style.background = '#dcfce7';
                    
                    setTimeout(() => {
                        code.textContent = originalText;
                        code.style.background = '#f1f5f9';
                    }, 1000);
                } catch (err) {
                    console.log('Failed to copy text: ', err);
                }
            });
        }
    });

    // Add loading animation for GitHub stars (simulated)
    const githubLink = document.querySelector('.github-link');
    if (githubLink) {
        githubLink.addEventListener('mouseenter', () => {
            const svg = githubLink.querySelector('svg');
            if (svg) {
                svg.style.transform = 'rotate(360deg)';
                svg.style.transition = 'transform 0.5s ease';
            }
        });

        githubLink.addEventListener('mouseleave', () => {
            const svg = githubLink.querySelector('svg');
            if (svg) {
                svg.style.transform = 'rotate(0deg)';
            }
        });
    }

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    }

    // Add stagger animation to exercise lists
    const exerciseLists = document.querySelectorAll('.exercises-list');
    exerciseLists.forEach(list => {
        const exercises = list.querySelectorAll('.exercise');
        exercises.forEach((exercise, index) => {
            exercise.style.animationDelay = `${index * 0.1}s`;
        });
    });

    console.log('🚀 For The Union landing page loaded successfully!');
    console.log('📚 Ready to master TypeScript through advanced exercises');
});