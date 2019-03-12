import { Message, MQTTClient, OnConnectedParams } from 'nativescript-mqtt';
import { Observable } from 'tns-core-modules/data/observable';

export class HelloWorldModel extends Observable {
  public message: string;
  private mqttClient: MQTTClient;
  private connectionTime = 0;

  constructor() {
    super();

    this.mqttClient = new MQTTClient({
      clientId: "test",
      host: "broker.mqttdashboard.com",
      path: "/mqtt",
      port: 8000
    });

    this.mqttClient.onConnected.on((v: OnConnectedParams) => {
      this.connectionTime = Date.now();
      console.log("Mqtt connection stablished " + JSON.stringify(v));
    });
    this.mqttClient.onConnectionSuccess.on(() => {
      console.log("Mqtt connected");
      this.set("message", "connected");
      this.mqttClient.subscribe("testtopic/1");
    });

    this.mqttClient.onConnectionFailure.on((err) => {
      console.log("Mqtt connection failure: " + JSON.stringify(err));
      this.set("message", "Mqtt connection failure: " + JSON.stringify(err));
    });

    this.mqttClient.onConnectionLost.on((err) => {
      console.log("Mqtt connection lost: " + JSON.stringify(err));
      const timeConnected = Date.now() - this.connectionTime;
      const minutes = Math.floor(timeConnected / 1000 / 60);
      const seconds = timeConnected / 1000 - minutes * 60;
      console.log(`Time connected: ${minutes}m ${seconds}s`);
      this.set("message", "Mqtt connection lost: " + JSON.stringify(err));
    });

    this.mqttClient.onMessageArrived.on((message: Message) => {
      console.log(`Message received. Topic: ${message.destinationName}. Payload: ${message.payloadString}`);
      this.set("message", `Message received. Topic: ${message.destinationName}. Payload: ${message.payloadString}`);
    });

    this.connect();
  }

  connect() {

    this.set("message", "connecting");

    if (this.mqttClient.connected) {
      this.mqttClient.disconnect();
    }

    this.mqttClient.connect();
  }
}
