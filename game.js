// Floob's Paint Run - Game Logic

'use strict';

// --- Constants ---
const PLAYER_HITBOX_WIDTH = Math.round(143 * 0.8); const PLAYER_HITBOX_HEIGHT = Math.round(176 * 0.8);
const PLAYER_SCALE = 0.8;
const spriteVisualDimensions = { /* ... dimensions ... */ floobIdle: { w: 143, h: 176 }, floobRun1: { w: 179, h: 176 }, floobRun2: { w: 170, h: 181 }, floobJump: { w: 176, h: 176 }, floobPowerupGet: { w: 180, h: 198 }, floobPowerupGet2: { w: 180, h: 198 }, floobPowerupIdle: { w: 158, h: 190 }, floobPowerupRun1: { w: 194, h: 190 }, floobPowerupRun2: { w: 185, h: 196 }, floobPowerupJump: { w: 191, h: 191 }, win_pose: { w: 160, h: 180 }, floob_dies: { w: 151, h: 187 }, splat_1: { w: 150, h: 150 }, splat_2: { w: 150, h: 150 }, splat_3: { w: 150, h: 150 }, splat_4: { w: 150, h: 150 }, paintDropletYellow: { w: 86, h: 118 }, paintDropletPink: { w: 86, h: 118 }, paintDropletTeal: { w: 86, h: 118 }, platform_teal_long: { w: 459, h: 110 }, platform_teal_medium: { w: 211, h: 103 }, platform_teal_short: { w: 117, h: 95 }, platform_multi_base: { w: 292, h: 291 }, goal_orb: { w: 266, h: 266 }, greyGlob: { w: 137, h: 186 }, candy_cane: { w: 205, h: 308 }, cactus: { w: 122, h: 194 }, cloud_green: { w: 126, h: 119 }, cloud_orange: { w: 111, h: 96 }, cloud_pink: { w: 126, h: 119 }, cloud_red: { w: 143, h: 123 }, cloud_teal: { w: 125, h: 119 }, drippingtree: { w: 241, h: 225 }, fungus: { w: 89, h: 220 }, house_bucket: { w: 173, h: 189 }, palmtree: { w: 172, h: 222 }, pineapple_plant: { w: 151, h: 260 }, threedrippingball: { w: 136, h: 222 }, chromia: { w: 3500, h: 1959 }, instructions: { w: 1900, h: 1267 }, title_screen: { w: 1000, h: 600 }, congratulations: { w: 700, h: 467 }, facebook_icon: { w: 48, h: 48 }, instagram_icon: { w: 48, h: 48 } };
const DROPLET_KEYS = ['paintDropletYellow', 'paintDropletPink', 'paintDropletTeal'];
const CLOUD_KEYS = ['cloud_green', 'cloud_orange', 'cloud_pink', 'cloud_red', 'cloud_teal'];
const PLANT_KEYS = ['cactus', 'drippingtree', 'fungus', 'palmtree', 'pineapple_plant', 'threedrippingball', 'candy_cane'];
const splatFrames = ['splat_1', 'splat_2', 'splat_3', 'splat_4'];
const SPLAT_ANIM_INTERVAL = 40; const DEATH_FALL_DURATION = 1500; const DEATH_BOUNCE_POWER = -10;
const CANVAS_WIDTH = 1000; const CANVAS_HEIGHT = 600; const LEVEL_WIDTH = 6000;
const POWERUP_ANIM_DURATION = 900; const POWERUP_DURATION = 5000;
const PLAYER_SPEED = 5; const GRAVITY = 0.7; const JUMP_POWER = (23.4 * 0.8) * 0.9;
const PLAYER_RUN_FRAME_INTERVAL = 100; const DROPLETS_TO_POWERUP = 3;
const ENEMY_VISUAL_SCALE = 0.75; const ENEMY_HITBOX_WIDTH = Math.round(spriteVisualDimensions.greyGlob.w * ENEMY_VISUAL_SCALE); const ENEMY_HITBOX_HEIGHT = Math.round(spriteVisualDimensions.greyGlob.h * ENEMY_VISUAL_SCALE); const ENEMY_SPEED = 1.5;
const PARALLAX_FACTOR_CLOUDS = 0.1; const PARALLAX_FACTOR_PLANTS_MIN = 0.3; const PARALLAX_FACTOR_PLANTS_MAX = 0.5;
const COLLECTIBLE_SCALE = 0.75; const GOAL_SCALE_INCREASE = 1.4; const GOAL_ROTATION_SPEED = 0.01;
const SCREEN_FLASH_COLOR = 'rgba(152, 249, 235, 0.4)'; const POWERUP_FLASH_INTERVAL = 100;
const GOAL_POPUP_DURATION = 4000; // NEW: 4 seconds for goal popup

// --- Global Variables ---
let canvas = null; let ctx = null; let gameState = 'loading'; let assets = {}; let lastTime = 0; let player = null; const keysPressed = {}; let platforms = [];
let dropletDefinitions = []; let totalDropletsInLevel = 0;
let enemies = []; let parallaxLayers = []; let cameraX = 0; let gameInitialized = false;
let goal = null; let goalRotationAngle = 0; let goalEntryBlockedUntilLeave = false;
let currentSaturationFilter = 'saturate(0%)'; let drawFlashOverlay = false;
let deathStateTimer = 0;

// --- DOM Elements ---
let introScreenElement = null; let startButtonElement = null; let gameContainerElement = null;
let winScreenElement = null; let goalPopupElement = null; let popupTimeoutId = null;
let introTransitionElement = null; let playAgainButtonElement = null;
let instagramPopupElement = null; // NEW
let instagramShareLinkElement = null; // NEW
let closeIgPopupButtonElement = null; // NEW

