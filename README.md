# NativeScript MQTT 3.1.1 Module ![Build Status](https://travis-ci.org/edusperoni/nativescript-mqtt.svg?branch=master)

This nativescript-mqtt module is a cross-platofrm javascript implementation leveraging native socket support and the open source [MQTT PAHO library link](http://www.eclipse.org/paho). Currently the library only supports the websocket protocol for cross-platform on port 80 or 443 for SSL.

## Usage Sample
### Create an MQTT Client
```typescript
import {MQTTClient, ClientOptions, SubscribeOptions} from "nativescript-mqtt";
...
class MyMQTT {
    ...
    mqtt_host: string = "broker.mqttdashboard.com";
    mqtt_port: number = 8000;

    mqtt_clientOptions: ClientOptions = {
        host: this.mqtt_host,
        port: this.mqtt_port
    };

    mqtt_client: MQTTClient = new MQTTClient(this.mqtt_clientOptions);
}
```
### Setup Handlers
```typescript
class MyMQTT {
    ...
    mqtt_topic: string = "sample-topic";

    constructor() {
        this.setupHandlers();
    }

    setupHandlers(): void {
        this.mqtt_client.onConnectionFailure.on((err: any) => {
            console.log("Connection failed: " + JSON.stringify(err));
        });
        this.mqtt_client.onConnectionSuccess.on(() => {
            console.log("Connected successfully!");
            this.subscribe();
        });
        this.mqtt_client.onConnectionLost.on((err: any) => {
            console.log("Connection lost: " + JSON.stringify(err));
        });
        this.mqtt_client.onMessageArrived.on((message: Message) => {
            console.log("Message received: " + message.payload);
        });
        this.mqtt_client.onMessageDelivered.on((message: Message) => {
            console.log("Message delivered: " + message.payload);
        });
    }

    subscribe(): void {
        const opts: SubscribeOptions = {
            qos: 1
        };

        this.mqtt_client.subscribe(this.mqtt_topic, opts).then(
            (params) => console.log(`subscribed to ${this.mqtt_topic} with QoS ${params.grantedQos}`),
            (err) => console.log("error subscribing")
        );
    }
}
```

### Connect
```typescript
class MyMQTT {
    ...
    mqtt_username: string = "";
    mqtt_password: string = "";
    mqtt_useSSL: boolean = false;
    mqtt_cleanSession: boolean = false;
    mqtt_autoReconnect: boolean = false;

    connect(): void {
        const connOptions: ConnectionOptions = {
            cleanSession: this.mqtt_cleanSession,
            reconnect: this.autoReconnect,
            useSSL: this.mqtt_useSSL,
            userName: this.mqtt_username,
            password: this.mqtt_password
        }
        this.mqtt_client.connect(connOptions);
    }
}
```
And in the template:
```html
<Button text="Connect" (tap)="connect()"></Button>
```
### Message Object
```typescript
class Message {
    /**
     * The name of the destination to which the message is to be sent
     * (for messages about to be sent) or the name of the destination from which the message has been received.
     * (for messages received by the onMessage function).
     */
    destinationName: string;

    /**
     * If true, this message might be a duplicate of one which has already been received.
     * This is only set on messages received from the server.
     */
    readonly duplicate: boolean;

    /**
     * The payload.
     * @return if payload is a string. Return the original otherwise.
     */
    readonly payloadBytes: ArrayBuffer | TypedArray;

    /**
     *  The payload as a string if the payload consists of valid UTF-8 characters.
     *  @throw {Error} if the payload is not valid UTF-8
     */
    readonly payloadString: string;

    /**
     * The Quality of Service used to deliver the message.
     * <dl>
     *     <dt>0 Best effort (default).
     *     <dt>1 At least once.
     *     <dt>2 Exactly once.
     * </dl>
     *
     * @default 0
     */
    qos: Qos;

    /**
     * If true, the message is to be retained by the server and delivered to both current and future
     * subscriptions. If false the server only delivers the message to current subscribers, this is the default
     * for new Messages. A received message has the retained boolean set to true if the message was published
     * with the retained boolean set to true and the subscription was made after the message has been published.
     *
     * @default false
     */
    retained: boolean;

    /**
     * @param payload The message data to be sent.
     */
    constructor(payload: string | ArrayBuffer | TypedArray);
}
```
### A full Angular 2/4 Component and Template Sample
#### app.component.ts
```typescript
import {Component} from "@angular/core";
import {MQTTClient, ClientOptions, SubscribeOptions, Message} from "nativescript-mqtt";
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
    mqtt_cleanSession: boolean = true;

    mqtt_clientOptions: ClientOptions = {
        host: this.mqtt_host,
        port: this.mqtt_port,
        path: this.mqtt_path,
    };

    mqtt_client: MQTTClient = new MQTTClient(this.mqtt_clientOptions);

    loading: boolean = false;

    constructor() {
        this.setupHandlers();
    }

    connect(): void {
        const connOptions: ConnectionOptions = {
            cleanSession: this.mqtt_cleanSession,
            useSSL: this.mqtt_useSSL,
            userName: this.mqtt_username,
            password: this.mqtt_password
        };
        this.mqtt_client.connect(connOptions).then(() => {
            console.log("connected");
        }, (err) => {
            console.log("connection error: " + err);
        });
    }

    sendMessage() {
        const m = new Message("message content");
        m.destinationName = this.mqtt_topic;
        m.qos = 1;
        m.retained = false;
        this.mqttClient.publish(m);
    }

    subscribe(): void {
        try {
            const opts: SubscribeOptions = {
                qos: 0
            };

            this.mqtt_client.subscribe(this.mqtt_topic, opts);
        }
        catch (e) {
            console.log("Caught error: " + e);
        }
    }

    setupHandlers(): void {
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
            console.log("Message received: " + message.payloadString);
        });

        this.mqtt_client.onMessageDelivered.on((message: Message) => {
            console.log("Message delivered: " + message.payloadString);
        });
    }
}
```
#### app.component.html
```html
<ActionBar title="My App" class="action-bar"></ActionBar>
<StackLayout>
    <Label text="Hello World!"></Label>
    <Button text="Connect" (tap)="connect()" style="horizontal-align: center;"></Button>
    <ActivityIndicator busy="{{loading}}"></ActivityIndicator>
</StackLayout>
```
