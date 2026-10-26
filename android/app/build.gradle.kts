plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The site the app opens. Its /.well-known/assetlinks.json must list this app's signing keys.
val host = "splitbiller.com"

android {
    namespace = "com.splitbiller.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.splitbiller.app"
        // Chrome no longer runs below Android 8, and the app is Chrome underneath.
        minSdk = 26
        targetSdk = 36
        // Bump both for every Play upload.
        versionCode = 1
        versionName = "1.0.0"

        resValue("string", "hostName", host)
        resValue("string", "launchUrl", "https://$host/dashboard")
        resValue("string", "addExpenseUrl", "https://$host/dashboard?add")
        resValue("string", "providerAuthority", "$applicationId.fileprovider")
        buildConfigField("String", "ORIGIN", "\"https://$host\"")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
    testImplementation("junit:junit:4.13.2")
    // Android's org.json is a stub in local unit tests; this is the real thing.
    testImplementation("org.json:json:20240303")
}
