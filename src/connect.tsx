import { from, fromEvent, interval } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";

const serviceUUID = 0xffe0;
const serialUUID = 0xffe1;

let device: any;
let serialCharacteristic: any;

export function connect() {
  console.log("Запрос погнал");


  return interval(1000);
  
  const device$ = from(
      // @ts-ignore
    navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [serviceUUID],
        },
      ],
    })
  );

  const server$ = device$.pipe(
    // @ts-ignore
    switchMap((d) => {
      device = d;
          // @ts-ignore
      return from(d?.gatt?.connect());
    }),
    tap(() => console.log("Берем сервис ", serviceUUID)),
    // @ts-ignore
    switchMap((server) => from(server.getPrimaryService(serviceUUID))),
    tap(() => console.log("Берем характеристику ", serialUUID)),
    // @ts-ignore
    switchMap((service) => from(service.getCharacteristic(serialUUID))),
    tap((characteristic) => {
      serialCharacteristic = characteristic;
      console.log("Подписываемся на сообщения ");
    })
  );

  const notifications$ = server$.pipe(
    switchMap(() => from(serialCharacteristic.startNotifications())),
    switchMap(() =>
      fromEvent(serialCharacteristic, "characteristicvaluechanged")
    ),
    map((value) => read(value))
  );

  return notifications$;
}

export function disconnect() {
  device?.gatt?.disconnect();
}

export function getStatus() {
  return device?.gatt?.connected;
}

export function read(event: any) {
  let value = event.target.value;

  console.log("read", new TextDecoder().decode(value));
  return new TextDecoder().decode(value);
}
