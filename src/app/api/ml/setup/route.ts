import { NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Service role key permite DDL (ALTER TABLE). Opcional — se não existir, retorna SQL manual.
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

// Extrai o project ref da URL: https://<ref>.supabase.co
function getProjectRef(url: string): string {
  return url.replace('https://', '').split('.')[0];
}

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Verifica se a coluna ml_access_token já existe
  const checkRes = await fetch(
    `${SB_URL}/rest/v1/taxas_config?id=eq.config&select=ml_access_token&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: 'no-store' }
  );
  const checkBody = await checkRes.json();
  results.columnCheckStatus = checkRes.status;
  results.columnCheckBody = checkBody;

  const columnExists = checkRes.ok && !checkBody?.code;
  results.columnExists = columnExists;

  if (columnExists) {
    return NextResponse.json({ ok: true, message: 'Coluna ml_access_token já existe.', results });
  }

  // 2. Coluna não existe — tenta criar via pg_meta (requer service role key)
  const projectRef = getProjectRef(SB_URL);
  const pgMetaUrl = `https://${projectRef}.supabase.co/pg/tables`;

  // Tenta via pg/query endpoint (Supabase admin)
  const sql = `ALTER TABLE taxas_config ADD COLUMN IF NOT EXISTS ml_access_token TEXT;`;

  const pgRes = await fetch(`https://${projectRef}.supabase.co/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SB_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const pgBody = await pgRes.json().catch(() => pgRes.text());
  results.pgQueryStatus = pgRes.status;
  results.pgQueryBody = pgBody;

  if (pgRes.ok) {
    return NextResponse.json({ ok: true, message: 'Coluna ml_access_token criada com sucesso!', results });
  }

  // 3. Tenta via Supabase Management API
  const mgmtRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SB_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const mgmtBody = await mgmtRes.json().catch(() => mgmtRes.text());
  results.mgmtApiStatus = mgmtRes.status;
  results.mgmtApiBody = mgmtBody;

  if (mgmtRes.ok) {
    return NextResponse.json({ ok: true, message: 'Coluna criada via Management API!', results });
  }

  // 4. Nenhum método funcionou — retorna SQL para executar manualmente
  return NextResponse.json({
    ok: false,
    message: 'Não foi possível criar a coluna automaticamente. Execute o SQL abaixo no Supabase SQL Editor.',
    sql,
    supabaseSqlEditorUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
    results,
  }, { status: 500 });
}
