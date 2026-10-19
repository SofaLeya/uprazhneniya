/* Схематичные анимации упражнений: человечек рисуется на canvas, запускается при раскрытии стрелки. */
(function(){
'use strict';
var D = Math.PI/180;
var T1=.45, T2=.45, NECK=.12, HR=.15, UA=.5, FA=.45, TH=.8, SH=.78, FT=.22;
var COL = {body:'#b98cff', far:'#6c58a3', floor:'#3a3a46', prop:'#6b6b78', band:'#ffb454', ink:'#a3a3ad'};

/* ---------- математика ---------- */
function lerp(a,b,p){ return a+(b-a)*p; }
function mix(a,b,p){
  if(typeof a==='number') return lerp(a,b,p);
  if(Array.isArray(a)) return a.map(function(v,i){ return mix(v,b[i],p); });
  if(a && typeof a==='object'){ var o={}; for(var k in a){ o[k]=(k in b)? mix(a[k],b[k],p) : a[k]; } return o; }
  return a;
}
function ik(r,t,l1,l2,b){
  var dx=t[0]-r[0], dy=t[1]-r[1], d=Math.hypot(dx,dy)||1e-6;
  var ux=dx/d, uy=dy/d;
  d=Math.min(d,(l1+l2)*0.999); d=Math.max(d,Math.abs(l1-l2)+0.01);
  var a=(d*d+l1*l1-l2*l2)/(2*d), h=Math.sqrt(Math.max(0,l1*l1-a*a));
  return [[r[0]+ux*a-uy*h*b, r[1]+uy*a+ux*h*b],[r[0]+ux*d, r[1]+uy*d]];
}
function limb(root,s,l1,l2,leg){
  var j,e;
  if(s.ik){
    var t=s.rel?[root[0]+s.ik[0],root[1]+s.ik[1]]:s.ik;
    var r=ik(root,t,l1,l2,s.b||1); j=r[0]; e=r[1];
  } else if(s.fk){
    var a1=s.fk[0]*D,a2=s.fk[1]*D;
    j=[root[0]+l1*Math.cos(a1),root[1]+l1*Math.sin(a1)];
    e=[j[0]+l2*Math.cos(a2),j[1]+l2*Math.sin(a2)];
  } else { j=s.k; e=s.to; if(s.rel){ j=[root[0]+j[0],root[1]+j[1]]; e=[root[0]+e[0],root[1]+e[1]]; } }
  var f=null;
  if(leg){ var fa=(s.f||0)*D; f=[e[0]+FT*Math.cos(fa),e[1]+FT*Math.sin(fa)]; }
  return {root:root,j:j,e:e,f:f};
}
function skeleton(p){
  var ts=p.ts==null?1:p.ts, hw=p.hw||0, sw=p.sw||0;
  var hip=p.hip, a1=p.t[0]*D, a2=p.t[1]*D;
  var mid=[hip[0]+T1*ts*Math.cos(a1),hip[1]+T1*ts*Math.sin(a1)];
  var sh=[mid[0]+T2*ts*Math.cos(a2),mid[1]+T2*ts*Math.sin(a2)];
  var na=p.n*D, neck=[sh[0]+NECK*Math.cos(na),sh[1]+NECK*Math.sin(na)];
  var head=[neck[0]+HR*Math.cos(na),neck[1]+HR*Math.sin(na)];
  var legs=p.legs.map(function(s,i){ var sx=i===0?hw:-hw; return limb([hip[0]+sx,hip[1]],s,TH,SH,true); });
  var arms=p.arms.map(function(s,i){ var sx=i===0?sw:-sw; return limb([sh[0]+sx,sh[1]],s,UA,FA,false); });
  return {hip:hip,mid:mid,sh:sh,head:head,neck:neck,legs:legs,arms:arms,p:p};
}

/* ---------- рисование ---------- */
function Painter(ctx,cw,ch,v){
  var s=cw/v[0], W=.065;
  this.X=function(x){ return cw/2+(x-v[2])*s; };
  this.Y=function(y){ return ch-(y+.15)*s; };
  this.s=s;
  this.line=function(pts,col,w,dash){
    ctx.beginPath(); pts.forEach(function(q,i){ i?ctx.lineTo(this.X(q[0]),this.Y(q[1])):ctx.moveTo(this.X(q[0]),this.Y(q[1])); },this);
    ctx.strokeStyle=col; ctx.lineWidth=(w||W)*s; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.setLineDash(dash?dash.map(function(d){return d*s;}):[]); ctx.stroke(); ctx.setLineDash([]);
  };
  this.circ=function(c,r,col){ ctx.beginPath(); ctx.arc(this.X(c[0]),this.Y(c[1]),r*s,0,7); ctx.fillStyle=col; ctx.fill(); };
  this.text=function(t,x,y,col,size,align){ ctx.fillStyle=col; ctx.font='600 '+(size||13)+'px system-ui,sans-serif'; ctx.textAlign=align||'left'; ctx.fillText(t,x,y); };
  this.ctx=ctx; this.cw=cw; this.ch=ch;
}
var C={skin:'#f2c6a0',skinF:'#c49a7c',top:'#b98cff',leg:'#4f43a0',legF:'#3a3175',shoe:'#f2f2f5',shoeF:'#9a9aa6',hair:'#ff7fbf',hairD:'#d9559a',eye:'#2a2030'};
function drawArm(g,l,far){
  g.line([l.root,l.j],far?COL.far:C.top,.13);
  g.line([l.j,l.e],far?C.skinF:C.skin,.095);
  g.circ(l.e,.062,far?C.skinF:C.skin);
}
function drawLeg(g,l,far){
  g.line([l.root,l.j],far?C.legF:C.leg,.2);
  g.line([l.j,l.e],far?C.legF:C.leg,.155);
  if(l.f) g.line([l.e,l.f],far?C.shoeF:C.shoe,.1);
}
function drawHead(g,k){
  var p=k.p, h=k.head, na=p.n*D;
  if(p.back){
    g.circ(h,.19,C.hair);
    g.line([[h[0],h[1]-.1],[h[0]+.02,h[1]-.4]],C.hair,.1);
    return;
  }
  if(p.front){
    g.line([[h[0]+.15,h[1]],[h[0]+.27,h[1]-.28]],C.hair,.1);
    g.circ(h,.195,C.hair);
    g.circ([h[0],h[1]-.025],.155,C.skin);
    g.circ([h[0]-.055,h[1]-.01],.017,C.eye); g.circ([h[0]+.055,h[1]-.01],.017,C.eye);
    g.line([[h[0]-.035,h[1]-.07],[h[0],h[1]-.085],[h[0]+.035,h[1]-.07]],'#c26a6a',.012);
    return;
  }
  var bk=na+Math.PI/2, fc=na-Math.PI/2, bx=Math.cos(bk), by=Math.sin(bk);
  var tp=[h[0]+.15*bx,h[1]+.15*by], m1=[tp[0]+.2*bx,Math.max(.05,tp[1]+.2*by-.1)], m2=[m1[0]+.04*bx,Math.max(.05,m1[1]-.2)];
  g.line([tp,m1,m2],C.hairD,.09);
  g.circ([h[0]+.05*bx,h[1]+.05*by],.185,C.hair);
  g.circ([h[0]+.025*Math.cos(fc),h[1]+.025*Math.sin(fc)],.15,C.skin);
  g.circ([h[0]+.085*Math.cos(fc)+.03*Math.cos(na),h[1]+.085*Math.sin(fc)+.03*Math.sin(na)],.016,C.eye);
}
function drawSk(g,k,ex){
  var p=k.p, side=!p.front&&!p.back, tw=side?.3:.36;
  k.legs[1]&&drawLeg(g,k.legs[1],side); k.arms[1]&&drawArm(g,k.arms[1],side);
  if(!side) g.line([[k.legs[0].root[0],k.hip[1]],[k.legs[1].root[0],k.hip[1]]],C.leg,.26);
  g.line([k.hip,k.mid],C.top,tw); g.line([k.mid,k.sh],C.top,tw-.02);
  g.circ(k.hip,.14,C.leg);
  if(!side) g.line([[k.arms[0].root[0],k.sh[1]],[k.arms[1].root[0],k.sh[1]]],C.top,.14);
  g.line([k.sh,k.neck],C.skin,.09);
  if(p.belly!=null){
    var cx=(k.hip[0]+k.mid[0])/2-.02, cy=k.hip[1];
    var c=g.ctx; c.beginPath(); c.ellipse(g.X(cx),g.Y(cy+.1),.3*g.s,p.belly*g.s,0,Math.PI,0);
    c.strokeStyle=C.top; c.lineWidth=.06*g.s; c.stroke();
  }
  drawHead(g,k);
  drawLeg(g,k.legs[0],false); drawArm(g,k.arms[0],false);
}
function chair(g,x0,x1,y,backAt){
  g.line([[x0,y],[x1,y]],COL.prop,.06); g.line([[x0,y],[x0,0]],COL.prop,.05); g.line([[x1,y],[x1,0]],COL.prop,.05);
  if(backAt!=null) g.line([[backAt,y],[backAt,y+1]],COL.prop,.05);
}

/* ---------- заготовки поз ---------- */
var ARM_DOWN={ik:[.92,-.05],b:1,rel:true};
function lying(o){
  return Object.assign({hip:[0,.1],t:[180,180],n:180,
    arms:[ARM_DOWN,ARM_DOWN],
    legs:[{ik:[.85,.05],b:1},{ik:[.85,.05],b:1}]},o);
}
function quad(o){
  var leg={fk:[-90,180],f:180}, arm={ik:[.4,.04],b:-1};
  return Object.assign({hip:[-.5,.86],t:[0,0],n:0,arms:[arm,arm],legs:[leg,leg]},o);
}
function stand(o){
  return Object.assign({hip:[0,1.66],t:[90,90],n:90,
    arms:[{ik:[0,-.9],b:-1,rel:true},{ik:[0,-.9],b:-1,rel:true}],
    legs:[{ik:[.05,.08],b:1},{ik:[.05,.08],b:1}]},o);
}
function bridge(th){
  var r=th*D, hip=[-.9+.9*Math.cos(r),.1+.9*Math.sin(r)];
  return lying({hip:hip,t:[180+th,180+th],arms:[{ik:[0,.05],b:1},{ik:[0,.05],b:1}],
    legs:[{ik:[.85,.05],b:1},{ik:[.85,.05],b:1}]});
}
function bandOnThigh(g,k){
  k.legs.forEach(function(l){
    var dx=l.root[0]-l.j[0], dy=l.root[1]-l.j[1], d=Math.hypot(dx,dy);
    var q=[l.j[0]+dx/d*.2, l.j[1]+dy/d*.2], nx=-dy/d*.1, ny=dx/d*.1;
    g.line([[q[0]-nx,q[1]-ny],[q[0]+nx,q[1]+ny]],COL.band,.05);
  });
}
function bandBetweenKnees(g,k){ g.line([k.legs[0].j,k.legs[1].j],COL.band,.04); }
function lab(a){ return function(ph){ return ph<.5?a[0]:a[1]; }; }

/* ---------- упражнения ---------- */
var EX={};
/* 1. Кошка-корова */
(function(){
  var cow=quad({t:[-18,18],n:30}), cat=quad({t:[35,-35],n:-70});
  EX[1]={prof:[1.8,.2,1.8,.2],pose:function(p){return mix(cow,cat,p);},
    label:function(ph){return ph<.5?'выдох — округлить спину':'вдох — прогнуться';},
    cap:'Двигается вся спина плавно, без рывков.'};
})();
/* 2. Диафрагмальное дыхание */
(function(){
  var bent={ik:[.85,.05],b:1};
  var a=lying({legs:[bent,bent],belly:.02,arms:[{fk:[-6,28]},{fk:[-6,28]}]});
  var b=lying({legs:[bent,bent],belly:.15,arms:[{fk:[-6,40]},{fk:[-6,40]}]});
  EX[2]={prof:[3.5,.5,5,.5],pose:function(p){return mix(a,b,p);},
    label:function(ph){return ph<.4?'вдох носом — живот поднимается':'выдох ртом — живот опускается';},
    cap:'Грудь почти не двигается, дышит живот. Шея и плечи расслаблены.'};
})();
/* 3. Скользящие пятки */
(function(){
  var a=lying(), b=lying({legs:[{ik:[1.5,.05],b:1},{ik:[.85,.05],b:1}]});
  EX[3]={prof:[2,.3,2,.3],pose:function(p){return mix(a,b,p);},
    label:lab(['выдох — выпрямить ногу','вдох — вернуть']),
    cap:'Пятка скользит по полу. Поясница не отрывается от пола.'};
})();
/* 4. Разгибание ног из «стола» */
(function(){
  var far={fk:[90,0],f:90};
  var a=lying({legs:[{ik:[.78,.9],b:1,f:90},far]});
  var b=lying({legs:[{ik:[1.45,.45],b:1,f:60},far]});
  EX[4]={prof:[2.2,.3,2.2,.3],pose:function(p){return mix(a,b,p);},
    label:lab(['выдох — опустить ногу вперёд','вдох — вернуть']),
    cap:'Нога опускается ровно настолько, чтобы поясница оставалась прижатой.'};
})();
/* 5, 6. Мостик */
function bridgeEx(withBand){
  var a=bridge(0), b=bridge(28);
  return {prof:[1.6,2.4,1.6,.6],pose:function(p){return mix(a,b,p);},
    props:withBand?function(g,k){ bandOnThigh(g,k); }:null,
    label:function(ph,p){ return p>.9?'пауза 2–3 сек, сжать ягодицы':(ph<.4?'выдох — поднять таз':'вдох — опустить'); },
    cap:withBand?'Колени чуть разводятся против резинки, но не заваливаются.':'Поднимай таз до одной линии плечи–таз–колени, без прогиба в пояснице.'};
}
EX[5]=bridgeEx(false); EX[6]=bridgeEx(true);
/* 7. Велосипед */
EX[7]={loop:true,period:3.2,pose:function(ph){
  var f=ph*2*Math.PI;
  function pt(o){ return {ik:[.95+.38*Math.cos(f+o),.8+.3*Math.sin(f+o)],b:1,f:60}; }
  return lying({legs:[pt(0),pt(Math.PI)]});
 },label:function(){return 'дыши ровно, поясница прижата';},cap:'Плавно, без рывков. Голову и шею не поднимать.'};
/* 8. Птица-собака */
(function(){
  var near={ik:[.4,.04],b:-1}, kneel={fk:[-90,180],f:180};
  var a=quad({legs:[kneel,{k:[-.5,.06],to:[-1.28,.06],f:180}],arms:[near,near]});
  var b=quad({legs:[kneel,{k:[-1.3,.88],to:[-2.05,.9],f:250}],arms:[{ik:[1.38,.93],b:1},near]});
  EX[8]={prof:[2,1.2,2,.4],pose:function(p){return mix(a,b,p);},
    label:function(ph,p){return p>.9?'пауза 1–2 сек':(ph<.4?'выдох — тянем руку и ногу':'вдох — вернуть');},
    cap:'Рука и нога в одну линию со спиной. Таз не заваливается.'};
})();
/* 9. Отведение ноги в «собаке» с резинкой (вид сзади) */
(function(){
  function p(k){
    return {back:true,front:true,hip:[0,.86],t:[90,90],ts:.35,n:90,hw:.2,sw:.32,
      arms:[{ik:[.32,.04],b:1},{ik:[-.32,.04],b:-1}],
      legs:[{k:k[0],to:k[1],f:-90,rel:false},{k:[-.2,.06],to:[-.2,.02],f:-90}]};
  }
  var a=p([[.2,.06],[.2,.02]]), b=p([[.9,.6],[.9,.32]]);
  EX[9]={prof:[1.8,.6,1.8,.4],pose:function(q){return mix(a,b,q);},
    props:function(g,k){ bandBetweenKnees(g,k); },
    label:lab(['выдох — колено в сторону (вид сзади)','вдох — вернуть']),
    cap:'Таз не поворачивается, поясница не прогибается. Движение идёт из бедра.'};
})();
/* 10. Моллюск */
(function(){
  function p(k,ank){
    return {hip:[0,.3],t:[180,180],n:180,
      arms:[{k:[-.95,.1],to:[-1.15,.28]},{k:[-.55,.1],to:[-.25,.12]}],
      legs:[{k:k,to:ank,f:20},{k:[.78,.12],to:[.1,.06],f:20}]};
  }
  var a=p([.76,.2],[.1,.16]), b=p([.62,.72],[.1,.18]);
  EX[10]={prof:[1.5,.6,1.5,.4],pose:function(q){return mix(a,b,q);},
    props:function(g,k){ bandBetweenKnees(g,k); },
    label:lab(['выдох — поднять верхнее колено','вдох — опустить']),
    cap:'Стопы остаются вместе. Таз не откатывается назад.'};
})();
/* 11. Разведение коленей сидя */
(function(){
  function p(kx){
    return {front:true,hip:[0,.95],t:[90,90],n:90,hw:.2,sw:.25,
      arms:[{ik:[.34,1.02],b:1},{ik:[-.34,1.02],b:-1}],
      legs:[{k:[kx,.9],to:[.3,.08],f:0},{k:[-kx,.9],to:[-.3,.08],f:180}]};
  }
  var a=p(.28), b=p(.68);
  EX[11]={prof:[1.5,1,1.5,.4],pose:function(q){return mix(a,b,q);},
    props:function(g,k){
      chair(g,-.55,.55,.85,null); g.line([[-.55,.85],[-.55,1.85]],COL.prop,.05);
      bandBetweenKnees(g,k);
    },
    label:function(ph,p){return p>.9?'пауза 1–2 сек':(ph<.4?'выдох — развести колени':'вдох — свести');},
    cap:'Спина прямая, стопы стоят на месте.'};
})();
/* 12. Стульчик у стены */
(function(){
  function p(hy){
    var hx=-.55;
    return stand({hip:[hx,hy],t:[90,90],n:90,
      arms:[{ik:[.45,.14],b:-1,rel:true},{ik:[.45,.14],b:-1,rel:true}].map(function(a){a.ik=[.35,-.9+ (1.3-hy)*0.0];return a;}),
      legs:[{ik:[.35,.08],b:1},{ik:[.35,.08],b:1}]});
  }
  var a=p(1.3), b=p(.9);
  b.arms=[{ik:[.45,.0],b:-1,rel:true},{ik:[.45,.0],b:-1,rel:true}];
  a.arms=[{ik:[.3,-.75],b:-1,rel:true},{ik:[.3,-.75],b:-1,rel:true}];
  EX[12]={prof:[2,2.5,2,.5],pose:function(q){return mix(a,b,q);},
    props:function(g){ g.line([[-.85,0],[-.85,3.2]],COL.prop,.08); },
    label:function(ph,p){return p>.9?'держим, дышим ровно':(ph<.4?'выдох — скользим вниз по стене':'вдох — поднимаемся');},
    cap:'Спина и затылок касаются стены. Колени не заходят за носки. Дыхание не задерживать.'};
})();
/* 13. Приседание со стулом */
(function(){
  var a=stand({hip:[0,1.66],legs:[{ik:[.05,.08],b:1},{ik:[.05,.08],b:1}],arms:[{ik:[.9,0],b:1,rel:true},{ik:[.9,0],b:1,rel:true}]});
  var b=stand({hip:[-.5,1.0],t:[55,55],n:60,legs:[{ik:[.1,.08],b:1},{ik:[.1,.08],b:1}],
    arms:[{ik:[.9,0],b:1,rel:true},{ik:[.9,0],b:1,rel:true}]});
  EX[13]={prof:[2,.5,2,.5],pose:function(q){return mix(a,b,q);},
    props:function(g){ chair(g,-1.35,-.6,.82,-1.35); },
    label:lab(['вдох — таз назад и вниз','выдох — встаём']),
    cap:'Таз уходит назад к стулу, спина прямая. Только слегка коснуться сиденья.'};
})();
/* 14. Гиперэкстензия */
(function(){
  function p(t1,t2){
    return {hip:[0,1.2],t:[t1,t2],n:t2*.9,
      arms:[{ik:[-.05,-.22],b:-1,rel:true},{ik:[-.05,-.22],b:-1,rel:true}],
      legs:[{ik:[-1.29,.29],b:1,f:200},{ik:[-1.29,.29],b:1,f:200}]};
  }
  var a=p(-45,-85), b=p(33,35);
  EX[14]={prof:[1.8,.8,2.2,.5],pose:function(q){return mix(a,b,q);},
    props:function(g){
      g.line([[-1.55,.12],[.1,1.3]],COL.prop,.07);   // скамья
      g.line([[.1,1.3],[.35,1.5]],COL.prop,.12);     // валик под тазом
      g.line([[-1.3,.5],[-1.2,.35]],COL.band,.06);   // упор для стоп
    },
    label:lab(['выдох — поднимаемся до одной линии','вдох — опускаемся']),
    cap:'Валик под тазом, не под поясницей. Выше одной линии с ногами не поднимаемся.'};
})();
/* 15. Monster walk */
EX[15]={loop:true,period:5,pose:function(ph){
  var sw=function(u){ return .5-.5*Math.cos(Math.PI*Math.min(1,Math.max(0,u))); };
  var u1=ph*3, R=.5, L=-.5, rl=0, ll=0;
  if(ph<1/3){ var u=sw(u1); R=.5+.4*u; rl=.16*Math.sin(Math.PI*u1); L=-.5; }
  else if(ph<2/3){ var v=sw(u1-1); R=.9-.4*v; L=-.5-.4*v; }
  else { var w=sw(u1-2); L=-.9+.4*w; ll=.16*Math.sin(Math.PI*(u1-2)); R=.5; }
  return {front:true,hip:[0,1.4],t:[90,90],n:90,hw:.16,sw:.3,
    arms:[{ik:[.12,-.9],b:1,rel:true},{ik:[-.12,-.9],b:-1,rel:true}],
    legs:[{ik:[R,.05+rl],b:1,f:0},{ik:[L,.05+ll],b:-1,f:180}],
    drift:(ph<1/3?0:ph<2/3?sw(u1-1):1)};
 },
 props:function(g,k){
   bandBetweenKnees(g,k);
 },
 label:function(){return 'небольшие шаги в сторону, резинка натянута';},
 cap:'Колени чуть согнуты и смотрят наружу, резинка не провисает.'};
/* 16. Растяжка груди в дверном проёме */
(function(){
  function p(hx){
    var ang=lerp(90,80,(hx+.1)/.3), sy=1.66+.9*Math.sin(ang*D);
    return {hip:[hx,1.66],t:[ang,ang],n:ang,
      arms:[{k:[.7,sy-.02],to:[.7,sy+.45]},{ik:[0,-.9],b:-1,rel:true}],
      legs:[{ik:[.4,.08],b:1},{ik:[-.5,.08],b:1}]};
  }
  var a=p(-.1), b=p(.2);
  EX[16]={prof:[2.2,2.5,2,.4],pose:function(q){return mix(a,b,q);},
    props:function(g){ g.line([[.7,0],[.7,3.2]],COL.prop,.08); },
    label:function(ph,p){return p>.9?'держим 20–30 сек':'шаг вперёд мягко';},
    cap:'Предплечье на раме, локоть на уровне плеча. Растяжку держим без боли.'};
})();
/* 17. Растяжка трицепса */
(function(){
  function p(q){
    return {front:true,hip:[0,1.66],t:[90,90],n:90,hw:.12,sw:.28,
      arms:[{k:[.4-.12*q,3.05-.08*q],to:[.08,2.8]},{ik:[.34-.1*q,3.0-.08*q],b:-1}],
      legs:[{ik:[.2,.08],b:1,f:0},{ik:[-.2,.08],b:-1,f:180}]};
  }
  var a=p(0), b=p(1);
  EX[17]={prof:[2.5,2.5,2,.4],pose:function(q){return mix(a,b,q);},
    label:function(ph,p){return p>.9?'держим 20–30 сек':'мягко тянем локоть';},
    cap:'Тянем локоть другой рукой вниз-назад. Поясницу не прогибать.'};
})();
/* 18. Замок за спиной */
(function(){
  function p(q){
    var gap=lerp(.45,.1,q), y=2.25;
    return {back:true,front:true,hip:[0,1.66],t:[90,90],n:90,hw:.12,sw:.28,
      arms:[{k:[.3,2.98],to:[.04,y+gap/2]},{k:[-.38,1.95],to:[-.02,y-gap/2]}],
      legs:[{ik:[.2,.08],b:1,f:0},{ik:[-.2,.08],b:-1,f:180}],gap:gap,y:y};
  }
  var a=p(0), b=p(1);
  EX[18]={prof:[3,2,2,.4],pose:function(q){return mix(a,b,q);},
    props:function(g,k){ g.line([k.arms[0].e,k.arms[1].e],COL.band,.03,[.05,.05]); },
    label:function(ph,p){return p>.9?'держим, дышим ровно':'вид сзади — сближаем руки';},
    cap:'Если пальцы не встречаются, держи полотенце и постепенно сокращай расстояние. Без боли.'};
})();
/* 19. Figure-4 */
(function(){
  function p(q){
    var ta=lerp(52,66,q)*D, K=[.8*Math.cos(ta),.1+.8*Math.sin(ta)];
    var A=[K[0]+.78*Math.cos(-10*D),K[1]+.78*Math.sin(-10*D)];
    var sa=lerp(180,162,q), hold=[K[0]*.7,.1+(K[1]-.1)*.7];
    var arm={ik:hold,b:-1};
    return lying({t:[sa,sa],n:sa,arms:[arm,arm],
      legs:[{k:[.0,.82],to:[K[0]+.02,K[1]+.04],f:0},{k:K,to:A,f:80}]});
  }
  var a=p(0), b=p(1);
  EX[19]={prof:[2.5,2.5,2,.4],pose:function(q){return mix(a,b,q);},
    label:function(ph,p){return p>.9?'держим 20–30 сек':'подтягиваем бедро к груди';},
    cap:'Скрещённая нога расслаблена. Голова и плечи на полу.'};
})();
/* 20. Ноги на стуле */
(function(){
  var legs=[{fk:[90,0],f:90},{fk:[90,0],f:90}];
  var a=lying({legs:legs,belly:.02}), b=lying({legs:legs,belly:.1});
  EX[20]={prof:[3.5,.5,4.5,.5],pose:function(q){return mix(a,b,q);},
    props:function(g){
      g.line([[.1,.84],[1.45,.84]],COL.prop,.07); g.line([[1.45,.84],[1.45,0]],COL.prop,.06); g.line([[.2,.84],[.2,0]],COL.prop,.06);
      g.line([[1.45,.84],[1.45,1.8]],COL.prop,.06);
    },
    label:lab(['вдох — расслабляемся','выдох — отпускаем напряжение']),
    cap:'Колени и таз под углом 90°. Лежим 2–5 минут, дышим спокойно.'};
})();

var VIEWS={1:[3.6,1.3,-.3],2:[3.6,1.2,.15],3:[3.6,1.2,.15],4:[3.6,1.5,.15],5:[3.6,1.2,.15],6:[3.6,1.2,.15],7:[3.6,1.6,.15],8:[4.4,1.4,-.35],9:[2.8,1.9,.3],10:[3.4,1.1,.1],11:[3,2.5,0],12:[3.4,3,-.3],13:[4.2,3.2,-.3],14:[4,2.6,-.2],15:[3.6,3,0],16:[3.6,3.3,.1],17:[2.6,3.3,0],18:[2.6,3.3,0],19:[3.6,1.5,.15],20:[4,2,.4]};
for(var vi in VIEWS){ EX[vi].view=VIEWS[vi]; EX[vi].id=+vi; }
[6,9,10,11,15,18].forEach(function(i){EX[i].propsFront=true;});


/* ---------- подсветка мышц ---------- */
var MUS={
 1:{work:'мышцы спины и кора',m:[['back'],['core']]},
 2:{work:'диафрагма и глубокие мышцы живота',m:[['core']]},
 3:{work:'глубокие мышцы живота, бёдра',m:[['core'],['thigh',[0]]]},
 4:{work:'глубокие мышцы живота, сгибатели бедра',m:[['core'],['thigh',[0,1]]]},
 5:{work:'ягодицы, задняя поверхность бёдер',m:[['glute'],['thigh',[0,1]]]},
 6:{work:'ягодицы (в том числе боковые), бёдра',m:[['glute'],['thigh',[0,1]]]},
 7:{work:'мышцы живота, бёдра',m:[['core'],['thigh',[0,1]]]},
 8:{work:'спина, ягодицы, кор',m:[['back'],['glute'],['core']]},
 9:{work:'ягодица и внешняя сторона бедра',m:[['glute',[0]],['thigh',[0]]]},
 10:{work:'боковые ягодичные мышцы',m:[['glute',[0]]]},
 11:{work:'внешняя сторона бёдер и ягодицы',m:[['glute'],['thigh',[0,1]]]},
 12:{work:'квадрицепсы (передняя часть бёдер), ягодицы',m:[['thigh',[0,1]],['glute']]},
 13:{work:'квадрицепсы и ягодицы',m:[['thigh',[0,1]],['glute']]},
 14:{work:'разгибатели спины, ягодицы, задняя часть бёдер',m:[['back'],['glute'],['thigh',[0,1]]]},
 15:{work:'ягодицы, внешняя сторона бёдер',m:[['glute'],['thigh',[0,1]]]},
 16:{stretch:'грудь и переднее плечо',m:[['chest','s'],['shoulder','s',[0]]]},
 17:{stretch:'трицепс и плечо',m:[['arm','s',[0]],['shoulder','s',[0]]]},
 18:{stretch:'плечи, трицепс, грудь',m:[['arm','s',[0,1]],['shoulder','s',[0,1]]]},
 19:{stretch:'ягодицы и грушевидная мышца',m:[['glute','s',[0]]]},
 20:{stretch:'поясница и сгибатели бедра: расслабляются',m:[['back','s'],['core','s']]}
};
function drawMuscles(g,k,ex,p){
  var M=MUS[ex.id]; if(!M) return;
  var side=!k.p.front&&!k.p.back;
  M.m.forEach(function(m){
    var kind=m[0], st=(m[1]==='s'), legs=(m[1]==='s'?m[2]:m[1]);
    var col=st?'rgba(64,224,208,':'rgba(255,77,109,', a=st?.5:.35+.4*p;
    if(ex.loop) a=.65; if(st) a=.35+.3*Math.sin(Date.now()/500);
    var c=col+a+')';
    function L(idx,fn){ (idx||[0,1]).forEach(function(i){ var x=fn(i); if(x) x(); }); }
    if(kind==='core') g.line([k.hip,k.mid],c,.34);
    else if(kind==='back'){ g.line([k.hip,k.mid,k.sh],c,.34); }
    else if(kind==='chest') g.circ([(k.mid[0]+k.sh[0])/2,(k.mid[1]+k.sh[1])/2+.08],.2,c);
    else if(kind==='glute'){
      if(side) g.circ(k.hip,.2,c);
      else (legs||[0,1]).forEach(function(i){ g.circ(k.legs[i].root,.17,c); });
    }
    else if(kind==='thigh'){ (legs||[0]).forEach(function(i){ var l=k.legs[i]; g.line([l.root,l.j],c,.24); }); }
    else if(kind==='arm'){ (legs||[0]).forEach(function(i){ var l=k.arms[i]; g.line([l.root,l.j],c,.17); }); }
    else if(kind==='shoulder'){ (legs||[0]).forEach(function(i){ g.circ(k.arms[i].root,.14,c); }); }
  });
}

/* ---------- плеер ---------- */
function easeC(x){ return .5-.5*Math.cos(Math.PI*x); }
function phaseP(ex,t){
  if(ex.loop){ var ph=(t/ex.period)%1; return {ph:ph,p:ph}; }
  var pr=ex.prof, tot=pr[0]+pr[1]+pr[2]+pr[3], u=t%tot, p;
  if(u<pr[0]) p=easeC(u/pr[0]);
  else if(u<pr[0]+pr[1]) p=1;
  else if(u<pr[0]+pr[1]+pr[2]) p=1-easeC((u-pr[0]-pr[1])/pr[2]);
  else p=0;
  return {ph:u/tot,p:p};
}
function render(canvas,ex,t){
  var dpr=Math.min(2,window.devicePixelRatio||1), w=canvas.clientWidth||320, v=ex.view||[4,2,0], h=Math.round(w*(v[1]+.35)/v[0]);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){ canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); }
  var c=canvas.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,h);
  var g=new Painter(c,w,h,v), pp=phaseP(ex,t);
  var pose=ex.pose(ex.loop?pp.ph:pp.p);
  // пол (при ходьбе — риски едут)
  var off=ex.loop&&pose.drift!=null?pose.drift*.4:0;
  g.line([[-6,0],[6,0]],COL.floor,.03);
  if(ex.loop&&pose.drift!=null){
    var cyc=((t/ex.period)|0)*.4+off;
    for(var x=-4;x<4;x+=.4){ var xx=x-((cyc%.4)); g.line([[xx,0],[xx,-.12]],COL.floor,.025); }
  }
  var k=skeleton(pose);
  if(ex.props&&!ex.propsFront) ex.props(g,k);
  drawSk(g,k,ex);
  if(ex.props&&ex.propsFront) ex.props(g,k);
  drawMuscles(g,k,ex,pp.p);
  var text=ex.label?ex.label(pp.ph,pp.p):'';
  if(text) g.text(text,10,18,COL.ink,Math.max(12,Math.min(15,Math.round(w/26))),'left');
  return pp;
}