// --- Asset Loading ---
const assetList = Object.keys(spriteVisualDimensions).map(name => { const filename = name.replace(/([A-Z])/g, '_$1').toLowerCase(); const extension = (['chromia', 'instructions', 'title_screen', 'congratulations'].includes(name)) ? '.jpg' : '.png'; return { name: name, src: `assets/${filename}${extension}` }; });
let assetsLoadedCount = 0;
function loadAssets(callback) { /* ... Keep existing loadAssets ... */ console.log("Starting asset loading..."); if (assetList.length === 0) { console.log("No assets to load."); if (callback) callback(); return; } assetsLoadedCount = 0; assets = {}; assetList.forEach(assetInfo => { const img = new Image(); img.src = assetInfo.src; img.onload = () => { assetsLoadedCount++; assets[assetInfo.name] = img; if (assetsLoadedCount === assetList.length) { console.log("All assets loaded successfully!"); if (callback) callback(); } }; img.onerror = () => { console.error(`Failed to load asset: ${assetInfo.name} at ${assetInfo.src}`); assetsLoadedCount++; if (assetsLoadedCount === assetList.length) { console.warn("Asset loading finished, but with errors."); if (callback) callback(); } }; }); }

// --- Game State Management ---
function changeState(newState) {
    console.log(`Attempting state change from ${gameState} to ${newState}`);
    const oldState = gameState;
    if (oldState === newState && newState !== 'loading') { return; }

    // --- Cleanup based on OLD state ---
    if (oldState === 'instructions') { window.removeEventListener('keydown', handleInstructionsInput); window.removeEventListener('mousedown', handleInstructionsInput); }
    if (oldState === 'win') {
         if (playAgainButtonElement) playAgainButtonElement.removeEventListener('click', handlePlayAgain);
         if (instagramShareLinkElement) instagramShareLinkElement.removeEventListener('click', handleInstagramClick); // Remove IG listener
         if (closeIgPopupButtonElement) closeIgPopupButtonElement.removeEventListener('click', handleCloseIgPopup); // Remove close listener
         if (winScreenElement) winScreenElement.classList.add('hidden');
         if (instagramPopupElement) instagramPopupElement.classList.add('hidden'); // Ensure IG popup is hidden too
    }
     if (oldState === 'playing') { drawFlashOverlay = false; if(player && player.isDying) player.isDying = false; }

    gameState = newState;
    console.log(`State successfully changed to: ${gameState}`);

    // --- Find Elements ---
    introScreenElement = document.getElementById('intro-screen');
    winScreenElement = document.getElementById('win-screen');
    startButtonElement = document.getElementById('start-button');
    goalPopupElement = document.getElementById('goal-popup');
    introTransitionElement = document.getElementById('intro-transition');
    playAgainButtonElement = document.getElementById('play-again-button');
    instagramPopupElement = document.getElementById('instagram-popup'); // Find IG popup
    instagramShareLinkElement = document.getElementById('instagram-share-link'); // Find IG link
    closeIgPopupButtonElement = document.getElementById('close-ig-popup'); // Find close button

    // --- Hide Overlays ---
    if (winScreenElement) winScreenElement.classList.add('hidden');
    if (goalPopupElement && !goalPopupElement.classList.contains('hidden')) { clearTimeout(popupTimeoutId); goalPopupElement.classList.add('hidden'); }
    if (newState !== 'instructions' && introScreenElement) { introScreenElement.classList.add('hidden'); }
    if (introTransitionElement && !introTransitionElement.classList.contains('active')) { introTransitionElement.classList.add('hidden'); }
    if (instagramPopupElement) instagramPopupElement.classList.add('hidden'); // Hide IG popup by default


    // --- State Entry Logic ---
    switch (gameState) {
        case 'loading': drawLoadingScreen(); break;
        case 'intro':
            clearCanvas();
            if (introScreenElement) introScreenElement.classList.remove('hidden');
            if (introTransitionElement) introTransitionElement.classList.add('hidden'); if (introTransitionElement) introTransitionElement.classList.remove('active');
            if (startButtonElement) startButtonElement.disabled = false;
            break;
        case 'instructions':
            clearCanvas(); drawInstructionsScreen(); setupInstructionsListeners();
            break;
        case 'playing':
            if (oldState !== 'playing') { initializeGameData(); if (gameState === 'playing') { lastTime = performance.now(); requestAnimationFrame(gameLoop); } }
            break;
        case 'win':
            console.log("State: Win - Showing win screen overlay & attaching listeners.");
            if (winScreenElement) winScreenElement.classList.remove('hidden');
             // Add listeners for buttons on win screen
             if (playAgainButtonElement) { playAgainButtonElement.addEventListener('click', handlePlayAgain); }
             else { console.warn("Play Again button not found for listener."); }
             if (instagramShareLinkElement) { instagramShareLinkElement.addEventListener('click', handleInstagramClick); }
             else { console.warn("Instagram share link not found for listener."); }
             if (closeIgPopupButtonElement) { closeIgPopupButtonElement.addEventListener('click', handleCloseIgPopup); }
             else { console.warn("Close IG Popup button not found for listener."); }
            break;
        default: console.error(`Invalid game state transition: ${newState}`); gameState = oldState;
    }
}

// --- Intro Transition Handler ---
function triggerIntroTransition() { /* ... Keep existing ... */ if (!introTransitionElement || !introScreenElement) { console.warn("Cannot trigger intro transition - elements missing."); changeState('instructions'); return; } console.log("Triggering intro transition..."); introTransitionElement.classList.remove('hidden'); introTransitionElement.classList.add('active'); setTimeout(() => { if (introScreenElement) { introScreenElement.classList.add('hidden'); } changeState('instructions'); setTimeout(() => { if (introTransitionElement) { introTransitionElement.classList.remove('active'); setTimeout(() => { if (introTransitionElement) introTransitionElement.classList.add('hidden'); }, 400); } }, 50); }, 400); }

