class KumisGame {
    constructor() {
        this.kumisCount = 0;
        this.kumisPerSecond = 0;
        this.clickValue = 1;
        this.totalClicks = 0;
        this.upgrades = [];
        this.achievements = [];
        this.ownedUpgrades = new Set();
        this.unlockedAchievements = new Set();
        this.isMuted = false;

        this.initializeGame();
        this.loadGame();
        this.setupEventListeners();
        this.startGameLoop();
        this.hideLoadingScreen();
    }

    hideLoadingScreen() {
        // Hide loading screen after a short delay to ensure everything is loaded
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 1000);
    }

    initializeGame() {
        // Initialize upgrades
        this.upgrades = [
            { id: 'small-bowl', name: 'Маленькая пиала', cost: 100, value: 1 },
            { id: 'traditional-bowl', name: 'Традиционная чаша', cost: 500, value: 3 },
            { id: 'generous-portion', name: 'Щедрая порция', cost: 1000, value: 5 },
            { id: 'wooden-barrel', name: 'Большой деревянный бочонок', cost: 5000, value: 10 },
            { id: 'steppe-bottle', name: 'Бесконечный степной бурдюк', cost: 10000, value: 25 }
        ];

        // Initialize achievements
        this.achievements = [
            { id: 'first-bowl', name: 'Первый пиалу', description: 'Сделайте 50 кликов', clicks: 50, bonus: 0.01 },
            { id: 'kumis-novice', name: 'Новичок кумыса', description: 'Сделайте 100 кликов', clicks: 100, bonus: 0.02 },
            { id: 'guest-arrived', name: 'Қонақ келді', description: 'Сделайте 500 кликов', clicks: 500, bonus: 0.05 },
            { id: 'dombyra-sound', name: 'Домбыра үні', description: 'Сделайте 2500 кликов', clicks: 2500, bonus: 0.1 },
            { id: 'golden-eagle', name: 'Алтын бүркіт', description: 'Сделайте 25000 кликов', clicks: 25000, bonus: 0.2 },
            { id: 'great-steppe', name: 'Ұлы дала', description: 'Сделайте 50000 кликов', clicks: 50000, bonus: 0.3 },
            { id: 'shanyrak', name: 'Шаңырақ', description: 'Сделайте 100000 кликов', clicks: 100000, bonus: 0.5 }
        ];

        this.setupModals();
        this.renderUpgrades();
        this.renderAchievements();
    }

    setupModals() {
        // Get modal elements
        const upgradesModal = document.getElementById('upgrades-modal');
        const achievementsModal = document.getElementById('achievements-modal');
        const upgradesBtn = document.getElementById('upgrades-btn');
        const achievementsBtn = document.getElementById('achievements-btn');
        const closeButtons = document.querySelectorAll('.close-button');

        // Open modals
        upgradesBtn.addEventListener('click', () => {
            upgradesModal.style.display = 'block';
            this.renderUpgrades();
        });

        achievementsBtn.addEventListener('click', () => {
            achievementsModal.style.display = 'block';
            this.renderAchievements();
        });

        // Close modals
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                upgradesModal.style.display = 'none';
                achievementsModal.style.display = 'none';
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === upgradesModal) {
                upgradesModal.style.display = 'none';
            }
            if (event.target === achievementsModal) {
                achievementsModal.style.display = 'none';
            }
        });
    }

    setupEventListeners() {
        const kumisImage = document.getElementById('kumis-image');
        const clickSound = document.getElementById('click-sound');
        const backgroundMusic = document.getElementById('background-music');
        const muteButton = document.getElementById('mute-btn');
        let musicStarted = false;

        // Mute button functionality
        muteButton.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            clickSound.muted = this.isMuted;
            backgroundMusic.muted = this.isMuted;
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            muteButton.classList.toggle('muted', this.isMuted);
        });

        kumisImage.addEventListener('click', (event) => {
            this.addKumis(this.clickValue);
            this.totalClicks++;
            this.checkAchievements();
            this.createKumisSplash(event);
            
            // Play click sound if not muted
            if (!this.isMuted) {
                clickSound.currentTime = 0;
                clickSound.play();
            }

            // Start background music on first click if not started and not muted
            if (!musicStarted && !this.isMuted) {
                backgroundMusic.play().catch(error => {
                    console.log('Background music autoplay failed:', error);
                });
                musicStarted = true;
            }
        });
    }

    createKumisSplash(event) {
        const kumisImage = document.getElementById('kumis-image');
        const rect = kumisImage.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clickX = event.clientX;
        const clickY = event.clientY;

        // Create 8 droplets in different directions
        for (let i = 0; i < 8; i++) {
            const droplet = document.createElement('div');
            droplet.className = 'kumis-droplet';
            
            // Calculate angle for each droplet
            const angle = (i * 45) * (Math.PI / 180);
            const distance = 100; // Maximum distance droplets can travel
            
            // Set initial position at click point
            droplet.style.left = `${clickX}px`;
            droplet.style.top = `${clickY}px`;
            
            // Random size between 5px and 15px
            const size = Math.random() * 10 + 5;
            droplet.style.width = `${size}px`;
            droplet.style.height = `${size}px`;
            
            // Random animation duration
            const duration = Math.random() * 0.5 + 0.5;
            droplet.style.animationDuration = `${duration}s`;
            
            // Calculate end position based on angle and distance
            const endX = clickX + Math.cos(angle) * distance;
            const endY = clickY + Math.sin(angle) * distance;
            
            // Set animation
            droplet.style.animation = `splash ${duration}s ease-out forwards`;
            droplet.style.setProperty('--end-x', `${endX}px`);
            droplet.style.setProperty('--end-y', `${endY}px`);
            
            document.body.appendChild(droplet);
            
            // Remove droplet after animation
            setTimeout(() => {
                droplet.remove();
            }, duration * 1000);
        }
    }

    startGameLoop() {
        setInterval(() => {
            this.addKumis(this.kumisPerSecond / 10);
            this.updateUI();
        }, 100);
    }

    addKumis(amount) {
        this.kumisCount += amount;
        this.updateUI();
    }

    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (!upgrade || this.kumisCount < upgrade.cost || this.ownedUpgrades.has(upgradeId)) return;

        this.kumisCount -= upgrade.cost;
        this.clickValue += upgrade.value;
        this.ownedUpgrades.add(upgradeId);
        this.updateUI();
        this.renderUpgrades();
    }

    showAchievementAlert(achievement) {
        const alert = document.getElementById('achievement-alert');
        const nameElement = document.getElementById('achievement-name');
        const descriptionElement = document.getElementById('achievement-description');

        nameElement.textContent = achievement.name;
        descriptionElement.textContent = achievement.description;

        alert.style.display = 'block';

        // Hide alert after 3 seconds
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }

    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (!this.unlockedAchievements.has(achievement.id) && this.totalClicks >= achievement.clicks) {
                this.unlockAchievement(achievement.id);
                this.showAchievementAlert(achievement);
            }
        });
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        this.unlockedAchievements.add(achievementId);
        this.clickValue *= (1 + achievement.bonus);
        this.renderAchievements();
    }

    updateUI() {
        document.getElementById('kumis-count').textContent = Math.floor(this.kumisCount);
        document.getElementById('kps-count').textContent = this.kumisPerSecond.toFixed(1);
    }

    renderUpgrades() {
        const container = document.getElementById('upgrades-container');
        container.innerHTML = '';

        this.upgrades.forEach(upgrade => {
            const isOwned = this.ownedUpgrades.has(upgrade.id);
            const canAfford = this.kumisCount >= upgrade.cost;
            
            const upgradeElement = document.createElement('div');
            upgradeElement.className = `upgrade ${isOwned ? 'owned' : ''} ${!canAfford && !isOwned ? 'locked' : ''}`;
            upgradeElement.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>Стоимость: ${upgrade.cost} кумыса</p>
                <p>Эффект: +${upgrade.value} кумыса за клик</p>
            `;
            
            if (!isOwned) {
                upgradeElement.addEventListener('click', () => this.buyUpgrade(upgrade.id));
            }
            
            container.appendChild(upgradeElement);
        });
    }

    renderAchievements() {
        const container = document.getElementById('achievements-container');
        container.innerHTML = '';

        this.achievements.forEach(achievement => {
            const isUnlocked = this.unlockedAchievements.has(achievement.id);
            const progress = Math.min(this.totalClicks, achievement.clicks);
            const progressPercentage = (progress / achievement.clicks) * 100;
            
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
            achievementElement.innerHTML = `
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                <p>Бонус: +${(achievement.bonus * 100)}% к клику</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progressPercentage}%"></div>
                </div>
                <p>Прогресс: ${progress}/${achievement.clicks}</p>
            `;
            
            container.appendChild(achievementElement);
        });
    }

    saveGame() {
        const gameState = {
            kumisCount: this.kumisCount,
            totalClicks: this.totalClicks,
            ownedUpgrades: Array.from(this.ownedUpgrades),
            unlockedAchievements: Array.from(this.unlockedAchievements)
        };
        localStorage.setItem('kumisGame', JSON.stringify(gameState));
    }

    loadGame() {
        const savedGame = localStorage.getItem('kumisGame');
        if (savedGame) {
            const gameState = JSON.parse(savedGame);
            this.kumisCount = gameState.kumisCount;
            this.totalClicks = gameState.totalClicks;
            this.ownedUpgrades = new Set(gameState.ownedUpgrades);
            this.unlockedAchievements = new Set(gameState.unlockedAchievements);
            
            // Recalculate click value based on owned upgrades and achievements
            this.clickValue = 1;
            this.ownedUpgrades.forEach(upgradeId => {
                const upgrade = this.upgrades.find(u => u.id === upgradeId);
                if (upgrade) this.clickValue += upgrade.value;
            });
            
            this.unlockedAchievements.forEach(achievementId => {
                const achievement = this.achievements.find(a => a.id === achievementId);
                if (achievement) this.clickValue *= (1 + achievement.bonus);
            });
            
            this.updateUI();
            this.renderUpgrades();
            this.renderAchievements();
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new KumisGame();
    
    // Save game state periodically
    setInterval(() => game.saveGame(), 3000);
}); 