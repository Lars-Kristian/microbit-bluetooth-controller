let connectedServer = null;
device = null;

const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let server = null;
let tx = null;

let encoder = new TextEncoder('utf-8');

function setStatus(status){
    let element = document.getElementById('status-label');
    element.innerText = status;
}

function onClickDisconnect() {
    if (!device) {
        return;
    }
    if (device.gatt.connected) {
        device.removeEventListener('gattserverdisconnected', onDeviceDisconnected);
        device.gatt.disconnect();
        server = null;
        tx = null;
        setStatus('Device disconnected');
    }
}

function onDeviceDisconnected(){
    setStatus('Device disconnected');
}

async function onClickConnect() {
    let options = {
        filters: [
            { namePrefix: "BBC micro:bit" }
        ],
        optionalServices: [UART_SERVICE_UUID]
    };

    console.log('Requesting Bluetooth Device...');
    device = await navigator.bluetooth.requestDevice(options);
    device.addEventListener('gattserverdisconnected', onDeviceDisconnected);
    console.log('Connected device');

    server = await device.gatt.connect();
    console.log('Connected server');

    let test = await server.getPrimaryServices();
    console.log('All services', test);

    let service = await server.getPrimaryService(UART_SERVICE_UUID);
    console.log('Found service', service);

    let characteristics = await service.getCharacteristics();
    console.log('Found characteristics', characteristics);

    tx = await service.getCharacteristic(UART_TX_UUID);
    console.log('Got tx', tx);

    setStatus("Device connected");
}

async function sendCommand(command) {
    if (!tx) return;
    try {
        console.log('Sending command', command);
        await tx.writeValueWithoutResponse(encoder.encode(command));
    } catch (e) {
        console.error(e);
    }
}

let buttonState = {};

async function onPressButton(event) {
    let buttonName = event.target.getAttribute('data-button-value');
    await sendCommand(createCommand(buttonName, 1));
}

async function onReleaseButton(event) {
    let buttonName = event.target.getAttribute('data-button-value');
    await sendCommand(createCommand(buttonName, 0));
}

function loadController() {
    let elements = document.querySelectorAll('[data-button-value]');
    console.log('found data-button-value', elements);
    elements.forEach(element => {
        buttonState[element.getAttribute('data-button-value')] = 0;
        element.onmousedown = onPressButton;
        element.onmouseup = onReleaseButton;

        element.ontouchstart = onPressButton;
        element.ontouchcancel = onReleaseButton;
        element.ontouchend = onReleaseButton;
    });
}

function createCommand(buttonName, value) {
    return `${buttonName}:${value};`;
}

