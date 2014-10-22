#!/bin/bash
# for Raspberry PI updated: 20140923 
cd /home/pi
cat /proc/version
cat /proc/cpuinfo
echo please run this manually: sudo raspi-config # Expand Filesystem and reboot
sudo apt-get -y update
sudo apt-get -y upgrade
sudo apt-get -y dist-upgrade 

sudo apt-get -y install vim screen git nodejs npm git-core lirc


#sudo apt-get -y install python-pip 
#sudo pip install pibrella
#sudo apt-get -y install python3-pip
#sudo pip-3.2 install pibrella

echo installing wiringPi 
git clone git://git.drogon.net/wiringPi
cd wiringPi
git pull origin
./build
gpio -v
gpio readall

