import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '@/components/Game';
import { Umi } from '@metaplex-foundation/umi';
import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
    private umi!: Umi;
    background!: GameObjects.Image;
    logo!: GameObjects.Image;
    title!: GameObjects.Text;
    welcome!: GameObjects.Text;
    startGameText!: GameObjects.Text;
    blockStackerText!: GameObjects.Text;
    gradient!: GameObjects.Graphics;

    constructor() {
        super('MainMenu');
    }

    init(args: { umi: Umi }) {
        this.umi = args.umi;
    }

    create() {
        // Create an industrial gradient background
        this.gradient = this.add.graphics();

        // Create vertical gradient from dark steel to navy blue
        const topColor = 0x2C3539;    // Dark steel gray
        const middleColor = 0x384450; // Industrial blue-gray
        const bottomColor = 0x2C5F85; // Navy blue from our palette

        // Draw main gradient background
        const gradientHeight = DEFAULT_HEIGHT / 10;
        for (let y = 0; y < DEFAULT_HEIGHT; y += gradientHeight) {
            const ratio = y / DEFAULT_HEIGHT;
            let color;

            if (ratio < 0.5) {
                // Interpolate between top and middle color
                const localRatio = ratio / 0.5;
                color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(topColor),
                    Phaser.Display.Color.ValueToColor(middleColor),
                    100,
                    Math.floor(localRatio * 100)
                );
            } else {
                // Interpolate between middle and bottom color
                const localRatio = (ratio - 0.5) / 0.5;
                color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(middleColor),
                    Phaser.Display.Color.ValueToColor(bottomColor),
                    100,
                    Math.floor(localRatio * 100)
                );
            }

            this.gradient.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            this.gradient.fillRect(0, y, DEFAULT_WIDTH, gradientHeight + 1);
        }

        // Add subtle container-like patterns
        this.gradient.lineStyle(2, 0x6E7F80, 0.2);

        // Horizontal lines to simulate container edges
        for (let y = gradientHeight * 3; y < DEFAULT_HEIGHT; y += gradientHeight * 3) {
            this.gradient.beginPath();
            this.gradient.moveTo(0, y);
            this.gradient.lineTo(DEFAULT_WIDTH, y);
            this.gradient.strokePath();
        }

        // Vertical lines to simulate container sections
        for (let x = DEFAULT_WIDTH / 6; x < DEFAULT_WIDTH; x += DEFAULT_WIDTH / 6) {
            this.gradient.beginPath();
            this.gradient.moveTo(x, 0);
            this.gradient.lineTo(x, DEFAULT_HEIGHT);
            this.gradient.strokePath();
        }

        // Add some container-like highlights
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(50, DEFAULT_WIDTH - 50);
            const y = Phaser.Math.Between(50, DEFAULT_HEIGHT - 50);
            const width = Phaser.Math.Between(80, 200);
            const height = Phaser.Math.Between(30, 60);

            // Draw container-like highlight
            this.gradient.lineStyle(2, 0xBCAA99, 0.1);
            this.gradient.strokeRect(x, y, width, height);
        }

        this.title = this.add.text(DEFAULT_WIDTH / 2, DEFAULT_HEIGHT * 0.25, 'Cargo Update', {
            fontFamily: 'Arial Black', fontSize: 96, color: '#2C5F85',
            stroke: '#A84632',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Block stacker game button (now the main game option)
        this.blockStackerText = this.add.text(DEFAULT_WIDTH / 2, DEFAULT_HEIGHT * 0.7, 'Start Game', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#BCAA99',
            stroke: '#3D5E45',
            strokeThickness: 6,
            align: 'center',
            backgroundColor: '#6E7F80'
        }).setOrigin(0.5)
            .setPadding(20)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('BlockStacker', { umi: this.umi });
            })
            .on('pointerover', () => this.blockStackerText.setStyle({ backgroundColor: '#8B5D33' }))
            .on('pointerout', () => this.blockStackerText.setStyle({ backgroundColor: '#6E7F80' }));
    }
}