#!/bin/bash
say() { local IFS=+;/usr/bin/mplayer -ao alsa -really-quiet -noconsolecontrols "http://translate.google.com/translate_tts?tl=zh-TW&q=$*"; }
say $*
say '翻譯企業�'

exit 99;
This script uses Google's Text to Speech engine. This means you will need an internet connection for it to work, but the speech quality is superb. 
http://elinux.org/RPi_Text_to_Speech_%28Speech_Synthesis%29

