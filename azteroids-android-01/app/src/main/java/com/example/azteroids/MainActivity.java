package com.example.azteroids;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView webView = (WebView) findViewById(R.id.webview);

        WebSettings webViewSettings = webView.getSettings();

        webViewSettings.setJavaScriptEnabled(true);

        webViewSettings.setAllowFileAccess(true);
        webViewSettings.setAllowContentAccess(true);

        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

        webView.loadUrl("file:///android_asset/index.html");
    }
}