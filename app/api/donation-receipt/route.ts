import { NextRequest, NextResponse } from 'next/server';

/**
 * RECHTLICHER HINWEIS:
 * Headbang Handwerk ist als gemeinnütziger Verein anerkannt (Bescheid des
 * Finanzamts vom 18.06.2026). Diese Route erstellt trotzdem nur eine einfache
 * Zahlungsbestätigung für Buchhaltungszwecke und keine Zuwendungsbestätigung
 * nach § 10b EStG: Sponsoring ist wegen der Gegenleistung keine Spende, und
 * Zuwendungsbestätigungen müssen dem amtlichen Muster folgen.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, companyName, address, amount } = body;

    if (!paymentId || !companyName || !amount) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    const receiptNumber = `HH-${Date.now()}`;

    const receipt = {
      receiptNumber,
      paymentId,
      companyName,
      address: address || '',
      amount,
      date: new Date().toLocaleDateString('de-DE'),
      purpose: 'Sponsoring – Headbang Handwerk Festival-Saison 2025',
      disclaimer:
        'Diese Zahlungsbestätigung ist keine Zuwendungsbestätigung (Spendenquittung) im Sinne des § 10b EStG. Sponsoring-Zahlungen sind wegen der Gegenleistung keine Spenden.',
    };

    // TODO: Generate PDF and send via email
    console.log('Receipt generated:', receipt);

    return NextResponse.json({ success: true, receipt });
  } catch (err) {
    console.error('Receipt error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
