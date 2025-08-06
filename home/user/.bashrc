# ~/.bashrc: executed by bash(1) for non-login shells.

# Set ANDROID_HOME environment variable for Capacitor/Android builds
export ANDROID_HOME="/opt/android-sdk"
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac
