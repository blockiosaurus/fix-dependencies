import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '@/components/Game';
import { Scene } from 'phaser';
import { Umi } from '@metaplex-foundation/umi';
import { generateContainerID, generateContainerType } from '@/data/ContainerNames';

// Define our own type for tracking block speeds without extending MatterJS types
interface BlockBody extends MatterJS.BodyType {
    isSleeping: boolean;
    label: string;
}

type Block = Phaser.Physics.Matter.Image & {
    body: BlockBody | null;
    customData?: {
        speed?: number;
        containerId?: string;
        containerType?: string;
        labelText?: Phaser.GameObjects.Text;
        typeText?: Phaser.GameObjects.Text;
        textContainer?: Phaser.GameObjects.Container;
    };
};

export class BlockStacker extends Scene {
    private blocks: Block[] = [];
    private ground!: Phaser.Physics.Matter.Image;
    private walls: Phaser.Physics.Matter.Image[] = [];
    private newBlockButton!: Phaser.GameObjects.Image;
    private scoreText!: Phaser.GameObjects.Text;
    private heightText!: Phaser.GameObjects.Text;
    private efficiencyText!: Phaser.GameObjects.Text;
    private stabilityText!: Phaser.GameObjects.Text;
    private gameStarted: boolean = false;
    private highestPoint: number = 0;
    private bestScore: number = 0;
    private currentHeight: number = 0;
    private baseHeight: number = 0;
    private blockColors: number[] = [
        0x2C5F85, // navy blue
        0xA84632, // rust red
        0x3D5E45, // container green
        0xBCAA99, // beige/khaki
        0x8B5D33, // brown
        0x6E7F80  // steel gray
    ];
    private initialBlocksCount: number = 5;
    private restartButton!: Phaser.GameObjects.Text;
    private gameOverText!: Phaser.GameObjects.Text;
    private instructionsText!: Phaser.GameObjects.Text;
    private isGameOver: boolean = false;
    private umi!: Umi;
    private draggedBlock: Block | null = null;
    private bestHeightMarker!: Phaser.GameObjects.Graphics;
    private lastStableTowerHeight: number = 0;
    private readonly SPEED_DEADBAND: number = 0.05; // Minimum speed to consider a block "moving"
    private readonly STABILITY_DURATION: number = 3000; // Time in ms blocks must be stable (3 seconds)
    private allStableStartTime: number = 0; // When blocks first became stable
    private isStabilityTimerActive: boolean = false;
    private stabilityProgress: number = 0; // Progress percentage towards stability

    constructor() {
        super('BlockStacker');
    }

    init(args: { umi: Umi }) {
        this.umi = args.umi;
    }

    preload() {
        // We'll create the block graphics programmatically
        this.load.image('ground', 'assets/platform.png');
    }