var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function mount(box,id){
  var ex=EX[id]; if(!ex||box.dataset.ready) return;
  box.dataset.ready='1';
  var cv=document.createElement('canvas'); cv.className='demo-canvas'; var vw=(ex.view||[4,2,0]); cv.style.aspectRatio=vw[0]+' / '+(vw[1]+.35); cv.setAttribute('role','img');
  cv.setAttribute('aria-label','Схематичная анимация упражнения');
  var cap=document.createElement('div'); cap.className='demo-cap'; cap.textContent=ex.cap||'';
  var hint=document.createElement('div'); hint.className='demo-hint'; hint.textContent='Нажми на картинку — пауза';
  var M=MUS[id], leg=document.createElement('div'); leg.className='demo-mus';
  leg.innerHTML=M.work?'<span class="dot work"></span>Работают: '+M.work:'<span class="dot str"></span>Растягиваются: '+M.stretch;
  box.appendChild(cv); box.appendChild(leg); box.appendChild(cap); box.appendChild(hint);
  var t0=performance.now(), raf=0, paused=false, tPaused=0, running=false;
  function frame(now){
    if(!running) return;
    if(!paused) render(cv,ex,(now-t0)/1000);
    raf=requestAnimationFrame(frame);
  }
  box._start=function(){
    if(reduce){ var tot=ex.loop?ex.period*.3:ex.prof[0]; render(cv,ex,tot); return; }
    if(running) return; running=true; t0=performance.now()-tPaused*1000; raf=requestAnimationFrame(frame);
  };
  box._stop=function(){ running=false; cancelAnimationFrame(raf); };
  cv.addEventListener('click',function(){
    if(reduce) return;
    paused=!paused; if(paused){ tPaused=(performance.now()-t0)/1000; } else { t0=performance.now()-tPaused*1000; }
    hint.textContent=paused?'На паузе — нажми, чтобы продолжить':'Нажми на картинку — пауза';
  });
}
function init(){
  document.querySelectorAll('details.demo').forEach(function(d){
    var box=d.querySelector('.demo-box'), id=+d.dataset.ex;
    d.addEventListener('toggle',function(){
      if(d.open){ mount(box,id); if(box._start) box._start(); }
      else if(box._stop) box._stop();
    });
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
window.BackAnim={EX:EX,render:render,skeleton:skeleton};
})();
