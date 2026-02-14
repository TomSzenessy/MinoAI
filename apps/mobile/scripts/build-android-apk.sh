#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MOBILE_DIR="${ROOT_DIR}/apps/mobile"
ENV_FILE="${ROOT_DIR}/.env"

if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

ANDROID_SIGNING_PASSWORD="${ANDROID_SIGNING_PASSWORD:-}"
ANDROID_KEY_ALIAS="${ANDROID_KEY_ALIAS:-mino-release}"
ANDROID_KOTLIN_VERSION="${ANDROID_KOTLIN_VERSION:-1.9.24}"

if [ -z "${ANDROID_SIGNING_PASSWORD}" ]; then
  echo "ANDROID_SIGNING_PASSWORD is required (set it in .env or environment)."
  exit 1
fi

echo "Building workspace dependencies for mobile (shared/api-client/design-tokens)..."
pnpm --filter @mino-ink/shared build
pnpm --filter @mino-ink/api-client build
pnpm --filter @mino-ink/design-tokens build

pushd "${MOBILE_DIR}" >/dev/null

echo "Preparing Android native project (Expo prebuild)..."
CI=1 pnpm exec expo prebuild --platform android --no-install --clean

KEYSTORE_PATH="android/app/mino-upload.keystore"
GRADLE_PROPERTIES_FILE="android/gradle.properties"
SIGNING_CONFIG_FILE="android/app/signing-config.gradle"
APP_BUILD_FILE="android/app/build.gradle"

upsert_gradle_property() {
  local key="$1"
  local value="$2"
  local tmp_file

  tmp_file="$(mktemp)"
  awk -v k="${key}" -v v="${value}" '
    BEGIN { updated = 0 }
    index($0, k "=") == 1 {
      print k "=" v
      updated = 1
      next
    }
    { print }
    END {
      if (!updated) {
        print k "=" v
      }
    }
  ' "${GRADLE_PROPERTIES_FILE}" > "${tmp_file}"
  mv "${tmp_file}" "${GRADLE_PROPERTIES_FILE}"
}

echo "Enforcing Android Kotlin version ${ANDROID_KOTLIN_VERSION} for Compose compatibility..."
upsert_gradle_property "android.kotlinVersion" "${ANDROID_KOTLIN_VERSION}"
upsert_gradle_property "kotlinVersion" "${ANDROID_KOTLIN_VERSION}"

echo "Pinning Android build.gradle Kotlin fallback to ${ANDROID_KOTLIN_VERSION}..."
sed -i.bak -E "s/(kotlinVersion = findProperty\\('android\\.kotlinVersion'\\) \\?: ')[^']+(')/\\1${ANDROID_KOTLIN_VERSION}\\2/" android/build.gradle
rm -f android/build.gradle.bak

echo "Generating release signing keystore..."
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore "${KEYSTORE_PATH}" \
  -alias "${ANDROID_KEY_ALIAS}" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "${ANDROID_SIGNING_PASSWORD}" \
  -keypass "${ANDROID_SIGNING_PASSWORD}" \
  -dname "CN=Mino, OU=Mobile, O=Mino, L=Budapest, S=Budapest, C=HU" \
  >/dev/null 2>&1

upsert_gradle_property "MYAPP_UPLOAD_STORE_FILE" "mino-upload.keystore"
upsert_gradle_property "MYAPP_UPLOAD_KEY_ALIAS" "${ANDROID_KEY_ALIAS}"
upsert_gradle_property "MYAPP_UPLOAD_STORE_PASSWORD" "${ANDROID_SIGNING_PASSWORD}"
upsert_gradle_property "MYAPP_UPLOAD_KEY_PASSWORD" "${ANDROID_SIGNING_PASSWORD}"

cat > "${SIGNING_CONFIG_FILE}" <<'EOF'
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
EOF

if ! grep -q 'signing-config.gradle' "${APP_BUILD_FILE}"; then
  printf '\napply from: "./signing-config.gradle"\n' >> "${APP_BUILD_FILE}"
fi

echo "Building Android APKs (debug + release)..."
pushd android >/dev/null
chmod +x gradlew
./gradlew --no-daemon clean assembleDebug assembleRelease
popd >/dev/null

echo "Build complete. APK outputs:"
find android/app/build/outputs/apk -type f -name "*.apk" -print

popd >/dev/null
