export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>LucroDash</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#0a0918;color:#e2e8f0;font-family:-apple-system,system-ui,sans-serif}
          input,select{background:#0f0e17;color:#e2e8f0;border:1px solid #2d2d3d;border-radius:8px;padding:8px 12px;font-size:14px;outline:none}
          input:focus,select:focus{border-color:#6366f1}
          button{cursor:pointer}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
