/*-
    relay-2way.c
    
    compile: gcc relay-2way.c -l rt -l bcm2835 -std=gnu99 -o relay-2way
    
    測試兩路繼電器
    
    線路說明：
    使用數莓派的GPIO控制兩路繼電器 (active low)
    
    未初始化前，繼電器保持之前狀態，但開機之後未操作GPIO前繼電器為 OFF。
    
    初始化後 (bcm2835_init())，繼電器保持之前狀態，但開機之後未操作GPIO前繼電器為 OFF。
    
    初始化後設定接腳為輸出 (bcm2835_gpio_fsel(#, BCM2835_GPIO_FSEL_OUTP), 
    繼電器保持之前狀態，但開機之後未操作GPIO前繼電器為  ON
    
    2 路繼電器接腳: GND, INP1, INP2, VCC
        樹莓派接腳: GND,  #24,  #25, 5V0 
    Vcc使用3V3 亦可，但要注意是否會電壓不足無法驅動; 建議使用 5V0 
    
    Result: It's Work!!!    
-*/

#include <stdio.h>  	// printf, scanf
#include <bcm2835.h>

#define RELAY_INP1		24	// GPIO #24 
#define RELAY_INP2		25	// GPIO #25

int prog_exit(void);

int main(int argc, char **argv)
{
	int relay = 0;
	int onoff = 0;
	
	// GPIO 初始化
    if(!bcm2835_init())
        return 1;

	// 設定接腳狀態       
    bcm2835_gpio_fsel(RELAY_INP1, BCM2835_GPIO_FSEL_OUTP);
    bcm2835_gpio_fsel(RELAY_INP2, BCM2835_GPIO_FSEL_OUTP);
 
    // 初始輸出狀態
    bcm2835_gpio_write(RELAY_INP1, HIGH);
    bcm2835_gpio_write(RELAY_INP2, HIGH);
    
    while(1)
    {
        printf("\nUsage: relay(1 or 2) on/off(1 or 0), ex. 1 0 (relay 1 off) \n");
        printf("3 0 all off, 3 1 all on, 0 0 to exit\n");
        printf("relay turn on/off: (%d %d): ", relay, onoff);
        scanf("%d %d", &relay, &onoff);
        printf("relay turn on/off: (%d %d): ", relay, onoff);
        fflush(stdin);        
        
		if(onoff == 0)
			onoff = HIGH;
		else if(onoff == 1)
			onoff = LOW;
		else
		{
        	printf("keyin the worng relay status!\n");
 			if(!prog_exit)
 				return 3;
        }
        
		if(relay == 0)
		{
			return prog_exit();
		}
		else if(relay == 1)
        	bcm2835_gpio_write(RELAY_INP1, onoff);
        else if(relay == 2)
        	bcm2835_gpio_write(RELAY_INP2, onoff);
        else if(relay == 3)
        {
        	bcm2835_gpio_write(RELAY_INP1, onoff);
        	bcm2835_gpio_write(RELAY_INP2, onoff);
        }
        else
        {
        	printf("Keyin the wrong relay number!\n");        	
			if(!prog_exit())
				return 3;
        }
    }
    
    return 0;
}

int prog_exit()
{
    bcm2835_gpio_write(RELAY_INP1, HIGH); // turn off relay
    bcm2835_gpio_write(RELAY_INP2, HIGH);
    
    // 關閉 bcm2835 函式庫
    if (!bcm2835_close())
    {
        printf("Failed to close the library, deallocating any allocated memory and closing /dev/mem\n");
        printf("\nPress any key to exit...");
        return 2;
    }
    return 0;
}