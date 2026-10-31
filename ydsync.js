/* Синхронизация через Яндекс Диск — общий модуль для небольших приложений на sofaleya.github.io (Уход, Упражнения).
   Данные лежат у самого пользователя: «Приложения/<название>» на его Диске, приложение видит только эту папку.
   Синхронизируются все ключи localStorage с заданным префиксом. Один файл data.json + копии по дням (последние 14).

   Подключение:  YDS.init({app:'umyvanie', cid:'…', prefix:'skin:', exclude:['skin:lastBackup'], accent:'#ff4fa0', accentText:'#fff'})
   Панель рисуется в каждый элемент с классом ydsync-box. */
(function(){
  'use strict';
  var C=null,KEY='',st='off',msg='',busy=false,again=false,timer=null,applying=false,leaving=false;
  var API='https://cloud-api.yandex.net/v1/disk/resources',FILE='app:/data.json',DIR='app:/Копии';
  function p2(n){return (n<10?'0':'')+n}
  function iso(d){return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
  function set(p){var m=get();Object.keys(p).forEach(function(k){if(p[k]===undefined)delete m[k];else m[k]=p[k]});applying=true;try{localStorage.setItem(KEY,JSON.stringify(m))}catch(e){}applying=false;return m}
  function on(){return !!get().tok}
  function dirty(m){m=m||get();return (m.chg||0)>(m.sent||0)}
  function own(k){return k&&k.indexOf(C.prefix)===0&&C.exclude.indexOf(k)<0}
  function collect(){var d={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(own(k))d[k]=localStorage.getItem(k)}}catch(e){}return d}
  function empty(){return !Object.keys(collect()).length}
  function sameData(a){var b=collect(),ka=Object.keys(a).sort(),kb=Object.keys(b).sort();if(ka.join('|')!==kb.join('|'))return false;return ka.every(function(k){return a[k]===b[k]})}

  // следим за изменениями данных приложения
  var _set=Storage.prototype.setItem,_rem=Storage.prototype.removeItem;
  Storage.prototype.setItem=function(k,v){var watch=C&&this===localStorage&&!applying&&own(k),old=watch?this.getItem(k):null;_set.call(this,k,v);if(watch&&old!==String(v))changed()};
  Storage.prototype.removeItem=function(k){var watch=C&&this===localStorage&&!applying&&own(k),had=watch&&this.getItem(k)!==null;_rem.call(this,k);if(had)changed()};
  function changed(){if(!on())return;set({chg:Date.now()});clearTimeout(timer);timer=setTimeout(sync,1000)}

  function req(method,url){return fetch(url,{method:method,headers:{Authorization:'OAuth '+get().tok}}).then(function(r){
    if(r.status===401){set({tok:undefined,mod:undefined});msg='Вход в Яндекс устарел, войди заново';throw {code:401}}return r})}
  function ok(r){if(!r.ok)throw {code:r.status};return r}
  function meta(){return req('GET',API+'?fields=modified,name&path='+encodeURIComponent(FILE)).then(function(r){if(r.status===404)return null;return ok(r).json()})}
  function download(){return req('GET',API+'/download?path='+encodeURIComponent(FILE)).then(function(r){return ok(r).json()})
    .then(function(j){return fetch(j.href,{credentials:'omit',referrerPolicy:'no-referrer'})}).then(function(r){return ok(r).text()})
    .then(function(t){try{return JSON.parse(t)}catch(e){throw {code:'bad'}}})}
  function upload(path,text){return req('GET',API+'/upload?overwrite=true&path='+encodeURIComponent(path)).then(function(r){return ok(r).json()})
    .then(function(j){return fetch(j.href,{method:'PUT',body:new Blob([text],{type:'application/json'})})}).then(ok)}
  function mkdir(){return req('PUT',API+'?path='+encodeURIComponent(DIR)).then(function(r){if(r.status!==409)ok(r)})}
  async function daily(day){
    await mkdir();
    await req('POST',API+'/copy?overwrite=true&from='+encodeURIComponent(FILE)+'&path='+encodeURIComponent(DIR+'/'+C.app+'-'+day+'.json')).then(ok);
    var r=await req('GET',API+'?limit=200&sort=name&fields=_embedded.items.name,_embedded.items.path&path='+encodeURIComponent(DIR)).then(function(r){return ok(r).json()});
    var re=new RegExp('^'+C.app+'-\\d{4}-\\d\\d-\\d\\d\\.json$');
    var it=((r._embedded&&r._embedded.items)||[]).filter(function(x){return re.test(x.name)});
    for(var i=0;i<it.length-14;i++){try{await req('DELETE',API+'?permanently=true&path='+encodeURIComponent(it[i].path))}catch(e){}}
  }
  /* Склейка трёх версий: b - общая (что было в Диске при прошлой синхронизации), l - это устройство, r - Диск сейчас.
     Что поменяли только на одной стороне - берём оттуда. Поменяли обе - склеиваем глубже: объекты по полям,
     списки записей по id, простые списки как множества. Правка побеждает удаление. Совсем одно и то же поле
     поменяли по-разному - остаётся вариант этого устройства. */
  function m3eq(a,b){return JSON.stringify(a)===JSON.stringify(b)}
  function m3obj(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
  function m3ids(a){return Array.isArray(a)&&a.every(function(x){return m3obj(x)&&x.id!=null})}
  function m3prims(a){return Array.isArray(a)&&a.every(function(x){return x===null||typeof x!=='object'})}
  function merge3(b,l,r){
    if(m3eq(l,r))return l;
    if(m3eq(b,l))return r;
    if(m3eq(b,r))return l;
    if(l===undefined)return r;
    if(r===undefined)return l;
    if(m3obj(l)&&m3obj(r)){var bo=m3obj(b)?b:{},o={},ks={};
      Object.keys(r).concat(Object.keys(l)).forEach(function(k){if(ks[k])return;ks[k]=1;var v=merge3(bo[k],l[k],r[k]);if(v!==undefined)o[k]=v});return o}
    if(Array.isArray(l)&&Array.isArray(r)&&m3ids(l)&&m3ids(r)&&(l.length||r.length)){
      var bm={},lm={},rm={},order=[],seen={};
      if(m3ids(b))b.forEach(function(x){bm[x.id]=x});
      l.forEach(function(x){lm[x.id]=x});r.forEach(function(x){rm[x.id]=x});
      r.concat(l).forEach(function(x){if(!seen[x.id]){seen[x.id]=1;order.push(x.id)}});
      var out=[];order.forEach(function(id){var v=merge3(bm[id],lm[id],rm[id]);if(v!==undefined)out.push(v)});return out}
    if(m3prims(l)&&m3prims(r)){var bs=m3prims(b)?b.map(String):[],ls=l.map(String),rs=r.map(String),res=[],had={};
      l.concat(r).forEach(function(x){var k=String(x);if(had[k])return;had[k]=1;
        if(bs.indexOf(k)>=0&&(ls.indexOf(k)<0||rs.indexOf(k)<0))return;res.push(x)});return res}
    return l;
  }
  // значения в хранилище - строки; для склейки разбираем JSON, остальное держим как есть
  function dec(map){var o={};Object.keys(map||{}).forEach(function(k){var v=map[k];try{o[k]=JSON.parse(v)}catch(e){o[k]={__raw:v}}});return o}
  function enc(o){var m={};Object.keys(o).forEach(function(k){var v=o[k];m[k]=(m3obj(v)&&Object.keys(v).length===1&&typeof v.__raw==='string')?v.__raw:JSON.stringify(v)});return m}
  function baseGet(){try{var t=localStorage.getItem('yds-base:'+C.app);return t?JSON.parse(t):undefined}catch(e){return undefined}}
  function baseSet(map){applying=true;try{localStorage.setItem('yds-base:'+C.app,JSON.stringify(map))}catch(e){}applying=false}
  function pack(d){return JSON.stringify({app:C.app,v:1,savedAt:Date.now(),dev:get().dev,data:d||collect()})}
  function writeAll(map){applying=true;
    try{var cur=collect();Object.keys(cur).forEach(function(k){if(!(k in map))_rem.call(localStorage,k)});
      Object.keys(map).forEach(function(k){if(own(k))_set.call(localStorage,k,map[k])})}catch(e){}
    applying=false}
  function adopt(r,mod){
    writeAll(r.data);set({mod:mod,sent:get().chg||0});baseSet(r.data);
    try{sessionStorage.setItem('yds-note','Подтянула данные из Яндекс Диска')}catch(e){}
    (leaving=true,location.reload());
  }
  function errText(e){if(e&&e.code)return e.code==='bad'?'файл в Диске повреждён':'код '+e.code;return 'нет связи с Яндексом'+(e&&e.message?' ('+e.message+')':'')}
  async function sync(){
    if(!on())return;if(busy){again=true;return}
    busy=true;st='wait';paint();
    try{
      var m=get(),mt=await meta();
      if(mt&&mt.modified!==m.mod){
        var r=await download();if(!r||!r.data||r.app!==C.app)throw {code:'bad'};
        if(sameData(r.data)){set({mod:mt.modified});baseSet(r.data)}
        else if(empty()){busy=false;return adopt(r,mt.modified)}
        else{ // в Диске новое с другого устройства (или первое подключение): склеиваем с тем, что здесь
          var mine=collect(),b=m.mod?baseGet():undefined,merged=enc(merge3(b?dec(b):undefined,dec(mine),dec(r.data)));
          if(m3eq(merged,r.data)){busy=false;return adopt(r,mt.modified)}
          set({mod:mt.modified,chg:Date.now()});baseSet(r.data);
          if(!m3eq(merged,mine)){writeAll(merged);busy=false;
            try{sessionStorage.setItem('yds-note','Склеила отметки с другого устройства')}catch(e){}
            return (leaving=true,location.reload())}
        }
      }
      m=get();
      if(!empty()&&(dirty(m)||!mt)){
        var pre=await meta();
        if(pre&&pre.modified!==get().mod){again=true}
        else{
          var day=iso(new Date());
          if(pre&&m.bk!==day){try{await daily(day);set({bk:day})}catch(e){if(e&&e.code===401)throw e}}
          var chg=m.chg||Date.now(),snap=collect();await upload(FILE,pack(snap));
          var nm=await meta();set({mod:nm&&nm.modified,sent:chg});baseSet(snap);
        }
      }
      set({at:Date.now()});st='ok';msg='';
    }catch(e){st=on()?'err':'off';if(!(e&&e.code===401))msg=errText(e)}
    busy=false;paint();
    if(again){again=false;setTimeout(sync,300)}
  }
  function login(){leaving=true;location.href='https://oauth.yandex.ru/authorize?response_type=token&client_id='+C.cid+'&redirect_uri='+encodeURIComponent(C.redir)}
  function logout(){if(!confirm('Отключить Яндекс Диск на этом устройстве? Данные останутся и тут, и в Диске.'))return;
    var d=get().dev;applying=true;try{localStorage.removeItem(KEY)}catch(e){}applying=false;set({dev:d});st='off';msg='';paint()}

  var BTN='border:0;border-radius:10px;padding:8px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;';
  var LNK='background:none;border:0;padding:0;font:inherit;color:inherit;opacity:.75;text-decoration:underline;cursor:pointer';
  function prim(){return 'background:'+C.accent+';color:'+C.accentText+';'}
  function panel(){var m=get(),s='<div style="display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.4">';
    if(!m.tok){
      s+='<div style="opacity:.85">Отметки будут лежать в твоём Яндекс Диске, в папке «Приложения/'+esc(C.title)+'», и сами появятся на другом телефоне или компьютере. Приложение видит только эту папку.</div>'+
        (msg?'<div style="color:#e0556b">'+esc(msg)+'</div>':'')+
        '<div><button type="button" data-yds="in" style="'+BTN+prim()+'">Войти через Яндекс</button></div>';
    }else{
      var at=m.at?new Date(m.at):null;
      s+='<div>'+(st==='wait'?'Синхронизирую…':st==='err'?'<span style="color:#e0556b">Не получилось: '+esc(msg)+'</span>':'✅ Подключено'+(at?'. Последняя синхронизация: '+(iso(at)===iso(new Date())?'сегодня':at.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}))+' в '+p2(at.getHours())+':'+p2(at.getMinutes()):''))+'</div>'+
        '<div style="opacity:.75;font-size:13px">Копии за последние 14 дней лежат там же, в папке «Копии».</div>'+
        '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><button type="button" data-yds="now" style="'+BTN+prim()+'">Синхронизировать сейчас</button>'+
        '<button type="button" data-yds="out" style="'+LNK+'">отключить</button></div>';
    }
    return s+'</div>'}
  function label(){if(!on())return '';if(st!=='err'&&st!=='wait'&&dirty())return 'синхронизация…';return st==='wait'?'синхронизация…':st==='err'?'нет связи с Диском':'Диск ✓'}
  function paint(){document.querySelectorAll('.ydsync-box').forEach(function(b){b.innerHTML=panel()});
    document.querySelectorAll('.ydsync-badge').forEach(function(b){var t=label();b.textContent=t;b.hidden=!t;b.title=st==='err'?msg:''})}
  function note(t){var d=document.createElement('div');d.textContent=t;d.setAttribute('role','status');
    d.style.cssText='position:fixed;left:16px;right:16px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:999;padding:12px 16px;border-radius:12px;background:#222;color:#fff;font:14px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:520px;margin:0 auto';
    document.body.appendChild(d);setTimeout(function(){d.remove()},5000)}

  window.YDS={init:function(o){
    C={app:o.app,cid:o.cid,title:o.title||o.app,prefix:o.prefix,exclude:o.exclude||[],accent:o.accent||'#333',accentText:o.accentText||'#fff',
      redir:o.redir||(location.origin+location.pathname.replace(/[^/]*$/,''))};
    KEY='yds:'+C.app;
    // ответ Яндекса после входа приходит в адресе (#access_token=…)
    var h=location.hash||'';
    if(h.indexOf('access_token=')>=0||h.indexOf('error=')>=0){var q=new URLSearchParams(h.slice(1));
      try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
      if(q.get('access_token')){set({tok:q.get('access_token'),exp:Date.now()+(+q.get('expires_in')||31536000)*1000,dev:get().dev||uid()});C.justIn=true}
      else msg='Яндекс не дал доступ'+(q.get('error')==='access_denied'?': вход отменён':' ('+(q.get('error_description')||q.get('error'))+')')}
    document.addEventListener('click',function(e){var g=e.target.closest&&e.target.closest('.ydsync-badge');
      if(g){var bx=document.querySelector('.ydsync-box');if(bx){for(var el=bx;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;bx.scrollIntoView({behavior:'smooth',block:'center'})}return}
      var b=e.target.closest&&e.target.closest('[data-yds]');if(!b)return;e.preventDefault();
      var a=b.getAttribute('data-yds');if(a==='in')login();else if(a==='now')sync();else if(a==='out')logout()});
    document.addEventListener('visibilitychange',function(){if(!on())return;
      if(document.visibilityState==='visible')setTimeout(sync,800);
      else if(dirty()){clearTimeout(timer);sync()}}); // свернули с неотправленным - отправляем сразу
    window.addEventListener('pagehide',function(){if(on()&&dirty()&&!busy){clearTimeout(timer);sync()}});
    window.addEventListener('beforeunload',function(e){if(!leaving&&on()&&st!=='err'&&(dirty()||busy)){clearTimeout(timer);if(!busy)sync();e.preventDefault();e.returnValue=''}});
    setInterval(function(){if(on()&&!busy&&document.visibilityState==='visible')sync()},60000);
    window.addEventListener('storage',function(e){if(e.key===KEY){if(on()&&st==='off')sync();else paint()}});
    paint();
    try{var n=sessionStorage.getItem('yds-note');if(n){sessionStorage.removeItem('yds-note');setTimeout(function(){note(n)},300)}}catch(e){}
    if(on()){st='wait';paint();setTimeout(function(){sync();if(C.justIn)note('Яндекс Диск подключён')},600)}
  },sync:function(){return sync()}};
})();
