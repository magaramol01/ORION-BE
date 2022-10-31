"use strict";

const _ = require("lodash");
const dateFormat = require("dateformat");
const { cloneDeep } = require("clone-deep-circular-references");
const FailureAdvisoriesModel = require("../models/failureAdvisoriesModel");
const CausesModel = require("../models/causesModel");
const RuleBlocksModel = require("../models/ruleBlocksModel");
const RuleConfigsModel = require("../models/ruleConfigsModel");
const TriggerOutcomesTodayModel = require("../models/triggeredOutcomesTodayModel");
const TriggerOutcomesHistoryModel = require("../models/triggeredOutcomesHistoryModel");
const ParametersModel = require("../models/parametersModel");
const ConstantParameterModel = require("../models/constantParameterModel");

const MemoryRuleBlock = require("../models/memoryRuleBlock");
const Tokenizer = require("../validations/Tokenizer");
const { Util } = require("../utils/util");
const { sendMail } = require("../adaptors/mailer");
var asyncTaskProcessor = require("async");
const WebSocketAdaptor = require("../adaptors/webSocketAdaptor");

class ruleExecutionSingletonController {
  constructor() {
    this.parametersLiveData = {};
    this.executedRuleBlockHolder = [];
    this.executedRuleBlockHolderCopy = [];
    this.triggeredOutcomes = {};
    this.scheduledMemoryRuleBlocks = {};
    this.incomingShipName = {};
    this.incomingVesselId = {};
  }

  getParametersLiveData() {
    return this.parametersLiveData;
  }

  setParametersLiveData(parametersLiveData) {
    this.parametersLiveData = parametersLiveData;
  }

  getIncomingShipName() {
    return this.incomingShipName;
  }

  setIncomingShipName(incomingShipName) {
    this.incomingShipName = incomingShipName;
  }

  getIncomingVesselId() {
    return this.incomingVesselId;
  }

  setIncomingVesselId(incomingVesselId) {
    this.incomingVesselId = incomingVesselId;
  }

  setInstVesselId(vesselId) {
    this.instVesselId = vesselId;
  }

  getInstVesselId() {
    return this.instVesselId;
  }

  getExecutedRuleBlockHolder() {
    return this.executedRuleBlockHolder;
  }

  clearExecutedRuleBlockHolder() {
    this.executedRuleBlockHolder = [];
  }

  getTriggeredOutcomes() {
    return this.triggeredOutcomes;
  }

  setScheduledMemoryRuleBlocks(scheduledMemoryRuleBlocks) {
    this.scheduledMemoryRuleBlocks = scheduledMemoryRuleBlocks;
  }

  getScheduledMemoryRuleBlocks() {
    return this.scheduledMemoryRuleBlocks;
  }

  resetTriggeredOutcomes() {
    this.triggeredOutcomes = {};
  }

  updateDataForRuleExecution(
    parametersLiveData,
    incomingDataShipName,
    incomingDataVesselId
  ) {
    this.resetTriggeredOutcomes();
    this.setParametersLiveData(parametersLiveData);
    this.setIncomingShipName(incomingDataShipName);
    this.setIncomingVesselId(incomingDataVesselId);
    this.evaluateExecutedRuleBlocks();
  }

  scheduleRuleBlocksForExecution() {
    const ruleBlocksJsonData = RuleBlocksModel.getRuleBlocksJsonData();
    let scheduledMemoryRuleBlocks = this.getScheduledMemoryRuleBlocks();

    for (let ruleBlockId in ruleBlocksJsonData) {
      if (!ruleBlocksJsonData.hasOwnProperty(ruleBlockId)) {
        continue;
      }
      if (!scheduledMemoryRuleBlocks.hasOwnProperty(ruleBlockId)) {
        scheduledMemoryRuleBlocks[ruleBlockId] = new MemoryRuleBlock(
          ruleBlockId,
          ruleBlocksJsonData[ruleBlockId],
          this
        );
      }
    }
  }