    create() {
        // Enable debug rendering to see physics bodies
        this.matter.world.drawDebug = false;

        // Create background
        this.add.image(DEFAULT_WIDTH / 2, DEFAULT_HEIGHT / 2, 'sky').setTint(0xD9E5EC); // Light blue-gray tint for industrial feel

        // Set world bounds with a bottom boundary
        this.matter.world.setBounds(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT + 100);

        // Create a custom ground with graphics to ensure visibility
        const groundHeight = 40;
        const groundY = DEFAULT_HEIGHT - groundHeight / 2;
        this.baseHeight = groundY - groundHeight / 2; // Store base height for height calculations

        // Create a graphics object for the ground
        const groundGraphics = this.add.graphics();
        groundGraphics.fillStyle(0x555555, 1);  // Concrete gray color
        groundGraphics.fillRect(0, 0, DEFAULT_WIDTH, groundHeight);
        groundGraphics.generateTexture('custom_ground', DEFAULT_WIDTH, groundHeight);
        groundGraphics.destroy();

        // Create the ground as a static body
        this.ground = this.matter.add.image(DEFAULT_WIDTH / 2, groundY, 'custom_ground', undefined, {
            isStatic: true,
            label: 'ground'
        });

        // Create walls - extend them below ground to prevent objects from escaping
        const wallThickness = 20; // Thicker walls
        const wallHeight = DEFAULT_HEIGHT + 200; // Even taller walls

        // Left wall
        this.walls.push(
            this.matter.add.rectangle(wallThickness / 2, DEFAULT_HEIGHT / 2, wallThickness, wallHeight, {
                isStatic: true,
                label: 'leftWall'
            }) as unknown as Phaser.Physics.Matter.Image
        );
        // Right wall
        this.walls.push(
            this.matter.add.rectangle(DEFAULT_WIDTH - wallThickness / 2, DEFAULT_HEIGHT / 2, wallThickness, wallHeight, {
                isStatic: true,
                label: 'rightWall'
            }) as unknown as Phaser.Physics.Matter.Image
        );

        // Create best height marker graphic - initially at base level
        this.bestHeightMarker = this.add.graphics();
        this.updateBestHeightMarker(this.baseHeight);

        // Create score text (now shows tower height)
        this.heightText = this.add.text(16, 16, 'Height: 0 px', {
            fontSize: '24px',
            color: '#fff'
        });

        // Add best height text
        this.scoreText = this.add.text(16, 48, 'Efficiency Score: 0', {
            fontSize: '24px',
            color: '#ffdd00'  // Gold color for score
        });

        // Add best score text
        this.efficiencyText = this.add.text(16, 80, 'Best Score: 0', {
            fontSize: '20px',
            color: '#ffaa00'  // Darker gold for best score
        });

        // Add stability timer text
        this.stabilityText = this.add.text(16, 112, '', {
            fontSize: '18px',
            color: '#aaaaff'
        });

        // Create instruction text
        this.instructionsText = this.add.text(DEFAULT_WIDTH / 2, 200, 'Click to Start Physics\nDrag blocks to stack them!\nStack as high as you can using fewer blocks!\nTower must be stable for 3 seconds to count', {
            fontSize: '24px',
            color: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Create button to add new blocks
        this.newBlockButton = this.add.image(DEFAULT_WIDTH - 100, 50, 'star')
            .setInteractive()
            .on('pointerdown', () => {
                if (this.gameStarted && !this.isGameOver) {
                    this.addBlock();
                }
            });

        this.add.text(DEFAULT_WIDTH - 100, 80, 'Add Block', {
            fontSize: '16px',
            color: '#fff'
        }).setOrigin(0.5);

        // Create initial stack of blocks - adjust the starting position to be higher
        this.createInitialBlocks();

        // Create restart button (hidden initially)
        this.restartButton = this.add.text(DEFAULT_WIDTH / 2, DEFAULT_HEIGHT / 2 + 50, 'Restart Game', {
            fontSize: '24px',
            color: '#fff',
            backgroundColor: '#000'
        })
            .setOrigin(0.5)
            .setPadding(10)
            .setInteractive()
            .on('pointerdown', () => this.restartGame())
            .setVisible(false);

        // Create game over text (hidden initially)
        this.gameOverText = this.add.text(DEFAULT_WIDTH / 2, DEFAULT_HEIGHT / 2, 'Game Over!', {
            fontSize: '48px',
            color: '#ff0000'
        })
            .setOrigin(0.5)
            .setVisible(false);

        // Set up input to start the game
        this.input.on('pointerdown', () => {
            if (!this.gameStarted) {
                this.startGame();
            }
        });

        // Enable dragging in the Matter.js world
        this.setupDragging();

        // Collision detection for scoring
        this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // When blocks collide, update the tower height
                if (this.gameStarted &&
                    ((bodyA.label === 'block' && (bodyB.label === 'ground' || bodyB.label === 'block')) ||
                        (bodyB.label === 'block' && (bodyA.label === 'ground' || bodyA.label === 'block')))) {
                    // Only update score once per collision
                    if (!bodyA.isSensor && !bodyB.isSensor) {
                        this.updateTowerHeight();

                        // Reset stability timer when blocks collide
                        this.resetStabilityTimer();
                    }
                }
            });
        });

        // Setup game over detection
        this.time.addEvent({
            delay: 1000,
            callback: this.checkGameOver,
            callbackScope: this,
            loop: true
        });
    }

    update(time: number, delta: number) {
        // Check if blocks are stable
        if (this.gameStarted && !this.isGameOver) {
            let allBlocksSleeping = true;
            let visibleBlocks = 0;
            let stableBlocks = 0;

            // Check each block
            for (let i = 0; i < this.blocks.length; i++) {
                const block = this.blocks[i];

                // Update the position of the container labels to follow the block
                this.updateContainerLabelsPosition(block);

                // Count visible blocks
                if (block.active && block.y < DEFAULT_HEIGHT + 50) {
                    visibleBlocks++;

                    // Calculate speed of this block for stability checking
                    let speed = 0;
                    if (block.body) {
                        // Access velocity through Matter.js Body interface
                        const body = block.body as unknown as MatterJS.BodyType;
                        if (body.velocity) {
                            const vx = body.velocity.x;
                            const vy = body.velocity.y;
                            speed = Math.sqrt(vx * vx + vy * vy);

                            // Store speed in our custom data
                            if (!block.customData) block.customData = {};
                            block.customData.speed = speed;
                        }
                    }

                    // Check if block is stable (sleeping or below speed deadband)
                    const isStable = (block.body && block.body.isSleeping) ||
                        (block.customData &&
                            block.customData.speed !== undefined &&
                            block.customData.speed < this.SPEED_DEADBAND &&
                            !this.isDraggingBlock(block));

                    if (isStable) {
                        stableBlocks++;
                    } else {
                        allBlocksSleeping = false;
                    }
                }
            }

            // Always update the current tower height for display
            this.updateCurrentTowerHeight();

            // Manage the stability timer
            if (allBlocksSleeping && visibleBlocks > 0) {
                if (!this.isStabilityTimerActive) {
                    // Start stability timer if all blocks are stable
                    this.startStabilityTimer(time);
                } else {
                    // Update stability timer
                    this.updateStabilityTimer(time);
                }

                // Enable the add block button when at least stability check is in progress
                this.newBlockButton.setTint(0xffffff);
            } else {
                // If any block is moving, reset the stability timer
                this.resetStabilityTimer();
                this.newBlockButton.setTint(0x888888);
            }
        }
    }

    private startStabilityTimer(time: number) {
        this.allStableStartTime = time;
        this.isStabilityTimerActive = true;
        this.stabilityText.setText('Checking stability: 0%');
        this.stabilityText.setVisible(true);
    }

    private updateStabilityTimer(currentTime: number) {
        // Calculate how long the tower has been stable
        const stableTime = currentTime - this.allStableStartTime;
        this.stabilityProgress = Math.min(100, Math.floor((stableTime / this.STABILITY_DURATION) * 100));

        // Update the UI to show stability progress
        this.stabilityText.setText(`Checking stability: ${this.stabilityProgress}%`);

        // If we've reached the stability threshold, update the best height
        if (stableTime >= this.STABILITY_DURATION) {
            this.updateBestHeight();
            this.stabilityText.setText('Tower stable!');

            // Reset timer to avoid continuously updating
            this.resetStabilityTimer();
            this.isStabilityTimerActive = false;
        }
    }

    private resetStabilityTimer() {
        this.allStableStartTime = 0;
        this.isStabilityTimerActive = false;
        this.stabilityProgress = 0;
        this.stabilityText.setVisible(false);
    }

    private updateCurrentTowerHeight() {
        // Find the highest point of any block (lowest y value in Phaser)
        let highestPoint = this.baseHeight;
        let visibleBlocks = 0;

        for (const block of this.blocks) {
            if (block.active && block.y < DEFAULT_HEIGHT + 50) {
                visibleBlocks++;

                // Get block's top edge position, accounting for height
                const blockTop = block.y - block.height / 2;

                // Update highest point if this block is higher
                if (blockTop < highestPoint) {
                    highestPoint = blockTop;
                }
            }
        }

        // Calculate tower height from the base
        this.currentHeight = Math.round(this.baseHeight - highestPoint);

        // Update height text with current height
        this.heightText.setText(`Height: ${this.currentHeight} px`);

        // Calculate and update efficiency score (height ÷ blocks)
        if (visibleBlocks > 0) {
            // Round to 2 decimal places for readability
            const efficiencyScore = Math.round((this.currentHeight / visibleBlocks) * 100) / 100;
            this.scoreText.setText(`Efficiency Score: ${efficiencyScore}`);
        } else {
            this.scoreText.setText('Efficiency Score: 0');
        }
    }

    private updateBestHeight() {
        // Only update best height if current height is greater
        if (this.currentHeight > this.highestPoint) {
            this.highestPoint = this.currentHeight;

            // Count visible blocks for efficiency score
            let visibleBlocks = 0;
            for (const block of this.blocks) {
                if (block.active && block.y < DEFAULT_HEIGHT + 50) {
                    visibleBlocks++;
                }
            }

            // Calculate efficiency score
            if (visibleBlocks > 0) {
                const currentScore = Math.round((this.currentHeight / visibleBlocks) * 100) / 100;

                // Update best score if this score is better
                if (currentScore > this.bestScore) {
                    this.bestScore = currentScore;
                    this.efficiencyText.setText(`Best Score: ${this.bestScore}`);
                }
            }

            // Find the actual y-coordinate for the marker
            const markerY = this.baseHeight - this.highestPoint;

            // Update the best height marker line
            this.updateBestHeightMarker(markerY);
        }
    }

    private updateTowerHeight() {
        // This method is now only used for collision detection and initial setup
        this.updateCurrentTowerHeight();
    }

    private updateBestHeightMarker(y: number) {
        // Draw a dashed green line showing the best height achieved
        this.bestHeightMarker.clear();
        this.bestHeightMarker.lineStyle(3, 0x00ff00, 0.8); // Thicker green line, slightly transparent

        // Create a dashed effect
        const dashSize = 15;
        const gapSize = 10;
        let currentX = 0;

        this.bestHeightMarker.beginPath();

        while (currentX < DEFAULT_WIDTH) {
            this.bestHeightMarker.moveTo(currentX, y);
            this.bestHeightMarker.lineTo(currentX + dashSize, y);
            currentX += dashSize + gapSize;
        }

        this.bestHeightMarker.strokePath();

        // Add small triangle markers at each end to make it more visible
        this.bestHeightMarker.fillStyle(0x00ff00, 0.8);

        // Left triangle
        this.bestHeightMarker.fillTriangle(
            0, y,
            10, y - 5,
            10, y + 5
        );

        // Right triangle
        this.bestHeightMarker.fillTriangle(
            DEFAULT_WIDTH, y,
            DEFAULT_WIDTH - 10, y - 5,
            DEFAULT_WIDTH - 10, y + 5
        );
    }

    private setupDragging() {
        // Enable built-in Matter.js physics-based dragging
        this.matter.add.mouseSpring({
            stiffness: 0.1,
            damping: 0.1,
            length: 1
        });

        // Make blocks highlight on hover
        this.input.on('gameobjectover', (pointer: Phaser.Input.Pointer, gameObject: any) => {
            // Ensure it's a block from our array
            if (this.blocks.includes(gameObject)) {
                gameObject.setTint(0xffff00); // Yellow highlight
            }
        });

        this.input.on('gameobjectout', (pointer: Phaser.Input.Pointer, gameObject: any) => {
            // Reset tint when not hovering (unless it's being dragged)
            if (this.blocks.includes(gameObject) && gameObject !== this.draggedBlock) {
                gameObject.clearTint();
            }
        });
    }

    private isDraggingBlock(block: Block): boolean {
        return this.draggedBlock === block;
    }

    private createInitialBlocks() {
        // Create a precarious stack of blocks with larger sizes
        const blockWidth = 80;  // Increased from 60
        const blockHeight = 40; // Increased from 30
        const centerX = DEFAULT_WIDTH / 2;
        // Position blocks higher on the screen to ensure they're visible
        const startY = DEFAULT_HEIGHT - 70; // Position slightly higher

        // First row - stable base
        this.createBlock(centerX, startY, blockWidth * 3, blockHeight);

        // Second row - two blocks with a gap
        this.createBlock(centerX - blockWidth, startY - blockHeight, blockWidth * 1.2, blockHeight);
        this.createBlock(centerX + blockWidth, startY - blockHeight, blockWidth * 1.2, blockHeight);

        // Third row - single block
        this.createBlock(centerX, startY - blockHeight * 2, blockWidth * 1.8, blockHeight);

        // Fourth row - two blocks
        this.createBlock(centerX - 30, startY - blockHeight * 3, blockWidth, blockHeight);

        // Make all blocks static until game starts
        for (const block of this.blocks) {
            if (block.body) {
                this.matter.body.setStatic(block.body, true);
            }
        }
    }

    private createBlock(x: number, y: number, width: number, height: number) {
        const color = Phaser.Math.RND.pick(this.blockColors);

        // Generate a unique texture key for this block
        const textureKey = 'block_' + this.blocks.length;

        // Create the texture using graphics
        const graphics = this.add.graphics();
        graphics.fillStyle(color, 1);

        // Draw a slightly smaller rectangle to leave room for the border
        graphics.fillRect(1, 1, width - 2, height - 2);

        // Add container details
        this.addContainerDetails(graphics, width, height, color);

        // Draw a cleaner border
        graphics.lineStyle(1, 0x333333, 0.9); // Darker border
        graphics.strokeRect(0, 0, width, height);

        graphics.generateTexture(textureKey, width, height);
        graphics.destroy();

        // Create the block with Matter physics
        const block = this.matter.add.image(x, y, textureKey, undefined, {
            label: 'block',
            restitution: 0.05, // Even lower restitution to reduce bouncing
            friction: 0.9,     // High friction to make blocks more stable
            density: 0.01,     // Keep density low to prevent blocks from becoming too heavy
            frictionAir: 0.02, // Add some air friction to slow down movement
            chamfer: { radius: 2 } // Slightly rounded corners for better stacking
        }) as Block;

        // Make the block interactive
        block.setInteractive();

        // Add container ID and type to custom data
        if (!block.customData) block.customData = {};
        block.customData.containerId = generateContainerID();
        block.customData.containerType = generateContainerType();

        // Add container ID text
        this.addContainerLabels(block, width, height);

        this.blocks.push(block);
        return block;
    }

    private addContainerLabels(block: Block, width: number, height: number) {
        if (!block.customData) return;

        // Improved adaptive font size based on block dimensions
        // Scale font better with block width while maintaining minimum readability
        const nameSize = Math.min(Math.max(Math.round(width / 6.5), 10), 20);  // Slightly larger
        const versionSize = Math.min(Math.max(Math.round(width / 8), 9), 16);  // Slightly larger

        // Lower threshold for displaying text - accommodate more blocks with text
        if (width >= 30 && height >= 18) {
            // Create a container to hold both text elements - this will help with rotation
            const textContainer = this.add.container(0, 0);

            // Add crate name at the top with improved readability
            const idText = this.add.text(0, -(height * 0.25), block.customData.containerId || '', {
                fontFamily: 'monospace',
                fontSize: `${nameSize}px`,
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: Math.min(2, nameSize / 6), // Adaptive stroke thickness
                align: 'center'
            }).setOrigin(0.5);

            // Add version number at the bottom with improved contrast
            const typeText = this.add.text(0, (height * 0.25), block.customData.containerType || '', {
                fontFamily: 'monospace',
                fontSize: `${versionSize}px`,
                color: '#f0f0f0', // Brighter color for better contrast
                stroke: '#000000',
                strokeThickness: Math.min(1.5, versionSize / 7), // Adaptive stroke thickness
                align: 'center'
            }).setOrigin(0.5);

            // Add both texts to the container
            textContainer.add([idText, typeText]);

            // Position container at block's center
            textContainer.setPosition(block.x, block.y);

            // Set container depth to ensure it's above blocks
            textContainer.setDepth(block.depth + 1);

            // Store references in block's customData
            block.customData.labelText = idText;
            block.customData.typeText = typeText;
            block.customData.textContainer = textContainer;

            // Truncate text if it's wider than the block, with more padding for better aesthetics
            this.fitTextToBlock(idText, width - 8);
            this.fitTextToBlock(typeText, width - 8);
        }
    }

    private fitTextToBlock(text: Phaser.GameObjects.Text, maxWidth: number) {
        const originalText = text.text;
        // If text is wider than block, truncate it
        if (text.width > maxWidth) {
            // For very narrow blocks, use abbreviation
            if (maxWidth < 30) {
                if (originalText.length > 4) {
                    text.setText(originalText.substring(0, 3) + '…');
                }
            } else {
                // Find a suitable truncation point
                let truncated = originalText;
                while (text.width > maxWidth && truncated.length > 3) {
                    truncated = truncated.substring(0, truncated.length - 1);
                    text.setText(truncated + '…');
                }
            }
        }
    }

    private updateContainerLabelsPosition(block: Block) {
        if (!block.customData || !block.customData.textContainer) return;

        const textContainer = block.customData.textContainer;

        // Update container position to match block position
        textContainer.setPosition(block.x, block.y);

        // Match rotation of the block (convert from radians to degrees)
        if (block.body) {
            textContainer.setRotation(block.rotation);
        }
    }

    private addContainerDetails(graphics: Phaser.GameObjects.Graphics, width: number, height: number, baseColor: number) {
        // Reduced minimum size requirement to add details to more blocks
        if (width < 25 || height < 18) return;

        // Add subtle details to mimic Rust crate
        graphics.lineStyle(1, 0x000000, 0.15);

        // Horizontal line for crate division
        if (height > 22) { // Reduced threshold
            graphics.beginPath();
            graphics.moveTo(2, Math.floor(height / 2));
            graphics.lineTo(width - 3, Math.floor(height / 2));
            graphics.strokePath();
        }

        // Add small Rust logo-like detail in the corner for larger blocks
        if (width > 45 && height > 25) { // Reduced thresholds
            const cornerSize = Math.min(12, width / 10, height / 6); // Slightly larger corner icon
            const cornerX = width - cornerSize - 3;
            const cornerY = 3;

            // Small gear icon suggestion
            graphics.lineStyle(1, 0x000000, 0.25);
            graphics.beginPath();
            graphics.arc(cornerX, cornerY, cornerSize / 2, 0, Math.PI * 2);
            graphics.strokePath();

            graphics.lineStyle(1, 0x000000, 0.2);
            graphics.beginPath();
            graphics.arc(cornerX, cornerY, cornerSize / 3, 0, Math.PI * 2);
            graphics.strokePath();
        }
    }

    private addBlock() {
        // Add a new block at the top of the screen with increased size range
        const blockWidth = Phaser.Math.Between(60, 100);   // Increased from 40-80
        const blockHeight = Phaser.Math.Between(30, 50);   // Increased from 20-40
        const x = Phaser.Math.Between(100, DEFAULT_WIDTH - 100);

        const block = this.createBlock(x, 100, blockWidth, blockHeight);
        if (block.body) {
            this.matter.body.setStatic(block.body, false);
        }

        // Update current tower height when a new block is added
        this.updateCurrentTowerHeight();
    }

    private startGame() {
        this.gameStarted = true;
        this.instructionsText.setVisible(false);

        // Enable physics for all blocks
        for (const block of this.blocks) {
            if (block.body) {
                this.matter.body.setStatic(block.body, false);
            }
        }

        // Initialize tower height
        this.updateCurrentTowerHeight();
    }

    private checkGameOver() {
        if (!this.gameStarted || this.isGameOver) return;

        // Check if any block is above the top boundary
        const topBoundary = 50;
        let anyBlockAboveBoundary = false;

        for (const block of this.blocks) {
            if (block.active && block.y < topBoundary && block.body && block.body.isSleeping) {
                anyBlockAboveBoundary = true;
                break;
            }
        }

        if (anyBlockAboveBoundary) {
            // Make sure we update the best height one last time before game over
            this.updateCurrentTowerHeight();
            this.updateBestHeight();
            this.gameOver();
        }
    }

    private gameOver() {
        this.isGameOver = true;

        // Count final number of blocks
        let finalVisibleBlocks = 0;
        for (const block of this.blocks) {
            if (block.active && block.y < DEFAULT_HEIGHT + 50) {
                finalVisibleBlocks++;
            }
        }

        // Calculate final efficiency score
        const finalScore = finalVisibleBlocks > 0 ?
            Math.round((this.highestPoint / finalVisibleBlocks) * 100) / 100 : 0;

        // Update game over text to show final height and score
        this.gameOverText.setText(`Game Over!\nHeight: ${this.highestPoint} px\nFinal Score: ${finalScore}\nBlocks Used: ${finalVisibleBlocks}`);
        this.gameOverText.setVisible(true);
        this.restartButton.setVisible(true);

        // Disable interactions
        this.newBlockButton.disableInteractive();
    }

    private restartGame() {
        // Clean up all text objects before restarting
        for (const block of this.blocks) {
            if (block.customData) {
                if (block.customData.textContainer) {
                    block.customData.textContainer.destroy();
                } else {
                    // Fallback for old implementation
                    if (block.customData.labelText) block.customData.labelText.destroy();
                    if (block.customData.typeText) block.customData.typeText.destroy();
                }
            }
        }

        this.scene.restart();
    }

    private updateBlockType() {
        // This is just to document the type change, no actual code is executed
        type Block = Phaser.Physics.Matter.Image & {
            body: BlockBody | null;
            customData?: {
                speed?: number;
                containerId?: string;
                containerType?: string;
                labelText?: Phaser.GameObjects.Text;
                typeText?: Phaser.GameObjects.Text;
                textContainer?: Phaser.GameObjects.Container;
            };
        };
    }
} 