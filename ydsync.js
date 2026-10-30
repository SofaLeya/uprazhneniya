/* Синхронизация через Яндекс Диск — общий модуль для небольших приложений на sofaleya.github.io (Уход, Упражнения).
   Данные лежат у самого пользователя: «Приложения/<название>» на его Диске, приложение видит только эту папку.
   Синхронизируются все ключи localStorage с заданным префиксом. Один файл data.json + копии по дням (последние 14).

   Подключение:  YDS.init({app:'umyvanie', cid:'…', prefix:'skin:', exclude:['skin:lastBackup'], accent:'#ff4fa0', accentText:'#fff'})
   Панель рисуется в каждый элемент с классом ydsync-box. */
(function(){
  'use strict';
  var C=null,KEY='',st='off',msg='',busy=false,again=false,timer=null,applying=false;
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
  function changed(){if(!on())return;set({chg:Date.now()});clearTimeout(timer);timer=setTimeout(sync,2500)}

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
  function pack(){return JSON.stringify({app:C.app,v:1,savedAt:Date.now(),dev:get().dev,data:collect()})}
  function adopt(r,mod){
    applying=true;
    try{var cur=collect();Object.keys(cur).forEach(function(k){if(!(k in r.data))_rem.call(localStorage,k)});
      Object.keys(r.data).forEach(function(k){if(own(k))_set.call(localStorage,k,r.data[k])})}catch(e){}
    applying=false;set({mod:mod,sent:get().chg||0});
    try{sessionStorage.setItem('yds-note','Подтянула данные из Яндекс Диска')}catch(e){}
    location.reload();
  }
  function errText(e){if(e&&e.code)return e.code==='bad'?'файл в Диске повреждён':'код '+e.code;return 'нет связи с Яндексом'+(e&&e.message?' ('+e.message+')':'')}
  async function sync(){
    if(!on())return;if(busy){again=true;return}
    busy=true;st='wait';paint();
    try{
      var m=get(),mt=await meta();
      if(mt&&mt.modified!==m.mod){
        var r=await download();if(!r||!r.data||r.app!==C.app)throw {code:'bad'};
        if(sameData(r.data)){set({mod:mt.modified})}
        else if(!m.mod&&!empty()){
          if(confirm('В Яндекс Диске уже есть данные ('+Object.keys(r.data).length+' записей). Взять их на это устройство?\n\nОК - взять из Диска\nОтмена - оставить то, что на этом устройстве (версия из Диска сохранится в папке «Копии»)')){busy=false;return adopt(r,mt.modified)}
          await mkdir();await upload(DIR+'/до-подключения-'+iso(new Date())+'.json',JSON.stringify(r));set({mod:mt.modified,chg:Date.now()});
        }
        else if(m.mod&&dirty(m)&&!empty()){
          await mkdir();await upload(DIR+'/другое-устройство-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.json',JSON.stringify(r));
          set({mod:mt.modified});msg='';note('Данные менялись и тут, и на другом устройстве. Оставила эти, другую версию сохранила в Диске: «Копии».');
        }
        else{busy=false;return adopt(r,mt.modified)}
      }
      m=get();
      if(!empty()&&(dirty(m)||!mt)){
        var day=iso(new Date());
        if(mt&&m.bk!==day){try{await daily(day);set({bk:day})}catch(e){if(e&&e.code===401)throw e}}
        var chg=m.chg||Date.now();await upload(FILE,pack());
        var nm=await meta();set({mod:nm&&nm.modified,sent:chg});
      }
      set({at:Date.now()});st='ok';msg='';
    }catch(e){st=on()?'err':'off';if(!(e&&e.code===401))msg=errText(e)}
    busy=false;paint();
    if(again){again=false;setTimeout(sync,300)}
  }
  function login(){location.href='https://oauth.yandex.ru/authorize?response_type=token&client_id='+C.cid+'&redirect_uri='+encodeURIComponent(C.redir)}
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
  function label(){if(!on())return '';return st==='wait'?'синхронизация…':st==='err'?'нет связи с Диском':'Диск ✓'}
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
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&on())setTimeout(sync,800)});
    window.addEventListener('storage',function(e){if(e.key===KEY){if(on()&&st==='off')sync();else paint()}});
    paint();
    try{var n=sessionStorage.getItem('yds-note');if(n){sessionStorage.removeItem('yds-note');setTimeout(function(){note(n)},300)}}catch(e){}
    if(on()){st='wait';paint();setTimeout(function(){sync();if(C.justIn)note('Яндекс Диск подключён')},600)}
  },sync:function(){return sync()}};
})();
