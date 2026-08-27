package com.taitungray.taoyuanqunying;

import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private GoogleSignInClient client;

    private String webClientId() {
        int generatedId = getContext().getResources().getIdentifier(
                "default_web_client_id", "string", getContext().getPackageName());
        if (generatedId != 0) return getContext().getString(generatedId);
        return getContext().getString(R.string.google_web_client_id);
    }

    private GoogleSignInClient googleClient() {
        if (client == null) {
            GoogleSignInOptions options = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId())
                    .requestEmail()
                    .build();
            client = GoogleSignIn.getClient(getActivity(), options);
        }
        return client;
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        GoogleSignInClient signInClient = googleClient();
        signInClient.silentSignIn().addOnCompleteListener(getActivity(), task -> {
            if (task.isSuccessful()) {
                resolveAccount(call, task);
            } else {
                startActivityForResult(call, signInClient.getSignInIntent(), "googleSignInResult");
            }
        });
    }

    @ActivityCallback
    private void googleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (data == null) {
            call.reject("使用者取消 Google 登入");
            return;
        }
        resolveAccount(call, GoogleSignIn.getSignedInAccountFromIntent(data));
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        googleClient().signOut().addOnCompleteListener(task -> call.resolve());
    }

    private void resolveAccount(PluginCall call, Task<GoogleSignInAccount> task) {
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            String idToken = account.getIdToken();
            if (idToken == null || idToken.isEmpty()) {
                call.reject("Google 未回傳 idToken，請確認 OAuth client 設定");
                return;
            }
            JSObject result = new JSObject();
            result.put("idToken", idToken);
            result.put("email", account.getEmail());
            result.put("displayName", account.getDisplayName() == null ? "" : account.getDisplayName());
            call.resolve(result);
        } catch (ApiException error) {
            if (error.getStatusCode() == 12501) {
                call.reject("使用者取消 Google 登入");
            } else {
                call.reject("Google 登入失敗，錯誤代碼：" + error.getStatusCode(), String.valueOf(error.getStatusCode()));
            }
        }
    }
}
