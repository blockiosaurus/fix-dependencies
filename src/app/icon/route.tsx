import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
    // Define the colors for our container theme
    const navyBlue = '#2C5F85';
    const containerGreen = '#3D5E45';
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
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: navyBlue,
                        borderRadius: '20%',
                        border: `8px solid ${steelGray}`,
                    }}
                >
                    {/* Container stacks */}
                    <div
                        style={{
                            width: '80%',
                            height: '60%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        <div
                            style={{
                                height: '33%',
                                width: '100%',
                                backgroundColor: containerGreen,
                                border: `2px solid ${darkSteelGray}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>C</div>
                        </div>
                        <div
                            style={{
                                height: '33%',
                                width: '100%',
                                backgroundColor: containerGreen,
                                border: `2px solid ${darkSteelGray}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>U</div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 32,
                height: 32,
            },
        );
    } catch (e) {
        console.error(e);
        return new Response('Failed to generate icon', { status: 500 });
    }
} 