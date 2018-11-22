import { Observable } from 'tns-core-modules/data/observable';
import { MqttNew } from 'nativescript-mqtt-new';

export class HelloWorldModel extends Observable {
  public message: string;
  private mqttNew: MqttNew;

  constructor() {
    super();

    this.mqttNew = new MqttNew();
    this.message = this.mqttNew.message;
  }
}
