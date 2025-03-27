'use client';
import React, { useEffect, useState } from 'react'
import * as Phaser from 'phaser';
import { Boot } from '@/scenes/Boot';
import { Preloader } from '@/scenes/Preloader';
import { WalletConnect } from '@/scenes/WalletConnect';
import { MainMenu } from '@/scenes/MainMenu';
import { Game as MainGame } from '@/scenes/Game';
import { BlockStacker } from '@/scenes/BlockStacker';
import { useUmi } from '@/providers/useUmi';
import EventCenter from '@/events/eventCenter';
import { useWallet } from '@solana/wallet-adapter-react';
import PhaserMatterCollisionPlugin from 'phaser-matter-collision-plugin';

export const DEFAULT_WIDTH: number = 800;
export const DEFAULT_HEIGHT: number = 600;

const Game = () => {
    const wallet = useWallet();
    const umi = useUmi();
    const [ready, setReady] = useState(false);

    EventCenter.on("ready", () => {
        setReady(true);
    });

    useEffect(() => {
        if (ready && wallet.connected) {
            EventCenter.emit("umi", umi);
        }
    }, [ready, wallet.connected, umi]);

    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            type: Phaser.AUTO,
            scene: [
                Boot,
                Preloader,
                WalletConnect,
                MainMenu,
                MainGame,
                BlockStacker,
            ],
            render: {
                pixelArt: false,
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoRound: true,
            },
            pixelArt: true,
            physics: {
                default: 'matter',
                matter: {
                    gravity: { x: 0, y: 2 },
                    debug: true
                }
            },
            plugins: {
                scene: [
                    {
                        plugin: PhaserMatterCollisionPlugin,
                        key: 'matterCollision',
                        mapping: 'matterCollision'
                    }
                ]
            }
        };
        const game = new Phaser.Game(config)
        return () => {
            game.destroy(true)
        }
    }, [])
    return (
        <div>

        </div>
    )
}


export default Game;