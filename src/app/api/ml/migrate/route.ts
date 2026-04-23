import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Supabase DATABASE_URL pode ter caracteres especiais (#, +, @) no password
// que quebram o URL parser do pg. Esta função extrai user/pass/host
// usando o ÚLTIMO @ como separador de credenciais vs. host.
function parseDbUrl(rawUrl: string) {
  const proto = rawUrl.match(/^(postgresql?):\/\//)?.[1];
  if (!proto) throw new Error('DATABASE_URL não é uma URL postgresql válida');

  const withoutProto = rawUrl.slice(proto.length + 3);
  const lastAt = withoutProto.lastIndexOf('@');
  if (lastAt === -1) throw new Error('DATABASE_URL sem @ separador');

  const credentials = withoutProto.slice(0, lastAt);
  const hostPart = withoutProto.slice(lastAt + 1);

  const colonIdx = credentials.indexOf(':');
  const user = credentials.slice(0, colonIdx);
  const password = credentials.slice(colonIdx + 1);

  const hostMatch = hostPart.match(/^([^:/]+)(?::(\d+))?\/(.+)$/);
  if (!hostMatch) throw new Error('Formato de host inválido na DATABASE_URL');

  return {
    user,
    password,   // pg aceita password sem encoding quando passado como objeto
    host: hostMatch[1],
    port: parseInt(hostMatch[2] || '5432'),
    database: hostMatch[3],
  };
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL não configurada no Vercel' }, { status: 500 });
  }

  let client: Client | null = null;
  try {
    const params = parseDbUrl(dbUrl);
    console.log('[migrate] Conectando a:', params.host, 'db:', params.database, 'user:', params.user);

    client = new Client({ ...params, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
    await client.connect();
    console.log('[migrate] Conectado.');

    // Verifica se a coluna já existe
    const check = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'taxas_config' AND column_name = 'ml_access_token'
    `);

    if (check.rows.length > 0) {
      await client.end();
      return NextResponse.json({ ok: true, message: 'Coluna ml_access_token já existe.' });
    }

    // Cria a coluna
    await client.query(`ALTER TABLE taxas_config ADD COLUMN IF NOT EXISTS ml_access_token TEXT`);
    console.log('[migrate] Coluna criada.');

    // Confirma
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'taxas_config' ORDER BY ordinal_position
    `);
    await client.end();

    return NextResponse.json({
      ok: true,
      message: 'Coluna ml_access_token criada com sucesso!',
      columns: cols.rows.map((r: any) => r.column_name),
    });
  } catch (err: any) {
    console.error('[migrate] Erro:', err?.message);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
