package com.aurvm.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AurvmSystemBarsPlugin.class);
        super.onCreate(savedInstanceState);
        AurvmSystemBarsPlugin.apply(this, "#F7F4F1", true);
    }
}