// --- Initialization --- (No changes needed in these core init functions)
function initializeStaticElements() { if (gameInitialized) { return; } console.log("===== Initializing Static Elements ====="); try { console.log(" -> Initializing Platforms..."); initializePlatforms(); console.log(" -> Initializing Parallax Layers..."); initializeParallaxLayers(); console.log(" -> Defining Collectibles..."); defineCollectibles(); console.log(` -> Finished Defining Collectibles. totalDropletsInLevel = ${totalDropletsInLevel}`); gameInitialized = true; console.log("===== Static Elements Initialized Successfully ====="); } catch (error) { console.error("CRITICAL ERROR during static element initialization:", error); gameInitialized = false; } }
function initializePlatforms() { platforms = []; const groundLevelY = CANVAS_HEIGHT - (spriteVisualDimensions.platform_teal_long.h * 0.8); const groundWidth = spriteVisualDimensions.platform_teal_long.w; for (let x = -groundWidth * 2; x < LEVEL_WIDTH + groundWidth; x += groundWidth) { platforms.push({ x: x, y: groundLevelY, width: groundWidth, height: spriteVisualDimensions.platform_teal_long.h, spriteKey: 'platform_teal_long', isMoving: false }); } const longPlat = spriteVisualDimensions.platform_teal_long; const medPlat = spriteVisualDimensions.platform_teal_medium; const shortPlat = spriteVisualDimensions.platform_teal_short; const multiPlat = spriteVisualDimensions.platform_multi_base; const platformDefinitions = [ { x: 300, y: CANVAS_HEIGHT - 220, dim: longPlat, key: 'platform_teal_long' }, { x: 950, y: CANVAS_HEIGHT - 350, dim: shortPlat, key: 'platform_teal_short' }, { x: 50, y: CANVAS_HEIGHT - 380, dim: shortPlat, key: 'platform_teal_short' }, { x: 2000, y: CANVAS_HEIGHT - 180, dim: longPlat, key: 'platform_teal_long' }, { x: 2500, y: CANVAS_HEIGHT - 450, dim: multiPlat, key: 'platform_multi_base' }, { x: 3300, y: CANVAS_HEIGHT - 420, dim: shortPlat, key: 'platform_teal_short' }, { x: 3800, y: CANVAS_HEIGHT - 200, dim: longPlat, key: 'platform_teal_long' }, { x: 4500, y: CANVAS_HEIGHT - 350, dim: multiPlat, key: 'platform_multi_base' }, { x: 5000, y: CANVAS_HEIGHT - 250, dim: medPlat, key: 'platform_teal_medium' }, { x: LEVEL_WIDTH - shortPlat.w - 50, y: CANVAS_HEIGHT - 400, dim: shortPlat, key: 'platform_teal_short' }, { x: 1100, y: CANVAS_HEIGHT - 250, dim: medPlat, key: 'platform_teal_medium', isMoving: true, moveAxis: 'x', minPos: 1100, maxPos: 1350, speed: 1.8, direction: 1 }, { x: 1700, y: CANVAS_HEIGHT - 300, dim: medPlat, key: 'platform_teal_medium', isMoving: true, moveAxis: 'x', minPos: 1600, maxPos: 1900, speed: 1.2, direction: -1 }, { x: 3000, y: CANVAS_HEIGHT - 280, dim: medPlat, key: 'platform_teal_medium', isMoving: true, moveAxis: 'y', minPos: CANVAS_HEIGHT - 400, maxPos: CANVAS_HEIGHT - 200, speed: 1.0, direction: 1 } ]; platformDefinitions.forEach(p => { if (p.dim) { const platformData = { x: p.x, y: p.y, width: p.dim.w, height: p.dim.h, spriteKey: p.key, isMoving: p.isMoving || false, moveAxis: p.moveAxis || null, minPos: p.minPos || p.x, maxPos: p.maxPos || p.x, speed: p.speed || 0, direction: p.direction || 1 }; platforms.push(platformData); } }); }
function defineCollectibles() { console.log("  [Define Collectibles] Starting..."); dropletDefinitions = []; const baseDropletDim = spriteVisualDimensions.paintDropletYellow; if (!baseDropletDim) { return; } const scaledWidth = Math.round(baseDropletDim.w * COLLECTIBLE_SCALE); const scaledHeight = Math.round(baseDropletDim.h * COLLECTIBLE_SCALE); let positions = [ { platX: 300, offset: 100 }, { platX: 950 }, { platX: 50 }, { platX: 1100 }, { platX: 1400 }, { platX: 1700 }, { platX: 2000, offset: 50 }, { platX: 2500, offset: 70 }, { platX: 3300 }, { platX: 3800, offset: 150 }, { platX: 4500, offset: 80 }, { platX: 5000 } ]; positions.push({ exactX: 3550, exactY: CANVAS_HEIGHT - 530 }); positions.push({ exactX: 1900, exactY: CANVAS_HEIGHT - 480 }); console.log(`  [Define Collectibles] Total positions: ${positions.length}`); positions.forEach((pos, index) => { let placeX, placeY; let foundSpot = false; if (pos.exactX !== undefined && pos.exactY !== undefined) { placeX = pos.exactX; placeY = pos.exactY; foundSpot = true; } else if (pos.platX !== undefined) { const plat = platforms.find(p => !p.isMoving && p.x <= pos.platX && p.x + p.width >= pos.platX); if (plat) { placeX = plat.x + (plat.width / 2) - (scaledWidth / 2) + (pos.offset || 0); placeY = plat.y - scaledHeight - 10; foundSpot = true; } else { console.warn(`[Define Collectibles] Failed for droplet ${index + 1} near x=${pos.platX}.`); } } if (foundSpot) { const randomKey = DROPLET_KEYS[Math.floor(Math.random() * DROPLET_KEYS.length)]; dropletDefinitions.push({ id: `droplet-${index}`, x: placeX, y: placeY, width: scaledWidth, height: scaledHeight, spriteKey: randomKey, collected: false }); } }); totalDropletsInLevel = dropletDefinitions.length; console.log(`  [Define Collectibles] Finished. Defined ${totalDropletsInLevel} droplets.`); if (totalDropletsInLevel <= positions.length - 2) { console.error("[Define Collectibles] CRITICAL WARNING: Fewer droplets defined than expected!"); } }
function initializeCollectibles() { console.log(" -> Resetting collectible states..."); dropletDefinitions.forEach(droplet => { droplet.collected = false; }); }
function initializeEnemies() { enemies = []; const globVisualDim = spriteVisualDimensions.greyGlob; if (!globVisualDim) { return; } const enemyPositions = [ 300, 2000, 3800, 4500, 5000 ]; enemyPositions.forEach(platformX => { const plat = platforms.find(p => !p.isMoving && p.x <= platformX && p.x + p.width >= platformX && p.height < 200); if (plat) { const buffer = 30; const patrolMinX = plat.x + buffer; const patrolMaxX = plat.x + plat.width - ENEMY_HITBOX_WIDTH - buffer; if (patrolMaxX > patrolMinX + 10) { const startX = patrolMinX + Math.random() * (patrolMaxX - patrolMinX); const startY = plat.y - ENEMY_HITBOX_HEIGHT; const direction = (Math.random() < 0.5) ? 1 : -1; enemies.push({ id: `glob${enemies.length+1}`, x: startX, y: startY, width: ENEMY_HITBOX_WIDTH, height: ENEMY_HITBOX_HEIGHT, visualWidth: globVisualDim.w, visualHeight: globVisualDim.h, spriteKey: 'greyGlob', speed: ENEMY_SPEED * (0.8 + Math.random()*0.4), direction: direction, minX: patrolMinX, maxX: patrolMaxX, isActive: true, isSplatting: false, splatAnimTimer: 0, splatFrame: 0 }); } } }); }
function initializeParallaxLayers() { parallaxLayers = []; const groundPlatform = platforms.find(p => p.spriteKey === 'platform_teal_long' && p.y > CANVAS_HEIGHT / 2); const groundLevelY = groundPlatform ? groundPlatform.y : CANVAS_HEIGHT - 50; for (let i = 0; i < 8; i++) { const cloudKey = CLOUD_KEYS[Math.floor(Math.random() * CLOUD_KEYS.length)]; const cloudDim = spriteVisualDimensions[cloudKey]; if (!cloudDim) { continue; } const factor = PARALLAX_FACTOR_CLOUDS + Math.random() * 0.05; parallaxLayers.push({ x: Math.random() * LEVEL_WIDTH * 1.2 - LEVEL_WIDTH * 0.1, y: 50 + Math.random() * 150, width: cloudDim.w, height: cloudDim.h, spriteKey: cloudKey, parallaxFactor: factor }); } for (let i = 0; i < 12; i++) { const plantKey = PLANT_KEYS[Math.floor(Math.random() * PLANT_KEYS.length)]; const plantDim = spriteVisualDimensions[plantKey]; if (!plantDim) { continue; } const plantX = 50 + Math.random() * (LEVEL_WIDTH - 100); let yOffset = plantDim.h - 20; if (plantKey === 'candy_cane') yOffset = plantDim.h - 75; if (plantKey === 'fungus') yOffset = plantDim.h - 10; const factor = PARALLAX_FACTOR_PLANTS_MIN + Math.random() * (PARALLAX_FACTOR_PLANTS_MAX - PARALLAX_FACTOR_PLANTS_MIN); parallaxLayers.push({ x: plantX, y: groundLevelY - yOffset, width: plantDim.w, height: plantDim.h, spriteKey: plantKey, parallaxFactor: factor }); } parallaxLayers.sort((a, b) => a.parallaxFactor - b.parallaxFactor); }
function initializeGameData() { console.log("===== Running initializeGameData ====="); if (!gameInitialized) { changeState('loading'); return; } console.log(" -> Initializing platforms..."); initializePlatforms(); initializeCollectibles(); console.log(" -> Initializing enemies..."); initializeEnemies(); console.log(" -> Resetting Player..."); player = { x: 100, y: 50, width: PLAYER_HITBOX_WIDTH, height: PLAYER_HITBOX_HEIGHT, vx: 0, vy: 0, speed: PLAYER_SPEED, jumpPower: JUMP_POWER, gravity: GRAVITY, isGrounded: false, groundedOnPlatform: null, isPowerupAnimating: false, powerupAnimTimer: 0, powerupAnimFrame: 0, isPoweredUp: false, powerUpTimer: 0, action: 'idle', facingDirection: 1, spriteFrame: 0, frameTimer: 0, frameInterval: PLAYER_RUN_FRAME_INTERVAL, collectedThisAttempt: 0, isFrozenInWin: false, isDying: false, deathAnimTimer: 0, deathSaturation: 0 }; console.log(" -> Resetting Keys..."); for (const key in keysPressed) { keysPressed[key] = false; } console.log(" -> Initializing Goal..."); const goalBaseDim = spriteVisualDimensions.goal_orb; const goalPlatform = platforms.find(p => p.x > LEVEL_WIDTH - 500 && p.spriteKey === 'platform_teal_short'); if (!goalPlatform || !goalBaseDim) { goal = null; } else { const goalWidth = Math.round(goalBaseDim.w * GOAL_SCALE_INCREASE); const goalHeight = Math.round(goalBaseDim.h * GOAL_SCALE_INCREASE); goal = { x: goalPlatform.x + (goalPlatform.width / 2) - (goalWidth / 2), y: goalPlatform.y - goalHeight + 60, width: goalWidth, height: goalHeight, spriteKey: 'goal_orb' }; } console.log(" -> Resetting Camera & Other State..."); cameraX = 0; goalRotationAngle = 0; goalEntryBlockedUntilLeave = false; currentSaturationFilter = 'saturate(0%)'; console.log(" -> Finding Goal Popup Element..."); goalPopupElement = document.getElementById('goal-popup'); if (!goalPopupElement) { console.error("Goal popup element not found!"); } console.log(" -> Performing Final Sanity Checks..."); if (totalDropletsInLevel <= 0) { console.error("ABORTING START: totalDropletsInLevel <= 0."); changeState('intro'); return; } if (!goal) { console.error("ABORTING START: Goal is null."); changeState('intro'); return; } console.log("===== Dynamic Game Data Initialization Complete ====="); }

