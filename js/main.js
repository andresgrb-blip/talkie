// Zone4Love - Main JavaScript with GSAP Animations

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother, SplitText, MorphSVGPlugin, DrawSVGPlugin);

// ============================================
// STAR FIELD CANVAS
// ============================================
class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        // Create regular stars
        const starCount = 300;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5,
                alpha: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                color: this.getStarColor()
            });
        }

        // Start animation
        this.animate();
        
        // Add shooting stars periodically
        setInterval(() => this.addShootingStar(), 3000);
    }

    getStarColor() {
        const colors = [
            'rgba(255, 255, 255',
            'rgba(147, 51, 234',    // purple
            'rgba(236, 72, 153',    // pink
            'rgba(59, 130, 246'     // blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    addShootingStar() {
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy;

        switch(side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = 0;
                vx = (Math.random() - 0.5) * 4;
                vy = Math.random() * 3 + 2;
                break;
            case 1: // right
                x = this.canvas.width;
                y = Math.random() * this.canvas.height;
                vx = -(Math.random() * 3 + 2);
                vy = (Math.random() - 0.5) * 4;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height;
                vx = (Math.random() - 0.5) * 4;
                vy = -(Math.random() * 3 + 2);
                break;
            default: // left
                x = 0;
                y = Math.random() * this.canvas.height;
                vx = Math.random() * 3 + 2;
                vy = (Math.random() - 0.5) * 4;
        }

        this.shootingStars.push({
            x, y, vx, vy,
            length: Math.random() * 80 + 40,
            alpha: 1,
            color: this.getStarColor()
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw and update regular stars
        this.stars.forEach(star => {
            star.alpha += star.twinkleSpeed;
            if (star.alpha > 1 || star.alpha < 0) {
                star.twinkleSpeed *= -1;
            }

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `${star.color}, ${Math.abs(star.alpha)})`;
            this.ctx.fill();
        });

        // Draw and update shooting stars
        this.shootingStars = this.shootingStars.filter(star => {
            star.x += star.vx;
            star.y += star.vy;
            star.alpha -= 0.01;

            if (star.alpha <= 0) return false;

            const gradient = this.ctx.createLinearGradient(
                star.x, star.y,
                star.x - star.vx * star.length / 2,
                star.y - star.vy * star.length / 2
            );
            gradient.addColorStop(0, `${star.color}, ${star.alpha})`);
            gradient.addColorStop(1, `${star.color}, 0)`);

            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(
                star.x - star.vx * star.length / 2,
                star.y - star.vy * star.length / 2
            );
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            return true;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize star field
    const canvas = document.getElementById('stars-canvas');
    const starField = new StarField(canvas);

    // Check if user is logged in
    checkAuthStatus();

    // ============================================
    // GSAP ANIMATIONS
    // ============================================

    // Hero Section Animations
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    heroTimeline
        .from('.hero-title', {
            y: 100,
            opacity: 0,
            duration: 1,
            delay: 0.5
        })
        .from('.hero-subtitle', {
            y: 50,
            opacity: 0,
            duration: 0.8
        }, '-=0.5')
        .from('.hero-buttons button', {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.2
        }, '-=0.4');

    // Planets floating animation
    gsap.to('.planet-1', {
        y: -30,
        rotation: 360,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });

    gsap.to('.planet-2', {
        y: -40,
        rotation: -360,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });

    // Scroll-triggered animations for feature cards
    gsap.utils.toArray('.feature-card').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                end: 'top 50%',
                scrub: 1,
                toggleActions: 'play none none reverse'
            },
            y: 100,
            opacity: 0,
            duration: 1,
            delay: index * 0.2
        });

        // Hover effect enhancement with GSAP
        card.addEventListener('mouseenter', () => {
            gsap.to(card.querySelector('.card-inner'), {
                y: -10,
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
            gsap.to(card.querySelector('.icon-container'), {
                rotation: 5,
                scale: 1.1,
                duration: 0.3,
                ease: 'back.out(1.7)'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card.querySelector('.card-inner'), {
                y: 0,
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
            gsap.to(card.querySelector('.icon-container'), {
                rotation: 0,
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Experience section animations
    ScrollTrigger.create({
        trigger: '#experience',
        start: 'top 80%',
        onEnter: () => {
            gsap.from('.experience-content h3', {
                x: -100,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            });

            gsap.from('.experience-content .flex', {
                x: -50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power2.out'
            });
        }
    });

    // Orbit system continuous animation
    gsap.to('.orbit-1', {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: 'none'
    });

    gsap.to('.orbit-2', {
        rotation: -360,
        duration: 30,
        repeat: -1,
        ease: 'none'
    });

    gsap.to('.orbit-3', {
        rotation: 360,
        duration: 40,
        repeat: -1,
        ease: 'none'
    });

    // CTA Section animation
    ScrollTrigger.create({
        trigger: '.cta-card',
        start: 'top 80%',
        onEnter: () => {
            gsap.from('.cta-card', {
                scale: 0.8,
                opacity: 0,
                duration: 1,
                ease: 'back.out(1.7)'
            });

            gsap.from('.cta-card h3', {
                y: 50,
                opacity: 0,
                duration: 0.8,
                delay: 0.3,
                ease: 'power3.out'
            });

            gsap.from('.btn-cta', {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                delay: 0.6,
                ease: 'back.out(1.7)'
            });
        }
    });

    // Parallax effect for sections
    gsap.utils.toArray('section').forEach((section) => {
        gsap.to(section, {
            backgroundPositionY: '50px',
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });

    // ============================================
    // NAVIGATION
    // ============================================
    const nav = document.querySelector('nav');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: target,
                        offsetY: 80
                    },
                    ease: 'power3.inOut'
                });
            }
        });
    });

    // ============================================
    // BUTTON INTERACTIONS
    // ============================================
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.05,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        button.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                transform: scale(0);
                pointer-events: none;
            `;

            this.appendChild(ripple);

            gsap.to(ripple, {
                scale: 2,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out',
                onComplete: () => ripple.remove()
            });
        });
    });

    // ============================================
    // MOUSE PARALLAX EFFECT
    // ============================================
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth - 0.5;
        const mouseY = e.clientY / window.innerHeight - 0.5;

        gsap.to('.planet-1', {
            x: mouseX * 50,
            y: mouseY * 50,
            duration: 1,
            ease: 'power2.out'
        });

        gsap.to('.planet-2', {
            x: mouseX * -30,
            y: mouseY * -30,
            duration: 1,
            ease: 'power2.out'
        });

        gsap.to('#nebula-layer', {
            x: mouseX * 20,
            y: mouseY * 20,
            duration: 2,
            ease: 'power1.out'
        });
    });

    // ============================================
    // PAGE LOAD ANIMATION
    // ============================================
    gsap.from('body', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    });

    console.log('🌌 Zone4Love Galaxy initialized');
});

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================
// Reduce animations on lower-end devices
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.globalTimeline.timeScale(0);
}

// Lazy loading for scroll animations
ScrollTrigger.config({
    limitCallbacks: true,
    syncInterval: 150
});

// ============================================
// AUTH STATUS CHECK
// ============================================
function checkAuthStatus() {
    const session = localStorage.getItem('zone4love_session') || sessionStorage.getItem('zone4love_session');
    
    if (session) {
        // User is logged in, replace "Accedi" button with Dashboard link
        const loginButton = document.querySelector('a.btn-galaxy');
        if (loginButton) {
            loginButton.href = 'dashboard.html';
            loginButton.textContent = 'Dashboard';
            
            // Add a subtle indicator
            gsap.from(loginButton, {
                scale: 0.9,
                opacity: 0,
                duration: 0.5,
                ease: 'back.out(1.7)'
            });
        }
    }
}

// Log GSAP version
console.log('GSAP Version:', gsap.version);
