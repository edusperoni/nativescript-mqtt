import { Qos, Message } from './paho-mqtt';
interface IEvent<T> {
    on(handler: { (data?: T): void }): void;
    off(handler?: { (data?: T): void }): void;
}

class EventHandler<T> implements IEvent<T> {
    private handlers: { (data?: T): void; }[] = [];

    public on(handler: { (data?: T): void }) {
        this.handlers.push(handler);
    }

    public off(handler?: { (data?: T): void }) {
        this.handlers = handler ? this.handlers.filter(h => h !== handler) : [];
    }

    public trigger(data?: T) {
        this.handlers.slice(0).forEach(h => h(data));
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
