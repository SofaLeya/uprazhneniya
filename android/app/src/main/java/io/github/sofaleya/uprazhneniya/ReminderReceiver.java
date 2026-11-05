package io.github.sofaleya.uprazhneniya;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        SharedPreferences p = Reminder.prefs(c);
        char kind = Reminder.todayKind(p);
        if (p.getBoolean("on", false) && !p.getBoolean("paused", false)
                && kind != 'n' && !Reminder.today().equals(p.getString("done", ""))) {
            Reminder.notifyNow(c, kind);
        }
        Reminder.schedule(c); // следующее напоминание в ближайший тренировочный день
    }
}
