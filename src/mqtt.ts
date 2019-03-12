import { IEvent, EventHandler, guid, Message } from './common';
export { IEvent, EventHandler, guid, Message };
import * as MQTT from './paho-mqtt';

export type MQTTError = MQTT.MQTTError;

/**
 * Attributes used with a connection.
 */
export interface ConnectionOptions {
    /**
     * If the connect has not succeeded within this number of seconds, it is deemed to have failed.
     * @default The default is 30 seconds.
     */
    timeout?: number;
    /** Authentication username for this connection. */
    userName?: string;
    /** Authentication password for this connection. */
    password?: string;
    /** Sent by the server when the client disconnects abnormally. */
    willMessage?: Message;
    /**
     * The server disconnects this client if there is no activity for this number of seconds.
     * @default The default value of 60 seconds is assumed if not set.
     */
    keepAliveInterval?: number;
    /**
     * If true(default) the client and server persistent state is deleted on successful connect.
     * @default true
     */
    cleanSession?: boolean;
    /** If present and true, use an SSL Websocket connection. */
    useSSL?: boolean;
    /** Passed to the onSuccess callback or onFailure callback. */
    invocationContext?: any;
    /**
     * Specifies the mqtt version to use when connecting
     * <dl>
     *     <dt>3 - MQTT 3.1</dt>
     *     <dt>4 - MQTT 3.1.1 (default)</dt>
     * </dl>
     * @default 4
     */
    mqttVersion?: 3 | 4;
    /**
     * If set to true, will force the connection to use the selected MQTT Version or will fail to connect.
     */
    mqttVersionExplicit?: boolean;
    /**
     * Sets whether the client will automatically attempt to reconnect to the server if the connection is lost.
     * <dl>
     *     <dt>If set to false, the client will not attempt to automatically reconnect to the server in
     *         the event that the connection is lost.</dt>
     *     <dt>If set to true, in the event that the connection is lost, the client will attempt to
     *         reconnect to the server. It will initially wait 1 second before it attempts to reconnect,
     *         for every failed reconnect attempt, the delay will double until it is at 2 minutes at which
     *         point the delay will stay at 2 minutes.</dt>
     * </dl>
     * @default false
     */
    reconnect?: boolean;
    /**
     * If present this contains either a set of hostnames or fully qualified
     * WebSocket URIs (ws://example.com:1883/mqtt), that are tried in order in place of the host and port
     * paramater on the construtor. The hosts are tried one at at time in order until one of then succeeds.
     */
    hosts?: string[];
    /**
     * If present the set of ports matching the hosts. If hosts contains URIs, this property is not used.
     */
    ports?: number[];
}

export interface ClientOptions {
    host?: string;
    port?: number;
    path?: string;
    clientId?: string;
}

export interface OnConnectedParams {
    reconnect: boolean;
    uri: string;
}

export interface SubscribeOptions {
    qos?: MQTT.Qos;
    timeout?: number;
}

