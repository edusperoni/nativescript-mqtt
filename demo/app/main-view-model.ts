import { Message, MQTTClient } from 'nativescript-mqtt';
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
      useSSL: false,
      port: 8000
    });

    this.mqttClient.onConnectionSuccess.on(() => {
      console.log("Mqtt connected");
      this.set("message", "connected");
      this.mqttClient.subscribe("testtopic/1");
    });

    this.mqttClient.onConnectionFailure.on((err) => {
      console.log("Mqtt connection failure: " + err);
      this.set("message", "Mqtt connection failure: " + err);
    });

    this.mqttClient.onConnectionLost.on((err) => {
      console.log("Mqtt connection lost: " + err);
      this.set("message", "Mqtt connection lost: " + err);
    });

    this.mqttClient.onMessageArrived.on((message: Message) => {
      console.log(`Message received. Topic: ${message.topic}. Payload: ${message.payload}`);
      this.set("message", `Message received. Topic: ${message.topic}. Payload: ${message.payload}`);
    });

    this.set("message", "connecting");

    this.mqttClient.connect("", "");
  }
}
