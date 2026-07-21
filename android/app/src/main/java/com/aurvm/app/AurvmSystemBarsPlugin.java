package com.aurvm.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AurvmSystemBars")
public class AurvmSystemBarsPlugin extends Plugin {
    static void apply(Activity activity, String colorValue, boolean lightIconsBackground) {
        activity.runOnUiThread(() -> {
            int color;
            try {
                color = Color.parseColor(colorValue);
            } catch (IllegalArgumentException error) {
                color = Color.parseColor("#F7F4F1");
            }

            Window window = activity.getWindow();
            WindowCompat.setDecorFitsSystemWindows(window, true);
            window.setStatusBarColor(color);
            window.setNavigationBarColor(color);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                window.setNavigationBarDividerColor(color);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.setStatusBarContrastEnforced(false);
                window.setNavigationBarContrastEnforced(false);
            }

            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
            controller.setAppearanceLightStatusBars(lightIconsBackground);
            controller.setAppearanceLightNavigationBars(lightIconsBackground);
        });
    }

    @PluginMethod
    public void setAppearance(PluginCall call) {
        String color = call.getString("color", "#F7F4F1");
        Boolean light = call.getBoolean("light", true);
        apply(getActivity(), color, light != null && light);
        call.resolve(new JSObject());
    }
}
