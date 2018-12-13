import { IEvent, EventHandler, guid, Message } from './common';
export { IEvent, EventHandler, guid, Message };
let MQTT = require('./paho-mqtt');

interface ClientOptions {
    host?: string;
    port?: number;
    useSSL?: boolean;
    path?: string;
    clientId?: string;
    retryOnDisconnect?: boolean;
}

class MQTTClient {
    private mqttClient;
    private host: string;
    private port: number;
    private path: string;
    private useSSL: boolean;
    public clientId: string;
    public connected: boolean;
    private retryOnDisconnect: boolean;
    private connectionSuccess = new EventHandler<void>();
    private connectionFailure = new EventHandler<string>();
    private connectionLost = new EventHandler<string>();
    private messageArrived = new EventHandler<Message>();
    private messageDelivered = new EventHandler<Message>();

    constructor(options: ClientOptions) {
        /* options
          host: string
          port: int - default 80 | useSSL 443
          path: string - default empty
          useSSL: bool - default false
          clientId: string - default UUID
          retryOnDisconnect: bool - default false
        */
        this.connected = false;
        this.host = options.host || 'localhost';
        this.useSSL = options.useSSL || false;
        if (options.port) this.port = options.port;
        else this.port = this.useSSL ? 443 : 80;
        this.path = options.path || '';
        this.clientId = options.clientId || guid();
        this.retryOnDisconnect = options.retryOnDisconnect || false;


        this.mqttClient = new MQTT.Client(this.host, this.port, this.path, this.clientId);
        this.mqttClient.useSSL = this.useSSL;

    }

    // events for the MQTT Client
    public get onConnectionSuccess(): IEvent<void> { return this.connectionSuccess; }
    public get onConnectionFailure(): IEvent<string> { return this.connectionFailure; }
    public get onConnectionLost(): IEvent<string> { return this.connectionLost; }
    public get onMessageArrived(): IEvent<Message> { return this.messageArrived; }
    public get onMessageDelivered(): IEvent<Message> { return this.messageDelivered; }

    public connect(username, password) {
        if (this.connected) {
            return;
        }

        let connectOptions = {
            userName: username,
            password: password,
            useSSL: this.useSSL,
            onSuccess: () => {
                this.connected = true;
                this.connectionSuccess.trigger();
            },
            onFailure: (err: any) => {
                this.connected = false;
                this.connectionFailure.trigger(err.errorMessage);
            }
        };

        this.mqttClient.onConnectionLost = (err) => {
            this.connected = false;
            this.connectionLost.trigger(err.errorMessage);
        };

        this.mqttClient.onMessageArrived = (message: any) => {
            this.messageArrived.trigger(new Message(message));
        };

        this.mqttClient.onMessageDelivered = (message: any) => {
            this.messageDelivered.trigger(new Message(message));
        };

        this.connected = true; // as of the latest version, it considers having a socket as connected
        this.mqttClient.connect(connectOptions);
    }

    public disconnect() {
        if (this.connected) {
            this.mqttClient.disconnect();
        }
    }

    public subscribe(topic: string) {
        this.mqttClient.subscribe(topic);
    }

    public unsubscribe(topic: string) {
        this.mqttClient.unsubscribe(topic);
    }

    public publish(message: Message) {
        const mqttMessage = message.bytes !== null ?
            new MQTT.Message(message.bytes) : new MQTT.Message(message.payload);
        mqttMessage.destinationName = message.topic;
        mqttMessage.retained = message.retained;
        mqttMessage.qos = message.qos;

        this.mqttClient.send(mqttMessage);
    }

}

export { MQTTClient, ClientOptions };