  scheduleRuleBlockForExecution(ruleBlockId, ruleBlockData) {
    let scheduledMemoryRuleBlocks = this.getScheduledMemoryRuleBlocks();
    if (!scheduledMemoryRuleBlocks.hasOwnProperty(ruleBlockId)) {
      scheduledMemoryRuleBlocks[ruleBlockId] = new MemoryRuleBlock(
        ruleBlockId,
        ruleBlockData,
        this
      );
    }
  }

  reScheduleRuleBlockForExecution(ruleBlockId, ruleBlockData) {
    let scheduledMemoryRuleBlocks = this.getScheduledMemoryRuleBlocks();
    if (scheduledMemoryRuleBlocks.hasOwnProperty(ruleBlockId)) {
      let memoryRuleBlock = scheduledMemoryRuleBlocks[ruleBlockId];
      memoryRuleBlock.setRuleBlockData(ruleBlockData[ruleBlockId]);
      memoryRuleBlock.reScheduleRuleBlockExecution();
    }
  }

  async evaluateExecutedRuleBlocks() {
    const failureAdvisories =
      FailureAdvisoriesModel.getFailureAdvisoriesJsonData();
    const failureAdvisoriesReferenceCausesJsonData =
      FailureAdvisoriesModel.getFailureAdvisoriesReferencesCausesJsonData();
    const ruleConfigsJsonData = RuleConfigsModel.getRuleConfigsJsonData();
    const parametersJsonData = ParametersModel.getParametersJsonData();
    const constantParameterJsonData =
      ConstantParameterModel.getConstantParametersJsonData();

    this.executedRuleBlockHolderCopy = cloneDeep(this.executedRuleBlockHolder);
    this.clearExecutedRuleBlockHolder();
    const uniqExecutedRuleBlockHolder = _.uniq(
      await this.executedRuleBlockHolderCopy,
      "ruleBlockId"
    );
    uniqExecutedRuleBlockHolder.forEach(
      async function (memoryRuleBlock) {
        let executedRuleBlockConfiguredOutcomes = [];
        const ruleBlockId = memoryRuleBlock.ruleBlockId;

        const confOutcomes = this.retrieveConfiguredOutcomes(ruleBlockId);
        executedRuleBlockConfiguredOutcomes = _.uniq(confOutcomes);

        for (let outcomeKey in executedRuleBlockConfiguredOutcomes) {
          if (!executedRuleBlockConfiguredOutcomes.hasOwnProperty(outcomeKey)) {
            continue;
          }

          const outcome = executedRuleBlockConfiguredOutcomes[outcomeKey];

          if (
            !this.triggeredOutcomes.hasOwnProperty(outcome) &&
            failureAdvisoriesReferenceCausesJsonData.hasOwnProperty(outcome)
          ) {
            const outcomeFA = _.cloneDeep(
              failureAdvisoriesReferenceCausesJsonData[outcome]
            );

            if (this.getIncomingVesselId() !== outcomeFA.vesselId) {
              continue;
            }
            let executedRuleVesselId = parseInt(outcomeFA.vesselId);
            let executedRuleCompanyName = outcomeFA.companyName;
            let canSendEmail = outcomeFA["sendEmail"];
            console.log("&*&*********************",canSendEmail);
            delete outcomeFA["userId"];
            delete outcomeFA["ShipName"];
            delete outcomeFA["vesselName"];
            delete outcomeFA["vesselId"];
            delete outcomeFA["companyName"];
            delete outcomeFA["sendEmail"];

            for (let faKey in outcomeFA) {
              if (outcomeFA.hasOwnProperty(faKey)) {
                if (!outcomeFA[faKey][0]) {
                  continue;
                }
                const outcomeFACauseExpression = outcomeFA[faKey][0];
                const evaluatedOutcomeInfo = this.evaluateCausesExpression(
                  outcomeFACauseExpression,
                  outcome
                );
                const isOutcomeExpressionTriggered =
                  evaluatedOutcomeInfo.isExpressionTriggered;

                if (isOutcomeExpressionTriggered) {
                  let outcomeObj = {};
                  outcomeObj[faKey] = outcomeFACauseExpression;
                  outcomeObj["failureAdvisory"] = failureAdvisories[faKey];

                  this.triggeredOutcomes[outcome] = {
                    faKey: outcomeObj,
                  };

                  let affectedOutcome;
                  let affectedFailureAdvisory;
                  affectedOutcome = outcome;
                  affectedFailureAdvisory = faKey;
                  let causesArr = {};
                  let parameterId;
                  let RuleId;
                  const triggeredCauses = evaluatedOutcomeInfo.triggeredCauses;

                  for (let causeKey in triggeredCauses) {
                    if (!triggeredCauses.hasOwnProperty(causeKey)) {
                      continue;
                    }
                    let ruleBlockArr = {};
                    const cause = triggeredCauses[causeKey];
                    const triggeredRuleBlocksArr = cause.triggeredRuleBlocks;
                    for (let rbId of triggeredRuleBlocksArr) {
                      let ExecutedRule = {};
                      const memoryRB = this.executedRuleBlockHolderCopy.find(
                        (e) => {
                          return e.ruleBlockId == rbId;
                        }
                      );
                      RuleId = memoryRB.executedRule;
                      ExecutedRule[memoryRB.executedRule] =
                        ruleConfigsJsonData[memoryRB.executedRule].parameterId;
                      parameterId =
                        ruleConfigsJsonData[memoryRB.executedRule].parameterId;
                      ruleBlockArr[rbId] = ExecutedRule;
                    }
                    causesArr[causeKey] = { RuleBlocks: ruleBlockArr };
                  }
                  // store the triggered outcomes affected data in database
                  let data = {};
                  let machineName;
                  let liveParameterValue;

                  data[affectedFailureAdvisory] = { Causes: causesArr };

                  const currentParameter = parametersJsonData[parameterId];
                  machineName = currentParameter.machine;
                  // if (currentParameter == undefined) {
                  //     machineName = constantParameterJsonData[parameterId].machine;
                  // } else {
                  //     machineName = currentParameter.machine;
                  // }
                  if (parameterId == memoryRuleBlock.liveData.parameterId) {
                    liveParameterValue = memoryRuleBlock.liveData.liveValue;
                  }

                  const triggeredOutcomeDateTime = Util.getNewDate();
                  const formattedTriggeredOutcomeDateTime = dateFormat(
                    triggeredOutcomeDateTime,
                    Util.getCommonDateFormat()
                  );
                  const stringifyData = JSON.stringify(data);
                  let companyName = executedRuleCompanyName;
                  if (
                    !!failureAdvisories[affectedFailureAdvisory].companyName
                  ) {
                    companyName =
                      failureAdvisories[affectedFailureAdvisory].companyName;
                  }

                  let outcomesJsonData = {
                    ruleKey: parseInt(RuleId),
                    advisorykey: parseInt(affectedFailureAdvisory),
                    acknowledgeStatus: false,
                    comment: "",
                    observantType: Util.getObservantType(
                      failureAdvisories[affectedFailureAdvisory]
                    ),
                    data: JSON.parse(stringifyData),
                    observantMessage:
                      failureAdvisories[affectedFailureAdvisory].description,
                    machineType: machineName,
                    timestamp: formattedTriggeredOutcomeDateTime,
                    vesselId: executedRuleVesselId,
                    liveValue: liveParameterValue,
                    companyName: companyName,
                    liveValueUnit: currentParameter.unit,
                  };

                  TriggerOutcomesTodayModel.saveTodayHistoryOutcomes(
                    outcomesJsonData
                  );
                  TriggerOutcomesHistoryModel.saveHistoryOutcomes(
                    outcomesJsonData
                  );

                  let webSocketObjForUI = {
                    observantType: outcomesJsonData.observantType,
                    data: outcomesJsonData.data,
                    observantMessage: outcomesJsonData.observantMessage,
                    machineType: outcomesJsonData.machineType,
                    timestamp: outcomesJsonData.timestamp,
                    vesselId: executedRuleVesselId,
                    liveValue: liveParameterValue,
                    liveValueUnit: currentParameter.unit,
                  };

                  //send email here
                  if (outcomesJsonData["observantType"] == "alarm") {
                    let AlarmMessage = outcomesJsonData["observantMessage"];
                    if (RuleId != undefined) {
                      let RuleMessage = "";
                      if (!!ruleConfigsJsonData[RuleId]) {
                        if (ruleConfigsJsonData[RuleId].condition.isRange) {
                          let tempId =
                            ruleConfigsJsonData[RuleId].condition.range;
                          RuleMessage =
                            "Value is not between " +
                            tempId.fromOperator +
                            " " +
                            tempId.from +
                            " and " +
                            tempId.toOperator +
                            " " +
                            tempId.to;
                        }
                        if (
                          ruleConfigsJsonData[RuleId].condition.isSingleValue
                        ) {
                          let tempId =
                            ruleConfigsJsonData[RuleId].condition.singleValue;
                          RuleMessage =
                            "Value is " +
                            tempId.valueOperator +
                            " " +
                            tempId.value;
                        }
                      }
                      AlarmMessage =
                        outcomesJsonData["observantMessage"] +
                        " |  " +
                        ruleConfigsJsonData[RuleId].description +
                        " | " +
                        RuleMessage +
                        " | Received value : " +
                        outcomesJsonData["liveValue"];
                    }
                    
                    await this.sendTriggeredOutcomeEmail(
                      canSendEmail,
                      outcomesJsonData["timestamp"],
                      AlarmMessage,
                      RuleId
                    );
                  }

                  WebSocketAdaptor.emitDataOnSocket(
                    "subscribeToDashboard",
                    { otherData: webSocketObjForUI },
                    executedRuleVesselId
                  );
                  WebSocketAdaptor.emitDataOnSocketGlobal(
                    "subscribeToFleetDashboard",
                    {
                      otherData: {
                        latestAlarm: webSocketObjForUI,
                        vesselId: executedRuleVesselId,
                      },
                    },
                    executedRuleVesselId
                  );
                }
              }
            }
          }
        }
      }.bind(this)
    );
    this.executedRuleBlockHolderCopy = [];
  }

