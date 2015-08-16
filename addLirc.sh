#!/bin/bash
sudo /etc/init.d/lirc stop
irrecord -n -f -d /dev/lirc0 tmp.conf
sudo /etc/init.d/lirc start
