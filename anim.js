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
  this.circ=function(c,r,col,st){ ctx.beginPath(); ctx.arc(this.X(c[0]),this.Y(c[1]),r*s,0,7); ctx.fillStyle=col; ctx.fill(); if(st){ ctx.strokeStyle=st; ctx.lineWidth=.028*s; ctx.stroke(); } };
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
function lineHead(g,k,na){
  var h=k.head, c=g.ctx, p=k.p, dx=Math.cos(na), dy=Math.sin(na), s=g.s, HP='#ff7fbf', HD='#d9559a', W=A.tln;
  function P(u,v,fx,fy){ return [h[0]+u*fx+v*dx, h[1]+u*fy+v*dy]; }
  function ell(cx,cy,rx,ry,fill,st,lw){ c.save(); c.translate(g.X(cx),g.Y(cy)); c.rotate(Math.PI/2-na); c.beginPath(); c.ellipse(0,0,rx*s,ry*s,0,0,7); c.fillStyle=fill; c.fill(); if(st){ c.strokeStyle=st; c.lineWidth=lw*s; c.stroke(); } c.restore(); }
  function ln(pts,col,w){ g.line(pts,col||W,w||.012); }
  if(p.back){
    g.circ(P(0,.2,0,0),.075,HP,W);
    ell(h[0]+.01*dx,h[1]+.01*dy,.135,.175,HP,W,.034);
    ln([P(0,.14,0,0),P(0,.0,0,0),P(0,-.12,0,0)],HD,.012);
    return;
  }
  if(p.front){
    var fx=-dy*0, fy=0; /* ось u: вправо по экрану */
    var ux=-dy, uy=dx; /* перпендикуляр к оси головы */
    g.circ([h[0]+.2*dx,h[1]+.2*dy],.075,HP,W);                       /* пучок */
    ell(h[0]+.02*dx,h[1]+.02*dy,.14,.18,HP,W,.034);                   /* волосы */
    ell(h[0]-.01*dx,h[1]-.025*dy,.113,.15,A.base,W,.026);             /* лицо */
    function Q(u,v){ return [h[0]+u*ux+v*dx,h[1]+u*uy+v*dy]; }
    /* волосы: пробор и пряди */
    ln([Q(0,.17),Q(-.03,.1),Q(-.075,.07)],HD,.012); ln([Q(0,.17),Q(.03,.1),Q(.075,.07)],HD,.012);
    ln([Q(-.06,.14),Q(-.1,.06),Q(-.11,-.02)],HD,.01); ln([Q(.06,.14),Q(.1,.06),Q(.11,-.02)],HD,.01);
    /* брови, глаза, нос, губы */
    [-1,1].forEach(function(sg){
      ln([Q(sg*.025,.04),Q(sg*.055,.058),Q(sg*.092,.045)],W,.011);
      ln([Q(sg*.03,.005),Q(sg*.055,.022),Q(sg*.085,.005),Q(sg*.055,-.01),Q(sg*.03,.005)],W,.009);
      g.circ(Q(sg*.057,.006),.009,W);
      ln([Q(sg*.13,-.01),Q(sg*.145,-.03),Q(sg*.125,-.06)],W,.01);  /* ухо */
    });
    ln([Q(-.014,-.04),Q(0,-.062),Q(.014,-.04)],W,.009);
    ln([Q(-.035,-.095),Q(0,-.088),Q(.035,-.095)],W,.011); ln([Q(-.03,-.1),Q(0,-.115),Q(.03,-.1)],W,.009);
    return;
  }
  /* профиль: u — вперёд (лицо), v — вверх по оси головы */
  var bk=na+Math.PI/2, fc=na-Math.PI/2, fxx=Math.cos(fc), fyy=Math.sin(fc);
  function R(u,v){ return [h[0]+u*fxx+v*dx,h[1]+u*fyy+v*dy]; }
  g.circ([h[0]+.14*Math.cos(bk)+.1*dx,h[1]+.14*Math.sin(bk)+.1*dy],.075,HP,W);   /* пучок */
  ell(h[0]+.045*Math.cos(bk)+.025*dx,h[1]+.045*Math.sin(bk)+.025*dy,.15,.18,HP,W,.034); /* волосы */
  ell(h[0]+.03*fxx-.01*dx,h[1]+.03*fyy-.01*dy,.115,.15,A.base,W,.026);       /* лицо */
  ln([R(.065,.075),R(.1,.082)],W,.011);                                      /* бровь */
  ln([R(.065,.04),R(.095,.05),R(.115,.035)],W,.01); g.circ(R(.09,.042),.009,W); /* глаз */
  ln([R(.135,.025),R(.16,-.02),R(.14,-.03)],W,.01);                           /* нос */
  ln([R(.115,-.07),R(.14,-.075)],W,.011);                                     /* губы */
  ln([R(-.02,.01),R(-.04,-.03),R(-.015,-.06)],W,.01);                         /* ухо */
  ln([R(-.08,.1),R(-.02,.12),R(.06,.1)],HD,.01);                              /* прядь */
}
function drawHead(g,k){
  var p=k.p, h=k.head, na=(p.hd!=null?p.hd:p.n)*D;
  if(A.tln){ lineHead(g,k,na); return; }
  if(p.back){
    g.circ(h,.19,C.hair,A.tln);
    g.line([[h[0],h[1]-.1],[h[0]+.02,h[1]-.4]],C.hair,.1);
    return;
  }
  if(p.front){
    g.line([[h[0]+.15,h[1]],[h[0]+.27,h[1]-.28]],C.hair,.1);
    g.circ(h,.195,C.hair,A.tln);
    g.circ([h[0],h[1]-.025],.155,C.skin,A.tln);
    g.circ([h[0]-.055,h[1]-.01],.017,C.eye); g.circ([h[0]+.055,h[1]-.01],.017,C.eye);
    g.line([[h[0]-.035,h[1]-.07],[h[0],h[1]-.085],[h[0]+.035,h[1]-.07]],'#c26a6a',.012);
    return;
  }
  var bk=na+Math.PI/2, fc=na-Math.PI/2, bx=Math.cos(bk), by=Math.sin(bk);
  var tp=[h[0]+.15*bx,h[1]+.15*by], m1=[tp[0]+.2*bx,Math.max(.05,tp[1]+.2*by-.1)], m2=[m1[0]+.04*bx,Math.max(.05,m1[1]-.2)];
  g.line([tp,m1,m2],C.hairD,.09);
  g.circ([h[0]+.05*bx,h[1]+.05*by],.185,C.hair,A.tln);
  g.circ([h[0]+.025*Math.cos(fc),h[1]+.025*Math.sin(fc)],.15,C.skin,A.tln);
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
/* 10. Моллюск (вид сверху и немного сбоку) */
(function(){
  var HY=.62; /* экранная высота таза: впереди (к зрителю) = ниже на экране */
  function p(lift){
    var kn=[.55,HY-.40], kt=[.55+lift*.05,HY-.40+lift*.62], ank=[.86,HY-.02];
    return {hip:[0,HY],t:[180,180],n:180,hd:90,
      arms:[{k:[-.5,HY-.34],to:[-.95,HY-.12]},{k:[-.9,HY-.05],to:[-1.2,HY+.12]}],
      legs:[{k:kt,to:[ank[0],ank[1]+.03],f:-20},{k:kn,to:ank,f:-20}]};
  }
  var a=p(0), b=p(.62);
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
      arms:[{k:[.4-.06*q,3.0-.05*q],to:[.06,2.72]},{k:[-.02,2.3],to:[.36-.06*q,2.95-.05*q]}],
      legs:[{ik:[.2,.08],b:1,f:0},{ik:[-.2,.08],b:-1,f:180}]};
  }
  var a=p(0), b=p(1);
  EX[17]={prof:[2.5,2.5,2,.4],pose:function(q){return mix(a,b,q);},behind:[0],
    label:function(ph,p){return p>.9?'держим 20–30 сек':'мягко тянем локоть';},
    cap:'Правая рука поднята, локоть вверх, кисть за головой. Левой рукой мягко тянем локоть вниз-назад.'};
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


/* 21. Отжимания от стены */
(function(){
  var AX=-.95, WALL=1.25, HY=2.2;
  function p(sx){
    var dx=sx-AX, dy=Math.sqrt(2.48*2.48-dx*dx), ph=Math.atan2(dy,dx), u=[Math.cos(ph),Math.sin(ph)];
    var hip=[AX+1.58*u[0],.08+1.58*u[1]], a=ph/D;
    return {hip:hip,t:[a,a],n:a,arms:[{ik:[WALL,HY],b:-1},{ik:[WALL,HY],b:-1}],
      legs:[{ik:[AX,.08],b:1,f:0},{ik:[AX,.08],b:1,f:0}]};
  }
  var a=p(.28), b=p(.8);
  EX[21]={prof:[1.8,.3,1.8,.3],pose:function(q){return mix(a,b,q);},
    props:function(g){ g.line([[WALL+.05,0],[WALL+.05,3]],COL.prop,.08); },
    label:lab(['вдох — сгибаем руки','выдох — выпрямляем']),
    cap:'Тело прямое, как доска. Таз не выпячиваем, поясница не прогибается.'};
})();
/* 22. Тяга резинки сидя */
(function(){
  var AN=[2.3,1.5];
  function p(rel,b){
    return {hip:[-.5,.95],t:[90,90],n:90,
      arms:[{ik:rel,b:b,rel:true},{ik:rel,b:b,rel:true}],
      legs:[{fk:[0,-90],f:0},{fk:[0,-90],f:0}]};
  }
  var a=p([.88,-.35],-1), b=p([.12,-.42],-1);
  EX[22]={prof:[1.8,.8,1.8,.4],pose:function(q){return mix(a,b,q);},
    props:function(g,k){ chair(g,-1,-.1,.85,-1); g.line([k.arms[0].e,AN],COL.band,.035); g.circ(AN,.06,COL.prop); },
    label:lab(['выдох — тянем к рёбрам','вдох — возвращаем']),
    cap:'Локти идут назад вдоль корпуса. Плечи не поднимаем, корпус не откидываем.'};
  EX[22].propsFront=true;
})();
/* 23. Разведение резинки (вид сбоку и немного спереди) */
(function(){
  var YA=Math.cos(.32), YS=Math.sin(.32), SY=2.46;
  function P(xp,z){ return -xp*YA+z*YS; } /* правая сторона ближе к зрителю */
  function arm(side,hx,hz){
    var sxp=.28*side, S=[P(sxp,0),SY], H=[P(hx*side,hz),SY-.02];
    var ex=sxp+(hx*side-sxp)*.5+.05*side, ez=hz*.5+.02;
    return {k:[P(ex,ez),SY-.06],to:H};
  }
  function p(hx,hz){
    return {front:true,hip:[0,1.66],t:[90,90],n:90,hw:.11,sw:.27,
      arms:[arm(-1,hx,hz),arm(1,hx,hz)],
      legs:[{ik:[.17,.08],b:1,f:0},{ik:[-.17,.08],b:-1,f:180}]};
  }
  var a=p(.13,.9), b=p(1.12,.28);
  EX[23]={prof:[1.8,.6,1.8,.4],pose:function(q){return mix(a,b,q);},
    props:function(g,k){ g.line([k.arms[0].e,k.arms[1].e],COL.band,.045); g.circ(k.arms[0].e,.07,COL.band); g.circ(k.arms[1].e,.07,COL.band); },
    propsFront:true,
    label:lab(['выдох — разводим руки, сводим лопатки','вдох — возвращаем']),
    cap:'Резинка в двух кистях на уровне груди, руки почти прямые. Начни с узкого хвата, плечи опущены.'};
})();
/* 24. Ангел у стены */
(function(){
  function p(e,h){
    return {front:true,hip:[0,1.66],t:[90,90],n:90,hw:.12,sw:.28,
      arms:[{k:[e[0],e[1]],to:[h[0],h[1]]},{k:[-e[0],e[1]],to:[-h[0],h[1]]}],
      legs:[{ik:[.2,.08],b:1,f:0},{ik:[-.2,.08],b:-1,f:180}]};
  }
  var a=p([.7,2.3],[.75,2.8]), b=p([.65,2.95],[.92,3.38]);
  EX[24]={prof:[2.4,.5,2.4,.4],pose:function(q){return mix(a,b,q);},
    props:function(g){ if(A.tln) g.line([[0,0],[0,3.6]],COL.prop,.06); else g.line([[0,0],[0,3.6]],'#1a1a23',2.8); },
    label:lab(['выдох — руки вверх по стене','вдох — вниз']),
    cap:'Затылок, лопатки и поясница у стены. Руки скользят без боли в плечах.'};
})();

var VIEWS={1:[3.6,1.3,-.3],2:[3.6,1.2,.15],3:[3.6,1.2,.15],4:[3.6,1.5,.15],5:[3.6,1.2,.15],6:[3.6,1.2,.15],7:[3.6,1.6,.15],8:[4.4,1.4,-.35],9:[2.8,1.9,.3],10:[3.6,1.6,.1],11:[3,2.5,0],12:[3.4,3,-.3],13:[4.2,3.2,-.3],14:[4,2.6,-.2],15:[3.6,3,0],16:[3.6,3.3,.1],17:[2.6,3.3,0],18:[2.6,3.3,0],19:[3.6,1.5,.15],20:[4,2,.4],21:[3.6,2.7,.1],22:[4.4,2.5,.55],23:[3.4,3.1,0],24:[3,3.3,0]};
for(var vi in VIEWS){ EX[vi].view=VIEWS[vi]; EX[vi].id=+vi; }
[6,9,10,11,15,18].forEach(function(i){EX[i].propsFront=true;});



/* ---------- плоская анатомическая модель ---------- */
var A={base:'#d4d4e2',baseF:'#9d9db2',idle:'#d4d4e2',idleF:'#9d9db2',edge:'#d4d4e2',edgeF:'#9d9db2',work:[255,77,109],str:[64,224,208],ln:'#0c0c10',lnF:'#0c0c10',tln:null,lw:.02,legf:null,legFf:null,top:null};
var C0=null;
function setStyle(s){
  if(!C0) C0=JSON.parse(JSON.stringify({C:C,A:{base:A.base,baseF:A.baseF,idle:A.idle,idleF:A.idleF,edge:A.edge,edgeF:A.edgeF}}));
  if(s==='line'){ A.base=A.baseF=A.idle=A.idleF='#0b0b10'; A.edge='#f1f1f7'; A.edgeF='#8d8d9c'; A.ln='#f1f1f7'; A.lnF='#8d8d9c'; A.tln='#f1f1f7'; A.lw=.034; A.legf='#1b1626'; A.legFf='#14111c'; A.top='#2b1c3d'; C.skin=C.skinF='#0b0b10'; C.eye='#f1f1f7'; COL.band='#f1f1f7'; }
  else { for(var k in C0.A) A[k]=C0.A[k]; A.ln=A.lnF='#0c0c10'; A.tln=null; A.lw=.02; A.legf=A.legFf=A.top=null; C.skin=C0.C.skin; C.skinF=C0.C.skinF; C.eye=C0.C.eye; COL.band='#ffb454'; }
}
function rgba(c,a){ return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'; }
function wf(arr,t){ var n=arr.length-1, x=Math.min(1,Math.max(0,t))*n, i=Math.min(n-1,Math.floor(x)), f=x-i; return arr[i]*(1-f)+arr[i+1]*f; }
function mkPath(pts){ var L=[0],i; for(i=1;i<pts.length;i++) L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1])); return {pts:pts,L:L,T:L[L.length-1]||1e-6}; }
function onPath(P,t){
  var d=t*P.T, n=P.pts.length-1, i=0;
  if(d>=P.T) i=n-1; else if(d>0){ while(i<n-1&&P.L[i+1]<d) i++; }
  var a=P.pts[i], b=P.pts[i+1], sl=(P.L[i+1]-P.L[i])||1e-6, f=(d-P.L[i])/sl;
  return {p:[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],a:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
function mkPart(pts,fw,bw,sg){ return {P:mkPath(pts),fw:fw,bw:bw,sg:sg}; }
function wp(part,t,s){
  var o=onPath(part.P,t), w=(s>=0?wf(part.fw,t):wf(part.bw,t)), off=s*w*part.sg;
  return [o.p[0]-Math.sin(o.a)*off,o.p[1]+Math.cos(o.a)*off];
}
function blob(g,pts,fill,stroke,lw){
  var c=g.ctx, n=pts.length, m0=[(pts[n-1][0]+pts[0][0])/2,(pts[n-1][1]+pts[0][1])/2];
  c.beginPath(); c.moveTo(g.X(m0[0]),g.Y(m0[1]));
  for(var i=0;i<n;i++){ var a=pts[i], b=pts[(i+1)%n]; c.quadraticCurveTo(g.X(a[0]),g.Y(a[1]),g.X((a[0]+b[0])/2),g.Y((a[1]+b[1])/2)); }
  c.closePath(); c.fillStyle=fill; c.fill();
  if(stroke){ c.strokeStyle=stroke; c.lineWidth=(lw||.012)*g.s; c.lineJoin='round'; c.stroke(); }
}
function silh(g,part,fill,ln){
  var pts=[wp(part,-.05,0)], i, N=6;
  for(i=0;i<=N;i++) pts.push(wp(part,i/N,1));
  pts.push(wp(part,1.05,0));
  for(i=N;i>=0;i--) pts.push(wp(part,i/N,-1));
  blob(g,pts,fill,ln,A.lw);
}
function poly(g,part,P,mir,fill,stroke){
  var pts=P.map(function(q){ return wp(part,q[0],q[1]); }); blob(g,pts,fill,stroke);
  if(mir){ var pm=P.map(function(q){ return wp(part,q[0],-q[1]); }); blob(g,pm,fill,stroke); }
}
function mstate(ex,key,idx,far,pp){
  var list=(ex.act||[]), st=null;
  for(var i=0;i<list.length;i++){ var m=list[i]; if(m[0]!==key) continue; if(!m[1]||idx==null||m[1].indexOf(idx)>=0) st=m[2]; }
  if(!st) return {fill:far?A.idleF:A.idle,edge:far?A.edgeF:A.edge,glow:null};
  var a=st==='w'?(ex.loop?.9:.6+.4*pp.p):.7+.25*Math.sin(Date.now()/450);
  return {fill:rgba(st==='w'?A.work:A.str,a),edge:st==='w'?'rgba(255,200,210,.9)':'rgba(200,255,250,.9)',glow:st==='w'?'rgb(255,77,109)':'rgb(64,224,208)'};
}
function mus(g,part,P,mir,m){
  if(!m.glow) return;
  var c=g.ctx; if(m.glow){ c.save(); c.shadowColor=m.glow; c.shadowBlur=14; poly(g,part,P,mir,m.fill,m.edge); c.restore(); }
  else poly(g,part,P,mir,m.fill,m.edge);
}
/* формы мышц в локальных координатах: t вдоль сегмента, s поперёк (+1 спереди / -1 сзади, в видах спереди/сзади — вбок) */
var SHP={
 quad:[[.05,.1],[.1,.85],[.4,1],[.75,.9],[.98,.6],[.98,.1],[.5,.15]],
 ham:[[.05,-.1],[.1,-.85],[.4,-1],[.75,-.9],[.98,-.55],[.98,-.1],[.5,-.15]],
 glute:[[-.35,-.1],[-.28,-.8],[-.05,-1.25],[.2,-1.2],[.38,-.8],[.3,-.2],[.1,.1]],
 calf:[[.04,-.15],[.1,-.9],[.3,-1.25],[.55,-.95],[.8,-.5],[.95,-.12]],
 tib:[[.05,.15],[.1,.85],[.6,.7],[.9,.3],[.9,.1]],
 delt:[[-.25,-.9],[-.25,.9],[.25,1.1],[.5,.5],[.5,-.5],[.25,-1.1]],
 bi:[[.2,.1],[.35,.95],[.65,1.0],[.9,.5],[.9,.1]],
 tri:[[.15,-.1],[.2,-.95],[.55,-1.05],[.9,-.6],[.9,-.1]],
 fa:[[.05,-.7],[.05,.7],[.5,.9],[.95,.35],[.95,-.35],[.5,-.9]],
 abs:[[.04,.95],[.5,1.0],[.5,.25],[.04,.3]],
 erector:[[.02,-.95],[.2,-1],[.7,-.95],[.7,-.35],[.02,-.4]],
 upback:[[.45,-.95],[.8,-1.0],[.98,-.6],[.95,-.15],[.5,-.3]],
 chest:[[.6,.95],[.85,1.0],[.98,.75],[.95,.3],[.62,.3]]
};
var FB={
 abs:[[.04,-.28],[.04,.28],[.52,.3],[.52,-.28]],
 obl:[[.06,.4],[.06,.95],[.5,.92],[.52,.38]],
 pec:[[.62,.05],[.62,.9],[.82,1.0],[.97,.85],[.92,.15]],
 trap:[[.98,.02],[.98,.92],[.6,.55],[.3,.1],[.6,.02]],
 lat:[[.2,.3],[.35,.95],[.8,.95],[.6,.35]],
 erector:[[.02,.1],[.7,.1],[.7,.32],[.02,.32]],
 glute:[[-.45,-.2],[-.35,.9],[0,1.2],[.3,.8],[.3,-.8],[-.1,-1.1]],
 leg:[[.03,-.8],[.2,-1],[.6,-.9],[.95,-.5],[.95,.5],[.6,.9],[.2,1],[.03,.8]],
 calf:[[.05,-.7],[.15,-.9],[.5,-.8],[.9,-.3],[.9,.3],[.5,.8],[.15,.9],[.05,.7]],
 arm:[[.1,-.75],[.4,-.95],[.75,-.8],[.9,-.3],[.9,.3],[.75,.8],[.4,.95],[.1,.75]]
};
function sc(a,k){ return a.map(function(v){return v*k;}); }
function parts(k,fb){
  var o={legs:[],arms:[]}, H=k.hip,M=k.mid,S=k.sh, W=A.tln?1.3:1.2, TW=A.tln?1.15:1.1;
  k.legs.forEach(function(l){
    o.legs.push({th:mkPart([l.root,l.j],sc([.105,.11,.085,.068],W),sc([.105,.12,.085,.065],W),1),sh:mkPart([l.j,l.e],sc([.068,.06,.046,.04],W),sc([.068,.085,.05,.04],W),1),l:l});
  });
  k.arms.forEach(function(l){
    o.arms.push({up:mkPart([l.root,l.j],sc([.058,.058,.048,.042],W),sc([.058,.058,.048,.042],W),1),fo:mkPart([l.j,l.e],sc([.045,.045,.035,.03],W),sc([.045,.045,.035,.03],W),1),l:l});
  });
  o.torso=A.tln?(fb?mkPart([H,M,S],sc([.21,.145,.17,.2],TW),sc([.21,.145,.17,.2],TW),-1):mkPart([H,M,S],sc([.16,.115,.2,.12],TW),sc([.17,.115,.14,.1],TW),-1)):(fb?mkPart([H,M,S],sc([.17,.155,.2,.24],TW),sc([.17,.155,.2,.24],TW),-1):mkPart([H,M,S],sc([.15,.14,.17,.13],TW),sc([.16,.13,.15,.11],TW),-1));
  return o;
}
function inl(g,pts,w){ g.line(pts,A.ln,w||.016); }
function dLeg(g,L,far,fb){
  if(!A.tln||far) return; var th=L.th, sh=L.sh;
  inl(g,[wp(sh,.04,-.9),wp(sh,.04,.9)],.016);
}
function dArm(g,R,far,fb){
  if(!A.tln||far) return; var e=R.l.e;
  g.ctx.beginPath(); g.ctx.arc(g.X(e[0]),g.Y(e[1]),.05*g.s,0,7); g.ctx.fillStyle=A.base; g.ctx.fill(); g.ctx.strokeStyle=A.ln; g.ctx.lineWidth=.03*g.s; g.ctx.stroke();
}
function dress(g,T,fb,back){
  if(!A.tln) return;
  /* легинсы: пояс на бёдрах */
  blob(g,[wp(T,-.06,1.04),wp(T,.14,1.06),wp(T,.14,-1.06),wp(T,-.06,-1.04)],A.legf,A.tln,.03);
  /* спортивный топ */
  var pts;
  if(!fb) pts=[wp(T,.5,1.05),wp(T,.62,1.08),wp(T,.8,1.06),wp(T,.96,.7),wp(T,.98,-.5),wp(T,.9,-1.04),wp(T,.7,-1.05),wp(T,.5,-1.04)];
  else if(!back) pts=[wp(T,.5,1.04),wp(T,.75,1.06),wp(T,.97,.9),wp(T,.9,.45),wp(T,.84,0),wp(T,.9,-.45),wp(T,.97,-.9),wp(T,.75,-1.06),wp(T,.5,-1.04)];
  else pts=[wp(T,.5,1.04),wp(T,.75,1.06),wp(T,.97,.9),wp(T,.97,-.9),wp(T,.75,-1.06),wp(T,.5,-1.04)];
  blob(g,pts,A.top,A.tln,.03);
}
function dTorso(g,T,fb,back){
  if(!A.tln) return;
  if(!fb) g.line([wp(T,.3,.45),wp(T,.3,.5)],A.ln,.02);
  else if(!back) g.line([wp(T,.3,0),wp(T,.3,.0)],A.ln,.02);
  else inl(g,[wp(T,.14,0),wp(T,.5,0)],.012);
}
function legDraw(g,L,idx,far,ex,pp,fb,glt){
  var base=A.tln?(far?A.legFf:A.legf):(far?A.baseF:A.base);
  silh(g,L.th,base,far?A.lnF:A.ln); silh(g,L.sh,base,far?A.lnF:A.ln);
  if(L.l.f){ var f=L.l.f, e=L.l.e; blob(g,[[e[0]-.03,e[1]-.045],[f[0],f[1]-.035],[f[0]+.03,f[1]],[f[0],f[1]+.035],[e[0]-.03,e[1]+.045]].map(function(q){return q;}),A.tln?A.base:base,A.tln,.025); }
  var back=!!ex.back_;
  if(!fb){
    mus(g,L.th,SHP.quad,false,mstate(ex,'quad',idx,far,pp));
    mus(g,L.th,SHP.ham,false,mstate(ex,'ham',idx,far,pp));
    mus(g,L.sh,SHP.tib,false,mstate(ex,'tibx',idx,far,pp));
    mus(g,L.sh,SHP.calf,false,mstate(ex,'calf',idx,far,pp));
    if(glt) mus(g,L.th,SHP.glute,false,mstate(ex,'glute',null,far,pp));
  } else {
    if(back){
      mus(g,L.th,FB.leg,false,mstate(ex,'ham',idx,far,pp));
      mus(g,L.sh,FB.calf,false,mstate(ex,'calf',idx,far,pp));
      mus(g,L.th,FB.glute,false,mstate(ex,'glute',idx,far,pp));
    } else {
      mus(g,L.th,FB.leg,false,mstate(ex,'quad',idx,far,pp));
      mus(g,L.sh,FB.calf,false,mstate(ex,'tibx',idx,far,pp));
    }
  }
  dLeg(g,L,far,fb);
}
function armDraw(g,R,idx,far,ex,pp,fb){
  var base=far?A.baseF:A.base;
  silh(g,R.fo,base,far?A.lnF:A.ln); silh(g,R.up,base,far?A.lnF:A.ln);
  if(!fb){
    mus(g,R.fo,SHP.fa,false,mstate(ex,'fa',idx,far,pp));
    mus(g,R.up,SHP.bi,false,mstate(ex,'bi',idx,far,pp));
    mus(g,R.up,SHP.tri,false,mstate(ex,'tri',idx,far,pp));
  } else {
    mus(g,R.fo,FB.arm,false,mstate(ex,'fa',idx,far,pp));
    mus(g,R.up,FB.arm,false,mstate(ex,ex.back_?'tri':'bi',idx,far,pp));
  }
  dArm(g,R,far,fb);
}
function deltDraw(g,R,idx,far,ex,pp,fb){
  var m=mstate(ex,'delt',idx,far,pp);
  mus(g,R.up,fb?[[-.35,-1.3],[-.35,1.3],[.3,1.5],[.55,.7],[.55,-.7],[.3,-1.5]]:SHP.delt,false,m);
}
function torsoDraw(g,T,k,ex,pp,fb){
  silh(g,T,A.base,A.tln);
  dress(g,T,fb,!!k.p.back);
  var nk=k.neck, S=k.sh;
  if(A.tln) g.line([S,nk],A.tln,.14);
  g.line([S,nk],A.base,.08);
  if(!fb){
    var m=mstate(ex,'abs',null,false,pp); mus(g,T,SHP.abs,false,m);
    
    if(k.p.belly!=null){ g.line([wp(T,.04,1.05+k.p.belly*5),wp(T,.27,1.12+k.p.belly*8),wp(T,.5,1.05+k.p.belly*5)],'#9d9db2',.03); }
    mus(g,T,SHP.erector,false,mstate(ex,'erector',null,false,pp));
    mus(g,T,SHP.upback,false,mstate(ex,'upback',null,false,pp));
    mus(g,T,SHP.chest,false,mstate(ex,'chest',null,false,pp));
  } else if(!k.p.back){
    mus(g,T,FB.obl,true,mstate(ex,'obl',null,false,pp));
    mus(g,T,FB.abs,false,mstate(ex,'abs',null,false,pp));
    
    mus(g,T,FB.pec,true,mstate(ex,'chest',null,false,pp));
  } else {
    mus(g,T,FB.lat,true,mstate(ex,'upback',null,false,pp));
    mus(g,T,FB.trap,true,mstate(ex,'upback',null,false,pp));
    mus(g,T,FB.erector,true,mstate(ex,'erector',null,false,pp));
  }
  dTorso(g,T,fb,!!k.p.back);
}
function drawAnat(g,k,ex,pp){
  var p=k.p, fb=!!(p.front||p.back); ex.back_=!!p.back;
  var P=parts(k,fb);
  if(fb){
    P.legs.forEach(function(L,i){ legDraw(g,L,i,false,ex,pp,true,false); });
    g.line([[k.legs[0].root[0],k.hip[1]],[k.legs[1].root[0],k.hip[1]]],A.base,.2);
    torsoDraw(g,P.torso,k,ex,pp,true);
    g.line([[k.arms[0].root[0],k.sh[1]],[k.arms[1].root[0],k.sh[1]]],A.base,.14);
    var bh=ex.behind||[];
    P.arms.forEach(function(R,i){ if(bh.indexOf(i)>=0){ armDraw(g,R,i,false,ex,pp,true); deltDraw(g,R,i,false,ex,pp,true); } });
    drawHead(g,k);
    P.arms.forEach(function(R,i){ if(bh.indexOf(i)<0){ armDraw(g,R,i,false,ex,pp,true); deltDraw(g,R,i,false,ex,pp,true); } });
    return;
  }
  legDraw(g,P.legs[1],1,true,ex,pp,false,false); armDraw(g,P.arms[1],1,true,ex,pp,false);
  torsoDraw(g,P.torso,k,ex,pp,false);
  drawHead(g,k);
  legDraw(g,P.legs[0],0,false,ex,pp,false,true); armDraw(g,P.arms[0],0,false,ex,pp,false); deltDraw(g,P.arms[0],0,false,ex,pp,false);
}
var MUS={
 1:{work:'разгибатели спины, прямая мышца живота',m:[['erector',null,'w'],['abs',null,'w'],['upback',null,'w']]},
 2:{work:'прямая и поперечная мышцы живота, диафрагма',m:[['abs',null,'w']]},
 4:{work:'прямая мышца живота, четырёхглавая бедра',m:[['abs',null,'w'],['quad',null,'w']]},
 6:{work:'большая и средняя ягодичные, задняя поверхность бедра',m:[['glute',null,'w'],['ham',null,'w'],['erector',null,'w']]},
 8:{work:'разгибатели спины, большая ягодичная, дельты',m:[['erector',null,'w'],['glute',null,'w'],['delt',[0],'w'],['abs',null,'w'],['ham',[1],'w']]},
 10:{work:'средняя ягодичная мышца',m:[['glute',null,'w']]},
 12:{work:'четырёхглавая мышца бедра, ягодичные',m:[['quad',null,'w'],['glute',null,'w']]},
 14:{work:'разгибатели спины, большая ягодичная, двуглавая бедра',m:[['erector',null,'w'],['glute',null,'w'],['ham',null,'w']]},
 21:{work:'большая грудная, трицепс, передняя дельта',m:[['chest',null,'w'],['tri',[0],'w'],['delt',[0],'w']]},
 22:{work:'мышцы между лопаток (ромбовидные, трапеции), бицепс',m:[['upback',null,'w'],['bi',[0],'w'],['delt',[0],'w']]},
 23:{work:'задняя часть плеч и мышцы между лопаток',m:[['upback',null,'w'],['delt',null,'w']]},
 24:{work:'дельты, трапеции и ромбовидные мышцы',m:[['delt',null,'w'],['upback',null,'w'],['tri',null,'w']]},
 16:{stretch:'большая грудная, передняя дельта',m:[['chest',null,'s'],['delt',[0],'s']]},
 17:{stretch:'трицепс, задняя дельта',m:[['tri',[0],'s'],['delt',[0],'s']]},
 18:{stretch:'трицепс, дельты, широчайшая',m:[['tri',null,'s'],['delt',null,'s'],['upback',null,'s']]},
 19:{stretch:'большая ягодичная и грушевидная',m:[['glute',null,'s']]},
 20:{stretch:'разгибатели спины (поясница), сгибатели бедра',m:[['erector',null,'s'],['abs',null,'s']]}
};
for(var mi in MUS){ if(EX[mi]) EX[mi].act=MUS[mi].m; }

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
  drawAnat(g,k,ex,pp);
  if(ex.props&&ex.propsFront) ex.props(g,k);
  var text=ex.label?ex.label(pp.ph,pp.p):'';
  if(text) g.text(text,10,18,COL.ink,Math.max(12,Math.min(15,Math.round(w/26))),'left');
  return pp;
}

var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var GIFS={1:1,2:1,4:1,6:1,8:1,10:1,12:1,14:1,21:1,23:1,24:1,16:1,17:1,18:1,19:1,20:1};
var PHOTO={
  1:['ВДОХ · прогнитесь, взгляд вверх','ВЫДОХ · округлите спину, подбородок к груди'],
  2:['ВДОХ · живот поднимается','ВЫДОХ · живот опускается'],
  4:['ИСХОДНОЕ · колени согнуты «столом»','ВЫДОХ · одну ногу вперёд и вниз, поясница прижата']};
function mountPhoto(box,id){
  var cp=PHOTO[id], im=document.createElement('img'); im.className='demo-gif'; im.alt='Положение в упражнении';
  var lab=document.createElement('div'); lab.className='demo-phase';
  var k=0, tm=0;
  [1,2].forEach(function(n){ var pre=new Image(); pre.src='gif/ph-'+id+'-'+n+'.webp'; });
  function show(){ im.src='gif/ph-'+id+'-'+(k+1)+'.webp'; lab.textContent=cp[k]; }
  im.onerror=function(){ box.innerHTML=''; box.dataset.ready=''; PHOTO[id]=0; mount(box,id); if(box._start) box._start(); };
  var M0=MUS[id], leg0=document.createElement('div'); leg0.className='demo-mus';
  leg0.innerHTML=M0.work?'<span class="dot work"></span>Работают: '+M0.work:'<span class="dot str"></span>Растягиваются: '+M0.stretch;
  box.appendChild(im); box.appendChild(lab); box.appendChild(leg0); show();
  box._start=function(){ if(tm||reduce) return; tm=setInterval(function(){ k=1-k; show(); },1800); };
  box._stop=function(){ clearInterval(tm); tm=0; };
  im.addEventListener('click',function(){ if(tm) box._stop(); else box._start(); });
}
function mount(box,id){
  var ex=EX[id]; if(!ex||box.dataset.ready) return;
  box.dataset.ready='1';
  if(PHOTO[id]){ mountPhoto(box,id); return; }
  if(GIFS[id]){
    var im=document.createElement('img'); im.className='demo-gif'; im.alt='Анимация упражнения'; im.decoding='async';
    im.onerror=function(){ im.remove(); box.dataset.ready=''; GIFS[id]=0; mount(box,id); if(box._start) box._start(); };
    im.src='gif/ex-'+id+'.gif';
    var M0=MUS[id], leg0=document.createElement('div'); leg0.className='demo-mus';
    leg0.innerHTML=M0.work?'<span class="dot work"></span>Работают: '+M0.work:'<span class="dot str"></span>Растягиваются: '+M0.stretch;
    var cap0=document.createElement('div'); cap0.className='demo-cap'; cap0.textContent=ex.cap||'';
    box.appendChild(im); box.appendChild(leg0); box.appendChild(cap0); return;
  }
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
  document.addEventListener('toggle',function(e){
    var d=e.target; if(!d.matches||!d.matches('details.demo')) return;
    var box=d.querySelector('.demo-box'), id=+d.dataset.ex;
    if(d.open){ mount(box,id); if(box._start) box._start(); }
    else if(box._stop) box._stop();
  },true);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
window.BackAnim={EX:EX,render:render,skeleton:skeleton,setStyle:setStyle};
})();
