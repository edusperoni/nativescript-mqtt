var MqttNew = require("nativescript-mqtt-new").MqttNew;
var mqttNew = new MqttNew();

describe("greet function", function() {
    it("exists", function() {
        expect(mqttNew.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(mqttNew.greet()).toEqual("Hello, NS");
    });
});