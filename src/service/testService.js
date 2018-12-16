function testService($http, $httpParamSerializerJQLike) {
    return {
        /**
         * @param url URL to call
         * @param method HTTP method
         * @param authLevel Apex authentication level
         * @param [options.requestBody] Request body for http method !== GET
         * @param [options.requestBodyType] Selected request body type: none, application/json, application/x-www-form-urlencoded
         * @param [options.authHeader] Auth token containing L1/L2 signature. If authLevel === 1 or 2
         */
        sendTestRequest(url, method, authLevel, options) {
            let requestOptions = {
                method: method,
                url: url,
                headers: {},
                timeout: 10000
            };
            if (method !== 'GET' && options.requestBody) {
                if (options.requestBodyType === 'application/x-www-form-urlencoded') {
                    requestOptions.data = $httpParamSerializerJQLike(options.requestBody);
                    requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                } else {
                    requestOptions.data = options.requestBody; // By default json
                }
            }

            if (authLevel !== 0) {
                requestOptions.headers['Authorization'] = options.authHeader;
            }

            return $http(requestOptions);
        }
    };
}

testService.$inject = ['$http', '$httpParamSerializerJQLike'];

export default testService;