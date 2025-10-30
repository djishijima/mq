// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const dist = path.join(process.cwd(), 'dist');
const indexHtml = path.join(dist, 'index.html');
const manifestPath = path.join(dist, 'manifest.json');

app.use(express.json());

// no-cache（HTMLのみ）
app.use((req,res,next)=>{
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control','no-store, max-age=0');
  }
  next();
});

// 静的配信（資産は長期キャッシュ可）
app.use(express.static(dist, {
  immutable: true,
  maxAge: '1y',
  extensions: ['html']
}));

// 健康
app.get('/healthz', (_q,res)=>res.status(200).send('ok'));

// Echo API（POST / と /api/test）
app.post('/', (req,res)=>res.json({ok:true, q:req.query, body:req.body}));
app.post('/api/test', (req,res)=>res.json({ok:true, body:req.body}));

// index注入（manifestからエントリを自動解決）
app.get('*', (req,res,next)=>{
  if (!fs.existsSync(indexHtml)) return next();
  try {
    const html = fs.readFileSync(indexHtml,'utf8');
    let entry = null;
    if (fs.existsSync(manifestPath)) {
        const mf = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
        for (const k of Object.keys(mf)) {
          const v = mf[k];
          if (v && v.isEntry && v.file && v.file.endsWith('.js')) { entry = v.file; break; }
        }
    }
    
    // manifest未使用の構成でも安全に
    const scriptTag = entry ? `<script type="module" src="/${entry}"></script>` : '';
    const swKiller = `
<script>
if('serviceWorker'in navigator){
  navigator.serviceWorker.getRegistrations()
    .then(rs=>Promise.all(rs.map(r=>r.unregister())))
    .then(()=>caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))))
    .catch(()=>{});
}
</script>`;
    const injected = html.replace('</body>', `${scriptTag}\n${swKiller}\n</body>`);
    res.set('Content-Type','text/html; charset=utf-8');
    return res.status(200).send(injected);
  } catch(e){ return next(e); }
});

const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log(`listening on ${port}`));
