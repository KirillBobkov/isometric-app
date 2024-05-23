import { from, fromEvent, interval, timer } from 'rxjs'; 
import { switchMap, tap } from 'rxjs/operators'; 
 
const serviceUUID = 0xFFE0;
const serialUUID = 0xFFE1;

let device: any;
let serialCharacteristic: any;

export function connect() { 
    console.log('Запрос погнал'); 
 

    return interval(1000);
    // const device$ = from(navigator.bluetooth.requestDevice({ 
    //     filters: [{ 
    //         services: [serviceUUID] 
    //     }] 
    // })); 
 
    // const server$ = device$.pipe( 
    //     switchMap(device => from(device.gatt.connect())), 
    //     tap(() => console.log('Берем сервис ', serviceUUID)), 
    //     switchMap(server => from(server.getPrimaryService(serviceUUID))), 
    //     tap(() => console.log('Берем характеристику ', serialUUID)), 
    //     switchMap(service => from(service.getCharacteristic(serialUUID))), 
    //     tap(characteristic => { 
    //         serialCharacteristic = characteristic; 
    //         console.log('Подписываемся на сообщения '); 
    //     }) 
    // ); 
 
    // const notifications$ = server$.pipe( 
    //     switchMap(() => from(serialCharacteristic.startNotifications())), 
    //     switchMap(() => fromEvent(serialCharacteristic, 'characteristicvaluechanged')), 
    //     tap(() => { 
    //         serialCharacteristic.addEventListener('characteristicvaluechanged', read); 
    //     }) 
    // ); 
 
    // return notifications$; 
}

function disconnect(){
    device.gatt.disconnect();
}


function read(event: any) {
    console.log('Пришло сообщение:', event);

    let value = event.target.value;
    return new TextDecoder().decode(value);
}