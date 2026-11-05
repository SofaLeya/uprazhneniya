package io.github.sofaleya.uprazhneniya;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import java.util.Calendar;
import java.util.Locale;

/** Напоминание «сегодня тренировка». Время, дни и состояние хранятся в SharedPreferences, их задаёт сайт. */
final class Reminder {
    static final String PREFS = "reminder";
    static final String CHANNEL = "workout";
    private static final int REQ = 7002;

    private Reminder() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static String today() {
        Calendar c = Calendar.getInstance();
        return String.format(Locale.US, "%04d-%02d-%02d",
            c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /** Что за день сегодня: t - тренировка, l - облегчённая, n - без напоминания. */
    static char kindOn(SharedPreferences p, Calendar c) {
        String days = p.getString("days", "nnnnnnn");
        int i = c.get(Calendar.DAY_OF_WEEK) - 1; // воскресенье = 0, как в JavaScript
        return i >= 0 && i < days.length() ? days.charAt(i) : 'n';
    }

    static char todayKind(SharedPreferences p) {
        return kindOn(p, Calendar.getInstance());
    }

    private static PendingIntent pending(Context c) {
        Intent i = new Intent(c, ReminderReceiver.class);
        return PendingIntent.getBroadcast(c, REQ, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Ставит будильник на ближайшее hh:mm в тренировочный день. Если выключено, снимает. */
    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        SharedPreferences p = prefs(c);
        if (!p.getBoolean("on", false)) {
            am.cancel(pending(c));
            return;
        }
        Calendar t = Calendar.getInstance();
        t.set(Calendar.HOUR_OF_DAY, p.getInt("h", 11));
        t.set(Calendar.MINUTE, p.getInt("m", 0));
        t.set(Calendar.SECOND, 0);
        t.set(Calendar.MILLISECOND, 0);
        long now = System.currentTimeMillis() + 1000;
        for (int k = 0; k < 8; k++) {
            if (t.getTimeInMillis() > now && kindOn(p, t) != 'n') break;
            t.add(Calendar.DAY_OF_MONTH, 1);
        }
        // не точный будильник: может прийти с задержкой в пару минут, зато не нужно особое разрешение
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), pending(c));
    }

    static void notifyNow(Context c, char kind) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Напоминание о тренировке", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26
            ? new android.app.Notification.Builder(c, CHANNEL)
            : new android.app.Notification.Builder(c);
        boolean light = kind == 'l';
        b.setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle(light ? "Сегодня облегчённая тренировка" : "Сегодня тренировка")
            .setContentText(light ? "Подходов меньше, около часа" : "Весь комплекс, около часа")
            .setContentIntent(pi)
            .setAutoCancel(true);
        nm.notify(REQ, b.build());
    }
}
