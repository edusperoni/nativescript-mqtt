import { MQTTClient, Message } from "nativescript-mqtt";

function generateClient() {
    return new MQTTClient({
        clientId: "test",
        host: "broker.mqttdashboard.com",
        path: "/mqtt",
        port: 8000
    });
}

describe("connect function", function() {
    let mqttClient: MQTTClient;

    it("exists", function() {
        expect(mqttClient.connect).toBeDefined();
    });

    beforeEach(() => {
        mqttClient = generateClient();
    });
    afterEach(() => {
        mqttClient.onConnectionSuccess.off();
        mqttClient.onConnectionFailure.off();
        mqttClient.onConnectionLost.off();
        mqttClient.onMessageArrived.off();
        mqttClient.disconnect();
        mqttClient = null;
    });

    it("should connect", function(done) {
        const success = () => {
            expect(mqttClient.connected).toEqual(true);
            done();
        };
        const fail = (e) => {
            done.fail(e);
        };
        mqttClient.onConnectionSuccess.on(success);
        mqttClient.onConnectionFailure.on(fail);
        mqttClient.onConnectionLost.on(fail);
        expect(mqttClient.connected).toEqual(false);
        mqttClient.connect();
    }, 5000);

    it("should not throw", function(done) {
        let finished = false;
        const attempts = 10;
        const tout = 50;
        for (let i = 0; i < attempts; i++) {
            setTimeout(() => {
                try {
                    mqttClient.connect();
                } catch (e) {
                    if (!finished)
                        done.fail(e);
                    finished = true;
                }
            }, i * tout);
        }
        setTimeout(() => {
            if (!finished)
                done();
            finished = true;
        }, attempts * tout);
    }, 5000);
});


describe("mqtt messaging", function() {
    let mqttClient: MQTTClient;
    beforeEach((done) => {
        mqttClient = generateClient();
        const success = () => {
            done();
        };
        const fail = (e: any) => {
            done.fail(e);
            mqttClient.onConnectionSuccess.off();
            mqttClient.onConnectionFailure.off();
            mqttClient.onConnectionLost.off();
            mqttClient.onMessageArrived.off();
        };
        mqttClient.onConnectionSuccess.on(success);
        mqttClient.onConnectionFailure.on(fail);
        mqttClient.onConnectionLost.on(fail);
        mqttClient.connect();
    });
    afterEach(() => {
        mqttClient.onConnectionSuccess.off();
        mqttClient.onConnectionFailure.off();
        mqttClient.onConnectionLost.off();
        mqttClient.onMessageArrived.off();
        mqttClient.disconnect();
        mqttClient = null;
    });
    it("should send message", function(done) {
        const message: Message = new Message("message");
        message.destinationName = "test";
        message.retained = false;
        message.qos = 0;
        mqttClient.onMessageDelivered.on((m) => {
            done();
        });
        mqttClient.publish(message);
    }, 5000);

    it("should subscribe and receive message", function(done) {
        mqttClient.onMessageArrived.on((m) => {
            expect(m.destinationName).toEqual("test");
            done();
        });
        mqttClient.subscribe("test");
        const message: Message = new Message("message");
        message.destinationName = "test";
        message.retained = false;
        message.qos = 0;
        mqttClient.publish(message);
    }, 5000);

});