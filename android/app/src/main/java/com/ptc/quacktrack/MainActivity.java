package com.ptc.quacktrack;

import android.os.Build;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable fullscreen/immersive mode
        enableFullscreenMode();
    }

    private void enableFullscreenMode() {
        // For Android 11 (API 30) and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                // Hide both status bar and navigation bar
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                // Use BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE so bars appear briefly on swipe
                // or BEHAVIOR_SHOW_BARS_BY_TOUCH for touch
                // Use BEHAVIOR_DEFAULT to keep them hidden (sticky immersive)
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            // For older Android versions (API 19-29)
            // Use deprecated flags for compatibility
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }

        // Extend content into cutout area (notch) if present
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Re-enable fullscreen mode when window regains focus
        if (hasFocus) {
            enableFullscreenMode();
        }
    }
}
