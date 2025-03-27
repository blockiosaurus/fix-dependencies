/**
 * Container Names Data
 * 
 * This file contains lists of Rust crate names and versions
 * to be displayed on container blocks in the Block Stacker game.
 */

// Rust crate names (popular crates from crates.io)
export const CRATE_NAMES = [
    'ark-bn254',
    'ark-ec',
    'ark-ff',
    'ark-serialize',
    'array-bytes',
    'base64',
    'base69',
    'bincode',
    'bitflags',
    'blake3',
    'borsh',
    'borsh-again',
    'moar-borsh',
    'bs58',
    'bs69',
    'bv',
    'bytemuck',
    'console_error_panic_hook',
    'console_log',
    'curve25519-dalek',
    'getrandom',
    'itertools',
    'js-sys',
    'lazy_static',
    'active-static',
    'libc',
    'libsecp256k1',
    'log',
    'memoffset',
    'num-bigint',
    'num-derive',
    'num-traits',
    'parking_lot',
    'rand',
    'rand_chacha',
    'rustversion',
    'serde',
    'serde_bytes',
    'serde_derive',
    'serde_json',
    'sha2',
    'sha3',
    'sha4',
    'sha5',
    'sha-tokyo-drift',
    'solana-frozen-abi',
    'solana-grilled-abi',
    'solana-frozen-abi-macro',
    'solana-sdk-macro',
    'thiserror',
    'tiny-bip39',
    'wasm-bindgen',
    'zeroize',
    'atime',
    'btime',
    'anotherborsh',
    'metaboss-tears',
    'rage',
    'solana-zk-stuff',
    'more-zk-idk-y',
    'spl-token-2022',
    'spl-token-2024',
    'spl-token-2026',
    'spl-token-2099',
    'spl-token-3000-BC',
    'spl-yanked',
    'fortran-lang',
];

// Generate a semantic version following Rust conventions
export function generateVersion(): string {
    const major = Math.floor(Math.random() * 3);
    const minor = Math.floor(Math.random() * 20);
    const patch = Math.floor(Math.random() * 15);

    // Sometimes add a pre-release tag
    if (Math.random() < 0.2) {
        const preReleaseTags = ['alpha', 'beta', 'rc'];
        const preReleaseTag = preReleaseTags[Math.floor(Math.random() * preReleaseTags.length)];
        const preReleaseNum = Math.floor(Math.random() * 10) + 1;
        return `${major}.${minor}.${patch}-${preReleaseTag}.${preReleaseNum}`;
    }

    return `${major}.${minor}.${patch}`;
}

/**
 * Generate a Rust crate name and version
 */
export function generateContainerID(): string {
    const crateName = CRATE_NAMES[Math.floor(Math.random() * CRATE_NAMES.length)];
    return crateName;
}

/**
 * Generate a version string for the crate
 */
export function generateContainerType(): string {
    return generateVersion();
} 