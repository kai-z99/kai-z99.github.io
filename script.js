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
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section id from the href attribute
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            // Calculate the position to scroll to
            const headerHeight = header.offsetHeight;
            const targetPosition = targetSection.offsetTop - headerHeight;
            
            // Scroll to the target position
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
    
    // 3D Shape Animation
    const shape = document.getElementById('cube'); // Keep the ID for compatibility
    const pauseButton = document.getElementById('pause-cube');
    const speedUpButton = document.getElementById('speed-up');
    const slowDownButton = document.getElementById('slow-down');
    
    let isAnimating = false;
    let animationSpeed = 20; // seconds for one full rotation
    
    // Initialize shape animation
    function initShape() {
        if (shape) {
            // Start animation
            shape.classList.add('animate');
            shape.style.animationDuration = animationSpeed + 's';
            isAnimating = true;
            
            // Setup controls
            pauseButton.addEventListener('click', toggleAnimation);
            speedUpButton.addEventListener('click', speedUp);
            slowDownButton.addEventListener('click', slowDown);
            
            // Add manual rotation on mouse move
            shape.addEventListener('mousemove', handleMouseMove);
        }
    }
    
    function toggleAnimation() {
        if (isAnimating) {
            // Pause animation
            shape.style.animationPlayState = 'paused';
            pauseButton.textContent = 'Resume';
        } else {
            // Resume animation
            shape.style.animationPlayState = 'running';
            pauseButton.textContent = 'Pause';
        }
        isAnimating = !isAnimating;
    }
    
    function speedUp() {
        if (animationSpeed > 5) {
            animationSpeed -= 5;
            updateAnimationSpeed();
        }
    }
    
    function slowDown() {
        animationSpeed += 5;
        updateAnimationSpeed();
    }
    
    function updateAnimationSpeed() {
        shape.style.animationDuration = animationSpeed + 's';
    }
    
    function handleMouseMove(e) {
        if (!isAnimating) {
            const shapeContainer = document.querySelector('.cube-container');
            const containerRect = shapeContainer.getBoundingClientRect();
            
            // Calculate mouse position relative to the center of the container
            const centerX = containerRect.left + containerRect.width / 2;
            const centerY = containerRect.top + containerRect.height / 2;
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            // Convert mouse position to rotation angles
            const rotateY = mouseX * 0.1;
            const rotateX = mouseY * -0.1;
            
            // Apply rotation
            shape.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
    }
    
    // Initialize 3D shape
    initShape();
    
    // Flappy Bird Game
    const canvas = document.getElementById('flappy-canvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-game');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('high-score');
    
    // Game variables
    let game = {
        running: false,
        frameId: null,
        score: 0,
        highScore: localStorage.getItem('flappyHighScore') || 0,
        gravity: 0.15,  // Reduced gravity
        speed: 1.5,     // Reduced speed (was 3)
        pipeGap: 150,
        pipeWidth: 50,
        pipeSpacing: 280, // Increased spacing between pipes
        lastTime: 0,
        gameOver: false,
        backgroundX: 0,
        backgroundSpeed: 0.5 // Background scrolling speed
    };
    
    // Bird object
    let bird = {
        x: 50,
        y: canvas.height / 2,
        radius: 15,
        velocity: 0,
        jump: -6    // Reduced jump power (was -10)
    };
    
    // Pipes array
    let pipes = [];
    
    // Initialize the game
    function initGame() {
        // Reset game state
        game.score = 0;
        game.running = false;
        game.gameOver = false;
        scoreDisplay.textContent = '0';
        highScoreDisplay.textContent = game.highScore;
        
        // Reset bird position
        bird.y = canvas.height / 2;
        bird.velocity = 0;
        
        // Clear pipes
        pipes = [];
        
        // Generate initial pipes
        generatePipes();
        
        // Draw initial game state
        drawGame();
        
        // Setup event listeners
        startButton.addEventListener('click', startGame);
        document.addEventListener('keydown', handleKeyDown);
        canvas.addEventListener('click', handleCanvasClick);
    }
    
    // Start game
    function startGame() {
        if (!game.running) {
            game.running = true;
            game.gameOver = false;
            startButton.textContent = 'Restart Game';
            
            // Make sure we have a clean game state when starting
            if (game.frameId) {
                cancelAnimationFrame(game.frameId);
            }
            
            // Reset bird position before starting
            bird.y = canvas.height / 2;
            bird.velocity = 0;
            
            // Clear pipes
            pipes = [];
            
            // Generate initial pipes
            generatePipes();
            
            // Start game loop
            gameLoop(0);
        } else {
            // If game is already running, restart
            gameOver();
            game.running = true;
            game.gameOver = false;
            game.score = 0;
            scoreDisplay.textContent = '0';
            bird.y = canvas.height / 2;
            bird.velocity = 0;
            pipes = [];
            generatePipes();
            gameLoop(0);
        }
    }
    
    // Game loop
    function gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - game.lastTime;
        game.lastTime = timestamp;
        
        // Update game state
        updateBird();
        updatePipes();
        checkCollisions();
        
        // Draw game
        drawGame();
        
        // Continue loop if game is running
        if (game.running) {
            game.frameId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Update bird position
    function updateBird() {
        bird.velocity += game.gravity;
        bird.y += bird.velocity;
        
        // Check boundaries
        if (bird.y - bird.radius < 0) {
            bird.y = bird.radius;
            bird.velocity = 0;
        }
        
        if (bird.y + bird.radius > canvas.height) {
            gameOver();
        }
    }
    
    // Make bird jump
    function jump() {
        if (game.running) {
            bird.velocity = bird.jump;
        }
    }
    
    // Generate pipes
    function generatePipes() {
        // Clear pipes that are off-screen
        pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
        
        // Add new pipe if needed
        if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - game.pipeSpacing) {
            const pipeY = Math.floor(Math.random() * (canvas.height - game.pipeGap - 100)) + 50;
            
            pipes.push({
                x: canvas.width,
                y: pipeY,
                width: game.pipeWidth,
                scored: false
            });
        }
    }
    
    // Update pipes position
    function updatePipes() {
        pipes.forEach(pipe => {
            pipe.x -= game.speed;
            
            // Check if bird passed pipe to increment score
            if (!pipe.scored && pipe.x + pipe.width < bird.x) {
                pipe.scored = true;
                game.score++;
                scoreDisplay.textContent = game.score;
                
                // Update high score if needed
                if (game.score > game.highScore) {
                    game.highScore = game.score;
                    highScoreDisplay.textContent = game.highScore;
                    localStorage.setItem('flappyHighScore', game.highScore);
                }
            }
        });
        
        // Generate new pipes
        generatePipes();
    }
    
    // Check collisions
    function checkCollisions() {
        // Check for collisions with pipes
        for (let i = 0; i < pipes.length; i++) {
            const pipe = pipes[i];
            
            // Check if bird collides with top pipe
            if (
                bird.x + bird.radius > pipe.x &&
                bird.x - bird.radius < pipe.x + pipe.width &&
                bird.y - bird.radius < pipe.y
            ) {
                gameOver();
                return;
            }
            
            // Check if bird collides with bottom pipe
            if (
                bird.x + bird.radius > pipe.x &&
                bird.x - bird.radius < pipe.x + pipe.width &&
                bird.y + bird.radius > pipe.y + game.pipeGap
            ) {
                gameOver();
                return;
            }
        }
    }
    
    // Game over
    function gameOver() {
        game.running = false;
        game.gameOver = true;
        cancelAnimationFrame(game.frameId);
        startButton.textContent = 'Restart Game';
        
        // Update display score
        scoreDisplay.textContent = '0';
    }
    
    // Draw the game
    function drawGame() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Use explicit color values instead of CSS variables
        const wireframeColor = '#F7DF1E'; // Yellow color
        
        // Draw background grid (moving)
        drawBackground();
        
        // Draw bird (wireframe circle)
        ctx.beginPath();
        ctx.strokeStyle = wireframeColor;
        ctx.lineWidth = 2;
        ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add wing detail to bird (wireframe)
        ctx.beginPath();
        ctx.moveTo(bird.x, bird.y);
        ctx.lineTo(bird.x - 10, bird.y + 5);
        ctx.stroke();
        
        // Draw eyes
        ctx.beginPath();
        ctx.arc(bird.x + 5, bird.y - 5, 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw pipes (wireframes)
        pipes.forEach(pipe => {
            // Draw top pipe (wireframe rectangle)
            ctx.beginPath();
            ctx.rect(pipe.x, 0, pipe.width, pipe.y);
            ctx.strokeStyle = wireframeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw bottom pipe (wireframe rectangle)
            ctx.beginPath();
            ctx.rect(pipe.x, pipe.y + game.pipeGap, pipe.width, canvas.height - pipe.y - game.pipeGap);
            ctx.stroke();
        });
        
        // Draw ground line
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 1);
        ctx.lineTo(canvas.width, canvas.height - 1);
        ctx.stroke();
        
        // Display score on canvas
        ctx.font = "24px Arial";
        ctx.fillStyle = wireframeColor;
        ctx.fillText("Score: " + game.score, 10, 30);
        
        // Draw game over message if game is over
        if (game.gameOver) {
            ctx.fillStyle = wireframeColor;
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
            ctx.font = "24px Arial";
            ctx.fillText("Final Score: " + game.score, canvas.width / 2, canvas.height / 2);
            ctx.fillText("High Score: " + game.highScore, canvas.width / 2, canvas.height / 2 + 30);
            ctx.fillText("Click to restart", canvas.width / 2, canvas.height / 2 + 70);
            ctx.textAlign = "left";
        }
    }
    
    // Draw moving background
    function drawBackground() {
        const wireframeColor = '#F7DF1E'; // Yellow color
        const gridSize = 50;
        
        ctx.strokeStyle = wireframeColor;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.2;
        
        // Update background position
        if (game.running) {
            game.backgroundX -= game.backgroundSpeed;
            if (game.backgroundX < -gridSize) {
                game.backgroundX = 0;
            }
        }
        
        // Draw vertical lines
        for (let x = game.backgroundX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    // Event handlers
    function handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!game.running) {
                startGame();
            } else {
                jump();
            }
        }
    }
    
    function handleCanvasClick() {
        if (!game.running) {
            startGame();
        } else {
            jump();
        }
    }
    
    // Initialize the game
    initGame();
    
    // Form handling
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Form validation
            if (name === '' || email === '' || message === '') {
                showNotification('Please fill out all fields', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // In a real scenario, you would send this data to a server
            // For demonstration, we'll just show a success message
            showNotification('Your message has been sent successfully!', 'success');
            
            // Reset form
            contactForm.reset();
        });
    }
    
    // Notification function
    function showNotification(message, type) {
        // Check if notification container exists, if not create it
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
            
            // Add some basic styles to the notification container
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.bottom = '20px';
            notificationContainer.style.right = '20px';
            notificationContainer.style.zIndex = '1000';
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.marginTop = '10px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.transition = 'all 0.3s ease';
        
        // Add notification to container
        notificationContainer.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Reveal animations for sections
    const revealSections = document.querySelectorAll('section');
    
    function checkScroll() {
        revealSections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const sectionBottom = section.getBoundingClientRect().bottom;
            const windowHeight = window.innerHeight;
            
            // Check if section is in viewport
            if (sectionTop < windowHeight * 0.75 && sectionBottom > 0) {
                // Section is in view, add the revealed class and show it
                section.classList.add('revealed');
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            } else {
                // Section is out of view, remove the revealed class and hide it
                section.classList.remove('revealed');
                section.style.opacity = '0';
                section.style.transform = 'translateY(30px)';
            }
        });
    }
    
    // Initialize section styles for animation
    revealSections.forEach(section => {
        // Set initial styles for all sections
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Check scroll position on load and scroll
    window.addEventListener('load', checkScroll);
    window.addEventListener('scroll', checkScroll);
    
    // Project card hover effect
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderLeftWidth = '8px';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.borderLeftWidth = '4px';
        });
    });
    
    // Update copyright year
    const footerYear = document.querySelector('footer p');
    if (footerYear) {
        const currentYear = new Date().getFullYear();
        footerYear.textContent = footerYear.textContent.replace('2023', currentYear);
    }
}); 