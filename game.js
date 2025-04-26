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
        this.currentLang = 'ru'; // Set default to Russian
        
        // Load language preference if it exists
        const savedLang = localStorage.getItem('kumisGameLang');
        if (savedLang) {
            this.currentLang = savedLang;
        }
        
        // Prestige-related properties
        this.prestigePoints = 0;
        this.totalPrestigePoints = 0;
        this.prestigeUpgrades = new Set();
        this.lifetimeKumis = 0; // Total kumis earned across all prestiges
        
        // New properties for generators
        this.generators = [];
        this.ownedGenerators = {};

        // Audio setup
        this.clickSound = document.getElementById('click-sound');
        this.backgroundMusic = document.getElementById('background-music');
        this.musicStarted = false;

        if (this.clickSound) {
            this.clickSound.load();
        }
        if (this.backgroundMusic) {
            this.backgroundMusic.load();
            this.backgroundMusic.volume = 0.3;
        }

        // Initialize game components
        this.initializeGame();
        this.loadGame();
        
        // Ensure UI is properly updated after loading
        this.updateKumisPerSecond();
        this.renderGenerators();
        this.updateUI();
        
        // Setup remaining components
        this.setupEventListeners();
        this.startGameLoop();
        this.hideLoadingScreen();
    }

    hideLoadingScreen() {
        // Hide loading screen after ensuring everything is loaded
        Promise.all([
            this.clickSound ? this.clickSound.play().then(() => this.clickSound.pause()).catch(() => {}) : Promise.resolve(),
            this.backgroundMusic ? this.backgroundMusic.play().then(() => this.backgroundMusic.pause()).catch(() => {}) : Promise.resolve()
        ]).finally(() => {
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
            }, 1000);
        });
    }

    initializeGame() {
        // Initialize upgrades
        this.upgrades = [
            { id: 'small-bowl', cost: 100, value: 1 },
            { id: 'traditional-bowl', cost: 500, value: 3 },
            { id: 'generous-portion', cost: 1000, value: 5 },
            { id: 'wooden-barrel', cost: 5000, value: 10 },
            { id: 'steppe-bottle', cost: 10000, value: 25 }
        ];

        // Initialize generators
        this.generators = [
            { 
                id: 'mare',
                baseCost: 150, 
                baseProduction: 1
            },
            { 
                id: 'herd',
                baseCost: 800, 
                baseProduction: 5
            },
            { 
                id: 'farm',
                baseCost: 4000, 
                baseProduction: 25
            },
            { 
                id: 'factory',
                baseCost: 20000, 
                baseProduction: 100
            }
        ];

        // Initialize owned generators
        this.generators.forEach(generator => {
            if (!this.ownedGenerators[generator.id]) {
                this.ownedGenerators[generator.id] = 0;
            }
        });

        // Initialize achievements
        this.achievements = [
            { id: 'first-bowl', clicks: 50, bonus: 0.01 },
            { id: 'kumis-novice', clicks: 100, bonus: 0.02 },
            { id: 'guest-arrived', clicks: 500, bonus: 0.05 },
            { id: 'dombyra-sound', clicks: 2500, bonus: 0.1 },
            { id: 'golden-eagle', clicks: 25000, bonus: 0.2 },
            { id: 'great-steppe', clicks: 50000, bonus: 0.3 },
            { id: 'shanyrak', clicks: 100000, bonus: 0.5 }
        ];

        this.setupModals();
        this.renderUpgrades();
        this.renderAchievements();
        this.updateLanguageButton();
    }

    setupModals() {
        // Get modal elements
        const upgradesModal = document.getElementById('upgrades-modal');
        const achievementsModal = document.getElementById('achievements-modal');
        const prestigeModal = document.getElementById('prestige-modal');
        const upgradesBtn = document.getElementById('upgrades-btn');
        const achievementsBtn = document.getElementById('achievements-btn');
        const prestigeBtn = document.getElementById('prestige-btn');
        const closeButtons = document.querySelectorAll('.close-button');

        // Set initial button text
        upgradesBtn.textContent = getText('upgrades', this.currentLang);
        achievementsBtn.textContent = getText('achievements', this.currentLang);
        prestigeBtn.textContent = getText('prestige', this.currentLang);

        // Open modals
        upgradesBtn.addEventListener('click', () => {
            upgradesModal.style.display = 'block';
            this.renderUpgrades();
        });

        achievementsBtn.addEventListener('click', () => {
            achievementsModal.style.display = 'block';
            this.renderAchievements();
        });

        prestigeBtn.addEventListener('click', () => {
            prestigeModal.style.display = 'block';
            this.renderPrestigeContent();
        });

        // Close modals
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                upgradesModal.style.display = 'none';
                achievementsModal.style.display = 'none';
                prestigeModal.style.display = 'none';
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
            if (event.target === prestigeModal) {
                prestigeModal.style.display = 'none';
            }
        });
    }

    renderPrestigeContent() {
        const container = document.getElementById('prestige-content');
        if (!container) return;

        const potentialPrestigePoints = this.calculatePrestigePoints();
        const canPrestigeNow = this.canPrestige();
        const productionBonus = (this.totalPrestigePoints * 0.1 * 100).toFixed(0);

        container.innerHTML = `
            <div class="prestige-info">
                <div class="prestige-stats">
                    <div class="prestige-stat">
                        <h3>${getText('current_prestige_points', this.currentLang)}</h3>
                        <p class="stat-value">${this.prestigePoints}</p>
                    </div>
                    <div class="prestige-stat">
                        <h3>${getText('total_prestige_points', this.currentLang)}</h3>
                        <p class="stat-value">${this.totalPrestigePoints}</p>
                    </div>
                    <div class="prestige-stat">
                        <h3>${getText('lifetime_kumis', this.currentLang)}</h3>
                        <p class="stat-value">${this.formatNumber(this.lifetimeKumis)}</p>
                    </div>
                </div>

                <div class="prestige-explanation">
                    <h3>${getText('prestige_explanation', this.currentLang)}</h3>
                    <div class="prestige-progress">
                        <div class="progress-details">
                            <p>${getText('potential_prestige_points', this.currentLang)}: <span class="highlight">${potentialPrestigePoints}</span></p>
                            <p>Current Bonus: <span class="highlight">+${productionBonus}%</span></p>
                        </div>
                        <div class="prestige-requirements">
                            <p>Next point: ${this.formatNumber(Math.pow(10, 12))} kumis</p>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${Math.min((this.kumisCount / Math.pow(10, 12)) * 100, 100)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <button id="perform-prestige" class="prestige-button ${canPrestigeNow ? 'ready' : ''}" ${!canPrestigeNow ? 'disabled' : ''}>
                    ${getText('perform_prestige', this.currentLang)}
                    ${canPrestigeNow ? `<span class="points-preview">+${potentialPrestigePoints}</span>` : ''}
                </button>
            </div>

            <div class="prestige-upgrades">
                <h3>${getText('prestige_upgrades', this.currentLang)}</h3>
                <div class="upgrades-grid">
                    ${this.renderPrestigeUpgrades()}
                </div>
            </div>
        `;

        // Add event listener for prestige button
        const prestigeButton = document.getElementById('perform-prestige');
        if (prestigeButton) {
            prestigeButton.addEventListener('click', () => {
                if (this.canPrestige()) {
                    if (confirm(getText('prestige_confirm', this.currentLang))) {
                        this.performPrestige();
                        this.renderPrestigeContent();
                    }
                }
            });
        }

        this.setupPrestigeUpgradeListeners();
    }

    renderPrestigeUpgrades() {
        const prestigeUpgradesData = [
            {
                id: 'heritage',
                cost: 1,
                name: getText('heritage_name', this.currentLang),
                description: getText('heritage_description', this.currentLang)
            },
            // Add more prestige upgrades here
        ];

        return prestigeUpgradesData.map(upgrade => {
            const isOwned = this.prestigeUpgrades.has(upgrade.id);
            const canAfford = this.prestigePoints >= upgrade.cost;
            
            return `
                <div class="prestige-upgrade ${isOwned ? 'owned' : ''} ${!canAfford && !isOwned ? 'locked' : ''}"
                     data-upgrade-id="${upgrade.id}" data-cost="${upgrade.cost}">
                    <h4>${upgrade.name}</h4>
                    <p>${upgrade.description}</p>
                    <p>${getText('cost', this.currentLang)}: ${upgrade.cost} ${getText('prestige_points', this.currentLang)}</p>
                </div>
            `;
        }).join('');
    }

    setupPrestigeUpgradeListeners() {
        const upgradeElements = document.querySelectorAll('.prestige-upgrade:not(.owned)');
        upgradeElements.forEach(element => {
            element.addEventListener('click', () => {
                const upgradeId = element.dataset.upgradeId;
                const cost = parseInt(element.dataset.cost);
                
                if (this.prestigePoints >= cost && !this.prestigeUpgrades.has(upgradeId)) {
                    this.prestigePoints -= cost;
                    this.prestigeUpgrades.add(upgradeId);
                    this.applyPrestigeBonuses();
                    this.saveGame();
                    this.renderPrestigeContent();
                }
            });
        });
    }

    setupEventListeners() {
        const kumisImage = document.getElementById('kumis-image');
        const clickSound = document.getElementById('click-sound');
        const backgroundMusic = document.getElementById('background-music');
        const muteButton = document.getElementById('mute-btn');
        const langButton = document.getElementById('lang-btn');
        let musicStarted = false;

        // Language button functionality
        langButton.addEventListener('click', () => {
            this.currentLang = this.currentLang === 'ru' ? 'en' : 'ru';
            localStorage.setItem('kumisGameLang', this.currentLang);
            this.updateLanguageButton();
            this.updateUI();
            this.renderUpgrades();
            this.renderAchievements();
            this.renderGenerators();
        });

        // Mute button functionality
        muteButton.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            clickSound.muted = this.isMuted;
            backgroundMusic.muted = this.isMuted;
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            muteButton.classList.toggle('muted', this.isMuted);
        });

        // Kumis click handler
        kumisImage.addEventListener('click', (event) => {
            this.addKumis(this.clickValue);
            this.totalClicks++;
            this.checkAchievements();
            this.createKumisSplash(event);
            
            // Play click sound if not muted
            if (!this.isMuted && clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(error => console.log('Click sound play failed:', error));
            }

            // Start background music on first click if not started and not muted
            if (!musicStarted && !this.isMuted && backgroundMusic) {
                backgroundMusic.play().catch(error => {
                    console.log('Background music autoplay failed:', error);
                });
                musicStarted = true;
            }
        });

        // Add generator purchase listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-generator')) {
                const generatorId = e.target.dataset.id;
                if (generatorId) {
                    const success = this.buyGenerator(generatorId);
                    if (success) {
                        this.updateUI();
                        this.renderGenerators();
                    }
                }
            }
        });

        // Start background music if autoplay is allowed
        if (backgroundMusic) {
            backgroundMusic.volume = 0.3; // Set lower volume for background music
            document.addEventListener('click', () => {
                if (!musicStarted && !this.isMuted) {
                    backgroundMusic.play().catch(error => {
                        console.log('Background music autoplay failed:', error);
                    });
                    musicStarted = true;
                }
            }, { once: true });
        }
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
        // Update 10 times per second for smoother display
        setInterval(() => {
            // Add kumis from generators
            const generatedKumis = this.kumisPerSecond / 10; // Divide by 10 because we update 10 times per second
            if (generatedKumis > 0) {
                this.kumisCount += generatedKumis;
                this.updateUI();
                
                // Update upgrades state if modal is open
                const upgradesModal = document.getElementById('upgrades-modal');
                if (upgradesModal && upgradesModal.style.display === 'block') {
                    this.updateUpgradesState();
                }
            }
        }, 100); // 100ms = 1/10th of a second

        // Save game every 30 seconds
        setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    updateUpgradesState() {
        const container = document.getElementById('upgrades-container');
        if (!container) return;

        // Update each upgrade's state without re-rendering
        this.upgrades.forEach(upgrade => {
            const upgradeElement = container.querySelector(`[data-upgrade-id="${upgrade.id}"]`);
            if (!upgradeElement) return;

            const isOwned = this.ownedUpgrades.has(upgrade.id);
            const canAfford = this.kumisCount >= upgrade.cost;

            if (!isOwned) {
                upgradeElement.classList.toggle('locked', !canAfford);
                upgradeElement.classList.toggle('can-afford', canAfford);
            }
        });
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
        this.saveGame();
    }

    showAchievementAlert(achievement) {
        const alert = document.getElementById('achievement-alert');
        const nameElement = document.getElementById('achievement-name');
        const descriptionElement = document.getElementById('achievement-description');

        // Define achievement data with translations
        const achievementData = {
            'first-bowl': {
                en: {
                    name: 'First Bowl',
                    description: 'Click 50 times'
                },
                ru: {
                    name: 'Первая Пиала',
                    description: 'Кликните 50 раз'
                }
            },
            'kumis-novice': {
                en: {
                    name: 'Kumis Novice',
                    description: 'Click 100 times'
                },
                ru: {
                    name: 'Новичок Кумыса',
                    description: 'Кликните 100 раз'
                }
            },
            'guest-arrived': {
                en: {
                    name: 'Guest Arrived',
                    description: 'Click 500 times'
                },
                ru: {
                    name: 'Гость Прибыл',
                    description: 'Кликните 500 раз'
                }
            },
            'dombyra-sound': {
                en: {
                    name: 'Dombyra Sound',
                    description: 'Click 2,500 times'
                },
                ru: {
                    name: 'Звук Домбры',
                    description: 'Кликните 2,500 раз'
                }
            },
            'golden-eagle': {
                en: {
                    name: 'Golden Eagle',
                    description: 'Click 25,000 times'
                },
                ru: {
                    name: 'Золотой Орёл',
                    description: 'Кликните 25,000 раз'
                }
            },
            'great-steppe': {
                en: {
                    name: 'Great Steppe',
                    description: 'Click 50,000 times'
                },
                ru: {
                    name: 'Великая Степь',
                    description: 'Кликните 50,000 раз'
                }
            },
            'shanyrak': {
                en: {
                    name: 'Shanyrak',
                    description: 'Click 100,000 times'
                },
                ru: {
                    name: 'Шанырак',
                    description: 'Кликните 100,000 раз'
                }
            }
        };

        const data = achievementData[achievement.id][this.currentLang];
        nameElement.textContent = data.name;
        descriptionElement.textContent = data.description;

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
        // Update kumis count with 1 decimal place if it's not a whole number
        const kumisDisplay = this.kumisCount % 1 === 0 ? 
            Math.floor(this.kumisCount) : 
            Number(this.kumisCount.toFixed(1));
        
        // Update kumis count and rate
        document.getElementById('kumis-count').textContent = `${kumisDisplay} ${getText('kumis', this.currentLang)}`;
        document.getElementById('kps-count').textContent = `${this.kumisPerSecond.toFixed(1)} ${getText('kumisPerSecond', this.currentLang)}`;

        // Update menu buttons
        document.getElementById('upgrades-btn').textContent = getText('upgrades', this.currentLang);
        document.getElementById('achievements-btn').textContent = getText('achievements', this.currentLang);
        document.getElementById('prestige-btn').textContent = getText('prestige', this.currentLang);

        // Update modal titles
        const upgradesModalTitle = document.querySelector('#upgrades-modal h2');
        const achievementsModalTitle = document.querySelector('#achievements-modal h2');
        const prestigeModalTitle = document.querySelector('#prestige-modal h2');
        if (upgradesModalTitle) upgradesModalTitle.textContent = getText('upgrades', this.currentLang);
        if (achievementsModalTitle) achievementsModalTitle.textContent = getText('achievements', this.currentLang);
        if (prestigeModalTitle) prestigeModalTitle.textContent = getText('prestige', this.currentLang);

        // Update generator buttons
        const generatorButtons = document.querySelectorAll('.buy-generator');
        generatorButtons.forEach(button => {
            const generatorId = button.dataset.id;
            const generator = this.generators.find(g => g.id === generatorId);
            if (generator) {
                const cost = this.calculateGeneratorCost(generator);
                button.disabled = this.kumisCount < cost;
                button.textContent = getText('buy', this.currentLang);
            }
        });

        // Update prestige button if it exists
        const prestigeBtn = document.getElementById('prestige-btn');
        if (prestigeBtn) {
            const canPrestigeNow = this.canPrestige();
            prestigeBtn.classList.toggle('can-prestige', canPrestigeNow);
        }

        // Update mute button
        const muteButton = document.getElementById('mute-btn');
        if (muteButton) {
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
        }
    }

    renderUpgrades() {
        const container = document.getElementById('upgrades-container');
        if (!container) return;

        container.innerHTML = '';

        this.upgrades.forEach(upgrade => {
            const isOwned = this.ownedUpgrades.has(upgrade.id);
            const canAfford = this.kumisCount >= upgrade.cost;
            const upgradeData = getText(`upgrades_data.${upgrade.id}`, this.currentLang);
            
            const upgradeElement = document.createElement('div');
            upgradeElement.className = `upgrade ${isOwned ? 'owned' : ''} ${!canAfford && !isOwned ? 'locked' : ''}`;
            upgradeElement.dataset.upgradeId = upgrade.id; // Add data attribute for identification
            if (!isOwned && canAfford) {
                upgradeElement.classList.add('can-afford');
            }

            upgradeElement.innerHTML = `
                <h3>${upgradeData.name}</h3>
                <p>${getText('cost', this.currentLang)}: ${upgrade.cost} ${getText('kumis', this.currentLang)}</p>
                <p>${upgradeData.description}</p>
            `;
            
            if (!isOwned) {
                upgradeElement.addEventListener('click', () => {
                    if (this.kumisCount >= upgrade.cost) {
                        this.buyUpgrade(upgrade.id);
                        this.renderUpgrades(); // Only re-render after purchase
                    }
                });
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
            const achievementData = getText(`achievements_data.${achievement.id}`, this.currentLang);
            
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
            achievementElement.innerHTML = `
                <h3>${achievementData.name}</h3>
                <p>${achievementData.description}</p>
                <p>${getText('bonus', this.currentLang)}: +${(achievement.bonus * 100)}% ${getText('perClick', this.currentLang)}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progressPercentage}%"></div>
                </div>
                <p>${getText('progress', this.currentLang)}: ${progress}/${achievement.clicks}</p>
            `;
            
            container.appendChild(achievementElement);
        });
    }

    calculateGeneratorCost(generator, amount = 1) {
        const owned = this.ownedGenerators[generator.id];
        let totalCost = 0;
        for (let i = 0; i < amount; i++) {
            totalCost += Math.floor(generator.baseCost * Math.pow(1.15, owned + i));
        }
        return totalCost;
    }

    buyGenerator(generatorId, amount = 1) {
        const generator = this.generators.find(g => g.id === generatorId);
        if (!generator) return false;

        const cost = this.calculateGeneratorCost(generator, amount);
        if (this.kumisCount >= cost) {
            this.kumisCount -= cost;
            this.ownedGenerators[generator.id] = (this.ownedGenerators[generator.id] || 0) + amount;
            this.updateKumisPerSecond();
            this.updateUI();
            this.saveGame();
            return true;
        }
        return false;
    }

    updateKumisPerSecond() {
        this.kumisPerSecond = 0;
        for (const generator of this.generators) {
            this.kumisPerSecond += generator.baseProduction * this.ownedGenerators[generator.id];
        }
    }

    renderGenerators() {
        const generatorsContainer = document.getElementById('generators-container');
        if (!generatorsContainer) {
            console.warn('Generators container not found');
            return;
        }

        // Create a section for generators if it doesn't exist
        let generatorsSection = document.querySelector('.generators-section');
        if (!generatorsSection) {
            generatorsSection = document.createElement('div');
            generatorsSection.className = 'generators-section';
            generatorsContainer.appendChild(generatorsSection);
        }

        // Clear existing content
        generatorsSection.innerHTML = `<h2>${getText('generators', this.currentLang)}</h2>`;

        // Create container for generator items
        const generatorsList = document.createElement('div');
        generatorsList.className = 'generators-list';

        const generatorData = {
            mare: {
                en: {
                    name: 'Mare',
                    description: 'A reliable kumis producer'
                },
                ru: {
                    name: 'Кобыла',
                    description: 'Надёжный производитель кумыса'
                }
            },
            herd: {
                en: {
                    name: 'Herd',
                    description: 'A group of mares working together'
                },
                ru: {
                    name: 'Табун',
                    description: 'Группа кобыл, работающих вместе'
                }
            },
            farm: {
                en: {
                    name: 'Farm',
                    description: 'Organized kumis production'
                },
                ru: {
                    name: 'Ферма',
                    description: 'Организованное производство кумыса'
                }
            },
            factory: {
                en: {
                    name: 'Factory',
                    description: 'Industrial-scale kumis production'
                },
                ru: {
                    name: 'Фабрика',
                    description: 'Промышленное производство кумыса'
                }
            }
        };

        for (const generator of this.generators) {
            const owned = this.ownedGenerators[generator.id] || 0;
            const cost = this.calculateGeneratorCost(generator);
            const production = (generator.baseProduction * owned).toFixed(1);
            const genData = generatorData[generator.id][this.currentLang];

            const generatorElement = document.createElement('div');
            generatorElement.className = 'generator';
            generatorElement.innerHTML = `
                <div class="generator-info">
                    <h3>${genData.name}</h3>
                    <p>${genData.description}</p>
                    <p>${getText('produces', this.currentLang)}: ${generator.baseProduction} ${getText('kumisPerSecond', this.currentLang)}</p>
                    <p>${getText('owned', this.currentLang)}: ${owned} (${getText('total', this.currentLang)}: ${production} ${getText('kumisPerSecond', this.currentLang)})</p>
                </div>
                <div class="generator-purchase">
                    <p>${getText('cost', this.currentLang)}: ${this.formatNumber(cost)} ${getText('kumis', this.currentLang)}</p>
                    <button class="buy-generator" data-id="${generator.id}" ${this.kumisCount < cost ? 'disabled' : ''}>
                        ${getText('buy', this.currentLang)}
                    </button>
                </div>
            `;
            generatorsList.appendChild(generatorElement);
        }

        generatorsSection.appendChild(generatorsList);
    }

    calculatePrestigePoints() {
        // Formula: sqrt(totalKumis / 1e12)
        // This means you need 1 trillion kumis for 1 prestige point
        return Math.floor(Math.sqrt(this.kumisCount / 1e12));
    }

    canPrestige() {
        return this.calculatePrestigePoints() > 0;
    }

    performPrestige() {
        if (!this.canPrestige()) return false;

        const newPrestigePoints = this.calculatePrestigePoints();
        
        // Update lifetime stats before reset
        this.lifetimeKumis += this.kumisCount;
        this.totalPrestigePoints += newPrestigePoints;
        this.prestigePoints += newPrestigePoints;

        // Reset basic stats
        this.kumisCount = 0;
        this.clickValue = 1;
        this.kumisPerSecond = 0;
        
        // Apply prestige bonuses
        this.applyPrestigeBonuses();

        // Reset upgrades and generators
        this.ownedUpgrades = new Set();
        this.ownedGenerators = {};
        this.generators.forEach(generator => {
            this.ownedGenerators[generator.id] = 0;
        });

        // Keep achievements
        // this.unlockedAchievements remains unchanged

        // Update UI
        this.updateUI();
        this.renderGenerators();
        this.renderUpgrades();
        this.saveGame();

        return true;
    }

    applyPrestigeBonuses() {
        // Base click value multiplier: 1 + (totalPrestigePoints * 0.1)
        // This gives +10% per prestige point
        this.clickValue *= (1 + (this.totalPrestigePoints * 0.1));
        
        // Apply other prestige bonuses based on owned prestige upgrades
        if (this.prestigeUpgrades.has('heritage')) {
            // Heritage upgrade: Keep 10% of previous generators
            this.generators.forEach(generator => {
                const previousOwned = this.ownedGenerators[generator.id];
                this.ownedGenerators[generator.id] = Math.floor(previousOwned * 0.1);
            });
        }
    }

    saveGame() {
        const gameState = {
            kumisCount: this.kumisCount,
            clickValue: this.clickValue,
            totalClicks: this.totalClicks,
            ownedUpgrades: Array.from(this.ownedUpgrades),
            unlockedAchievements: Array.from(this.unlockedAchievements),
            ownedGenerators: this.ownedGenerators,
            isMuted: this.isMuted,
            // Add prestige-related data
            prestigePoints: this.prestigePoints,
            totalPrestigePoints: this.totalPrestigePoints,
            prestigeUpgrades: Array.from(this.prestigeUpgrades),
            lifetimeKumis: this.lifetimeKumis
        };
        localStorage.setItem('kumisGameSave', JSON.stringify(gameState));
    }

    loadGame() {
        const savedState = localStorage.getItem('kumisGameSave');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            this.kumisCount = gameState.kumisCount || 0;
            this.clickValue = gameState.clickValue || 1;
            this.totalClicks = gameState.totalClicks || 0;
            this.ownedUpgrades = new Set(gameState.ownedUpgrades || []);
            this.unlockedAchievements = new Set(gameState.unlockedAchievements || []);
            this.ownedGenerators = gameState.ownedGenerators || {};
            this.isMuted = gameState.isMuted || false;
            
            // Load prestige-related data
            this.prestigePoints = gameState.prestigePoints || 0;
            this.totalPrestigePoints = gameState.totalPrestigePoints || 0;
            this.prestigeUpgrades = new Set(gameState.prestigeUpgrades || []);
            this.lifetimeKumis = gameState.lifetimeKumis || 0;

            // Initialize any missing generators
            this.generators.forEach(generator => {
                if (typeof this.ownedGenerators[generator.id] === 'undefined') {
                    this.ownedGenerators[generator.id] = 0;
                }
            });

            // Update game state
            this.updateKumisPerSecond();
            this.renderGenerators();
            this.renderUpgrades();
            this.renderAchievements();
        }
    }

    updateLanguageButton() {
        const langButton = document.getElementById('lang-btn');
        langButton.textContent = `🌐 ${this.currentLang.toUpperCase()}`;
    }

    // Add this helper method to format large numbers
    formatNumber(num) {
        if (num >= 1e12) {
            return (num / 1e12).toFixed(2) + 'T';
        } else if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(0);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new KumisGame();
    
    // Save game state periodically
    setInterval(() => game.saveGame(), 3000);
}); 