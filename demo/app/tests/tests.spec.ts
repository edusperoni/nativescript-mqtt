import { ConnectionState, Message, MQTTClient, OnConnectedParams } from "nativescript-mqtt";
/// <reference path="./custom-matchers.d.ts" />

function generateClient() {
    return new MQTTClient({
        host: "broker.mqttdashboard.com",
        path: "/mqtt",
        port: 8000
    });
}

function generateBadClient() {
    return new MQTTClient({
        host: "127.0.0.1",
        path: "/mqtt",
        port: 8000
    });
}

function clearEvents(mqttClient: MQTTClient) {
    mqttClient.onConnected.off();
    mqttClient.onConnectionFailure.off();
    mqttClient.onConnectionLost.off();
    mqttClient.onConnectionSuccess.off();
    mqttClient.onMessageArrived.off();
    mqttClient.onMessageDelivered.off();
    mqttClient.onSubscribeFailure.off();
    mqttClient.onSubscribeSuccess.off();
    mqttClient.onUnsubscribeFailure.off();
    mqttClient.onUnsubscribeSuccess.off();
}

beforeAll(() => {
    jasmine.addMatchers({
        toBeMQTTErrror: function() {
            return {
                compare: function(actual: any) {
                    const ret = Object(actual) === actual && "errorCode" in actual && "errorMessage" in actual;
                    return {
                        pass: ret,
                        message: `Actual is ${ret ? '' : 'not'} of type MQTTError`
                    };
                }
            };
        }
    });
});

describe("connect function", function() {
    let mqttClient: MQTTClient;

    afterEach(() => {
        if (mqttClient) {
            clearEvents(mqttClient);
            mqttClient.disconnect();
            mqttClient = null;
        }
    });

    it("exists", function() {
        mqttClient = generateClient();
        expect(mqttClient.connect).toBeDefined();
    });

    describe("success", function() {
        beforeEach(() => {
            mqttClient = generateClient();
        });

        it("should connect", function(done) {
            let successFunCalled = false;
            let onconnectedCalled = false;
            let expectConnected = () => {
                expect(mqttClient.connected).toEqual(true);
                expect(mqttClient.connectionState).toEqual(ConnectionState.CONNECTED);
                if (successFunCalled && onconnectedCalled) {
                    done();
                }
            };
            const success = () => {
                expect(successFunCalled).toBe(false);
                successFunCalled = true;
                expectConnected();
            };
            const onconnected = (v: OnConnectedParams) => {
                expect(onconnectedCalled).toBe(false);
                onconnectedCalled = true;
                expect(v.reconnect).toBe(false);
                expectConnected();
            };
            const fail = (e) => {
                done.fail(e);
            };
            mqttClient.onConnected.on(onconnected);
            mqttClient.onConnectionSuccess.on(success);
            mqttClient.onConnectionFailure.on(fail);
            mqttClient.onConnectionLost.on(fail);
            expect(mqttClient.connected).toEqual(false);
            expect(mqttClient.connectionState).toEqual(ConnectionState.DISCONNECTED);
            mqttClient.connect();
            expect(mqttClient.connectionState).toEqual(ConnectionState.CONNECTING);
        }, 5000);

        it("should resolve", function(done) {
            mqttClient.connect().then(() => done(), (err) => done.fail(err));
        }, 5000);

        it("should disconnect", function(done) {
            mqttClient.onConnectionLost.on((e) => {
                expect(e.errorCode).toBe(0);
                done();
            });
            mqttClient.connect().then(() => mqttClient.disconnect(), (e) => done.fail(e));
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

    describe("fail", function() {
        beforeEach(() => {
            mqttClient = generateBadClient();
        });

        it("should not connect", function(done) {
            const success = () => {
                done.fail();
            };
            const onconnected = (v: OnConnectedParams) => {
                done.fail();
            };
            const fail = (e) => {
                expect(mqttClient.connected).toEqual(false);
                expect(mqttClient.connectionState).toEqual(ConnectionState.DISCONNECTED);
                expect(e).toBeMQTTErrror();
                done();
            };
            mqttClient.onConnected.on(onconnected);
            mqttClient.onConnectionSuccess.on(success);
            mqttClient.onConnectionFailure.on(fail);
            mqttClient.onConnectionLost.on(fail);
            expect(mqttClient.connected).toEqual(false);
            expect(mqttClient.connectionState).toEqual(ConnectionState.DISCONNECTED);
            mqttClient.connect();
            expect(mqttClient.connectionState).toEqual(ConnectionState.CONNECTING);
        }, 5000);

        it("should not resolve", function(done) {
            mqttClient.connect().then(() => done.fail(), (err) => {
                expect(err).toBeMQTTErrror();
                done();
            });
        }, 5000);

    });


});


describe("mqtt messaging", function() {
    let mqttClient: MQTTClient;
    const testSubject = "nativescript-mqtt";
    beforeAll((done) => {
        mqttClient = generateClient();
        const success = () => {
            done();
        };
        const fail = (e: any) => {
            done.fail(e);
            clearEvents(mqttClient);
        };
        mqttClient.onConnectionSuccess.on(success);
        mqttClient.onConnectionFailure.on(fail);
        mqttClient.onConnectionLost.on(fail);
        mqttClient.connect();
    });
    afterEach(() => {
        clearEvents(mqttClient);
    });
    afterAll(() => {
        mqttClient.disconnect();
        mqttClient = null;
    });
    it("should send message", function(done) {
        const message: Message = new Message("message");
        message.destinationName = testSubject;
        message.retained = false;
        message.qos = 0;
        mqttClient.onMessageDelivered.on((m) => {
            done();
        });
        mqttClient.publish(message);
    }, 5000);

    it("should subscribe", function(done) {
        mqttClient.subscribe(testSubject, { qos: 1 }).then((v) => {
            expect(v.grantedQos).toEqual(1);
            done();
        }, (e) => done.fail(e));
    }, 5000);

    it("should receive message", function(done) {
        const messageContent = "nativescript test " + Math.floor(Math.random() * 1000);
        let sent = false;
        mqttClient.onMessageArrived.on((m) => {
            if (sent) {
                expect(m.destinationName).toEqual(testSubject);
                expect(m.payloadString).toEqual(messageContent);
                done();
            }
        });
        mqttClient.subscribe(testSubject).then((v) => {
            const message: Message = new Message(messageContent);
            message.destinationName = testSubject;
            message.retained = false;
            message.qos = 0;
            sent = true;
            mqttClient.publish(message);
        }, (e) => done.fail(e));
    }, 5000);

    it("should unsubscribe", function(done) {
        mqttClient.subscribe(testSubject).then(() => mqttClient.unsubscribe(testSubject)).then(() => done(), (e) => done.fail(e));
    });

});