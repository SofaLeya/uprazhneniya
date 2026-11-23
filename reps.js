/* Формат результата для упражнений с повторениями. */
const WorkoutReps = (() => {
  const maxSets = 99;
  const maxReps = 999;

  function total(sets) {
    return sets.reduce((sum, reps) => sum + reps, 0);
  }

  function read(value) {
    const text = String(value ?? '').trim();
    const mixed = text.match(/^(\d+)\s*\((\d+(?:\s*\/\s*\d+)+)\)$/);
    if (mixed) {
      const sets = mixed[2].split('/').map(Number);
      if (sets.length <= maxSets && sets.every(n => n <= maxReps) && total(sets) === Number(mixed[1])) {
        return {sets, reps: sets[0]};
      }
    }
    const uniform = text.match(/^(\d+)\s*[x×хХX*]\s*(\d+)$/);
    const count = uniform ? Number(uniform[1]) : 1;
    const reps = uniform ? Number(uniform[2]) : Number(text);
    if ((uniform || /^\d+$/.test(text)) && count <= maxSets && reps <= maxReps) {
      return {sets: Array(count).fill(reps), reps};
    }
    return null;
  }

  function uniform(sets) {
    return sets.every(reps => reps === sets[0]);
  }

  function write({sets, reps}) {
    if (uniform(sets)) return `${sets.length}×${sets[0] ?? reps}`;
    // Старый график читает первое число как общее количество повторений.
    return `${total(sets)} (${sets.join(' / ')})`;
  }

  return {maxSets, maxReps, read, write, total, uniform};
})();

if (typeof module === 'object' && module.exports) module.exports = WorkoutReps;
