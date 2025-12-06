# SahKosh ProGuard Rules for Android Release Build
# ================================================

# Keep Android components
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.app.backup.BackupAgentHelper
-keep public class * extends android.preference.Preference

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep custom views
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet);
}
-keepclasseswithmembers class * {
    public <init>(android.content.Context, android.util.AttributeSet, int);
}

# Keep Parcelable
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Keep Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}

# ===============================
# React Native Specific Rules
# ===============================

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep JavaScript interface
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp *;
}
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup *;
}

# Hermes engine
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep ViewManagers
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }

# Keep TurboModules
-keep class * extends com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }

# ===============================
# Expo Specific Rules
# ===============================

-keep class expo.modules.** { *; }
-keep class host.exp.exponent.** { *; }

# ===============================
# Third Party Libraries
# ===============================

# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Retrofit (if used)
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# Gson (if used)
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# ===============================
# Remove Debug Logs
# ===============================

-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Remove console logs
-assumenosideeffects class java.io.PrintStream {
    public void println(...);
    public void print(...);
}

# ===============================
# Optimization
# ===============================

-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ===============================
# AsyncStorage
# ===============================

-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ===============================
# Prevent crash on reflection
# ===============================

-keepattributes InnerClasses
-keepattributes EnclosingMethod
