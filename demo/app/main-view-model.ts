import { Message, MQTTClient, OnConnectedParams, ConnectionOptions, ConnectionState } from 'nativescript-mqtt';
import { Observable, PropertyChangeData } from 'tns-core-modules/data/observable';
import { Qos } from '../../src/mqtt';


function isInt(v: string) {
  return !isNaN(+v) && +v === Math.floor(+v);
}
export class HelloWorldModel extends Observable {
  tfText = "ws://broker.mqttdashboard.com:8000/mqtt";
  host = "broker.mqttdashboard.com";
  port = "8000";
  path = "/mqtt";
  clientId = "";

  user = "";
  pass = "";
  keepalive = "";
  timeout = "";

  useSSL = false;
  cleanSession = true;
  autoReconnect = false;

  paramsVisible = "visible";
  connectVisible = "collapse";

  lockMessage = "";

  logView = "";

  qosItems = ["0", "1", "2"];
  subQos: Qos = 0;
  pubQos: Qos = 0;

  subTopic = "";
  pubTopic = "";
  pubMessage = "";
  subMessage = "";

  pubRetained = false;

  get wsUri() {
    return `${this.useSSL ? 'wss://' : 'ws://'}${this.host}:${this.port}${this.path}`;
  }
  public message: string;
  private mqttClient: MQTTClient;
  private connectionTime = 0;

  constructor() {
    super();
  }

  validateConstructor() {
    return this.host && isInt(this.port) && isInt(this.keepalive) && isInt(this.timeout);
  }

  generateClient() {
    this.disposeClient();
    this.mqttClient = new MQTTClient({
      clientId: this.clientId ? this.clientId : undefined,
      host: this.host,
      path: this.path,
      port: +this.port
    });

    this.mqttClient.onMessageDelivered.on((message) => {
      const msgObj = {
        destinationName: message.destinationName,
        payloadString: message.payloadString,
        duplicate: message.duplicate,
        retained: message.retained,
        qos: message.qos
      };
      this.logMessage("onMessageDelivered: " + JSON.stringify(msgObj));
    });

    this.mqttClient.onSubscribeSuccess.on((v) => {
      this.logMessage("onSubscribeSuccess: " + JSON.stringify(v));
    });

    this.mqttClient.onSubscribeFailure.on((v) => {
      this.logMessage("onSubscribeFailure: " + JSON.stringify(v));
    });

    this.mqttClient.onUnsubscribeSuccess.on(() => {
      this.logMessage("onUnsubscribeSuccess");
    });

    this.mqttClient.onUnsubscribeFailure.on((v) => {
      this.logMessage("onUnsubscribeFailure: " + JSON.stringify(v));
    });

    this.mqttClient.onConnected.on((v: OnConnectedParams) => {
      this.connectionTime = Date.now();
      this.logMessage("onConnected: " + JSON.stringify(v));
    });
    this.mqttClient.onConnectionSuccess.on(() => {
      this.logMessage("onConnectionSuccess");
    });

    this.mqttClient.onConnectionFailure.on((err) => {
      this.logMessage("onConnectionFailure: " + JSON.stringify(err));
    });

    this.mqttClient.onConnectionLost.on((err) => {
      const timeConnected = Date.now() - this.connectionTime;
      const minutes = Math.floor(timeConnected / 1000 / 60);
      const seconds = timeConnected / 1000 - minutes * 60;
      this.logMessage("onConnectionLost: " + JSON.stringify(err));
      console.log(`Time connected: ${minutes}m ${seconds}s`);
    });

    this.mqttClient.onMessageArrived.on((message: Message) => {
      const msgObj = {
        destinationName: message.destinationName,
        payloadString: message.payloadString,
        duplicate: message.duplicate,
        retained: message.retained,
        qos: message.qos
      };
      this.logMessage(`onMessageArrived: ` + JSON.stringify(msgObj));
    });
  }

  disposeClient() {
    if (this.mqttClient) {
      this.mqttClient.onConnected.off();
      this.mqttClient.onConnectionSuccess.off();
      this.mqttClient.onConnectionFailure.off();
      this.mqttClient.onConnectionLost.off();
      this.mqttClient.onMessageArrived.off();
      this.mqttClient.onMessageDelivered.off();
      this.mqttClient.onSubscribeFailure.off();
      this.mqttClient.onSubscribeSuccess.off();
      this.mqttClient.onUnsubscribeFailure.off();
      this.mqttClient.onUnsubscribeSuccess.off();
      this.mqttClient.disconnect();
      this.mqttClient = null;
    }
    this.set("logView", "");
  }

  connect() {
    this.generateClient();
    this.reconnect();
  }

  reconnect() {

    if (this.mqttClient.connectionState !== ConnectionState.DISCONNECTED) {
      this.logMessage(`Disconnecting`);
      this.mqttClient.disconnect();
    }
    this.logMessage(`Connecting to ${this.wsUri}`);
    const connOptions: ConnectionOptions = {
      cleanSession: this.cleanSession,
      reconnect: this.autoReconnect,
      useSSL: this.useSSL
    };
    if (this.keepalive) {
      connOptions.keepAliveInterval = +this.keepalive;
    }

    this.mqttClient.connect(connOptions);
  }

  subscribe() {
    if (this.subTopic) {
      const topic = this.subTopic;
      this.mqttClient.subscribe(topic, { qos: this.subQos }).then(
        (v) => this.logMessage(`(Promise) Subscribed to ${topic} ${JSON.stringify(v)}`),
        (e) => this.logMessage(`(Promise) Error subscribing to ${topic} ${JSON.stringify(e)}`)
      );
    }
  }

  unsubscribe() {
    if (this.subTopic) {
      const topic = this.subTopic;
      this.mqttClient.unsubscribe(topic).then(
        () => this.logMessage(`(Promise) Unsubscribed to ${topic}`),
        (e) => this.logMessage(`(Promise) Error unsubscribing to ${topic} ${JSON.stringify(e)}`)
      );
    }
  }
  sendMessage() {
    if (this.pubTopic) {
      const m = new Message(this.pubMessage);
      m.destinationName = this.pubTopic;
      m.qos = this.pubQos;
      m.retained = this.pubRetained;
      this.mqttClient.publish(m);
    }
  }

  private logMessage(m: string) {
    console.log(m);
    this.set("message", m);
    this.set("logView", this.logView + (this.logView ? "\n" : "") + '>' + m);
  }
}
