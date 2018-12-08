import KJUR from 'jsrsasign';
import randomBytes from 'randombytes';

import Signature from './Signature';
import paramsModal from './paramsModal';
import config from '../service/config';

function signatureValidatorController($scope, Notification, TestService, $sce, $uibModal) {
    const controller = this;

    init();

    $scope.config = config;

    controller.addSignature = addSignature;
    controller.addUrlencodedBody = addUrlencodedBody;
    controller.authPrefix = authPrefix;
    controller.canSendTestRequest = canSendTestRequest;
    controller.compareBasestring = compareBasestring;
    controller.changeAuthLevel = changeAuthLevel;
    controller.changeRequestBodyType = changeRequestBodyType;
    controller.getApiTestHeaders = getApiTestHeaders;
    controller.formSignatureUrls = formSignatureUrls;
    controller.onApiUrlChange = onApiUrlChange;
    controller.onHttpMethodChange = onHttpMethodChange;
    controller.onRequestBodyChange = onRequestBodyChange;
    controller.onSignatureParameterChange = onSignatureParameterChange;
    controller.removeSignature = removeSignature;
    controller.removeUrlencodedBody = removeUrlencodedBody;
    controller.sendTestRequest = sendTestRequest;
    controller.signatureMethod = signatureMethod;
    controller.signatureGenerated = signatureGenerated;
    controller.showOptions = showOptions;

    $scope.formSignature = formSignature; // Main signature generation function
    $scope.nonceGenChange = nonceGenChange;
    $scope.timestampGenChange = timestampGenChange;
    $scope.parseInputFile = parseInputFile;

    function init() {
        $scope.nonceDisabled = true;
        $scope.timestampDisabled = true;

        controller.timestamp = 'auto-generated';
        controller.nonce = 'auto-generated';

        controller.selectedLevel = 0;

        controller.sendingTestRequest = false;

        controller.apiUrl = 'https://api.example.com/abc/def';

        controller.httpMethods = config.main.httpMethods;
        controller.httpMethod = controller.httpMethods[0];
        controller.requestBodyType = config.constants.requestBodyTypes[0];
        controller.requestBody = {
            json: '',
            urlencoded: []
        };

        controller.gatewayZoneOptions = config.main.providerGateway;
        controller.gatewayZone = controller.gatewayZoneOptions[0];

        controller.authLevels = config.main.authLevels;

        controller.appVersion = config.main.appVersion;

        controller.signatures = [];
    }

    function formSignatureUrls() {
        for (let signature of controller.signatures) {
            signature.formSignatureUrl(controller.apiUrl);
        }
    }

    function generateBaseStrings() {
        for (let signature of controller.signatures) {
            signature.generateBaseString({
                httpMethod: controller.httpMethod,
                requestBodyType: controller.requestBodyType,
                requestBody: controller.requestBody
            });
        }
    }

    function onRequestBodyChange() {
        generateBaseStrings();
    }

    function onApiUrlChange() {
        formSignatureUrls(); // Generate signature URL for each signature
        generateBaseStrings(); // Generate base string for each signature
    }

    function onHttpMethodChange() {
        // If changing to GET, change request body type to none
        if (controller.httpMethod === config.main.httpMethods[0]) { // GET
            controller.requestBodyType = config.constants.requestBodyTypes[0]; // none
        }
        // Change base string for signatures
        generateBaseStrings();
        // Change auth headers
    }

    function onSignatureParameterChange(signature) {
        signature.generateBaseString({
            httpMethod: controller.httpMethod,
            requestBodyType: controller.requestBodyType,
            requestBody: controller.requestBody
        });
    }

    function addSignature() {
        controller.signatures.push(new Signature(controller.apiUrl, {
            allowCustomSignatureUrl: false,
            appId: '',
            appVersion: config.main.appVersion,
            authLevel: config.main.authLevels[0],
            gatewayZone: config.constants.gatewayZones.internet
        }));
    }

    function signatureMethod() {
        switch (controller.selectedLevel) {
        case 0:
            return '';
        case 1:
            return config.main.sigMethod.level1;
        case 2:
            return config.main.sigMethod.level2;
        }
    }

    function changeAuthLevel(level) {
        controller.selectedLevel = level;
        controller.apiTest = null;
        formSignature();
    }

    function changeRequestBodyType() {
        if (controller.requestBodyType === 'application/x-www-form-urlencoded' &&
            controller.requestBody.urlencoded.length === 0) {
            addUrlencodedBody('', '');
        }
    }

    function authPrefix() {
        if (controller.gatewayZone === config.constants.gatewayZones.internet) {
            switch (controller.selectedLevel) {
            case 1:
                return 'apex_l1_eg';
            case 2:
                return 'apex_l2_eg';
            default:
                return '';
            }
        } else if (controller.gatewayZone === config.constants.gatewayZones.intranet) {
            switch (controller.selectedLevel) {
            case 1:
                return 'apex_l1_ig';
            case 2:
                return 'apex_l2_ig';
            default:
                return '';
            }
        }
    }

    function addUrlencodedBody(key, value) {
        controller.requestBody.urlencoded.push({
            key: key,
            value: value
        });
    }

    function canSendTestRequest() {
        if (controller.selectedLevel === 0) {
            return controller.apiUrl && controller.apiUrl.length > 0;
        } else {
            return controller.basestring && controller.authHeader;
        }
    }

    /**
     * Automatically generates signature URL if the API is at api.gov.sg. Only runs when custom signature is unchecked.
     * @returns {string} Signature URL, with .e or .i optionally injected depending on the API domain and gateway zone.
     */
    // function formSignatureUrl() {
    //     if (controller.apiUrl === '' || !controller.apiUrl) return '';

    //     let apexDomain = controller.apiUrl.indexOf('.api.gov.sg');
    //     if (apexDomain !== -1) {
    //         let right = controller.apiUrl.substring(apexDomain);
    //         let left = controller.apiUrl.substring(0, apexDomain);
    //         let domainIdentifier = controller.gatewayZone === config.constants.gatewayZones.internet ? 'e' : 'i';
    //         return `${left}.${domainIdentifier}${right}`;
    //     } else { return controller.apiUrl; }
    // }

    /**
     * Removes signature at given position
     * @param {number} index Index for signature in controller.signatures.
     */
    function removeSignature(index) {
        controller.signatures.splice(index, 1);
    }

    function removeUrlencodedBody(index) {
        controller.requestBody.urlencoded.splice(index, 1);
        formSignature();
    }

    function formSignature() {
        if (controller.selectedLevel === 0) return;
        controller.showBasestringComparison = false;
        let valid = validateForm(controller.selectedLevel);
        if (valid) {
            let basestringOptions = {
                signatureUrl: controller.signatureUrl,
                authPrefix: authPrefix(),
                signatureMethod: signatureMethod(),
                appId: controller.appId,
                httpMethod: controller.httpMethod,
                appVersion: config.main.appVersion,
                // Optional parameters
                nonce: controller.nonce === 'auto-generated' ? randomBytes(32).toString('base64') : controller.nonce,
                timestamp: controller.timestamp === 'auto-generated' ? (new Date).getTime() : controller.timestamp,
                queryString: controller.queryString
            };
            // Process x-www-form-urlencoded body
            if (controller.httpMethod !== 'GET' &&
                controller.requestBodyType === 'application/x-www-form-urlencoded' &&
                controller.requestBody.urlencoded.length > 0) {
                basestringOptions.formData = controller.requestBody.urlencoded.reduce((finalObject, currentObject) => {
                    if (currentObject.key && currentObject.value) { // false if any of them are empty strings
                        finalObject[currentObject.key] = currentObject.value;
                    }
                    return finalObject;
                }, {});
            }

            controller.basestring = TestService.generateBasestring(basestringOptions);

            // 2. Signature generation
            let key;
            $scope.privateKeyError = false;
            if (controller.selectedLevel === 1) {
                key = controller.appSecret;
            } else if (controller.selectedLevel === 2) {
                try {
                    key = KJUR.KEYUTIL.getKey(controller.pem, controller.pkeySecret);
                } catch (exception) {
                    $scope.privateKeyError = true;
                    controller.basestring = '';
                    controller.authHeader = '';
                    Notification.error({
                        title: '',
                        message: config.main.errorMessages.pkeyInvalid,
                        delay: config.notificationShowTime
                    });
                }
            }
            let signature = TestService.signBasestring(controller.selectedLevel, controller.basestring, key);
            let authHeader = TestService.genAuthHeader(basestringOptions, signature);
            controller.authHeader = authHeader;
        } else if (signatureGenerated()) {
            controller.basestring = '';
            controller.authHeader = '';
        }
    }

    /**
     * Checks whether all necessary inputs are present
     * @param {number} level Apex auth level
     * @returns {boolean} true if form is valid, false otherwise
     */
    function validateForm(level) {
        switch (level) {
        case 0:
            return controller.apiUrl && controller.apiUrl.length > 0;
        case 1:
            return controller.apiUrl && controller.apiUrl.length > 0 &&
                    controller.appId && controller.appId.length > 0 &&
                    controller.appSecret && controller.appSecret.length > 0 &&
                    controller.nonce && controller.nonce.length > 0 &&
                    controller.timestamp && controller.timestamp.length > 0;
        case 2:
            return controller.apiUrl && controller.apiUrl.length > 0 &&
                    controller.appId && controller.appId.length > 0 &&
                    controller.pem && controller.pem.length > 0 &&
                    controller.nonce && controller.nonce.length > 0 &&
                    controller.timestamp && controller.timestamp.length > 0;
        }
    }

    function signatureGenerated() {
        return controller.basestring && controller.basestring.length > 0 && controller.authHeader && controller.authHeader.length > 0;
    }

    function compareBasestring(generated, input) {
        if (input == null) {
            input = '';
        }
        controller.showBasestringComparison = true;
        let before = false;
        let bsResults = '';
        for (let i = 0; i < generated.length; i++) {
            let gen = generated[i];
            let own = input[i];
            if (own == null) {
                let stringToAdd = generated.substring(i);
                bsResults += '<span class=\'missing-basestring-char\'>' + stringToAdd + '</span>';
                break;
            }
            if (gen !== own && !before) {
                own = '<span class=\'incorrect-basestring-char\'\'>' + own;
                before = true;
            } else if (gen === own && before) {
                own = '</span>' + own;
                before = false;
            }
            bsResults += own;
        }
        if (input.length > generated.length) {
            if (before) {
                bsResults += '</span>';
            }
            bsResults += '<span class = \'extra-basestring-char\'>' + input.substring(generated.length) + '</span>';
        }
        controller.basestringComparison = $sce.trustAsHtml(bsResults);
        if (generated === input) {
            Notification.success({
                message: 'Basestrings are the same',
                delay: config.notificationShowTime
            });
        } else {
            Notification.error({
                message: 'Basestrings are different',
                delay: config.notificationShowTime
            });
        }
    }

    function sendTestRequest() {
        controller.sendingTestRequest = true;
        controller.apiTest = null;
        let requestOptions = {};
        if (controller.httpMethod !== 'GET') {
            requestOptions.requestBodyType = controller.requestBodyType;
            if (controller.requestBodyType === 'application/x-www-form-urlencoded') {
                requestOptions.requestBody = controller.requestBody.urlencoded.reduce((finalObject, currentObject) => {
                    if (currentObject.key && currentObject.value) { // false if any of them are empty strings
                        finalObject[currentObject.key] = currentObject.value;
                    }
                    return finalObject;
                }, {});
            } else if (controller.requestBodyType === 'application/json') {
                requestOptions.requestBody = JSON.parse(controller.requestBody.json);
            }
        }
        if (controller.selectedLevel !== 0) {
            requestOptions.authHeader = controller.authHeader;
        }
        return TestService.sendTestRequest(controller.apiUrl, controller.httpMethod, controller.selectedLevel, requestOptions)
            .then(response => {
                controller.apiTest = response;
            })
            .catch(error => {
                controller.apiTest = error;
                if (error.xhrStatus === 'error' && error.status === -1) {
                    Notification.error({
                        message: config.main.errorMessages.httpRequestError,
                        delay: config.notificationShowTime
                    });
                }
            })
            .finally(() => {
                formSignature();
                controller.sendingTestRequest = false;
            });
    }

    function nonceGenChange() {
        $scope.nonceDisabled = !$scope.nonceDisabled;
        if ($scope.nonceDisabled) {
            controller.nonce = 'auto-generated';
        } else {
            controller.nonce = '';
        }
        formSignature();
    }

    function timestampGenChange() {
        $scope.timestampDisabled = !$scope.timestampDisabled;
        if ($scope.timestampDisabled) {
            controller.timestamp = 'auto-generated';
        } else {
            controller.timestamp = '';
        }
        formSignature();
    }

    function parseInputFile(fileText) {
        controller.pem = fileText;
        formSignature();
    }

    function showOptions() {
        $uibModal.open({
            animation: true,
            backdrop: false,
            template: paramsModal.template,
            controller: paramsModal.controller,
            controllerAs: '$ctrl',
            size: 'lg',
            resolve: {
                currentConfig: getCurrentConfig()
            }
        }).result
            .then(setCurrentConfig)
            .catch(function() { });
    }

    function getCurrentConfig() {
        let currentConfig = {
            gatewayZone: controller.gatewayZone,
            httpMethod: controller.httpMethod,
            apiUrl: controller.apiUrl,
            signatureUrl: controller.signatureUrl,
            allowCustomSignatureUrl: controller.allowCustomSignatureUrl,
            selectedLevel: controller.selectedLevel,
            appId: controller.appId,
            nonce: controller.nonce,
            timestamp: controller.timestamp
        };
        if (controller.httpMethod !== 'GET') {
            currentConfig.requestBodyType = controller.requestBodyType;
            currentConfig.requestBody = controller.requestBody;
            currentConfig.requestBody.urlencoded = currentConfig.requestBody.urlencoded.map(urlencodedBody => {
                return {
                    key: urlencodedBody.key,
                    value: urlencodedBody.value
                };
            });
        }
        if (controller.selectedLevel === 1) {
            currentConfig.appSecret = controller.appSecret;
        }
        return currentConfig;
    }

    function setCurrentConfig(config) {
        let newConfigParams = Object.keys(config);
        newConfigParams.forEach(function(param) {
            controller[param] = config[param];
        });
        formSignature();
    }

    function getApiTestHeaders(headers) {
        let headerString = '';
        let headerKeys = Object.keys(headers);
        for (let key of headerKeys) {
            headerString += `${key}: ${headers[key]}\n`;
        }
        return headerString;
    }
}

signatureValidatorController.$inject = ['$scope', 'config', 'Notification', 'TestService', '$sce', '$uibModal'];

export default signatureValidatorController;