  async sendTriggeredOutcomeEmail(
    canSendEmail,
    timestamp,
    AlarmMessage,
    RuleIdCause
  ) {
    const isEmpty = (obj) => {
      for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          return false;
        }
      }
      return JSON.stringify(obj) === JSON.stringify({});
    };
    let emailSchedularObj = {};
    if (canSendEmail.send) {
      //check if email notification is on for this advisory ReferenceCauses
      //fetch users email to send email
      let usersIds = canSendEmail.users;
      if (usersIds.length) {
        let uids = usersIds.toString();
        let emailResp =
          await FailureAdvisoriesModel.fetchUsersEmailIdForAdvisoryNotification(
            uids
          );
        if (emailResp.status == "success") {
          let emailRespData = emailResp.data;
          if (emailRespData.length) {
            let emailList = [...emailRespData].map((item) => {
              return item.email;
            });
            const subjectInfo = "Smart Ship (C) Alert";
            let dateTime = timestamp;
            const messageText = `Dear User,<br/><br/>
                                    Vessel:${this.getIncomingShipName()}<br/><br/>
                                    Alert Type:Alarm<br/><br/>
                                    Smart Ship &copy; Alert System detected that the following alarm was triggered at ${dateTime}<br/><br/>
                                    Date Time:${dateTime}<br/>
                                    Alarm Message:${AlarmMessage} <br/><br/>
                                    Smart Ship &copy; Alert System<br/><br/>`;
            asyncTaskProcessor.each(
              emailList,
              (to, callback) => {
                if (RuleIdCause != undefined) {
                  const currentTime = Date.now();
                  if (!isEmpty(emailSchedularObj)) {
                    //check is rule already added
                    if (emailSchedularObj[RuleIdCause]) {
                      let ruleUserList = emailSchedularObj[RuleIdCause];
                      let currentUser = ruleUserList.find((item) => {
                        if (item.email == to) {
                          return item;
                        }
                      });
                      if (currentUser) {
                        let { email, time } = currentUser;
                        let time1hr = time + 1000 * 60 * 60;
                        if (currentTime > time1hr) {
                          let currentUserList = ruleUserList.map((item) => {
                            if (item.email == to) {
                              item.time = Date.now();
                            }
                            return item;
                          });
                          emailSchedularObj[RuleIdCause] = currentUserList;
                          //send email here
                          sendMail(
                            email,
                            "dinesh1@grr.la",
                            subjectInfo,
                            messageText,
                            "djh"
                          );
                        } else {
                          console.log(
                            "Email already sent for this rule  wait for 1 hour"
                          );
                        }
                      } else {
                        //user not found add user to current rule array
                        ruleUserList.push({
                          email: to,
                          time: currentTime,
                        });
                        emailSchedularObj[RuleIdCause] = ruleUserList;
                        //send email here
                        sendMail(
                          to,
                          "dinesh1@grr.la",
                          subjectInfo,
                          messageText,
                          "djh"
                        );
                      }
                    } else {
                      emailSchedularObj[RuleIdCause] = [
                        {
                          email: to,
                          time: currentTime,
                        },
                      ];
                      //send email here
                      sendMail(
                        to,
                        "dinesh1@grr.la",
                        subjectInfo,
                        messageText,
                        "djh"
                      );
                    }
                  } else {
                    emailSchedularObj[RuleIdCause] = [
                      {
                        email: to,
                        time: currentTime,
                      },
                    ];
                    //send email here
                    sendMail(
                      to,
                      "dinesh1@grr.la",
                      subjectInfo,
                      messageText,
                      "djh"
                    );
                  }
                } else {
                  console.log("Rule not found can not send email");
                }
              },
              (err) => {
                if (err) {
                  console.log("Sending to all emails failed:" + err);
                }
              }
            );
          } else {
            console.log(emailResp.message);
          }
        } else {
          console.log(emailResp.message);
        }
      }
    } else {
      console.log("Email notification is not set for this alarm");
    }
  }
  reScheduleRuleBlock(ruleBlockId, updatedRuleBlockData) {
    let scheduledMemoryRuleBlocks = this.getScheduledMemoryRuleBlocks();
    if (scheduledMemoryRuleBlocks.hasOwnProperty(ruleBlockId)) {
      const memoryRuleBlock = scheduledMemoryRuleBlocks[ruleBlockId];
      memoryRuleBlock.setRuleBlockData(updatedRuleBlockData[ruleBlockId]);
      memoryRuleBlock.reScheduleRuleBlockExecution();
    }
  }

  removeScheduledRuleBlock(ruleBlockId) {
    let scheduledMemoryRuleBlocks = this.getScheduledMemoryRuleBlocks();
    if (scheduledMemoryRuleBlocks.hasOwnProperty(ruleBlockId)) {
      let memoryRuleBlock = scheduledMemoryRuleBlocks[ruleBlockId];
      memoryRuleBlock.removeInterval();
      memoryRuleBlock = null;
      delete scheduledMemoryRuleBlocks[ruleBlockId];
    }
  }

  retrieveConfiguredOutcomes(ruleBlockId) {
    ruleBlockId = ruleBlockId.toString();
    let executedRuleBlockConfiguredOutcomes = [];
    const causesReferencesRuleConfigJsonData =
      CausesModel.getCausesReferencesRuleConfigJsonData();

    if (ruleBlockId) {
      for (const key in causesReferencesRuleConfigJsonData) {
        if (causesReferencesRuleConfigJsonData.hasOwnProperty(key)) {
          const causesAdvisoryConfigs = causesReferencesRuleConfigJsonData[key];

          for (const conKey in causesAdvisoryConfigs) {
            if (causesAdvisoryConfigs.hasOwnProperty(conKey)) {
              const advisoryRule = causesAdvisoryConfigs[conKey];
              for (const advisoryKey in advisoryRule) {
                if (advisoryRule.hasOwnProperty(advisoryKey)) {
                  let ruleBlocks = advisoryRule[advisoryKey]
                    .replace(/[()]/g, "")
                    .split(/ *(?:[&|]{2}) */g);
                  if (ruleBlocks.includes(ruleBlockId)) {
                    executedRuleBlockConfiguredOutcomes.push(conKey);
                  }
                }
              }
            }
          }
        }
      }
    }

    return executedRuleBlockConfiguredOutcomes;
  }

  getCauseEvaluation(causeId, outcome) {
    const causesReferencesRuleConfigJsonData =
      CausesModel.getCausesReferencesRuleConfigJsonData();

    if (causeId && causesReferencesRuleConfigJsonData.hasOwnProperty(causeId)) {
      const currentCause = causesReferencesRuleConfigJsonData[causeId];

      if (currentCause.hasOwnProperty(outcome)) {
        const advisoryRule = currentCause[outcome];
        for (const advisoryKey in advisoryRule) {
          if (advisoryRule.hasOwnProperty(advisoryKey)) {
            const ruleBlockExpression = advisoryRule[advisoryKey];
            return this.evaluateRuleBlockExpression(ruleBlockExpression);
          }
        }
      }
    }
  }

  // this method will throw true or false value
  // whether this rule chain executed all conditions or not...
  // ruleChainExpression array will hold like = '(RB1 && RB2) || RB3 || (RB4 || RB5)';
  evaluateCausesExpression(causesExpression, outcome) {
    let triggeredCauses = {};
    let finalExpressionToBeEvaluated = [];

    const expressionsTokenArray = new Tokenizer().tokenize(causesExpression);

    for (let i in expressionsTokenArray) {
      const expressionsToken = expressionsTokenArray[i];
      const expressionsTokenType = expressionsToken.type;
      const expressionsTokenValue = expressionsToken.value;

      if (
        expressionsToken &&
        expressionsTokenType !== "EOL" &&
        expressionsTokenType !== "EOF"
      ) {
        if (expressionsTokenType === "STR_NUM") {
          const evaluatedCauseInfo = this.getCauseEvaluation(
            expressionsTokenValue,
            outcome
          );
          if (evaluatedCauseInfo.isExpressionTriggered) {
            triggeredCauses[expressionsTokenValue] = evaluatedCauseInfo;
            finalExpressionToBeEvaluated.push(true);
          } else {
            finalExpressionToBeEvaluated.push(false);
          }
        } else {
          finalExpressionToBeEvaluated.push(expressionsTokenValue);
        }
      }
    }

    const isExpressionTriggered = this.processConditions(
      finalExpressionToBeEvaluated
    );

    return {
      isExpressionTriggered: isExpressionTriggered,
      triggeredCauses: triggeredCauses,
    };
  }

  evaluateRuleBlockExpression(ruleBlockExpression, outcome) {
    let triggeredRuleBlocks = [];
    let finalExpressionToBeEvaluated = [];

    const expressionsTokenArray = new Tokenizer().tokenize(ruleBlockExpression);

    for (let i in expressionsTokenArray) {
      const expressionsToken = expressionsTokenArray[i];
      const expressionsTokenType = expressionsToken.type;
      const expressionsTokenValue = expressionsToken.value;

      if (
        expressionsToken &&
        expressionsTokenType !== "EOL" &&
        expressionsTokenType !== "EOF"
      ) {
        if (expressionsTokenType === "STR_NUM") {
          const isRuleBlockTriggered = this.executedRuleBlockHolderCopy.some(
            (e) => e.ruleBlockId == expressionsTokenValue
          );
          if (isRuleBlockTriggered) {
            triggeredRuleBlocks.push(expressionsTokenValue);
          }
          finalExpressionToBeEvaluated.push(isRuleBlockTriggered);
        } else {
          finalExpressionToBeEvaluated.push(expressionsTokenValue);
        }
      }
    }

    const isExpressionTriggered = this.processConditions(
      finalExpressionToBeEvaluated
    );

    return {
      isExpressionTriggered: isExpressionTriggered,
      triggeredRuleBlocks: triggeredRuleBlocks,
    };
  }

  processConditions(conditionalStr) {
    function calculate(a) {
      while (a.length > 2) {
        a.splice(0, 3, op[a[1]](a[0], a[2]));
      }
      return a[0];
    }

    let op = {
        "&&": function (a, b) {
          return a && b;
        },
        "||": function (a, b) {
          return a || b;
        },
      },
      array = [[]],
      level = 0;

    conditionalStr.forEach(function (a) {
      if (a === "(") {
        ++level;
        array[level] = [];
        return;
      }
      if (a === ")") {
        --level;
        array[level].push(calculate(array[level + 1]));
        return;
      }
      array[level].push(a);
    });
    return calculate(array[0]);
  }
}

