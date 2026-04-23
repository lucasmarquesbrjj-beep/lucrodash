export default function RootLayout({ children }: { children: React.ReactNode }) {
  // [FIX PERMANENTE] background inline no html+body — elimina flash branco antes do CSS/JS carregar
  return (
    <html lang="pt-BR" style={{ background: '#0a0918' }}>
      <head>
        <title>Holy Dash · Ferramentas para quem constrói com propósito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Ferramentas para quem constrói com propósito" />
       <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32" />
<link rel="apple-touch-icon" href="/favicon.png" />
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#0a0918;color:#e2e8f0;font-family:-apple-system,system-ui,sans-serif}
          input,select{background:#0f0e17;color:#e2e8f0;border:1px solid #2d2d3d;border-radius:8px;padding:8px 12px;font-size:14px;outline:none}
          input:focus,select:focus{border-color:#6366f1}
          button{cursor:pointer}
          #hd-shell{position:fixed;inset:0;background:#0a0918;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px}
          #hd-shell .logo{width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,#4338ca,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:22px;letter-spacing:-1px}
          #hd-shell .name{color:#e2e8f0;font-weight:700;font-size:16px;font-family:-apple-system,system-ui,sans-serif}
          #hd-shell .bar{width:120px;height:3px;background:#1e1d2e;border-radius:2px;overflow:hidden;position:relative}
          #hd-shell .bar::after{content:'';position:absolute;top:0;height:100%;width:45%;background:linear-gradient(90deg,#4338ca,#7c3aed);border-radius:2px;animation:hd-slide 1.4s ease-in-out infinite}
          @keyframes hd-slide{0%{left:-50%}100%{left:110%}}
        `}</style>
      </head>
      {/* [FIX PERMANENTE] background inline no body — garante cor escura antes de qualquer paint */}
      <body style={{ background: '#0a0918' }}>
        <div id="hd-shell">
          <div className="logo">H</div>
          <div className="name">Holy Dash</div>
          <div className="bar"></div>
        </div>
        {children}
      </body>
    </html>
  )
}
