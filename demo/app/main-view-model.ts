import { Message, MQTTClient, OnConnectedParams } from 'nativescript-mqtt';
import { Observable } from 'tns-core-modules/data/observable';

export class HelloWorldModel extends Observable {
  public message: string;
  private mqttClient: MQTTClient;

  constructor() {
    super();

    this.mqttClient = new MQTTClient({
      clientId: "test",
      host: "broker.mqttdashboard.com",
      path: "/mqtt",
      port: 8000
    });

    this.mqttClient.onConnected.on((v: OnConnectedParams) => {
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