export interface UnsubscribeOptions {
    timeout?: number;
}
type DeferedPromise<T> = {
    promise: Promise<T>;
    resolve: (value?: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};

export enum ConnectionState {
    CONNECTED,
    CONNECTING,
    DISCONNECTED
}

export class MQTTClient {
    private mqttClient: MQTT.Client;
    private host: string;
    private port: number;
    private path: string;
    public clientId: string;
    public get connected() {
        return this.mqttClient.isConnected();
    }
    private _connectionState: ConnectionState = ConnectionState.DISCONNECTED;
    public get connectionState(): ConnectionState { return this._connectionState; }
    private connectionSuccess = new EventHandler<void>();
    private mqttConnected = new EventHandler<OnConnectedParams>();
    private connectionFailure = new EventHandler<MQTTError>();
    private connectionLost = new EventHandler<MQTTError>();
    private messageArrived = new EventHandler<Message>();
    private messageDelivered = new EventHandler<Message>();

    constructor(options: ClientOptions) {
        this._connectionState = ConnectionState.DISCONNECTED;
        this.host = options.host || 'localhost';
        this.port = options.port;
        this.path = options.path || '';
        this.clientId = options.clientId || guid();


        this.mqttClient = new MQTT.Client(this.host, this.port, this.path, this.clientId);

    }

    // events for the MQTT Client
    public get onConnectionSuccess(): IEvent<void> { return this.connectionSuccess; }
    public get onConnected(): IEvent<OnConnectedParams> { return this.mqttConnected; }
    public get onConnectionFailure(): IEvent<MQTTError> { return this.connectionFailure; }
    public get onConnectionLost(): IEvent<MQTTError> { return this.connectionLost; }
    public get onMessageArrived(): IEvent<Message> { return this.messageArrived; }
    public get onMessageDelivered(): IEvent<Message> { return this.messageDelivered; }

    public connect(connectOptions?: ConnectionOptions): Promise<void> {
        if (this._connectionState === ConnectionState.CONNECTED || this._connectionState === ConnectionState.CONNECTING) {
            return Promise.reject("Already connected");
        }

        const deferred = this.defer<void>();
        let mqttConnectOptions: MQTT.ConnectionOptions = {
            ...connectOptions,
            onSuccess: () => {
                this._connectionState = ConnectionState.CONNECTED;
                deferred.resolve();
                this.connectionSuccess.trigger();
            },
            onFailure: (err: MQTT.MQTTError) => {
                this._connectionState = ConnectionState.DISCONNECTED;
                deferred.reject(err);
                this.connectionFailure.trigger(err);
            }
        };

        this.mqttClient.onConnectionLost = (err) => {
            this._connectionState = ConnectionState.DISCONNECTED;
            this.connectionLost.trigger(err);
        };

        this.mqttClient.onMessageArrived = (message: Message) => {
            this.messageArrived.trigger(message);
        };

        this.mqttClient.onMessageDelivered = (message: Message) => {
            this.messageDelivered.trigger(message);
        };

        this.mqttClient.onConnected = (reconnect, URI) => {
            this.mqttConnected.trigger({ reconnect, uri: URI });
        };

        this._connectionState = ConnectionState.CONNECTING;
        this.mqttClient.connect(mqttConnectOptions);

        return deferred.promise;
    }

    public disconnect() {
        if (this.connectionState === ConnectionState.DISCONNECTED) {
            return;
        }
        return this.mqttClient.disconnect();
    }

    public subscribe(topic: string, subscribeOpts?: SubscribeOptions) {
        const deferred = this.defer<{ grantedQos: MQTT.Qos }>();
        const mqttSubscribeOpts: MQTT.SubscribeOptions = {
            ...subscribeOpts,
            onSuccess: (o: MQTT.OnSubscribeSuccessParams) => {
                let grantedQos: any = o.grantedQos;
                if (!isNaN(Number(grantedQos))) { // for some reason it returns Uint8Array like: [0]
                    grantedQos = Number(grantedQos);
                } else {
                    console.log("WARNING: MQTTClient cannot determine grantedQos, received " + (typeof o.grantedQos));
                }
                deferred.resolve({ grantedQos });
            },
            onFailure: (err: MQTT.MQTTError) => {
                deferred.reject(err);
            }
        };
        this.mqttClient.subscribe(topic, mqttSubscribeOpts);
        return deferred.promise;
    }

    public unsubscribe(topic: string, opts?: UnsubscribeOptions) {
        const deferred = this.defer<void>();
        this.mqttClient.unsubscribe(topic, {
            ...opts,
            onSuccess: () => {
                deferred.resolve();
            },
            onFailure: (e: MQTT.MQTTError) => {
                deferred.reject(e);
            }
        });
        return deferred.promise;
    }

    public publish(message: Message) {
        this.mqttClient.send(message);
    }

    public setTraceFunction(f: MQTT.TraceFunction) {
        this.mqttClient.trace = f;
    }

    public startTrace() {
        this.mqttClient.startTrace();
    }

    public stopTrace() {
        this.mqttClient.stopTrace();
    }

    private defer<T>(): DeferedPromise<T> {
        const deferred: DeferedPromise<T> = {
            promise: undefined,
            reject: undefined,
            resolve: undefined
        };

        deferred.promise = new Promise<T>((resolve, reject) => {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        return deferred;
    }

}
