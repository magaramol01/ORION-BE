const {Kafka} = require('kafkajs');
const appSettingsModel = require('../api/models/appSettingsModel');
const kafkaConfig = appSettingsModel.getAppSettingsJsonData().kafkaConfig;
const {clientId, brokers} = kafkaConfig;
const {Util} = require("../api/utils/util");
const {getShipMappingNameById} = require("../../src/api/models/shipModel");
const kafka = new Kafka({clientId, brokers});
const producer = kafka.producer();
const dateFormat = require('dateformat');

(async () => {
    try {
        await producer.connect()
    } catch (e) {
        console.error(`[Kafka Connection Error] ${e.message}`, e)
    }
})();

const sendMessageToTopic = async (messages,topic) => {
    producer
        .send({
            topic: topic,
            messages,
        })
        .then((message) => console.error(`[kafka message send to topic : ${topic}] ${message}`))
        .catch(e => console.error(`[kafka] ${e.message}`, e));
    // producer.disconnect();
};

const processAndSendDataOnKafka = function (vesselId, vesselName, vesselData) {
    const topicDate = Util.getNewDate();
    const allTopics = appSettingsModel.getAppSettingsJsonData().TopicsName;
    const topicName = allTopics[vesselId];

    for (let vesselDataItem in vesselData) {
        const packet = {...vesselData[vesselDataItem]};
        packet["vesselId"] = vesselId.toString();
        packet["vesselName"] = vesselName;
        packet["DmxDiRtTimestamp_Internal"] = dateFormat(topicDate, "yyyy-mm-dd HH:MM:ss");
        packet["Timestamp"] = dateFormat(packet.Timestamp, "yyyy-mm-dd HH:MM:ss");

        sendMessageToTopic([{value: JSON.stringify(packet)}],topicName);
        sendMessageToTopic([{value: JSON.stringify(packet)}],'allvessel');
    }
};

module.exports = {
    sendMessageToTopic,
    processAndSendDataOnKafka
};
