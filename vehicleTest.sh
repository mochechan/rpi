#!/bin/bash

gpio mode 6 out
gpio mode 10 out
gpio mode 11 out
gpio mode 14 out
gpio write 6 0
gpio write 10 0
gpio write 11 0
gpio write 14 0

function left_backward { 
	echo left_backward
	gpio write 6 1 
	sleep 2;
	gpio write 6 0
}

function right_backward {
	echo right_backward
	gpio write 11 1
	sleep 2
	gpio write 11 0
}

function right_forward { 
	echo right_forward
	gpio write 10 1
	sleep 2;
	gpio write 10 0
}

function left_forward { 
	echo left_forward
	gpio write 14 1
	sleep 2;
	gpio write 14 0
}

right_forward
#right_backward
left_forward
#left_backward

exit 0;

for i in $(seq 1 100)
do
  echo $i
	echo "left forward"
  echo write 6 1
  gpio write 6 1
  sleep 1
  echo write 6 0
  gpio write 6 0
  sleep 1

	echo "right forward"
  echo write 10 1
  gpio write 10 1
  sleep 1
  echo write 10 0
  gpio write 10 0
  sleep 1

  echo write 11 1
  gpio write 11 1
  sleep 1
  echo write 11 0
  gpio write 11 0
  sleep 1

  echo write 14 1
  gpio write 14 1
  sleep 1
  echo write 14 0
  gpio write 14 0
  sleep 1

done
