import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The site the app opens. Its /.well-known/assetlinks.json must list this app's signing keys.
// www, not the bare domain: Vercel redirects splitbiller.com to www, and Chrome treats them as different origins.
val host = "www.splitbiller.com"

// The upload key, from android/keystore.properties (gitignored, written by hand, never committed).
// Without it, bundleRelease still builds, unsigned.
val keystore = rootProject.file("keystore.properties").takeIf { it.exists() }
    ?.let { f -> Properties().apply { f.inputStream().use { load(it) } } }

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

    signingConfigs {
        if (keystore != null) create("upload") {
            storeFile = rootProject.file(keystore.getProperty("storeFile"))
            storePassword = keystore.getProperty("storePassword")
            keyAlias = keystore.getProperty("keyAlias")
            keyPassword = keystore.getProperty("keyPassword")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.findByName("upload")
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
