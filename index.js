const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const scoreEl = document.querySelector('#scoreEl');
const modalEl = document.querySelector('#modalEl');
const modalScoreEl = document.querySelector('#modalScoreEl');
const buttonEl = document.querySelector('#buttonEl');
const startButtonEl = document.querySelector('#startButtonEl');
const startModalEl = document.querySelector('#startModalEl');
const divScoreEl = document.querySelector('#divScoreEl');

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = {
            x: 0,
            y: 0
        }
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();

        const friction = 0.99;

        this.velocity.x *= friction;
        this.velocity.y *= friction;

        // kolizja dla prawej i lewej
        if (this.x + this.radius + this.velocity.x <= canvas.width && this.x - this.radius + this.velocity.x >= 0) {
            this.x += this.velocity.x;
        } else {
            this.velocity.x = 0;
        }
        // kolizja dla dołu i góry
        if (this.y + this.radius + this.velocity.y <= canvas.height && this.y - this.radius + this.velocity.y >= 0) {
            this.y += this.velocity.y;
        } else {
            this.velocity.y = 0;
        }
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = 'rgba(255,0,0,1)';
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.97;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 12, 'white');

let projectiles = [];
let enemies = [];
let particles = [];
let animationId;
let intervalId;
let score = 0;

function init() {
    player = new Player(x, y, 12, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    animationId;
    score = 0;
    scoreEl.innerHTML = 0;
}

function spawnEnemies() {
    intervalId = setInterval(() => {
        const radius = Math.random() * (30 - 4) + 4;
        let x;
        let y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = 'hsl(' + Math.random() * 255 + ', 50%, 50%)';

        const angle = Math.atan2(player.y - y, player.x - x);
        const velocity = {
            x: Math.cos(angle) * 1.6,
            y: Math.sin(angle) * 1.6
        }
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 500)
}

function animate() {
    player.update();
    animationId = requestAnimationFrame(animate);
    // kolor canvasu
    c.fillStyle = 'rgba(0, 0, 0, 0.2)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];

        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    }

    for (let index = projectiles.length - 1; index >= 0; index--) {
        const projectile = projectiles[index];

        projectile.update();
        // usuwa obiekty za krawędzią ekranu
        if (projectile.x - projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || projectiles.y + projectile.radius > 0 || projectile.y - projectile.radius > canvas.height) {
            projectiles.splice(index, 1);
        }
    }

    for (let index = enemies.length - 1; index >= 0; index--) {
        const enemy = enemies[index];

        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        // koniec gry
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            clearInterval(intervalId);
            modalScoreEl.innerHTML = score;
            modalEl.style.display = 'block';
            gsap.fromTo('#modalEl', {
                scale: 0.8,
                opacity: 0
            }, {
                scale: 1,
                opacity: 1,
                ease: 'expo'
            })
            gsap.to('#divScoreEl', {
                opacity: 0,
                duration: 0.4
            })
        }

        for (let projectileIndex = projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
            const projectile = projectiles[projectileIndex];

            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // kiedy obiekty dotkną przeciwników
            if (dist - enemy.radius - projectile.radius < 1) {
                // eksplozje
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                }
                // zmiejszanie przeciwników
                if (enemy.radius - 10 > 5) {
                    score += 50;
                    scoreEl.innerHTML = score;
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    projectiles.splice(projectileIndex, 1);
                } else {
                    // usuwanie przeciwników jeśli są mniejsi
                    score += 100;
                    scoreEl.innerHTML = score;
                    enemies.splice(index, 1);
                    projectiles.splice(projectileIndex, 1);
                }
            }
        }
    }
}

addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity));
});

buttonEl.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    gsap.to('#divScoreEl', {
        opacity: 1,
        duration: 0.4
    })
    gsap.to('#modalEl', {
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        ease: 'expo',
        onComplete: () => {
            modalEl.style.display = 'none';
        }
    })
});

startButtonEl.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    gsap.to('#divScoreEl', {
        opacity: 1,
        duration: 0.4
    })
    gsap.to('#startModalEl', {
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        ease: 'expo',
        onComplete: () => {
            startModalEl.style.display = 'none';
        }
    })
});

addEventListener('keydown', (event) =>{
    switch (event.key) {
        case 'ArrowRight':
            player.velocity.x += 1;
        break;
        case 'ArrowLeft':
            player.velocity.x -= 1;
        break;
        case 'ArrowUp':
            player.velocity.y -= 1;
        break;
        case 'ArrowDown':
            player.velocity.y += 1;
        break;
    }
});