#!/bin/bash 
# for a new Raspberry PI updated: 201506 

cd ~
cat /proc/version
cat /proc/cpuinfo
cat /proc/asound/cards # show all available sound cards 
cat /proc/asound/modules # show all available sound modules
vcgencmd measure_temp # show cpu temperature
vcgencmd get_mem arm && vcgencmd get_mem gpu # show free memory for cpu & gpu

df -k -h /
remainingK=$(($(stat -f --format="%a*%S" .))) 
echo $remainingK
echo please run sudo raspi-config manually before running this script.  Expand Filesystem and reboot
echo please run sudo raspi-config manually before running this script.  Expand Filesystem and reboot
echo please run sudo raspi-config manually before running this script.  Expand Filesystem and reboot
if [ "$remainingK" -lt "9876543210" ]; then
	echo not enough space
	exit;
fi

sudo apt-get -y update
sudo apt-get -y upgrade
sudo apt-get -y dist-upgrade 

sudo apt-get -y install vim screen git git-core lirc rtorrent alsa-utils 
# nodejs should be install manually because nodejs installed from apt-get is very old.
echo nolirc=yes | sudo tee -a /etc/mplayer/mplayer.conf
echo lirc_dev | sudo tee -a /etc/modules
echo lirc_rpi gpio_in_pin=23 gpio_out_pin=22 | sudo tee -a /etc/modules
echo dtoverlay=lirc-rpi,gpio_in_pin=23,gpio_out_pin=22 | sudo tee -a /boot/config.txt
cp -av etc_lirc_hardware.conf  /etc/lirc/hardware.conf

#wget http://nodejs.org/dist/v0.12.0/node-v0.12.0.tar.gz
#tar -zxf node-v0.12.0.tar.gz; cd node-v0.12.0; ./configure; make; make install 
wget http://node-arm.herokuapp.com/node_latest_armhf.deb
sudo dpkg -i node_latest_armhf.deb

# driver for rpi gpio 
echo installing wiringPi 
git clone git://git.drogon.net/wiringPi
cd wiringPi
git pull origin
./build
gpio -v
gpio readall


# Bluetooth+Airplay Audio Receiver
# http://www.instructables.com/id/Raspberry-Pi-BluetoothAirplay-Audio-Receiver-combo/?ALLSTEPS
sudo apt-get update
sudo apt-get -y upgrade
cd ~
git clone https://ehsmaes@bitbucket.org/ehsmaes/raspberry-pi-audio-receiver-install.git 
cd raspberry-pi-audio-receiver-install/
./runall.sh



exit 0;
# http://www.raywenderlich.com/44918/raspberry-pi-airplay-tutorial
# http://raspberryalphaomega.org.uk/2014/06/11/installing-and-using-node-js-on-raspberry-pi/
# http://node-arm.herokuapp.com/
# version of nodejs installed by apt-get is too old 

lirc
sudo apt-get install lirc
sudo modprobe lirc_rpi
sudo vi /etc/lirc/hardware.conf
irsend SEND_ONCE lirc-ac.conf power_off
sudo /etc/init.d/lirc stop 
irrecord -n -f -d /dev/lirc0 filename.conf

# already refactor to *.sh 
#sudo apt-get -y install python-pip 
#sudo pip install pibrella
#sudo apt-get -y install python3-pip
#sudo pip-3.2 install pibrella


# screen -S automatically starts in /etc/rc.local (good)
#su - username -c "/usr/bin/screen -dmS test bash -c '/var/www/path/to/script/script.sh; exec bash'"
/bin/su username -c "/usr/bin/screen -dmS test bash -c '/home/username/test.sh; exec bash'"

