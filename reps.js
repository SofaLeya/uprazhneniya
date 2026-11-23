/* Формат результата для подходов с повторениями или длительностью. */
const WorkoutReps = (() => {
  const maxSets = 99;
  const maxReps = 999;
  const seconds = /^(?:с|сек(?:унд[аы]?)?|s|sec(?:s|onds?)?|["″])\.?$/iu;
  const minutes = /^(?:м|мин(?:ут[аы]?)?|m|min(?:s|utes?)?)\.?$/iu;

  function factor(unit) {
    return unit === 'min' ? 60 : 1;
  }

  function maximum(unit) {
    return maxReps * factor(unit);
  }

  function total(sets) {
    return sets.reduce((sum, reps) => sum + reps, 0);
  }

  function read(value, unit = 'reps') {
    let text = String(value ?? '').trim();
    let inputUnit = unit;
    const timed = unit !== 'reps';
    if (timed) {
      const suffix = text.match(/[a-zа-я"″]+\.?$/iu);
      if (suffix) {
        if (seconds.test(suffix[0])) inputUnit = 'sec';
        else if (minutes.test(suffix[0])) inputUnit = 'min';
        else return null;
        text = text.slice(0, suffix.index).trimEnd();
        if (inputUnit === 'sec') {
          const clock = text.match(/(\d+)\s*([a-zа-я]+\.?)\s*(\d{1,2})$/iu);
          if (clock && minutes.test(clock[2]) && Number(clock[3]) < 60) {
            text = text.slice(0, clock.index) + `${clock[1]}:${clock[3].padStart(2, '0')}`;
          }
        }
      }
    }
    const amount = timed ? '\\d+(?::[0-5]\\d|[.,]\\d+)?' : '\\d+';
    const parse = raw => {
      if (raw.includes(':')) {
        const [min, sec] = raw.split(':').map(Number);
        return min * 60 + sec;
      }
      const value = Number(raw.replace(',', '.')) * factor(inputUnit);
      const rounded = Math.round(value);
      return Math.abs(value - rounded) < 1e-7 ? rounded : NaN;
    };
    const mixed = text.match(new RegExp(`^(${amount})\\s*\\((${amount}(?:\\s*\\/\\s*${amount})+)\\)$`));
    if (mixed) {
      const sets = mixed[2].split('/').map(raw => parse(raw.trim()));
      if (sets.length <= maxSets && sets.every(n => n <= maximum(unit)) && total(sets) === parse(mixed[1])) {
        return {sets, reps: sets[0]};
      }
    }
    const uniform = text.match(new RegExp(`^(\\d+)\\s*[x×хХX*]\\s*(${amount})$`));
    const count = uniform ? Number(uniform[1]) : 1;
    const reps = parse(uniform ? uniform[2] : text);
    if ((uniform || new RegExp(`^${amount}$`).test(text)) && count <= maxSets && reps <= maximum(unit)) {
      return {sets: Array(count).fill(reps), reps};
    }
    return null;
  }

  function uniform(sets) {
    return sets.every(reps => reps === sets[0]);
  }

  function write({sets, reps}, unit = 'reps') {
    const amount = value => Number((value / factor(unit)).toFixed(9));
    const suffix = unit === 'sec' ? ' сек' : unit === 'min' ? ' мин' : '';
    if (uniform(sets)) return `${sets.length}×${amount(sets[0] ?? reps)}${suffix}`;
    // Старые графики читают первое число как итог в единицах карточки.
    return `${amount(total(sets))} (${sets.map(amount).join(' / ')})${suffix}`;
  }

  return {maxSets, maxReps, factor, maximum, read, write, total, uniform};
})();

if (typeof module === 'object' && module.exports) module.exports = WorkoutReps;
