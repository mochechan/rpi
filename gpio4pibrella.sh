#!/bin/bash
# GPIO for pibrella

gpio -v
errorlevel=$?
if [ $errorlevel -gt 0 ]; then
  echo "http://wiringpi.com/download-and-install/  is needed. " 
  exit $errorlevel;
fi


red=2
yellow=0
green=7
button=14
inA=13 # Top one
inB=11
inC=10
inD=12 # Bottom one
outE=3	# Top one
outF=4 
outG=5 
outH=6	# Bottom one


init ()
{
  for led in $red yellow $green $outE $outF $outG $outH 
  do
    gpio mode $led out        #setting the pin as output
    gpio write $led 0         #shut off the led
  done
 
  for input in $button $inA $inB $inC $inD
  do
    gpio mode $input in       #setting the pin as input
    gpio mode $input down     # Enable pull-down
  done

  gpio mode  1 pwm 
  gpio pwm-ms
}


# waitButton: #	Wait for the button to be pressed. 
#######################################################################

waitButton ()
{
  echo -n "Waiting for button ... "
  while [ `gpio read $button` = 0 ]; do
    sleep 0.1
  done
  echo "Pressed "
}


testInputs ()
{
  echo "inputs: "
  while [ 0 = 0 ]; do
    ina=$(gpio read $inA)
    inb=$(gpio read $inB)
    inc=$(gpio read $inC)
    ind=$(gpio read $inD)
    inButton=$(gpio read $button)
    echo In A$ina B$inb C$inc D$ind Button$inButton 
  done
}


testOutputs ()
{
  for i in {1..100000}
  do
    echo -n "$i " 
    case $(expr $i % 17) in
      0)
	gpio write $outE 0
	gpio write $outF 0
	gpio write $outG 0
	gpio write $outH 0
	;;
      1)
	gpio write $outE 1
	gpio write $outF 0
	gpio write $outG 0
	gpio write $outH 0
	;;
      2)
	gpio write $outE 0
	gpio write $outF 1
	gpio write $outG 0
	gpio write $outH 0
	;;
      3)
	gpio write $outE 1
	gpio write $outF 1
	gpio write $outG 0
	gpio write $outH 0
	;;
      4)
	gpio write $outE 0
	gpio write $outF 0
	gpio write $outG 1
	gpio write $outH 0
	;;
      5)
	gpio write $outE 1
	gpio write $outF 0
	gpio write $outG 1
	gpio write $outH 0
	;;
      6)
	gpio write $outE 0
	gpio write $outF 1
	gpio write $outG 1
	gpio write $outH 0
	;;
      7)
	gpio write $outE 1
	gpio write $outF 1
	gpio write $outG 1
	gpio write $outH 0
	;;
      8)
	gpio write $outE 0
	gpio write $outF 0
	gpio write $outG 0
	gpio write $outH 1
	;;
      9)
	gpio write $outE 1
	gpio write $outF 0
	gpio write $outG 0
	gpio write $outH 1
	;;
      10)
	gpio write $outE 0
	gpio write $outF 1
	gpio write $outG 0
	gpio write $outH 1
	;;
      11)
	gpio write $outE 1
	gpio write $outF 1
	gpio write $outG 0
	gpio write $outH 1
	;;
      12)
	gpio write $outE 0
	gpio write $outF 0
	gpio write $outG 1
	gpio write $outH 1
	;;
      13)
	gpio write $outE 1
	gpio write $outF 0
	gpio write $outG 1
	gpio write $outH 1
	;;
      14)
	gpio write $outE 0
	gpio write $outF 1
	gpio write $outG 1
	gpio write $outH 1
	;;
      15)
	gpio write $outE 1
	gpio write $outF 1
	gpio write $outG 1
	gpio write $outH 1
	;;

      *)
	peep
	;;
    esac
  done
}

testLEDs ()
{
  for i in {1..100000}
  do
    echo -n "$i " 
    case $(expr $i % 8) in
      0)
	gpio write $green  0
	gpio write $yellow 0
	gpio write $red    0
	;;
      1)
	gpio write $green  1
	gpio write $yellow 0
	gpio write $red    0
	;;
      2)
	gpio write $green  0
	gpio write $yellow 1
	gpio write $red    0
	;;
      3)
	gpio write $green  1
	gpio write $yellow 1
	gpio write $red    0
	;;
      4)
	gpio write $green  0
	gpio write $yellow 0
	gpio write $red    1
	;;
      5)
	gpio write $green  1
	gpio write $yellow 0
	gpio write $red    1
	;;
      6)
	gpio write $green  0
	gpio write $yellow 1
	gpio write $red    1
	;;
      7)
	gpio write $green  1
	gpio write $yellow 1
	gpio write $red    1
	;;

      *)
	peep
	;;
    esac
  done
}

enumOutputs ()
{
  for i in {1..100000}
  do
    echo -n "$i "
    case $(expr $i % 4) in
      0)
        gpio write $outE 1
        gpio write $outF 0
        gpio write $outG 0
        gpio write $outH 0
        ;;
      1)
        gpio write $outE 0
        gpio write $outF 1
        gpio write $outG 0
        gpio write $outH 0
        ;;
      2)
        gpio write $outE 0
        gpio write $outF 0
        gpio write $outG 1
        gpio write $outH 0
        ;;
      3)
        gpio write $outE 0
        gpio write $outF 0
        gpio write $outG 0
        gpio write $outH 1
        ;;
      *)
    esac
  done
}


peep ()
{
  gpio pwmr 600
  gpio pwm  1 300	# 1000Hz
  sleep 0.01
  gpio pwm  1 0
}


detectConnection ()
{
  echo $(date)
  curl 'https://moneyage.imoncloud.com:37465/event/CONNECTION_STATUS' 
  #ping -c 1 -W 1 192.168.0.1

  errorlevel=$?

  if [ "$errorlevel" == "0" ]; then
    echo "Everything seems ok. "
    gpio write $red   0
    gpio write $green 1    
    sleep 30
  else
    echo "Something is wrong. $errorlevel "
    gpio write $red   1
    gpio write $green 0
    peep
  fi

}

################################
# The main program
################################

count=0

init

case "$1" in 
  "testInputs")
    testInputs
    ;;
  "testOutputs")
    testOutputs
    ;;
  "enumOutputs")
    enumOutputs
    ;;
  "testLEDs")
    testLEDs
    ;;
  "init")
    init
    exit;
    ;;
  "keepReading")
    echo "in keepReading"
    gpio mode 29 in 
    gpio mode 25 in 
    for i in {1..9999}
    do
      echo $i PIR$(gpio read 29) flame$(gpio read 25)
    done
    ;;
  *)
    echo "arguements:"
    grep -n "\")" $0 
esac


while true; do
  count=$((count + 1))
  echo $count 
  #gpio write $green $(expr $count % 2 ) 
  #detectConnection 
  #peep 

  if [ -d stop ]; then
    echo stopping 
    rmdir stop
    exit 9;
  fi

done