// --- Helper Function: Trigger Power Up ---
function triggerPowerUp() { if (!player || player.isPoweredUp || player.isPowerupAnimating) return; console.log(">>> Power-Up Animation Sequence Triggered! <<<"); player.isPowerupAnimating = true; player.powerupAnimTimer = POWERUP_ANIM_DURATION; player.powerupAnimFrame = 0; player.vx = 0; player.vy = 0; player.action = 'idle'; }

// --- Drawing Functions --- (No changes needed)
function clearCanvas() { if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }
function drawLoadingScreen() { if (!ctx) return; clearCanvas(); ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#FFF'; ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2); }
function drawInstructionsScreen() { if (!ctx) return; const instructionsImg = assets.instructions; if (instructionsImg) { clearCanvas(); const imgAspect = instructionsImg.width / instructionsImg.height; const canvasAspect = canvas.width / canvas.height; let drawWidth, drawHeight, drawX, drawY; if (imgAspect > canvasAspect) { drawWidth = canvas.width; drawHeight = drawWidth / imgAspect; drawX = 0; drawY = (canvas.height - drawHeight) / 2; } else { drawHeight = canvas.height; drawWidth = drawHeight * imgAspect; drawX = (canvas.width - drawWidth) / 2; drawY = 0; } ctx.drawImage(instructionsImg, drawX, drawY, drawWidth, drawHeight); } else { ctx.fillStyle = '#555'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#FFF'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText("Instructions Image Missing", canvas.width / 2, canvas.height / 2 - 20); ctx.font = '18px sans-serif'; ctx.fillText("Press any key or click to start", canvas.width / 2, canvas.height / 2 + 20); } }
function drawBackground() { if (!ctx) return; ctx.filter = currentSaturationFilter; const bg = assets.chromia; if (bg) { const canvasAspect = canvas.width / canvas.height; const bgAspect = spriteVisualDimensions.chromia.w / spriteVisualDimensions.chromia.h; let drawWidth, drawHeight, drawX, drawY; if (bgAspect > canvasAspect) { drawHeight = canvas.height; drawWidth = drawHeight * bgAspect; drawX = (canvas.width - drawWidth) / 2; drawY = 0; } else { drawWidth = canvas.width; drawHeight = drawWidth / bgAspect; drawX = 0; drawY = (canvas.height - drawHeight) / 2; } ctx.drawImage(bg, drawX, drawY, drawWidth, drawHeight); } else { ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height); } ctx.filter = 'none'; }
function drawParallaxLayers() { if (!ctx || !parallaxLayers) return; ctx.filter = currentSaturationFilter; parallaxLayers.forEach(layer => { const sprite = assets[layer.spriteKey]; if (sprite) { const drawX = layer.x - cameraX * layer.parallaxFactor; if (drawX + layer.width > 0 && drawX < canvas.width) { ctx.drawImage(sprite, Math.round(drawX), layer.y, layer.width, layer.height); } } }); ctx.filter = 'none'; }
function drawPlatforms() { if (!ctx || !platforms) return; ctx.filter = currentSaturationFilter; platforms.forEach(platform => { const sprite = assets[platform.spriteKey]; const drawX = platform.x - cameraX; if (drawX + platform.width > 0 && drawX < canvas.width) { if (sprite) { ctx.drawImage(sprite, Math.round(drawX), platform.y, platform.width, platform.height); } else { ctx.fillStyle = '#8B4513'; ctx.fillRect(Math.round(drawX), platform.y, platform.width, platform.height); } } }); ctx.filter = 'none'; }
function drawCollectibles() { if (!ctx || !dropletDefinitions) return; dropletDefinitions.forEach(item => { if (!item.collected) { const sprite = assets[item.spriteKey]; const drawX = item.x - cameraX; if (drawX + item.width > 0 && drawX < canvas.width) { if (sprite) { ctx.drawImage(sprite, Math.round(drawX), item.y, item.width, item.height); } else { ctx.fillStyle = 'magenta'; ctx.fillRect(Math.round(drawX), item.y, item.width, item.height); } } } }); }
function drawEnemies() { if (!ctx || !enemies) return; ctx.filter = currentSaturationFilter; enemies.forEach(enemy => { if (enemy.isActive) { if (enemy.isSplatting) { const splatKey = splatFrames[enemy.splatFrame]; const sprite = assets[splatKey]; const dims = spriteVisualDimensions[splatKey]; if (sprite && dims) { const drawX = enemy.x - cameraX + (enemy.width / 2) - (dims.w / 2); const drawY = enemy.y + (enemy.height / 2) - (dims.h / 2); ctx.drawImage(sprite, Math.round(drawX), Math.round(drawY), dims.w, dims.h); } } else { const sprite = assets[enemy.spriteKey]; const drawX = enemy.x - cameraX; const targetVisualWidth = enemy.visualWidth * ENEMY_VISUAL_SCALE; const targetVisualHeight = enemy.visualHeight * ENEMY_VISUAL_SCALE; if (drawX + enemy.width > 0 && drawX < canvas.width) { if (sprite) { ctx.save(); const drawVisualX = drawX - (targetVisualWidth - enemy.width) / 2; const drawVisualY = enemy.y - (targetVisualHeight - enemy.height); if (enemy.direction === -1) { ctx.translate(Math.round(drawVisualX) + targetVisualWidth, drawVisualY); ctx.scale(-1, 1); ctx.drawImage(sprite, 0, 0, targetVisualWidth, targetVisualHeight); } else { ctx.drawImage(sprite, Math.round(drawVisualX), drawVisualY, targetVisualWidth, targetVisualHeight); } ctx.restore(); } else { ctx.fillStyle = 'red'; ctx.fillRect(Math.round(drawX), enemy.y, enemy.width, enemy.height); } } } } }); ctx.filter = 'none'; }
function drawPlayer() { if (!ctx || !player) return; let spriteKey = ''; let applyFilter = true; let filterToUse = currentSaturationFilter; if (player.isDying) { spriteKey = 'floob_dies'; const deathProgress = Math.min(1, player.deathAnimTimer / DEATH_FALL_DURATION); const dyingSaturation = 100 * (1 - deathProgress); filterToUse = `saturate(${dyingSaturation.toFixed(0)}%)`; applyFilter = true; } else if (gameState === 'win' && player.isFrozenInWin) { spriteKey = 'win_pose'; applyFilter = true; } else if (player.isPowerupAnimating) { spriteKey = (player.powerupAnimFrame === 0) ? 'floobPowerupGet' : 'floobPowerupGet2'; applyFilter = true; } else if (player.isPoweredUp) { let currentAction = player.action; if (currentAction === 'jumping') spriteKey = 'floobPowerupJump'; else if (currentAction === 'running') spriteKey = (player.spriteFrame === 0) ? 'floobPowerupRun1' : 'floobPowerupRun2'; else spriteKey = 'floobPowerupIdle'; applyFilter = true; } else { let currentAction = player.action; if (currentAction === 'jumping') spriteKey = 'floobJump'; else if (currentAction === 'running') spriteKey = (player.spriteFrame === 0) ? 'floobRun1' : 'floobRun2'; else spriteKey = 'floobIdle'; applyFilter = true; } if (applyFilter) ctx.filter = filterToUse; const spriteToDraw = assets[spriteKey]; const baseVisualDimensions = spriteVisualDimensions[spriteKey]; if (!spriteToDraw || !baseVisualDimensions) { ctx.fillStyle = 'cyan'; ctx.fillRect(Math.round(player.x - cameraX), player.y, player.width, player.height); } else { const targetVisualWidth = baseVisualDimensions.w * PLAYER_SCALE; const targetVisualHeight = baseVisualDimensions.h * PLAYER_SCALE; const drawX = player.x - cameraX; const offsetX = (targetVisualWidth - player.width) / 2; const offsetY = (targetVisualHeight - player.height); const drawVisualX = drawX - offsetX; const drawVisualY = player.y - offsetY; ctx.save(); if (player.facingDirection === -1 && !(gameState === 'win' && player.isFrozenInWin) && !player.isDying) { ctx.translate(Math.round(drawVisualX) + targetVisualWidth, drawVisualY); ctx.scale(-1, 1); ctx.drawImage(spriteToDraw, 0, 0, targetVisualWidth, targetVisualHeight); } else { ctx.drawImage(spriteToDraw, Math.round(drawVisualX), drawVisualY, targetVisualWidth, targetVisualHeight); } ctx.restore(); } if (applyFilter) ctx.filter = 'none'; }
function drawGoal() { if (!ctx || !goal) return; ctx.filter = currentSaturationFilter; const sprite = assets[goal.spriteKey]; const drawX = goal.x - cameraX; const drawY = goal.y; const centerX = drawX + goal.width / 2; const centerY = drawY + goal.height / 2; if (drawX + goal.width > 0 && drawX < canvas.width) { if (sprite) { ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(goalRotationAngle); ctx.drawImage(sprite, -goal.width / 2, -goal.height / 2, goal.width, goal.height); ctx.restore(); } else { ctx.fillStyle = 'gold'; ctx.fillRect(Math.round(drawX), drawY, goal.width, goal.height); } } ctx.filter = 'none'; }

// --- Update Functions ---
function updatePlatforms(deltaTime) { /* ... Keep existing ... */ if (!platforms || gameState !== 'playing') return; const dtFactor = deltaTime / 16.67; platforms.forEach(platform => { if (platform.isMoving) { const moveAmount = platform.speed * platform.direction * dtFactor; let currentPos, minPos, maxPos; if (platform.moveAxis === 'x') { currentPos = platform.x; minPos = platform.minPos; maxPos = platform.maxPos; platform.x += moveAmount; currentPos = platform.x; if (platform.direction === 1 && currentPos >= maxPos) { platform.x = maxPos; platform.direction = -1; } else if (platform.direction === -1 && currentPos <= minPos) { platform.x = minPos; platform.direction = 1; } } else if (platform.moveAxis === 'y') { currentPos = platform.y; minPos = platform.minPos; maxPos = platform.maxPos; platform.y += moveAmount; currentPos = platform.y; if (platform.direction === 1 && currentPos >= maxPos) { platform.y = maxPos; platform.direction = -1; } else if (platform.direction === -1 && currentPos <= minPos) { platform.y = minPos; platform.direction = 1; } } } }); }

// UPDATED updatePlayer for longer flash anim duration trigger
function updatePlayer(deltaTime) {
    if (!player || (gameState !== 'playing' && gameState !== 'win')) return; if (player.isFrozenInWin) return;
    const dtFactor = deltaTime / 16.67;
    if (player.isDying) { player.deathAnimTimer += deltaTime; player.vy += player.gravity * dtFactor * 1.5; player.y += player.vy * dtFactor; player.x += player.vx * dtFactor; if (player.deathAnimTimer >= DEATH_FALL_DURATION) { console.log("Death animation finished. Resetting game."); initializeGameData(); if (gameState !== 'playing') changeState('playing'); } return; }

    if (player.isPowerupAnimating) {
        const oldTimer = player.powerupAnimTimer;
        player.powerupAnimTimer -= deltaTime;
        const currentPhase = Math.floor((POWERUP_ANIM_DURATION - player.powerupAnimTimer) / POWERUP_FLASH_INTERVAL);
        const oldPhase = Math.floor((POWERUP_ANIM_DURATION - oldTimer) / POWERUP_FLASH_INTERVAL);
        player.powerupAnimFrame = currentPhase % 2;
        // Trigger on odd phases up to phase 9 (for 900ms duration)
        if (currentPhase !== oldPhase && currentPhase < 9) {
             if (currentPhase % 2 !== 0) { // Trigger on 1, 3, 5, 7
                drawFlashOverlay = true;
             }
        }
        if (player.powerupAnimTimer <= 0) { console.log("Power-Up Animation complete."); player.isPowerupAnimating = false; player.isPoweredUp = true; player.powerUpTimer = POWERUP_DURATION; player.action = 'idle'; }
        else { return; }
    }
    else if (player.isPoweredUp) { player.powerUpTimer -= deltaTime; if (player.powerUpTimer <= 0) { console.log("Power-Up expired."); player.isPoweredUp = false; player.powerUpTimer = 0; player.action = 'idle'; } }

    // --- Movement, Physics, Collision --- (Keep existing)
    let platformDeltaX = 0; if (player.isGrounded && player.groundedOnPlatform && player.groundedOnPlatform.isMoving) { const platform = player.groundedOnPlatform; const platformMoveAmount = platform.speed * platform.direction * dtFactor; if (platform.moveAxis === 'x') { platformDeltaX = platformMoveAmount; if ((platform.direction === 1 && platform.x >= platform.maxPos) || (platform.direction === -1 && platform.x <= platform.minPos)) { platformDeltaX = 0; } } }
    let intendedVx = 0; if (keysPressed['ArrowLeft']) { intendedVx = -player.speed; player.facingDirection = -1; } if (keysPressed['ArrowRight']) { intendedVx = player.speed; player.facingDirection = 1; } player.vx = intendedVx;
    if (player.isGrounded && (keysPressed['Space'] || keysPressed['ArrowUp'])) { player.vy = -JUMP_POWER; player.isGrounded = false; player.groundedOnPlatform = null; player.action = 'jumping'; keysPressed['Space'] = false; keysPressed['ArrowUp'] = false; } player.vy += player.gravity * dtFactor;
    let verticalMove = player.vy * dtFactor; let predictedY = player.y + verticalMove; let landedThisFrame = false; let tempGroundedPlatform = null; player.isGrounded = false; player.groundedOnPlatform = null; if (player.vy >= 0) { for (const platform of platforms) { const isHorizontallyAligned = player.x + player.width > platform.x && player.x < platform.x + platform.width; if (isHorizontallyAligned) { const wasAbove = player.y + player.height <= platform.y + 1; const willBeBelowOrOn = predictedY + player.height >= platform.y; if (wasAbove && willBeBelowOrOn) { player.y = platform.y - player.height; player.vy = 0; player.isGrounded = true; landedThisFrame = true; tempGroundedPlatform = platform; break; } } } } if (!player.isGrounded) { player.y = predictedY; } player.groundedOnPlatform = tempGroundedPlatform;
    let horizontalMove = player.vx * dtFactor + platformDeltaX; let predictedX = player.x + horizontalMove; player.x = predictedX;
    if (player.x < 0) { player.x = 0; player.vx = 0; } if (player.x + player.width > LEVEL_WIDTH) { player.x = LEVEL_WIDTH - player.width; player.vx = 0; }
    if (landedThisFrame) { player.action = (player.vx !== 0) ? 'running' : 'idle'; } else if (!player.isGrounded && player.action !== 'jumping') { if (player.vy > player.gravity * 2) { player.action = 'jumping'; } } else if (player.isGrounded) { if (player.vx !== 0 && player.action !== 'running') { player.action = 'running'; } else if (player.vx === 0 && player.action !== 'idle') { player.action = 'idle'; } }
    if (player.action === 'running') { player.frameTimer += deltaTime; if (player.frameTimer >= player.frameInterval) { player.frameTimer -= player.frameInterval; player.spriteFrame = (player.spriteFrame + 1) % 2; } } else { player.frameTimer = 0; player.spriteFrame = 0; }
    checkCollectibleCollision(); checkGoalCollision(); checkIfLeftGoalArea();
}
function checkCollectibleCollision() { /* ... Keep existing ... */ if (!player || !dropletDefinitions || player.isPowerupAnimating || player.isFrozenInWin || player.isDying) return; dropletDefinitions.forEach(item => { if (!item.collected) { if (player.x < item.x + item.width && player.x + player.width > item.x && player.y < item.y + item.height && player.y + player.height > item.y) { item.collected = true; player.collectedThisAttempt++; const powerupCycleCount = (player.collectedThisAttempt - 1) % DROPLETS_TO_POWERUP + 1; if (!player.isPoweredUp && !player.isPowerupAnimating && powerupCycleCount === DROPLETS_TO_POWERUP) { triggerPowerUp(); } if (totalDropletsInLevel > 0) { const saturationPercent = Math.min(100, Math.max(0, (player.collectedThisAttempt / totalDropletsInLevel) * 100)); currentSaturationFilter = `saturate(${saturationPercent}%)`; } } } }); }
function updateEnemies(deltaTime) { /* ... Keep existing ... */ if (!enemies || gameState !== 'playing' || player.isDying) return; const dtFactor = deltaTime / 16.67; enemies.forEach(enemy => { if (enemy.isActive) { if (enemy.isSplatting) { enemy.splatAnimTimer += deltaTime; if (enemy.splatAnimTimer >= SPLAT_ANIM_INTERVAL) { enemy.splatAnimTimer -= SPLAT_ANIM_INTERVAL; enemy.splatFrame++; if (enemy.splatFrame >= splatFrames.length) { enemy.isActive = false; enemy.isSplatting = false; } } } else { enemy.x += enemy.speed * enemy.direction * dtFactor; if (enemy.direction === -1 && enemy.x <= enemy.minX) { enemy.x = enemy.minX; enemy.direction = 1; } else if (enemy.direction === 1 && enemy.x >= enemy.maxX) { enemy.x = enemy.maxX; enemy.direction = -1; } } } }); }
function checkPlayerEnemyCollision() { /* ... Keep existing ... */ if (!player || !enemies || player.isPowerupAnimating || player.isFrozenInWin || player.isDying || gameState !== 'playing') return; enemies.forEach(enemy => { if (enemy.isActive && !enemy.isSplatting) { if (player.x < enemy.x + enemy.width && player.x + player.width > enemy.x && player.y < enemy.y + enemy.height && player.y + player.height > enemy.y) { if (player.isPoweredUp) { console.log(`Player destroyed enemy ${enemy.id}! Starting splat.`); enemy.isSplatting = true; enemy.splatAnimTimer = 0; enemy.splatFrame = 0; } else { console.log(`Player hit by enemy ${enemy.id}! Starting death sequence.`); player.isDying = true; player.deathAnimTimer = 0; player.vy = DEATH_BOUNCE_POWER; player.vx = -player.facingDirection * 2; player.isGrounded = false; player.groundedOnPlatform = null; } } } }); }
function updateCamera() { /* ... Keep existing ... */ if (!player || player.isFrozenInWin ) return; const targetCameraX = player.x - CANVAS_WIDTH / 2 + player.width / 2; const minCameraX = 0; const maxCameraX = LEVEL_WIDTH - CANVAS_WIDTH; cameraX = targetCameraX; cameraX = Math.max(minCameraX, Math.min(cameraX, maxCameraX)); }

// UPDATED showGoalPopup for 4 second duration
function showGoalPopup(message) {
    if (!goalPopupElement) return;
    goalPopupElement.textContent = message;
    goalPopupElement.classList.remove('hidden');
    if (popupTimeoutId) { clearTimeout(popupTimeoutId); }
    // Use new duration
    popupTimeoutId = setTimeout(() => {
        if (goalPopupElement) { goalPopupElement.classList.add('hidden'); }
        popupTimeoutId = null;
    }, GOAL_POPUP_DURATION); // Use constant for 4000ms
}
function checkIfLeftGoalArea() { /* ... Keep existing ... */ if (!player || !goal || !goalEntryBlockedUntilLeave) return; const buffer = player.width; if (player.x + player.width < goal.x - buffer || player.x > goal.x + goal.width + buffer) { goalEntryBlockedUntilLeave = false; } }
function checkGoalCollision() { /* ... Keep existing ... */ if (!player || !goal || player.isPowerupAnimating || player.isFrozenInWin || player.isDying || gameState !== 'playing') return; if (player.x < goal.x + goal.width && player.x + player.width > goal.x && player.y < goal.y + goal.height && player.y + player.height > goal.y) { if (goalEntryBlockedUntilLeave) { return; } const allDropletsCollected = player.collectedThisAttempt >= totalDropletsInLevel; if (allDropletsCollected) { console.log("Goal Reached & All Droplets Collected! WIN!"); player.isFrozenInWin = true; player.vx = 0; player.vy = 0; player.x = goal.x + (goal.width / 2) - (player.width / 2); player.y = goal.y + (goal.height / 2) - (player.height / 2) + (goal.height * 0.2); player.action = 'winPose'; changeState('win'); } else { console.log("Goal touched, but not all droplets collected."); showGoalPopup("Go back! You haven't collected all the paint droplets!"); goalEntryBlockedUntilLeave = true; } } }

// --- Game Initialization ---
function init() { /* ... Keep existing ... */ console.log(">>> Floob's Paint Run - Initializing Game <<<"); canvas = document.getElementById('gameCanvas'); if (!canvas) { console.error("FATAL: Canvas element not found!"); return; } ctx = canvas.getContext('2d'); if (!ctx) { console.error("FATAL: Could not get 2D context!"); return; } introScreenElement = document.getElementById('intro-screen'); startButtonElement = document.getElementById('start-button'); gameContainerElement = document.getElementById('game-container'); winScreenElement = document.getElementById('win-screen'); goalPopupElement = document.getElementById('goal-popup'); introTransitionElement = document.getElementById('intro-transition'); playAgainButtonElement = document.getElementById('play-again-button'); instagramPopupElement = document.getElementById('instagram-popup'); instagramShareLinkElement = document.getElementById('instagram-share-link'); closeIgPopupButtonElement = document.getElementById('close-ig-popup'); if (!introScreenElement || !startButtonElement || !gameContainerElement || !winScreenElement || !goalPopupElement || !introTransitionElement || !playAgainButtonElement || !instagramPopupElement || !instagramShareLinkElement || !closeIgPopupButtonElement) { console.error("FATAL: One or more essential UI elements not found!"); document.body.innerHTML = "Error: Missing required HTML elements. Init failed."; return; } console.log("Essential DOM elements found."); canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT; console.log(`Canvas initialized: ${canvas.width}x${canvas.height}`); changeState('loading'); loadAssets(() => { console.log("Asset loading callback triggered."); initializeStaticElements(); if (gameInitialized) { changeState('intro'); } else { console.error("Halting game initialization - static elements failed."); } }); }

// --- Game Loop ---
function gameLoop(timestamp) { /* ... Keep existing ... */ if (gameState !== 'playing' && gameState !== 'win') { return; } if (gameState === 'win' && player && player.isFrozenInWin) { return; } if (!lastTime) { lastTime = timestamp; requestAnimationFrame(gameLoop); return; } const deltaTime = timestamp - lastTime; lastTime = timestamp; const cappedDeltaTime = Math.min(deltaTime, 100); try { updatePlatforms(cappedDeltaTime); updatePlayer(cappedDeltaTime); updateEnemies(cappedDeltaTime); updateCamera(); checkPlayerEnemyCollision(); if (gameState === 'playing') { goalRotationAngle = (goalRotationAngle + GOAL_ROTATION_SPEED) % (Math.PI * 2); } } catch (error) { console.error("ERROR during update:", error); changeState('loading'); return; } try { clearCanvas(); drawBackground(); drawParallaxLayers(); drawPlatforms(); drawCollectibles(); drawEnemies(); drawGoal(); drawPlayer(); if (drawFlashOverlay) { ctx.fillStyle = SCREEN_FLASH_COLOR; ctx.fillRect(0, 0, canvas.width, canvas.height); drawFlashOverlay = false; } } catch (error) { console.error("ERROR during drawing:", error); changeState('loading'); return; } if (gameState === 'playing' || (gameState === 'win' && player && !player.isFrozenInWin)) { requestAnimationFrame(gameLoop); } }

// --- Input Handling ---
function handleStartButtonClick() { console.log("Start button clicked!"); if (startButtonElement) startButtonElement.disabled = true; triggerIntroTransition(); }
function handleInstructionsInput(event) { if (gameState !== 'instructions') return; console.log("Input detected during instructions state:", event.type); changeState('playing'); }
function handlePlayAgain() { console.log("Play Again clicked!"); changeState('intro'); }

// NEW Instagram link handler
function handleInstagramClick(event) {
    event.preventDefault(); // Prevent default link behavior (if it had one)
    console.log("Instagram link clicked");
    if(instagramPopupElement) {
        instagramPopupElement.classList.remove('hidden');
    } else {
        console.error("Instagram popup element not found!");
    }
}
// NEW Instagram popup close handler
function handleCloseIgPopup() {
     console.log("Close IG popup clicked");
     if(instagramPopupElement) {
        instagramPopupElement.classList.add('hidden');
    }
}

// Setup listeners (listeners for win screen buttons are added in changeState)
function setupInputListeners() { console.log("Setting up base input listeners..."); if (startButtonElement) { startButtonElement.addEventListener('click', handleStartButtonClick); } else { console.error("Start button element not found."); } window.addEventListener('keydown', (event) => { keysPressed[event.code] = true; if ((gameState === 'playing' || player?.isDying) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) { event.preventDefault(); } }); window.addEventListener('keyup', (event) => { keysPressed[event.code] = false; }); }
function setupInstructionsListeners() { console.log("Setting up instructions input listeners..."); window.addEventListener('keydown', handleInstructionsInput); window.addEventListener('mousedown', handleInstructionsInput); }

// --- Main Execution ---
function windowLoadHandler() { console.log("DOM loaded."); try { /* Asset dimension checks */ if (!spriteVisualDimensions.instructions || !spriteVisualDimensions.title_screen || !spriteVisualDimensions.floobPowerupGet2 || !spriteVisualDimensions.win_pose || !spriteVisualDimensions.floob_dies || !spriteVisualDimensions.splat_1 || !spriteVisualDimensions.congratulations || !spriteVisualDimensions.facebook_icon) { console.error("FATAL: Dimensions for required assets missing!"); document.body.innerHTML = "Error: Missing essential sprite data."; return; } init(); setupInputListeners(); console.log("Init and listeners setup initiated."); } catch (error) { console.error("CRITICAL ERROR during setup:", error); document.body.innerHTML = "A critical error occurred."; } }
 window.addEventListener('load', windowLoadHandler);