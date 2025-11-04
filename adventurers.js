// Adventurer System for Guild Master RPG
class AdventurerSystem {
    constructor() {
        this.adventurers = [];
        this.recruitmentPool = [];
        this.initializeRecruitmentPool();
    }

    // Sample data for adventurer generation
    nameParts = {
        firstNames: ["Kaelen", "Lyra", "Thorne", "Elara", "Garrick", "Sylvia", "Dorian", "Isolde", "Finn", "Morgan"],
        lastNames: ["Ironheart", "Swiftarrow", "Stormweaver", "Blackwood", "Brightblade", "Frostmane", "Shadowstep", "Runebreaker"]
    };

    classes = [
        { id: "warrior", name: "Warrior", specialties: ["Vanguard", "Berserker", "Guardian"] },
        { id: "mage", name: "Mage", specialties: ["Elementalist", "Necromancer", "Illusionist"] },
        { id: "rogue", name: "Rogue", specialties: ["Assassin", "Scout", "Trickster"] },
        { id: "ranger", name: "Ranger", specialties: ["Beastmaster", "Sharpshooter", "Survivalist"] }
    ];

    traits = ["Brave", "Cautious", "Ambitious", "Loyal", "Reckless", "Witty", "Stoic", "Cheerful"];
    hobbies = ["Weapon Maintenance", "Reading", "Fishing", "Cooking", "Music", "Herbology", "Gambling"];

    // Generate a random adventurer
    generateAdventurer(questId = null) {
        const firstName = this.nameParts.firstNames[Math.floor(Math.random() * this.nameParts.firstNames.length)];
        const lastName = this.nameParts.lastNames[Math.floor(Math.random() * this.nameParts.lastNames.length)];
        const adventurerClass = this.classes[Math.floor(Math.random() * this.classes.length)];
        const specialty = adventurerClass.specialties[Math.floor(Math.random() * adventurerClass.specialties.length)];
        
        const id = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            id: id,
            name: `${firstName} ${lastName}`,
            class: adventurerClass.id,
            specialization: specialty,
            bio: `A ${adventurerClass.name.toLowerCase()} specializing in ${specialty.toLowerCase()}.`,
            
            // Core stats (1-100 scale)
            stats: {
                strength: Math.floor(Math.random() * 30) + 40,
                agility: Math.floor(Math.random() * 30) + 40,
                intellect: Math.floor(Math.random() * 30) + 40,
                charisma: Math.floor(Math.random() * 30) + 40
            },
            
            // Social stats
            social: {
                affection: 0,
                comfort: 50,
                trust: 50,
                loyalty: 50
            },
            
            // Skills and progression
            skills: {
                combat: { level: 1, xp: 0, maxXp: 100 },
                survival: { level: 1, xp: 0, maxXp: 100 },
                leadership: { level: 1, xp: 0, maxXp: 100 }
            },
            
            // Personalization
            personalityTraits: this.getRandomTraits(2),
            hobbies: this.getRandomHobbies(2),
            giftPreferences: this.generateGiftPreferences(),
            
            // Career
            salary: 50,
            rank: "Recruit",
            assignedQuestId: questId,
            hireCost: 100,
            hired: false
        };
    }

    getRandomTraits(count) {
        const shuffled = [...this.traits].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    getRandomHobbies(count) {
        const shuffled = [...this.hobbies].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    generateGiftPreferences() {
        const giftTypes = ["PRACTICAL", "MAGICAL", "LUXURY", "ROMANTIC", "FOOD", "WEAPONS"];
        const shuffled = [...giftTypes].sort(() => 0.5 - Math.random());
        
        return {
            loves: [shuffled[0]],
            neutral: shuffled.slice(1, 4),
            hates: [shuffled[5]]
        };
    }

    // Initialize recruitment pool
    initializeRecruitmentPool() {
        this.recruitmentPool = [
            this.generateAdventurer(),
            this.generateAdventurer(),
            this.generateAdventurer()
        ];
    }

    // Hire an adventurer
    hireAdventurer(adventurerId) {
        const adventurer = this.recruitmentPool.find(adv => adv.id === adventurerId);
        
        if (adventurer && saveSystem.gameState.gold >= adventurer.hireCost) {
            saveSystem.gameState.gold -= adventurer.hireCost;
            adventurer.hired = true;
            adventurer.hireDate = Date.now();
            
            // Move from recruitment pool to active adventurers
            this.recruitmentPool = this.recruitmentPool.filter(adv => adv.id !== adventurerId);
            this.adventurers.push(adventurer);
            
            // Refresh recruitment pool
            this.recruitmentPool.push(this.generateAdventurer());
            
            console.log(`Hired ${adventurer.name} the ${adventurer.specialization} ${adventurer.class}`);
            return true;
        }
        return false;
    }

    // Assign adventurer to a quest
    assignToQuest(adventurerId, questId) {
        const adventurer = this.adventurers.find(adv => adv.id === adventurerId);
        
        // Check if questSystem is available
        if (typeof questSystem === 'undefined') {
            console.error('Quest system not available');
            return false;
        }
        
        const quest = questSystem.getQuest(questId);
        
        if (adventurer && quest) {
            adventurer.assignedQuestId = questId;
            questSystem.hireManager(questId, adventurerId);
            return true;
        }
        return false;
    }

    // Get adventurer by ID
    getAdventurer(adventurerId) {
        return this.adventurers.find(adv => adv.id === adventurerId) || 
               this.recruitmentPool.find(adv => adv.id === adventurerId);
    }

    // Get adventurers assigned to a quest
    getAdventurersByQuest(questId) {
        return this.adventurers.filter(adv => adv.assignedQuestId === questId);
    }

    // Give gift to adventurer
    giveGift(adventurerId, giftType) {
        const adventurer = this.getAdventurer(adventurerId);
        if (!adventurer) return false;

        const preferences = adventurer.giftPreferences;
        let affectionGain = 0;

        if (preferences.loves.includes(giftType)) {
            affectionGain = 15;
        } else if (preferences.neutral.includes(giftType)) {
            affectionGain = 5;
        } else if (preferences.hates.includes(giftType)) {
            affectionGain = -10;
        }

        adventurer.social.affection = Math.max(0, Math.min(100, adventurer.social.affection + affectionGain));
        return affectionGain;
    }
}

// Create global instance
const adventurerSystem = new AdventurerSystem();
