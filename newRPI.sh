#!/bin/bash
# for Raspberry PI updated: 201411 

cat /proc/version
cat /proc/cpuinfo
cat /proc/asound/cards # show all available sound cards 
cat /proc/asound/modules # show all available sound modules
vcgencmd measure_temp # show cpu temperature
vcgencmd get_mem arm && vcgencmd get_mem gpu # show free memory for cpu & gpu

echo please run sudo raspi-config manually before running this script.  Expand Filesystem and reboot
sudo apt-get -y update
sudo apt-get -y upgrade
sudo apt-get -y dist-upgrade 

sudo apt-get -y install vim screen git git-core lirc rtorrent alsa-utils mplayer festival
# nodejs installed from apt-get is very old.
echo nolirc=yes | tee -a /etc/mplayer/mplayer.conf

#sudo apt-get -y install python-pip 
#sudo pip install pibrella
#sudo apt-get -y install python3-pip
#sudo pip-3.2 install pibrella

cd /home/pi
echo installing wiringPi 
git clone git://git.drogon.net/wiringPi
cd wiringPi
git pull origin
./build
gpio -v
gpio readall

exit 0;
# http://www.raywenderlich.com/44918/raspberry-pi-airplay-tutorial
# http://raspberryalphaomega.org.uk/2014/06/11/installing-and-using-node-js-on-raspberry-pi/
# http://node-arm.herokuapp.com/
# version of nodejs installed by apt-get is too old 

