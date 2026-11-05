// Тренер Мира: хвалит за тренировки и серии, поддерживает после пропуска и болезни.
// Использование: COACH.html({sick, trainedToday, planToday, streak, best, allN, weekN, broken, back, newBadge, name})
(function(){
  var NAME = 'Мира';

  function hash(s){ var h = 0; for(var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function pick(arr, seed){ return arr[hash(seed) % arr.length]; }

  // Аватар: девушка с хвостиком и бирюзовой повязкой. mood: happy | cheer | soft | calm
  function face(mood){
    var eyes, mouth, extra = '';
    if(mood === 'cheer'){
      eyes = '<path d="M38 50q5-7 10 0M62 50q5-7 10 0" stroke="#2b1b17" stroke-width="3" fill="none" stroke-linecap="round"/>';
      mouth = '<path d="M45 62q10 12 20 0z" fill="#c2415a"/>';
      extra = '<g fill="#ffd166"><path d="M14 22l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z"/><path d="M96 16l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z"/></g>';
    } else if(mood === 'soft'){
      eyes = '<path d="M38 52q5 5 10 0M62 52q5 5 10 0" stroke="#2b1b17" stroke-width="3" fill="none" stroke-linecap="round"/>';
      mouth = '<path d="M48 64q7 5 14 0" stroke="#c2415a" stroke-width="3" fill="none" stroke-linecap="round"/>';
      extra = '<path d="M96 24c0-5 8-5 8 0 0-5 8-5 8 0 0 6-8 11-8 11s-8-5-8-11z" fill="#ff7a90" transform="translate(-8 -4) scale(.9)"/>';
    } else if(mood === 'calm'){
      eyes = '<circle cx="43" cy="50" r="3.2" fill="#2b1b17"/><circle cx="67" cy="50" r="3.2" fill="#2b1b17"/>';
      mouth = '<path d="M48 63q7 4 14 0" stroke="#c2415a" stroke-width="3" fill="none" stroke-linecap="round"/>';
    } else {
      eyes = '<path d="M38 52q5-6 10 0M62 52q5-6 10 0" stroke="#2b1b17" stroke-width="3" fill="none" stroke-linecap="round"/>';
      mouth = '<path d="M46 62q9 9 18 0" stroke="#c2415a" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    return '<svg viewBox="0 0 120 110" width="76" height="70" aria-hidden="true">' +
      '<path d="M86 40c22 4 24 30 10 44-4-14-8-22-14-26z" fill="#5a3426"/>' + // хвостик
      '<circle cx="55" cy="52" r="32" fill="#ffd9c2"/>' +
      '<path d="M22 50c-2-26 18-36 36-34 18 0 32 12 30 34-6-14-14-20-30-20S28 36 22 50z" fill="#5a3426"/>' + // волосы
      '<path d="M23 40q32-18 64 0" stroke="#30d5c8" stroke-width="6" fill="none" stroke-linecap="round"/>' + // повязка
      eyes +
      '<circle cx="34" cy="60" r="4" fill="#ff9aa8" opacity=".6"/><circle cx="76" cy="60" r="4" fill="#ff9aa8" opacity=".6"/>' +
      mouth + extra + '</svg>';
  }

  // Выбор настроения и фразы
  function say(c){
    var seed = c.day + ':' + (c.state || '');
    var s = c.streak || 0, m, t;

    if(c.sick){
      return {mood:'soft', t: pick([
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
    html: function(c){
      c.day = c.day || '';
      var r = say(c);
      return '<div class="coach"><div class="coach-ava">' + face(r.mood) + '</div>' +
        '<div class="coach-msg"><div class="coach-name">' + NAME + ', твой тренер</div>' + r.t + '</div></div>';
    }
  };
})();
