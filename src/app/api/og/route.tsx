import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
    // Define the colors for our container theme
    const navyBlue = '#2C5F85';
    const rustRed = '#A84632';
    const containerGreen = '#3D5E45';
    const beigeKhaki = '#BCAA99';
    const brown = '#8B5D33';
    const steelGray = '#6E7F80';
    const darkSteelGray = '#2C3539';

    try {
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(to bottom, ${darkSteelGray}, ${navyBlue})`,
                        position: 'relative',
                    }}
                >
                    {/* Grid lines to simulate container stacks */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `
              linear-gradient(to right, ${steelGray}20 1px, transparent 1px),
              linear-gradient(to bottom, ${steelGray}20 1px, transparent 1px)
            `,
                        backgroundSize: '100px 100px',
                    }} />

                    {/* Container blocks */}
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                bottom: `${i * 80 + 50}px`,
                                left: `${200 + (i % 3) * 20}px`,
                                width: '400px',
                                height: '80px',
                                backgroundColor: [navyBlue, rustRed, containerGreen, beigeKhaki, brown][i % 5],
                                border: `4px solid ${steelGray}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '5px 5px 15px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div style={{
                                color: 'white',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                            }}>
                                {['ark-serialize', 'borsh', 'solana-sdk', 'serde', 'rand'][i % 5]}
                            </div>
                        </div>
                    ))}

                    {/* Title */}
                    <div style={{
                        marginTop: '-100px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <h1 style={{
                            fontSize: '100px',
                            fontWeight: 'bold',
                            color: beigeKhaki,
                            textShadow: `4px 4px 8px rgba(0, 0, 0, 0.5), 0 0 10px ${rustRed}`,
                            margin: '0',
                        }}>
                            CARGO UPDATE
                        </h1>
                        <p style={{
                            fontSize: '32px',
                            color: 'white',
                            margin: '10px 0 0',
                        }}>
                            Stack containers and update your Rust dependencies
                        </p>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e) {
        console.error(e);
        return new Response('Failed to generate image', { status: 500 });
    }
} 