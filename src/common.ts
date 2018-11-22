interface IEvent<T> {
    on(handler: { (data?: T): void }): void;
    off(handler: { (data?: T): void }): void;
}

class EventHandler<T> implements IEvent<T> {
    private handlers: { (data?: T): void; }[] = [];

    public on(handler: { (data?: T): void }) {
        this.handlers.push(handler);
    }

    public off(handler: { (data?: T): void }) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public trigger(data?: T) {
        this.handlers.slice(0).forEach(h => h(data));
    }
}

class Message {
    public payload: string;
    public bytes: ArrayBuffer;
    public topic: string;
    public qos: number;
    public retained: boolean;
    constructor(
        mqttMessage: {
            payloadString?: string,
            payloadBytes?: ArrayBuffer,
            destinationName?: string,
            qos?: number,
            retained?: boolean;
        }
    ) {
        this.payload = mqttMessage.payloadString || '';
        this.bytes = mqttMessage.payloadBytes || null;
        this.topic = mqttMessage.destinationName || '';
        this.qos = mqttMessage.qos || 0;
        this.retained = mqttMessage.retained || false;
    }
}

let guid = () => {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

export { IEvent, EventHandler, guid, Message };
