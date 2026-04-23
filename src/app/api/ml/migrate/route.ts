import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL não configurada no Vercel' }, { status: 500 });
  }

  // Mascara a URL nos logs (remove senha)
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':***@');
  console.log('[migrate] DATABASE_URL disponível:', maskedUrl);

  let client: Client | null = null;
  try {
    client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    console.log('[migrate] Conectando ao banco...');
    await client.connect();
    console.log('[migrate] Conectado.');

    // Verifica se a coluna já existe
    const checkRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'taxas_config'
        AND column_name = 'ml_access_token'
    `);

    if (checkRes.rows.length > 0) {
      await client.end();
      return NextResponse.json({ ok: true, message: 'Coluna ml_access_token já existe — nada a fazer.' });
    }

    // Adiciona a coluna
    console.log('[migrate] Criando coluna ml_access_token...');
    await client.query(`ALTER TABLE taxas_config ADD COLUMN IF NOT EXISTS ml_access_token TEXT`);
    console.log('[migrate] Coluna criada.');

    // Lista todas as colunas para confirmar
    const verifyRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'taxas_config'
      ORDER BY ordinal_position
    `);
    await client.end();

    return NextResponse.json({
      ok: true,
      message: 'Coluna ml_access_token criada com sucesso!',
      columns: verifyRes.rows.map((r: any) => r.column_name),
    });
  } catch (err: any) {
    console.error('[migrate] Erro:', err?.message, err?.code);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({
      ok: false,
      error: err?.message || 'Erro desconhecido',
      code: err?.code,
      dbUrl: dbUrl ? `${dbUrl.split('@')[1] || 'formato inválido'}` : 'não definida',
    }, { status: 500 });
  }
}
