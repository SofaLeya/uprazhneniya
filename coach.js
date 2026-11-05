// Тренер Мира: хвалит за тренировки и серии, поддерживает после пропуска и болезни.
// Использование: COACH.html({sick, trainedToday, planToday, streak, best, allN, weekN, broken, back, newBadge, name})
(function(){
  var NAME = 'Мира';

  function hash(s){ var h = 0; for(var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function pick(arr, seed){ return arr[hash(seed) % arr.length]; }

  // Аватар: чиби-девочка с двумя бирюзовыми хвостиками и кошачьими ушками.
  // mood: happy | cheer | soft | calm | sick
  function face(mood){
    var skin = '#ffe2cf', ink = '#1f3b4d', pink = '#ff8fa8', sick = mood === 'sick';
    function eye(x){
      return '<ellipse cx="'+x+'" cy="64" rx="6.2" ry="8" fill="'+ink+'"/>' +
        '<ellipse cx="'+x+'" cy="67" rx="4.4" ry="4.6" fill="#30d5c8"/>' +
        '<circle cx="'+(x+2)+'" cy="60.5" r="2.5" fill="#fff"/><circle cx="'+(x-2)+'" cy="68" r="1.3" fill="#fff"/>';
    }
    function arc(d, w){ return '<path d="'+d+'" stroke="'+ink+'" stroke-width="'+(w||3)+'" fill="none" stroke-linecap="round"/>'; }
    function star(x, y, r){ return '<path d="M'+x+' '+(y-r)+'L'+(x+r*.3)+' '+(y-r*.3)+'L'+(x+r)+' '+y+'L'+(x+r*.3)+' '+(y+r*.3)+'L'+x+' '+(y+r)+'L'+(x-r*.3)+' '+(y+r*.3)+'L'+(x-r)+' '+y+'L'+(x-r*.3)+' '+(y-r*.3)+'Z" fill="#ffd166"/>'; }
    function arm(d, hx, hy){ return '<path d="'+d+'" stroke="'+skin+'" stroke-width="6.5" fill="none" stroke-linecap="round"/><circle cx="'+hx+'" cy="'+hy+'" r="4.3" fill="'+skin+'"/>'; }

    var s = '<svg viewBox="0 0 120 150" width="92" height="115" aria-hidden="true">' +
      '<defs><linearGradient id="cgh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eeadd"/><stop offset="1" stop-color="#1fb5aa"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="144" rx="22" ry="3.5" fill="#000" opacity=".28"/><g class="av">';
    // хвост
    s += '<g class="tail"><path d="M70 114C98 116 104 92 94 80" stroke="#1fb5aa" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="94" cy="80" r="3.8" fill="#8ff0e6"/></g>';
    // два хвостика
    s += '<g class="tw-l"><path d="M36 40C8 40 2 86 18 112C22 96 30 76 42 60Z" fill="url(#cgh)"/><circle cx="36" cy="42" r="4.8" fill="#ff7aa8"/></g>';
    s += '<g class="tw-r"><path d="M84 40C112 40 118 86 102 112C98 96 90 76 78 60Z" fill="url(#cgh)"/><circle cx="84" cy="42" r="4.8" fill="#ff7aa8"/></g>';
    // кошачьи ушки
    s += '<g class="ear-l"><path d="M32 38L28 6L58 22Z" fill="#1fb5aa"/><path d="M36 32L33 15L48 24Z" fill="#ff9fb5"/></g>';
    s += '<g class="ear-r"><path d="M88 38L92 6L62 22Z" fill="#1fb5aa"/><path d="M84 32L87 15L72 24Z" fill="#ff9fb5"/></g>';
    // тело
    if(!sick){
      s += '<rect x="51" y="118" width="7" height="17" rx="3.2" fill="'+skin+'"/><rect x="62" y="118" width="7" height="17" rx="3.2" fill="'+skin+'"/>' +
        '<ellipse cx="54.5" cy="138" rx="7.5" ry="4.2" fill="#fff"/><ellipse cx="65.5" cy="138" rx="7.5" ry="4.2" fill="#fff"/>' +
        '<path d="M47 140h15M58 140h15" stroke="#30d5c8" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M49 106h22l3 13H62l-2-5-2 5H46z" fill="#243b55"/>' +
        '<rect x="49" y="88" width="22" height="21" rx="7" fill="#f4f7f8"/><rect x="49" y="98" width="22" height="3.6" fill="#30d5c8"/>';
    } else {
      s += '<path d="M30 98Q60 84 90 98L94 138Q60 149 26 138Z" fill="#f2a9bd"/>' +
        '<path d="M28 112L93 112M27 124L94 124M44 100L42 144M60 96L60 146M76 100L78 144" stroke="#e8869f" stroke-width="2.2"/>' +
        '<path d="M30 98Q60 84 90 98L88 107Q60 95 32 107Z" fill="#fde2ea"/>';
    }
    // голова
    s += '<ellipse cx="60" cy="58" rx="35" ry="32" fill="'+skin+'"/>' +
      '<path d="M25 58C21 26 42 17 60 17C78 17 99 26 95 58C93 48 90 41 84 37L78 47L70 33L62 48L54 33L46 47L38 37C30 42 27 49 25 58Z" fill="url(#cgh)"/>' +
      '<path d="M44 25C52 21 64 21 74 25" stroke="#c4fbf5" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>';
    // лицо
    var cheeks = '<ellipse cx="35" cy="74" rx="6" ry="3.6" fill="'+pink+'" opacity="'+(sick?'.8':'.55')+'"/><ellipse cx="85" cy="74" rx="6" ry="3.6" fill="'+pink+'" opacity="'+(sick?'.8':'.55')+'"/>';
    var omega = '<path d="M54 76Q57 80 60 76Q63 80 66 76" stroke="#c2415a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    if(mood === 'cheer'){
      s += arc('M38 67Q45 57 52 67', 3.2) + arc('M68 67Q75 57 82 67', 3.2) + cheeks +
        '<path d="M52 73Q60 91 68 73Z" fill="#d6455f"/><path d="M56 82Q60 87 64 82Q60 79 56 82Z" fill="#ff8fa8"/>';
    } else if(mood === 'soft'){
      s += eye(45) + eye(75) + arc('M38 55L52 50', 2.2) + arc('M68 50L82 55', 2.2) + cheeks +
        '<path d="M55 77Q60 80 65 77" stroke="#c2415a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    } else if(mood === 'sick'){
      s += arc('M38 64Q45 69 52 64', 2.8) + arc('M68 64Q75 69 82 64', 2.8) + cheeks +
        '<path d="M55 78Q57.5 76 60 78Q62.5 80 65 78" stroke="#c2415a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M96 42c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z" fill="#8fd3ff"/>';
    } else {
      s += eye(45) + eye(75) + cheeks + omega;
    }
    // руки
    if(mood === 'cheer'){
      s += arm('M50 94Q16 100 12 52', 12, 50) + arm('M70 94Q104 100 108 52', 108, 50) + star(6, 20, 7) + star(114, 16, 6) + star(100, 30, 4);
    } else if(mood === 'soft'){
      s += arm('M50 94Q42 102 43 112', 43, 113) + arm('M70 94Q92 92 96 70', 96, 68) + star(108, 46, 4.5);
    } else if(mood === 'sick'){
      s += '<circle cx="45" cy="95" r="4.3" fill="'+skin+'"/><circle cx="75" cy="95" r="4.3" fill="'+skin+'"/>';
    } else if(mood === 'happy'){
      s += arm('M50 94Q42 102 43 112', 43, 113) + '<g class="wave">' + arm('M70 94Q88 90 94 74', 94, 72) + '</g>';
    } else {
      s += arm('M50 94Q42 102 43 112', 43, 113) + arm('M70 94Q78 102 77 112', 77, 113);
    }
    return s + '</g></svg>';
  }

  // Выбор настроения и фразы
  function say(c){
    var seed = c.day + ':' + (c.state || '');
    var s = c.streak || 0, m, t;

    if(c.sick){
      return {mood:'sick', t: pick([
        'Отдыхай и ни о чём не переживай. Серия никуда не денется, я её сохраню. Главное сейчас - выздороветь 💛',
        'Болеешь - значит, твоя работа сегодня только одна: лечиться. Я подожду, сколько нужно.',
        'Пауза - это тоже часть пути. Пей тёплое, спи побольше. Вернёшься, и мы начнём мягко.'
      ], seed)};
    }
    if(c.newBadge){
      return {mood:'cheer', t: 'Новая награда: ' + c.newBadge + '! Ты такая молодец, я горжусь тобой!'};
    }
    if(c.trainedToday){
      if(s >= 36) return {mood:'cheer', t:'Серия ' + s + '! Это уже не мотивация, это характер. Ты невероятная!'};
      if(s >= 12) return {mood:'cheer', t:'Серия ' + s + ' тренировок подряд! Целый месяц без пропусков - ты просто огонь 🔥'};
      if(s >= 6)  return {mood:'cheer', t:'Серия ' + s + '! Две недели подряд, спина тебя благодарит. Так держать!'};
      if(s >= 3)  return {mood:'cheer', t:'Серия ' + s + '! Уже настоящая привычка. Я так рада за тебя!'};
      if(s === 2) return {mood:'cheer', t:'Две тренировки подряд! Отличное начало серии, продолжаем 💪'};
      if(c.restart) return {mood:'cheer', t:'Новая серия началась! Ты вернулась после перерыва, и это самое важное. Я так рада!'};
      if(c.back) return {mood:'cheer', t:'Ты вернулась и позанималась! Это самое трудное, и ты справилась. Горжусь!'};
      return {mood:'cheer', t: pick([
        'Тренировка засчитана! Ты сделала это, умница 🎉',
        'Готово! Сегодня ты сделала для себя хорошее дело. Спасибо, что пришла.',
        'Супер! Теперь можно отдохнуть с чистой совестью.'
      ], seed)};
    }
    if(c.back){
      return {mood:'happy', t:'С возвращением! Я так ждала. Сегодня без героизма: половина подходов, и всё отлично.'};
    }
    if(c.broken){
      var nx = c.planToday === 'train' ? 'Давай начнём прямо сегодня.' : (c.nextT ? 'Ближайшая тренировка ' + c.nextT + ', с неё и начнём.' : 'Начнём в ближайший тренировочный день.');
      if(c.gap >= 8){
        return {mood:'soft', t: pick([
          'Давно не виделись, я скучала! Ничего страшного, к занятиям можно вернуться в любой момент. Начни с малого: хватит и лёгкой тренировки. ' + nx,
          'Перерыв был долгим, и это нормально, у всех бывают такие периоды. Ты здесь, и это уже хорошо. Не нужно навёрстывать: просто сделай одну тренировку. ' + nx
        ], seed)};
      }
      var lostTxt = c.lost >= 2 ? 'Серия в ' + c.lost + ' тренировок прервалась, но ты уже знаешь, как её собрать, и соберёшь снова. ' : '';
      return {mood:'soft', t: lostTxt + pick([
        'Пропуск - это не провал, он бывает у всех. Не ругай себя. ' + nx,
        'Один пропущенный день ничего не отменяет. Всё, что ты сделала раньше, остаётся с тобой. ' + nx,
        'Не страшно, что не получилось. Главное, что ты можешь начать снова, а я рядом. ' + nx
      ], seed)};
    }
    if(c.planToday === 'train'){
      if(c.hour >= 19) return {mood:'happy', t:'Вечер, но ещё не поздно! Даже короткая тренировка засчитается, если сделать нужное число упражнений. Я верю в тебя!'};
      if(s > 0) return {mood:'happy', t: pick([
        'Сегодня тренировка, и у тебя серия ' + s + '. Давай продолжим, у тебя получится!',
        'Серия ' + s + ' ждёт продолжения. Начни с первого упражнения, а дальше пойдёт само.'
      ], seed)};
      return {mood:'happy', t: pick([
        'Сегодня тренировка. Начни с первого упражнения, а дальше пойдёт само. Я в тебя верю!',
        'Можно начать прямо сейчас. Даже маленький шаг сегодня лучше, чем идеальный план на потом.'
      ], seed)};
    }
    if(c.planToday === 'bike'){
      return {mood:'happy', t:'Сегодня велотренажёр, а потом короткая растяжка. Это легко, ты справишься!'};
    }
    if(c.allN === 0){
      return {mood:'happy', t:'Привет, я ' + NAME + '! Буду рядом и радоваться каждой твоей тренировке. Начнём в понедельник, среду или пятницу?'};
    }
    return {mood:'calm', t: s > 0 ? 'Сегодня отдых. Серия ' + s + ' в безопасности, набирайся сил!' : 'Сегодня отдых. Набирайся сил, а в тренировочный день я тебя поддержу.'};
  }

  window.COACH = {
    name: NAME,
    hop: function(el){ var c = el.closest('.coach'); if(!c) return; c.classList.remove('jump'); void c.offsetWidth; c.classList.add('jump'); },
    html: function(c){
      c.day = c.day || '';
      var r = say(c);
      return '<div class="coach'+(c.jump?' jump':'')+'"><div class="coach-ava" onclick="COACH.hop(this)">' + face(r.mood) + '</div>' +
        '<div class="coach-msg"><div class="coach-name">' + NAME + ', твой тренер</div>' + r.t + '</div></div>';
    }
  };
})();
