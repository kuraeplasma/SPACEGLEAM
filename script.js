document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Parallax effect for globes
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        const globes = document.querySelectorAll('.globe');
        globes.forEach((globe, index) => {
            const speed = (index + 1) * 20;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            globe.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Realistic Subtle Lightning Effect
    const lightningContainer = document.getElementById('lightning-container');

    // Create Flash Overlay div
    const flashOverlay = document.createElement('div');
    flashOverlay.className = 'flash-overlay';
    document.body.appendChild(flashOverlay);

    // SVG Path Generators (Jagged lines)
    function generateBoltPath() {
        let path = "M150,0 ";
        let x = 150;
        let y = 0;
        while (y < window.innerHeight + 100) {
            y += Math.random() * 30 + 20; // Step down
            x += (Math.random() - 0.5) * 80; // Jagged step L/R
            path += `L${x},${y} `;
        }
        return path;
    }

    function createBolt() {
        if (!lightningContainer) return;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "lightning-bolt");
        svg.setAttribute("viewBox", "0 0 300 " + window.innerHeight);

        // Random Position
        const randomLeft = Math.random() * 100; // 0 to 100%
        svg.style.left = `${randomLeft}%`;

        // Random Scale/Rotation slightly
        const scale = 0.8 + Math.random() * 0.4;
        svg.style.transform = `scale(${scale}) rotate(${(Math.random() - 0.5) * 10}deg)`;

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", generateBoltPath());

        svg.appendChild(path);
        lightningContainer.appendChild(svg);

        // Animate
        requestAnimationFrame(() => {
            // Bolt Animation
            svg.classList.add('anim-bolt');

            // Background Ambient Flash (Subtle)
            flashOverlay.classList.add('anim-flash');
        });

        // Cleanup
        setTimeout(() => {
            svg.remove();
            flashOverlay.classList.remove('anim-flash');
        }, 1000);
    }

    function scheduleLightning() {
        // Random delay between 2s and 6s
        const delay = Math.random() * 4000 + 2000;
        setTimeout(() => {
            createBolt();
            scheduleLightning();
        }, delay);
    }

    // Start loop with initial delay
    setTimeout(() => {
        createBolt(); // Initial test bolt
        scheduleLightning();
    }, 4000);

});
