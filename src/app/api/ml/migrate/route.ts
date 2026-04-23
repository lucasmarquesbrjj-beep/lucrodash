import { NextResponse } from 'next/server';
import { Client } from 'pg';

// Rota de migração one-shot — adiciona ml_access_token à tabela taxas_config
// Usa DATABASE_URL (Postgres direto) para ter permissão de ALTER TABLE
export const maxDuration = 30;

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL não configurada' }, { status: 500 });
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

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
    await client.query(`
      ALTER TABLE taxas_config
      ADD COLUMN IF NOT EXISTS ml_access_token TEXT;
    `);

    // Confirma que foi criada
    const verifyRes = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'taxas_config'
      ORDER BY ordinal_position
    `);

    await client.end();

    return NextResponse.json({
      ok: true,
      message: 'Coluna ml_access_token criada com sucesso!',
      columns: verifyRes.rows.map(r => r.column_name),
    });
  } catch (err: any) {
    await client.end().catch(() => {});
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
