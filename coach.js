// Тренер Мира: хвалит за тренировки и серии, поддерживает после пропуска и болезни.
// Использование: COACH.html({sick, trainedToday, planToday, streak, best, allN, weekN, broken, back, newBadge, name})
(function(){
  var NAME = 'Мира';

  function hash(s){ var h = 0; for(var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function pick(arr, seed){ return arr[hash(seed) % arr.length]; }

  // Аватар: чиби-девочка с двумя бирюзовыми хвостиками и кошачьими ушками.
  // mood: happy | cheer | soft | calm | sick
  function face(mood){
    var skin = '#ffe2cf', skinSh = '#f3c9b2', ink = '#1b3347', pink = '#ff8fa8', hairD = '#1a9c93', sick = mood === 'sick';
    function eye(x, side){
      return '<ellipse cx="'+x+'" cy="64" rx="6.4" ry="8.2" fill="'+ink+'"/>' +
        '<ellipse cx="'+x+'" cy="66.2" rx="4.9" ry="5.8" fill="url(#cei)"/>' +
        '<ellipse cx="'+x+'" cy="66.4" rx="2.2" ry="3.1" fill="#0e2233"/>' +
        '<circle cx="'+(x+2.1)+'" cy="60.8" r="2.6" fill="#fff"/><circle cx="'+(x-2.3)+'" cy="68.8" r="1.3" fill="#fff"/><circle cx="'+(x+2.6)+'" cy="68" r=".8" fill="#fff" opacity=".8"/>' +
        '<path d="M'+(x-7.2)+' 61.4Q'+x+' 54.8 '+(x+7.2)+' 61.4" stroke="'+ink+'" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M'+(x+side*7.2)+' 61.4L'+(x+side*9.6)+' 59.2" stroke="'+ink+'" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M'+(x-4.6)+' 72Q'+x+' 74.2 '+(x+4.6)+' 72" stroke="#c98f85" stroke-width="1" fill="none" opacity=".7"/>';
    }
    function arc(x, side){ // закрытый глаз ^^ с ресничкой
      return '<path d="M'+(x-7)+' 67Q'+x+' 57 '+(x+7)+' 67" stroke="'+ink+'" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M'+(x+side*7)+' 67L'+(x+side*9.2)+' 65" stroke="'+ink+'" stroke-width="2" stroke-linecap="round"/>';
    }
    function brow(d, w){ return '<path d="'+d+'" stroke="'+hairD+'" stroke-width="'+(w||2.1)+'" fill="none" stroke-linecap="round"/>'; }
    function star(x, y, r){ return '<path d="M'+x+' '+(y-r)+'L'+(x+r*.3)+' '+(y-r*.3)+'L'+(x+r)+' '+y+'L'+(x+r*.3)+' '+(y+r*.3)+'L'+x+' '+(y+r)+'L'+(x-r*.3)+' '+(y+r*.3)+'L'+(x-r)+' '+y+'L'+(x-r*.3)+' '+(y-r*.3)+'Z" fill="#ffd166"/>'; }
    function arm(d, hx, hy){ return '<path d="'+d+'" stroke="'+skin+'" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="'+hx+'" cy="'+hy+'" r="5.2" fill="'+skin+'"/>'; }
    function bow(x, y, m){ // бантик на резинке; m = +1 справа, -1 слева
      return '<path d="M'+x+' '+y+'L'+(x-9)+' '+(y-5)+'L'+(x-8)+' '+(y+6)+'Z" fill="#ff7aa8"/><path d="M'+x+' '+y+'L'+(x+9)+' '+(y-5)+'L'+(x+8)+' '+(y+6)+'Z" fill="#ff7aa8"/>' +
        '<circle cx="'+x+'" cy="'+y+'" r="3" fill="#ff5b8f"/><circle cx="'+(x-.8)+'" cy="'+(y-.8)+'" r=".9" fill="#ffd0de"/>';
    }

    var s = '<svg viewBox="0 0 120 150" width="104" height="130" aria-hidden="true">' +
      '<defs><linearGradient id="cgh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eeadd"/><stop offset="1" stop-color="#1fb5aa"/></linearGradient>' +
      '<linearGradient id="cei" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ff7ee"/><stop offset="1" stop-color="#1f9fb8"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="144" rx="22" ry="3.5" fill="#000" opacity=".28"/><g class="av">';
    // хвост с полосками
    s += '<g class="tail"><path d="M70 114C98 116 104 92 94 80" stroke="#1fb5aa" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<path d="M70 114C98 116 104 92 94 80" stroke="'+hairD+'" stroke-width="7" fill="none" stroke-dasharray="3 8" opacity=".75"/>' +
      '<circle cx="94" cy="80" r="4" fill="#d9fffb"/></g>';
    // два хвостика с бантиками и бликами
    s += '<g class="tw-l"><path d="M36 40C8 40 2 86 18 112C22 96 30 76 42 60Z" fill="url(#cgh)"/>' +
      '<path d="M21 58C16 74 17 92 19 104" stroke="#b6fff7" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M28 52C25 66 26 80 27 90" stroke="'+hairD+'" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/>' +
      '</g>';
    s += '<g class="tw-r"><path d="M84 40C112 40 118 86 102 112C98 96 90 76 78 60Z" fill="url(#cgh)"/>' +
      '<path d="M99 58C104 74 103 92 101 104" stroke="#b6fff7" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M92 52C95 66 94 80 93 90" stroke="'+hairD+'" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/>' +
      '</g>';
    // кошачьи ушки с пушком
    s += '<g class="ear-l"><path d="M32 38L28 6L58 22Z" fill="#1fb5aa"/><path d="M36 32L33 15L48 24Z" fill="#ff9fb5"/>' +
      '<path d="M39 28L37.5 21M43 26.5L42.5 20.5M46 25.5L46.5 20" stroke="#ffe3ea" stroke-width="1.3" stroke-linecap="round"/></g>';
    s += '<g class="ear-r"><path d="M88 38L92 6L62 22Z" fill="#1fb5aa"/><path d="M84 32L87 15L72 24Z" fill="#ff9fb5"/>' +
      '<path d="M81 28L82.5 21M77 26.5L77.5 20.5M74 25.5L73.5 20" stroke="#ffe3ea" stroke-width="1.3" stroke-linecap="round"/></g>';
    // волосы сзади
    s += '<ellipse cx="60" cy="53" rx="38" ry="35" fill="'+hairD+'"/>';
    // тело
    if(!sick){
      s += '<rect x="51" y="118" width="7" height="18" rx="3.2" fill="'+skin+'"/><rect x="62" y="118" width="7" height="18" rx="3.2" fill="'+skin+'"/>' +
        '<ellipse cx="54.5" cy="123" rx="2.4" ry="1.6" fill="'+skinSh+'" opacity=".7"/><ellipse cx="65.5" cy="123" rx="2.4" ry="1.6" fill="'+skinSh+'" opacity=".7"/>' +
        '<rect x="50.5" y="127" width="8" height="9" rx="2.4" fill="#fff"/><rect x="61.5" y="127" width="8" height="9" rx="2.4" fill="#fff"/>' +
        '<path d="M50.5 129.2h8M50.5 131.6h8M61.5 129.2h8M61.5 131.6h8" stroke="#30d5c8" stroke-width="1.3"/>' +
        '<ellipse cx="54.5" cy="138" rx="7.6" ry="4.3" fill="#fff"/><ellipse cx="65.5" cy="138" rx="7.6" ry="4.3" fill="#fff"/>' +
        '<path d="M49.4 141.2h10.2M60.4 141.2h10.2" stroke="#30d5c8" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M52 136.2h5M52.6 138h4.2M63 136.2h5M63.6 138h4.2" stroke="#9fb8c4" stroke-width=".9" stroke-linecap="round"/>' +
        '<path d="M49 106h22l3 13H62l-2-5-2 5H46z" fill="#243b55"/>' +
        '<path d="M48.4 108.5L45.8 118.4M71.6 108.5L74.2 118.4" stroke="#30d5c8" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M49 105h22v3.2H49z" fill="#30d5c8"/><path d="M58.2 108.2q1.8 2.4 3.6 0" stroke="#e7f6f6" stroke-width="1" fill="none"/>' +
        '<rect x="49" y="88" width="22" height="20" rx="7" fill="#f4f7f8"/><rect x="49" y="98" width="22" height="3.6" fill="#30d5c8"/>' +
        '<path d="M60 90V98M60 101.6V105" stroke="#c9d6da" stroke-width="1.1"/><circle cx="60" cy="89.6" r="1.3" fill="#9fb8c4"/>' +
        '<ellipse cx="60" cy="91" rx="12" ry="3.2" fill="#000" opacity=".1"/>';
    } else {
      s += '<path d="M30 98Q60 84 90 98L94 138Q60 149 26 138Z" fill="#f2a9bd"/>' +
        '<path d="M28 112L93 112M27 124L94 124M44 100L42 144M60 96L60 146M76 100L78 144" stroke="#e8869f" stroke-width="2.2"/>' +
        '<path d="M30 98Q60 84 90 98L88 107Q60 95 32 107Z" fill="#fde2ea"/>' +
        '<path d="M34 104Q60 92 86 104" stroke="#fff" stroke-width="1.3" fill="none" stroke-dasharray="2 3"/>' +
        '<path d="M70 124l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5z" fill="#ffd0de"/>';
    }
    // голова
    s += '<ellipse cx="60" cy="58" rx="35" ry="32" fill="'+skin+'"/>' +
      '<path d="M38 80Q60 95 82 80Q78 90 60 90Q42 90 38 80Z" fill="'+skinSh+'" opacity=".55"/>';
    // чёлка, прядки у лица, антенна-завиток
    s += '<path d="M25 58C21 26 42 17 60 17C78 17 99 26 95 58C93 48 90 41 84 37L78 47L70 33L62 48L54 33L46 47L38 37C30 42 27 49 25 58Z" fill="url(#cgh)"/>' +
      '<path d="M26 56C24 66 26 78 31 87C32 76 33 66 34.5 54Z" fill="url(#cgh)"/><path d="M94 56C96 66 94 78 89 87C88 76 87 66 85.5 54Z" fill="url(#cgh)"/>' +
      '<path d="M30 60C29 68 30 76 32 82" stroke="'+hairD+'" stroke-width="1.1" fill="none" opacity=".5"/><path d="M90 60C91 68 90 76 88 82" stroke="'+hairD+'" stroke-width="1.1" fill="none" opacity=".5"/>' +
      '<path d="M46 47L50 34M62 48L65 36M78 47L76 38" stroke="'+hairD+'" stroke-width="1" fill="none" opacity=".45"/>' +
      '<path d="M44 25C52 21 64 21 74 25" stroke="#c4fbf5" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M60 18C57 9 64 3 69 8" stroke="#1fb5aa" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    // бантики поверх волос (качаются вместе с хвостиками)
    s += '<g class="tw-l">' + bow(33, 43, -1) + '</g><g class="tw-r">' + bow(87, 43, 1) + '</g>';
    // лицо
    var cheeks = '<ellipse cx="38" cy="75" rx="6" ry="3.6" fill="'+pink+'" opacity="'+(sick?'.8':'.55')+'"/><ellipse cx="82" cy="75" rx="6" ry="3.6" fill="'+pink+'" opacity="'+(sick?'.8':'.55')+'"/>' +
      '<path d="M34 74l2 2.6M37 73.4l2 2.6M80 76l2-2.6M83 76.6l2-2.6" stroke="#ff6f8e" stroke-width=".9" stroke-linecap="round" opacity=".6"/>';
    var nose = '<path d="M58.6 71Q60 72.8 61.4 71" stroke="#d98a76" stroke-width="1.7" fill="none" stroke-linecap="round"/><ellipse cx="59.4" cy="70.3" rx=".9" ry=".5" fill="#fff" opacity=".7"/>';
    var omega = '<path d="M54 76.6Q57 80.4 60 76.6Q63 80.4 66 76.6" stroke="#c2415a" stroke-width="2.3" fill="none" stroke-linecap="round"/>';
    if(mood === 'cheer'){
      s += brow('M37.5 50Q45 44 52 48.5') + brow('M68 48.5Q75 44 82.5 50') + arc(45, -1) + arc(75, 1) + cheeks + nose +
        '<path d="M52 74.6Q60 92 68 74.6Z" fill="#d6455f"/><path d="M52 74.6L68 74.6" stroke="#b83350" stroke-width=".8"/><path d="M56 83.6Q60 88.4 64 83.6Q60 80 56 83.6Z" fill="#ff8fa8"/>' +
        '<path d="M53.4 74.7L56 74.7L54.8 78Z" fill="#fff"/><path d="M64 74.7L66.6 74.7L65.2 78Z" fill="#fff"/>';
    } else if(mood === 'soft'){
      s += brow('M37.5 55L52 50.5') + brow('M68 50.5L82.5 55') + eye(45, -1) + eye(75, 1) + cheeks + nose +
        '<path d="M55 78Q60 81 65 78" stroke="#c2415a" stroke-width="2.3" fill="none" stroke-linecap="round"/>';
    } else if(mood === 'sick'){
      s += brow('M37.5 53Q45 54 52 52.5') + brow('M68 52.5Q75 54 82.5 53') +
        '<path d="M38 64Q45 70 52 64" stroke="'+ink+'" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M38 64L35.8 62.4M82 64L84.2 62.4" stroke="'+ink+'" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M68 64Q75 70 82 64" stroke="'+ink+'" stroke-width="3" fill="none" stroke-linecap="round"/>' + cheeks + nose +
        '<path d="M55 79Q57.5 77 60 79Q62.5 81 65 79" stroke="#c2415a" stroke-width="2.1" fill="none" stroke-linecap="round"/>' +
        '<path d="M96 42c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z" fill="#8fd3ff"/><circle cx="94.4" cy="53" r="1.6" fill="#fff" opacity=".8"/>';
    } else {
      s += brow('M37.5 52Q45 47.5 52 50.5') + brow('M68 50.5Q75 47.5 82.5 52') + eye(45, -1) + eye(75, 1) + cheeks + nose + omega;
    }
    // чокер с бубенчиком
    if(!sick){
      s += '<path d="M51 91.4Q60 96.4 69 91.4" stroke="#30d5c8" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="60" cy="96.6" r="3.3" fill="#ffd166"/><path d="M57.2 96.2h5.6" stroke="#d9a441" stroke-width=".9"/><circle cx="60" cy="98" r=".8" fill="#b9831f"/><circle cx="59" cy="95.6" r=".9" fill="#fff3c4"/>';
    }
    // руки
    if(mood === 'cheer'){
      s += arm('M51 97Q28 100 20 68', 19, 65) + arm('M69 97Q92 100 100 68', 101, 65) + star(8, 28, 7) + star(112, 24, 6) + star(100, 36, 4);
    } else if(mood === 'soft'){
      s += arm('M51 97Q46 103 46 109', 46, 110) + arm('M69 97Q88 96 96 72', 96, 69) + star(108, 46, 4.5);
    } else if(mood === 'sick'){
      s += '<circle cx="45" cy="95" r="4.3" fill="'+skin+'"/><circle cx="75" cy="95" r="4.3" fill="'+skin+'"/>';
    } else if(mood === 'happy'){
      s += arm('M51 97Q46 103 46 109', 46, 110) + '<g class="wave">' + arm('M69 97Q86 96 94 78', 94, 75) + '</g>';
    } else {
      s += arm('M51 97Q46 103 46 109', 46, 110) + arm('M69 97Q74 103 74 109', 74, 110);
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