class RuleExecutionSingleton {
  constructor() {
    if (!RuleExecutionSingleton.instance) {
      this.vesselInstances = {};
    }
  }

  static getInstance() {
    if (!RuleExecutionSingleton.instance) {
      RuleExecutionSingleton.instance = new RuleExecutionSingleton();
    }
    return RuleExecutionSingleton.instance;
  }

  getVesselInstances() {
    return this.vesselInstances;
  }

  getVesselInstanceByVesselId(vesselId) {
    if (this.vesselInstances.hasOwnProperty(vesselId)) {
      return this.vesselInstances[vesselId];
    }
    return new ruleExecutionSingletonController();
  }

  createInstance(vesselId) {
    if (!this.vesselInstances.hasOwnProperty(vesselId)) {
      this.vesselInstances[vesselId] = new ruleExecutionSingletonController();
    }
  }

  scheduleAllRulesForAllVesselInstances() {
    for (let vesselId in this.vesselInstances) {
      if (this.vesselInstances.hasOwnProperty(vesselId)) {
        const vesselInst = this.vesselInstances[vesselId];
        if (vesselInst) {
          vesselInst.scheduleRuleBlocksForExecution();
        }
      }
    }
  }

  reScheduleRuleForAllVesselInstances(ruleBlockId, ruleBlockData) {
    for (let vesselId in this.vesselInstances) {
      if (this.vesselInstances.hasOwnProperty(vesselId)) {
        const vesselInst = this.vesselInstances[vesselId];
        if (vesselInst) {
          vesselInst.reScheduleRuleBlockForExecution(
            ruleBlockId,
            ruleBlockData
          );
        }
      }
    }
  }

  ScheduleRuleBlockForAVesselInstances(ruleBlockId, ruleBlockData) {
    for (let vesselId in this.vesselInstances) {
      if (this.vesselInstances.hasOwnProperty(vesselId)) {
        const vesselInst = this.vesselInstances[vesselId];
        if (vesselInst) {
          vesselInst.scheduleRuleBlockForExecution(ruleBlockId, ruleBlockData);
        }
      }
    }
  }

  removeScheduleRuleForAllVesselInstances(ruleBlockId) {
    for (let vesselId in this.vesselInstances) {
      if (this.vesselInstances.hasOwnProperty(vesselId)) {
        const vesselInst = this.vesselInstances[vesselId];
        if (vesselInst) {
          vesselInst.removeScheduledRuleBlock(ruleBlockId);
        }
      }
    }
  }
}

module.exports = RuleExecutionSingleton;
