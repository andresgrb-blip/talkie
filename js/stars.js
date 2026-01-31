// Star Field Canvas - Reusable component

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

// Initialize star field when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('stars-canvas');
    if (canvas) {
        const starField = new StarField(canvas);
        console.log('✨ Star field initialized');
    }
});
