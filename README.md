# NativeScript MQTT 3.1.1 Module

This nativescript-mqtt module is a cross-platofrm javascript implementation leveraging native socket support and the open source [MQTT PAHO library link](http://www.eclipse.org/paho). Currently the library only supports the websocket protocol for cross-platform on port 80 or 443 for SSL.

## Usage Sample
### Create an MQTT Client
```
import {MQTTClient, ClientOptions} from "nativescript-mqtt";
...
mqtt_host : string = "broker.mqttdashboard.com";
mqtt_port : number = 8000;
mqtt_useSSL : boolean = false;

mqtt_clientOptions: ClientOptions = {
    host: this.mqtt_host,
    port: this.mqtt_port,
    useSSL: this.mqtt_useSSL
};

mqtt_client : MQTTClient = new MQTTClient(this.mqtt_clientOptions);
```
### Setup Handlers
```
...
mqtt_topic : string = "sample-topic";

constructor() {
    this.setupHandlers();
}

setupHandlers() : void {
    this.mqtt_client.onConnectionFailure.on((err : any) => {
        console.log("Connection failed: " + JSON.stringify(err));
    });
    this.mqtt_client.onConnectionSuccess.on(() => {
        console.log("Connected successfully!");
        this.subscribe();
    });
    this.mqtt_client.onConnectionLost.on((err : any) => {
        console.log("Connection lost: " + JSON.stringify(err));
    });
    this.mqtt_client.onMessageArrived.on((message: Message) => {
        console.log("Message received: " + message.payload);
    });
}

subscribe() : void {
    this.mqtt_client.subscribe(this.mqtt_topic);
}
```

### Connect
```
mqtt_username : string = "";
mqtt_password : string = "";

connect() : void {
    this.mqtt_client.connect(this.mqtt_username, this.mqtt_password);
}
```
And in the template:
```
<Button text="Connect" (tap)="connect()"></Button>
```
### Message Object
```javascript
Message {
  payload: string
  bytes: ArrayBuffer
  topic: string
  qos: number
}
```
### A full Angular 2/4 Component and Template Sample
#### app.component.ts
```
import {Component} from "@angular/core";
import {MQTTClient, ClientOptions} from "nativescript-mqtt";
import {Message} from "nativescript-mqtt/common";

@Component({
    selector: "ns-app",
    templateUrl: "app.component.html",
})
export class AppComponent {
    mqtt_host: string = "broker.mqttdashboard.com";
    mqtt_port: number = 8000;
    mqtt_useSSL: boolean = false;
    mqtt_path: string = "/mqtt";
    mqtt_username: string = "";
    mqtt_password: string = "";
    mqtt_topic: string = "ninja-topic";

    mqtt_clientOptions: ClientOptions = {
        host: this.mqtt_host,
        port: this.mqtt_port,
        useSSL: this.mqtt_useSSL,
        path: this.mqtt_path
    };

    mqtt_client: MQTTClient = new MQTTClient(this.mqtt_clientOptions);

    loading : boolean = false;

    constructor() {
        this.setupHandlers();
    }

    connect() : void {
        try{
            this.mqtt_client.connect(this.mqtt_username, this.mqtt_password);
        }
        catch (e) {
            console.log("Caught error: " + e);
        }
    }

    subscribe() : void {
        try {
            this.mqtt_client.subscribe(this.mqtt_topic);
        }
        catch (e) {
            console.log("Caught error: " + e);
        }
    }

    setupHandlers() : void {
        this.mqtt_client.onConnectionFailure.on((err) => {
            console.log("Connection failed: " + err);
        });

        this.mqtt_client.onConnectionSuccess.on(() => {
            console.log("Connected successfully!");
            this.subscribe();
        });

        this.mqtt_client.onConnectionLost.on((err) => {
            console.log("Connection lost: " + err);
        });

        this.mqtt_client.onMessageArrived.on((message: Message) => {
            console.log("Message received: " + message.payload);
        });
    }
}
```
#### app.component.html
```
<ActionBar title="My App" class="action-bar"></ActionBar>
<StackLayout>
    <Label text="Hello World!"></Label>
    <Button text="Connect" (tap)="connect()" style="horizontal-align: center;"></Button>
    <ActivityIndicator busy="{{loading}}"></ActivityIndicator>
</StackLayout>
```
